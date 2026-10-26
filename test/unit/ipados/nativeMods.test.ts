import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zipSync, strToU8 } from 'fflate';
import { installNativeMod, nativeModList, setNativeModEnabled } from '../../../src/mods/ios/host';
import { writeNativeBlob } from '../../../src/platform/ios/files';

// test/unit/ipados/nativeMods.test.ts — untrusted packages need confirmation and cannot introduce Node/native entries or traversal.
const state = vi.hoisted(() => ({ enabled: true, storage: new Map<string, string>() }));
vi.mock('../../../src/platform/ios/files', () => ({ writeNativeBlob: vi.fn(), nativeStorageUrl: (path: string) => `capacitor://localhost/${path}` }));
vi.mock('../../../src/platform/ios/device', () => ({ FoliaDevice: { removeFile: vi.fn() } }));
vi.mock('../../../src/stores/useDesktopSettingsStore', () => ({ useDesktopSettingsStore: { getState: () => ({ modSystemEnabled: state.enabled }) } }));
vi.mock('../../../src/i18n/config', () => ({ default: { t: (key: string) => key } }));
const packageFile = (manifest: Record<string, unknown>, code = 'export default () => {};', extra: Record<string, Uint8Array> = {}) => new File([zipSync({ 'mod.json': strToU8(JSON.stringify({ folium: 1, id: 'demo', name: 'Demo', version: '1.0.0', client: 'client.mjs', ...manifest })), 'client.mjs': strToU8(code), ...extra }).slice().buffer], 'demo.zip');
beforeEach(() => {
    state.storage.clear(); state.enabled = true; vi.clearAllMocks();
    vi.stubGlobal('localStorage', { getItem: (key: string) => state.storage.get(key) ?? null, setItem: (key: string, value: string) => state.storage.set(key, value), removeItem: (key: string) => state.storage.delete(key) });
    vi.stubGlobal('window', { confirm: vi.fn(() => true) });
});
describe('frontend Folium host', () => {
    it('keeps imports disabled until approval, and revokes approval when bytes change', async () => {
        await installNativeMod(packageFile({}));
        expect(nativeModList()[0]).toMatchObject({ status: 'disabled', clientUrl: null, signature: { status: 'unsigned' } });
        await setNativeModEnabled('demo', true);
        expect(window.confirm).toHaveBeenCalledOnce();
        expect(nativeModList()[0]).toMatchObject({ status: 'loaded', trustStale: false });
        const url = nativeModList()[0].clientUrl;
        await installNativeMod(packageFile({}, 'export default () => console.log("changed");'));
        expect(nativeModList()[0]).toMatchObject({ status: 'disabled', trustStale: true, clientUrl: null });
        await setNativeModEnabled('demo', true);
        expect(nativeModList()[0].clientUrl).not.toBe(url);
    });
    it('honors declined confirmation and the master switch', async () => {
        await installNativeMod(packageFile({}));
        vi.mocked(window.confirm).mockReturnValueOnce(false);
        expect((await setNativeModEnabled('demo', true)).ok).toBe(false);
        expect(nativeModList()[0].status).toBe('disabled');
        await setNativeModEnabled('demo', true); state.enabled = false;
        expect(nativeModList()[0].status).toBe('disabled');
    });
    it('refuses Node main and archive traversal before writing files', async () => {
        await expect(installNativeMod(packageFile({ main: 'main.cjs' }))).rejects.toThrow('frontend');
        await expect(installNativeMod(packageFile({}, '', { '../outside.js': strToU8('bad') }))).rejects.toThrow('Unsafe');
        expect(writeNativeBlob).not.toHaveBeenCalled();
    });
    it('validates host and dependency version ranges', async () => {
        await installNativeMod(packageFile({ folia: '>=9.0.0' }));
        await setNativeModEnabled('demo', true);
        expect(nativeModList()[0].status).toBe('dependency-failed');
        await expect(installNativeMod(packageFile({ permissions: ['fake.permission'] }))).rejects.toThrow('permission');
    });
    it('accepts the shared Folium 1.7 queue, equalizer and experimental declarations', async () => {
        await installNativeMod(packageFile({ permissions: ['playback.queue', 'equalizer.control', 'stageLayers', 'platform.netease.read'], experimental: ['omni.providers', 'platform.raw'] }));
        await setNativeModEnabled('demo', true);
        expect(nativeModList()[0]).toMatchObject({ status: 'loaded', permissions: expect.arrayContaining(['playback.queue', 'equalizer.control']) });
    });
    it('does not load a client whose declared dependency is unavailable', async () => {
        await installNativeMod(packageFile({ depends: ['missing'] }));
        await setNativeModEnabled('demo', true);
        expect(nativeModList()[0]).toMatchObject({ status: 'dependency-failed', clientUrl: null });
    });
});
