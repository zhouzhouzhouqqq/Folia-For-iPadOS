import { describe, expect, it } from 'vitest';
import { createFrameRateLimitedRaf } from '../../../src/utils/frameRateLimiter';

// Synthetic display ticks expose cadence drift without relying on wall-clock timing.
const createDisplay = (rate: 60 | 90 | 120 | 'off') => {
    let nextHandle = 1;
    const pending = new Map<number, FrameRequestCallback>();
    const limiter = createFrameRateLimitedRaf(callback => {
        const handle = nextHandle++;
        pending.set(handle, callback);
        return handle;
    }, handle => pending.delete(handle), rate);
    const accepted: number[] = [];
    const render = (time: number) => {
        accepted.push(time);
        limiter.requestAnimationFrame(render);
    };
    limiter.requestAnimationFrame(render);
    return {
        limiter, accepted,
        tick: (time: number) => {
            const callbacks = [...pending.values()];
            pending.clear();
            callbacks.forEach(callback => callback(time));
        },
    };
};

describe('visualizer frame cadence', () => {
    it('keeps a 90 FPS cap at 90 callbacks on a 120 Hz display', () => {
        const display = createDisplay(90);
        for (let frame = 0; frame < 120; frame++) display.tick(frame * 1000 / 120);
        expect(display.accepted).toHaveLength(90);
        const gaps = display.accepted.slice(1).map((time, index) => time - display.accepted[index]);
        expect(Math.min(...gaps)).toBeCloseTo(1000 / 120);
        expect(Math.max(...gaps)).toBeCloseTo(2000 / 120);
    });

    it('does not drift when a 60 Hz display has timestamp jitter', () => {
        const display = createDisplay(60);
        for (let frame = 0; frame < 600; frame++) {
            display.tick(frame * 1000 / 60 + (frame % 2 ? 0.8 : -0.8));
        }
        expect(display.accepted).toHaveLength(600);
    });

    it('resumes once after a long pause and resets the deadline when changing the cap', () => {
        const display = createDisplay(60);
        display.tick(0);
        display.tick(60000);
        display.tick(60000.1);
        expect(display.accepted).toEqual([0, 60000]);
        display.limiter.setFrameRate(120);
        display.tick(60001);
        expect(display.accepted).toEqual([0, 60000, 60001]);
        display.limiter.setFrameRate('off');
        display.tick(60002);
        display.tick(60003);
        expect(display.accepted).toEqual([0, 60000, 60001, 60002, 60003]);
    });
});
