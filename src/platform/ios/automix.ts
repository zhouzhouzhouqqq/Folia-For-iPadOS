import { Capacitor, registerPlugin, type PluginListenerHandle } from '@capacitor/core';
import { isNativeIOS } from '../capabilities';

// Native model-only contract. Playback, DSP and transition planning stay in the shared Folia engine.
export type NativeAutomixModel = 'beat_this' | 'htdemucs';
interface NativeAutomixPlugin {
    status(): Promise<{ present: Record<NativeAutomixModel, boolean>; runtime: string }>;
    createJob(): Promise<{ id: string }>;
    cleanJob(options: { id: string }): Promise<void>;
    infer(options: { id: string; kind: NativeAutomixModel; frames?: number[]; samples?: number }): Promise<{ path: string }>;
    downloadModel(options: { name: NativeAutomixModel }): Promise<void>;
    importModel(options: { name: NativeAutomixModel }): Promise<{ cancelled: boolean }>;
    removeModel(options: { name: NativeAutomixModel }): Promise<void>;
    cancel(): Promise<void>;
    addListener(event: 'modelProgress', callback: (event: { name: NativeAutomixModel; fraction: number }) => void): Promise<PluginListenerHandle>;
}
export const FoliaAutomix = registerPlugin<NativeAutomixPlugin>('FoliaAutomix');
export const hasNativeAutomix = (): boolean => isNativeIOS() && Capacitor.isPluginAvailable('FoliaAutomix');
