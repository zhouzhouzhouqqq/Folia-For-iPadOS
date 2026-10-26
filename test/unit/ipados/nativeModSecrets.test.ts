import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeModSecrets, onNativeModSecretChanged } from '../../../src/mods/ios/secrets';

// The native secret bridge must preserve isolation, declarations and Keychain error boundaries.
const state = vi.hoisted(() => ({ active: true, data: '{}', load: vi.fn(), save: vi.fn() }));
vi.mock('../../../src/mods/ios/host', () => ({ nativeModList: () => state.active ? [{ id: 'one', status: 'loaded' }, { id: 'two', status: 'loaded' }] : [] }));
vi.mock('../../../src/platform/ios/musicProviders', () => ({ FoliaMusicProviders: { loadState: (...args: unknown[]) => state.load(...args), saveState: (...args: unknown[]) => state.save(...args) } }));
beforeEach(() => {
    state.active = true; state.data = '{}';
    state.load.mockReset().mockImplementation(async () => ({ value: state.data }));
    state.save.mockReset().mockImplementation(async ({ value }: { value: string }) => { state.data = value; });
});
describe('native Folium secrets', () => {
    it('keeps values private to each mod and emits key-only notices', async () => {
        const changed = vi.fn(); const dispose = onNativeModSecretChanged(changed);
        try {
            expect(await nativeModSecrets('one', 'declare', ['api'])).toEqual({ ok: true });
            expect(await nativeModSecrets('one', 'set', 'api', 'synthetic-key')).toEqual({ ok: true });
            expect(await nativeModSecrets('one', 'get', 'api')).toEqual({ ok: true, result: 'synthetic-key' });
            expect(await nativeModSecrets('two', 'get', 'api')).toEqual({ ok: true, result: null });
            expect(await nativeModSecrets('one', 'state')).toEqual({ ok: true, result: { persistent: true, stored: ['api'] } });
            expect(changed).toHaveBeenCalledWith({ modId: 'one', key: 'api' });
            expect(await nativeModSecrets('one', 'set', 'api', null)).toEqual({ ok: true });
            expect(await nativeModSecrets('one', 'has', 'api')).toEqual({ ok: true, result: false });
        } finally { dispose(); }
    });
    it('rejects undeclared writes and oversized values', async () => {
        expect(await nativeModSecrets('two', 'set', 'unknown', 'value')).toEqual({ ok: false, error: 'secret-undeclared:unknown' });
        await nativeModSecrets('two', 'declare', ['bounded']);
        expect(await nativeModSecrets('two', 'set', 'bounded', '字'.repeat(3000))).toEqual({ ok: false, error: 'invalid-secret-value' });
        expect(state.save).not.toHaveBeenCalled();
    });
    it('does not discard existing declarations when an added declaration exceeds the quota', async () => {
        await nativeModSecrets('one', 'declare', ['api']);
        expect(await nativeModSecrets('one', 'declare', Array.from({ length: 64 }, (_, i) => `quota-${i}`))).toEqual({ ok: false, error: 'too-many-secret-keys' });
        expect(await nativeModSecrets('one', 'set', 'api', 'still-declared')).toEqual({ ok: true });
    });
    it('rejects an inactive mod including one disabled during a pending native read', async () => {
        state.active = false;
        expect(await nativeModSecrets('one', 'get', 'api')).toEqual({ ok: false, error: 'mod-not-active' });
        expect(state.load).not.toHaveBeenCalled();
        state.active = true;
        state.load.mockImplementationOnce(async () => { state.active = false; return { value: '{}' }; });
        expect(await nativeModSecrets('one', 'set', 'api', 'secret')).toEqual({ ok: false, error: 'mod-not-active' });
        expect(state.save).not.toHaveBeenCalled();
    });
    it('surfaces secure storage failure and never emits a successful change', async () => {
        const changed = vi.fn(); const dispose = onNativeModSecretChanged(changed);
        try {
            state.save.mockRejectedValueOnce(new Error('Keychain locked'));
            expect(await nativeModSecrets('one', 'set', 'api', 'synthetic')).toEqual({ ok: false, error: 'secure-storage-unavailable' });
            expect(changed).not.toHaveBeenCalled();
        } finally { dispose(); }
    });
});
