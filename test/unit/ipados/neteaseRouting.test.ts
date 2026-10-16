import { beforeEach, describe, expect, it, vi } from 'vitest';
import { neteaseApi } from '../../../src/services/netease';
import { requestNeteaseDirect } from '../../../src/services/onlineMusic/neteaseDirect/transport';

// Verify the real service chooses the device adapter without requiring remote configuration.
const mode = vi.hoisted(() => ({ native: true, base: '' }));
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => mode.native }));
vi.mock('../../../src/services/nativeConnections', () => ({ getNativeApiBase: () => mode.base }));
vi.mock('../../../src/services/onlineMusic/providerStorage', () => ({
    readProviderSessionValue: () => null, writeProviderSessionValue: vi.fn(), removeProviderSessionValue: vi.fn(),
}));
vi.mock('../../../src/services/onlineMusic/neteaseDirect/transport', () => ({ requestNeteaseDirect: vi.fn() }));
beforeEach(() => {
    vi.clearAllMocks(); mode.native = true; mode.base = '';
    vi.mocked(requestNeteaseDirect).mockResolvedValue({ code: 200, data: { unikey: 'device-key' } });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ code: 200, data: { unikey: 'remote-key' } }) })));
});
describe('NetEase device/remote service routing', () => {
    it('gets QR data from the built-in adapter with no HTTP API server', async () => {
        await expect(neteaseApi.getQrKey()).resolves.toMatchObject({ data: { unikey: 'device-key' } });
        expect(requestNeteaseDirect).toHaveBeenCalledWith('/login/qr/key');
        expect(fetch).not.toHaveBeenCalled();
    });
    it('uses a remote server only when explicitly selected', async () => {
        mode.base = 'https://personal.example/netease';
        await expect(neteaseApi.getQrKey()).resolves.toMatchObject({ data: { unikey: 'remote-key' } });
        expect(requestNeteaseDirect).not.toHaveBeenCalled();
        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('https://personal.example/netease/login/qr/key'), expect.any(Object));
    });
});
