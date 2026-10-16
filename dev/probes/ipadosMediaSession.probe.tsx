import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useMediaSessionBridge } from '../../src/hooks/useMediaSessionBridge';
import { PlayerState } from '../../src/types';
import type { ProbeDefinition } from './definition';

// Real WebKit MediaMetadata + one Web Audio graph, synthetic WAV/cover only. Never loaded in the shipped app.
function syntheticWave(frequency: number) {
    const samples = 8000 * 20, bytes = new Uint8Array(44 + samples * 2), view = new DataView(bytes.buffer);
    const text = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)));
    text(0, 'RIFF'); view.setUint32(4, bytes.length - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true); view.setUint32(28, 16000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
    text(36, 'data'); view.setUint32(40, samples * 2, true);
    for (let i = 0; i < samples; i++) view.setInt16(44 + i * 2, 3000 * Math.sin(i * frequency * Math.PI * 2 / 8000), true);
    return URL.createObjectURL(new Blob([bytes], { type: 'audio/wav' }));
}
function MediaSessionProbe() {
    const [index, setIndex] = useState(0), [state, setState] = useState(PlayerState.PAUSED), [error, setError] = useState('');
    const audioRef = useRef<HTMLAudioElement>(null), contextRef = useRef<AudioContext | null>(null);
    const requested = useRef(false);
    const [sources, setSources] = useState<string[]>([]);
    const covers = useMemo(() => ['#f33', '#3f3', '#33f'].map(color => {
        const canvas = document.createElement('canvas'); canvas.width = canvas.height = 32;
        const context = canvas.getContext('2d')!; context.fillStyle = color; context.fillRect(0, 0, 32, 32);
        return canvas.toDataURL('image/png');
    }), []);
    const song = useMemo(() => ({ id: String(index), name: `Synthetic ${'ABC'[index]}`, durationMs: 20_000,
        artists: [{ id: 'artist', name: 'Synthetic Artist' }], album: { id: 'album', name: 'Synthetic Album' } }), [index]);
    const play = async () => {
        requested.current = true;
        const audio = audioRef.current!;
        if (!contextRef.current) {
            const context = new AudioContext(), gain = context.createGain(); gain.gain.value = 0.001;
            context.createMediaElementSource(audio).connect(gain); gain.connect(context.destination); contextRef.current = context;
        }
        void contextRef.current.resume();
        await audio.play();
    };
    const playRef = useRef(play); playRef.current = play;
    const pauseRef = useRef(() => { requested.current = false; audioRef.current?.pause(); });
    const nextRef = useRef(() => setIndex(value => (value + 1) % 3));
    const prevRef = useRef(() => setIndex(value => (value + 2) % 3));
    const seekRef = useRef((position: number) => { if (audioRef.current) audioRef.current.currentTime = position; });
    const disabledRef = useRef(false);
    useMediaSessionBridge({ audioRef, audioSrc: sources[index] ?? null, currentSong: song, cachedCoverUrl: covers[index], playerState: state,
        unknownArtistLabel: 'Unknown', isNowPlayingStageActive: false, mediaSessionPlayRef: playRef, mediaSessionPauseRef: pauseRef,
        mediaSessionNextRef: nextRef, mediaSessionPrevRef: prevRef, mediaSessionSeekRef: seekRef, isNowPlayingControlDisabledRef: disabledRef });
    useEffect(() => {
        // Match usePlaybackAudioBridge's explicit load on a changed source, before optional autoplay.
        audioRef.current?.load();
        if (requested.current) void audioRef.current?.play().catch(e => setError(String(e)));
    }, [index, sources]);
    useEffect(() => {
        const urls = [330, 440, 550].map(syntheticWave); setSources(urls);
        return () => { urls.forEach(URL.revokeObjectURL); void contextRef.current?.close(); contextRef.current = null; };
    }, []);
    return <main>
        <audio ref={audioRef} src={sources[index]} preload="auto" onPlay={() => setState(PlayerState.PLAYING)} onPause={() => setState(PlayerState.PAUSED)} />
        <button onClick={() => { void play().catch(e => setError(String(e))); }}>Start synthetic playback</button>
        <output data-media-probe={index} data-error={error}>{song.name}</output>
    </main>;
}
export default { id: 'ipadosMediaSession', title: 'iPad Media Session', description: 'Actual WebKit metadata and synthetic transport.', Component: MediaSessionProbe } satisfies ProbeDefinition;
