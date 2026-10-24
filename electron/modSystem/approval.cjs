// electron/modSystem/approval.cjs
// Whether a mod may run. The user's approval of a mod is stored together with
// the digest of the files it was given for, and holds only while the files are
// those; the native dialog that asks for it, with its text in the four
// languages, is here too. Cut out of modSystem.cjs. How a digest and a
// signature are computed stays in modDigest.cjs and modSignature.cjs.

'use strict';

const path = require('path');
const { dialog } = require('electron');

const { shortDigest } = require('./modDigest.cjs');

// Native confirmation dialog copy. The main process cannot reach the renderer's
// i18n bundle, so the four shipped locales are mirrored here like main.cjs's
// own dialog strings.
const TRUST_DIALOG_LOCALE = {
    'zh-CN': {
        title: '启用模组',
        message: (name, id) => `确定要启用模组“${name}”（${id}）吗？`,
        risk: '模组是第三方代码，未经官方安全审计。一旦启用，它将以应用的完整权限运行：可读写本地文件、访问网络、读取或修改任意应用设置（包括 AI 服务地址与密钥），并可在界面中执行代码。请仅启用你信任来源的模组。',
        permissions: '声明的权限：',
        noPermissions: '声明的权限：无',
        location: '安装位置：',
        fingerprint: '内容指纹：',
        client: '界面代码：',
        noClient: '界面代码：无',
        experimental: '选用的实验接口：',
        embedOrigins: '可嵌入的外部网页：',
        folia: '需要的 Folia 版本：',
        verifiedRisk: '此模组带有有效的 Folium 官方签名，来源与内容已经过官方审查，且签名后未被修改。启用后它仍以应用的完整权限运行：可读写本地文件、访问网络、读取或修改任意应用设置（包括 AI 服务地址与密钥），并可在界面中执行代码。',
        signatureVerified: (key) => `签名：官方认证（${key}）`,
        betaRisk: '此模组是 Folium 先行测试版本：仅通过了安全审查，不保证功能实现的整洁，甚至功能可能完全无法工作，主要供社区开发者做创意实验，普通用户请勿轻易启用。启用后它仍以应用的完整权限运行：可读写本地文件、访问网络、读取或修改任意应用设置（包括 AI 服务地址与密钥），并可在界面中执行代码。',
        signatureBeta: (key) => `签名：先行测试（${key}）`,
        signatureUnsigned: '签名：无（未经官方审查的第三方模组）',
        signatureInvalid: (reason) => `签名：不匹配（${reason}）。模组内容在签名后被修改，或签名无效，这份签名不能作为审查依据。`,
        rebind: '本次确认仅对当前文件内容生效；模组文件发生变化后需要重新确认。',
        devSource: '开发模式：这个模组位于源码目录的 mods/ 中，确认后修改它的文件不会撤销本次确认。安装版和用户模组目录中的模组没有这项豁免。',
        enable: '仍要启用',
        cancel: '取消',
    },
    'zh-TW': {
        title: '啟用模組',
        message: (name, id) => `確定要啟用模組“${name}”（${id}）嗎？`,
        risk: '模組是第三方程式碼，未經官方安全審計。一旦啟用，它將以應用的完整權限執行：可讀寫本地檔案、存取網路、讀取或修改任意應用設定（包括 AI 服務位址與金鑰），並可在介面中執行程式碼。請僅啟用你信任來源的模組。',
        permissions: '宣告的權限：',
        noPermissions: '宣告的權限：無',
        location: '安裝位置：',
        fingerprint: '內容指紋：',
        client: '介面程式碼：',
        noClient: '介面程式碼：無',
        experimental: '選用的實驗介面：',
        embedOrigins: '可嵌入的外部網頁：',
        folia: '需要的 Folia 版本：',
        verifiedRisk: '此模組帶有有效的 Folium 官方簽名，來源與內容已經過官方審查，且簽名後未被修改。啟用後它仍以應用的完整權限執行：可讀寫本地檔案、存取網路、讀取或修改任意應用設定（包括 AI 服務位址與金鑰），並可在介面中執行程式碼。',
        signatureVerified: (key) => `簽名：官方認證（${key}）`,
        betaRisk: '此模組是 Folium 先行測試版本：僅通過了安全審查，不保證功能實現的整潔，甚至功能可能完全無法工作，主要供社群開發者做創意實驗，普通使用者請勿輕易啟用。啟用後它仍以應用的完整權限執行：可讀寫本地檔案、存取網路、讀取或修改任意應用設定（包括 AI 服務位址與金鑰），並可在介面中執行程式碼。',
        signatureBeta: (key) => `簽名：先行測試（${key}）`,
        signatureUnsigned: '簽名：無（未經官方審查的第三方模組）',
        signatureInvalid: (reason) => `簽名：不匹配（${reason}）。模組內容在簽名後被修改，或簽名無效，這份簽名不能作為審查依據。`,
        rebind: '本次確認僅對當前檔案內容生效；模組檔案發生變化後需要重新確認。',
        devSource: '開發模式：這個模組位於原始碼目錄的 mods/ 中，確認後修改它的檔案不會撤銷本次確認。安裝版和使用者模組目錄中的模組沒有這項豁免。',
        enable: '仍要啟用',
        cancel: '取消',
    },
    en: {
        title: 'Enable mod',
        message: (name, id) => `Enable the mod "${name}" (${id})?`,
        risk: 'Mods are third-party code and are not security-audited. Once enabled, a mod runs with the full privileges of the app: it can read and write local files, access the network, read or change any app setting (including the AI service URL and key), and run code inside the UI. Only enable mods from sources you trust.',
        permissions: 'Declared permissions: ',
        noPermissions: 'Declared permissions: none',
        location: 'Installed at: ',
        fingerprint: 'Content fingerprint: ',
        client: 'UI code: ',
        noClient: 'UI code: none',
        experimental: 'Experimental APIs opted into: ',
        embedOrigins: 'External pages it may embed: ',
        folia: 'Needs Folia ',
        verifiedRisk: 'This mod carries a valid official Folium signature: its source and content were reviewed by Folium and have not changed since signing. Once enabled it still runs with the full privileges of the app: it can read and write local files, access the network, read or change any app setting (including the AI service URL and key), and run code inside the UI.',
        signatureVerified: (key) => `Signature: officially verified (${key})`,
        betaRisk: 'This mod is a Folium preview build: it passed the security review only. Its implementation may be rough and its features may not work at all; it is meant for community developers to experiment with, and most users should not enable it. Once enabled it still runs with the full privileges of the app: it can read and write local files, access the network, read or change any app setting (including the AI service URL and key), and run code inside the UI.',
        signatureBeta: (key) => `Signature: preview build (${key})`,
        signatureUnsigned: 'Signature: none (a third-party mod not reviewed by Folium)',
        signatureInvalid: (reason) => `Signature: does not match (${reason}). The mod was changed after signing, or the signature is invalid; the signature can no longer vouch for it.`,
        rebind: 'This confirmation applies to the current files only; the mod must be confirmed again after its code changes.',
        devSource: 'Development mode: this mod is in the source tree\'s mods/ directory, so editing its files after this confirmation does not revoke it. Installed builds and the user mods directory have no such exemption.',
        enable: 'Enable anyway',
        cancel: 'Cancel',
    },
    in: {
        title: 'Aktifkan mod',
        message: (name, id) => `Aktifkan mod "${name}" (${id})?`,
        risk: 'Mod adalah kode pihak ketiga dan tidak diaudit keamanannya. Setelah diaktifkan, mod berjalan dengan hak penuh aplikasi: dapat membaca dan menulis berkas lokal, mengakses jaringan, membaca atau mengubah pengaturan apa pun (termasuk URL dan kunci layanan AI), serta menjalankan kode di dalam antarmuka. Aktifkan hanya mod dari sumber yang Anda percayai.',
        permissions: 'Izin yang dideklarasikan: ',
        noPermissions: 'Izin yang dideklarasikan: tidak ada',
        location: 'Terpasang di: ',
        fingerprint: 'Sidik konten: ',
        client: 'Kode antarmuka: ',
        noClient: 'Kode antarmuka: tidak ada',
        experimental: 'API eksperimental yang dipakai: ',
        embedOrigins: 'Halaman eksternal yang dapat disematkan: ',
        folia: 'Membutuhkan Folia ',
        verifiedRisk: 'Mod ini memiliki tanda tangan resmi Folium yang valid: sumber dan isinya telah ditinjau oleh Folium dan tidak berubah sejak ditandatangani. Setelah diaktifkan, mod tetap berjalan dengan hak penuh aplikasi: dapat membaca dan menulis berkas lokal, mengakses jaringan, membaca atau mengubah pengaturan apa pun (termasuk URL dan kunci layanan AI), serta menjalankan kode di dalam antarmuka.',
        signatureVerified: (key) => `Tanda tangan: terverifikasi resmi (${key})`,
        betaRisk: 'Mod ini adalah versi pratinjau Folium: hanya lolos tinjauan keamanan. Implementasinya mungkin belum rapi dan fiturnya bisa saja sama sekali tidak berfungsi; mod ini ditujukan bagi pengembang komunitas untuk bereksperimen, dan sebagian besar pengguna sebaiknya tidak mengaktifkannya. Setelah diaktifkan, mod tetap berjalan dengan hak penuh aplikasi: dapat membaca dan menulis berkas lokal, mengakses jaringan, membaca atau mengubah pengaturan apa pun (termasuk URL dan kunci layanan AI), serta menjalankan kode di dalam antarmuka.',
        signatureBeta: (key) => `Tanda tangan: versi pratinjau (${key})`,
        signatureUnsigned: 'Tanda tangan: tidak ada (mod pihak ketiga yang belum ditinjau Folium)',
        signatureInvalid: (reason) => `Tanda tangan: tidak cocok (${reason}). Mod diubah setelah ditandatangani, atau tanda tangannya tidak valid; tanda tangan ini tidak lagi bisa menjaminnya.`,
        rebind: 'Konfirmasi ini hanya berlaku untuk berkas saat ini; mod harus dikonfirmasi ulang setelah kodenya berubah.',
        devSource: 'Mode pengembangan: mod ini ada di direktori mods/ pada kode sumber, jadi mengubah berkasnya setelah konfirmasi ini tidak membatalkannya. Build terpasang dan direktori mod pengguna tidak mendapat pengecualian ini.',
        enable: 'Tetap aktifkan',
        cancel: 'Batal',
    },
};

/*
 * `app` is Electron's. The rest is the loader's: `store` is where approvals
 * are kept (`enabledKey(modId)` names one mod's record in it),
 * `getMainWindowSafe` gives the window the dialog belongs to, and
 * `getLocaleKey` the language to ask in.
 */
const createModApproval = ({ app, store, enabledKey, getMainWindowSafe, getLocaleKey }) => {
    const resolveDialogLocale = () => {
        try {
            const key = typeof getLocaleKey === 'function' ? getLocaleKey() : null;
            return TRUST_DIALOG_LOCALE[key] ?? TRUST_DIALOG_LOCALE.en;
        } catch {
            return TRUST_DIALOG_LOCALE.en;
        }
    };

    /*
     * Persisted trust record: `{ enabled, digest }`. Anything that is not an
     * object (nothing yet, or a value of another shape) reads as no record: the
     * mod stays off until the user confirms it.
     */
    const readTrust = (modId) => {
        try {
            const stored = store.get(enabledKey(modId));
            if (!stored || typeof stored !== 'object') {
                return null;
            }
            return {
                enabled: Boolean(stored.enabled),
                digest: typeof stored.digest === 'string' ? stored.digest : null,
            };
        } catch {
            return null;
        }
    };

    const writeTrust = (modId, enabled, digest) => {
        try {
            store.set(enabledKey(modId), {
                enabled: Boolean(enabled),
                digest: enabled ? digest : null,
                confirmedAt: enabled ? new Date().toISOString() : null,
            });
        } catch {
            // Persistence is best-effort; in-memory state still applies.
        }
    };

    /*
     * Development exemption. In an unpackaged build (npm run dev:electron) a mod
     * in the repository's own mods/ directory, the developer's source tree,
     * keeps its approval when its files change: the first enable is still
     * confirmed, later edits rebind the approval to the new bytes instead of
     * revoking it. Mods under userData or resources never qualify: that is where
     * files arrive from elsewhere, which is what binding trust to bytes guards
     * against. A packaged app never scans the repository directory at all.
     */
    const isDevSourceMod = (dirPath) => {
        if (app.isPackaged || typeof dirPath !== 'string') {
            return false;
        }
        const relative = path.relative(path.join(app.getAppPath(), 'mods'), dirPath);
        return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative);
    };

    /*
     * Decides whether a discovered mod may run. Trust is granted to bytes, not
     * to a mod id: when the digest moved (an upgrade dropped in over the old
     * copy, or an edited file) the approval is revoked on the spot and the mod
     * stays off until the user confirms the new code. The one exception is a
     * development source mod (isDevSourceMod) that was already confirmed: its
     * approval follows the edit.
     */
    const resolveTrust = (modId, digest, { devSource = false } = {}) => {
        const stored = readTrust(modId);
        if (!stored || !stored.enabled) {
            return { enabled: false, trustStale: false };
        }
        if (!digest || stored.digest !== digest) {
            if (devSource && digest && stored.digest) {
                writeTrust(modId, true, digest);
                console.info(`[ModSystem] ${modId}: files changed in the development source tree; approval kept`);
                return { enabled: true, trustStale: false };
            }
            writeTrust(modId, false, null);
            return { enabled: false, trustStale: true };
        }
        return { enabled: true, trustStale: false };
    };

    /*
     * The enable confirmation. Native and main-process owned on purpose: a
     * loaded mod's client code shares the renderer with the app UI, so a dialog
     * drawn there could be spoofed or dismissed by mod code. This one cannot,
     * and it is the only path that writes an "enabled" trust record.
     */
    const confirmEnableMod = async (runtime, digest, signature) => {
        const locale = resolveDialogLocale();
        const keyText = signature.keyLabel ? `${signature.keyLabel}, ${signature.keyId}` : signature.keyId;
        const signatureLine = signature.status === 'verified'
            ? locale.signatureVerified(keyText)
            : signature.status === 'beta'
                ? locale.signatureBeta(keyText)
                : signature.status === 'invalid'
                    ? locale.signatureInvalid(signature.reason ?? 'invalid')
                    : locale.signatureUnsigned;
        const permissions = Array.isArray(runtime.manifest.permissions) ? runtime.manifest.permissions : [];
        const { client, experimental = [], embedOrigins = [], folia } = runtime.manifest;
        const detail = [
            signature.status === 'verified' ? locale.verifiedRisk : signature.status === 'beta' ? locale.betaRisk : locale.risk,
            '',
            signatureLine,
            permissions.length > 0 ? `${locale.permissions}${permissions.join(', ')}` : locale.noPermissions,
            client ? `${locale.client}${client}` : locale.noClient,
            ...(experimental.length > 0 ? [`${locale.experimental}${experimental.join(', ')}`] : []),
            ...(embedOrigins.length > 0 ? [`${locale.embedOrigins}${embedOrigins.join(', ')}`] : []),
            ...(folia ? [`${locale.folia}${folia}`] : []),
            `${locale.location}${runtime.dirPath ?? '-'}`,
            `${locale.fingerprint}${shortDigest(digest)}`,
            '',
            isDevSourceMod(runtime.dirPath) ? locale.devSource : locale.rebind,
        ].join('\n');
        const options = {
            type: 'warning',
            title: locale.title,
            message: locale.message(runtime.manifest.name, runtime.manifest.id),
            detail,
            buttons: [locale.cancel, locale.enable],
            // Cancel is the default so an accidental Enter never enables a mod.
            defaultId: 0,
            cancelId: 0,
            noLink: true,
        };
        const win = getMainWindowSafe();
        const result = win && !win.isDestroyed()
            ? await dialog.showMessageBox(win, options)
            : await dialog.showMessageBox(options);
        return result.response === 1;
    };

    return { writeTrust, isDevSourceMod, resolveTrust, confirmEnableMod };
};

module.exports = { createModApproval, TRUST_DIALOG_LOCALE };
