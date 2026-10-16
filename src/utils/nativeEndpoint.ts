// src/utils/nativeEndpoint.ts — HTTPS validation shared by settings and native transports.
export const normalizeNativeEndpoint = (value: string): string => {
    const input = value.trim();
    if (!input) return '';
    const url = new URL(input);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
        throw new Error('Use an HTTPS URL without credentials, query parameters or a fragment.');
    }
    return url.toString().replace(/\/+$/, '');
};
