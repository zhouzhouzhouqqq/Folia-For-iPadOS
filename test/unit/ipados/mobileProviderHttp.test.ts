import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createNativeHttp, parseBody } from '@/services/onlineMusic/mobileDirect/http';

// Exercise native protocol IO without contacting accounts or real provider endpoints.
const bridge = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/platform/ios/musicProviders', () => ({ FoliaMusicProviders: bridge }));
const response = (data: unknown = {}, extra = {}) => ({ status: 200, headers: {}, cookies: [], bodyBase64: btoa(JSON.stringify(data)), ...extra });
beforeEach(() => bridge.request.mockReset());
afterEach(() => vi.unstubAllGlobals());
describe('scoped provider HTTPS transport', () => {
    it('preserves signed query, JSON body, text and binary responses', async () => {
        bridge.request.mockResolvedValue(response({ status: 1 }));
        const http = createNativeHttp('kugou');
        expect((await http.request({ baseURL: 'https://login-user.kugou.com', url: '/v2/qrcode', method: 'POST', params: { signature: 'a+b/=' }, data: { value: '歌词' }, headers: { Host: 'login-user.kugou.com', 'Content-Length': '0' } })).data).toEqual({ status: 1 });
        const sent = bridge.request.mock.calls[0][0];
        expect(new URL(sent.url).searchParams.get('signature')).toBe('a+b/=');
        expect(JSON.parse(sent.body)).toEqual({ value: '歌词' });
        expect(sent.headers).not.toHaveProperty('Host');
        expect(sent.headers).not.toHaveProperty('Content-Length');
        const bytes = new Uint8Array([0, 255, 12]);
        expect(new Uint8Array(parseBody(bytes, 'arraybuffer'))).toEqual(bytes);
        expect(parseBody(new TextEncoder().encode('callback({})'), 'text')).toBe('callback({})');
    });
    it('scopes cookies by host/path, rejects public-suffix cookies and isolates each client', async () => {
        bridge.request.mockResolvedValueOnce(response({}, { cookies: [
            { name: 'good', value: 'ok', domain: '.qq.com', path: '/auth', secure: true },
            { name: 'host', value: 'ok', domain: 'u.y.qq.com', path: '/', secure: true },
            { name: 'bad', value: 'secret', domain: '.com', path: '/', secure: true },
            { name: 'other', value: 'secret', domain: '.tencentmusic.com', path: '/', secure: true },
        ] })).mockResolvedValue(response());
        const http = createNativeHttp('qq');
        await http.request({ url: 'https://u.y.qq.com/auth' });
        await http.request({ url: 'https://y.qq.com/auth/check' });
        expect(bridge.request.mock.calls[1][0].headers.Cookie).toBe('good=ok');
        await http.request({ url: 'https://u.y.qq.com/other' });
        expect(bridge.request.mock.calls[2][0].headers.Cookie).toBe('host=ok');
        await createNativeHttp('qq').request({ url: 'https://u.y.qq.com/auth' });
        expect(bridge.request.mock.calls[3][0].headers.Cookie).toBeUndefined();
    });
    it('removes explicit credentials and POST body on a cross-origin 302', async () => {
        bridge.request.mockResolvedValueOnce(response({}, { status: 302, headers: { location: 'https://api.tencentmusic.com/next' } })).mockResolvedValue(response());
        await createNativeHttp('qq').request({ url: 'https://u.y.qq.com/start', method: 'POST', data: { secret: true }, headers: { Cookie: 'session=private', Authorization: 'Bearer private' } });
        expect(bridge.request.mock.calls[1][0]).toMatchObject({ method: 'GET', url: 'https://api.tencentmusic.com/next' });
        expect(bridge.request.mock.calls[1][0].headers).not.toHaveProperty('Cookie');
        expect(bridge.request.mock.calls[1][0].headers).not.toHaveProperty('Authorization');
        expect(bridge.request.mock.calls[1][0].body).toBeUndefined();
    });
    it('honors cancellation before native IO and exposes HTTP errors without embedding URL credentials', async () => {
        const signal = AbortSignal.abort();
        await expect(createNativeHttp('qq').request({ url: 'https://u.y.qq.com/', signal })).rejects.toThrow();
        expect(bridge.request).not.toHaveBeenCalled();
        bridge.request.mockResolvedValue(response({}, { status: 429 }));
        await expect(createNativeHttp('qq').request({ url: 'https://u.y.qq.com/?token=private' })).rejects.toMatchObject({ message: 'Provider HTTP 429', httpStatus: 429 });
    });
});
