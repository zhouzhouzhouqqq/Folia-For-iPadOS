import { describe, expect, it } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const {
    REMOTE_CONTROL_WINDOW_WIDTH,
    REMOTE_CONTROL_WINDOW_HEIGHT,
    getInitialRemoteControlWindowPosition,
    isPointOverRemoteControlStrip,
    clampRemoteControlWindowX,
} = require('../../../electron/remoteControlWindowGeometry.cjs') as typeof import('../../../electron/remoteControlWindowGeometry.cjs');

const windowAt = (x: number, y: number) => ({ x, y, width: REMOTE_CONTROL_WINDOW_WIDTH, height: REMOTE_CONTROL_WINDOW_HEIGHT });

describe('remote window geometry', () => {
    it('opens with the card in use where the old 428-wide centred window had it', () => {
        const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
        const oldWindowX = Math.floor((1920 - 428) / 2);
        const position = getInitialRemoteControlWindowPosition(workArea);
        // The card in use starts 4 px into the old window, and 4 + 174 px into the new one.
        expect(position.x + 178).toBe(oldWindowX + 4);
        expect(position.y).toBe(Math.floor((1040 - 184) / 2));
    });

    it('opens on a second screen\'s work area the same way', () => {
        const position = getInitialRemoteControlWindowPosition({ x: 1920, y: 40, width: 1280, height: 984 });
        expect(position).toEqual({ x: 1920 + 426 - 174, y: 40 + 400 });
    });

    it('lets clicks through only left of the card in use', () => {
        const bounds = windowAt(500, 300);
        expect(isPointOverRemoteControlStrip(bounds, { x: 500, y: 300 })).toBe(true);
        expect(isPointOverRemoteControlStrip(bounds, { x: 677, y: 483 })).toBe(true);
        expect(isPointOverRemoteControlStrip(bounds, { x: 678, y: 380 })).toBe(false);
        expect(isPointOverRemoteControlStrip(bounds, { x: 600, y: 299 })).toBe(false);
        expect(isPointOverRemoteControlStrip(bounds, { x: 600, y: 484 })).toBe(false);
        expect(isPointOverRemoteControlStrip(bounds, { x: 499, y: 380 })).toBe(false);
    });

    it('keeps the strip on the card\'s left when a window manager widens the window', () => {
        const bounds = { x: 0, y: 0, width: 702, height: 184 };
        expect(isPointOverRemoteControlStrip(bounds, { x: 227, y: 90 })).toBe(true);
        expect(isPointOverRemoteControlStrip(bounds, { x: 228, y: 90 })).toBe(false);
    });

    it('stops the window at the outer left edge of the screens', () => {
        const screens = [{ x: 0, y: 0, width: 1920, height: 1080 }];
        expect(clampRemoteControlWindowX(windowAt(-120, 400), screens)).toBe(0);
        expect(clampRemoteControlWindowX(windowAt(0, 400), screens)).toBe(0);
        expect(clampRemoteControlWindowX(windowAt(30, 400), screens)).toBe(30);
    });

    it('lets the window cross onto a screen on the left', () => {
        const screens = [
            { x: -1920, y: 0, width: 1920, height: 1080 },
            { x: 0, y: 0, width: 1920, height: 1080 },
        ];
        expect(clampRemoteControlWindowX(windowAt(-120, 400), screens)).toBe(-120);
        expect(clampRemoteControlWindowX(windowAt(-2000, 400), screens)).toBe(-1920);
    });

    it('stops at the edge of the screen that holds the window when the left one sits lower', () => {
        const screens = [
            { x: -1920, y: 600, width: 1920, height: 1080 },
            { x: 0, y: 0, width: 1920, height: 1080 },
        ];
        expect(clampRemoteControlWindowX(windowAt(-100, 100), screens)).toBe(0);
    });

    it('leaves a window that is on no screen at all alone', () => {
        expect(clampRemoteControlWindowX(windowAt(-5000, 100), [{ x: 0, y: 0, width: 1920, height: 1080 }])).toBe(-5000);
    });

    it('lets the card in use reach the left edge when the cover is collapsed', () => {
        const screens = [{ x: 0, y: 0, width: 1920, height: 1080 }];
        // The empty strip left of the card may go off screen; the card itself (4 + 174 px in) stops at the edge.
        expect(clampRemoteControlWindowX(windowAt(-120, 400), screens, false)).toBe(-120);
        expect(clampRemoteControlWindowX(windowAt(-178, 400), screens, false)).toBe(-178);
        expect(clampRemoteControlWindowX(windowAt(-300, 400), screens, false)).toBe(-178);
        expect(clampRemoteControlWindowX(windowAt(-300, 400), screens, true)).toBe(0);
    });

    it('stops the collapsed card at the edge of the screen that holds it', () => {
        const screens = [
            { x: -1920, y: 600, width: 1920, height: 1080 },
            { x: 0, y: 0, width: 1920, height: 1080 },
        ];
        expect(clampRemoteControlWindowX(windowAt(-260, 100), screens, false)).toBe(-178);
        expect(clampRemoteControlWindowX({ x: -278, y: 100, width: 702, height: 184 }, screens, false)).toBe(-228);
    });
});
