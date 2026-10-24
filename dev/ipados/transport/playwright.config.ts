import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'node:url';

// Reuse the original component gallery/fixtures for desktop and iPad transport checks in installed macOS WebKit.
const root = fileURLToPath(new URL('../../../', import.meta.url));
export default defineConfig({
    testDir: `${root}test/component`,
    testMatch: /trackTitleNavigator.*\.spec\.ts/,
    outputDir: `${root}test-results/ipados-transport`,
    workers: 1,
    timeout: 60_000,
    expect: { timeout: 10_000 },
    reporter: 'list',
    use: { browserName: 'webkit', baseURL: 'http://127.0.0.1:4173/dev-probe.html',
        viewport: { width: 1440, height: 1100 }, serviceWorkers: 'block' },
    webServer: { cwd: root, command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
        url: 'http://127.0.0.1:4173', reuseExistingServer: true, timeout: 120_000 },
});
