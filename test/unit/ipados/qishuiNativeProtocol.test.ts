import { execFileSync } from 'node:child_process';
import { createPublicKey, verify } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createQishuiApi } from '../../../src/services/onlineMusic/qishui/vendor/qishui.js';
import type { QishuiSession } from 'qishui-music-api';

// Drive the actual browser bundle through synthetic QR/ticket/account exchanges, including its CSR.
describe('Qishui browser authorization protocol', () => {
    it('creates a valid CSR and signs the subsequent account request with the same key', async () => {
        const deviceId = '1234567890123456789';
        let session: QishuiSession | null = null; let revision = 0; let csrKey = '';
        const paths: string[] = [];
        const sessions = { deviceId, get revision() { return revision; }, get: () => session,
            set: (value: QishuiSession) => { session = value; revision++; }, clear: () => { session = null; revision++; } };
        const api = createQishuiApi({ sessions, log: () => {}, warn: () => {}, fetch: async (raw: string, init: RequestInit) => {
            const path = new URL(raw).pathname; paths.push(path);
            if (path.endsWith('/get_qrcode/')) return Response.json({ data: { token: 'synthetic-qr', qrcode: 'synthetic-image' } });
            if (path.endsWith('/check_qrcode/')) return Response.json({ data: { status: 'confirmed', code: 'synthetic-auth-code' } });
            if (path.endsWith('/access/code/get/')) return Response.json({ data: { access_code: 'synthetic-access', open_id: 'synthetic-open', expires_time: 7200 } });
            const headers = new Headers(init.headers);
            if (path.endsWith('/get_access_ticket/')) {
                const csr = Buffer.from(headers.get('bd-ticket-guard-client-csr')!, 'base64');
                execFileSync('/usr/bin/openssl', ['req', '-noout', '-verify'], { input: csr, stdio: ['pipe', 'pipe', 'pipe'] });
                csrKey = execFileSync('/usr/bin/openssl', ['req', '-pubkey', '-noout'], { input: csr, encoding: 'utf8' });
                return Response.json({ data: {} }, { headers: { 'bd-ticket-guard-server-data': Buffer.from(JSON.stringify({ ticket: 'synthetic-ticket', ts_sign: 'synthetic-ts-sign', client_cert: 'synthetic-cert' })).toString('base64') } });
            }
            expect(path).toBe('/api/luna/v1/platform/me/info/');
            const data = JSON.parse(Buffer.from(headers.get('bd-ticket-guard-client-data')!, 'base64').toString());
            const content = `ticket=synthetic-ticket&path=${path}&timestamp=${data.timestamp}`;
            expect(verify('sha256', Buffer.from(content), csrKey, Buffer.from(data.req_sign, 'base64'))).toBe(true);
            return Response.json({ data: { my_info: { id: 'synthetic-user', nickname: 'Listener' } } });
        } });
        const key = await api.request('login_qr_key');
        expect(key.ok).toBe(true); if (!key.ok) return;
        const checked = await api.request('login_qr_check', { key: (key.data as { key: string }).key });
        expect(checked).toEqual({ ok: true, data: { state: 'confirmed' } });
        expect(session).toMatchObject({ userId: 'synthetic-user', ticket: 'synthetic-ticket' });
        expect(createPublicKey(session!.guardKey).export({ type: 'spki', format: 'pem' })).toBe(csrKey);
        expect(paths).toHaveLength(5);
        expect(await api.request('logout')).toEqual({ ok: true, data: null });
        expect(session).toBeNull();
    });
});
