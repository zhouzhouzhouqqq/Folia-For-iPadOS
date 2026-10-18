import { createQrLoginService, createMqttListenOver, NODE_RUNTIME_CAPABILITIES, operations,
    setLegacyHttpTransport, createFetchLegacyTransport, guessYouLikeResult, recommendPlaylistsResult } from './vendor/qq.js';
import { createNativeHttp } from './http';
import { loadSecureState } from './state';
import { OnlineProviderError } from '../../../types/onlineMusic';
import type { QqOperation, QqParams } from '../qqTransport';
import { removeProviderSessionValue, writeProviderSessionValue } from '../providerStorage';

// The locked upstream auth/operation implementations run locally; only their IO is replaced.
export const connectQqSocket = (url: string, protocol: string, handlers: {
    message(data: Uint8Array): void; error(error: Error): void; close(): void;
}): Promise<{ send(data: Uint8Array): void; close(): void }> => new Promise((resolve, reject) => {
    const parsed = new URL(url);
    if (parsed.protocol !== 'wss:' || parsed.hostname !== 'mu.y.qq.com' || parsed.port) { reject(new Error('Blocked QQ QR event endpoint')); return; }
    const socket = new WebSocket(url, protocol);
    socket.binaryType = 'arraybuffer';
    let opened = false;
    const timeout = setTimeout(() => { socket.close(); reject(new Error('QQ QR event connection timed out')); }, 15000);
    socket.addEventListener('open', () => {
        clearTimeout(timeout);
        opened = true;
        resolve({ send: data => socket.send(new Uint8Array(data).buffer), close: () => socket.close() });
    }, { once: true });
    socket.addEventListener('message', event => {
        if (event.data instanceof ArrayBuffer) handlers.message(new Uint8Array(event.data));
        else if (typeof event.data === 'string') handlers.message(new TextEncoder().encode(event.data));
    });
    socket.addEventListener('error', () => {
        clearTimeout(timeout);
        const error = new Error('QQ QR event connection failed');
        if (opened) handlers.error(error); else reject(error);
    });
    socket.addEventListener('close', () => { clearTimeout(timeout); if (opened) handlers.close(); else reject(new Error('QQ QR event connection closed')); });
});

async function createRuntime() {
    const secure = await loadSecureState('qq');
    const { state } = secure;
    const http = createNativeHttp('qq');
    const defaults = createFetchLegacyTransport().defaults;
    setLegacyHttpTransport({ kind: 'native-ios', defaults, request: (url: string, method: string, config: any = {}, target = 'c') => {
        const resolved = /^https?:/.test(url) ? url : target === 'u' ? defaults.baseURL.u : `${defaults.baseURL[target === 'y' ? 'y' : 'c']}${url.startsWith('/') ? '' : '/'}${url}`;
        return http.request({ ...config, url: resolved, method, headers: { Referer: defaults.referer[target === 'y' ? 'y' : target === 'u' ? 'u' : 'c'], ...config.headers } });
    } });
    const service = createQrLoginService({
        http, createSessionHttp: () => createNativeHttp('qq'),
        capabilities: NODE_RUNTIME_CAPABILITIES,
        listen: createMqttListenOver(connectQqSocket),
        deviceRepository: { kind: 'ios-keychain', load: () => state.device || null,
            save: (device: any) => { state.device = structuredClone(device); secure.save(); },
            clear: () => { delete state.device; secure.save(); } },
        authSessionRepository: { kind: 'ios-keychain', load: () => state.sessions || [],
            save: (sessions: any[]) => { state.sessions = structuredClone(sessions); secure.save(); } },
    });
    return { service, secure, generation: 0 };
}
let runtime: ReturnType<typeof createRuntime> | undefined;
const getRuntime = () => {
    runtime ??= createRuntime().catch(error => { runtime = undefined; throw error; });
    return runtime;
};
export async function requestQqDirect(operation: QqOperation, params: QqParams, payload?: Record<string, unknown>): Promise<any> {
    const current = await getRuntime();
    const { service, secure } = current;
    if (operation === 'logout') current.generation++;
    const generation = current.generation;
    const token = secure.state.token || undefined;
    let result: any;
    try {
        if (operation === 'user_guess_you_like') result = await guessYouLikeResult(await service.resolveSession(token));
        else if (operation === 'recommend_playlists') result = await recommendPlaylistsResult(await service.resolveSession(token), Number(params.limit) || 30);
        else result = await operations[operation]({ runtime: 'node', method: payload ? 'POST' : 'GET', body: async () => payload,
            query: (key: string) => params[key] === undefined ? undefined : String(params[key]), queryRaw: (key: string) => params[key],
            params: {}, token, service: async () => service, sessionConfigured: true, unverifiedWritesEnabled: false });
        if (operation !== 'logout' && generation !== current.generation) throw new OnlineProviderError('auth-required', 'QQ 登录已取消或退出', 'qq');
        if (result.status >= 400) throw Object.assign(new Error(result.body?.message || result.body?.error || `QQ ${operation} failed`), result.body, { httpStatus: result.status });
        if (result.body?.code === 803 && typeof result.body.cookie === 'string') {
            const confirmed = /(?:^|;)\s*qqmusic_session=([^;]+)/.exec(result.body.cookie)?.[1];
            if (!confirmed) throw new Error('QQ 登录确认缺少会话');
            secure.state.token = confirmed;
            secure.save();
        }
        if (operation === 'logout' || (operation === 'login_status' && !result.body?.data?.profile)) { delete secure.state.token; secure.save(); }
        await secure.flush();
        // Renderer only keeps a non-credential hint; the opaque bearer and musickey stay in Keychain.
        removeProviderSessionValue('qq', 'cookie');
        if (secure.state.token) writeProviderSessionValue('qq', 'direct-account', '1');
        else removeProviderSessionValue('qq', 'direct-account');
        const body = { ...result.body };
        delete body.cookie;
        return body;
    } catch (error: any) {
        if (operation !== 'logout' && generation !== current.generation) {
            throw new OnlineProviderError('auth-required', 'QQ 登录已取消或退出', 'qq');
        }
        await secure.flush();
        if (error instanceof OnlineProviderError) throw error;
        const status = error.httpStatus ?? error.statusCode;
        if (status === 401 || operation === 'logout') { delete secure.state.token; secure.save(); await secure.flush(); removeProviderSessionValue('qq', 'direct-account'); }
        throw new OnlineProviderError(status === 401 ? 'auth-required' : status === 429 ? 'rate-limited' : 'network',
            `QQ ${operation}: ${error.message || '请求失败'}`, 'qq', undefined, status, Number.isSafeInteger(error.retryAfterMs) && error.retryAfterMs >= 0 ? error.retryAfterMs : undefined,
            { stage: operation.startsWith('login_qr') ? 'qr-login' : 'native-direct' });
    }
}
