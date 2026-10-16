import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Native protocol tests: real float layouts with synthetic sandbox transport, never personal audio or a remote server.
const state = vi.hoisted(() => ({ native: true, infer: vi.fn(), create: vi.fn(), clean: vi.fn(), cancel: vi.fn(), status: vi.fn(), write: vi.fn(), stat: vi.fn(), yield: vi.fn() }));
vi.mock('../../../src/services/automix/uiYield', () => ({ YIELD_BUDGET_MS: 8, yieldToUi: state.yield }));
vi.mock('../../../src/platform/ios/automix', () => ({ hasNativeAutomix: () => state.native,
    FoliaAutomix: { infer: state.infer, createJob: state.create, cleanJob: state.clean, cancel: state.cancel, status: state.status } }));
vi.mock('../../../src/platform/ios/device', () => ({ FoliaDevice: { statFile: state.stat } }));
vi.mock('../../../src/platform/ios/files', () => ({ nativeStorageUrl: (path: string) => `capacitor://localhost/_capacitor_file_/${path}`, writeNativeBlob: state.write }));
vi.mock('@capacitor/core', () => ({ Capacitor: { convertFileSrc: (value: string) => value } }));
import { nativeBeatThis, nativeSeparateStems, cancelNativeInference, nativeInferenceError } from '../../../src/services/automix/nativeInference';
import { beatInference, stemInference, modelPresenceReader } from '../../../src/services/automix/inferenceBridge';
import { installNativeAutomixLifecycle } from '../../../src/services/automix/nativeLifecycle';

const id = 'C267003D-A2AC-4320-B00A-F1E2A7EAFB4D';
const path = `automix-bridge/${id}/output.f32`;
let output: Float32Array<ArrayBuffer>;
beforeEach(() => {
    vi.clearAllMocks(); state.native = true;
    vi.stubGlobal('window', {}); vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' }));
    state.create.mockResolvedValue({ id }); state.clean.mockResolvedValue({}); state.cancel.mockResolvedValue({});
    state.infer.mockResolvedValue({ path }); state.write.mockResolvedValue(undefined);
    state.yield.mockResolvedValue(undefined);
    state.status.mockResolvedValue({ present: { beat_this: true, htdemucs: true } });
    output = new Float32Array([1, 2, 3, 4]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(output.buffer)));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });
describe('platform inference dispatch', () => {
    it('uses native models without creating a fake Electron API', async () => {
        expect(beatInference()).toBe(nativeBeatThis); expect(stemInference()).toBe(nativeSeparateStems);
        expect(await modelPresenceReader()?.()).toEqual({ beat_this: true, htdemucs: true });
        expect(window.electron).toBeUndefined();
    });
    it('retains original desktop bridges and reports no runtime on ordinary web', async () => {
        state.native = false;
        expect(stemInference()).toBeUndefined(); expect(modelPresenceReader()).toBeUndefined();
        const desktop = { runBeatThis: vi.fn(), separateStems: vi.fn(), getAutomixModelsPresent: vi.fn() };
        vi.stubGlobal('window', { electron: desktop });
        expect(beatInference()).toBe(desktop.runBeatThis); expect(stemInference()).toBe(desktop.separateStems);
        expect(modelPresenceReader()).toBe(desktop.getAutomixModelsPresent);
    });
});
describe('file-backed native tensors', () => {
    it('preserves sliced input views and each chunk’s interleaved beat/downbeat outputs', async () => {
        const backing = new Float32Array(256).fill(17); const first = backing.subarray(128);
        const result = await nativeBeatThis([{ frames: 1, data: first }, { frames: 1, data: new Float32Array(128).fill(23) }]);
        const blob = state.write.mock.calls[0][1] as Blob;
        const written = new Float32Array(await blob.arrayBuffer());
        expect(written.length).toBe(256); expect(written[0]).toBe(17); expect(written[128]).toBe(23);
        expect(result?.beat.map(value => [...value])).toEqual([[1], [3]]);
        expect(result?.downbeat.map(value => [...value])).toEqual([[2], [4]]);
        expect(state.infer).toHaveBeenCalledWith({ id, kind: 'beat_this', frames: [1, 1] });
        expect(state.clean).toHaveBeenCalledWith({ id });
        expect(state.infer.mock.calls[0][0]).not.toHaveProperty('data');
    });
    it('keeps original drums/bass/vocals channel order and leaves other for exact JS subtraction', async () => {
        output = new Float32Array([1, 2, 3, 4, 5, 6]);
        const parts = await nativeSeparateStems({ left: new Float32Array([0.1]), right: new Float32Array([0.2]) });
        expect(parts && Object.keys(parts)).toEqual(['drums', 'bass', 'vocals']);
        expect(parts?.drums.left[0]).toBe(1); expect(parts?.bass.right[0]).toBe(4); expect(parts?.vocals.right[0]).toBe(6);
    });
    it('keeps six disjoint views alive after job cleanup and later inference without copying the result', async () => {
        output = new Float32Array([1, 2, 3, 4, 5, 6]);
        const parts = await nativeSeparateStems({ left: new Float32Array([0.1]), right: new Float32Array([0.2]) });
        expect(state.clean).toHaveBeenCalledWith({ id });
        const channels = [parts!.drums.left, parts!.drums.right, parts!.bass.left, parts!.bass.right, parts!.vocals.left, parts!.vocals.right];
        expect(new Set(channels.map(value => value.buffer)).size).toBe(1);
        expect(channels.map(value => value.byteOffset)).toEqual([0, 4, 8, 12, 16, 20]);
        channels[0][0] = 11;
        expect([...channels[1]]).toEqual([2]);
        output = new Float32Array([7, 8, 9, 10, 11, 12]);
        await nativeSeparateStems({ left: new Float32Array([0.1]), right: new Float32Array([0.2]) });
        expect(channels.map(value => value[0])).toEqual([11, 2, 3, 4, 5, 6]);
    });
    it.each(['cancel', 'background'])('yields during large output validation and discards stale output after %s', async action => {
        let now = 0;
        vi.spyOn(performance, 'now').mockImplementation(() => { now += 9; return now; });
        output = new Float32Array(60_000).fill(0.1);
        state.yield.mockImplementationOnce(async () => {
            if (action === 'cancel') await cancelNativeInference();
            else (document as unknown as { visibilityState: string }).visibilityState = 'hidden';
        });
        const input = { left: new Float32Array(10_000), right: new Float32Array(10_000) };
        expect(await nativeSeparateStems(input)).toBeNull();
        expect(state.yield).toHaveBeenCalledOnce();
        expect(state.clean).toHaveBeenCalledWith({ id });
        (document as unknown as { visibilityState: string }).visibilityState = 'visible';
        expect(await nativeSeparateStems(input)).not.toBeNull();
        expect(nativeInferenceError()).toBe('');
    });
    it.each(['length', 'nan', 'path', 'native-error', 'write-error'])('rejects malformed %s, cleans job, and allows a later request', async kind => {
        if (kind === 'length') output = new Float32Array([1]);
        if (kind === 'nan') output[1] = NaN;
        if (kind === 'path') state.infer.mockResolvedValueOnce({ path: '../outside' });
        if (kind === 'native-error') state.infer.mockRejectedValueOnce(new Error('model error'));
        if (kind === 'write-error') state.write.mockRejectedValueOnce(new Error('disk full'));
        const chunks = [{ frames: 2, data: new Float32Array(256) }];
        expect(await nativeBeatThis(chunks)).toBeNull();
        expect(nativeInferenceError()).not.toBe(''); expect(state.clean).toHaveBeenCalledWith({ id });
        output = new Float32Array([1, 2, 3, 4]);
        expect(await nativeBeatThis(chunks)).not.toBeNull(); expect(nativeInferenceError()).toBe('');
    });
    it('rejects invalid dimensions before writing anything', async () => {
        expect(await nativeBeatThis([{ frames: 2, data: new Float32Array(128) }])).toBeNull();
        expect(await nativeSeparateStems({ left: new Float32Array(2), right: new Float32Array(3) })).toBeNull();
        expect(state.create).not.toHaveBeenCalled();
    });
    it('serializes model requests and cancels queued work without dispatching it', async () => {
        let finish!: (value: { path: string }) => void;
        state.infer.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
        const chunks = [{ frames: 2, data: new Float32Array(256) }];
        const first = nativeBeatThis(chunks);
        await vi.waitFor(() => expect(state.infer).toHaveBeenCalledTimes(1));
        const second = nativeBeatThis(chunks);
        await cancelNativeInference(); finish({ path }); await first;
        expect(await second).toBeNull(); expect(state.infer).toHaveBeenCalledTimes(1);
    });
    it('flushes on background and refuses new work until visible', async () => {
        const dispose = installNativeAutomixLifecycle();
        (document as unknown as { visibilityState: string }).visibilityState = 'hidden';
        document.dispatchEvent(new Event('visibilitychange'));
        expect(state.cancel).toHaveBeenCalledOnce();
        expect(await nativeBeatThis([{ frames: 2, data: new Float32Array(256) }])).toBeNull();
        expect(state.create).not.toHaveBeenCalled(); dispose();
    });
});
