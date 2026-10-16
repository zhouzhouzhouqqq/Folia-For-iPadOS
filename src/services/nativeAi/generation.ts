import { aiTextClient } from './engine';
import { THEME_JSON_SCHEMA, THEME_JSON_SCHEMA_NAME } from '../../../shared/themeGenerationSchema.mjs';
import { SEGMENTATION_GEMINI_GENERATION_CONFIG, SEGMENTATION_JSON_SCHEMA, SEGMENTATION_MAX_OUTPUT_TOKENS,
    SEGMENTATION_SCHEMA_NAME, buildSegmentationSourcePrompt, buildSegmentationSystemPrompt,
    parseSegmentationResponse } from '../../../shared/lyricSegmentationPrompt.mjs';
import { buildThemeSystemPrompt, buildThemeSourcePrompt, getGeminiResponseSchema } from '../../../shared/themeGenerationPrompt.mjs';
import { parseAiThemeJsonInput } from '../../utils/aiThemePrompts';
import { sanitizeDualTheme } from '../themeSanitizer';
import { applyStoredAnimationIntensityToDualTheme } from '../themePreferences';
import { nativeAIContext } from './client';

// Device-local counterpart of the original theme/segmentation features, using the original output contracts.
export async function generateNativeAITheme(lyricsText: string, options?: { isPureMusic?: boolean; songTitle?: string }) {
    const context = await nativeAIContext();
    const content = await aiTextClient.runAiJsonCompletion({ ...context,
        systemPrompt: buildThemeSystemPrompt(true),
        geminiResponseSchema: getGeminiResponseSchema(),
        sourcePrompt: buildThemeSourcePrompt(lyricsText.slice(0, 2000), Boolean(options?.isPureMusic), options?.songTitle),
        schema: THEME_JSON_SCHEMA, schemaName: THEME_JSON_SCHEMA_NAME,
        maxTokens: context.settings.provider === 'gemini' ? undefined
            : aiTextClient.detectOpenAICompatibleProvider(context.settings.apiUrl) === 'openai' ? 4096 : 8192,
    });
    const theme = sanitizeDualTheme(parseAiThemeJsonInput(content));
    theme.light.fontStyle = theme.dark.fontStyle = 'sans';
    theme.light.animationIntensity = theme.dark.animationIntensity = 'normal';
    theme.light.provider = theme.dark.provider = context.settings.provider === 'gemini' ? 'Google Gemini (iPad)' : 'OpenAI Compatible (iPad)';
    return applyStoredAnimationIntensityToDualTheme(theme);
}

export async function segmentNativeAILyrics(lines: string[], signal?: AbortSignal): Promise<(string[] | null)[]> {
    const context = await nativeAIContext(signal);
    const content = await aiTextClient.runAiJsonCompletion({ ...context,
        systemPrompt: buildSegmentationSystemPrompt(), sourcePrompt: buildSegmentationSourcePrompt(lines),
        schema: SEGMENTATION_JSON_SCHEMA, schemaName: SEGMENTATION_SCHEMA_NAME,
        geminiGenerationConfig: SEGMENTATION_GEMINI_GENERATION_CONFIG,
        maxTokens: SEGMENTATION_MAX_OUTPUT_TOKENS, disableReasoning: true,
    });
    // Original parser realigns whitespace and rejects rewritten lines, preserving usable partial results.
    return parseSegmentationResponse(content, lines).boundaries;
}
