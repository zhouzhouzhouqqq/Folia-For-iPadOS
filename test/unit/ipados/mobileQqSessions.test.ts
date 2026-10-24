import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Host adapter coverage; upstream MQTT/QR wire protocol is additionally exercised by the anonymous probe.
const mock = vi.hoisted(() => ({ records: new Map<string, string>(), values: new Map<string, string>(), operation: vi.fn() }));
vi.mock('@/platform/ios/musicProviders', () => ({ FoliaMusicProviders: {
    loadState: async () => ({ value: mock.records.get('qq') || '{}' }),
    saveState: async ({ value }: any) => { mock.records.set('qq', value); },
} }));
vi.mock('@/services/onlineMusic/providerStorage', () => ({
    writeProviderSessionValue: (_: any, key: string, value: string) => mock.values.set(key, value),
    removeProviderSessionValue: (_: any, key: string) => mock.values.delete(key),
}));
vi.mock('@/services/onlineMusic/mobileDirect/vendor/qq.js', () => ({
    createQrLoginService: () => ({}), createMqttListenOver: () => ({}), NODE_RUNTIME_CAPABILITIES: {},
    operations: new Proxy({}, { get: () => mock.operation }), setLegacyHttpTransport: () => {},
    createFetchLegacyTransport: () => ({ defaults: {} }), guessYouLikeResult: vi.fn(), recommendPlaylistsResult: vi.fn(),
}));
beforeEach(() => { vi.resetModules(); mock.records.clear(); mock.values.clear(); mock.operation.mockReset(); });
afterEach(() => vi.restoreAllMocks());
describe('QQ device-direct session boundary', () => {
    it('persists an opaque confirmed session, strips the renderer cookie and restores the token after restart', async () => {
        mock.operation.mockResolvedValue({ status: 200, body: { code: 803, cookie: 'qqmusic_session=fixture-secret; Path=/' } });
        const direct = await import('@/services/onlineMusic/mobileDirect/qq');
        expect(await direct.requestQqDirect('login_qr_check', { key: 'fixture' })).toEqual({ code: 803 });
        expect(JSON.parse(mock.records.get('qq')!).token).toBe('fixture-secret');
        expect([...mock.values.entries()]).toEqual([['direct-account', '1']]);
        vi.resetModules();
        mock.operation.mockResolvedValue({ status: 200, body: { data: { profile: { id: 42 } } } });
        const restarted = await import('@/services/onlineMusic/mobileDirect/qq');
        await restarted.requestQqDirect('login_status', {});
        expect(mock.operation.mock.lastCall![0].token).toBe('fixture-secret');
        mock.operation.mockResolvedValue({ status: 200, body: { code: 200 } });
        await restarted.requestQqDirect('logout', {});
        expect(JSON.parse(mock.records.get('qq')!)).not.toHaveProperty('token');
        expect(mock.values.size).toBe(0);
    });
    it('clears a rejected session and preserves explicit QR cooldown errors', async () => {
        mock.records.set('qq', '{"token":"expired-secret"}');
        mock.operation.mockResolvedValue({ status: 401, body: { message: 'Login required' } });
        const { requestQqDirect } = await import('@/services/onlineMusic/mobileDirect/qq');
        await expect(requestQqDirect('user_detail', {})).rejects.toMatchObject({ code: 'auth-required' });
        expect(JSON.parse(mock.records.get('qq')!)).not.toHaveProperty('token');
        mock.operation.mockResolvedValue({ status: 429, body: { message: 'cooldown', retryAfterMs: 15000 } });
        await expect(requestQqDirect('login_qr_key', {})).rejects.toMatchObject({ code: 'network', httpStatus: 429, retryAfterMs: 15000 });
    });
    it('does not restore credentials from a QR confirmation that completes after logout', async () => {
        let finish!: (value: any) => void;
        mock.operation.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
            .mockResolvedValue({ status: 200, body: { code: 200 } });
        const { requestQqDirect } = await import('@/services/onlineMusic/mobileDirect/qq');
        const checking = requestQqDirect('login_qr_check', { key: 'fixture' });
        await vi.waitFor(() => expect(mock.operation).toHaveBeenCalled());
        await requestQqDirect('logout', {});
        finish({ status: 200, body: { code: 803, cookie: 'qqmusic_session=late-secret' } });
        await expect(checking).rejects.toMatchObject({ code: 'auth-required' });
        expect(JSON.parse(mock.records.get('qq')!)).not.toHaveProperty('token');
        expect(mock.values.size).toBe(0);
    });
});
