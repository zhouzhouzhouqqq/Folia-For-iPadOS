import { create } from 'zustand';
import { FoliaDevice } from './device';
import { platformCapabilities } from '../capabilities';

// src/platform/ios/recording.ts — explicit ReplayKit capture; no second audio engine and no upload.
export const useNativeRecordingStore = create<{ recording: boolean; busy: boolean; error: string }>(() => ({ recording: false, busy: false, error: '' }));
let bound = false;
export async function initializeNativeRecording() {
    if (bound || !platformCapabilities().nativeFiles) return;
    bound = true;
    await FoliaDevice.addListener('screenRecording', event => useNativeRecordingStore.setState({ recording: event.recording, error: event.interrupted ? 'Recording was interrupted by the system.' : '' }));
    useNativeRecordingStore.setState(await FoliaDevice.getScreenRecordingState());
}
export async function startNativeRecording(): Promise<void> {
    useNativeRecordingStore.setState({ busy: true, error: '' });
    try { await initializeNativeRecording(); await FoliaDevice.startScreenRecording(); useNativeRecordingStore.setState({ recording: true }); }
    catch (error) { useNativeRecordingStore.setState({ error: String(error) }); throw error; }
    finally { useNativeRecordingStore.setState({ busy: false }); }
}
export async function stopNativeRecording(): Promise<void> {
    useNativeRecordingStore.setState({ busy: true, error: '' });
    try {
        const { path } = await FoliaDevice.stopScreenRecording();
        useNativeRecordingStore.setState({ recording: false });
        // Keep the saved file if sharing fails, so a retry or later recovery is possible.
        await FoliaDevice.shareFile({ path });
        await FoliaDevice.removeFile({ path: path.slice(0, path.lastIndexOf('/')) });
    } catch (error) { useNativeRecordingStore.setState({ error: String(error) }); throw error; }
    finally { useNativeRecordingStore.setState({ busy: false }); }
}
