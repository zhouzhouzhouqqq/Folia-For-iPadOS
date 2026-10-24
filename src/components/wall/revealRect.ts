// src/components/wall/revealRect.ts

import { SEAM_EDGE_MARGIN, getSeamSplitOffsets } from './seamPlan';
import type { WallMetrics } from './layout';
import { getViewLineX, type WallView, type WallViewCenter } from './wallView';

// Smallest camera move that brings a world rect fully on screen, while keeping an open split on
// screen when both fit (the prototype's `revealRect`). The split rides with the world, so a move
// that pushed it off an edge would also squeeze it shut; between "rect visible" and "split stays",
// the rect wins. Vertically the rect clears `bottomInset` - the player bar's safe area.
// `centered` asks for the rect in the middle of the screen instead (locate, as a grid's page centres
// its card), under the same two limits: on screen, and the split kept on screen where both fit.

export type RevealRect = { x: number; y: number; width: number; height: number };

export type RevealInput = {
    rect: RevealRect;
    /** Current view centre (world point under the split's base line). */
    center: WallViewCenter;
    view: WallView;
    metrics: WallMetrics;
    /** World x of the split; null when the layer has none. */
    anchorX: number | null;
    /** Opening the split is drawn at right now, in screen px (0 when shut). */
    seamWidth: number;
    /** Screen-px margin kept around the rect. */
    pad?: number;
    /** Screen px the rect's bottom edge must stay above (player bar safe area); defaults to pad. */
    bottomInset?: number;
    /** Move the rect to the middle of the screen, not just onto it. */
    centered?: boolean;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** View centre after the minimal move; equal to `center` when the rect already shows. */
export const resolveRevealCenter = ({
    rect,
    center,
    view,
    metrics,
    anchorX,
    seamWidth,
    pad = 24,
    bottomInset = pad,
    centered = false,
}: RevealInput): WallViewCenter => {
    const lineX = getViewLineX(view);
    const scale = view.scale;
    const hasSeam = anchorX !== null && seamWidth > 1;
    // The half the rect sits in is pushed away from the split; screen x = line + offset + (x - cx) * s.
    const offsets = hasSeam ? getSeamSplitOffsets(seamWidth, scale, metrics) : { left: 0, right: 0 };
    const rectCenterX = rect.x + rect.width / 2;
    const offset = anchorX !== null && rectCenterX < anchorX ? offsets.left : offsets.right;

    const fitLow = rect.x + rect.width - (view.width - pad - lineX - offset) / scale;
    const fitHigh = rect.x - (pad - lineX - offset) / scale;
    // Where the centre would go: where it is (the smallest move), or where the rect's middle is at the screen's.
    const wantX = centered ? rectCenterX - (view.width / 2 - lineX - offset) / scale : center.x;
    let x: number;
    if (hasSeam) {
        const need = seamWidth / 2 + SEAM_EDGE_MARGIN;
        const seamLow = anchorX! - (view.width - need - lineX) / scale;
        const seamHigh = anchorX! + (lineX - need) / scale;
        const low = Math.max(fitLow, seamLow);
        const high = Math.min(fitHigh, seamHigh);
        x = low <= high ? clamp(wantX, low, high) : clamp(wantX, Math.min(fitLow, fitHigh), Math.max(fitLow, fitHigh));
    } else {
        x = clamp(wantX, Math.min(fitLow, fitHigh), Math.max(fitLow, fitHigh));
    }

    const yLow = rect.y + rect.height - (view.height / 2 - bottomInset) / scale;
    const yHigh = rect.y - (pad - view.height / 2) / scale;
    // Centred: the rect's middle halfway between the top margin and the player bar's safe area.
    const wantY = centered ? rect.y + rect.height / 2 - ((pad + view.height - bottomInset) / 2 - view.height / 2) / scale : center.y;
    const y = yLow <= yHigh ? clamp(wantY, yLow, yHigh) : rect.y + rect.height / 2;
    return { x, y };
};
