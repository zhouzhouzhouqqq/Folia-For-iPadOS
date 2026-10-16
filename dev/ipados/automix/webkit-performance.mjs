import { webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Exercise the actual native-result adapter in WebKit with local synthetic tensors; no model, account or audio upload.
const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, serviceWorkers: 'block' });
const errors = [], external = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => {
    if (['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)) return route.continue();
    external.push(new URL(route.request().url()).origin); return route.abort();
});
await page.addInitScript(() => {
    window.CapacitorCustomPlatform = { name: 'ios' };
    const id = 'C267003D-A2AC-4320-B00A-F1E2A7EAFB4D';
    window.Capacitor = {
        PluginHeaders: [
            { name: 'FoliaAutomix', methods: ['createJob', 'infer', 'cleanJob', 'cancel', 'status', 'addListener', 'removeListener'].map(name => ({ name, rtype: 'promise' })) },
            { name: 'FoliaDevice', methods: ['writeFile', 'appendFile', 'statFile'].map(name => ({ name, rtype: 'promise' })) },
        ],
        nativePromise: async (_plugin, method) => {
            if (method === 'createJob') return { id };
            if (method === 'infer') return { path: `automix-bridge/${id}/output.f32` };
            if (method === 'statFile') return { uri: 'http://127.0.0.1:4173/__synthetic_tensor' };
            if (method === 'status') return { present: { beat_this: false, htdemucs: false } };
            return {};
        },
        nativeCallback: () => 'synthetic-listener',
    };
});
try {
    await page.goto('http://127.0.0.1:4173/dev-probe.html?probe=ipadosAutomix', { waitUntil: 'networkidle' });
    const result = await page.evaluate(async () => {
        const { nativeSeparateStems } = await import('/src/services/automix/nativeInference.ts');
        const count = 44_100 * 30;
        let values = new Float32Array(count * 6).fill(0.125);
        const originalFetch = window.fetch;
        let validating = false, paints = 0, raf = 0, started = 0;
        const frame = () => { if (validating) paints++; raf = requestAnimationFrame(frame); };
        raf = requestAnimationFrame(frame);
        window.fetch = async (url, ...rest) => {
            if (!String(url).includes('__synthetic_tensor')) return originalFetch(url, ...rest);
            // No serialization or allocation in the measured interval: it starts at the validated float view.
            return { ok: true, arrayBuffer: async () => { validating = true; started = performance.now(); return values.buffer; } };
        };
        try {
            const input = { left: new Float32Array(count), right: new Float32Array(count) };
            const parts = await nativeSeparateStems(input);
            const validationAndViewsMs = performance.now() - started;
            validating = false;
            if (!parts) throw new Error('Synthetic stem result was rejected');
            const views = [parts.drums.left, parts.drums.right, parts.bass.left, parts.bass.right, parts.vocals.left, parts.vocals.right];
            const distinctBuffers = new Set(views.map(value => value.buffer)).size;
            if (distinctBuffers !== 1 || views.some((value, i) => value.byteOffset !== i * count * 4 || value.length !== count || value[0] !== 0.125)) throw new Error('Invalid tensor views');
            values = new Float32Array(count * 6).fill(0.25);
            await nativeSeparateStems(input);
            if (parts.vocals.right[count - 1] !== 0.125) throw new Error('Later inference invalidated prior result');
            return { samplesPerChannel: count, channels: views.length, distinctBuffers, backingBytes: views[0].buffer.byteLength,
                avoidedDuplicateBytes: count * 6 * 4, validationAndViewsMs, animationFramesDuringValidation: paints,
                oldViewsSurviveLaterInference: true };
        } finally { window.fetch = originalFetch; cancelAnimationFrame(raf); }
    });
    if (errors.length || external.length) throw new Error(JSON.stringify({ errors, external }));
    writeFileSync('docs/ipados-validation/automix-performance-webkit.json', JSON.stringify({
        engine: 'macOS Playwright WebKit; synthetic native file bridge; not iPad performance', result, errors, external }, null, 2) + '\n');
    console.log(JSON.stringify(result));
} finally { await browser.close(); }
