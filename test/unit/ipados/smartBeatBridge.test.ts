import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The native analysis seam must drive the upstream effects without a second player or a GPU-only gate.
const mock = vi.hoisted(() => ({ native: true, installed: true, beat: vi.fn(), gpu: vi.fn(), stems: vi.fn() }));
vi.mock('@/platform/ios/automix', () => ({ hasNativeAutomix: () => mock.native }));
vi.mock('@/services/automix/inferenceBridge', () => ({ beatInference: () => mock.beat }));
vi.mock('@/services/automix/nativeInference', () => ({ nativeSeparateStems: mock.stems }));
vi.mock('@/services/analysis/modelAvailability', () => ({ modelCanRun: () => mock.installed, noteModelFailed: vi.fn() }));
vi.mock('@/services/analysis/beatThisGpu', () => ({ runBeatThisGpu: mock.gpu, runHtdemucsGpu: mock.gpu, HTDEMUCS_GPU_SEGMENT: 172032 }));
import { analyseBeatGrid, canRunBeatThis } from '@/services/analysis/beatThis';
import { separateDrumStem } from '@/services/analysis/drumStem';

beforeEach(() => {
    vi.clearAllMocks();
    mock.native = true; mock.installed = true;
    vi.stubGlobal('window', {});
    mock.beat.mockImplementation(async (chunks: { frames: number }[]) => ({
        beat: chunks.map(c => new Float32Array(c.frames).fill(-20)),
        downbeat: chunks.map(c => new Float32Array(c.frames).fill(-20)),
    }));
});
afterEach(() => vi.unstubAllGlobals());
describe('native smart beat bridge', () => {
    it('analyses on iOS without Electron, WebGPU or an explicitly requested desktop CPU fallback', async () => {
        expect(canRunBeatThis()).toBe(true);
        await analyseBeatGrid({ data: new Float32Array(50 * 128), frames: 50 }, { percussive: true });
        expect(mock.beat).toHaveBeenCalledOnce();
        expect(mock.gpu).not.toHaveBeenCalled();
        mock.installed = false;
        expect(canRunBeatThis()).toBe(false);
    });
    it('feeds real native drum samples through upstream overlap-add and honours cancellation', async () => {
        const left = new Float32Array(500).fill(0.25);
        mock.stems.mockImplementation(async ({ left }: { left: Float32Array }) => ({ drums: { left, right: left } }));
        const result = await separateDrumStem(left, left);
        expect(mock.stems).toHaveBeenCalledOnce();
        expect(mock.gpu).not.toHaveBeenCalled();
        expect(result?.length).toBe(500);
        expect(result?.[100]).toBeCloseTo(0.25);
        mock.stems.mockClear();
        expect(await separateDrumStem(left, left, undefined, () => false)).toBeNull();
        expect(mock.stems).not.toHaveBeenCalled();
    });
});
