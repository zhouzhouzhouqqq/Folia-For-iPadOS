import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSecureState } from '@/services/onlineMusic/mobileDirect/state';

// Snapshot ordering and Keychain failures must not silently report successful persistence.
const bridge = vi.hoisted(() => ({ loadState: vi.fn(), saveState: vi.fn() }));
vi.mock('@/platform/ios/musicProviders', () => ({ FoliaMusicProviders: bridge }));
beforeEach(() => { bridge.loadState.mockReset().mockResolvedValue({ value: '{}' }); bridge.saveState.mockReset().mockResolvedValue(undefined); });
describe('native account persistence', () => {
    it('loads the native record and serializes snapshots in order', async () => {
        bridge.loadState.mockResolvedValue({ value: '{"token":"native-session"}' });
        const secure = await loadSecureState('qq');
        expect(secure.state.token).toBe('native-session');
        secure.state.token = 'new'; secure.save();
        delete secure.state.token; secure.save();
        await secure.flush();
        expect(bridge.saveState.mock.calls.map(([call]) => JSON.parse(call.value))).toEqual([{ token: 'new' }, {}]);
    });
    it('retries a failed save and reports a persistent failure', async () => {
        bridge.saveState.mockRejectedValue(new Error('locked'));
        const secure = await loadSecureState('kugou');
        secure.state.cookie = { token: 'private' }; secure.save();
        await expect(secure.flush()).rejects.toThrow('无法保存安全登录会话');
        expect(bridge.saveState).toHaveBeenCalledTimes(2);
        bridge.saveState.mockResolvedValue(undefined);
        await secure.flush();
    });
    it('rejects malformed native records', async () => {
        bridge.loadState.mockResolvedValue({ value: '[]' });
        await expect(loadSecureState('qq')).rejects.toThrow('Invalid secure provider state');
    });
});
