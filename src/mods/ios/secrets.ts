import { FoliaMusicProviders } from '../../platform/ios/musicProviders';
import { nativeModList } from './host';
import type { ModSecretChange } from '../types';

// Folium 1.7 secrets use a dedicated Keychain namespace, outside mod data/config exports.
const declarations = new Map<string, Set<string>>();
const listeners = new Set<(change: ModSecretChange) => void>();
let tail: Promise<unknown> = Promise.resolve();
export const onNativeModSecretChanged = (callback: (change: ModSecretChange) => void) => {
    listeners.add(callback); return () => { listeners.delete(callback); };
};
export function nativeModSecrets(id: string, operation: string, key?: string | readonly string[], value?: string | null) {
    const task = tail.catch(() => undefined).then(async () => {
        if (!nativeModList().some(mod => mod.id === id && mod.status === 'loaded')) return { ok: false, error: 'mod-not-active' };
        if (operation === 'declare') {
            if (!Array.isArray(key) || key.length > 64 || !key.every(value => typeof value === 'string' && value.length > 0 && value.length <= 128)) return { ok: false, error: 'invalid-secret-keys' };
            const next = new Set([...(declarations.get(id) ?? []), ...key]);
            if (next.size > 64) return { ok: false, error: 'too-many-secret-keys' };
            declarations.set(id, next);
            return { ok: true };
        }
        const { value: saved } = await FoliaMusicProviders.loadState({ provider: 'mod-secrets' });
        if (!nativeModList().some(mod => mod.id === id && mod.status === 'loaded')) return { ok: false, error: 'mod-not-active' };
        const all = JSON.parse(saved);
        if (!all || typeof all !== 'object' || Array.isArray(all)) throw new Error('Invalid secure mod storage');
        const entries: Record<string, string> = Object.hasOwn(all, id) ? all[id] : Object.create(null);
        if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.values(entries).every(value => typeof value === 'string')) throw new Error('Invalid secure mod record');
        if (operation === 'state') return { ok: true, result: { persistent: true, stored: Object.keys(entries) } };
        if (typeof key !== 'string' || !key.length || key.length > 128) return { ok: false, error: 'invalid-secret-key' };
        if (!declarations.get(id)?.has(key) && !Object.hasOwn(entries, key) && (operation === 'set' || declarations.has(id))) return { ok: false, error: `secret-undeclared:${key}` };
        if (operation === 'get') return { ok: true, result: Object.hasOwn(entries, key) ? entries[key] : null };
        if (operation === 'has') return { ok: true, result: Object.hasOwn(entries, key) };
        if (operation !== 'set' || value !== null && (typeof value !== 'string' || new TextEncoder().encode(value).length > 8192)) return { ok: false, error: 'invalid-secret-value' };
        if (value === null) delete entries[key];
        else Object.defineProperty(entries, key, { value, enumerable: true, configurable: true, writable: true });
        Object.defineProperty(all, id, { value: entries, enumerable: true, configurable: true, writable: true });
        await FoliaMusicProviders.saveState({ provider: 'mod-secrets', value: JSON.stringify(all) });
        for (const listener of listeners) {
            try { listener({ modId: id, key }); }
            catch { console.warn('[Folium] Secret change listener failed'); }
        }
        return { ok: true };
    }).catch(() => ({ ok: false, error: 'secure-storage-unavailable' }));
    tail = task;
    return task;
}
