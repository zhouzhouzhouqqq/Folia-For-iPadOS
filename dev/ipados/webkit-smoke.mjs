import { webkit } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// dev/ipados/webkit-smoke.mjs — macOS WebKit smoke evidence, explicitly not an iPad performance benchmark.
const root = resolve(import.meta.dirname, '../..');
const out = resolve(process.env.FOLIA_SMOKE_OUTPUT || resolve(root, 'docs/ipados-test-artifacts'));
await mkdir(out, { recursive: true });
const inventory = JSON.parse(await readFile(resolve(root, 'docs/ipados-visual-inventory.json'), 'utf8'));
const cases = inventory.modes.map(mode => ({ id: `${mode.kind}-${mode.id}`, query: mode.kind === 'lyrics'
    ? `probe=visualizerMemory&vis=${mode.id}&lines=24&speed=1&start=12&postprocess=1&cjk=1&quality=full`
    : `probe=ipadosBackgrounds&background=${mode.id}`, selector: mode.kind === 'lyrics' ? `[data-probe-mode="${mode.id}"]` : `[data-probe-background="${mode.id}"]` }));
for (const effect of ['fluted-glass', 'paper-texture', 'halftone-dots', 'lens-distortion']) cases.push({ id: `nomand-${effect}`, query: `probe=ipadosBackgrounds&background=nomand&effect=${effect}`, selector: '[data-probe-background="nomand"]' });
for (const display of ['dithering', 'mesh']) cases.push({ id: `latent-${display}`, query: `probe=ipadosBackgrounds&background=latent&latent=${display}`, selector: '[data-probe-background="latent"]' });
const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, deviceScaleFactor: 1, hasTouch: true });
const results = [];
try {
    for (const item of cases.filter(item => !process.env.FOLIA_SMOKE_FILTER || item.id.includes(process.env.FOLIA_SMOKE_FILTER))) {
        const page = await context.newPage(); const errors = []; const consoleErrors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (message.type() === 'error') consoleErrors.push(message.text()); });
        let result;
        try {
            await page.goto(`${process.env.FOLIA_SMOKE_URL || 'http://127.0.0.1:4173'}/dev-probe.html?${item.query}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.locator(item.selector).waitFor({ state: 'visible', timeout: 45000 });
            await page.waitForTimeout(1800);
            const initial = await page.screenshot();
            await page.waitForTimeout(600);
            const changed = !initial.equals(await page.screenshot());
            await page.setViewportSize({ width: 768, height: 1024 });
            await page.waitForTimeout(500);
            await page.screenshot({ path: resolve(out, `${item.id}.png`) });
            const surfaces = await page.locator(`${item.selector} canvas`).count();
            await page.evaluate(() => window.unmount());
            result = { id: item.id, mounted: true, changedPixels: changed, canvasCount: surfaces, errors, consoleErrors };
        } catch (error) { result = { id: item.id, mounted: false, failure: error.message, errors, consoleErrors }; }
        results.push(result); console.log(`${item.id}: ${result.mounted && errors.length === 0 ? 'mounted' : 'FAILED'}; dynamic=${result.changedPixels}`);
        await page.close();
        await writeFile(resolve(out, 'webkit-smoke.json'), JSON.stringify({ engine: 'Playwright macOS WebKit; not WKWebView or real iPad', results }, null, 2));
    }
} finally { await browser.close(); }
if (results.some(result => !result.mounted || result.errors.length)) process.exitCode = 1;
