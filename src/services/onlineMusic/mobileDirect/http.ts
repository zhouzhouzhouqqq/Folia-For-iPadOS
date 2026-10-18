import { FoliaMusicProviders, type MobileMusicProvider, type ProviderCookie } from '../../../platform/ios/musicProviders';

// Axios-shaped native HTTPS adapter, with per-login domain/path-scoped cookies and explicit redirects.
export const decodeBody = (encoded: string): Uint8Array => Uint8Array.from(atob(encoded), c => c.charCodeAt(0));
export const parseBody = (bytes: Uint8Array, responseType?: string): any => {
    if (responseType === 'arraybuffer') return bytes.buffer;
    const text = new TextDecoder().decode(bytes);
    if (responseType === 'text') return text;
    try { return text ? JSON.parse(text) : ''; } catch { return text; }
};
export function createNativeHttp(provider: MobileMusicProvider) {
    const jar = new Map<string, ProviderCookie>();
    const roots = provider === 'qq' ? ['qq.com', 'tencentmusic.com', 'gtimg.cn', 'qpic.cn'] : ['kugou.com', 'kugou.net'];
    const matches = (cookie: ProviderCookie, url: URL) => {
        const domain = cookie.domain.replace(/^\./, '').toLowerCase();
        const path = cookie.path || '/';
        return (url.hostname === domain || (cookie.domain.startsWith('.') && url.hostname.endsWith(`.${domain}`)))
            && (url.pathname === path || url.pathname.startsWith(path.endsWith('/') ? path : `${path}/`))
            && (!cookie.expires || cookie.expires > Date.now());
    };
    const cookieHeader = (url?: URL) => [...jar.values()].filter(c => !url || matches(c, url)).map(c => `${c.name}=${c.value}`).join('; ');
    const request = async (initial: Record<string, any>): Promise<any> => {
        let config = { ...initial };
        for (let hop = 0; hop <= 3; hop++) {
            config.signal?.throwIfAborted();
            const url = new URL(config.url, config.baseURL);
            // Upstream playback hints can use HTTP URLs; request the same origin over TLS only.
            if (url.protocol === 'http:') url.protocol = 'https:';
            for (const [key, value] of Object.entries(config.params ?? {})) if (value != null) url.searchParams.set(key, String(value));
            const headers: Record<string, string> = {};
            // The upstream bootstrap specifies Host; URLSession derives transport headers from the validated URL.
            for (const [key, value] of Object.entries(config.headers ?? {})) {
                if (value != null && !['host', 'connection', 'content-length', 'transfer-encoding'].includes(key.toLowerCase())) headers[key] = String(value);
            }
            const cookies = cookieHeader(url);
            const explicit = Object.keys(headers).find(k => k.toLowerCase() === 'cookie');
            if (cookies) headers[explicit || 'Cookie'] = [cookies, explicit ? headers[explicit] : ''].filter(Boolean).join('; ');
            const method = String(config.method || 'GET').toUpperCase();
            let body: string | undefined;
            if (config.data !== undefined && method === 'POST') {
                body = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
                if (!Object.keys(headers).some(k => k.toLowerCase() === 'content-type')) headers['Content-Type'] = 'application/json';
            }
            const result = await FoliaMusicProviders.request({ provider, url: url.toString(), method, headers, body });
            config.signal?.throwIfAborted();
            for (const cookie of result.cookies ?? []) {
                const domain = cookie.domain.replace(/^\./, '').toLowerCase();
                if (!roots.some(root => domain === root || domain.endsWith(`.${root}`))
                    || (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`))) continue;
                const key = `${cookie.domain}:${cookie.path}:${cookie.name}`;
                if (cookie.expires && cookie.expires <= Date.now()) jar.delete(key); else jar.set(key, cookie);
            }
            const location = result.headers.location;
            if ([301, 302, 303, 307, 308].includes(result.status) && location) {
                if (hop === 3) throw new Error('Provider redirect limit exceeded');
                const next = new URL(location, url);
                const nextHeaders = { ...(config.headers ?? {}) };
                // Explicit credentials never cross origins. Scoped jar cookies are recomputed on each hop.
                if (next.origin !== url.origin) for (const key of Object.keys(nextHeaders)) if (['cookie', 'authorization'].includes(key.toLowerCase())) delete nextHeaders[key];
                const nextMethod = result.status === 303 || ([301, 302].includes(result.status) && method === 'POST') ? 'GET' : method;
                config = { ...config, url: next.toString(), params: undefined, method: nextMethod, headers: nextHeaders, data: nextMethod === 'GET' ? undefined : config.data };
                continue;
            }
            const data = parseBody(decodeBody(result.bodyBase64), config.responseType);
            const response = { data, cookies: result.cookies ?? [], status: result.status, statusText: '', headers: result.headers, config };
            if (result.status < 200 || result.status >= 400) throw Object.assign(new Error(`Provider HTTP ${result.status}`), { httpStatus: result.status, response });
            return response;
        }
        throw new Error('Provider redirect limit exceeded');
    };
    return { request, post: (url: string, data: any, config = {}) => request({ ...config, url, data, method: 'POST' }), getCookieHeader: () => cookieHeader() };
}
