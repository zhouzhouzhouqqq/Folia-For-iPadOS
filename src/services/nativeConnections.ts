import { isNativeIOS } from '../platform/capabilities';
import { useNativeConnectionStore, type NativeConnectionKey } from '../stores/useNativeConnectionStore';
import { normalizeNativeEndpoint } from '../utils/nativeEndpoint';

// src/services/nativeConnections.ts — resolve transport addresses without changing Omni routing.
export const getNativeApiBase = (key: NativeConnectionKey, webDefault = ''): string => {
    if (!isNativeIOS()) return webDefault;
    const value = useNativeConnectionStore.getState().endpoints[key] || webDefault;
    try { return normalizeNativeEndpoint(value); }
    catch { return ''; }
};

export const foliaApiUrl = (path: string): string => {
    if (!isNativeIOS()) return path;
    const base = getNativeApiBase('folia', import.meta.env.VITE_FOLIA_API_BASE || '');
    if (!base) throw new Error('Configure the Folia HTTPS API in Settings → Connections.');
    // `base` may include a reverse-proxy prefix; never resolve an /api path against capacitor://.
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
};
