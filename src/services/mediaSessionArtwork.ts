import { blobBase64 } from '../platform/ios/files';

// Bounded artwork for OS media surfaces; iPad needs image bytes independent of app-local blob URLs.
export async function prepareMediaSessionArtwork(source: string, signal: AbortSignal, stableDataUrl: boolean) {
    const response = await fetch(source, { signal });
    if (!response.ok) throw new Error(`Artwork request failed: ${response.status}`);
    const blob = await response.blob();
    if (blob.size <= 0 || blob.size > 4_000_000 || !blob.type.startsWith('image/')) {
        throw new Error('Artwork response is not a bounded image');
    }
    if (stableDataUrl) {
        const url = `data:${blob.type};base64,${await blobBase64(blob)}`;
        return { url, dispose: () => {} };
    }
    const url = URL.createObjectURL(blob);
    return { url, dispose: () => URL.revokeObjectURL(url) };
}
