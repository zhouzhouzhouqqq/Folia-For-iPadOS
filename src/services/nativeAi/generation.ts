import { aiTextClient } from './engine';
import { THEME_JSON_SCHEMA, THEME_JSON_SCHEMA_NAME, THEME_MAX_OUTPUT_TOKENS } from '../../../shared/themeGenerationSchema.mjs';
import { SEGMENTATION_JSON_SCHEMA, SEGMENTATION_MAX_OUTPUT_TOKENS,
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
    const content = await aiTextClient.runAiJsonCompletion({ ...context, task: 'theme',
        systemPrompt: buildThemeSystemPrompt(true),
        geminiSchema: getGeminiResponseSchema(),
        sourcePrompt: buildThemeSourcePrompt(lyricsText.slice(0, 2000), Boolean(options?.isPureMusic), options?.songTitle),
        schema: THEME_JSON_SCHEMA, schemaName: THEME_JSON_SCHEMA_NAME,
        answerTokens: THEME_MAX_OUTPUT_TOKENS,
    });
    const theme = sanitizeDualTheme(parseAiThemeJsonInput(content));
    theme.light.fontStyle = theme.dark.fontStyle = 'sans';
    theme.light.animationIntensity = theme.dark.animationIntensity = 'normal';
    theme.light.provider = theme.dark.provider = (await aiTextClient.aiProviderLabel(context.store)).replace('(Local)', '(iPad)');
    return applyStoredAnimationIntensityToDualTheme(theme);
}

export async function segmentNativeAILyrics(lines: string[], signal?: AbortSignal): Promise<(string[] | null)[]> {
    const context = await nativeAIContext(signal);
    const content = await aiTextClient.runAiJsonCompletion({ ...context, task: 'segmentation',
        systemPrompt: buildSegmentationSystemPrompt(), sourcePrompt: buildSegmentationSourcePrompt(lines),
        schema: SEGMENTATION_JSON_SCHEMA, schemaName: SEGMENTATION_SCHEMA_NAME,
        answerTokens: SEGMENTATION_MAX_OUTPUT_TOKENS,
    });
    // Original parser realigns whitespace and rejects rewritten lines, preserving usable partial results.
    return parseSegmentationResponse(content, lines).boundaries;
}
