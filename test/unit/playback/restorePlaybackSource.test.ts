import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const translateMock = vi.hoisted(() => vi.fn((key: string, _options?: Record<string, unknown>) => key));
const loadAudioSourceMock = vi.hoisted(() => vi.fn());
const canPlaySongMock = vi.hoisted(() => vi.fn(() => true));
const getLyricsMock = vi.hoisted(() => vi.fn(async () => ({ lyrics: null, isPureMusic: false })));
const setStatusMsgMock = vi.hoisted(() => vi.fn());
const setAudioSrcMock = vi.hoisted(() => vi.fn());
const setCurrentSongMock = vi.hoisted(() => vi.fn());
const playbackState = vi.hoisted(() => ({ currentSong: null as unknown }));
const toastState = vi.hoisted(() => ({ current: null as unknown }));

vi.mock('@/i18n/config', () => ({ default: { t: translateMock, on: () => {}, language: 'en' } }));
vi.mock('@/services/onlinePlayback', () => ({
    loadOnlineSongAudioSource: loadAudioSourceMock,
    applyOnlineAudioSourceMetadata: (song: unknown) => song,
}));
vi.mock('@/services/onlineMusic/omni', () => ({
    omni: { canPlaySong: canPlaySongMock, getLyrics: getLyricsMock, getProviderLabel: (id: string) => id },
}));
vi.mock('@/stores/usePlaybackStore', () => ({
    usePlaybackStore: { getState: () => playbackState },
    setAudioSrc: setAudioSrcMock,
    setCurrentSong: setCurrentSongMock,
    setCachedCoverUrl: vi.fn(),
    setActiveLocalLyricsSource: vi.fn(),
}));
// Resolves the updater form against a one-slot toast, so assertions see the message that ends up shown.
vi.mock('@/stores/useStatusMessageStore', () => ({
    setStatusMessage: (next: unknown) => {
        toastState.current = typeof next === 'function' ? (next as (prev: unknown) => unknown)(toastState.current) : next;
        setStatusMsgMock(toastState.current);
    },
    useStatusMessageStore: { getState: () => ({ message: toastState.current }) },
}));
vi.mock('@/stores/useOnlineProviderAccountStore', () => ({
    useOnlineProviderAccountStore: { getState: () => ({ accounts: {} }) },
}));
vi.mock('@/stores/useLyricSettingsStore', () => ({
    useLyricSettingsStore: { getState: () => ({ localLyricsPriority: [] }) },
}));
vi.mock('@/services/onlineMusic/resourceCache', () => ({
    getCachedSongCoverUrl: vi.fn(async () => null),
    getSongCacheWithLegacyMigration: vi.fn(async () => null),
}));
vi.mock('@/utils/onlineLyricsState', () => ({
    loadOnlineLyricsState: vi.fn(async () => null),
    resolveOnlineLyrics: (_state: unknown, lyrics: unknown) => lyrics ?? null,
}));
vi.mock('@/services/coverCache', () => ({
    getCachedCoverUrl: vi.fn(async () => null),
    loadCachedOrFetchCover: vi.fn(async () => null),
}));
vi.mock('@/services/db', () => ({ getLocalSongs: vi.fn(async () => []) }));
vi.mock('@/services/localMusicService', () => ({
    ensureLocalSongCoverAsset: vi.fn(),
    getAudioFromLocalSong: vi.fn(),
}));
vi.mock('@/services/localLibraryEntityRepository', () => ({ getLocalLibraryCatalogSnapshot: vi.fn() }));
vi.mock('@/services/navidromeService', () => ({ getNavidromeConfig: vi.fn(() => null), navidromeApi: {} }));
vi.mock('@/services/playbackAdapters', () => ({
    applyLocalLibraryEntityDisplay: vi.fn(),
    buildUnifiedLocalSong: vi.fn(),
}));
vi.mock('@/utils/appNavidromeLyrics', () => ({
    hydrateNavidromeLyricPayload: vi.fn(),
    resolvePreferredNavidromeLyrics: vi.fn(),
}));
vi.mock('@/utils/lyrics/localSongLyrics', () => ({ resolveLocalSongLyrics: vi.fn() }));

import { restorePlaybackSourceForSong } from '@/components/app/playback/restore/restorePlaybackSource';
import { askForSong, startRestore } from '@/components/app/playback/currentSong';
import { onlineFailureOf } from '@/services/onlineMusic/failure/onlineFailureCase';
import type { OnlineFailureCaseId, OnlineFailureDetail } from '@/types/onlineMusic';
import { installPlaybackFailedListener } from '@/services/hostExtensionHooks';
import { getLocalSongs } from '@/services/db';
import { ensureLocalSongCoverAsset, getAudioFromLocalSong } from '@/services/localMusicService';
import { getLocalLibraryCatalogSnapshot } from '@/services/localLibraryEntityRepository';
import type { LocalSong, SongResult } from '@/types';

// test/unit/playback/restorePlaybackSource.test.ts
// The song a restore is for is the one asked for when it starts (currentSong.ts): its caller makes it
// current and takes `startRestore()`. A song asked for meanwhile overtakes it.

// What the loader answers where the song cannot be had.
const unavailable = (caseId: OnlineFailureCaseId, detail: OnlineFailureDetail = {}) => ({
    kind: 'unavailable',
    failure: onlineFailureOf({ operation: 'audio', providerId: 'bodian' }, { detail: { case: caseId, ...detail } }),
});

const song: SongResult = {
    id: 'bodian-song',
    name: 'Song',
    artists: [],
    album: { id: 'album', name: 'Album' },
    durationMs: 1000,
    sourceRef: { kind: 'online', providerId: 'bodian', mediaId: 'bodian-song' },
};

const otherSong: SongResult = {
    ...song,
    id: 'bodian-other',
    sourceRef: { kind: 'online', providerId: 'bodian', mediaId: 'bodian-other' },
};

const restore = () => {
    const blobUrlRef = { current: null as string | null };
    const fetchedAtRef = { current: null as number | null };
    const setLyrics = vi.fn();
    const result = restorePlaybackSourceForSong(song, {
        audioQuality: 'high',
        blobUrlRef,
        currentOnlineAudioUrlFetchedAtRef: fetchedAtRef,
        setLyrics,
        queue: [song],
        stillWanted: startRestore(),
    });
    return { result, blobUrlRef, fetchedAtRef, setLyrics };
};

describe('restorePlaybackSourceForSong (online)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        loadAudioSourceMock.mockReset();
        canPlaySongMock.mockReturnValue(true);
        playbackState.currentSong = song;
        askForSong(song);
        toastState.current = null;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('names a region restriction and reports a failed restore', async () => {
        loadAudioSourceMock.mockResolvedValue(unavailable('region-restricted'));

        const { result, setLyrics } = restore();
        await expect(result).resolves.toBe('failed');
        expect(setStatusMsgMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text: 'status.songRegionRestricted', providerId: 'bodian' }));
        expect(setAudioSrcMock).not.toHaveBeenCalled();
        expect(setLyrics).not.toHaveBeenCalled();
    });

    it('asks the loader for a restore that only retries while this song is still current', async () => {
        loadAudioSourceMock.mockResolvedValue({ kind: 'ok', audioSrc: 'https://cdn.example/song.mp3' });

        const { result } = restore();
        await expect(result).resolves.toBe('restored');
        expect(loadAudioSourceMock).toHaveBeenCalledWith(song, 'high', null, {
            retry: { isCurrent: expect.any(Function) },
        });
        const { isCurrent } = loadAudioSourceMock.mock.calls[0][3].retry;
        expect(isCurrent()).toBe(true);
        askForSong(otherSong);
        expect(isCurrent()).toBe(false);
        expect(setAudioSrcMock).toHaveBeenCalledWith('https://cdn.example/song.mp3');
    });

    it('fails after one attempt and stays quiet when the caller has its own source to fall back on', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        loadAudioSourceMock.mockResolvedValue(unavailable('unreachable'));

        const result = restorePlaybackSourceForSong(song, {
            audioQuality: 'high',
            blobUrlRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: null },
            setLyrics: vi.fn(),
            queue: [song],
            stillWanted: startRestore(),
            hasFallbackSource: true,
        });
        await expect(result).resolves.toBe('failed');
        expect(loadAudioSourceMock).toHaveBeenCalledWith(song, 'high', null, {});
        expect(setStatusMsgMock).not.toHaveBeenCalled();
        expect(setAudioSrcMock).not.toHaveBeenCalled();
    });

    it('passes the wait through for a platform that asks to wait a known time', async () => {
        loadAudioSourceMock.mockResolvedValue(unavailable('retry-later', { retryAfterMs: 24_200 }));

        await expect(restore().result).resolves.toBe('failed');
        expect(translateMock).toHaveBeenCalledWith('failure.retryLaterIn', expect.objectContaining({ seconds: 25 }));
        expect(setStatusMsgMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text: 'failure.retryLaterIn' }));
    });

    it('drops a source that lands after the listener switched songs', async () => {
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
        loadAudioSourceMock.mockImplementation(async () => {
            askForSong(otherSong);
            return { kind: 'ok', audioSrc: 'blob:folia/restored', blobUrl: 'blob:folia/restored' };
        });

        const { result, blobUrlRef, fetchedAtRef, setLyrics } = restore();
        await expect(result).resolves.toBe('stale');
        expect(setAudioSrcMock).not.toHaveBeenCalled();
        expect(setStatusMsgMock).not.toHaveBeenCalled();
        expect(setLyrics).not.toHaveBeenCalled();
        expect(revokeSpy).toHaveBeenCalledWith('blob:folia/restored');
        expect(blobUrlRef.current).toBeNull();
        expect(fetchedAtRef.current).toBeNull();
    });

    it('does not report a failure for a song the listener already left', async () => {
        loadAudioSourceMock.mockImplementation(async () => {
            askForSong(otherSong);
            return unavailable('unreachable');
        });

        await expect(restore().result).resolves.toBe('stale');
        expect(setStatusMsgMock).not.toHaveBeenCalled();
    });

    it('does not write lyrics for a song the listener left during the lyric fetch', async () => {
        loadAudioSourceMock.mockResolvedValue({ kind: 'ok', audioSrc: 'https://cdn.example/song.mp3' });
        getLyricsMock.mockImplementationOnce(async () => {
            askForSong(otherSong);
            return { lyrics: null, isPureMusic: false };
        });

        const { result, setLyrics } = restore();
        await expect(result).resolves.toBe('stale');
        expect(setLyrics).not.toHaveBeenCalled();
        // The lyric fetch is still delegated to Omni (lyrics architecture test relies on it).
        expect(getLyricsMock).toHaveBeenCalledTimes(1);
    });

    it('keeps a restored source when only the lyric fetch fails', async () => {
        loadAudioSourceMock.mockResolvedValue({ kind: 'ok', audioSrc: 'https://cdn.example/song.mp3' });
        getLyricsMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);

        const { result, setLyrics } = restore();
        await expect(result).resolves.toBe('restored');
        expect(setAudioSrcMock).toHaveBeenCalledWith('https://cdn.example/song.mp3');
        expect(setStatusMsgMock).not.toHaveBeenCalled();
        expect(setLyrics).not.toHaveBeenCalled();
    });

    it('reports stale when the lyric fetch fails after the listener switched songs', async () => {
        loadAudioSourceMock.mockResolvedValue({ kind: 'ok', audioSrc: 'https://cdn.example/song.mp3' });
        getLyricsMock.mockImplementationOnce(async () => {
            askForSong(otherSong);
            throw new TypeError('Failed to fetch');
        });

        await expect(restore().result).resolves.toBe('stale');
        expect(setStatusMsgMock).not.toHaveBeenCalled();
    });

    it('does not replace a persistent toast with its plain failure line', async () => {
        const newerToast = { type: 'error', text: 'status.songNetworkFailed', persistent: true };
        toastState.current = newerToast;
        loadAudioSourceMock.mockResolvedValue(unavailable('unreachable'));

        await expect(restore().result).resolves.toBe('failed');
        expect(toastState.current).toBe(newerToast);
    });

    it('shows the evidence-free message when no provider can play the song', async () => {
        canPlaySongMock.mockReturnValue(false);

        await expect(restore().result).resolves.toBe('failed');
        expect(setStatusMsgMock).toHaveBeenCalledWith(expect.objectContaining({ type: 'error', text: 'status.playbackFailed', note: 'failure.noteUnknown' }));
        expect(loadAudioSourceMock).not.toHaveBeenCalled();
    });
});

// 恢复失败单独报告（phase 'restore'，从不自动跳过）；备用源静默接管、陈旧结果、恢复成功都不报。
describe('restorePlaybackSourceForSong reporting failures', () => {
    const listener = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        loadAudioSourceMock.mockReset();
        canPlaySongMock.mockReturnValue(true);
        playbackState.currentSong = song;
        askForSong(song);
        toastState.current = null;
        installPlaybackFailedListener(listener);
    });

    afterEach(() => {
        installPlaybackFailedListener(null);
        vi.restoreAllMocks();
    });

    it('reports a failed restore once, after the message is shown', async () => {
        loadAudioSourceMock.mockResolvedValue(unavailable('subscription-required'));
        // 监听器里只记下当时显示的消息、事后再断言：监听器抛出的断言错误会被 notifyPlaybackFailed 的 try/catch 吞掉。
        let shownWhenReported: unknown = null;
        listener.mockImplementationOnce(() => { shownWhenReported = toastState.current; });

        await expect(restore().result).resolves.toBe('failed');
        expect(shownWhenReported).toMatchObject({ type: 'error', text: 'status.songSubscriptionRequired' });
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith({ song, reason: 'subscription-required', phase: 'restore', willAutoSkip: false });
    });

    it('reports a song no provider can play as unknown', async () => {
        canPlaySongMock.mockReturnValue(false);
        await expect(restore().result).resolves.toBe('failed');
        expect(listener).toHaveBeenCalledWith({ song, reason: 'unknown', phase: 'restore', willAutoSkip: false });
    });

    it('stays quiet when the caller falls back to its own source', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        loadAudioSourceMock.mockResolvedValue(unavailable('unreachable'));

        await expect(restorePlaybackSourceForSong(song, {
            audioQuality: 'high',
            blobUrlRef: { current: null },
            currentOnlineAudioUrlFetchedAtRef: { current: null },
            setLyrics: vi.fn(),
            queue: [song],
            stillWanted: startRestore(),
            hasFallbackSource: true,
        })).resolves.toBe('failed');
        expect(listener).not.toHaveBeenCalled();
    });

    it('does not report a failure for a song the listener already left', async () => {
        loadAudioSourceMock.mockImplementation(async () => {
            askForSong(otherSong);
            return unavailable('unreachable');
        });
        await expect(restore().result).resolves.toBe('stale');
        expect(listener).not.toHaveBeenCalled();
    });

    // 恢复期间用户点了另一首、那首失败弹出常驻提示（store 的 currentSong 仍是恢复中的这首）：恢复失败被挡住、看不到，也就不报。
    it('does not report a failure a newer persistent toast keeps off screen', async () => {
        const newerToast = { type: 'error', text: 'status.songNetworkFailed', persistent: true };
        toastState.current = newerToast;
        loadAudioSourceMock.mockResolvedValue(unavailable('region-restricted'));

        await expect(restore().result).resolves.toBe('failed');
        expect(toastState.current).toBe(newerToast);
        expect(listener).not.toHaveBeenCalled();
    });

    it('does not report a restore that landed', async () => {
        loadAudioSourceMock.mockResolvedValue({ kind: 'ok', audioSrc: 'https://cdn.example/song.mp3' });
        await expect(restore().result).resolves.toBe('restored');
        expect(listener).not.toHaveBeenCalled();
    });
});

// 本地歌曲的恢复：和在线一样，等待期间用户换了歌就返回 stale、什么都不写也不报；失败消息同样不盖住更新请求的常驻提示。
describe('restorePlaybackSourceForSong (local)', () => {
    const listener = vi.fn();
    const localSong = { ...song, sourceRef: undefined, isLocal: true, localRef: { songId: 'local-1' } } as unknown as SongResult;
    const localRecord = { id: 'local-1', title: 'Song', fileName: 'song.mp3', duration: 1000 } as unknown as LocalSong;
    const restoreLocal = () => restorePlaybackSourceForSong(localSong, {
        audioQuality: 'high',
        blobUrlRef: { current: null },
        currentOnlineAudioUrlFetchedAtRef: { current: null },
        setLyrics: vi.fn(),
        queue: [localSong],
        stillWanted: startRestore(),
    });

    beforeEach(() => {
        vi.clearAllMocks();
        // 调用方（会话恢复、窗口交接）先把要恢复的这首写成当前歌曲，再调用恢复。
        playbackState.currentSong = localSong;
        askForSong(localSong);
        toastState.current = null;
        installPlaybackFailedListener(listener);
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    afterEach(() => {
        installPlaybackFailedListener(null);
        vi.restoreAllMocks();
    });

    it('reports a local song that is no longer in the library, after the message is shown', async () => {
        let shownWhenReported: unknown = null;
        listener.mockImplementationOnce(() => { shownWhenReported = toastState.current; });

        await expect(restoreLocal()).resolves.toBe('failed');
        expect(shownWhenReported).toEqual({ type: 'info', text: 'status.localSongNotInLibrary' });
        expect(listener).toHaveBeenCalledOnce();
        expect(listener).toHaveBeenCalledWith({ song: localSong, reason: null, phase: 'restore', willAutoSkip: false });
    });

    it('reports a local file that can no longer be opened', async () => {
        vi.mocked(getLocalSongs).mockResolvedValueOnce([localRecord]);
        vi.mocked(getAudioFromLocalSong).mockResolvedValueOnce(null);

        await expect(restoreLocal()).resolves.toBe('failed');
        expect(toastState.current).toEqual({ type: 'info', text: 'status.localFileReauthorize' });
        expect(listener).toHaveBeenCalledOnce();
    });

    it('neither shows nor reports a missing song the listener left while the library loaded', async () => {
        vi.mocked(getLocalSongs).mockImplementationOnce(async () => {
            askForSong(otherSong);
            return [];
        });

        await expect(restoreLocal()).resolves.toBe('stale');
        expect(setStatusMsgMock).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
    });

    it('neither shows nor reports an unreadable file the listener left while it was opening', async () => {
        vi.mocked(getLocalSongs).mockResolvedValueOnce([localRecord]);
        vi.mocked(getAudioFromLocalSong).mockImplementationOnce(async () => {
            askForSong(otherSong);
            return null;
        });

        await expect(restoreLocal()).resolves.toBe('stale');
        expect(setStatusMsgMock).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
    });

    it.each([
        ['the file opens', () => {
            vi.mocked(getAudioFromLocalSong).mockImplementationOnce(async () => {
                askForSong(otherSong);
                return 'blob:folia/local';
            });
        }],
        ['the cover and catalog load', () => {
            vi.mocked(getAudioFromLocalSong).mockResolvedValueOnce('blob:folia/local');
            vi.mocked(ensureLocalSongCoverAsset).mockResolvedValueOnce(localRecord);
            vi.mocked(getLocalLibraryCatalogSnapshot).mockImplementationOnce(async () => {
                askForSong(otherSong);
                return {} as never;
            });
        }],
    ] as const)('drops a local source when the listener moves on while %s', async (_case, arrange) => {
        const revokeSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
        vi.mocked(getLocalSongs).mockResolvedValueOnce([localRecord]);
        arrange();

        await expect(restoreLocal()).resolves.toBe('stale');
        expect(revokeSpy).toHaveBeenCalledWith('blob:folia/local');
        expect(setCurrentSongMock).not.toHaveBeenCalled();
        expect(setAudioSrcMock).not.toHaveBeenCalled();
        expect(listener).not.toHaveBeenCalled();
    });

    it('does not replace a persistent toast with its local failure line, nor report it', async () => {
        const newerToast = { type: 'error', text: 'status.songNetworkFailed', persistent: true };
        toastState.current = newerToast;

        await expect(restoreLocal()).resolves.toBe('failed');
        expect(toastState.current).toBe(newerToast);
        expect(listener).not.toHaveBeenCalled();
    });
});
