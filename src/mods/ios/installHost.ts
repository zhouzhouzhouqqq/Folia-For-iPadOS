import { registerNativeModsBridge } from './bridge';
import { listNativeMods, setNativeModEnabled, onNativeModsChanged, nativeModStorage, nativeModFetch } from './host';
import { nativeModPickFile, nativeModRestoreFile, nativeModReleaseFile, cleanTemporaryModCopies } from './files';

// Called once by native bootstrap before the shared app; services.ts stays free of app stores.
export async function installNativeModHost(): Promise<void> {
    await cleanTemporaryModCopies();
    registerNativeModsBridge({ listMods: listNativeMods, setModEnabled: setNativeModEnabled, onChanged: onNativeModsChanged,
        storage: nativeModStorage, fetch: nativeModFetch, pickFile: nativeModPickFile,
        restoreFile: nativeModRestoreFile, releaseFile: nativeModReleaseFile });
}
