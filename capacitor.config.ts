import type { CapacitorConfig } from '@capacitor/cli';

// capacitor.config.ts — resources are bundled; no remote server.url or ATS exceptions.
const config: CapacitorConfig = {
    appId: 'org.folia.personal',
    appName: 'Folia',
    webDir: 'dist',
    ios: {
        contentInset: 'never',
        backgroundColor: '#09090b',
        scrollEnabled: false,
        preferredContentMode: 'mobile',
    },
    plugins: {
        CapacitorHttp: { enabled: true },
        CapacitorCookies: { enabled: true },
    },
};

export default config;
