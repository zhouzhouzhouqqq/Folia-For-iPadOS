import { beforeEach, describe, expect, it, vi } from 'vitest';
import { hydrateNativeDirectories, serializeNativeDirectories, getNativeScanMetadata, getNativeAudioUrl } from '../../../src/platform/ios/files';
import { FoliaDevice } from '../../../src/platform/ios/device';

// test/unit/ipados/nativeFiles.test.ts — restored handles remain sandbox-relative and do not read whole songs during a scan.
vi.mock('../../../src/platform/ios/device', () => ({ FoliaDevice: { statFile: vi.fn(), listFiles: vi.fn() } }));
vi.mock('../../../src/i18n/config', () => ({ default: { t: (key: string) => key } }));
vi.mock('@capacitor/core', () => ({ Capacitor: { convertFileSrc: (uri: string) => uri.replace('file://', 'capacitor://localhost/_capacitor_file_') } }));

beforeEach(() => { vi.clearAllMocks(); });
describe('native directory recovery', () => {
    it('round trips a plain IndexedDB descriptor and reads audio metadata without fetching bytes', async () => {
        const descriptor = { foliaNativeDirectory: 1 as const, path: 'libraries/uuid/Music', name: 'Music' };
        const handles = hydrateNativeDirectories(structuredClone({ Music: descriptor }));
        expect(serializeNativeDirectories(handles)).toEqual({ Music: descriptor });
        vi.mocked(FoliaDevice.listFiles).mockResolvedValue({ entries: [{ name: 'song.flac', kind: 'file' }] });
        vi.mocked(FoliaDevice.statFile).mockResolvedValue({ uri: 'file:///sandbox/Folia/libraries/uuid/Music/song.flac', size: 90000000, modified: 12345, directory: false });
        const iterator = handles.Music.values();
        for await (const file of iterator) {
            if (file.kind !== 'file') throw new Error('Expected the test audio file');
            expect(await getNativeScanMetadata(file)).toMatchObject({ name: 'song.flac', size: 90000000, lastModified: 12345 });
            expect(await getNativeAudioUrl(file)).toBe('capacitor://localhost/_capacitor_file_/sandbox/Folia/libraries/uuid/Music/song.flac');
        }
        expect(FoliaDevice.statFile).toHaveBeenCalledWith({ path: 'libraries/uuid/Music/song.flac' });
    });
    it('rejects relative traversal before asking native code for a child', async () => {
        const handle = hydrateNativeDirectories({ Music: { foliaNativeDirectory: 1, path: 'libraries/uuid/Music', name: 'Music' } }).Music;
        await expect(handle.getFileHandle('../outside.mp3')).rejects.toThrow();
        await expect(handle.getDirectoryHandle('..')).rejects.toThrow();
        expect(FoliaDevice.statFile).not.toHaveBeenCalled();
    });
    it('reports missing sandbox copies as denied rather than pretending external access can be restored', async () => {
        const handle = hydrateNativeDirectories({ Music: { foliaNativeDirectory: 1, path: 'libraries/removed', name: 'Music' } }).Music;
        vi.mocked(FoliaDevice.statFile).mockRejectedValue(new Error('not found'));
        expect(await (handle as unknown as { queryPermission(): Promise<string> }).queryPermission()).toBe('denied');
    });
});
