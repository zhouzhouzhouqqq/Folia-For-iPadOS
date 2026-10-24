import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Ensure iOS defaults to bundled adapters while Web and explicit remote configurations keep their routes.
const mock = vi.hoisted(() => ({ native: true, base: '', direct: vi.fn() }));
vi.mock('@/platform/capabilities', () => ({ isNativeIOS: () => mock.native }));
vi.mock('@/services/nativeConnections', () => ({ getNativeApiBase: () => mock.base, foliaApiUrl: (path: string) => path }));
vi.mock('@/services/onlineMusic/providerStorage', () => ({
    readProviderSessionValue: () => null, writeProviderSessionValue: vi.fn(), removeProviderSessionValue: vi.fn(),
}));
vi.mock('@/services/onlineMusic/mobileDirect/qq', () => ({ requestQqDirect: mock.direct }));
vi.mock('@/services/onlineMusic/mobileDirect/kugou', () => ({ requestKugouDirect: mock.direct }));
beforeEach(() => {
    vi.resetModules(); mock.native = true; mock.base = ''; mock.direct.mockReset();
    mock.direct.mockResolvedValue({ code: 200, data: { fixture: true } });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ code: 200, data: { fixture: true } })));
});
afterEach(() => vi.unstubAllGlobals());
describe.each(['qq', 'kugou'] as const)('%s native routing', provider => {
    const load = async () => provider === 'qq'
        ? { request: (await import('@/services/onlineMusic/qq/qqTransport')).requestQq, availability: (await import('@/services/onlineMusic/qq/qqTransport')).getQqTransportAvailability }
        : { request: (await import('@/services/onlineMusic/kugou/kugouTransport')).requestKugou, availability: (await import('@/services/onlineMusic/kugou/kugouTransport')).getKugouTransportAvailability };
    it('obtains a QR directly with no configured API', async () => {
        const transport = await load();
        expect(transport.availability()).toEqual({ configured: true });
        await transport.request('login_qr_key', {});
        expect(mock.direct).toHaveBeenCalledWith('login_qr_key', {}, ...(provider === 'qq' ? [undefined] : []));
        expect(fetch).not.toHaveBeenCalled();
    });
    it('keeps an explicitly configured HTTPS backend', async () => {
        mock.base = 'https://own.example.test';
        const transport = await load();
        await transport.request('login_qr_key', {});
        expect(mock.direct).not.toHaveBeenCalled();
        expect(String(vi.mocked(fetch).mock.calls[0][0])).toMatch(/^https:\/\/own.example.test\/login\/qr\/key/);
    });
    it('does not load native plugins on the Web', async () => {
        mock.native = false;
        const transport = await load();
        expect(transport.availability()).toEqual({ configured: false, reason: 'not-configured' });
        await expect(transport.request('login_qr_key', {})).rejects.toMatchObject({ code: 'unavailable' });
        expect(mock.direct).not.toHaveBeenCalled();
        expect(fetch).not.toHaveBeenCalled();
    });
});
