import { useNativeMediaSessionBridge } from './useNativeMediaSessionBridge';
import { useWebMediaSessionActions } from './useWebMediaSessionActions';
import { isNativeIOS } from '../platform/capabilities';
import { useEffect } from 'react';
import type { RefObject } from 'react';
import { PlayerState } from '../types';
import type { SongResult } from '../types';
import { prepareMediaSessionArtwork } from '../services/mediaSessionArtwork';
import { getSongAlbumLabel, getSongArtistLabel, getSongCoverUrl } from '../services/onlineMusic/songMetadata';
import {
    getSupportedMediaSessionArtworkUrl,
    bindMediaSessionPositionUpdates,
    hasWebMediaSession,
    isMediaSessionSourceReady,
    publishMediaSessionTrack,
} from '../utils/mediaSessionSync';

// Bridges Folia playback state to the browser Media Session API.
export type UseMediaSessionBridgeOptions = {
    audioRef: RefObject<HTMLAudioElement | null>;
    /**
     * The deck the displayed track is playing on, or null when the picture is live.
     *
     * Metadata, clock and source have to describe the same deck. `currentSong` is already the
     * DISPLAYED track - the outgoing one for the length of a blend - while `audioRef` names the
     * active deck, which by then is the arriving track. Publishing the two together put the outgoing
     * track's title on the incoming track's duration and position, so the system panel showed one
     * song's name over another song's progress. `audioSrc` is passed to match this element.
     */
    getDisplayAudioElement?: () => HTMLAudioElement | null;
    audioSrc: string | null;
    currentSong: SongResult | null;
    cachedCoverUrl: string | null;
    playerState: PlayerState;
    isNowPlayingStageActive: boolean;
    unknownArtistLabel: string;
    mediaSessionSeekRef?: RefObject<(time: number) => void>;
    mediaSessionPlayRef: RefObject<() => Promise<void>>;
    mediaSessionPauseRef: RefObject<() => void>;
    mediaSessionPrevRef: RefObject<() => void>;
    mediaSessionNextRef: RefObject<() => Promise<void> | void>;
    isNowPlayingControlDisabledRef: RefObject<boolean>;
};

export const useMediaSessionBridge = ({
    audioRef,
    getDisplayAudioElement,
    audioSrc,
    currentSong,
    cachedCoverUrl,
    playerState,
    isNowPlayingStageActive,
    unknownArtistLabel,
    mediaSessionSeekRef,
    mediaSessionPlayRef,
    mediaSessionPauseRef,
    mediaSessionPrevRef,
    mediaSessionNextRef,
    isNowPlayingControlDisabledRef,
}: UseMediaSessionBridgeOptions) => {
    useNativeMediaSessionBridge({ audioRef, getDisplayAudioElement, audioSrc, currentSong, cachedCoverUrl,
        playerState, isNowPlayingStageActive, unknownArtistLabel, mediaSessionSeekRef, mediaSessionPlayRef, mediaSessionPauseRef,
        mediaSessionPrevRef, mediaSessionNextRef, isNowPlayingControlDisabledRef });
    useWebMediaSessionActions({ audioRef, getDisplayAudioElement, audioSrc, currentSong, cachedCoverUrl,
        playerState, isNowPlayingStageActive, unknownArtistLabel, mediaSessionSeekRef, mediaSessionPlayRef, mediaSessionPauseRef,
        mediaSessionPrevRef, mediaSessionNextRef, isNowPlayingControlDisabledRef });

    useEffect(() => {
        if (!hasWebMediaSession()) {
            return;
        }

        if (!currentSong || isNowPlayingStageActive) {
            try {
                navigator.mediaSession.metadata = null;
                navigator.mediaSession.setPositionState?.();
            } catch (e) {
                console.warn('[MediaSession] Failed to clear metadata', e);
            }
            return;
        }

        // The displayed track's own deck, so the position published below belongs to the title
        // published beside it. Falls back to the active deck whenever no blend is holding a picture.
        const audio = getDisplayAudioElement?.() ?? audioRef.current;
        if (!audio || !audioSrc) {
            return;
        }

        let disposed = false;
        const controller = new AbortController();
        const sourceArtworkUrl = cachedCoverUrl || getSongCoverUrl(currentSong) || '';
        let artworkUrl = getSupportedMediaSessionArtworkUrl(sourceArtworkUrl, document.baseURI);
        let disposeArtwork: (() => void) | undefined;
        const publish = () => {
            if (disposed || !isMediaSessionSourceReady(audio, audioSrc, document.baseURI)) {
                return;
            }

            try {
                publishMediaSessionTrack(navigator.mediaSession, audio, {
                    title: currentSong.name,
                    artist: getSongArtistLabel(currentSong) || unknownArtistLabel,
                    album: getSongAlbumLabel(currentSong),
                    artworkUrl,
                });
            } catch (e) {
                console.warn('[MediaSession] Failed to update metadata', e);
            }
        };

        // MediaMetadata rejects Electron's custom protocol, so expose that image through a
        // short-lived blob URL while this track owns the platform media session.
        const prepareUnsupportedArtwork = async () => {
            if (!sourceArtworkUrl || (artworkUrl && !isNativeIOS())) return;

            try {
                const prepared = await prepareMediaSessionArtwork(sourceArtworkUrl, controller.signal, isNativeIOS());
                if (disposed) {
                    prepared.dispose();
                    return;
                }
                disposeArtwork = prepared.dispose;
                artworkUrl = prepared.url;
                publish();
            } catch (e) {
                if (!disposed) console.warn('[MediaSession] Failed to prepare artwork', e);
            }
        };

        audio.addEventListener('loadedmetadata', publish);
        audio.addEventListener('durationchange', publish);
        // Re-publish after playback starts in case Chromium delivered a late clear from the old source.
        audio.addEventListener('playing', publish);
        const unbindPosition = bindMediaSessionPositionUpdates(navigator.mediaSession, audio,
            () => !disposed && isMediaSessionSourceReady(audio, audioSrc, document.baseURI));
        const visibility = () => { if (document.visibilityState === 'visible') publish(); };
        document.addEventListener('visibilitychange', visibility);
        publish();
        void prepareUnsupportedArtwork();

        return () => {
            disposed = true;
            controller.abort();
            audio.removeEventListener('loadedmetadata', publish);
            audio.removeEventListener('durationchange', publish);
            audio.removeEventListener('playing', publish);
            unbindPosition();
            document.removeEventListener('visibilitychange', visibility);
            disposeArtwork?.();
        };
    }, [audioRef, audioSrc, cachedCoverUrl, currentSong, getDisplayAudioElement, unknownArtistLabel, isNowPlayingStageActive]);

    useEffect(() => {
        if (!hasWebMediaSession()) {
            return;
        }

        try {
            navigator.mediaSession.playbackState = isNowPlayingStageActive
                ? 'none'
                : currentSong
                    ? (playerState === PlayerState.PLAYING ? 'playing' : 'paused')
                    : 'none';
        } catch (e) {
            console.warn('[MediaSession] Failed to update playback state', e);
        }
    }, [currentSong, isNowPlayingStageActive, playerState]);
};
