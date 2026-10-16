import { FoliaAutomix, hasNativeAutomix } from '../../platform/ios/automix';
import { nativeBeatThis, nativeSeparateStems } from './nativeInference';

// One platform seam for original desktop inference and iPad's official native ONNX runtime.
export const beatInference = () => hasNativeAutomix() ? nativeBeatThis
    : typeof window !== 'undefined' ? window.electron?.runBeatThis : undefined;
export const stemInference = () => hasNativeAutomix() ? nativeSeparateStems
    : typeof window !== 'undefined' ? window.electron?.separateStems : undefined;
export const modelPresenceReader = () => hasNativeAutomix() ? async () => (await FoliaAutomix.status()).present
    : typeof window !== 'undefined' ? window.electron?.getAutomixModelsPresent : undefined;
export const hasAutomixModelRuntime = (): boolean => typeof stemInference() === 'function';
