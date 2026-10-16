import { hasWebMediaSession, isMediaSessionSourceReady } from '../utils/mediaSessionSync';
import { useEffect } from 'react';
import type { UseMediaSessionBridgeOptions } from './useMediaSessionBridge';
import { isNativeIOS } from '../platform/capabilities';
import { FoliaDevice } from '../platform/ios/device';
import { prepareIOSNativeMediaSession } from '../platform/ios/audioSession';
import { getPlaybackSongKey } from '../utils/appPlaybackGuards';
import { blobBase64 } from '../platform/ios/files';
import { getSongAlbumLabel, getSongArtistLabel, getSongCoverUrl } from '../services/onlineMusic/songMetadata';
import type { PluginListenerHandle } from '@capacitor/core';

// src/hooks/useNativeMediaSessionBridge.ts — OS controls operate the existing transport and displayed deck.
export function useNativeMediaSessionBridge(options: UseMediaSessionBridgeOptions) {
    const { audioRef, getDisplayAudioElement, currentSong, audioSrc, playerState, cachedCoverUrl,
        mediaSessionSeekRef, mediaSessionPlayRef, mediaSessionPauseRef, mediaSessionNextRef, mediaSessionPrevRef,
        isNowPlayingControlDisabledRef, isNowPlayingStageActive, unknownArtistLabel } = options;
    useEffect(() => {
        if (!isNativeIOS()) return;
        let disposed = false;
        const handles: PluginListenerHandle[] = [];
        const listen = async (listener: Promise<PluginListenerHandle>) => {
            const handle = await listener;
            if (disposed) await handle.remove(); else handles.push(handle);
        };
        const play = async () => { prepareIOSNativeMediaSession(); await mediaSessionPlayRef.current(); };
        // Native commands are a fallback only. Registering both can deliver one skip twice.
        if (!hasWebMediaSession()) void listen(FoliaDevice.addListener('remoteCommand', event => {
            if (isNowPlayingControlDisabledRef.current) return;
            switch (event.action) {
                case 'play': void play().catch(console.warn); break;
                case 'pause': mediaSessionPauseRef.current(); break;
                case 'toggle': if ((getDisplayAudioElement?.() ?? audioRef.current)?.paused) void play().catch(console.warn); else mediaSessionPauseRef.current(); break;
                case 'next': void mediaSessionNextRef.current(); break;
                case 'previous': mediaSessionPrevRef.current(); break;
                case 'seek':
                    if (Number.isFinite(event.position)) mediaSessionSeekRef?.current(event.position!);
                    break;
            }
        }));
        void listen(FoliaDevice.addListener('audioInterruption', event => {
            // This notification belongs to the silent host AVAudioSession, not WebKit's player.
            // WebKit taking focus can interrupt that host too. Feeding it back into pause/play
            // stops the very media that just started; WebKit handles its own real interruptions.
            console.info('[iOS audio] Host interruption', event.began ? 'began' : 'ended', 'shouldResume', event.shouldResume);
        }));
        void listen(FoliaDevice.addListener('audioRouteChanged', event => {
            if (event.oldDeviceUnavailable) mediaSessionPauseRef.current();
        }));
        return () => { disposed = true; for (const handle of handles) void handle.remove(); };
    }, [audioRef, getDisplayAudioElement, mediaSessionSeekRef, mediaSessionPlayRef, mediaSessionPauseRef, mediaSessionNextRef, mediaSessionPrevRef, isNowPlayingControlDisabledRef]);

    useEffect(() => {
        if (!isNativeIOS() || hasWebMediaSession()) return;
        if (!currentSong || isNowPlayingStageActive) { void FoliaDevice.publishNowPlaying({ clear: true }); return; }
        const audio = getDisplayAudioElement?.() ?? audioRef.current;
        if (!audio || !audioSrc) return;
        let disposed = false;
        let artwork: string | undefined;
        let lastPublished = 0;
        const publish = () => {
            if (disposed || !isMediaSessionSourceReady(audio, audioSrc, document.baseURI)) return;
            lastPublished = performance.now();
            void FoliaDevice.publishNowPlaying({ trackKey: getPlaybackSongKey(currentSong), title: currentSong.name,
                artist: getSongArtistLabel(currentSong) || unknownArtistLabel, album: getSongAlbumLabel(currentSong),
                duration: Number.isFinite(audio.duration) ? audio.duration : 0, position: audio.currentTime,
                rate: audio.playbackRate, playing: !audio.paused && !audio.ended, artwork }).catch(console.warn);
            artwork = undefined;
        };
        const update = () => { if (performance.now() - lastPublished >= 1000) publish(); };
        const playing = publish;
        const events = ['loadedmetadata', 'durationchange', 'seeked', 'ratechange', 'pause'] as const;
        events.forEach(event => audio.addEventListener(event, publish));
        audio.addEventListener('timeupdate', update);
        audio.addEventListener('playing', playing);
        publish();
        const controller = new AbortController();
        const cover = cachedCoverUrl || getSongCoverUrl(currentSong);
        if (cover) void fetch(cover, { signal: controller.signal }).then(async response => {
            if (!response.ok) return;
            const blob = await response.blob();
            if (blob.size > 4_000_000 || !blob.type.startsWith('image/')) return;
            artwork = await blobBase64(blob); publish();
        }).catch(() => undefined);
        let foregroundHandle: PluginListenerHandle | undefined;
        void FoliaDevice.addListener('foreground', publish).then(handle => { if (disposed) void handle.remove(); else foregroundHandle = handle; });
        return () => {
            disposed = true; controller.abort(); void foregroundHandle?.remove();
            events.forEach(event => audio.removeEventListener(event, publish));
            audio.removeEventListener('timeupdate', update); audio.removeEventListener('playing', playing);
        };
    }, [audioRef, getDisplayAudioElement, currentSong, audioSrc, playerState, cachedCoverUrl, isNowPlayingStageActive, unknownArtistLabel]);
}
