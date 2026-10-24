import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NeteaseLoginHttpError, neteaseApi } from '@/services/onlineMusic/netease/netease';
import { describeNeteaseFailure } from '@/services/onlineMusic/netease/neteaseFailure';
import { neteaseProvider } from '@/services/onlineMusic/netease/neteaseProvider';
import type { UnifiedSong } from '@/types';
import { OnlineProviderError } from '@/types/onlineMusic';
import { parseLyricsAsync } from '@/utils/lyrics/workerClient';

// test/unit/onlineMusic/neteaseProvider.test.ts

vi.mock('@/services/onlineMusic/netease/netease', async importOriginal => ({
    ...await importOriginal<typeof import('@/services/onlineMusic/netease/netease')>(),
    isSongMarkedUnavailable: (candidate: UnifiedSong) => candidate.privilege?.st === -200,
    getNeteaseRemoteApiBase: () => null,
    neteaseApi: {
        normalizeSongResult: vi.fn((raw: unknown) => raw),
        getSongUrl: vi.fn(),
        getLyric: vi.fn(),
        getUnavailableSongReplacement: vi.fn(),
        cloudSearch: vi.fn(),
        getAlbum: vi.fn(),
        getArtistDetail: vi.fn(),
        getArtistAlbums: vi.fn(),
        getPersonalizedPlaylists: vi.fn(),
        getLikedSongs: vi.fn(),
        getUserPlaylists: vi.fn(),
        checkQr: vi.fn(),
        getQrKey: vi.fn(),
        createQr: vi.fn(),
        scrobbleV1: vi.fn(),
    },
}));

vi.mock('@/utils/lyrics/workerClient', () => ({
    parseLyricsAsync: vi.fn(),
}));

const song: UnifiedSong = {
    id: 42,
    name: 'Song',
    artists: [],
    album: { id: 1, name: 'Album' },
    durationMs: 1000,
    sourceRef: { kind: 'online', providerId: 'netease', mediaId: '42' },
};

describe('neteaseProvider', () => {
    beforeEach(() => vi.clearAllMocks());

    it('maps semantic high quality to the NetEase exhigh value', async () => {
        vi.mocked(neteaseApi.getSongUrl).mockResolvedValue({ data: [{ url: 'http://music.test/song.mp3' }] } as any);
        await expect(neteaseProvider.playback!.getAudioSource(song, 'high')).resolves.toMatchObject({
            url: 'https://music.test/song.mp3',
            quality: 'high',
        });
        expect(neteaseApi.getSongUrl).toHaveBeenCalledWith(42, 'exhigh');
    });

    it('maps NetEase track gain from the URL response and keeps negative dB values', async () => {
        vi.mocked(neteaseApi.getSongUrl).mockResolvedValue({
            data: [{ url: 'https://music.test/song.flac', gain: -7.25 }],
        } as any);

        await expect(neteaseProvider.playback!.getAudioSource(song, 'lossless')).resolves.toMatchObject({
            replayGain: { trackGain: -7.25 },
        });
    });

    it('does not create ReplayGain metadata when NetEase omits gain', async () => {
        vi.mocked(neteaseApi.getSongUrl).mockResolvedValue({
            data: [{ url: 'https://music.test/song.mp3' }],
        } as any);

        const source = await neteaseProvider.playback!.getAudioSource(song, 'high');

        expect(source?.replayGain).toBeUndefined();
    });

    it('exposes NetEase romanization alongside the parsed lyric result', async () => {
        vi.mocked(parseLyricsAsync).mockResolvedValue({
            lines: [{
                words: [],
                fullText: '君のことが好き',
                startTime: 1,
                endTime: 2,
                translation: '我喜欢你',
                romanization: 'Kimi no koto ga suki',
            }],
        });
        vi.mocked(neteaseApi.getLyric).mockResolvedValue({
            lrc: { lyric: '[00:01.00]君のことが好き' },
            tlyric: { lyric: '[00:01.00]我喜欢你' },
            romalrc: { lyric: '[00:01.00]Kimi no koto ga suki' },
        } as any);

        await expect(neteaseProvider.lyrics!.getLyrics(song)).resolves.toMatchObject({
            romanizationText: '[00:01.00]Kimi no koto ga suki',
            lyrics: {
                lines: [{
                    translation: '我喜欢你',
                    romanization: 'Kimi no koto ga suki',
                }],
            },
        });
    });

    it('normalizes search results and paging metadata', async () => {
        vi.mocked(neteaseApi.cloudSearch).mockResolvedValue({
            result: { songs: [{ ...song, sourceRef: undefined }], songCount: 2 },
        } as any);
        const page = await neteaseProvider.search!.searchSongs('song', 1, 0);
        expect(page.items[0].sourceRef).toEqual({ kind: 'online', providerId: 'netease', mediaId: '42' });
        expect(page).toMatchObject({ total: 2, hasMore: true, nextOffset: 1 });
    });

    it('normalizes album collection metadata into provider fields', async () => {
        vi.mocked(neteaseApi.getArtistAlbums).mockResolvedValue({
            hotAlbums: [{
                id: 7,
                name: 'Album',
                picUrl: 'https://example.test/album.jpg',
                artist: { id: 9, name: 'Artist' },
                alias: ['Alias'],
                publishTime: 1704067200000,
                company: 'Publisher',
            }],
            more: false,
        } as any);

        const page = await neteaseProvider.catalog!.getArtistAlbums!(9, 10, 0);
        expect(page.items[0]).toMatchObject({
            id: 7,
            coverUrl: 'https://example.test/album.jpg',
            artists: [{ id: 9, name: 'Artist' }],
            aliases: ['Alias'],
            publishedAt: 1704067200000,
            publisher: 'Publisher',
        });
    });

    it('normalizes artist and full album biographies into the unified description field', async () => {
        vi.mocked(neteaseApi.getArtistDetail).mockResolvedValue({
            data: {
                artist: {
                    id: 9,
                    name: 'Artist',
                    briefDesc: 'Artist biography',
                    musicSize: 12,
                    albumSize: 3,
                },
            },
        } as any);
        vi.mocked(neteaseApi.getAlbum).mockResolvedValue({
            album: {
                id: 7,
                name: 'Album',
                picUrl: 'https://example.test/album.jpg',
                briefDesc: 'Album biography',
                artist: { id: 9, name: 'Artist' },
                size: 10,
            },
            songs: [],
        } as any);

        await expect(neteaseProvider.catalog!.getArtistDetail!(9)).resolves.toMatchObject({
            description: 'Artist biography',
        });
        await expect(neteaseProvider.catalog!.getAlbumDetail!(7)).resolves.toMatchObject({
            description: 'Album biography',
            artists: [{ id: 9, name: 'Artist' }],
        });
    });

    it('maps personalized playlist copywriter into the unified description field', async () => {
        vi.mocked(neteaseApi.getPersonalizedPlaylists).mockResolvedValue({
            result: [{
                id: 7,
                name: 'Recommended Playlist',
                picUrl: 'https://example.test/playlist.jpg',
                copywriter: '猜你喜欢的歌单',
            }],
        } as any);

        const collections = await neteaseProvider.recommendations!.getRecommendedCollections!(10);
        expect(collections[0]).toMatchObject({
            name: 'Recommended Playlist',
            description: '猜你喜欢的歌单',
        });
    });

    // What NetEase's answer means is said in neteaseFailure.ts; the provider throws, and asks once: no
    // lower level on the client's side.
    it('throws what the song URL request threw where it never reached the API, or got no JSON back', async () => {
        const tagged = Object.assign(
            new Error('NetEase API request /song/url/v1 failed: fetch failed', { cause: new TypeError('fetch failed') }),
            { networkFailure: true },
        );
        vi.mocked(neteaseApi.getSongUrl).mockRejectedValue(tagged);
        const unreached = await neteaseProvider.playback!.getAudioSource(song, 'high').catch((thrown: unknown) => thrown);
        expect(unreached).toBe(tagged);
        expect(describeNeteaseFailure('audio', unreached)).toEqual({ case: 'unreachable' });

        const unread = Object.assign(new Error('NetEase API /song/url/v1 returned HTTP 503 without a JSON body: (empty)'), { httpStatus: 503 });
        vi.mocked(neteaseApi.getSongUrl).mockRejectedValue(unread);
        const error = await neteaseProvider.playback!.getAudioSource(song, 'high').catch((thrown: unknown) => thrown);
        expect(describeNeteaseFailure('audio', error)).toEqual({ case: 'unknown', httpStatus: 503 });
    });

    it.each([
        [{ code: 200, data: [{ url: null, code: -110, fee: 1 }] }, { case: 'subscription-required', code: '-110' }],
        [{ code: 200, data: [{ url: null, code: -110, fee: 4 }] }, { case: 'purchase-required', code: '-110' }],
        [{ code: 200, data: [{ url: null, code: -110, fee: 8 }] }, { case: 'entitlement-required', code: '-110' }],
        [{ code: 200, data: [{ url: null, code: 404 }] }, { case: 'no-audio', code: '404' }],
        [{ code: 200, data: [] }, { case: 'no-audio' }],
        [{ code: 301, msg: '需要登录' }, { code: '301', message: '需要登录' }],
    ])('throws for the song URL answer %j, which reads as %j', async (response, detail) => {
        vi.mocked(neteaseApi.getSongUrl).mockResolvedValue(response as any);
        const error = await neteaseProvider.playback!.getAudioSource(song, 'high').catch((thrown: unknown) => thrown);
        expect(error).toBeInstanceOf(OnlineProviderError);
        expect(describeNeteaseFailure('audio', error)).toEqual(detail);
        expect(neteaseApi.getSongUrl).toHaveBeenCalledTimes(1);
    });

    it('decides availability from the privilege itself, not from isSongMarkedUnavailable', () => {
        // L10 的 mock 只认 st === -200；新逻辑对 -300 给 unknown，对有可播档位的 -200 也给 unknown。
        expect(neteaseProvider.playback!.getAvailability!({ ...song, privilege: { st: -300 } })).toEqual({
            state: 'unknown',
            reason: 'restricted',
        });
        expect(neteaseProvider.playback!.getAvailability!({ ...song, privilege: { st: -200, pl: 320000 } })).toEqual({
            state: 'unknown',
            reason: 'restricted',
        });
        expect(neteaseProvider.playback!.getAvailability!({ ...song, privilege: { st: -200, cs: true } })).toEqual({
            state: 'unknown',
            reason: 'restricted',
        });
        expect(neteaseProvider.playback!.getAvailability!({
            ...song,
            privilege: { st: -200 },
            noCopyrightRcmd: { typeDesc: '其它版本可播' },
        })).toEqual({ state: 'unavailable', reason: 'taken-down', label: '其它版本可播' });
        expect(neteaseProvider.playback!.getAvailability!(song)).toEqual({ state: 'playable' });
    });

    // omni.getSongReplacement says what a failed lookup means (runRequest): the provider hands the error on.
    it('throws a failed replacement lookup as it was thrown', async () => {
        const unavailableSong = { ...song, privilege: { st: -200 } };
        const tagged = Object.assign(new Error('NetEase API request /song/copyright/rcmd failed: fetch failed'), { networkFailure: true });
        vi.mocked(neteaseApi.getUnavailableSongReplacement).mockRejectedValueOnce(tagged);
        await expect(neteaseProvider.playback!.getReplacement!(unavailableSong)).rejects.toBe(tagged);
    });

    it('owns unavailable status and replacement normalization inside the provider', async () => {
        const unavailableSong = { ...song, privilege: { st: -200 } };
        expect(neteaseProvider.playback!.getAvailability!(unavailableSong)).toMatchObject({
            state: 'unavailable',
        });

        vi.mocked(neteaseApi.getUnavailableSongReplacement).mockResolvedValue({
            replacementSong: { ...song, id: 43 },
            replacementSongId: 43,
            typeDesc: '版权替代版本',
        } as any);
        await expect(neteaseProvider.playback!.getReplacement!(unavailableSong)).resolves.toMatchObject({
            label: '版权替代版本',
            song: { id: 43, sourceRef: { providerId: 'netease', mediaId: '43' } },
        });
    });

    it.each([
        [801, 'waiting'],
        [802, 'scanned'],
        [803, 'confirmed'],
        [800, 'expired'],
    ])('maps QR code %s to %s', async (code, state) => {
        vi.mocked(neteaseApi.checkQr).mockResolvedValue({ code } as any);
        await expect(neteaseProvider.auth!.checkLogin!('key')).resolves.toMatchObject({ state });
    });

    // NetEase's own 502, which its docs say can follow a scan: the local backend hands it on with HTTP 200
    // (util/request.js lets 502 through as an answer), so it reaches checkLogin as an answer, not a throw.
    it('keeps NetEase\'s code and words on an unmapped QR response', async () => {
        vi.mocked(neteaseApi.checkQr).mockResolvedValue({ code: 502, message: 'NetEase said 502' } as any);
        await expect(neteaseProvider.auth!.checkLogin!('key')).resolves.toEqual({
            state: 'error',
            message: 'code 502: NetEase said 502',
            failure: { code: '502', message: 'NetEase said 502' },
        });
    });

    // The local backend could not reach NetEase (a reset connection, a refused proxy): it answers HTTP 502,
    // and the code is still good at NetEase, so the window checks again.
    it.each(['read ECONNRESET', 'socket hang up', 'connect ECONNREFUSED 127.0.0.1:7890'])(
        'reads a check the local backend answered 502 (%s) as a passing error, with the backend\'s words',
        async msg => {
            vi.mocked(neteaseApi.checkQr).mockRejectedValue(new NeteaseLoginHttpError(502, { code: 502, msg }));
            await expect(neteaseProvider.auth!.checkLogin!('key')).resolves.toEqual({
                state: 'error',
                message: `HTTP 502: code 502: ${msg}`,
                failure: { httpStatus: 502, code: '502', message: msg },
                transient: true,
            });
        },
    );

    it('throws instead of handing out an empty QR key or image, carrying the backend response', async () => {
        vi.mocked(neteaseApi.getQrKey).mockResolvedValue({ code: 200, data: { unikey: 'k1' } } as any);
        await expect(neteaseProvider.auth!.startLogin!()).resolves.toBe('k1');
        const refused = { code: 400, msg: 'no key' };
        vi.mocked(neteaseApi.getQrKey).mockResolvedValue(refused as any);
        await expect(neteaseProvider.auth!.startLogin!()).rejects.toMatchObject({
            code: 'invalid-response',
            message: 'NetEase gave no QR key: code 400: no key',
            cause: refused,
        });

        vi.mocked(neteaseApi.createQr).mockResolvedValue({ code: 200, data: { qrimg: 'data:image/png;base64,AAAA' } } as any);
        await expect(neteaseProvider.auth!.createQr!('k1')).resolves.toBe('data:image/png;base64,AAAA');
        vi.mocked(neteaseApi.createQr).mockResolvedValue({ code: 400, msg: 'key is required' } as any);
        await expect(neteaseProvider.auth!.createQr!('k1')).rejects.toMatchObject({
            code: 'invalid-response',
            message: 'NetEase QR image request failed: code 400: key is required',
        });
    });
});

// 网易云 `/user/playlist` 的「我喜欢的音乐」是 `specialType: 5`（数字）；首页特殊集合靠 isLiked 认它。
describe('neteaseProvider user playlists', () => {
    beforeEach(() => vi.clearAllMocks());

    it('marks its own specialType 5 playlist as liked and leaves the rest alone', async () => {
        vi.mocked(neteaseApi.getUserPlaylists).mockResolvedValue({
            playlist: [
                { id: 11, name: 'amtx喜欢的音乐', specialType: 5, subscribed: false, creator: { userId: 7, nickname: 'amtx' } },
                { id: 12, name: '自建歌单', specialType: 0, subscribed: false, creator: { userId: 7, nickname: 'amtx' } },
                // 收藏来的别人的「喜欢的音乐」也是 5：不能当成自己的（移除会变成取消自己的喜欢）。
                { id: 13, name: '别人喜欢的音乐', specialType: 5, subscribed: true, creator: { userId: 8, nickname: 'other' } },
            ],
        } as any);

        const page = await neteaseProvider.library!.getUserPlaylists!(7, 30, 0);

        expect(neteaseApi.getUserPlaylists).toHaveBeenCalledWith(7, 30, 0);
        expect(page.items.map(item => [item.id, item.isLiked])).toEqual([[11, true], [12, undefined], [13, undefined]]);
        // 归一化结果进缓存后回灌（omni.normalizeCachedCollection）仍是「我喜欢的音乐」。
        expect(neteaseProvider.normalizeCollection!(page.items[0]).isLiked).toBe(true);
        expect(neteaseProvider.normalizeCollection!(page.items[1]).isLiked).toBeUndefined();
    });
});

describe('neteaseProvider liked song ids', () => {
    beforeEach(() => vi.clearAllMocks());

    it('returns the ids of a successful response', async () => {
        vi.mocked(neteaseApi.getLikedSongs).mockResolvedValue({ code: 200, ids: [1, 2, 3] } as any);
        await expect(neteaseProvider.library!.getLikedSongIds!(7)).resolves.toEqual({ ids: [1, 2, 3], whole: true });
        expect(neteaseApi.getLikedSongs).toHaveBeenCalledWith(7);
    });

    it('keeps an empty list when the account really likes nothing', async () => {
        vi.mocked(neteaseApi.getLikedSongs).mockResolvedValue({ code: 200, ids: [] } as any);
        await expect(neteaseProvider.library!.getLikedSongIds!(7)).resolves.toEqual({ ids: [], whole: true });
    });

    // An error body must not read as "likes nothing": the caller would clear every heart.
    it.each([
        ['a server error', { code: 502 }, 'unavailable'],
        ['a missing ids list', { code: 200 }, 'unavailable'],
        ['no status code', { msg: 'busy' }, 'unavailable'],
        ['a signed-out session', { code: 301 }, 'auth-required'],
    ])('rejects %s instead of answering with no likes', async (_label, response, errorCode) => {
        vi.mocked(neteaseApi.getLikedSongs).mockResolvedValue(response as any);
        await expect(neteaseProvider.library!.getLikedSongIds!(7)).rejects.toMatchObject({ code: errorCode });
    });

    it('counts the liked list by the list itself, in one request, and fails where the list cannot be read', async () => {
        vi.mocked(neteaseApi.getLikedSongs).mockResolvedValue({ code: 200, ids: [1, 2, 3] } as any);
        await expect(neteaseProvider.library!.getLikedSongCount!(7)).resolves.toBe(3);
        expect(neteaseApi.getLikedSongs).toHaveBeenCalledTimes(1);

        // An error body is not a list of no songs.
        vi.mocked(neteaseApi.getLikedSongs).mockResolvedValue({ code: 502 } as any);
        await expect(neteaseProvider.library!.getLikedSongCount!(7)).rejects.toMatchObject({ code: 'unavailable' });
    });
});

describe('neteaseProvider listening reports', () => {
    const reported: UnifiedSong = {
        ...song,
        name: '歌名',
        artists: [{ id: 7, name: '歌手 A' }, { id: 8, name: '歌手 B' }],
    };

    beforeEach(() => vi.clearAllMocks());

    // The id must name a track of the catalogue: a play of anything else is a play of no song.
    it.each([
        ['a catalogue track', { kind: 'online', providerId: 'netease', mediaId: '186016' }, true],
        ['a song stored without a source', undefined, true],
        ['a cloud-disk upload', { kind: 'online', providerId: 'netease', mediaId: '186016', variant: 'cloud' }, false],
        ['an id that is not a number', { kind: 'online', providerId: 'netease', mediaId: 'abc' }, false],
        ['the id zero', { kind: 'online', providerId: 'netease', mediaId: '0' }, false],
    ])('takes a report of %s: %s', (_label, sourceRef, expected) => {
        const canReport = neteaseProvider.playbackReports!.canReport!;
        expect(canReport({ ...reported, sourceRef } as UnifiedSong)).toBe(expected);
    });

    it('sends the played seconds and never a source id', async () => {
        vi.mocked(neteaseApi.scrobbleV1).mockResolvedValue({ code: 200 } as any);

        await neteaseProvider.playbackReports!.reportPlayback(reported, {
            playedSeconds: 45.6,
            totalSeconds: 240,
            quality: 'high',
        });

        const params = vi.mocked(neteaseApi.scrobbleV1).mock.calls[0][0];
        expect(params).toEqual({
            id: 42,
            time: 46,
            name: '歌名',
            artist: '歌手 A, 歌手 B',
            level: 'exhigh',
            bitrate: 320,
            total: 240,
        });
        expect(params).not.toHaveProperty('sourceid');
    });

    it.each([
        ['standard', 'standard', 128],
        ['high', 'exhigh', 320],
        ['lossless', 'lossless', 999],
        ['hires', 'hires', 1999],
    ] as const)('maps %s quality to level %s', async (quality, level, bitrate) => {
        vi.mocked(neteaseApi.scrobbleV1).mockResolvedValue({ code: 200 } as any);

        await neteaseProvider.playbackReports!.reportPlayback(reported, { playedSeconds: 45, quality });

        expect(vi.mocked(neteaseApi.scrobbleV1).mock.calls[0][0]).toMatchObject({ level, bitrate });
    });

    it('rejects a report the account was not signed in for', async () => {
        vi.mocked(neteaseApi.scrobbleV1).mockResolvedValue({ code: 301 } as any);

        await expect(neteaseProvider.playbackReports!.reportPlayback(reported, { playedSeconds: 45 }))
            .rejects.toMatchObject({ code: 'auth-required' });
    });

    it('rejects a response that carries no status code at all', async () => {
        // A gateway error page, or an API build with no /scrobble/v1 route: valid JSON, no `code`.
        vi.mocked(neteaseApi.scrobbleV1).mockResolvedValue({ message: 'Not Found' } as any);

        await expect(neteaseProvider.playbackReports!.reportPlayback(reported, { playedSeconds: 45 }))
            .rejects.toMatchObject({ code: 'unavailable' });
    });

    it('rejects any other non-success code', async () => {
        vi.mocked(neteaseApi.scrobbleV1).mockResolvedValue({ code: 500 } as any);

        await expect(neteaseProvider.playbackReports!.reportPlayback(reported, { playedSeconds: 45 }))
            .rejects.toMatchObject({ code: 'unavailable' });
    });
});
