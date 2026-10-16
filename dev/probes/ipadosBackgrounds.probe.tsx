import React, { useEffect } from 'react';
import { useMotionValue } from 'framer-motion';
import { getVisualizerBackgroundRegistryEntry } from '../../src/components/visualizer/backgrounds/registry';
import { DEFAULT_THEME } from '../../src/services/baseThemes';
import { DEFAULT_LATENT_BACKGROUND_TUNING, DEFAULT_NOMAND_BACKGROUND_TUNING, DEFAULT_SORA_BACKGROUND_TUNING, type VisualizerBackgroundMode, type LatentBackgroundDisplayMode, type NomandBackgroundEffect } from '../../src/types';
import type { ProbeDefinition } from './definition';

// dev/probes/ipadosBackgrounds.probe.tsx — real registry renderers with a deterministic audio signal; no external media.
function BackgroundProbe() {
    const query = new URLSearchParams(location.search);
    const mode = (query.get('background') || 'common') as VisualizerBackgroundMode;
    const audioPower = useMotionValue(0.5);
    const bass = useMotionValue(0.4), lowMid = useMotionValue(0.3), mid = useMotionValue(0.5), vocal = useMotionValue(0.6), treble = useMotionValue(0.4);
    useEffect(() => {
        let frame = 0;
        const tick = (time: number) => { const value = 0.5 + Math.sin(time / 500) * 0.4; audioPower.set(value); bass.set(value); frame = requestAnimationFrame(tick); };
        frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame);
    }, [audioPower, bass]);
    const cover = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><defs><linearGradient id="g"><stop stop-color="#e85287"/><stop offset="1" stop-color="#239fca"/></linearGradient></defs><rect width="512" height="512" fill="url(#g)"/><circle cx="280" cy="290" r="125" fill="#ffc46d"/></svg>');
    return <div className="fixed inset-0" data-probe-background={mode}>
        {getVisualizerBackgroundRegistryEntry(mode).render({
            theme: DEFAULT_THEME, isDaylight: false, coverUrl: cover, audioPower,
            audioBands: { bass, lowMid, mid, vocal, treble }, seed: 'ipad-smoke', staticMode: false, paused: false,
            config: { mode, common: { useCoverColorBg: true, opacity: 1 },
                nomand: { tuning: { ...DEFAULT_NOMAND_BACKGROUND_TUNING, effect: (query.get('effect') || 'dithering') as NomandBackgroundEffect } },
                latent: { tuning: { ...DEFAULT_LATENT_BACKGROUND_TUNING, displayMode: (query.get('latent') || 'both') as LatentBackgroundDisplayMode } }, sora: { tuning: DEFAULT_SORA_BACKGROUND_TUNING },
                url: { items: [{ id: 'local', url: `${location.origin}/dev/ipados/animated-background.html`, note: 'Local animated iframe' }], selectedId: 'local' } },
        })}
    </div>;
}
export default { id: 'ipadosBackgrounds', title: 'iPad background registry', description: 'All background registry entries, animation enabled, synthetic audio, no user data.', Component: BackgroundProbe } satisfies ProbeDefinition;
