import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nativeModPickFile, nativeModRestoreFile, nativeModReleaseFile, cleanTemporaryModCopies } from '../../../src/mods/ios/files';
import { FoliaDevice } from '../../../src/platform/ios/device';

// Persistent grants restore sandbox copies only to their owning mod; released copies survive until restart.
const state = vi.hoisted(() => ({ values: new Map<string, string>(), loaded: true }));
vi.mock('../../../src/mods/ios/host', () => ({ nativeModList: () => state.loaded ? [{ id: 'demo', status: 'loaded' }, { id: 'other', status: 'loaded' }] : [] }));
vi.mock('../../../src/platform/ios/files', () => ({ nativeStorageUrl: (path: string) => `capacitor://localhost/${path}` }));
vi.mock('../../../src/platform/ios/device', () => ({ FoliaDevice: { importLibrary: vi.fn(), listFiles: vi.fn(), statFile: vi.fn(), removeFile: vi.fn() } }));
beforeEach(() => {
    state.values.clear(); state.loaded = true; vi.clearAllMocks();
    vi.stubGlobal('localStorage', { getItem: (key: string) => state.values.get(key) ?? null, setItem: (key: string, value: string) => state.values.set(key, value) });
    vi.mocked(FoliaDevice.importLibrary).mockResolvedValue({ cancelled: false, path: 'libraries/1234-abcd/Import', name: 'Import' });
    vi.mocked(FoliaDevice.listFiles).mockResolvedValue({ entries: [{ name: 'clip.mp4', kind: 'file' }] });
    vi.mocked(FoliaDevice.statFile).mockResolvedValue({ uri: 'file:///sandbox/clip.mp4', size: 120, modified: 1, directory: false });
});
describe('native Folium file grants', () => {
    it('restores only the owner grant and removes released copies on next launch', async () => {
        const selected = await nativeModPickFile('demo', 'video', true);
        const grantId = selected.result?.grantId;
        expect(grantId).toBeTypeOf('string');
        expect(FoliaDevice.importLibrary).toHaveBeenCalledWith({ files: true, single: true, accept: 'video' });
        expect((await nativeModRestoreFile('other', grantId!)).result).toBeNull();
        expect((await nativeModRestoreFile('demo', grantId!)).result).toEqual(selected.result);
        await nativeModReleaseFile('demo', grantId!);
        expect(FoliaDevice.removeFile).not.toHaveBeenCalled();
        await cleanTemporaryModCopies();
        expect(FoliaDevice.removeFile).toHaveBeenCalledWith({ path: 'libraries/1234-abcd/Import' });
    });
    it('refuses disabled mods before presenting any picker', async () => {
        state.loaded = false;
        expect((await nativeModPickFile('demo', 'any', true)).ok).toBe(false);
        expect(FoliaDevice.importLibrary).not.toHaveBeenCalled();
    });
});
