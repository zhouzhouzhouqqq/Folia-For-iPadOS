// The original Monet response curves with sampling geometry cached between audio frames.
const MIN_RAW_SPECTRUM_BIN = 6;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export const MONET_AUDIO_BAR_COUNT = 72;

export const createMonetSpectrumSampler = (count = MONET_AUDIO_BAR_COUNT) => {
    const positions = Array.from({ length: count }, (_, index) => index / (count - 1));
    const profiles = positions.map(position => {
        const scaled = Math.log10(1 + position * 9) * 10;
        return {
            lower: Math.floor(scaled),
            upper: Math.min(Math.floor(scaled) + 1, 10),
            mix: scaled - Math.floor(scaled),
            // Add a fuller contour so the profile reads like a continuous response curve.
            contour: 0.92 + Math.sin(position * Math.PI * 3.4 - Math.PI * 0.3) * 0.08
                + Math.sin(position * Math.PI * 9.2 + Math.PI * 0.2) * 0.035,
        };
    });
    const anchors = new Float64Array(11);
    const output = new Float64Array(count);
    let previousLength = -1;
    let rawProfiles: ReturnType<typeof prepareRawProfile>[] = [];

    // FFT bin positions, averaging weights and frequency correction depend only on FFT size.
    function prepareRawProfile(position: number, length: number) {
        const center = MIN_RAW_SPECTRUM_BIN + Math.expm1(position * Math.log(Math.max(1, length - MIN_RAW_SPECTRUM_BIN) + 1));
        const radius = Math.max(1, Math.round(5 - (1 - Math.abs(position - 0.5) * 2) * 3));
        const start = Math.max(MIN_RAW_SPECTRUM_BIN, Math.floor(center - radius));
        const end = Math.min(length - 1, Math.ceil(center + radius));
        const weights = Array.from({ length: Math.max(0, end - start + 1) }, (_, offset) => (
            Math.max(0.1, 1 - Math.abs(start + offset - center) / (radius + 1))
        ));
        return {
            start, weights,
            total: weights.reduce((sum, weight) => sum + weight, 0),
            // Dynamic noise floor based on frequency (higher noise subtraction for lower frequencies)
            noiseFloor: 16 + (1 - position) * 12,
            // Power compression to suppress quiet/humming baseline and increase visual peaks (contrast)
            power: 1.8 + (1 - position) * 0.4,
            compensation: 0.52 + position * 0.62,
            presence: 0.92 + Math.sqrt(position) * 0.14,
        };
    }

    // The returned scratch vector belongs to this sampler and is consumed before its next call.
    return (rawSpectrum: Uint8Array | undefined, bands: readonly number[]): Float64Array => {
        if (rawSpectrum && rawSpectrum.length > MIN_RAW_SPECTRUM_BIN) {
            if (rawSpectrum.length !== previousLength) {
                previousLength = rawSpectrum.length;
                rawProfiles = positions.map(position => prepareRawProfile(position, previousLength));
            }
            for (let index = 0; index < count; index += 1) {
                const profile = rawProfiles[index];
                let sum = 0;
                for (let offset = 0; offset < profile.weights.length; offset += 1) {
                    sum += rawSpectrum[profile.start + offset] * profile.weights[offset];
                }
                const averaged = profile.total > 0 ? sum / profile.total : 0;
                const normalized = clamp((averaged - profile.noiseFloor) / (255 - profile.noiseFloor));
                output[index] = clamp(Math.pow(normalized, profile.power) * profile.compensation * profile.presence);
            }
        } else {
            const [bass, lowMid, mid, vocal, treble] = bands;
            anchors[0] = clamp(bass * 1.08);
            anchors[1] = clamp(bass * 0.96);
            anchors[2] = clamp(bass * 0.74 + lowMid * 0.26);
            anchors[3] = clamp(lowMid);
            anchors[4] = clamp(lowMid * 0.58 + mid * 0.42);
            anchors[5] = clamp(mid);
            anchors[6] = clamp(mid * 0.42 + vocal * 0.58);
            anchors[7] = clamp(vocal);
            anchors[8] = clamp(vocal * 0.48 + treble * 0.52);
            anchors[9] = clamp(treble);
            anchors[10] = clamp(treble * 0.82);
            for (let index = 0; index < count; index += 1) {
                const profile = profiles[index];
                const lower = anchors[profile.lower];
                const interpolated = lower + (anchors[profile.upper] - lower) * profile.mix;
                output[index] = clamp(interpolated * profile.contour);
            }
        }
        return output;
    };
};
