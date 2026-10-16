import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isNativeIOS } from '../../../platform/capabilities';
import { NATIVE_CONNECTION_KEYS, useNativeConnectionStore } from '../../../stores/useNativeConnectionStore';

// src/components/modal/settings/NativeConnectionsSettings.tsx — device-local HTTPS service configuration.
export default function NativeConnectionsSettings() {
    const { t } = useTranslation();
    const endpoints = useNativeConnectionStore(state => state.endpoints);
    const save = useNativeConnectionStore(state => state.save);
    const [draft, setDraft] = useState(endpoints);
    const [result, setResult] = useState('');
    if (!isNativeIOS()) return null;
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        try { save(draft); window.location.reload(); }
        catch { setResult(t('nativeConnections.invalid')); }
    };
    return <form onSubmit={submit} className="p-4 rounded-xl border border-current/10 space-y-4" style={{ color: 'var(--text-primary)' }}>
        <h3 className="text-sm font-semibold">{t('nativeConnections.title')}</h3>
        <p className="text-xs opacity-60">{t('nativeConnections.description')}</p>
        <p className="text-xs opacity-80">{t('nativeConnections.neteaseSetupHint')}</p>
        {NATIVE_CONNECTION_KEYS.map(key => <label key={key} className="block text-sm space-y-1">
            <span>{t(`nativeConnections.${key}`)}</span>
            <input type="url" inputMode="url" autoCapitalize="none" autoCorrect="off" spellCheck={false}
                value={draft[key]} onChange={event => setDraft(current => ({ ...current, [key]: event.target.value }))}
                placeholder="https://" className="block w-full p-2 rounded-lg border border-current/15 bg-transparent text-base" />
        </label>)}
        <button type="submit" className="px-4 py-2 rounded-lg bg-current/10">{t('nativeConnections.save')}</button>
        <p role="status" className="text-xs opacity-70">{result}</p>
    </form>;
}
