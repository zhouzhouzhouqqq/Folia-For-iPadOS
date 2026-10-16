import { webkit } from '@playwright/test';
import { writeFileSync } from 'node:fs';

// Real WebKit form interaction with a synthetic Capacitor bridge; no account, external request or real key.
const browser = await webkit.launch();
const page = await browser.newPage({ viewport: { width: 1024, height: 768 }, hasTouch: true, serviceWorkers: 'block' });
const errors = [], external = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/*', route => {
    if (new URL(route.request().url()).hostname === '127.0.0.1') return route.continue();
    external.push(new URL(route.request().url()).origin); return route.abort();
});
await page.addInitScript(() => {
    localStorage.setItem('i18nextLng', 'en');
    window.CapacitorCustomPlatform = { name: 'ios' };
    let settings = { provider: 'openai', apiUrl: 'https://ai.example/v1/chat/completions', model: 'test-model', temperature: 0.7, stream: false, hasKey: false, revision: '' };
    window.__aiCalls = [];
    window.Capacitor = {
        PluginHeaders: [{ name: 'FoliaAI', methods: ['getSettings', 'saveSettings', 'clearSettings', 'request', 'cancel'].map(name => ({ name, rtype: 'promise' })) }],
        nativePromise: async (_plugin, method, payload) => {
            window.__aiCalls.push(method);
            if (method === 'saveSettings') { const { apiKey, ...metadata } = payload; settings = { ...metadata, hasKey: Boolean(apiKey), revision: 'synthetic' }; }
            if (method === 'clearSettings') settings = { ...settings, hasKey: false, revision: '' };
            if (method === 'request') {
                const theme = { name: 'Synthetic theme', backgroundColor: '#112233', primaryColor: '#eeddcc', accentColor: '#cc6622', secondaryColor: '#aabbcc', wordColors: [{ word: 'sun', color: '#cc6622' }], lyricsIcons: ['Sun'] };
                const content = JSON.parse(payload.body).messages[0].role === 'system' ? JSON.stringify({ light: theme, dark: theme }) : 'hello back';
                return { status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }) };
            }
            return settings;
        },
    };
});
try {
    await page.goto('http://127.0.0.1:4173/dev-probe.html?probe=ipadosAI', { waitUntil: 'domcontentloaded' });
    const title = page.getByRole('heading', { name: 'Personal AI connection' });
    await title.waitFor({ timeout: 45000 });
    const test = page.getByRole('button', { name: 'Test saved connection' });
    if (await test.isEnabled()) throw new Error('test allowed without saved key');
    await page.getByLabel('Personal API key', { exact: true }).fill('synthetic-key');
    await page.getByRole('button', { name: 'Save AI settings' }).click();
    await page.getByRole('status').filter({ hasText: 'Saved.' }).waitFor();
    if (await page.getByLabel('Personal API key', { exact: true }).inputValue() !== '') throw new Error('key retained in editor after save');
    await test.click();
    await page.getByRole('status').filter({ hasText: 'hello back' }).waitFor();
    page.once('dialog', dialog => dialog.accept());
    const theme = await page.evaluate(async () => {
        const { generateThemeFromLyrics } = await import('/src/services/gemini.ts');
        return generateThemeFromLyrics('sun');
    });
    if (theme.light.wordColors[0].word !== 'sun' || theme.dark.lyricsIcons[0] !== 'Sun') throw new Error('real browser engine lost theme fields');
    await page.screenshot({ path: 'docs/ipados-validation/ai-direct-settings-landscape.png', fullPage: true });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({ path: 'docs/ipados-validation/ai-direct-settings-portrait.png', fullPage: true });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw new Error('horizontal overflow');
    await page.getByLabel('Model ID', { exact: true }).fill('edited-model');
    if (await test.isEnabled()) throw new Error('unsaved configuration can test');
    page.once('dialog', dialog => dialog.accept());
    await page.getByRole('button', { name: 'Clear AI settings and key' }).click();
    await page.getByRole('status').filter({ hasText: 'AI settings cleared.' }).waitFor();
    if (await test.isEnabled()) throw new Error('test allowed after clear');
    const calls = await page.evaluate(() => window.__aiCalls);
    if (errors.length || external.length) throw new Error(JSON.stringify({ errors, external }));
    writeFileSync('docs/ipados-validation/ai-direct-settings-webkit.json', JSON.stringify({ engine: 'Playwright macOS WebKit, synthetic Capacitor bridge; not physical iPad',
        results: ['load', 'save', 'clear password after save', 'explicit hello test', 'original theme pipeline with synthetic response', 'unsaved test blocked', 'clear', 'landscape/portrait no overflow'], calls, errors, external }, null, 2));
    console.log('PASS: native AI settings editor in macOS WebKit (mock bridge); landscape/portrait, save/test/clear, key field cleared, no external requests.');
} finally { await browser.close(); }
