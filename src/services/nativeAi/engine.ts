import * as originalClient from '../../../shared/aiTextClient.mjs';

// Typed browser boundary for the generated ESM mirror of the original desktop provider engine.
interface CompletionOptions {
    store: { get(key: string): unknown };
    systemPrompt: string;
    sourcePrompt: string;
    schema: object;
    schemaName: string;
    geminiResponseSchema?: object;
    geminiGenerationConfig?: object;
    customFetch: (url: string, init?: RequestInit) => Promise<Response>;
    timeoutMs?: number;
    maxTokens?: number;
    disableReasoning?: boolean;
}
export const aiTextClient = originalClient as unknown as {
    detectOpenAICompatibleProvider(url: string): string;
    runAiJsonCompletion(options: CompletionOptions): Promise<string>;
    runAiConnectionTest(input: AiConnectionTestPayload, options: {
        customFetch: CompletionOptions['customFetch']; timeoutMs?: number;
    }): Promise<AiConnectionTestResult>;
};
