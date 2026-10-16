import { isNativeIOS } from '../../platform/capabilities';
import { getNativeApiBase } from '../nativeConnections';
import { readProviderSessionValue, writeProviderSessionValue, removeProviderSessionValue } from './providerStorage';
import { OnlineProviderError } from '../../types/onlineMusic';
import type { BodianOperation, BodianParams, BodianResult } from 'bodian-music-api';
import { toBodianProviderError } from './bodianErrors';

// src/services/onlineMusic/bodianTransport.ts

export type { BodianOperation, BodianParams } from 'bodian-music-api';
export type BodianBridgeResult = BodianResult;

const nativeBase = () => getNativeApiBase('bodian', import.meta.env.VITE_BODIAN_API_BASE || '');

export const getBodianTransportAvailability = () => (
    isNativeIOS() && nativeBase() ? { configured: true } as const :
    typeof window !== 'undefined' && typeof window.electron?.bodianRequest === 'function'
        ? { configured: true } as const
        : { configured: false, reason: 'runtime-unavailable' } as const
);

export async function requestBodian<T = unknown>(operation: BodianOperation, params: BodianParams = {}): Promise<T> {
    if (!getBodianTransportAvailability().configured) {
        // 网页版没有桌面桥：重试不会变好，transient:false 让播放侧显示「未配置」而不是「稍后再试」。
        throw new OnlineProviderError('unavailable', 'Bodian requires the desktop app', 'bodian',
            undefined, undefined, undefined, { stage: 'runtime', transient: false });
    }
    let result: BodianBridgeResult;
    // Omni consumers request 150/1000-row batches; Bodian serves at most 100 and returns its own cursor.
    const boundedParams = Number.isSafeInteger(params.limit) && Number(params.limit) > 100
        ? { ...params, limit: 100 } : params;
    try {
        if (isNativeIOS()) {
            const session = readProviderSessionValue('bodian', 'gateway-session') || '';
            const response = await fetch(`${nativeBase()}/request`, {
                method: 'POST', credentials: 'omit', headers: { 'Content-Type': 'application/json', ...(session ? { 'X-Folia-Bodian-Session': session } : {}) },
                body: JSON.stringify({ operation, params: boundedParams }), signal: AbortSignal.timeout(30000),
            });
            if (!response.ok) {
                if (response.status === 401) removeProviderSessionValue('bodian', 'gateway-session');
                throw new Error('Bodian gateway unavailable');
            }
            const envelope = await response.json() as { session?: string; result?: BodianBridgeResult };
            if (!envelope.result || typeof envelope.result.ok !== 'boolean') throw new Error('Invalid Bodian gateway response');
            if (envelope.session && /^[a-f0-9]{64}$/.test(envelope.session)) writeProviderSessionValue('bodian', 'gateway-session', envelope.session);
            result = envelope.result;
        } else result = await window.electron!.bodianRequest(operation, boundedParams);
    }
    // IPC 被拒是本地桌面进程的故障，不是网络故障。
    catch (error) {
        throw new OnlineProviderError('unavailable', isNativeIOS() ? 'Bodian HTTPS gateway request failed' : 'Bodian desktop request failed', 'bodian',
            error, undefined, undefined, { stage: isNativeIOS() ? 'network' : 'ipc' });
    }
    // 包的 message 模板在 bodianErrors.ts 细分；auth-required 始终原样保留，useBodianLibrary 靠它清理会话。
    if (!result.ok) throw toBodianProviderError(result.error);
    return result.data as T;
}
