import { defineConfig } from '@playwright/test';
import transport from '../transport/playwright.config';

// Reuse the project gallery in installed macOS WebKit; no user account, real music or native OS event injection.
export default defineConfig({ ...transport, testMatch: /ipadosMediaSession\.spec\.ts/ });
