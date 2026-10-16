import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { FoliaAutomix, type NativeAutomixModel } from '../../../platform/ios/automix';
import { modelsPresent, refreshModelAvailability, subscribeModelAvailability } from '../../../services/automix/modelAvailability';
import { cancelNativeInference, nativeInferenceError, subscribeNativeInferenceError } from '../../../services/automix/nativeInference';

// iPad model management within the original transition section; every installed file is SHA-256 verified natively.
export default function NativeAutomixModelsSection() {
    const { t } = useTranslation();
    const present = useSyncExternalStore(subscribeModelAvailability, modelsPresent);
    const inferenceError = useSyncExternalStore(subscribeNativeInferenceError, nativeInferenceError);
    const [busy, setBusy] = useState(false), [progress, setProgress] = useState<number | null>(null), [error, setError] = useState('');
    useEffect(() => {
        let disposed = false;
        const handle = FoliaAutomix.addListener('modelProgress', event => { if (!disposed) setProgress(event.fraction); });
        void refreshModelAvailability();
        return () => { disposed = true; void handle.then(value => value.remove()); };
    }, []);
    const act = async (operation: () => Promise<unknown>) => {
        setBusy(true); setError(''); setProgress(null);
        try { await operation(); }
        catch (failure) { setError(failure instanceof Error ? failure.message : t('nativeAutomix.failed')); }
        finally { await refreshModelAvailability(); setBusy(false); setProgress(null); }
    };
    const button = 'px-3 py-2 rounded-lg border border-current/15 text-xs disabled:opacity-40';
    return <div id="automix-models" className="rounded-lg border border-current/15 p-3 space-y-3">
        <h4 className="font-semibold text-sm">{t('nativeAutomix.title')}</h4>
        <p className="text-xs opacity-70">{t('nativeAutomix.description')}</p>
        <p className="text-xs opacity-70">{t('nativeAutomix.memory')}</p>
        {(['beat_this', 'htdemucs'] as NativeAutomixModel[]).map(name => <div key={name} className="flex flex-wrap items-center justify-between gap-2 border-t border-current/10 pt-3">
            <div className="text-sm"><span className="font-medium">{name === 'beat_this' ? 'Beat This! · 83.1 MB' : 'HTDemucs · 107.9 MB'}</span>
                <div className="text-xs opacity-60">{t(present[name] ? 'nativeAutomix.installed' : 'nativeAutomix.missing')}</div></div>
            <div className="flex flex-wrap gap-2">
                {!present[name] && <button className={button} disabled={busy} onClick={() => void act(() => FoliaAutomix.downloadModel({ name }))}>{t('nativeAutomix.download')}</button>}
                <button className={button} disabled={busy} onClick={() => void act(() => FoliaAutomix.importModel({ name }))}>{t('nativeAutomix.import')}</button>
                {present[name] && <button className={button} disabled={busy} onClick={() => {
                    if (window.confirm(t('nativeAutomix.removeConfirm'))) void act(() => FoliaAutomix.removeModel({ name }));
                }}>{t('nativeAutomix.remove')}</button>}
            </div>
        </div>)}
        {busy && <div className="flex items-center gap-3 text-xs" role="status">
            <span>{progress === null ? t('nativeAutomix.working') : `${t('nativeAutomix.downloading')} ${Math.round(progress * 100)}%`}</span>
            <button className={button} onClick={() => void cancelNativeInference()}>{t('common.cancel')}</button>
        </div>}
        {(error || inferenceError) && <p role="alert" className="text-xs text-amber-500 break-words">{t('nativeAutomix.error', { error: error || inferenceError })}</p>}
        <p className="text-xs opacity-60">{t('nativeAutomix.cache')}</p>
    </div>;
}
