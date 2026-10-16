import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { normalizeNativeEndpoint } from '../utils/nativeEndpoint';

// src/stores/useNativeConnectionStore.ts — device-local addresses, never server secrets.
export const NATIVE_CONNECTION_KEYS = ['folia', 'netease', 'kugou', 'qq', 'bodian', 'nowplaying', 'playercap'] as const;
export type NativeConnectionKey = typeof NATIVE_CONNECTION_KEYS[number];
export type NativeConnections = Record<NativeConnectionKey, string>;
const empty: NativeConnections = { folia: '', netease: '', kugou: '', qq: '', bodian: '', nowplaying: '', playercap: '' };

export const useNativeConnectionStore = create<{
    endpoints: NativeConnections;
    save: (endpoints: NativeConnections) => void;
}>()(persist((set) => ({
    endpoints: empty,
    save: endpoints => set({ endpoints: Object.fromEntries(
        NATIVE_CONNECTION_KEYS.map(key => [key, normalizeNativeEndpoint(endpoints[key] ?? '')]),
    ) as NativeConnections }),
}), {
    name: 'folia-native-connections',
    partialize: state => ({ endpoints: state.endpoints }),
    merge: (persisted, current) => ({ ...current, endpoints: {
        ...empty, ...(persisted as { endpoints?: Partial<NativeConnections> } | undefined)?.endpoints,
    } }),
}));
