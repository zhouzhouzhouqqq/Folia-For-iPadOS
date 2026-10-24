import { isNativeIOS } from '../capabilities';
import { FoliaDevice } from './device';
import { hasWebMediaSession } from '../../utils/mediaSessionSync';

// WebKit owns a separate audio session: the host AVAudioSession alone does not exempt Web Audio from background interruption.
interface WebAudioSession extends EventTarget {
    type: string;
    readonly state?: string;
}
const webAudioSession = (): WebAudioSession | undefined => (
    typeof navigator === 'undefined' ? undefined : (navigator as Navigator & { audioSession?: WebAudioSession }).audioSession
);
let reportedMissingSession = false;
const pendingResumes = new WeakSet<AudioContext>();

/** Configure host controls without acquiring audio focus or gating WebKit media playback. */
export function prepareIOSNativeMediaSession(): void {
    if (!isNativeIOS()) return;
    try {
        void FoliaDevice.configureAudio({ webMediaSession: hasWebMediaSession() }).catch(error => console.warn('[iOS audio] Native media session configuration failed', error));
    } catch (error) {
        console.warn('[iOS audio] Native media session configuration failed', error);
    }
}

/** WebKit may leave resume pending until media starts. Start both in the same task, with one existing graph. */
export function resumeIOSAudioContext(context: AudioContext | null): void {
    if (!isNativeIOS() || !context || context.state === 'running' || context.state === 'closed' || pendingResumes.has(context)) return;
    pendingResumes.add(context);
    try {
        void context.resume().catch(error => console.warn('[iOS audio] Graph resume failed', error))
            .finally(() => pendingResumes.delete(context));
    } catch (error) {
        pendingResumes.delete(context);
        console.warn('[iOS audio] Graph resume failed', error);
    }
}

export function configureIOSWebAudioSession(): boolean {
    if (!isNativeIOS()) return false;
    try {
        const session = webAudioSession();
        if (!session) {
            if (!reportedMissingSession) console.warn('[iOS audio] WebKit AudioSession API is unavailable; background Web Audio requires device verification.');
            reportedMissingSession = true;
            return false;
        }
        if (session.type !== 'playback') session.type = 'playback';
        return session.type === 'playback';
    } catch (error) {
        console.warn('[iOS audio] Could not select WebKit playback session', error);
        return false;
    }
}

/** Recover the existing graph on lifecycle events, including background suspension. No background polling. */
export function bindIOSAudioContextLifecycle(context: AudioContext, isPlaybackRequested: () => boolean): () => void {
    if (!isNativeIOS()) return () => {};
    const session = webAudioSession();
    let disposed = false;
    let resuming = false;
    const resume = () => {
        if (disposed || resuming || !isPlaybackRequested()
            || session?.state === 'interrupted' || context.state === 'closed' || context.state === 'running') return;
        // A hidden page can still receive the suspension event before WebKit freezes its JS.
        // Recover only an active playback session there; never acquire focus over another app.
        if (document.visibilityState !== 'visible' && session?.state !== 'active') return;
        if ((context.state as string) === 'interrupted' && session?.state !== 'active') return;
        configureIOSWebAudioSession();
        resuming = true;
        // Only resume the context. Never start another element/engine, seek, or rebuild effects on a visibility change.
        void context.resume().catch(error => console.warn('[iOS audio] Existing graph could not resume', error))
            .finally(() => { resuming = false; });
    };
    const visibility = () => {
        console.info('[iOS audio] visibility', document.visibilityState, 'context', context.state,
            'session', session?.type ?? 'unavailable', session?.state ?? 'unknown', 'requested', isPlaybackRequested());
        resume();
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pageshow', resume);
    session?.addEventListener('statechange', resume);
    context.addEventListener('statechange', resume);
    return () => {
        disposed = true;
        document.removeEventListener('visibilitychange', visibility);
        window.removeEventListener('pageshow', resume);
        session?.removeEventListener('statechange', resume);
        context.removeEventListener('statechange', resume);
    };
}
