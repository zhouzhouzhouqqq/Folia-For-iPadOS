import { isNativeIOS } from '../platform/capabilities';
import { FoliaDevice } from '../platform/ios/device';
import { writeNativeBlob } from '../platform/ios/files';
import { sanitizeDownloadFileName } from '../utils/downloadFileName';
import { createSafeObjectUrl } from '../utils/blobGuards';

// src/services/fileDownload.ts — one save boundary for browser downloads and the iPad share/save sheet.
export async function saveDownload(blob: Blob, fileName: string): Promise<void> {
    const name = sanitizeDownloadFileName(fileName);
    if (isNativeIOS()) {
        const path = `exports/${crypto.randomUUID()}/${name}`;
        await writeNativeBlob(path, blob);
        try { await FoliaDevice.shareFile({ path }); }
        finally { await FoliaDevice.removeFile({ path: path.slice(0, path.lastIndexOf('/')) }); }
        return;
    }
    const url = createSafeObjectUrl(blob);
    if (!url) throw new TypeError('Export must produce a Blob');
    const link = document.createElement('a');
    link.href = url; link.download = name;
    document.body.appendChild(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
