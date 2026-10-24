import { unzipSync, strFromU8 } from 'fflate';
import type { ModRuntimeInfo, ModsListPayload } from '../types';
import type { FoliumFetchInit } from '../folium/contract';
import { FoliaDevice } from '../../platform/ios/device';
import { nativeStorageUrl, writeNativeBlob } from '../../platform/ios/files';
import { useDesktopSettingsStore } from '../../stores/useDesktopSettingsStore';
import i18n from '../../i18n/config';
import { validateManifest, parseDependency, satisfiesRange, satisfiesHostRange } from './manifest.mjs';
import { version as hostVersion } from '../../../package.json';

// src/mods/ios/host.ts — opt-in frontend-only Folium packages stored as immutable digest versions.
interface InstalledMod { info: ModRuntimeInfo; path: string; digest: string; approvedDigest?: string; client: string; dependencies: string[] }
const INDEX = 'folia-ios-mods-v1';
const events = new EventTarget();
const ffmpeg = { available: false, path: null, version: null, candidates: [] };
function readIndex(): InstalledMod[] {
    try { const value = JSON.parse(localStorage.getItem(INDEX) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
}
const saveIndex = (value: InstalledMod[]) => localStorage.setItem(INDEX, JSON.stringify(value));
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
const safePath = (value: string) => Boolean(value && !value.startsWith('/') && !value.includes('\\') && !value.split('/').some(part => !part || part === '.' || part === '..') && !/[\0:]/.test(value));

// Missing or cyclic dependencies stay visible as errors instead of being loaded in an arbitrary order.
export function nativeModList(): ModRuntimeInfo[] {
    const installed = readIndex();
    const enabled = useDesktopSettingsStore.getState().modSystemEnabled;
    const ordered: ModRuntimeInfo[] = [];
    const visiting = new Set<string>();
    const done = new Map<string, ModRuntimeInfo>();
    const visit = (item: InstalledMod): ModRuntimeInfo => {
        if (done.has(item.info.id)) return done.get(item.info.id)!;
        const stale = item.approvedDigest !== item.digest;
        const info: ModRuntimeInfo = { ...item.info, enabled: item.info.enabled && enabled,
            status: 'disabled', clientUrl: null, trustStale: item.info.enabled && stale };
        if (visiting.has(info.id)) return { ...info, status: 'dependency-failed', error: 'dependency-cycle' };
        visiting.add(info.id);
        if (info.enabled && !stale) {
            const blocked = (info.folia && !satisfiesHostRange(hostVersion, info.folia)) || item.dependencies.some(raw => {
                const parsed = parseDependency(raw);
                const dependency = installed.find(value => value.info.id === parsed.id);
                return !parsed.ok || !dependency || !satisfiesRange(dependency.info.version, parsed.range) || visit(dependency).status !== 'loaded';
            });
            if (blocked) { info.status = 'dependency-failed'; info.error = 'dependency-unavailable'; }
            else { info.status = 'loaded'; info.error = null; info.clientUrl = nativeStorageUrl(`${item.path}/${item.client}`); info.loadOrder = ordered.length; }
        }
        visiting.delete(info.id); done.set(info.id, info); ordered.push(info); return info;
    };
    installed.forEach(visit);
    return ordered;
}
export function notifyNativeModsChanged() { events.dispatchEvent(new Event('change')); }
export function onNativeModsChanged(callback: (mods: ModRuntimeInfo[]) => void): () => void {
    const listener = () => callback(nativeModList()); events.addEventListener('change', listener);
    return () => events.removeEventListener('change', listener);
}
export async function listNativeMods(): Promise<ModsListPayload> { return { mods: nativeModList(), ffmpeg, directories: [], startSkipped: false }; }
export async function setNativeModEnabled(id: string, enabled: boolean) {
    const installed = readIndex(); const item = installed.find(value => value.info.id === id);
    if (!item) return { ok: false, error: 'mod-not-found', mods: nativeModList() };
    if (enabled && !window.confirm(i18n.t('nativeMods.confirm', { name: item.info.name, permissions: item.info.permissions.join(', ') || '—', digest: item.digest }))) {
        return { ok: false, error: 'enable-declined', mods: nativeModList() };
    }
    item.info.enabled = enabled;
    if (enabled) item.approvedDigest = item.digest;
    saveIndex(installed); notifyNativeModsChanged();
    return { ok: true, mods: nativeModList() };
}
export async function installNativeMod(file: File): Promise<void> {
    if (!file.name.toLowerCase().endsWith('.zip') || file.size > 20_000_000) throw new Error('Use a mod ZIP up to 20 MB.');
    let size = 0; let count = 0;
    const archive = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter(entry) {
        size += entry.originalSize; count++;
        if (size > 50_000_000 || count > 1000) throw new Error('Mod archive expands beyond the import limit.');
        if (!safePath(entry.name.replace(/\/$/, ''))) throw new Error('Unsafe mod archive path.');
        return !entry.name.endsWith('/');
    } });
    const manifestPaths = Object.keys(archive).filter(path => path === 'mod.json' || path.endsWith('/mod.json'));
    if (manifestPaths.length !== 1) throw new Error('The ZIP must contain one mod.json.');
    const manifestPath = manifestPaths[0]; const prefix = manifestPath.slice(0, -'mod.json'.length);
    const validation = validateManifest(JSON.parse(strFromU8(archive[manifestPath])));
    if (!validation.ok || !('value' in validation)) throw new Error(`Invalid Folium manifest: ${'errors' in validation ? validation.errors.join('; ') : 'invalid'}`);
    const manifest = validation.value;
    if (manifest.main || !manifest.client || !safePath(manifest.client) || !archive[prefix + manifest.client]) throw new Error('This host requires a frontend client entry and cannot run a Node main entry.');
    const files = Object.entries(archive).filter(([path]) => path.startsWith(prefix)).map(([path, bytes]) => [path.slice(prefix.length), bytes] as const).sort(([a], [b]) => a.localeCompare(b));
    for (const [path] of files) if (!safePath(path) || /\.(node|dylib|exe|dll|so)$/i.test(path)) throw new Error('Native binaries are not frontend modules.');
    const encoder = new TextEncoder();
    const entries = [];
    for (const [path, bytes] of files) entries.push(`${path}\0${hex(await crypto.subtle.digest('SHA-256', bytes.slice().buffer))}`);
    const digest = hex(await crypto.subtle.digest('SHA-256', encoder.encode(entries.join('\n'))));
    const path = `mods/${manifest.id}/${digest}`;
    for (const [name, bytes] of files) await writeNativeBlob(`${path}/${name}`, new Blob([bytes.slice().buffer]));
    const installed = readIndex();
    const old = installed.find(item => item.info.id === manifest.id);
    const info: ModRuntimeInfo = {
        id: manifest.id, name: manifest.name, version: typeof manifest.version === 'string' ? manifest.version : null,
        author: typeof manifest.author === 'string' ? manifest.author : null,
        description: typeof manifest.description === 'string' ? manifest.description : null,
        permissions: Array.isArray(manifest.permissions) ? manifest.permissions.filter((value: unknown) => typeof value === 'string') : [],
        status: 'disabled', error: null, enabled: old?.info.enabled ?? false, trustStale: Boolean(old?.info.enabled),
        // iOS does not yet implement the upstream signature verifier; never label the package verified.
        signature: { status: 'unsigned', reason: null, keyId: null, keyLabel: null, signedAt: null },
        devSource: false, experimental: Array.isArray(manifest.experimental) ? manifest.experimental : [],
        embedOrigins: Array.isArray(manifest.embedOrigins) ? manifest.embedOrigins : [], folia: typeof manifest.folia === 'string' ? manifest.folia : null,
        hasMain: false, clientUrl: null,
    };
    const dependencies = manifest.depends;
    const next = installed.filter(item => item.info.id !== info.id);
    next.push({ info, path, digest, client: manifest.client, dependencies, approvedDigest: old?.digest === digest ? old.approvedDigest : undefined });
    saveIndex(next); notifyNativeModsChanged();
}
export async function removeNativeMod(id: string): Promise<void> {
    const { removeNativeModFiles } = await import('./files');
    await removeNativeModFiles(id);
    const next = readIndex().filter(item => item.info.id !== id);
    saveIndex(next); notifyNativeModsChanged();
    // Loaded modules are torn down by the original client loader before the next mount.
    await FoliaDevice.removeFile({ path: `mods/${id}` });
    localStorage.removeItem(`folia-ios-mod-data:${id}`);
}
const activeMod = (id: string) => nativeModList().find(mod => mod.id === id && mod.status === 'loaded');
export async function nativeModStorage(id: string, operation: string, key?: string, value?: unknown) {
    if (!activeMod(id)?.permissions.includes('filesystem.data')) return { ok: false, error: 'permission-denied:filesystem.data' };
    const storageKey = `folia-ios-mod-data:${id}`;
    const data: Record<string, unknown> = JSON.parse(localStorage.getItem(storageKey) || '{}');
    let result: unknown;
    switch (operation) {
        case 'get': result = key ? data[key] : null; break;
        case 'has': result = Boolean(key && Object.hasOwn(data, key)); break;
        case 'keys': result = Object.keys(data); break;
        case 'set': if (key) Object.defineProperty(data, key, { value, configurable: true, enumerable: true, writable: true }); break;
        case 'delete': if (key) delete data[key]; break;
        default: return { ok: false, error: 'unknown-storage-operation' };
    }
    if (operation === 'set' || operation === 'delete') localStorage.setItem(storageKey, JSON.stringify(data));
    return { ok: true, result };
}
export async function nativeModFetch(id: string, url: string, init: unknown) {
    if (!activeMod(id)?.permissions.includes('net.fetch')) return { ok: false, error: 'permission-denied' };
    try {
        const target = new URL(url);
        if (target.protocol !== 'https:' || target.username || target.password) return { ok: false, error: 'https-required' };
    } catch { return { ok: false, error: 'invalid-url' }; }
    const options = (init || {}) as FoliumFetchInit;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), Math.min(60000, Math.max(1, options.timeoutMs || 15000)));
    try {
        const response = await fetch(url, { method: options.method, headers: options.headers, body: options.body, credentials: 'omit', signal: controller.signal });
        let body = '';
        if (response.body) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let size = 0;
            try {
                while (true) {
                    const chunk = await reader.read();
                    if (chunk.done) break;
                    size += chunk.value.byteLength;
                    if (size > 5_000_000) { await reader.cancel(); return { ok: false, error: 'net-body-too-large' }; }
                    body += decoder.decode(chunk.value, { stream: true });
                }
                body += decoder.decode();
            } finally { reader.releaseLock(); }
        }
        return { ok: true, result: { status: response.status, statusText: response.statusText, headers: Object.fromEntries(response.headers.entries()), body } };
    } catch { return { ok: false, error: 'net-request-failed' }; }
    finally { clearTimeout(timer); }
}
