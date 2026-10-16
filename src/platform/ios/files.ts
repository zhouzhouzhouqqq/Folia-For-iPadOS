import { Capacitor } from '@capacitor/core';
import { FoliaDevice } from './device';
import i18n from '../../i18n/config';
import { isNativeIOS } from '../capabilities';

// src/platform/ios/files.ts — sandbox copy handles; plain descriptors survive IndexedDB structured cloning.
export interface NativeDirectoryDescriptor { foliaNativeDirectory: 1; path: string; name: string }
let storageUri = '';
export async function initializeNativeStorage(): Promise<void> {
    if (!isNativeIOS()) return;
    storageUri = (await FoliaDevice.getStorage()).uri.replace(/\/?$/, '/');
    document.documentElement.dataset.foliaPlatform = 'ios';
}
export function nativeStorageUrl(path: string): string | null {
    return storageUri ? Capacitor.convertFileSrc(storageUri + path.split('/').map(encodeURIComponent).join('/')) : null;
}
export async function blobBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}
const validSegment = (name: string) => {
    if (!name || name === '.' || name === '..' || /[/\\\0]/.test(name)) throw new DOMException('Invalid path segment', 'TypeMismatchError');
    return name;
};
export interface NativeAudioFileMetadata {
    readonly nativeMetadataOnly: true;
    readonly name: string;
    readonly size: number;
    readonly lastModified: number;
    readonly type: string;
}
class NativeHandle {
    constructor(readonly path: string, readonly name: string, readonly kind: 'file' | 'directory') {}
    async queryPermission(): Promise<PermissionState> {
        try { await FoliaDevice.statFile({ path: this.path }); return 'granted'; } catch { return 'denied'; }
    }
    requestPermission() { return this.queryPermission(); }
    async isSameEntry(other: unknown) { return other instanceof NativeHandle && this.path === other.path; }
}
class NativeFileHandle extends NativeHandle {
    constructor(path: string, name: string) { super(path, name, 'file'); }
    async getMetadata(): Promise<NativeAudioFileMetadata> {
        const stat = await FoliaDevice.statFile({ path: this.path });
        return { nativeMetadataOnly: true, name: this.name, size: stat.size, lastModified: stat.modified, type: '' };
    }
    async getMediaUrl(): Promise<string> {
        return Capacitor.convertFileSrc((await FoliaDevice.statFile({ path: this.path })).uri);
    }
    async getFile(): Promise<File> {
        const stat = await FoliaDevice.statFile({ path: this.path });
        const response = await fetch(Capacitor.convertFileSrc(stat.uri));
        if (!response.ok) throw new DOMException('Imported file unavailable', 'NotFoundError');
        const blob = await response.blob();
        return new File([blob], this.name, { type: blob.type, lastModified: stat.modified });
    }
    async createWritable() {
        let content: Blob | null = null;
        return {
            write: async (value: Blob | string | ArrayBuffer) => { content = value instanceof Blob ? value : new Blob([value]); },
            close: async () => { if (content) await writeNativeBlob(this.path, content); },
            abort: async () => { content = null; },
        };
    }
}
class NativeDirectoryHandle extends NativeHandle {
    readonly foliaNativeDirectory = 1 as const;
    constructor(path: string, name: string) { super(path, name, 'directory'); }
    async *values() {
        const { entries } = await FoliaDevice.listFiles({ path: this.path });
        for (const entry of entries) yield entry.kind === 'directory'
            ? new NativeDirectoryHandle(`${this.path}/${validSegment(entry.name)}`, entry.name)
            : new NativeFileHandle(`${this.path}/${validSegment(entry.name)}`, entry.name);
    }
    async getDirectoryHandle(name: string) {
        const path = `${this.path}/${validSegment(name)}`;
        const stat = await FoliaDevice.statFile({ path });
        if (!stat.directory) throw new DOMException('Not a directory', 'TypeMismatchError');
        return new NativeDirectoryHandle(path, name);
    }
    async getFileHandle(name: string) {
        const path = `${this.path}/${validSegment(name)}`;
        const stat = await FoliaDevice.statFile({ path });
        if (stat.directory) throw new DOMException('Not a file', 'TypeMismatchError');
        return new NativeFileHandle(path, name);
    }
}
export function serializeNativeDirectories(handles: Record<string, FileSystemDirectoryHandle>): Record<string, FileSystemDirectoryHandle | NativeDirectoryDescriptor> {
    return Object.fromEntries(Object.entries(handles).map(([key, handle]) => [key, handle instanceof NativeDirectoryHandle
        ? { foliaNativeDirectory: 1, path: handle.path, name: handle.name } : handle]));
}
export function hydrateNativeDirectories(handles: Record<string, FileSystemDirectoryHandle | NativeDirectoryDescriptor>): Record<string, FileSystemDirectoryHandle> {
    return Object.fromEntries(Object.entries(handles).map(([key, handle]) => [key,
        'foliaNativeDirectory' in handle && handle.foliaNativeDirectory === 1
            ? new NativeDirectoryHandle(handle.path, handle.name) as unknown as FileSystemDirectoryHandle : handle as FileSystemDirectoryHandle]));
}
export async function pickNativeLibraryDirectory(files?: boolean): Promise<FileSystemDirectoryHandle | null> {
    const result = await FoliaDevice.importLibrary({ files, title: i18n.t('nativeConnections.importCopy'), folderLabel: i18n.t('nativeConnections.chooseFolder'), filesLabel: i18n.t('nativeConnections.chooseFiles'), cancelLabel: i18n.t('common.cancel') });
    if (result.cancelled || !result.path || !result.name) return null;
    return new NativeDirectoryHandle(result.path, result.name) as unknown as FileSystemDirectoryHandle;
}

// Bounded chunks avoid passing a full archive or audio file through a single base64 bridge call.
export async function writeNativeBlob(path: string, blob: Blob): Promise<void> {
    await FoliaDevice.writeFile({ path, data: '' });
    try {
        for (let offset = 0; offset < blob.size; offset += 768 * 1024) {
            await FoliaDevice.appendFile({ path, data: await blobBase64(blob.slice(offset, offset + 768 * 1024)) });
        }
    } catch (error) {
        await FoliaDevice.removeFile({ path }).catch(() => undefined);
        throw error;
    }
}

// Scan audio using stat records so a directory import does not load every track into WebKit memory.
export async function getNativeScanMetadata(handle: FileSystemFileHandle): Promise<NativeAudioFileMetadata | null> {
    return handle instanceof NativeFileHandle ? handle.getMetadata() : null;
}
export async function getNativeAudioUrl(handle: FileSystemFileHandle): Promise<string | null> {
    return handle instanceof NativeFileHandle ? handle.getMediaUrl() : null;
}
