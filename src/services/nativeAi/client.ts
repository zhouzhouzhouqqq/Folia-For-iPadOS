import { aiTextClient } from './engine';
import { FoliaAI, type NativeAISettings } from '../../platform/ios/ai';
import { requireNativeAiConsent } from '../../platform/ios/dataConsent';

// Reuse desktop request negotiation, reasoning policy and SSE parser over credential-free native transport.
export const nativeAIStore = (settings: NativeAISettings) => ({
    get: (key: string) => ({
        AI_PROVIDER: settings.provider, OPENAI_API_URL: settings.apiUrl, OPENAI_API_MODEL: settings.model,
        OPENAI_API_TEMPERATURE: settings.temperature, OPENAI_API_STREAM: settings.stream,
        OPENAI_API_KEY: settings.hasKey ? 'native-keychain' : '', GEMINI_API_KEY: settings.hasKey ? 'native-keychain' : '',
    } as Record<string, unknown>)[key],
});

export const nativeAIFetch = (settings: NativeAISettings, signal?: AbortSignal) => async (
    url: string, init: RequestInit = {},
): Promise<Response> => {
    if (signal?.aborted || init.signal?.aborted) throw new DOMException('AI request cancelled', 'AbortError');
    const id = crypto.randomUUID();
    const abort = () => { void FoliaAI.cancel({ id }).catch(() => undefined); };
    signal?.addEventListener('abort', abort, { once: true });
    init.signal?.addEventListener('abort', abort, { once: true });
    try {
        // Bridge carries prompts and a settings revision, never the stored API key or arbitrary headers.
        const request = FoliaAI.request({ id, revision: settings.revision, url, body: String(init.body ?? ''), timeoutMs: 120_000 });
        // Cancellation can happen while the asynchronous bridge is registering the native task.
        if (signal?.aborted || init.signal?.aborted) abort();
        const reply = await request;
        if (signal?.aborted || init.signal?.aborted) throw new DOMException('AI request cancelled', 'AbortError');
        return new Response(reply.body, { status: reply.status, headers: { 'Content-Type': reply.contentType } });
    } catch (error) {
        if (signal?.aborted || init.signal?.aborted || (error as { code?: string })?.code === 'AI_CANCELLED') {
            throw new DOMException('AI request cancelled', 'AbortError');
        }
        throw error;
    } finally {
        signal?.removeEventListener('abort', abort);
        init.signal?.removeEventListener('abort', abort);
    }
};

export async function nativeAIContext(signal?: AbortSignal) {
    const settings = await FoliaAI.getSettings();
    if (!settings.hasKey) throw new Error('AI API key is not configured. Open Settings → Integrations → AI.');
    requireNativeAiConsent(settings.apiUrl, 'direct');
    return { settings, store: nativeAIStore(settings), customFetch: nativeAIFetch(settings, signal) };
}

/** Explicit user action only: same provider engine as generation, sends a fixed hello and no lyrics. */
export async function testNativeAIConnection(): Promise<AiConnectionTestResult> {
    const settings = await FoliaAI.getSettings();
    if (!settings.hasKey) throw new Error('Save an AI API key first.');
    return aiTextClient.runAiConnectionTest({ provider: settings.provider, apiUrl: settings.apiUrl,
        apiKey: 'native-keychain', model: settings.model, stream: settings.stream }, {
        customFetch: nativeAIFetch(settings),
    });
}
