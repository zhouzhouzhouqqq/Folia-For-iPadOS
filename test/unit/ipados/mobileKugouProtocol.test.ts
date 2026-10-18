import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';

// Compare the portable signer with the locked upstream, then exercise its real QR endpoint constructors.
const mock = vi.hoisted(() => ({ records: new Map<string, string>(), request: vi.fn() }));
vi.mock('@/platform/ios/musicProviders', () => ({ FoliaMusicProviders: {
    request: mock.request,
    loadState: async ({ provider }: any) => ({ value: mock.records.get(provider) || '{}' }),
    saveState: async ({ provider, value }: any) => { mock.records.set(provider, value); },
} }));
const upstream = createRequire(import.meta.url)('kugoumusicapi/util/helper');
vi.mock('@/services/onlineMusic/providerStorage', () => ({ removeProviderSessionValue: vi.fn() }));
const answer = (body: unknown) => ({ status: 200, headers: {}, cookies: [], bodyBase64: btoa(JSON.stringify(body)) });
beforeEach(() => { vi.resetModules(); mock.records.clear(); mock.request.mockReset(); });
afterEach(() => vi.restoreAllMocks());
describe('KuGou device-direct protocol', () => {
    it.each(['web', 'android', 'register'])('matches upstream %s signing without a Node request runtime', async type => {
        const { signKugouRequest } = await import('@/services/onlineMusic/mobileDirect/kugou');
        const result = signKugouRequest({ encryptType: type, params: { qrcode: 'fixture-key' } }, { KUGOU_API_MID: '12345' }, 1700000000000);
        const { signature, ...params } = result.params;
        const fn = type === 'web' ? upstream.signatureWebParams : type === 'register' ? upstream.signatureRegisterParams : upstream.signatureAndroidParams;
        expect(signature).toBe(fn(params, ''));
        expect(params).toMatchObject({ appid: 1005, clientver: 20489, clienttime: 1700000000, mid: '12345', qrcode: 'fixture-key' });
    });
    it('obtains a key, renders an actual QR image, and persists confirmed credentials only in native state', async () => {
        mock.request.mockResolvedValueOnce(answer({ status: 1, data: { qrcode: 'fixture-key' } }))
            .mockResolvedValueOnce(answer({ status: 1, data: { status: 1 } }))
            .mockResolvedValueOnce(answer({ status: 1, data: { status: 4, token: 'fixture-private-token', userid: 42 } }));
        const { requestKugouDirect } = await import('@/services/onlineMusic/mobileDirect/kugou');
        expect(await requestKugouDirect('login_qr_key', {})).toMatchObject({ data: { qrcode: 'fixture-key' } });
        const keyUrl = new URL(mock.request.mock.calls[0][0].url);
        expect(keyUrl.origin + keyUrl.pathname).toBe('https://login-user.kugou.com/v2/qrcode');
        expect(keyUrl.searchParams.get('signature')).toBeTruthy();
        expect((await requestKugouDirect('login_qr_create', { key: 'fixture-key' })).data.base64).toMatch(/^data:image\/png;base64,/);
        expect(await requestKugouDirect('login_qr_check', { key: 'fixture-key' })).toMatchObject({ data: { status: 1 } });
        const confirmed = await requestKugouDirect('login_qr_check', { key: 'fixture-key' });
        expect(confirmed.data).toEqual({ status: 4, userid: 42 });
        expect(JSON.parse(mock.records.get('kugou')!).cookie).toMatchObject({ token: 'fixture-private-token', userid: '42' });
        vi.resetModules();
        mock.request.mockResolvedValue(answer({ status: 1, data: { userid: 42, nickname: 'fixture' } }));
        const restarted = await import('@/services/onlineMusic/mobileDirect/kugou');
        await restarted.requestKugouDirect('user_detail', {});
        expect(new URL(mock.request.mock.lastCall![0].url).searchParams.get('token')).toBe('fixture-private-token');
        await restarted.requestKugouDirect('logout', {});
        expect(JSON.parse(mock.records.get('kugou')!).cookie).not.toHaveProperty('token');
        await expect(restarted.requestKugouDirect('user_detail', {})).rejects.toMatchObject({ code: 'auth-required' });
    });
    it('prevents a QR confirmation in flight from resurrecting a logged-out session', async () => {
        let finish!: (value: any) => void;
        mock.request.mockImplementation(() => new Promise(resolve => { finish = resolve; }));
        const { requestKugouDirect } = await import('@/services/onlineMusic/mobileDirect/kugou');
        const checking = requestKugouDirect('login_qr_check', { key: 'fixture-key' });
        await vi.waitFor(() => expect(mock.request).toHaveBeenCalled());
        await requestKugouDirect('logout', {});
        finish(answer({ status: 1, data: { status: 4, token: 'late-secret', userid: 42 } }));
        await expect(checking).rejects.toMatchObject({ code: 'auth-required' });
        expect(JSON.parse(mock.records.get('kugou')!).cookie).not.toHaveProperty('token');
    });
    it.each([152, 401, 403])('clears securely stored credentials on an explicit rejection (%s)', async status => {
        mock.records.set('kugou', JSON.stringify({ cookie: { KUGOU_API_GUID: 'fixture', KUGOU_API_MID: '12345', token: 'expired', userid: '42' } }));
        mock.request.mockResolvedValue(status === 152 ? answer({ status: 0, error_code: 152 }) : { ...answer({}), status });
        const { requestKugouDirect } = await import('@/services/onlineMusic/mobileDirect/kugou');
        await expect(requestKugouDirect('user_detail', {})).rejects.toMatchObject({ code: 'auth-required' });
        expect(JSON.parse(mock.records.get('kugou')!).cookie).not.toHaveProperty('token');
        expect(JSON.parse(mock.records.get('kugou')!).cookie).not.toHaveProperty('userid');
    });
});
