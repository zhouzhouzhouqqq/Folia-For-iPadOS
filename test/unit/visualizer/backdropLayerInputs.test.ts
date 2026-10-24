import { describe, expect, it } from 'vitest';
import { sameBackdropLayerProps } from '../../../src/components/visualizer/backdropLayerInputs';
import type { VisualizerBackdropLayersProps, VisualizerBackdropSharedProps } from '../../../src/components/visualizer/VisualizerBackdrop';

// A new lyric line may replace the props wrapper without changing a backdrop input.
const createProps = () => ({
    theme: {}, audioPower: {}, audioBands: {}, renderBackground: true,
    sharedProps: { coverUrl: 'cover-a', isDaylight: false, seed: 1, background: {}, staticMode: false, backgroundStaticMode: false, paused: false, isPreviewMode: false },
} as unknown as VisualizerBackdropLayersProps);

describe('backdrop render boundaries', () => {
    it('keeps the background mounted through unrelated lyric updates', () => {
        const props = createProps();
        expect(sameBackdropLayerProps(props, { ...props, sharedProps: { ...props.sharedProps } })).toBe(true);
        expect(sameBackdropLayerProps({ ...props, sharedProps: undefined }, { ...props, sharedProps: {} })).toBe(true);
    });

    const changes: { [Key in keyof VisualizerBackdropSharedProps]-?: VisualizerBackdropSharedProps[Key] } = {
        coverUrl: 'cover-b', isDaylight: true, seed: 2, background: {}, staticMode: true,
        backgroundStaticMode: true, paused: true, isPreviewMode: true,
    };
    for (const key of Object.keys(changes) as (keyof VisualizerBackdropSharedProps)[]) {
        it(`updates when shared input ${key} changes`, () => {
            const props = createProps();
            expect(sameBackdropLayerProps(props, { ...props, sharedProps: { ...props.sharedProps, [key]: changes[key] } })).toBe(false);
        });
    }

    for (const key of ['theme', 'audioPower', 'audioBands', 'renderBackground', 'transition', 'waits'] as const) {
        it(`updates when layer input ${key} changes`, () => {
            const props = createProps();
            const changed = { ...props, [key]: key === 'renderBackground' ? false : {} } as VisualizerBackdropLayersProps;
            expect(sameBackdropLayerProps(props, changed)).toBe(false);
        });
    }
});
