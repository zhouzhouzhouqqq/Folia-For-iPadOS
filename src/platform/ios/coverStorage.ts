import { FoliaDevice } from './device';
import { writeNativeBlob, nativeStorageUrl } from './files';

// src/platform/ios/coverStorage.ts — content-addressed image files served by Capacitor, without a Service Worker.
const pathFor = (id: string) => {
    if (!/^sha256:[0-9a-f]{64}$/.test(id)) throw new Error('Invalid cover asset ID');
    return `covers/${id.slice(7)}.bin`;
};
export const nativeCoverUrl = (id: string) => nativeStorageUrl(pathFor(id));
export async function hasNativeCover(id: string): Promise<boolean> {
    try { return (await FoliaDevice.statFile({ path: pathFor(id) })).size > 0; } catch { return false; }
}
export async function writeNativeCover(id: string, blob: Blob): Promise<void> {
    await writeNativeBlob(pathFor(id), blob);
}
export const removeNativeCover = (id: string) => FoliaDevice.removeFile({ path: pathFor(id) });
export const clearNativeCovers = () => FoliaDevice.removeFile({ path: 'covers' });
