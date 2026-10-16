import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { requestNeteaseDirect } from '../../../src/services/onlineMusic/neteaseDirect/transport';
import { upstreamRoutes } from '../../../src/services/onlineMusic/neteaseDirect/vendor';
import { FoliaNetease } from '../../../src/platform/ios/netease';

// Preserve provider contracts and compare every reused mapping against the pinned desktop implementation.
vi.mock('../../../src/platform/ios/netease', () => ({ FoliaNetease: { request: vi.fn(), getState: vi.fn() } }));
const require = createRequire(import.meta.url);
const response = () => ({ status: 200, body: { code: 200, playlist: { trackIds: [{ id: 1 }, { id: 2 }] }, data: { unikey: 'fixture-key' } }, cookie: [] });
beforeEach(() => { vi.clearAllMocks(); vi.mocked(FoliaNetease.request).mockResolvedValue(response()); });
describe('device-local NetEase transport', () => {
    it('creates a local QR image without any backend or native network request', async () => {
        const qr = await requestNeteaseDirect('/login/qr/create?key=fixture-key&qrimg=true');
        expect(qr.data.qrurl).toBe('https://music.163.com/login?codekey=fixture-key');
        expect(qr.data.qrimg).toMatch(/^data:image\/png;base64,/);
        expect(FoliaNetease.request).not.toHaveBeenCalled();
    });
    it('preserves the desktop QR key envelope', async () => {
        vi.mocked(FoliaNetease.request).mockResolvedValueOnce({ status: 200, body: { code: 200, unikey: 'from-device' }, cookie: [] });
        expect(await requestNeteaseDirect('/login/qr/key')).toEqual({ code: 200, data: { code: 200, unikey: 'from-device' } });
        expect(FoliaNetease.request).toHaveBeenCalledWith(expect.objectContaining({ uri: '/api/login/qrcode/unikey', data: { type: 3 } }));
    });
    it('returns QR failure codes and cookies instead of the upstream broken catch branch', async () => {
        vi.mocked(FoliaNetease.request).mockResolvedValueOnce({ status: 200, body: { code: 803 }, cookie: ['MUSIC_U=fixture-session'] });
        expect(await requestNeteaseDirect('/login/qr/check?key=fixture')).toEqual({ code: 803, cookie: 'MUSIC_U=fixture-session' });
        vi.mocked(FoliaNetease.request).mockResolvedValueOnce({ status: 200, body: { code: 502, msg: 'ECONNRESET' }, cookie: [] });
        expect(await requestNeteaseDirect('/login/qr/check?key=fixture')).toMatchObject({ code: 502, msg: 'ECONNRESET' });
    });
    it.each(['standard', 'exhigh', 'lossless', 'hires', 'jyeffect', 'vivid', 'jymaster', 'sky'])('retains %s playback quality', async level => {
        await requestNeteaseDirect(`/song/url/v1?id=42&level=${level}`);
        expect(FoliaNetease.request).toHaveBeenCalledWith({ uri: '/api/song/enhance/player/url/v1',
            data: { ids: '[42]', level, encodeType: level === 'vivid' ? 'mp3' : 'flac', ...(level === 'sky' ? { immerseType: 'c51' } : {}) },
            options: expect.objectContaining({ crypto: 'xeapi' }) });
    });
    it('marks native connection failures as transient network failures', async () => {
        vi.mocked(FoliaNetease.request).mockRejectedValueOnce(Object.assign(new Error('connection failed'), { code: 'NETEASE_DIRECT_NETWORK' }));
        await expect(requestNeteaseDirect('/login/qr/key')).rejects.toMatchObject({ networkFailure: true });
    });
    it('returns authentication errors without wrapping them as a successful QR key', async () => {
        vi.mocked(FoliaNetease.request).mockResolvedValueOnce({ status: 401, body: { code: 401, msg: 'expired' }, cookie: [] });
        expect(await requestNeteaseDirect('/login/qr/key')).toEqual({ code: 401, msg: 'expired' });
    });
    it('preserves the upstream playlist 512 recovery rather than treating the error as success', async () => {
        vi.mocked(FoliaNetease.request)
            .mockResolvedValueOnce({ status: 512, body: { code: 512 }, cookie: [] })
            .mockResolvedValueOnce({ status: 200, body: { code: 200 }, cookie: [] });
        expect(await requestNeteaseDirect('/playlist/tracks?op=add&pid=1&tracks=42')).toEqual({ code: 200 });
        expect(FoliaNetease.request).toHaveBeenCalledTimes(2);
        expect(FoliaNetease.request).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ trackIds: '["42","42"]' }) }));
    });
    it('rejects external endpoints and reports pending NCBL explicitly', async () => {
        await expect(requestNeteaseDirect('https://other.example/login/qr/key')).rejects.toThrow('endpoint paths');
        await expect(requestNeteaseDirect('/scrobble/v1?id=42')).rejects.toMatchObject({ code: 'unsupported' });
    });
    it.each(Object.keys(upstreamRoutes))('retains the pinned upstream mapping for %s', async path => {
        const name = path.slice(1).replaceAll('/', '_');
        const original = require(`@neteasecloudmusicapienhanced/api/module/${name}.js`);
        const query = { id: '42', ids: '42,43', uid: '7', songid: '42', sid: '42', key: 'fixture', keywords: '歌词',
            pid: '10', tracks: '42,43', op: 'add', t: '1', date: '2026-10-16', time: '30', limit: '2', offset: '0',
            mode: 'DEFAULT', submode: 'DEFAULT', afresh: 'false', cookie: '', order: 'hot', s: '8' };
        const oldRequest = vi.fn(async (_uri: string, _data: Record<string, unknown>, _options: any) => response()), newRequest = vi.fn(async (_uri: string, _data: Record<string, unknown>, _options: any) => response());
        const oldResult = await original({ ...query }, oldRequest);
        const newResult = await upstreamRoutes[path]({ ...query }, newRequest);
        expect(newResult).toEqual(oldResult);
        expect(newRequest.mock.calls.length).toBe(oldRequest.mock.calls.length);
        oldRequest.mock.calls.forEach((call, index) => {
            expect(newRequest.mock.calls[index].slice(0, 2)).toEqual(call.slice(0, 2));
            expect(newRequest.mock.calls[index][2]).toMatchObject({ crypto: (call[2] as any).crypto });
        });
    });
});
