import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProviderCacheKey, getProviderSessionKey, readProviderSessionValue, writeProviderSessionValue } from '../../../src/services/onlineMusic/providerStorage';

// Account storage must never migrate a credential to a newly configured native backend.
const state = vi.hoisted(() => ({ native: true, base: 'https://one.example/music', values: new Map<string, string>() }));
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => state.native }));
vi.mock('../../../src/services/nativeConnections', () => ({ getNativeApiBase: () => state.base }));
vi.mock('../../../src/services/db', () => ({ getFromCache: vi.fn(), saveToCache: vi.fn() }));
beforeEach(() => {
    state.native = true; state.base = 'https://one.example/music'; state.values.clear();
    vi.stubGlobal('localStorage', { getItem: (key: string) => state.values.get(key) ?? null, setItem: (key: string, value: string) => state.values.set(key, value) });
});
describe('native backend account isolation', () => {
    it.each(['netease', 'kugou', 'qq', 'bodian'] as const)('scopes %s tokens and cache by service URL', provider => {
        writeProviderSessionValue(provider, 'token', 'private-token');
        const cacheKey = getProviderCacheKey(provider, 'account');
        expect(readProviderSessionValue(provider, 'token')).toBe('private-token');
        state.base = 'https://two.example/music';
        expect(readProviderSessionValue(provider, 'token', ['old-token'])).toBeNull();
        expect(getProviderCacheKey(provider, 'account')).not.toBe(cacheKey);
        state.base = 'https://one.example/music';
        expect(readProviderSessionValue(provider, 'token')).toBe('private-token');
    });
    it.each(['netease', 'qq', 'kugou'] as const)('isolates %s device-direct credentials from an explicitly selected remote service', provider => {
        state.base = '';
        writeProviderSessionValue(provider, 'cookie', 'direct-session');
        const directCache = getProviderCacheKey(provider, 'account');
        state.base = 'https://one.example/music';
        expect(readProviderSessionValue(provider, 'cookie')).toBeNull();
        expect(getProviderCacheKey(provider, 'account')).not.toBe(directCache);
        writeProviderSessionValue(provider, 'cookie', 'remote-session');
        state.base = '';
        expect(readProviderSessionValue(provider, 'cookie')).toBe('direct-session');
    });
    it('does not import unscoped legacy credentials on native', () => {
        state.values.set('old-token', 'legacy-secret');
        expect(readProviderSessionValue('qq', 'token', ['old-token'])).toBeNull();
        state.native = false;
        expect(getProviderSessionKey('qq', 'token')).toBe('online_provider:qq:token');
        expect(readProviderSessionValue('qq', 'token', ['old-token'])).toBe('legacy-secret');
    });
});
