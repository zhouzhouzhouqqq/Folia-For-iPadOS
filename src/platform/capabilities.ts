import { Capacitor } from '@capacitor/core';

// src/platform/capabilities.ts — the single native-platform boundary, using Capacitor detection.
export const isNativeIOS = (): boolean => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios';

export const platformCapabilities = () => ({
    nativeIOS: isNativeIOS(),
    nativeFiles: isNativeIOS() && Capacitor.isPluginAvailable('FoliaDevice'),
    nativeMediaSession: isNativeIOS() && Capacitor.isPluginAvailable('FoliaDevice'),
    desktop: typeof window !== 'undefined' && Boolean(window.electron),
    webServiceWorker: !isNativeIOS() && typeof navigator !== 'undefined' && 'serviceWorker' in navigator,
});

export const canUseFrontendMods = (): boolean => isNativeIOS() || (typeof window !== 'undefined' && Boolean(window.electron?.mods));
