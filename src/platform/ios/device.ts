import { registerPlugin, type PluginListenerHandle } from '@capacitor/core';

// src/platform/ios/device.ts — typed contract for the app-local Swift plugin.
interface FoliaDevice {
    startScreenRecording(): Promise<void>;
    stopScreenRecording(): Promise<{ path: string }>;
    getScreenRecordingState(): Promise<{ recording: boolean }>;
    configureAudio(options: { webMediaSession: boolean }): Promise<void>;
    setMusicControls(options: { next: boolean; previous: boolean }): Promise<{ next: boolean; previous: boolean; skipForward: boolean; skipBackward: boolean }>;
    publishNowPlaying(data: { clear?: boolean; trackKey?: string; title?: string; artist?: string; album?: string; duration?: number; position?: number; rate?: number; playing?: boolean; artwork?: string }): Promise<void>;
    prepareMediaArtwork(options: { data: string }): Promise<{ data: string }>;
    showOutputPicker(): Promise<void>;
    getStorage(): Promise<{ uri: string }>;
    importLibrary(options: { files?: boolean; single?: boolean; accept?: string; title?: string; folderLabel?: string; filesLabel?: string; cancelLabel?: string }): Promise<{ cancelled: boolean; path?: string; name?: string }>;
    listFiles(options: { path: string }): Promise<{ entries: Array<{ name: string; kind: 'file' | 'directory' }> }>;
    statFile(options: { path: string }): Promise<{ uri: string; size: number; modified: number; directory: boolean }>;
    writeFile(options: { path: string; data: string }): Promise<{ uri: string }>;
    appendFile(options: { path: string; data: string }): Promise<void>;
    removeFile(options: { path: string }): Promise<void>;
    shareFile(options: { path: string }): Promise<{ completed: boolean }>;
    addListener(event: 'remoteCommand', callback: (event: { action: string; position?: number }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'audioInterruption', callback: (event: { began: boolean; shouldResume: boolean }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'audioRouteChanged', callback: (event: { oldDeviceUnavailable: boolean }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'screenRecording', callback: (event: { recording: boolean; interrupted?: boolean }) => void): Promise<PluginListenerHandle>;
    addListener(event: 'foreground', callback: () => void): Promise<PluginListenerHandle>;
}
export const FoliaDevice = registerPlugin<FoliaDevice>('FoliaDevice');
