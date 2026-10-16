import { useEffect, useState, useSyncExternalStore } from 'react';
import { hasNativeAutomix } from '../../platform/ios/automix';
import { modelsPresent, subscribeModelAvailability } from './modelAvailability';
import { waitForNativeInferenceIdle } from './nativeInference';
import { profilesSettled } from './profileService';

// Requeue the current pair after native model installation or a cancelled background analysis has drained.
export function useNativeAutomixRevision(): string {
    const models = useSyncExternalStore(subscribeModelAvailability, modelsPresent);
    const [revision, setRevision] = useState(0);
    useEffect(() => {
        if (!hasNativeAutomix()) return;
        let disposed = false;
        const visible = async () => {
            if (document.visibilityState !== 'visible') return;
            await waitForNativeInferenceIdle();
            await profilesSettled();
            if (!disposed && document.visibilityState === 'visible') setRevision(value => value + 1);
        };
        document.addEventListener('visibilitychange', visible);
        return () => { disposed = true; document.removeEventListener('visibilitychange', visible); };
    }, []);
    return hasNativeAutomix() ? `${models.beat_this}:${models.htdemucs}:${revision}` : '';
}
