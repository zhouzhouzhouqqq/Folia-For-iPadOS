import React from 'react';
import { useTranslation } from 'react-i18next';
import { platformCapabilities } from '../../../platform/capabilities';
import { startNativeRecording, stopNativeRecording, useNativeRecordingStore } from '../../../platform/ios/recording';

// src/components/modal/settings/NativeRecordingSettings.tsx — system-authorized capture, with explicit output differences.
export default function NativeRecordingSettings() {
    const { t } = useTranslation();
    const { recording, busy, error } = useNativeRecordingStore();
    if (!platformCapabilities().nativeFiles) return null;
    return <div className="p-4 rounded-xl border border-current/10 space-y-3" style={{ color: 'var(--text-primary)' }}>
        <h3 className="text-sm font-semibold">{t('nativeRecording.title')}</h3>
        <p className="text-xs opacity-60">{t('nativeRecording.description')}</p>
        <button disabled={busy} className="px-3 py-2 rounded-lg border border-current/20 text-sm" onClick={() => void (recording ? stopNativeRecording() : startNativeRecording()).catch(() => undefined)}>
            {t(recording ? 'nativeRecording.stop' : 'nativeRecording.start')}
        </button>
        {error && <p role="alert" className="text-xs">{error}</p>}
    </div>;
}
