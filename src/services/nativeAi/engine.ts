import * as originalClient from '../../../shared/aiTextClient.mjs';

// Typed browser boundary for the generated ESM mirror of the original desktop provider engine.
interface CompletionOptions {
    store: { get(key: string): unknown };
    systemPrompt: string;
    sourcePrompt: string;
    schema: object;
    schemaName: string;
    task: 'theme' | 'segmentation';
    geminiSchema?: object;
    customFetch: (url: string, init?: RequestInit) => Promise<Response>;
    timeoutMs?: number;
    answerTokens?: number;
}
export const aiTextClient = originalClient as unknown as {
    aiProviderLabel(store: CompletionOptions['store']): Promise<string>;
    listAiModels(input: AiConnectionTestPayload, options: { customFetch: CompletionOptions['customFetch'] }): Promise<AiModelListResult>;
    runAiJsonCompletion(options: CompletionOptions): Promise<string>;
    runAiConnectionTest(input: AiConnectionTestPayload, options: {
        customFetch: CompletionOptions['customFetch']; timeoutMs?: number;
    }): Promise<AiConnectionTestResult>;
};
