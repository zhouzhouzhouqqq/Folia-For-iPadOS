import { registerPlugin } from '@capacitor/core';

// Typed contract: saved personal credentials are held in Keychain, never returned to the web layer.
export interface NativeAISettings {
    provider: 'openai' | 'gemini';
    apiUrl: string;
    model: string;
    temperature: number;
    stream: boolean;
    hasKey: boolean;
    revision: string;
}
export type NativeAIDraft = Pick<NativeAISettings, 'provider' | 'apiUrl' | 'model' | 'temperature' | 'stream'> & { apiKey: string };
interface NativeAIPlugin {
    getSettings(): Promise<NativeAISettings>;
    saveSettings(settings: NativeAIDraft): Promise<NativeAISettings>;
    clearSettings(): Promise<void>;
    request(options: { id: string; revision: string; url: string; body: string; method?: 'GET' | 'POST'; timeoutMs: number }): Promise<{ status: number; contentType: string; body: string }>;
    cancel(options: { id: string }): Promise<void>;
}
export const FoliaAI = registerPlugin<NativeAIPlugin>('FoliaAI');
