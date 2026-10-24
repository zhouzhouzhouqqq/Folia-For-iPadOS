import { defineConfig } from '@playwright/test';
import transport from '../transport/playwright.config';

// Reuse the project gallery in installed macOS WebKit; no user account, real music or native OS event injection.
export default defineConfig({ ...transport, testMatch: /ipadosMediaSession\.spec\.ts/,
    projects: [
        { name: 'landscape', use: { viewport: { width: 1440, height: 1100 } } },
        { name: 'phone-portrait', use: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true } },
    ],
});
