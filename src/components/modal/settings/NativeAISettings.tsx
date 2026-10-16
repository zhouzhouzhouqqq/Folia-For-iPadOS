import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isNativeIOS } from '../../../platform/capabilities';
import { FoliaAI, type NativeAIDraft, type NativeAISettings } from '../../../platform/ios/ai';
import { testNativeAIConnection } from '../../../services/nativeAi/client';
import { SettingsAnchor } from './navigation/SettingsAnchorContext';

// Personal AI connection editor. Secrets are write-only after saving and excluded from visual configuration export.
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent';
const blank: NativeAIDraft = { provider: 'openai', apiUrl: OPENAI_URL, model: '', temperature: 0.7, stream: false, apiKey: '' };
const draftFrom = (settings: NativeAISettings): NativeAIDraft => ({ provider: settings.provider, apiUrl: settings.apiUrl,
    model: settings.model, temperature: settings.temperature, stream: settings.stream, apiKey: '' });

function Editor() {
    const { t } = useTranslation();
    const [saved, setSaved] = useState<NativeAISettings | null>(null);
    const [draft, setDraft] = useState<NativeAIDraft>(blank);
    const [busy, setBusy] = useState(true);
    const [status, setStatus] = useState('');
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        let active = true;
        FoliaAI.getSettings().then(value => {
            if (active) { setSaved(value); setDraft(draftFrom(value)); setLoaded(true); }
        }).catch(() => { if (active) setStatus(t('nativeAi.loadError')); })
            .finally(() => { if (active) setBusy(false); });
        return () => { active = false; };
    }, [t]);
    const dirty = !saved || JSON.stringify(draft) !== JSON.stringify(draftFrom(saved));
    const update = (change: Partial<NativeAIDraft>) => { setDraft(current => ({ ...current, ...change })); setStatus(''); };
    const action = async (operation: () => Promise<void>) => {
        setBusy(true); setStatus('');
        try { await operation(); }
        catch (error) { setStatus(error instanceof Error ? error.message : t('nativeAi.failed')); }
        finally { setBusy(false); }
    };
    const save = (event: React.FormEvent) => {
        event.preventDefault();
        void action(async () => {
            const value = await FoliaAI.saveSettings(draft);
            setSaved(value); setDraft(draftFrom(value)); setStatus(t('nativeAi.saved'));
        });
    };
    const test = () => void action(async () => {
        const result = await testNativeAIConnection();
        setStatus(result.ok ? t('nativeAi.testSuccess', { reply: result.text || t('nativeAi.emptyReply'), ms: result.durationMs })
            : t('nativeAi.testFailure', { error: result.error ?? result.errorKind }));
    });
    const clear = () => {
        if (!window.confirm(t('nativeAi.clearConfirm'))) return;
        void action(async () => {
            await FoliaAI.clearSettings();
            const value = await FoliaAI.getSettings();
            setSaved(value); setDraft(draftFrom(value)); setStatus(t('nativeAi.cleared'));
        });
    };
    const input = 'block w-full p-2 rounded-lg border border-current/15 bg-transparent text-base';
    return <SettingsAnchor anchorId="nativeAi" label={t('nativeAi.title')} className="p-4 rounded-xl border border-current/10 space-y-3">
        <h3 className="text-sm font-semibold">{t('nativeAi.title')}</h3>
        <p className="text-xs opacity-70 whitespace-pre-line">{t('nativeAi.description')}</p>
        <form onSubmit={save} className="space-y-3">
            <fieldset disabled={busy || !loaded} className="space-y-3 disabled:opacity-60">
                <label className="block text-sm">{t('nativeAi.provider')}
                    <select className={input} value={draft.provider} onChange={event => {
                        const provider = event.target.value as NativeAIDraft['provider'];
                        update({ provider, apiUrl: provider === 'gemini' ? GEMINI_URL : OPENAI_URL, apiKey: '', stream: false });
                    }}><option value="openai">OpenAI Compatible</option><option value="gemini">Google Gemini</option></select>
                </label>
                {draft.provider === 'openai' && <label className="block text-sm">{t('nativeAi.url')}
                    <input type="url" className={input} value={draft.apiUrl} onChange={event => update({ apiUrl: event.target.value })}
                        autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder="https://" required />
                </label>}
                {draft.provider === 'openai' && <label className="block text-sm">{t('nativeAi.model')}
                    <input className={input} value={draft.model} onChange={event => update({ model: event.target.value })}
                        autoCapitalize="none" autoCorrect="off" spellCheck={false} placeholder={t('nativeAi.modelHint')} />
                </label>}
                {draft.provider === 'gemini' && <p className="text-xs opacity-70">{t('nativeAi.geminiHint')}</p>}
                <label className="block text-sm">{t('nativeAi.key')}
                    <input type="password" className={input} value={draft.apiKey} onChange={event => update({ apiKey: event.target.value })}
                        autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                        placeholder={t(saved?.hasKey ? 'nativeAi.keySaved' : 'nativeAi.keyRequired')} />
                </label>
                <p className="text-xs opacity-70">{t('nativeAi.keyHint')}</p>
                {draft.provider === 'openai' && <>
                    <label className="block text-sm">{t('nativeAi.temperature')}
                        <input type="number" className={input} min={0} max={2} step={0.1} value={draft.temperature}
                            onChange={event => update({ temperature: event.target.valueAsNumber })} required />
                    </label>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.stream}
                        onChange={event => update({ stream: event.target.checked })} />{t('nativeAi.stream')}</label>
                </>}
                <button type="submit" className="px-4 py-2 rounded-lg bg-current/10">{t('nativeAi.save')}</button>
            </fieldset>
        </form>
        <div className="flex flex-wrap gap-3 text-sm">
            <button type="button" className="px-4 py-2 rounded-lg bg-current/10 disabled:opacity-40"
                disabled={busy || dirty || !saved?.hasKey} onClick={test}>{t('nativeAi.test')}</button>
            <button type="button" className="px-4 py-2 rounded-lg bg-current/10 disabled:opacity-40"
                disabled={busy || !saved?.hasKey} onClick={clear}>{t('nativeAi.clear')}</button>
        </div>
        <p className="text-xs opacity-70">{t('nativeAi.testHint')}</p>
        <p className="text-xs opacity-70">{t('nativeAi.useHint')}</p>
        <p role="status" aria-live="polite" className="text-xs break-words whitespace-pre-wrap">{busy ? t('nativeAi.busy') : status}</p>
    </SettingsAnchor>;
}

export default function NativeAISettings() { return isNativeIOS() ? <Editor /> : null; }
