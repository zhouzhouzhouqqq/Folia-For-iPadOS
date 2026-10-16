// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useNativeMediaSessionBridge } from '@/hooks/useNativeMediaSessionBridge';
import type { UseMediaSessionBridgeOptions } from '@/hooks/useMediaSessionBridge';
import { PlayerState } from '@/types';

// test/unit/ipados/nativeMediaSessionOwnership.test.ts — reproduce host/WebKit focus handover without a second player.
const native = vi.hoisted(() => ({
    callbacks: new Map<string, (event: Record<string, unknown>) => void>(),
    remove: vi.fn(), configureAudio: vi.fn(async () => {}), publishNowPlaying: vi.fn(async () => {}),
}));
vi.mock('@/platform/capabilities', () => ({ isNativeIOS: () => true }));
vi.mock('@/platform/ios/device', () => ({ FoliaDevice: {
    configureAudio: native.configureAudio, publishNowPlaying: native.publishNowPlaying,
    addListener: vi.fn(async (name: string, callback: (event: Record<string, unknown>) => void) => {
        native.callbacks.set(name, callback);
        return { remove: native.remove };
    }),
} }));
vi.mock('@/platform/ios/files', () => ({ blobBase64: vi.fn() }));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | undefined;
let options: UseMediaSessionBridgeOptions;
const emit = (name: string, data: Record<string, unknown>) => native.callbacks.get(name)!(data);
beforeEach(() => {
    vi.clearAllMocks(); native.callbacks.clear();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    options = {
        audioRef: { current: Object.assign(new EventTarget(), { paused: false }) as HTMLAudioElement },
        currentSong: null, audioSrc: null, cachedCoverUrl: null, playerState: PlayerState.PLAYING,
        isNowPlayingStageActive: false, unknownArtistLabel: 'Unknown',
        mediaSessionPlayRef: { current: vi.fn(async () => {}) }, mediaSessionPauseRef: { current: vi.fn() },
        mediaSessionNextRef: { current: vi.fn() }, mediaSessionPrevRef: { current: vi.fn() },
        mediaSessionSeekRef: { current: vi.fn() }, isNowPlayingControlDisabledRef: { current: false },
    };
});
afterEach(() => { act(() => root?.unmount()); root = undefined; vi.restoreAllMocks(); });
async function mount() {
    function Probe() { useNativeMediaSessionBridge(options); return null; }
    root = createRoot(document.createElement('div'));
    await act(async () => root!.render(React.createElement(Probe)));
}
it('does not turn host interruptions during WebKit playback into pause/resume feedback', async () => {
    await mount();
    // Captured on iPad: WebKit playing, repeated host began notifications, then no shouldResume.
    emit('audioInterruption', { began: true, shouldResume: false });
    emit('audioInterruption', { began: true, shouldResume: false });
    expect(options.mediaSessionPauseRef.current).not.toHaveBeenCalled();
    emit('audioInterruption', { began: false, shouldResume: true });
    expect(options.mediaSessionPlayRef.current).not.toHaveBeenCalled();
    expect(native.configureAudio).not.toHaveBeenCalled();
});
it('publishes a playing track without reacquiring host focus on playing or state updates', async () => {
    options.currentSong = { id: 'test-track', name: 'Test track', artists: [],
        album: { id: 'test-album', name: 'Test album' }, durationMs: 60_000 };
    options.audioSrc = 'https://media.example.test/fixture.mp3';
    Object.assign(options.audioRef.current!, { currentSrc: options.audioSrc, readyState: 4,
        duration: 60, currentTime: 2, playbackRate: 1, ended: false });
    await mount();
    options.audioRef.current!.dispatchEvent(new Event('playing'));
    expect(native.publishNowPlaying).toHaveBeenCalledWith(expect.objectContaining({ playing: true, position: 2 }));
    expect(native.configureAudio).not.toHaveBeenCalled();
    expect(options.mediaSessionPauseRef.current).not.toHaveBeenCalled();
});
it('keeps explicit remote controls and unplugged-headphone pause on the existing transport', async () => {
    await mount();
    emit('remoteCommand', { action: 'pause' });
    expect(options.mediaSessionPauseRef.current).toHaveBeenCalledTimes(1);
    emit('audioRouteChanged', { oldDeviceUnavailable: false });
    expect(options.mediaSessionPauseRef.current).toHaveBeenCalledTimes(1);
    emit('audioRouteChanged', { oldDeviceUnavailable: true });
    expect(options.mediaSessionPauseRef.current).toHaveBeenCalledTimes(2);
    await act(async () => emit('remoteCommand', { action: 'play' }));
    expect(options.mediaSessionPlayRef.current).toHaveBeenCalledTimes(1);
    expect(native.configureAudio).toHaveBeenCalledTimes(1);
    options.isNowPlayingControlDisabledRef.current = true;
    emit('remoteCommand', { action: 'pause' });
    expect(options.mediaSessionPauseRef.current).toHaveBeenCalledTimes(2);
    act(() => root!.unmount()); root = undefined;
    expect(native.remove).toHaveBeenCalledTimes(3);
});
