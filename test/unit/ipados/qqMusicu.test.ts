import { beforeEach, describe, expect, it, vi } from 'vitest';
const request = vi.hoisted(() => vi.fn());
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => true }));
vi.mock('../../../src/platform/ios/musicProviders', () => ({ FoliaMusicProviders: { request } }));
import { requestQqMusicu } from '../../../src/services/onlineMusic/qq/qqTransport';

// Public numeric detail requests must bypass web relays and retain upstream throttling metadata.
beforeEach(() => vi.clearAllMocks());
describe('iOS QQ musicu detail transport', () => {
    it('uses native HTTPS without cookies and reads the original subresponse', async () => {
        request.mockResolvedValue({ status: 200, headers: {}, bodyBase64: btoa(JSON.stringify({ code: 0, detail: { code: 0, data: { tracks: [] } } })) });
        expect(await requestQqMusicu({ detail: { module: 'music.pf_song_detail_svr', method: 'get_song_detail_yqq', param: { song_id: 123 } } })).toEqual({ detail: { code: 0, data: { tracks: [] } } });
        expect(request).toHaveBeenCalledWith(expect.objectContaining({ provider: 'qq', url: 'https://u.y.qq.com/cgi-bin/musicu.fcg', method: 'POST', headers: { 'Content-Type': 'application/json' } }));
    });
    it('retains HTTP 429 and Retry-After rather than flattening them into a connection failure', async () => {
        request.mockResolvedValue({ status: 429, headers: { 'retry-after': '12' }, bodyBase64: '' });
        await expect(requestQqMusicu({})).rejects.toMatchObject({ httpStatus: 429, retryAfterMs: 12000 });
    });
});
