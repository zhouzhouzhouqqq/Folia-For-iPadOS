import { webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Real macOS WebKit, original transition graph and UI, synthetic audio/model bridge. No device-performance claim.
const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true, serviceWorkers: 'block' });
const errors = [], external = [], stages = [];
page.on('console', message => { if (message.text().startsWith('AUTOMIX-PROBE')) stages.push(message.text()); });
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => {
    const url = new URL(route.request().url());
    const origin = url.protocol === 'blob:' ? new URL(url.origin) : url;
    if (['127.0.0.1', 'localhost'].includes(origin.hostname)) return route.continue();
    external.push(new URL(route.request().url()).origin); return route.abort();
});
await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    localStorage.setItem('folia_automix_enabled', 'true');
    window.CapacitorCustomPlatform = { name: 'ios' };
    const installed = { beat_this: false, htdemucs: false };
    window.__automixCalls = [];
    window.Capacitor = {
        PluginHeaders: [{ name: 'FoliaAutomix', methods: ['status', 'downloadModel', 'removeModel', 'importModel', 'cancel', 'addListener', 'removeListener'].map(name => ({ name, rtype: 'promise' })) }],
        nativePromise: async (_plugin, method, payload) => {
            window.__automixCalls.push(method);
            if (method === 'status') return { present: { ...installed }, runtime: 'synthetic-only' };
            if (method === 'downloadModel' || method === 'importModel') installed[payload.name] = true;
            if (method === 'removeModel') installed[payload.name] = false;
            return {};
        },
        nativeCallback: () => 'synthetic-listener',
    };
});
try {
    await page.goto('http://127.0.0.1:4173/dev-probe.html?probe=ipadosAutomix', { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: 'iPad AutoMix models' }).waitFor({ timeout: 45000 });
    const modelPanel = page.locator('#automix-models');
    await modelPanel.getByRole('button', { name: 'Download', exact: true }).first().click();
    await modelPanel.getByText('Installed · SHA-256 verified').first().waitFor();
    await modelPanel.getByRole('button', { name: 'Import from Files' }).last().click();
    await page.waitForFunction(() => document.querySelectorAll('#automix-models button').length === 4 && !document.querySelector('#automix-models button[disabled]'));
    await page.getByText('Full', { exact: true }).waitFor();
    await page.screenshot({ path: 'docs/ipados-validation/automix-models-landscape.png', fullPage: true });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'docs/ipados-validation/automix-models-portrait.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('horizontal overflow');
    page.once('dialog', dialog => dialog.accept());
    await modelPanel.getByRole('button', { name: 'Remove', exact: true }).first().click();
    await modelPanel.getByRole('button', { name: 'Download', exact: true }).waitFor();
    // Exercise the original two-HTMLMediaElement graph with generated WAV tones under one AudioContext.
    const graph = await page.evaluate(async () => {
        const { connectAutomixDeck, scheduleCrossfade } = await import('/src/services/automix/crossfadeGraph.ts');
        console.log('AUTOMIX-PROBE context');
        const context = new AudioContext();
        console.log('AUTOMIX-PROBE nodes');
        const mix = context.createGain(), analyser = context.createAnalyser();
        mix.connect(analyser); analyser.connect(context.destination);
        function wave(hz) {
            const frames = 44100 * 8, buffer = new ArrayBuffer(44 + frames * 2), view = new DataView(buffer);
            const text = (at, value) => { for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i)); };
            text(0, 'RIFF'); view.setUint32(4, buffer.byteLength - 8, true); text(8, 'WAVE'); text(12, 'fmt ');
            view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
            view.setUint32(24, 44100, true); view.setUint32(28, 88200, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
            text(36, 'data'); view.setUint32(40, frames * 2, true);
            for (let i = 0; i < frames; i++) view.setInt16(44 + 2 * i, Math.round(5000 * Math.sin(i * hz * Math.PI * 2 / 44100)), true);
            return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
        }
        const a = new Audio(wave(440)), b = new Audio(wave(880));
        console.log('AUTOMIX-PROBE decks');
        const out = connectAutomixDeck(context, a, mix), incoming = connectAutomixDeck(context, b, mix);
        out.fade.gain.value = 1; incoming.fade.gain.value = 0;
        const samples = [];
        const sample = () => { const data = new Float32Array(analyser.fftSize); analyser.getFloatTimeDomainData(data); return Math.sqrt(data.reduce((total, value) => total + value * value, 0) / data.length); };
        try {
            console.log('AUTOMIX-PROBE play', a.canPlayType('audio/wav'));
            await Promise.all([context.resume(), a.play(), b.play()]);
            console.log('AUTOMIX-PROBE playing');
            for (let attempt = 0; attempt < 40 && sample() < 0.02; attempt++) await new Promise(resolve => setTimeout(resolve, 50));
            samples.push(sample());
            const scheduled = scheduleCrossfade(context, out.fade, incoming.fade, 1);
            await new Promise(resolve => setTimeout(resolve, 500)); samples.push(sample());
            await new Promise(resolve => setTimeout(resolve, 700)); samples.push(sample());
            return { scheduled, context: context.state, paused: [a.paused, b.paused], samples, final: [out.fade.gain.value, incoming.fade.gain.value] };
        } finally { a.pause(); b.pause(); URL.revokeObjectURL(a.src); URL.revokeObjectURL(b.src); await context.close(); }
    });
    if (!graph.scheduled || graph.context !== 'running' || graph.paused.some(Boolean) || graph.samples.some(value => value < 0.02) || graph.final[0] > 0.001 || graph.final[1] < 0.999) throw new Error(JSON.stringify(graph));
    if (errors.length || external.length) throw new Error(JSON.stringify({ errors, external }));
    writeFileSync('docs/ipados-validation/automix-webkit.json', JSON.stringify({ engine: 'macOS Playwright WebKit, synthetic native bridge; not iPad/WKWebView',
        results: ['original transition panel', 'model download/import/remove', 'capability changes', 'landscape/portrait no overflow', 'one AudioContext and two HTMLMediaElement decks with original crossfade graph'],
        graph, calls: await page.evaluate(() => window.__automixCalls), errors, external }, null, 2));
    console.log('PASS: AutoMix settings and original dual-deck graph in macOS WebKit; synthetic inputs only.');
} catch (error) { console.error(JSON.stringify({ stages, errors, external })); throw error; } finally { await browser.close(); }
