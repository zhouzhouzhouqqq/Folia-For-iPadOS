import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createMonetSpectrumSampler } from '../../../src/components/visualizer/monet/monetSpectrumSampler';

// Golden curves captured from the original 0.7.21 formula before caching its sample geometry.
const fixtures = JSON.parse(readFileSync(new URL('../../fixtures/monet-spectrum-v0721.json', import.meta.url), 'utf8')) as {
    length: number;
    frame: number;
    bands: number[];
    expected: number[];
}[];

describe('Monet spectrum sampling', () => {
    it('preserves every bar across silence, band fallback and changing FFT sizes', () => {
        const sample = createMonetSpectrumSampler();
        for (const fixture of fixtures) {
            const raw = Uint8Array.from({ length: fixture.length }, (_, index) => (index * 17 + fixture.frame * 53) % 256);
            const actual = sample(raw, fixture.bands);
            expect(actual.length).toBe(72);
            for (let index = 0; index < actual.length; index += 1) {
                expect(actual[index]).toBeCloseTo(fixture.expected[index], 12);
            }
        }
    });

    it('reuses its scratch vector without retaining stale samples when the source changes', () => {
        const sample = createMonetSpectrumSampler();
        const loud = sample(new Uint8Array(1024).fill(255), [1, 1, 1, 1, 1]);
        expect(loud.some(value => value > 0)).toBe(true);
        const quiet = sample(undefined, [0, 0, 0, 0, 0]);
        expect(quiet).toBe(loud);
        expect(Array.from(quiet)).toEqual(new Array(72).fill(0));
        expect(Array.from(sample(new Uint8Array(128), [1, 1, 1, 1, 1]))).toEqual(new Array(72).fill(0));
    });
});
