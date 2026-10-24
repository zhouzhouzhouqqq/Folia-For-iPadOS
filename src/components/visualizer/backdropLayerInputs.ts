import type { VisualizerBackdropLayersProps, VisualizerBackdropSharedProps } from './VisualizerBackdrop';

// Only the backdrop's inputs invalidate its React tree; live audio continues through MotionValues.
// This record is exhaustive so adding a shared backdrop input also requires a comparison here.
const SHARED_INPUTS: Record<keyof VisualizerBackdropSharedProps, true> = {
    coverUrl: true,
    isDaylight: true,
    seed: true,
    background: true,
    staticMode: true,
    backgroundStaticMode: true,
    paused: true,
    isPreviewMode: true,
};
const sharedKeys = Object.keys(SHARED_INPUTS) as (keyof VisualizerBackdropSharedProps)[];

export const sameBackdropLayerProps = (previous: VisualizerBackdropLayersProps, next: VisualizerBackdropLayersProps): boolean => (
    previous.theme === next.theme
    && previous.audioPower === next.audioPower
    && previous.audioBands === next.audioBands
    && previous.renderBackground === next.renderBackground
    && previous.transition === next.transition
    && previous.waits === next.waits
    && sharedKeys.every(key => previous.sharedProps?.[key] === next.sharedProps?.[key])
);
