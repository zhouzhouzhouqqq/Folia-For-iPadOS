import { FoliaDevice } from '../../platform/ios/device';
import { nativeStorageUrl } from '../../platform/ios/files';
import { nativeModList } from './host';

// Per-mod picker grants reference sandbox copies, never permanent access to the external source.
interface Grant { path: string; directory: string; name: string }
const indexKey = (id: string) => `folia-ios-mod-files:${id}`;
const readGrants = (id: string): Record<string, Grant> => {
    try { return JSON.parse(localStorage.getItem(indexKey(id)) || '{}'); } catch { return {}; }
};
const loaded = (id: string) => nativeModList().some(mod => mod.id === id && mod.status === 'loaded');
const temporaryCopies = new Map<string, Set<string>>();
const pendingKey = 'folia-ios-mod-temporary-files';
function retainTemporary(id: string, directory: string) {
    const paths = temporaryCopies.get(id) ?? new Set<string>();
    paths.add(directory); temporaryCopies.set(id, paths);
    const pending: string[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    localStorage.setItem(pendingKey, JSON.stringify([...new Set([...pending, directory])]));
}
export async function cleanTemporaryModCopies() {
    const pending: string[] = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    const failed: string[] = [];
    for (const path of pending) {
        if (!/^libraries\/[A-Fa-f0-9-]+\//.test(path)) continue;
        try { await FoliaDevice.removeFile({ path }); } catch { failed.push(path); }
    }
    localStorage.setItem(pendingKey, JSON.stringify(failed));
}
async function handle(grant: Grant, grantId?: string) {
    const stat = await FoliaDevice.statFile({ path: grant.path });
    const url = nativeStorageUrl(grant.path);
    if (stat.directory || !url) throw new Error('file-unavailable');
    return { url, name: grant.name, size: stat.size, ...(grantId ? { grantId } : {}) };
}
export async function nativeModPickFile(id: string, accept: string, persist: boolean) {
    if (!loaded(id)) return { ok: false, error: 'mod-disabled' };
    const picked = await FoliaDevice.importLibrary({ files: true, single: true, accept });
    if (picked.cancelled || !picked.path) return { ok: true, result: null };
    const directory = picked.path;
    try {
        const entries = (await FoliaDevice.listFiles({ path: directory })).entries;
        const file = entries.find(entry => entry.kind === 'file' && !/[/\\\0]/.test(entry.name) && entry.name !== '..' && entry.name !== '.');
        if (!file) throw new Error('file-unavailable');
        const grant: Grant = { directory, name: file.name, path: `${directory}/${file.name}` };
        if (persist) {
            const grants = readGrants(id), grantId = crypto.randomUUID();
            grants[grantId] = grant; localStorage.setItem(indexKey(id), JSON.stringify(grants));
            return { ok: true, result: await handle(grant, grantId) };
        }
        retainTemporary(id, directory);
        return { ok: true, result: await handle(grant) };
    } catch (error) {
        await FoliaDevice.removeFile({ path: directory }).catch(() => undefined);
        throw error;
    }
}
export async function nativeModRestoreFile(id: string, grantId: string) {
    if (!loaded(id)) return { ok: false, error: 'mod-disabled' };
    const grants = readGrants(id);
    if (!Object.hasOwn(grants, grantId)) return { ok: true, result: null };
    try { return { ok: true, result: await handle(grants[grantId], grantId) }; }
    catch { delete grants[grantId]; localStorage.setItem(indexKey(id), JSON.stringify(grants)); return { ok: true, result: null }; }
}
export async function nativeModReleaseFile(id: string, grantId: string) {
    if (!loaded(id)) return { ok: false, error: 'mod-disabled' };
    const grants = readGrants(id);
    if (!Object.hasOwn(grants, grantId)) return { ok: true, result: false };
    // Keep already-issued URLs valid until this session ends; startup reclaims the copy.
    retainTemporary(id, grants[grantId].directory);
    delete grants[grantId]; localStorage.setItem(indexKey(id), JSON.stringify(grants));
    return { ok: true, result: true };
}
export async function removeNativeModFiles(id: string) {
    const paths = new Set([...Object.values(readGrants(id)).map(grant => grant.directory), ...(temporaryCopies.get(id) ?? [])]);
    for (const path of paths) await FoliaDevice.removeFile({ path });
    localStorage.removeItem(indexKey(id)); temporaryCopies.delete(id);
}
