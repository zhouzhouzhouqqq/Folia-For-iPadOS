// @vitest-environment jsdom
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { usePlaybackAudioBridge } from '@/hooks/usePlaybackAudioBridge';
import { usePlaybackStore } from '@/stores/usePlaybackStore';
import { useAudioSettingsStore } from '@/stores/useAudioSettingsStore';
import { FoliaDevice } from '@/platform/ios/device';
import { buildPlaybackGraph } from '@/services/playbackGraph';
import { PlayerState } from '@/types';

// Reproduce source-driven iPad autoplay with a graph and native activation that never finish resuming.
vi.hoisted(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key), clear: () => values.clear(),
    } });
});
vi.mock('@/platform/capabilities', () => ({ isNativeIOS: () => true }));
vi.mock('@/platform/ios/device', () => ({ FoliaDevice: { configureAudio: vi.fn(() => new Promise<void>(() => {})) } }));
vi.mock('@/services/playedTrackCache', () => ({ cachePlayedTrackAssets: vi.fn() }));
vi.mock('@/services/playbackFade', () => ({ registerPlaybackFadeGraph: vi.fn() }));
vi.mock('@/services/playbackGraph', () => ({ buildPlaybackGraph: vi.fn(({ context, analyser, connectDecks }) => {
    connectDecks(context, analyser);
    return { gainNode: {}, fadeNode: {}, effectChain: { apply: vi.fn(), dispose: vi.fn() }, decksConnected: true };
}) }));
vi.mock('react-i18next', async importOriginal => ({
    ...await importOriginal<typeof import('react-i18next')>(),
    useTranslation: () => ({ t: (key: string) => key }),
}));
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
class Context extends EventTarget {
    static instances: Context[] = [];
    state = 'suspended';
    resume = vi.fn(() => new Promise<void>(() => {}));
    createAnalyser = () => ({});
    constructor() { super(); Context.instances.push(this); }
}
let root: Root | undefined;
beforeEach(() => {
    vi.clearAllMocks(); Context.instances = [];
    vi.stubGlobal('AudioContext', Context);
    const session = Object.assign(new EventTarget(), { type: 'auto', state: 'inactive' });
    Object.defineProperty(navigator, 'audioSession', { configurable: true, value: session });
    usePlaybackStore.setState({ audioSrc: 'first.mp3', currentSong: null, playerState: PlayerState.IDLE });
    useAudioSettingsStore.setState({ enableMediaCache: false });
});
afterEach(() => {
    act(() => root?.unmount()); root = undefined;
    delete (navigator as Navigator & { audioSession?: unknown }).audioSession;
    vi.unstubAllGlobals();
});
it('connects and resumes the graph before first-source play and reuses it for the next track without waiting', async () => {
    let source = 'first.mp3';
    const audio = { getAttribute: () => source, error: null, paused: true, ended: false,
        play: vi.fn(async () => {}), pause: vi.fn(), load: vi.fn() };
    const params: Parameters<typeof usePlaybackAudioBridge>[0] = {
        audioRef: { current: audio as unknown as HTMLAudioElement }, localSongs: [], isLyricsLoading: false,
        shouldAutoPlayRef: { current: true }, audioContextRef: { current: null }, analyserRef: { current: null },
        gainNodeRef: { current: null }, connectDecks: vi.fn(() => true), getActiveChain: () => null,
        suppressAutoplayRef: { current: false }, isAutoplayHeld: false, syncOutputGain: vi.fn(),
        getTargetPlaybackVolume: () => 1, getCoverUrl: () => null, updateCacheSize: vi.fn(),
    };
    audio.play.mockImplementation(async () => {
        // The actual hook must finish connecting the shared graph before media starts.
        expect(buildPlaybackGraph).toHaveBeenCalledTimes(1);
        expect(params.connectDecks).toHaveBeenCalledTimes(1);
        expect(Context.instances[0].resume).toHaveBeenCalledTimes(1);
    });
    function Probe() { usePlaybackAudioBridge(params); return null; }
    root = createRoot(document.createElement('div'));
    await act(async () => { root!.render(React.createElement(Probe)); });
    expect(audio.play).toHaveBeenCalledTimes(1);
    expect(FoliaDevice.configureAudio).toHaveBeenCalled();
    expect(usePlaybackStore.getState().playerState).toBe(PlayerState.PLAYING);
    source = 'second.mp3'; params.shouldAutoPlayRef.current = true;
    await act(async () => { usePlaybackStore.setState({ audioSrc: source }); });
    expect(audio.play).toHaveBeenCalledTimes(2);
    expect(Context.instances).toHaveLength(1);
    expect(buildPlaybackGraph).toHaveBeenCalledTimes(1);
    expect(Context.instances[0].resume).toHaveBeenCalledTimes(1);
});
