import { createServer } from 'node:http';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createBodianApi, BODIAN_OPERATIONS } from 'bodian-music-api';

// deploy/ipados-bodian/server.mjs — optional user-hosted adapter for the existing Bodian package, never an open URL proxy.
const secret = process.env.BODIAN_SESSION_SECRET || '';
if (!/^[a-f0-9]{64}$/i.test(secret)) throw new Error('Set BODIAN_SESSION_SECRET to a persistent random 32-byte hex secret.');
const key = Buffer.from(secret, 'hex');
const directory = resolve(process.env.BODIAN_DATA_DIR || './data');
const origins = new Set((process.env.BODIAN_ALLOWED_ORIGINS || 'capacitor://localhost').split(',').map(value => value.trim()));
const ttl = 30 * 24 * 60 * 60 * 1000;
const hosts = new Map();
await mkdir(directory, { recursive: true, mode: 0o700 });
function seal(value) {
    const nonce = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', key, nonce);
    return Buffer.concat([nonce, cipher.update(JSON.stringify(value)), cipher.final(), cipher.getAuthTag()]);
}
function open(bytes) {
    const decipher = createDecipheriv('aes-256-gcm', key, bytes.subarray(0, 12));
    decipher.setAuthTag(bytes.subarray(-16));
    return JSON.parse(Buffer.concat([decipher.update(bytes.subarray(12, -16)), decipher.final()]).toString('utf8'));
}
async function getHost(requested) {
    let id = /^[a-f0-9]{64}$/.test(requested || '') ? requested : randomBytes(32).toString('hex');
    if (hosts.has(id)) return { id, host: hosts.get(id) };
    let saved;
    try { saved = open(await readFile(resolve(directory, `${id}.bin`))); } catch { /* New or invalid session starts logged out. */ }
    if (!saved || saved.expires < Date.now()) { id = randomBytes(32).toString('hex'); saved = { deviceId: randomBytes(16).toString('hex'), account: null }; }
    if (hosts.size >= 256) hosts.delete(hosts.keys().next().value);
    const sessions = { revision: 0, get() { return saved.account; }, set(account) { saved.account = account; this.revision++; }, clear() { saved.account = null; this.revision++; } };
    const api = createBodianApi({ deviceId: saved.deviceId, sessions });
    const host = { api, sessions, saved, expires: Date.now() + ttl, count: 0, window: Date.now(), chain: Promise.resolve() };
    hosts.set(id, host); return { id, host };
}
const server = createServer(async (request, response) => {
    const origin = request.headers.origin;
    if (origin && !origins.has(origin)) { response.writeHead(403).end(); return; }
    response.setHeader('Cache-Control', 'no-store'); response.setHeader('Vary', 'Origin');
    if (origin) response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Folia-Bodian-Session');
    response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    if (request.method === 'OPTIONS') { response.writeHead(204).end(); return; }
    if (request.url !== '/request' || request.method !== 'POST') { response.writeHead(404).end(); return; }
    try {
        const chunks = []; let length = 0;
        for await (const chunk of request) { length += chunk.length; if (length > 65536) { response.writeHead(413).end(); return; } chunks.push(chunk); }
        const { operation, params } = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!BODIAN_OPERATIONS.includes(operation) || !params || typeof params !== 'object' || Array.isArray(params)
            || Object.values(params).some(value => !['string', 'number', 'boolean'].includes(typeof value))) { response.writeHead(400).end(); return; }
        const { id, host } = await getHost(request.headers['x-folia-bodian-session']);
        if (host.expires < Date.now()) { hosts.delete(id); response.writeHead(401).end(); return; }
        if (Date.now() - host.window >= 60000) { host.window = Date.now(); host.count = 0; }
        if (++host.count > 120) { response.setHeader('Retry-After', '60'); response.writeHead(429).end(); return; }
        // Serialize this client's state mutations so encrypted persistence cannot reorder logins and logout.
        const run = async () => {
            const result = await host.api.request(operation, params);
            const target = resolve(directory, `${id}.bin`); const temporary = target + '.tmp';
            await writeFile(temporary, seal({ ...host.saved, expires: host.expires }), { mode: 0o600 });
            await rename(temporary, target);
            return result;
        };
        const operationResult = host.chain.then(run, run); host.chain = operationResult.then(() => undefined, () => undefined);
        const result = await operationResult;
        response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify({ session: id, result }));
    } catch {
        // No request parameters, upstream credentials or tokens enter logs or error bodies.
        response.writeHead(502, { 'Content-Type': 'application/json' }); response.end(JSON.stringify({ error: 'Bodian gateway request failed' }));
    }
});
server.requestTimeout = 30000;
server.listen(Number(process.env.BODIAN_PORT || 4305), process.env.BODIAN_HOST || '127.0.0.1', () => console.log('Bodian gateway listening; expose only through your HTTPS reverse proxy.'));
