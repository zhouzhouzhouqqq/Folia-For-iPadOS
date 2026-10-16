import QRCode from 'qrcode';
import { FoliaNetease, type NeteaseDirectOptions, type NeteaseEnvelope } from '../../../platform/ios/netease';
import { OnlineProviderError } from '../../../types/onlineMusic';
import { upstreamRoutes } from './vendor';
import createOption from './options';

// Preserve the desktop endpoint contracts while delegating only platform capabilities to native code.
const request = async (uri: string, data: Record<string, unknown>, options: NeteaseDirectOptions): Promise<NeteaseEnvelope> => {
    let result: NeteaseEnvelope;
    try { result = await FoliaNetease.request({ uri, data, options }); }
    catch (error) {
        const code = error && typeof error === 'object' && 'code' in error ? error.code : '';
        const message = error instanceof Error ? error.message : String(error);
        throw Object.assign(new Error(message), { body: { code: 502, msg: message }, ...(code === 'NETEASE_DIRECT_NETWORK' ? { networkFailure: true } : {}) });
    }
    // Upstream mappings rely on rejected envelopes (e.g. playlist error 512) before the HTTP facade returns their body.
    if (result.status !== 200) throw result;
    return result;
};

export async function requestNeteaseDirect(endpoint: string): Promise<Record<string, any>> {
    try { return await dispatch(endpoint); }
    catch (error) {
        if (error && typeof error === 'object' && 'status' in error && 'body' in error && typeof error.body === 'object' && error.body) {
            return error.body as Record<string, any>;
        }
        throw error;
    }
}

async function dispatch(endpoint: string): Promise<Record<string, any>> {
    const url = new URL(endpoint, 'https://device.invalid');
    if (url.origin !== 'https://device.invalid') throw new Error('Only local NetEase endpoint paths are accepted');
    const query = Object.fromEntries(url.searchParams);
    const path = url.pathname;
    if (path === '/login/qr/create') {
        if (!query.key) throw new Error('Missing NetEase QR key');
        const qrurl = `https://music.163.com/login?codekey=${encodeURIComponent(query.key)}`;
        return { code: 200, data: { qrurl, qrimg: query.qrimg === 'true' ? await QRCode.toDataURL(qrurl) : '' } };
    }
    if (path === '/login/qr/check') {
        const result = await request('/api/login/qrcode/client/login', { key: query.key, type: 3 }, createOption(query));
        // Same corrected behavior as electron/neteaseApiStartup.cjs, preserving upstream failure details.
        return { ...result.body, cookie: result.cookie.join(';') };
    }
    if (path === '/song/url/v1') {
        const data: Record<string, unknown> = { ids: `[${query.id}]`, level: query.level, encodeType: query.level === 'vivid' ? 'mp3' : 'flac' };
        if (query.level === 'sky') data.immerseType = query.immerseType || 'c51';
        return (await request('/api/song/enhance/player/url/v1', data, createOption(query, 'xeapi'))).body;
    }
    if (path === '/scrobble/v1') {
        throw new OnlineProviderError('unsupported', 'Device-local NCBL listening reports are not implemented yet; playback and account actions remain available.', 'netease');
    }
    const operation = upstreamRoutes[path];
    if (!operation) throw new OnlineProviderError('unsupported', `NetEase device adapter has no mapping for ${path}`, 'netease');
    return (await operation(query, request)).body;
}
