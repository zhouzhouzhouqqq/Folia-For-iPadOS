import { useEffect } from 'react';
import type { UseMediaSessionBridgeOptions } from './useMediaSessionBridge';
import { hasWebMediaSession } from '../utils/mediaSessionSync';
import { isNativeIOS } from '../platform/capabilities';
import { FoliaDevice } from '../platform/ios/device';

// Keep music track commands distinct from interval seeking, including after WebKit selects a new media session.
export function useWebMediaSessionActions(options: UseMediaSessionBridgeOptions) {
    const { audioRef, getDisplayAudioElement, audioSrc, currentSong, isNowPlayingStageActive, mediaSessionSeekRef,
        mediaSessionPlayRef, mediaSessionPauseRef, mediaSessionPrevRef, mediaSessionNextRef, isNowPlayingControlDisabledRef } = options;
    useEffect(() => {
        if (!hasWebMediaSession()) return;
        const session = navigator.mediaSession;
        const nativeIOS = isNativeIOS();
        const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
            try { session.setActionHandler(action, handler); return true; }
            catch (error) { console.warn(`[MediaSession] Failed to bind ${action} handler`, error); return false; }
        };
        const previous = () => { if (!isNowPlayingControlDisabledRef.current) mediaSessionPrevRef.current(); };
        const next = () => { if (!isNowPlayingControlDisabledRef.current) void mediaSessionNextRef.current(); };
        const syncNativeControls = (next: boolean, previous: boolean) => {
            if (nativeIOS) void FoliaDevice.setMusicControls({ next, previous })
                .catch(error => console.warn('[iOS audio] Music command configuration failed', error));
        };
        const refreshTracks = () => {
            // Null removes interval commands from WebKit's supported-command set; seekto stays enabled.
            if (nativeIOS) { set('seekbackward', null); set('seekforward', null); }
            const enabled = !nativeIOS || (!!currentSong && !isNowPlayingStageActive);
            const canPrevious = set('previoustrack', enabled ? previous : null);
            const canNext = set('nexttrack', enabled ? next : null);
            syncNativeControls(enabled && canNext, enabled && canPrevious);
        };
        set('play', async () => {
            if (isNowPlayingControlDisabledRef.current || !audioRef.current) return;
            try { await mediaSessionPlayRef.current(); }
            catch (error) { console.error('MediaSession play failed', error); }
        });
        set('pause', () => {
            if (!isNowPlayingControlDisabledRef.current && audioRef.current) mediaSessionPauseRef.current();
        });
        if (mediaSessionSeekRef) set('seekto', event => {
            if (!isNowPlayingControlDisabledRef.current && Number.isFinite(event.seekTime)) mediaSessionSeekRef.current(event.seekTime!);
        });
        refreshTracks();
        const audio = getDisplayAudioElement?.() ?? audioRef.current;
        const foreground = () => { if (document.visibilityState === 'visible') refreshTracks(); };
        // Initial registration may precede WebKit's player becoming the current system session.
        if (nativeIOS) {
            audio?.addEventListener('loadedmetadata', refreshTracks);
            audio?.addEventListener('playing', refreshTracks);
            document.addEventListener('visibilitychange', foreground);
        }
        return () => {
            audio?.removeEventListener('loadedmetadata', refreshTracks);
            audio?.removeEventListener('playing', refreshTracks);
            document.removeEventListener('visibilitychange', foreground);
            for (const action of ['play', 'pause', 'previoustrack', 'nexttrack'] as const) set(action, null);
            if (mediaSessionSeekRef) set('seekto', null);
            syncNativeControls(false, false);
        };
    }, [audioRef, getDisplayAudioElement, audioSrc, currentSong, isNowPlayingStageActive, mediaSessionSeekRef,
        mediaSessionPlayRef, mediaSessionPauseRef, mediaSessionPrevRef, mediaSessionNextRef, isNowPlayingControlDisabledRef]);
}
