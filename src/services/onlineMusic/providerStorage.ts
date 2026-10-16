import { isNativeIOS } from '../../platform/capabilities';
import { getNativeApiBase } from '../nativeConnections';
import type { OnlineProviderId } from '../../types/onlineMusic';
import { getFromCache, saveToCache } from '../db';

// src/services/onlineMusic/providerStorage.ts

const nativeNamespace = (providerId: OnlineProviderId): string => {
    if (!isNativeIOS() || !['netease', 'kugou', 'qq', 'bodian'].includes(providerId)) return '';
    const env = { netease: import.meta.env.VITE_NETEASE_API_BASE, kugou: import.meta.env.VITE_KUGOU_API_BASE,
        qq: import.meta.env.VITE_QQ_API_BASE, bodian: import.meta.env.VITE_BODIAN_API_BASE };
    const id = providerId as keyof typeof env;
    const base = getNativeApiBase(id, env[id] || '');
    return `:${encodeURIComponent(base || (id === 'netease' ? 'device-direct-v1' : ''))}`;
};

export const getProviderCacheKey = (providerId: OnlineProviderId, key: string): string => (
    `online_provider_${providerId}${nativeNamespace(providerId)}_${key}`
);

export const getProviderSessionKey = (providerId: OnlineProviderId, key: string): string => (
    `online_provider:${providerId}${nativeNamespace(providerId)}:${key}`
);

// Reads an old unscoped cache once, then stores the value in the provider namespace.
export const getProviderCacheWithLegacyMigration = async <T>(
    providerId: OnlineProviderId,
    key: string,
    legacyKeys: string[] = [],
): Promise<T | null> => {
    const namespacedKey = getProviderCacheKey(providerId, key);
    const current = await getFromCache<T>(namespacedKey);
    if (current != null) return current;

    for (const legacyKey of (isNativeIOS() ? [] : legacyKeys)) {
        const legacy = await getFromCache<T>(legacyKey);
        if (legacy == null) continue;
        await saveToCache(namespacedKey, legacy);
        return legacy;
    }
    return null;
};

export const readProviderSessionValue = (
    providerId: OnlineProviderId,
    key: string,
    legacyKeys: string[] = [],
): string | null => {
    if (typeof localStorage === 'undefined') return null;
    const namespacedKey = getProviderSessionKey(providerId, key);
    const current = localStorage.getItem(namespacedKey);
    if (current != null) return current;

    for (const legacyKey of (isNativeIOS() ? [] : legacyKeys)) {
        const legacy = localStorage.getItem(legacyKey);
        if (legacy == null) continue;
        localStorage.setItem(namespacedKey, legacy);
        return legacy;
    }
    return null;
};

export const writeProviderSessionValue = (providerId: OnlineProviderId, key: string, value: string): void => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(getProviderSessionKey(providerId, key), value);
};

export const removeProviderSessionValue = (
    providerId: OnlineProviderId,
    key: string,
    legacyKeys: string[] = [],
): void => {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(getProviderSessionKey(providerId, key));
    legacyKeys.forEach(legacyKey => localStorage.removeItem(legacyKey));
};
