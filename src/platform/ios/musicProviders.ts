import { registerPlugin } from '@capacitor/core';

// Narrow native boundary shared by the two browser-compatible provider protocol runtimes.
export type MobileMusicProvider = 'qq' | 'kugou';
export interface ProviderCookie { name: string; value: string; domain: string; path: string; secure: boolean; expires?: number }
export interface ProviderHTTPResponse { status: number; headers: Record<string, string>; bodyBase64: string; cookies: ProviderCookie[] }
interface MusicProvidersPlugin {
    request(options: { provider: MobileMusicProvider; url: string; method: string; headers: Record<string, string>; body?: string }): Promise<ProviderHTTPResponse>;
    loadState(options: { provider: MobileMusicProvider }): Promise<{ value: string }>;
    saveState(options: { provider: MobileMusicProvider; value: string }): Promise<void>;
}
export const FoliaMusicProviders = registerPlugin<MusicProvidersPlugin>('FoliaMusicProviders');
