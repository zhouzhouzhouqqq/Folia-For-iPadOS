import type { ModRuntimeInfo, ModsListPayload, ModSetEnabledResult, ModSecretChange } from '../types';

// Store-free transport contract: the main-window bootstrap installs the native host.
interface Result { ok: boolean; result?: unknown; error?: string }
export interface NativeModsBridge {
    listMods(): Promise<ModsListPayload>;
    setModEnabled(id: string, enabled: boolean): Promise<ModSetEnabledResult>;
    onChanged(callback: (mods: ModRuntimeInfo[]) => void): () => void;
    secrets(id: string, operation: string, key?: string | readonly string[], value?: string | null): Promise<Result>;
    onSecretChanged(callback: (change: ModSecretChange) => void): () => void;
    storage(id: string, operation: string, key?: string, value?: unknown): Promise<Result>;
    fetch(id: string, url: string, init: unknown): Promise<Result>;
    pickFile(id: string, accept: string, persist: boolean): Promise<Result>;
    restoreFile(id: string, grantId: string): Promise<Result>;
    releaseFile(id: string, grantId: string): Promise<Result>;
}
let bridge: NativeModsBridge | undefined;
export const registerNativeModsBridge = (value: NativeModsBridge): void => { bridge = value; };
export const getNativeModsBridge = (): NativeModsBridge | undefined => bridge;
