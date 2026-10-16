import { isNativeIOS } from '../capabilities';
import i18n from '../../i18n/config';

// Native AI calls disclose lyric/title transfer once per destination and session, before any request.
const approved = new Set<string>();
export function requireNativeAiConsent(endpoint: string, mode: 'direct' | 'backend' = 'backend'): void {
    if (!isNativeIOS()) return;
    const destination = new URL(endpoint).origin;
    const key = `${mode}:${destination}`;
    if (approved.has(key)) return;
    if (!window.confirm(i18n.t(mode === 'direct' ? 'nativeAi.consent' : 'nativeConnections.aiConsent', { destination }))) {
        throw new DOMException('AI lyric transfer was declined', 'AbortError');
    }
    approved.add(key);
}
