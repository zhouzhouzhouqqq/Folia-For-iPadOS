import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { installNativeMod, nativeModList, onNativeModsChanged, removeNativeMod, setNativeModEnabled, notifyNativeModsChanged } from './host';
import { ModSurfaceRenderer } from '../ModSurfaceRenderer';
import { useModsStore } from '../useModsStore';
import { DEFAULT_THEME } from '../../services/baseThemes';
import type { Theme } from '../../types';
import { useDesktopSettingsStore } from '../../stores/useDesktopSettingsStore';

// src/mods/ios/NativeModsSettings.tsx — explicit frontend-package import, trust and lifecycle controls.
export default function NativeModsSettings({ theme = DEFAULT_THEME, isDaylight = false }: { theme?: Theme; isDaylight?: boolean }) {
    const { t } = useTranslation();
    const [mods, setMods] = useState(nativeModList);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const enabled = useDesktopSettingsStore(state => state.modSystemEnabled);
    const toggleSystem = useDesktopSettingsStore(state => state.handleToggleModSystem);
    useEffect(() => {
        const refresh = () => { setMods(nativeModList()); };
        const unsubscribe = onNativeModsChanged(refresh); refresh(); void useModsStore.getState().refresh(); return unsubscribe;
    }, [enabled]);
    const act = async (operation: () => Promise<unknown>) => {
        setBusy(true); setMessage('');
        try { await operation(); notifyNativeModsChanged(); }
        catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
        finally { setBusy(false); }
    };
    return <div className="space-y-4 text-sm" style={{ color: 'var(--text-primary)' }}>
        <h3 className="font-semibold">{t('nativeMods.title')}</h3>
        <p className="opacity-60 text-xs">{t('nativeMods.description')}</p>
        <label className="flex gap-2"><input type="checkbox" checked={enabled} onChange={event => toggleSystem(event.target.checked)} />{t('options.enableModSystem')}</label>
        <input type="file" accept=".zip,application/zip" disabled={busy} aria-label={t('nativeMods.install')} onChange={event => {
            const file = event.target.files?.[0]; if (file) void act(() => installNativeMod(file)); event.target.value = '';
        }} />
        {mods.map(mod => <div key={mod.id} className="rounded-xl border border-current/10 p-4 space-y-2">
            <div className="font-medium">{mod.name} {mod.version}</div>
            <p className="opacity-60 text-xs">{mod.description}</p>
            <p className="text-xs">{mod.status}{mod.trustStale ? ` · ${t('nativeMods.changed')}` : ''}{mod.error ? ` · ${mod.error}` : ''}</p>
            <div className="flex gap-3">
                <button disabled={busy || !enabled} onClick={() => void act(() => setNativeModEnabled(mod.id, !mod.enabled))} className="px-3 py-2 border rounded-lg">{t(mod.enabled ? 'nativeMods.disable' : 'nativeMods.enable')}</button>
                <button disabled={busy} onClick={() => { if (window.confirm(t('nativeMods.removeConfirm', { name: mod.name }))) void act(() => removeNativeMod(mod.id)); }} className="px-3 py-2 border rounded-lg">{t('nativeMods.remove')}</button>
            </div>
            <ModSurfaceRenderer modId={mod.id} theme={theme} isDaylight={isDaylight} />
        </div>)}
        <p role="status">{message}</p>
    </div>;
}
