import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { neteaseProvider } from '@/services/onlineMusic/netease/neteaseProvider';
import { omni } from '@/services/onlineMusic/omni';
import { useOnlineProviderAccountStore } from '@/stores/useOnlineProviderAccountStore';

// test/unit/onlineMusic/neteaseAccountKept.test.ts
// What the NetEase adapter keeps of a sign-in on this machine, and when it goes: the cookie in
// the page's storage, and the four caches in which builds from before the account snapshot kept
// the account. The disk and the page's storage are maps of texts, so what is kept is seen letter
// for letter; NetEase itself is `fetch`, answered by the test.

const stored = vi.hoisted(() => new Map<string, string>());
vi.mock('@/services/db', async importOriginal => ({
    ...(await importOriginal<typeof import('@/services/db')>()),
    saveToCache: async (key: string, data: unknown) => { stored.set(key, JSON.stringify(data)); },
    getFromCache: async (key: string) => (stored.has(key) ? JSON.parse(stored.get(key)!) : null),
    removeFromCache: async (key: string) => { stored.delete(key); },
    removeCacheEntries: async (keys: string[]) => { keys.forEach(key => stored.delete(key)); },
}));

const NOW = 1760000000000;
const COOKIE_KEY = 'online_provider:netease:cookie';
const SNAPSHOT_KEY = 'online_provider_netease_user_home_snapshot';
const OLD_KEYS = {
    user: 'online_provider_netease_user_profile',
    playlists: 'online_provider_netease_user_playlists',
    liked: 'online_provider_netease_user_liked_songs',
    cloud: 'online_provider_netease_user_cloud_playlist',
};
// As NetEase gave them, which is how those builds kept them.
const OLD_USER = '{"userId":7,"nickname":"Listener","avatarUrl":"http://img.test/a.jpg","vipType":11}';
const OLD_PLAYLISTS = '[{"id":1,"name":"Mine","coverImgUrl":"http://img.test/1.jpg","trackCount":3,"creator":{"userId":7,"nickname":"Listener"}}]';
const OLD_LIKED = '[11,12]';
const OLD_CLOUD = '{"id":-100,"name":"Cloud","specialType":"cloud","coverImgUrl":"http://img.test/c.jpg","trackCount":2}';

const page = new Map<string, string>();
const fetchMock = vi.fn();
const account = () => useOnlineProviderAccountStore.getState().accounts.netease;
// A request the test answers when it chooses to.
const held = () => {
    let refuse!: (error: unknown) => void;
    const promise = new Promise<never>((_resolve, reject) => { refuse = reject; });
    return { promise, refuse };
};

beforeEach(() => {
    stored.clear();
    page.clear();
    fetchMock.mockReset();
    vi.stubEnv('VITE_NETEASE_API_BASE', 'http://netease.test');
    vi.stubGlobal('fetch', fetchMock);
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => page.get(key) ?? null,
        setItem: (key: string, value: string) => { page.set(key, value); },
        removeItem: (key: string) => { page.delete(key); },
    });
    vi.spyOn(Date, 'now').mockReturnValue(NOW);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    useOnlineProviderAccountStore.setState({ accounts: {}, activeProviderId: 'netease' });
});

describe('what NetEase keeps of a sign-in', () => {
    it('at app start with only the caches of an older build, shows that account at once and keeps it as this snapshot text', async () => {
        stored.set(OLD_KEYS.user, OLD_USER);
        stored.set(OLD_KEYS.playlists, OLD_PLAYLISTS);
        stored.set(OLD_KEYS.liked, OLD_LIKED);
        stored.set(OLD_KEYS.cloud, OLD_CLOUD);
        const status = held();
        fetchMock.mockReturnValue(status.promise);

        const read = omni.readAccount('netease', 'start');
        await vi.waitFor(() => expect(account()?.user).toBeTruthy());
        expect(account()).toMatchObject({
            status: 'authenticated', hydration: 'ready', freshness: 'refreshing', lastUpdatedAt: NOW,
            user: { id: 7, nickname: 'Listener', vipType: 11 },
            collections: [{ id: 1, type: 'playlist', name: 'Mine' }, { id: -100, type: 'cloud', name: 'Cloud' }],
            likedSongIds: [11, 12],
        });
        expect(stored.get(SNAPSHOT_KEY)).toBe(`{"version":1,"savedAt":${NOW},`
            + '"user":{"id":7,"nickname":"Listener","avatarUrl":"http://img.test/a.jpg","vipType":11},'
            + '"collections":[{"providerId":"netease","id":1,"name":"Mine","type":"playlist","coverUrl":"http://img.test/1.jpg","trackCount":3,"creator":{"id":7,"nickname":"Listener"}},'
            + '{"providerId":"netease","id":-100,"name":"Cloud","type":"cloud","coverUrl":"http://img.test/c.jpg","trackCount":2}],'
            + '"likedSongIds":[11,12]}');
        status.refuse(new Error('offline'));

        // NetEase could not be asked: the account stays, and so does everything kept.
        await expect(read).resolves.toBe('unknown');
        expect(account()).toMatchObject({ status: 'authenticated', user: { id: 7 }, freshness: 'error' });
        expect(stored.get(OLD_KEYS.user)).toBe(OLD_USER);
    });

    it('reads a cache from under the key it had before the caches were named by platform; nothing where no user was kept', async () => {
        await expect(neteaseProvider.auth!.oldKeptAccount!()).resolves.toBeNull();

        stored.set('user_profile', OLD_USER);
        stored.set('user_liked_songs', OLD_LIKED);
        await expect(neteaseProvider.auth!.oldKeptAccount!()).resolves.toEqual({
            user: { id: 7, nickname: 'Listener', avatarUrl: 'http://img.test/a.jpg', backgroundUrl: undefined, vipType: 11 },
            collections: [],
            likedSongIds: [11, 12],
        });
        expect(stored.get(OLD_KEYS.user)).toBe(OLD_USER);
    });

    it('signs out: NetEase is told with the cookie, which has left the page before the first wait; the old caches go whatever NetEase answers', async () => {
        page.set(COOKIE_KEY, 'MUSIC_U=abc');
        stored.set(OLD_KEYS.user, OLD_USER);
        stored.set(OLD_KEYS.cloud, OLD_CLOUD);
        // The same caches under the names they had before the caches were named by platform.
        stored.set('user_profile', OLD_USER);
        stored.set('user_playlists', OLD_PLAYLISTS);
        stored.set('user_liked_songs', OLD_LIKED);
        stored.set('user_cloud_playlist', OLD_CLOUD);
        stored.set(SNAPSHOT_KEY, '"left to the read of the account"');
        const request = held();
        fetchMock.mockReturnValue(request.promise);

        const signedOut = neteaseProvider.auth!.logout();
        expect(page.has(COOKIE_KEY)).toBe(false);
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
        // Only the path and the cookie: the address in front is this machine's (.env.local wins over the stub).
        expect(String(fetchMock.mock.calls[0][0])).toMatch(/\/logout\?cookie=MUSIC_U%3Dabc$/);
        request.refuse(new Error('offline'));

        await expect(signedOut).rejects.toThrow('offline');
        expect(page.size).toBe(0);
        expect([...stored.keys()]).toEqual([SNAPSHOT_KEY]);
    });

    it('after a sign-out, the caches from before the caches were named by platform bring no account back at the next start', async () => {
        stored.set('user_profile', OLD_USER);
        stored.set('user_playlists', OLD_PLAYLISTS);
        stored.set('user_liked_songs', OLD_LIKED);
        stored.set('user_cloud_playlist', OLD_CLOUD);
        // NetEase answers the sign-out, and then names nobody.
        fetchMock.mockImplementation(async () => Response.json({ code: 200, data: { code: 200, profile: null } }));

        await omni.signOutAccount('netease');
        await expect(omni.readAccount('netease', 'start')).resolves.toBe('nobody');

        expect(account()).toMatchObject({ status: 'anonymous', user: null, collections: [], likedSongIds: [] });
        expect(account().error).toBeUndefined();
        expect(stored.size).toBe(0);
    });

    it('a sign-in that ran out: the cookie and the old caches go, and NetEase is asked nothing', async () => {
        page.set(COOKIE_KEY, 'MUSIC_U=abc');
        page.set('netease_cookie', 'MUSIC_U=older');
        Object.values(OLD_KEYS).forEach(key => stored.set(key, '[]'));
        stored.set('user_profile', OLD_USER);

        await neteaseProvider.auth!.signInRanOut!();

        expect(page.size).toBe(0);
        expect(stored.size).toBe(0);
        expect(fetchMock).not.toHaveBeenCalled();
    });
});
