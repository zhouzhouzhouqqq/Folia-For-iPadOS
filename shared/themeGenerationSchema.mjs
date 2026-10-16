// Original theme output contract, shared by the edge API and device-local AI adapter.
export const THEME_JSON_SCHEMA_NAME = 'dual_theme';
export const THEME_MAX_OUTPUT_TOKENS = 4096;

export const THEME_JSON_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    properties: {
        light: {
            type: 'object',
            additionalProperties: false,
            description: 'Theme optimized for light/daylight mode',
            properties: {
                name: { type: 'string', description: 'A creative name for this light theme in Chinese, strictly limited to 10 characters or less' },
                description: { type: 'string', description: 'A creative 1-sentence description of the mood or visual concept in Chinese, strictly limited to 15 to 30 Chinese characters' },
                backgroundColor: { type: 'string', description: 'Hex code for light background' },
                primaryColor: { type: 'string', description: 'Hex code for main text (dark)' },
                accentColor: { type: 'string', description: 'Hex code for highlighted text/effects' },
                secondaryColor: { type: 'string', description: 'Hex code for secondary elements' },
                wordColors: {
                    type: 'array',
                    description: 'List of exact emotional standalone words from the source text and their specific colors; Latin-script words must not contain punctuation or spaces',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            word: { type: 'string' },
                            color: { type: 'string' }
                        },
                        required: ['word', 'color']
                    }
                },
                lyricsIcons: {
                    type: 'array',
                    description: 'List of Lucide icon names related to the source text',
                    items: { type: 'string' }
                }
            },
            required: ['name', 'description', 'backgroundColor', 'primaryColor', 'accentColor', 'secondaryColor', 'wordColors', 'lyricsIcons']
        },
        dark: {
            type: 'object',
            additionalProperties: false,
            description: 'Theme optimized for dark/midnight mode',
            properties: {
                name: { type: 'string', description: 'A creative name for this dark theme in Chinese, strictly limited to 10 characters or less' },
                description: { type: 'string', description: 'A creative 1-sentence description of the mood or visual concept in Chinese, strictly limited to 15 to 30 Chinese characters' },
                backgroundColor: { type: 'string', description: 'Hex code for dark background' },
                primaryColor: { type: 'string', description: 'Hex code for main text (light)' },
                accentColor: { type: 'string', description: 'Hex code for highlighted text/effects' },
                secondaryColor: { type: 'string', description: 'Hex code for secondary elements' },
                wordColors: {
                    type: 'array',
                    description: 'List of exact emotional standalone words from the source text and their specific colors; Latin-script words must not contain punctuation or spaces',
                    items: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            word: { type: 'string' },
                            color: { type: 'string' }
                        },
                        required: ['word', 'color']
                    }
                },
                lyricsIcons: {
                    type: 'array',
                    description: 'List of Lucide icon names related to the source text',
                    items: { type: 'string' }
                }
            },
            required: ['name', 'description', 'backgroundColor', 'primaryColor', 'accentColor', 'secondaryColor', 'wordColors', 'lyricsIcons']
        }
    },
    required: ['light', 'dark']
};
