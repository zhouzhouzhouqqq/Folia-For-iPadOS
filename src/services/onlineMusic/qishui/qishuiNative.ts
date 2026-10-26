import type { QishuiApi, QishuiOperation, QishuiParams, QishuiSession } from 'qishui-music-api';
import { createQishuiApi, createQishuiDeviceId, isQishuiDeviceId } from './vendor/qishui.js';
import { FoliaMusicProviders } from '../../../platform/ios/musicProviders';
import { loadSecureState } from '../mobileDirect/state';
import { decodeBody } from '../mobileDirect/http';

// The pinned upstream protocol runs on-device; Keychain and cookie-free HTTPS replace Node IO only.
async function createRuntime() {
    const secure = await loadSecureState('qishui');
    if (!isQishuiDeviceId(secure.state.deviceId)) { secure.state.deviceId = createQishuiDeviceId(); secure.save(); await secure.flush(); }
    let revision = 0;
    const sessions = {
        deviceId: secure.state.deviceId as string,
        get revision() { return revision; },
        get: () => secure.state.session as QishuiSession | null ?? null,
        set(value: QishuiSession) { secure.state.session = structuredClone(value); revision++; secure.save(); },
        clear() { delete secure.state.session; revision++; secure.save(); },
    };
    const api: QishuiApi = createQishuiApi({ sessions, deviceId: sessions.deviceId,
        fetch: async (input: string | URL | Request, init: RequestInit = {}) => {
            init.signal?.throwIfAborted();
            const raw = await FoliaMusicProviders.request({ provider: 'qishui', url: String(input),
                method: init.method ?? 'GET', headers: Object.fromEntries(new Headers(init.headers)),
                ...(typeof init.body === 'string' ? { body: init.body } : {}) });
            init.signal?.throwIfAborted();
            if (raw.status >= 300 && raw.status < 400) throw new Error('Qishui redirects are blocked');
            return new Response(decodeBody(raw.bodyBase64).buffer as ArrayBuffer, { status: raw.status, headers: raw.headers });
        },
        log: (message: string) => console.info(message), warn: (message: string) => console.warn(message),
    });
    return { api, secure };
}
let runtime: ReturnType<typeof createRuntime> | undefined;
export async function requestQishuiNative(operation: QishuiOperation, params: QishuiParams) {
    runtime ??= createRuntime().catch(error => { runtime = undefined; throw error; });
    const { api, secure } = await runtime;
    const result = await api.request(operation, params);
    // Confirmed login is reported only after its credential snapshot has reached Keychain.
    await secure.flush();
    return result;
}
