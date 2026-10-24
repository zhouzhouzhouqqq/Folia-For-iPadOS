// @vitest-environment jsdom
import React, { act, StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useMediaSessionBridge, type UseMediaSessionBridgeOptions } from '@/hooks/useMediaSessionBridge';
import { prepareIOSNativeMediaSession } from '@/platform/ios/audioSession';
import { publishMediaSessionTrack } from '@/utils/mediaSessionSync';
import { prepareMediaSessionArtwork } from '@/services/mediaSessionArtwork';
import { PlayerState } from '@/types';

// Exercise the complete iPad bridge, including ownership, stale artwork and displayed AutoMix deck.
const native = vi.hoisted(() => ({ ios: true, publish: vi.fn(), artwork: vi.fn(async () => ({ data: 'dGh1bWI=' })), configure: vi.fn(async () => {}), controls: vi.fn(async () => ({})),
    listen: vi.fn(async (_name: string, _callback: unknown) => ({ remove: vi.fn() })) }));
vi.mock('@/platform/capabilities', () => ({ isNativeIOS: () => native.ios }));
vi.mock('@/platform/ios/device', () => ({ FoliaDevice: {
    publishNowPlaying: native.publish, prepareMediaArtwork: native.artwork, configureAudio: native.configure, setMusicControls: native.controls, addListener: native.listen,
} }));
vi.mock('@/platform/ios/files', () => ({ blobBase64: vi.fn(async () => 'cGljdHVyZQ==') }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let options: UseMediaSessionBridgeOptions;
let handlers: Map<MediaSessionAction, MediaSessionActionHandler>;
let media: MediaSession;
function Probe() { useMediaSessionBridge(options); return null; }
async function render(strict = false) {
    root ??= createRoot(document.createElement('div'));
    await act(async () => root!.render(strict ? React.createElement(StrictMode, null, React.createElement(Probe)) : React.createElement(Probe)));
}
beforeEach(() => {
    vi.clearAllMocks(); native.ios = true; handlers = new Map();
    media = { metadata: null, playbackState: 'none', setPositionState: vi.fn(),
        setActionHandler: vi.fn((action, callback) => { if (callback) handlers.set(action, callback); else handlers.delete(action); }),
    } as unknown as MediaSession;
    vi.stubGlobal('MediaMetadata', class { constructor(init: MediaMetadataInit) { Object.assign(this, init); } });
    Object.defineProperty(navigator, 'mediaSession', { configurable: true, value: media });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob(['picture'], { type: 'image/png' }) })));
    options = {
        audioRef: { current: Object.assign(new EventTarget(), { currentSrc: 'blob:http://localhost/a', readyState: 4,
            duration: 100, currentTime: 8, playbackRate: 1, paused: false, ended: false }) as HTMLAudioElement },
        currentSong: { id: 'a', name: 'Synthetic A', durationMs: 100_000, artists: [{ id: 'artist', name: 'Artist' }], album: { id: 'al', name: 'Album' } },
        audioSrc: 'blob:http://localhost/a', cachedCoverUrl: 'blob:http://localhost/cover', playerState: PlayerState.PLAYING,
        isNowPlayingStageActive: false, unknownArtistLabel: 'Unknown',
        mediaSessionPlayRef: { current: vi.fn(async () => {}) }, mediaSessionPauseRef: { current: vi.fn() },
        mediaSessionNextRef: { current: vi.fn() }, mediaSessionPrevRef: { current: vi.fn() },
        mediaSessionSeekRef: { current: vi.fn() }, isNowPlayingControlDisabledRef: { current: false },
    };
});
afterEach(() => {
    act(() => root?.unmount()); root = undefined;
    Reflect.deleteProperty(navigator, 'mediaSession'); vi.unstubAllGlobals(); vi.restoreAllMocks();
});
it('publishes title, artist, cover and timeline to the WebKit owner, without host metadata or duplicate remote commands', async () => {
    await render();
    expect(media.metadata).toMatchObject({ title: 'Synthetic A', artist: 'Artist', album: 'Album',
        artwork: [{ src: 'data:image/jpeg;base64,dGh1bWI=' }] });
    expect(media.playbackState).toBe('playing');
    expect(media.setPositionState).toHaveBeenLastCalledWith({ duration: 100, position: 8, playbackRate: 1 });
    expect(native.publish).not.toHaveBeenCalled();
    expect(native.listen.mock.calls.map(args => args[0])).not.toContain('remoteCommand');
    prepareIOSNativeMediaSession();
    expect(native.configure).toHaveBeenCalledWith({ webMediaSession: true });
});
it('publishes no original artwork while the native thumbnail is pending, and ignores an aborted result', async () => {
    let finish!: (value: { data: string }) => void;
    native.artwork.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
    await render();
    expect(media.metadata).toMatchObject({ title: 'Synthetic A', artwork: [] });
    const metadata = media.metadata;
    act(() => root!.unmount()); root = undefined;
    await act(async () => finish({ data: 'b2xk' }));
    expect(media.metadata).toBe(metadata);
});
it('delivers one next/previous/pause/play/seek command to the shared transport and observes current refs', async () => {
    await render(true);
    handlers.get('nexttrack')!({ action: 'nexttrack' });
    handlers.get('previoustrack')!({ action: 'previoustrack' });
    handlers.get('pause')!({ action: 'pause' });
    await handlers.get('play')!({ action: 'play' });
    handlers.get('seekto')!({ action: 'seekto', seekTime: 31 });
    expect(options.mediaSessionNextRef.current).toHaveBeenCalledTimes(1);
    expect(options.mediaSessionPrevRef.current).toHaveBeenCalledTimes(1);
    expect(options.mediaSessionPauseRef.current).toHaveBeenCalledTimes(1);
    expect(options.mediaSessionPlayRef.current).toHaveBeenCalledTimes(1);
    expect(options.mediaSessionSeekRef!.current).toHaveBeenCalledWith(31);
    options.mediaSessionNextRef.current = vi.fn();
    handlers.get('nexttrack')!({ action: 'nexttrack' });
    expect(options.mediaSessionNextRef.current).toHaveBeenCalledTimes(1);
    options.isNowPlayingControlDisabledRef.current = true;
    handlers.get('nexttrack')!({ action: 'nexttrack' });
    expect(options.mediaSessionNextRef.current).toHaveBeenCalledTimes(1);
    act(() => root!.unmount()); root = undefined;
    expect(handlers.size).toBe(0);
});
it('selects track navigation instead of interval skipping without removing seekto or claiming native playback', async () => {
    await render();
    expect(media.setActionHandler).toHaveBeenCalledWith('seekbackward', null);
    expect(media.setActionHandler).toHaveBeenCalledWith('seekforward', null);
    expect(handlers.has('seekbackward')).toBe(false); expect(handlers.has('seekforward')).toBe(false);
    expect(handlers.has('seekto')).toBe(true);
    expect(native.controls).toHaveBeenLastCalledWith({ next: true, previous: true });
    expect(native.configure).not.toHaveBeenCalled(); expect(native.publish).not.toHaveBeenCalled();
});
it('restores track commands after the player selects its system session and on return to foreground', async () => {
    await render();
    for (const event of ['loadedmetadata', 'playing', 'visibilitychange']) {
        handlers.delete('nexttrack'); handlers.delete('previoustrack');
        handlers.set('seekforward', vi.fn()); handlers.set('seekbackward', vi.fn());
        if (event === 'visibilitychange') document.dispatchEvent(new Event(event));
        else options.audioRef.current!.dispatchEvent(new Event(event));
        expect(handlers.has('seekforward')).toBe(false); expect(handlers.has('seekbackward')).toBe(false);
        expect(handlers.has('nexttrack')).toBe(true); expect(handlers.has('previoustrack')).toBe(true);
        expect(native.controls).toHaveBeenLastCalledWith({ next: true, previous: true });
    }
    handlers.get('nexttrack')!({ action: 'nexttrack' });
    expect(options.mediaSessionNextRef.current).toHaveBeenCalledTimes(1);
    expect(options.audioRef.current!.currentTime).toBe(8);
    act(() => root!.unmount()); root = undefined;
    expect(native.controls).toHaveBeenLastCalledWith({ next: false, previous: false });
});
it('does not advertise a next-track handler that WebKit rejected', async () => {
    const original = media.setActionHandler;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    media.setActionHandler = (action, callback) => {
        if (action === 'nexttrack' && callback) throw new Error('Unsupported action');
        original(action, callback);
    };
    await render();
    expect(native.controls).toHaveBeenLastCalledWith({ next: false, previous: true });
    expect(handlers.has('nexttrack')).toBe(false); expect(handlers.has('previoustrack')).toBe(true);
});
it('preserves the desktop command policy without modifying the native center or interval actions', async () => {
    native.ios = false;
    await render();
    expect(native.controls).not.toHaveBeenCalled();
    expect(media.setActionHandler).not.toHaveBeenCalledWith('seekbackward', null);
    expect(media.setActionHandler).not.toHaveBeenCalledWith('seekforward', null);
    expect(handlers.has('nexttrack')).toBe(true);
});
it('uses the displayed outgoing AutoMix deck for title and position while the active deck has advanced', async () => {
    const display = options.audioRef.current!;
    options.audioRef = { current: Object.assign(new EventTarget(), { currentSrc: 'blob:http://localhost/incoming', currentTime: 1 }) as HTMLAudioElement };
    options.getDisplayAudioElement = () => display;
    await render();
    expect(media.metadata?.title).toBe('Synthetic A');
    expect(media.setPositionState).toHaveBeenLastCalledWith({ duration: 100, position: 8, playbackRate: 1 });
    Object.assign(display, { currentTime: 42 });
    display.dispatchEvent(new Event('seeked'));
    expect(media.setPositionState).toHaveBeenLastCalledWith({ duration: 100, position: 42, playbackRate: 1 });
});
it('ignores old-source metadata events and clears the system surface when there is no local track', async () => {
    Object.assign(options.audioRef.current!, { currentSrc: 'blob:http://localhost/old' });
    await render();
    expect(media.metadata).toBeNull();
    Object.assign(options.audioRef.current!, { currentSrc: options.audioSrc });
    options.audioRef.current!.dispatchEvent(new Event('loadedmetadata'));
    expect(media.metadata?.title).toBe('Synthetic A');
    options = { ...options, currentSong: null };
    await render();
    expect(media.metadata).toBeNull(); expect(media.playbackState).toBe('none');
});
it('does not replace a new track cover when the previous image request finishes late', async () => {
    let finish!: (value: unknown) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve as typeof finish; }));
    await render();
    options = { ...options, currentSong: { ...options.currentSong!, id: 'b', name: 'Synthetic B' },
        audioSrc: 'blob:http://localhost/b', cachedCoverUrl: 'blob:http://localhost/cover-b' };
    Object.assign(options.audioRef.current!, { currentSrc: options.audioSrc });
    await render();
    const metadata = media.metadata;
    await act(async () => finish({ ok: true, blob: async () => new Blob(['old'], { type: 'image/jpeg' }) }));
    expect(media.metadata).toBe(metadata); expect(media.metadata?.title).toBe('Synthetic B');
});
it('retains metadata and actions even when WebKit rejects position state', async () => {
    vi.mocked(media.setPositionState).mockImplementation(() => { throw new Error('unsupported'); });
    await render();
    expect(media.metadata?.title).toBe('Synthetic A');
    expect(handlers.has('nexttrack')).toBe(true);
    options = { ...options, playerState: PlayerState.PAUSED };
    await render(); expect(media.playbackState).toBe('paused');
});
it('clears local metadata when entering an external now-playing stage', async () => {
    await render(); expect(media.metadata?.title).toBe('Synthetic A');
    options = { ...options, isNowPlayingStageActive: true };
    await render();
    expect(media.metadata).toBeNull(); expect(media.playbackState).toBe('none');
    expect(native.controls).toHaveBeenLastCalledWith({ next: false, previous: false });
});
it('throttles position events, rejects old-source updates and removes listeners on unmount', async () => {
    await render(); vi.mocked(media.setPositionState).mockClear();
    const clock = vi.spyOn(performance, 'now').mockReturnValue(2000);
    const audio = options.audioRef.current!;
    audio.dispatchEvent(new Event('timeupdate')); audio.dispatchEvent(new Event('timeupdate'));
    expect(media.setPositionState).toHaveBeenCalledTimes(1);
    Object.assign(audio, { currentSrc: 'blob:http://localhost/old' }); clock.mockReturnValue(4000);
    audio.dispatchEvent(new Event('seeked')); audio.dispatchEvent(new Event('timeupdate'));
    expect(media.setPositionState).toHaveBeenCalledTimes(1);
    Object.assign(audio, { currentSrc: options.audioSrc, playbackRate: 1.5 });
    audio.dispatchEvent(new Event('ratechange'));
    expect(media.setPositionState).toHaveBeenCalledTimes(2);
    act(() => root!.unmount()); root = undefined;
    audio.dispatchEvent(new Event('seeked')); expect(media.setPositionState).toHaveBeenCalledTimes(2);
});
it('rejects oversized/non-image cover bytes without removing title or transport', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, blob: async () => new Blob(['html'], { type: 'text/html' }) } as Response);
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    await render(); expect(media.metadata?.title).toBe('Synthetic A');
    await expect(prepareMediaSessionArtwork('cover', new AbortController().signal, true)).rejects.toThrow('bounded image');
    vi.mocked(fetch).mockResolvedValue({ ok: true, blob: async () => new Blob([new Uint8Array(4_000_001)], { type: 'image/png' }) } as Response);
    await expect(prepareMediaSessionArtwork('cover', new AbortController().signal, true)).rejects.toThrow('bounded image');
});
it('publishes metadata even if position state is absent', () => {
    expect(publishMediaSessionTrack({ metadata: null } as MediaSession,
        { currentTime: 1, duration: 10, playbackRate: 1 }, { title: 'A', artist: 'B', album: 'C', artworkUrl: '' })).toBe(true);
});
