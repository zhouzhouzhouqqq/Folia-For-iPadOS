import { hasNativeAutomix } from '../../platform/ios/automix';
import { cancelNativeInference } from './nativeInference';

// Flush queued model work when WebKit hides. Native notifications independently cancel an already-running job.
export function installNativeAutomixLifecycle(): () => void {
    if (!hasNativeAutomix()) return () => {};
    const changed = () => {
        if (document.visibilityState === 'hidden') void cancelNativeInference().catch(() => undefined);
    };
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
}
