import QRCode from 'qrcode';
import { Buffer } from 'buffer';
import { operations, helper, calculateMid } from './vendor/kugou.js';
import { createNativeHttp } from './http';
import { loadSecureState } from './state';
import type { KugouOperation, KugouParams } from '../kugou/kugouTransport';
import { OnlineProviderError } from '../../../types/onlineMusic';
import { removeProviderSessionValue } from '../providerStorage';

// Reuses upstream endpoint constructors/signatures. Device IDs are synthetic, not iPad telemetry.
export function signKugouRequest(options: any, cookie: Record<string, any>, now = Date.now()) {
    const clienttime = Math.floor(now / 1000);
    const mid = String(cookie.KUGOU_API_MID);
    const dfid = cookie.dfid || '-';
    const defaults: Record<string, any> = { dfid, mid, uuid: '-', appid: 1005, clientver: 20489, clienttime };
    if (cookie.token) defaults.token = cookie.token;
    if (cookie.userid) defaults.userid = cookie.userid;
    const params: Record<string, any> = options.clearDefaultParams ? { ...options.params } : { ...defaults, ...options.params };
    if (options.encryptKey) params.key = helper.signKey(params.hash, params.mid, params.userid, params.appid);
    const body = typeof options.data === 'object' ? JSON.stringify(options.data) : options.data || '';
    if (!params.signature && !options.notSignature) params.signature = options.encryptType === 'web'
        ? helper.signatureWebParams(params) : options.encryptType === 'register'
            ? helper.signatureRegisterParams(params) : helper.signatureAndroidParams(params, body);
    return { ...options, baseURL: options.baseURL || 'https://gateway.kugou.com', params, data: options.data,
        headers: { 'User-Agent': 'Android15-1070-11083-46-0-DiscoveryDRADProtocol-wifi', ...options.headers,
            dfid: String(dfid), mid, clienttime: String(params.clienttime), 'kg-rc': '1', 'kg-thash': '5d816a0',
            'kg-rec': '1', 'kg-rf': 'B9EDA08A64250DEFFBCADDEE00F8F25F' } };
}
async function createRuntime() {
    const secure = await loadSecureState('kugou');
    const { state } = secure;
    if (!state.cookie || typeof state.cookie !== 'object' || Array.isArray(state.cookie)) state.cookie = {};
    if (!state.cookie.KUGOU_API_GUID) {
        state.cookie.KUGOU_API_GUID = crypto.randomUUID();
        state.cookie.KUGOU_API_MID = calculateMid(state.cookie.KUGOU_API_GUID);
        secure.save();
        await secure.flush();
    }
    const http = createNativeHttp('kugou');
    let generation = 0;
    let registration: Promise<any> | undefined;
    const clearAccount = async () => {
        generation++;
        for (const key of ['token', 'userid']) delete state.cookie[key];
        for (const key of ['token', 'userid', 'cookie', 'dfid']) removeProviderSessionValue('kugou', key);
        secure.save();
        await secure.flush();
    };
    const execute = async (operation: KugouOperation, params: KugouParams = {}) => {
        const epoch = generation;
        const cookie = { ...state.cookie };
        const response = await operations[operation]({ ...params, token: cookie.token || '',
            // Other user's public library IDs may be explicitly requested; never accept renderer credentials.
            userid: params.userid ?? cookie.userid ?? 0, cookie }, async (options: any) => {
            const merged = { ...cookie, ...options.cookie };
            // Token/dfid are always restored from this provider's secure record.
            for (const key of ['token', 'dfid']) if (cookie[key]) merged[key] = cookie[key];
            const result = await http.request(signKugouRequest(options, merged));
            if (result.headers['ssa-code']) throw new OnlineProviderError('unavailable', '酷狗要求额外安全验证，请在酷狗官方 App 完成后重试', 'kugou');
            return { status: result.status, body: options.responseType === 'arraybuffer' ? Buffer.from(result.data) : result.data,
                cookie: result.cookies.map((c: any) => `${c.name}=${c.value}`), headers: result.headers };
        }).catch((error: unknown) => {
            // A rejected request from an older account must not clear a newly confirmed login.
            if (generation !== epoch) throw new OnlineProviderError('auth-required', '酷狗登录已取消或退出', 'kugou');
            throw error;
        });
        if (generation !== epoch) throw new OnlineProviderError('auth-required', '酷狗登录已取消或退出', 'kugou');
        for (const entry of response.cookie || []) {
            const index = entry.indexOf('=');
            const name = entry.slice(0, index).trim();
            if (index > 0 && ['token', 'userid', 'dfid'].includes(name)) state.cookie[name] = entry.slice(index + 1).split(';')[0];
        }
        secure.save();
        await secure.flush();
        const body = response.body ?? response;
        // Credentials have been saved; preserve the QR status/user fields consumed by the existing adapter.
        if (body?.data?.token) { const { token: _, ...data } = body.data; return { ...body, data }; }
        return body;
    };
    return { secure, async request(operation: KugouOperation, params: KugouParams) {
        if (operation === 'logout') {
            await clearAccount();
            return { code: 200, status: 1 };
        }
        if (operation === 'login_qr_create') {
            if (!params.key) throw new Error('Missing KuGou QR key');
            const url = `https://h5.kugou.com/apps/loginQRCode/html/index.html?qrcode=${encodeURIComponent(String(params.key))}`;
            return { code: 200, data: { url, base64: await QRCode.toDataURL(url) } };
        }
        if (operation === 'user_detail' && !state.cookie.token) throw new OnlineProviderError('auth-required', '酷狗尚未登录', 'kugou');
        let body = await execute(operation, params);
        if (operation !== 'register_dev' && Number(body?.error_code ?? body?.errcode) === 20028) {
            delete state.cookie.dfid;
            registration ??= execute('register_dev', {}).finally(() => { registration = undefined; });
            await registration;
            body = await execute(operation, params);
        }
        const code = Number(body?.error_code ?? body?.errcode);
        if (code === 152) {
            await clearAccount();
            throw new OnlineProviderError('auth-required', '酷狗登录已过期，请重新扫码', 'kugou');
        }
        if (code === 20028) throw new OnlineProviderError('unavailable', '酷狗设备验证未通过，请稍后重试或使用自己的兼容后端', 'kugou');
        return body;
    }, clearAccount };
}
let runtime: ReturnType<typeof createRuntime> | undefined;
export async function requestKugouDirect(operation: KugouOperation, params: KugouParams): Promise<any> {
    runtime ??= createRuntime().catch(error => { runtime = undefined; throw error; });
    const current = await runtime;
    try { return await current.request(operation, params); }
    catch (error: any) {
        if (error.httpStatus === 401 || error.httpStatus === 403) {
            await current.clearAccount();
            throw new OnlineProviderError('auth-required', '酷狗登录已失效，请重新扫码', 'kugou', undefined, error.httpStatus);
        }
        throw error;
    }
}
