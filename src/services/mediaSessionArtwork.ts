import { blobBase64 } from '../platform/ios/files';
import { FoliaDevice } from '../platform/ios/device';

// Bounded artwork for OS media surfaces; iPad needs image bytes independent of app-local blob URLs.
export async function prepareMediaSessionArtwork(source: string, signal: AbortSignal, stableDataUrl: boolean) {
    const response = await fetch(source, { signal });
    if (!response.ok) throw new Error(`Artwork request failed: ${response.status}`);
    const blob = await response.blob();
    if (blob.size <= 0 || blob.size > 4_000_000 || !blob.type.startsWith('image/')) {
        throw new Error('Artwork response is not a bounded image');
    }
    if (stableDataUrl) {
        signal.throwIfAborted();
        // Compressed byte limits do not bound decoded pixels. ImageIO thumbnails before decoding,
        // keeping full-resolution artwork out of WebKit's system-media image pipeline.
        const bytes = await blobBase64(blob);
        signal.throwIfAborted();
        const prepared = await FoliaDevice.prepareMediaArtwork({ data: bytes });
        signal.throwIfAborted();
        const url = `data:image/jpeg;base64,${prepared.data}`;
        return { url, dispose: () => {} };
    }
    const url = URL.createObjectURL(blob);
    return { url, dispose: () => URL.revokeObjectURL(url) };
}
