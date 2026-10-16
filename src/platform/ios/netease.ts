import { registerPlugin } from '@capacitor/core';

// Typed direct-provider boundary. Swift owns protocol encryption, HTTPS and the installation Keychain session.
export interface NeteaseDirectOptions { crypto?: string; cookie?: string | Record<string, unknown>; checkToken?: string | boolean }
export interface NeteaseEnvelope { status: number; body: Record<string, any>; cookie: string[] }
interface FoliaNeteasePlugin {
    request(options: { uri: string; data: Record<string, unknown>; options: NeteaseDirectOptions }): Promise<NeteaseEnvelope>;
    getState(): Promise<{ mode: string; authenticated: boolean; anonymous: boolean; hasExchangeKey: boolean; bootstrapWarning: string }>;
}
export const FoliaNetease = registerPlugin<FoliaNeteasePlugin>('FoliaNetease');
