import fs from 'node:fs';
import vm from 'node:vm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildThemeSystemPrompt, buildThemeSourcePrompt, getGeminiResponseSchema } from '../../../shared/themeGenerationPrompt.mjs';
import { browserAIClient } from '../../../dev/ipados/ai/sync-client.mjs';
import { THEME_JSON_SCHEMA } from '../../../shared/themeGenerationSchema.mjs';

// Exercise the original provider engine over a synthetic native bridge: no account, key, or upstream request.
const state = vi.hoisted(() => ({ settings: { provider: 'openai', apiUrl: 'https://ai.example/v1/chat/completions',
    model: 'test-model', temperature: 0.7, stream: false, hasKey: true, revision: 'test-revision' },
    native: true, request: vi.fn(), cancel: vi.fn(), consent: vi.fn() }));
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => state.native }));
vi.mock('../../../src/services/nativeConnections', () => ({ foliaApiUrl: (path: string) => 'https://backend.example' + path }));
vi.mock('../../../src/services/runtimeConfig', () => ({ getWebAiProvider: () => 'openai' }));
vi.mock('../../../src/platform/ios/ai', () => ({ FoliaAI: {
    getSettings: async () => state.settings, request: state.request, cancel: state.cancel,
} }));
vi.mock('../../../src/platform/ios/dataConsent', () => ({ requireNativeAiConsent: state.consent }));
import { generateThemeFromLyrics } from '../../../src/services/aiText';
import { segmentLyricsWithAi } from '../../../src/services/lyricSegmentationAi';
import { nativeAIFetch, testNativeAIConnection } from '../../../src/services/nativeAi/client';
import { generateNativeAITheme, segmentNativeAILyrics } from '../../../src/services/nativeAi/generation';

const variant = { name: '晨光', description: '听见风吹过夏天的那一瞬间我想起了你', backgroundColor: '#eeddcc',
    primaryColor: '#112233', accentColor: '#cc6622', secondaryColor: '#445566',
    wordColors: [{ word: 'sun', color: '#cc6622' }], lyricsIcons: ['Sun'] };
const dual = { light: variant, dark: { ...variant, name: '夜航', backgroundColor: '#112233', primaryColor: '#eeddcc' } };
const reply = (content: string) => ({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content }, finish_reason: 'stop' }] }) });
beforeEach(() => {
    vi.clearAllMocks(); state.native = true;
    state.settings.provider = 'openai'; state.settings.stream = false; state.settings.hasKey = true;
    state.settings.apiUrl = 'https://ai.example/v1/chat/completions';
    state.request.mockResolvedValue(reply(JSON.stringify(dual))); state.cancel.mockResolvedValue({});
    vi.stubGlobal('window', { localStorage: { getItem: () => 'chaotic' } });
});
describe('native AI theme integration', () => {
    it('keeps the browser client mechanically identical to the original provider engine', () => {
        expect(fs.readFileSync('shared/aiTextClient.mjs', 'utf8')).toBe(browserAIClient(fs.readFileSync('shared/aiTextClient.cjs', 'utf8')));
    });
    it('keeps the exact desktop theme instructions, source prompt and Gemini schema', () => {
        const source = fs.readFileSync('electron/main.cjs', 'utf8');
        const start = source.indexOf('function buildThemeSystemPrompt(');
        const end = source.indexOf('\nconst fsp =', start);
        const schemaStart = source.indexOf('function getGeminiResponseSchema()');
        const schemaEnd = source.indexOf('\nconst THEME_JSON_SCHEMA_NAME', schemaStart);
        const context = vm.createContext({});
        const themeSchemaStart = source.indexOf('const THEME_JSON_SCHEMA =');
        vm.runInContext(source.slice(themeSchemaStart, start), context);
        expect(JSON.stringify(THEME_JSON_SCHEMA)).toBe(vm.runInContext('JSON.stringify(THEME_JSON_SCHEMA)', context));
        vm.runInContext(source.slice(schemaStart, schemaEnd) + source.slice(start, end), context);
        expect(buildThemeSystemPrompt(true)).toEqual(vm.runInContext('buildThemeSystemPrompt(true)', context));
        expect(JSON.stringify(getGeminiResponseSchema())).toEqual(vm.runInContext('JSON.stringify(getGeminiResponseSchema())', context));
        expect(buildThemeSourcePrompt('snippet', true, 'title')).toEqual(vm.runInContext('buildThemeSourcePrompt("snippet", true, "title")', context));
    });
    it('generates original palettes, words and icons using only a 2000-character snippet, respecting intensity', async () => {
        const theme = await generateThemeFromLyrics('sun '.repeat(700));
        expect(theme.light.wordColors).toEqual(variant.wordColors);
        expect(theme.dark.lyricsIcons).toEqual(['Sun']);
        expect(theme.light.animationIntensity).toBe('chaotic');
        expect(theme.light.fontStyle).toBe('sans');
        const call = state.request.mock.calls[0][0]; const body = JSON.parse(call.body);
        expect(body.messages[0].content).toBe(buildThemeSystemPrompt(true));
        expect(body.messages[1].content).toBe(buildThemeSourcePrompt('sun '.repeat(700).slice(0, 2000), false));
        expect(call).toEqual({ id: expect.any(String), revision: 'test-revision', url: state.settings.apiUrl,
            body: expect.any(String), timeoutMs: 120000 });
        expect(call).not.toHaveProperty('headers'); expect(call).not.toHaveProperty('apiKey');
        expect(state.consent).toHaveBeenCalledWith(state.settings.apiUrl, 'direct');
    });
    it('parses streamed native responses using the original SSE accumulator', async () => {
        state.settings.stream = true;
        const text = JSON.stringify(dual);
        state.request.mockResolvedValue({ status: 200, contentType: 'text/event-stream', body:
            [text.slice(0, 50), text.slice(50)].map(content => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`).join('') + 'data: [DONE]\n\n' });
        expect((await generateNativeAITheme('sun')).dark.name).toBe('夜航');
        expect(JSON.parse(state.request.mock.calls[0][0].body).stream).toBe(true);
    });
    it('preserves pure instrumental title prompts and the original Gemini schema', async () => {
        state.settings.provider = 'gemini';
        state.settings.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
        state.request.mockResolvedValue({ status: 200, contentType: 'application/json', body: JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(dual) }] } }] }) });
        await generateNativeAITheme('Summer', { isPureMusic: true, songTitle: 'Summer' });
        const body = JSON.parse(state.request.mock.calls[0][0].body);
        expect(body.contents[0].parts[0].text).toContain('Song title: Summer');
        expect(body.generationConfig.responseSchema).toEqual(getGeminiResponseSchema());
    });
    it.each([true, false])('keeps the existing backend route when no native key or when web (native=%s)', async native => {
        state.native = native; state.settings.hasKey = !native;
        const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify(dual), { status: 200 }));
        vi.stubGlobal('fetch', fetch);
        await generateThemeFromLyrics('sun');
        expect(fetch).toHaveBeenCalledWith('https://backend.example/api/generate-theme_openai', expect.anything());
        expect(state.request).not.toHaveBeenCalled();
    });
    it('refuses unapproved lyric transfer without dispatching a request', async () => {
        state.consent.mockImplementationOnce(() => { throw new DOMException('declined', 'AbortError'); });
        await expect(generateNativeAITheme('sun')).rejects.toThrow('declined');
        expect(state.request).not.toHaveBeenCalled();
    });
    it('connection test sends hello only and never a saved secret', async () => {
        state.request.mockResolvedValue(reply('hello back'));
        expect(await testNativeAIConnection()).toMatchObject({ ok: true, text: 'hello back' });
        expect(JSON.parse(state.request.mock.calls[0][0].body).messages).toEqual([{ role: 'user', content: 'hello' }]);
        expect(state.consent).not.toHaveBeenCalled();
    });
    it('cancels a dispatched native request and maps late completion to AbortError', async () => {
        let complete!: (value: ReturnType<typeof reply>) => void;
        state.request.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
        const abort = new AbortController();
        const pending = nativeAIFetch(state.settings as never, abort.signal)(state.settings.apiUrl, { body: '{}' });
        abort.abort(); complete(reply('{}'));
        await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
        expect(state.cancel).toHaveBeenCalledWith({ id: state.request.mock.calls[0][0].id });
    });
    it('reuses segmentation validation and retains only correctly aligned model lines', async () => {
        state.request.mockResolvedValue(reply(JSON.stringify({ lines: [['sun', 'rise'], ['wrong']] })));
        const result = await segmentLyricsWithAi(['sunrise', 'moon']);
        expect(result.boundaries).toEqual([['sun', 'rise'], null]);
    });
});
