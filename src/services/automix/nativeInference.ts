import { Capacitor } from '@capacitor/core';
import { FoliaAutomix, type NativeAutomixModel } from '../../platform/ios/automix';
import { FoliaDevice } from '../../platform/ios/device';
import { nativeStorageUrl, writeNativeBlob } from '../../platform/ios/files';
import { YIELD_BUDGET_MS, yieldToUi } from './uiYield';

// Serial, file-backed float32 bridge: no media upload and no multi-megabyte JSON result on the UI thread.
let tail: Promise<unknown> = Promise.resolve();
let revision = 0;
let lastError = '';
const listeners = new Set<() => void>();
export const subscribeNativeInferenceError = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const nativeInferenceError = () => lastError;
const report = (value: string) => { lastError = value; for (const listener of listeners) listener(); };
export const waitForNativeInferenceIdle = (): Promise<unknown> => tail;
export async function cancelNativeInference(): Promise<void> { revision++; await FoliaAutomix.cancel(); }
function serial<T>(operation: () => Promise<T>): Promise<T> {
    const epoch = revision;
    const run = tail.catch(() => undefined).then(() => {
        if (epoch !== revision) throw new DOMException('Cancelled', 'AbortError');
        return operation();
    });
    tail = run.catch(() => undefined);
    return run;
}
function assertCurrent(epoch: number): void {
    if (epoch !== revision || (typeof document !== 'undefined' && document.visibilityState === 'hidden')) {
        throw new DOMException('AutoMix analysis cancelled or waiting for the foreground', 'AbortError');
    }
}
// A full window has almost eight million floats. Validate in bounded blocks so lyrics/input can paint.
async function validateOutput(values: Float32Array, epoch: number): Promise<void> {
    let yieldBy = performance.now() + YIELD_BUDGET_MS;
    for (let start = 0; start < values.length; start += 16_384) {
        const end = Math.min(values.length, start + 16_384);
        for (let index = start; index < end; index++) {
            if (!Number.isFinite(values[index])) throw new Error('AutoMix returned nonfinite samples');
        }
        if (performance.now() >= yieldBy) {
            await yieldToUi();
            assertCurrent(epoch);
            yieldBy = performance.now() + YIELD_BUDGET_MS;
        }
    }
    assertCurrent(epoch);
}
export async function nativeTensorRun(kind: NativeAutomixModel, arrays: Float32Array[], counts: number[]): Promise<Float32Array<ArrayBuffer> | null> {
    try {
        return await serial(async () => {
            const epoch = revision;
            assertCurrent(epoch);
            const { id } = await FoliaAutomix.createJob();
            try {
                // Blob snapshots views, including sliced buffers, without serializing samples through JSON.
                const pieces = arrays.map(array => new Uint8Array(array.buffer as ArrayBuffer, array.byteOffset, array.byteLength));
                await writeNativeBlob(`automix-bridge/${id}/input.f32`, new Blob(pieces));
                assertCurrent(epoch);
                const result = await FoliaAutomix.infer({ id, kind, ...(kind === 'beat_this' ? { frames: counts } : { samples: counts[0] }) });
                assertCurrent(epoch);
                const expectedPath = `automix-bridge/${id}/output.f32`;
                if (result.path !== expectedPath) throw new Error('AutoMix returned an invalid output path');
                const uri = nativeStorageUrl(expectedPath) ?? Capacitor.convertFileSrc((await FoliaDevice.statFile({ path: expectedPath })).uri);
                const response = await fetch(uri);
                if (!response.ok) throw new Error('AutoMix output unavailable');
                const bytes = await response.arrayBuffer();
                const expected = kind === 'beat_this' ? counts.reduce((a, b) => a + b, 0) * 2 : counts[0] * 6;
                if (bytes.byteLength !== expected * 4) throw new Error('AutoMix output length mismatch');
                const values = new Float32Array(bytes);
                await validateOutput(values, epoch);
                report('');
                return values;
            } finally { await FoliaAutomix.cleanJob({ id }).catch(() => undefined); }
        });
    } catch (error) {
        report(error instanceof Error ? error.message : 'Native AutoMix inference failed');
        console.warn('[Automix] native inference failed; original estimator/master blend remains available');
        return null;
    }
}
export async function nativeBeatThis(chunks: Array<{ data: Float32Array; frames: number }>) {
    if (!chunks.length || chunks.length > 256 || chunks.some(chunk => !Number.isInteger(chunk.frames) || chunk.frames < 1 || chunk.frames > 1500 || chunk.data.length !== chunk.frames * 128)) return null;
    const values = await nativeTensorRun('beat_this', chunks.map(chunk => chunk.data), chunks.map(chunk => chunk.frames));
    if (!values) return null;
    let at = 0;
    const beat: Float32Array[] = [], downbeat: Float32Array[] = [];
    for (const { frames } of chunks) {
        beat.push(values.subarray(at, at + frames)); at += frames;
        downbeat.push(values.subarray(at, at + frames)); at += frames;
    }
    return { beat, downbeat };
}
export async function nativeSeparateStems({ left, right }: { left: Float32Array<ArrayBuffer>; right: Float32Array<ArrayBuffer> }) {
    if (!left.length || left.length !== right.length || left.length > 44_100 * 30) return null;
    const values = await nativeTensorRun('htdemucs', [left, right], [left.length]);
    if (!values) return null;
    // Disjoint views own the fetched ArrayBuffer after job cleanup; downstream PCM caching does not mutate them.
    const channel = (index: number) => values.subarray(index * left.length, (index + 1) * left.length);
    return { drums: { left: channel(0), right: channel(1) }, bass: { left: channel(2), right: channel(3) }, vocals: { left: channel(4), right: channel(5) } };
}
