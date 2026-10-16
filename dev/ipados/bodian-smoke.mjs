import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

// Gateway smoke uses only local login_status/logout. No upstream request, account or personal data.
const root = resolve(import.meta.dirname, '../..');
const directory = await mkdtemp(resolve(tmpdir(), 'folia-bodian-smoke-'));
const port = process.env.FOLIA_SMOKE_PORT || '4315';
const secret = randomBytes(32).toString('hex');
let child;
async function start() {
    child = spawn(process.execPath, [resolve(root, 'deploy/ipados-bodian/server.mjs')], {
        cwd: root, env: { ...process.env, BODIAN_SESSION_SECRET: secret, BODIAN_DATA_DIR: directory, BODIAN_PORT: port, BODIAN_HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'],
    });
    await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Gateway startup timed out')), 10000);
        child.stdout.once('data', () => { clearTimeout(timer); resolve(); });
        child.once('exit', code => { clearTimeout(timer); reject(new Error(`Gateway exited: ${code}`)); });
    });
}
async function stop() {
    if (!child || child.exitCode !== null) return;
    const exited = new Promise(resolve => child.once('exit', resolve)); child.kill(); await exited;
}
const request = (operation, session, origin = 'capacitor://localhost') => fetch(`http://127.0.0.1:${port}/request`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, ...(session ? { 'X-Folia-Bodian-Session': session } : {}) },
    body: JSON.stringify({ operation, params: {} }),
});
try {
    await start();
    assert.equal((await request('not_an_operation')).status, 400);
    assert.equal((await request('login_status', null, 'https://untrusted.example')).status, 403);
    const response = await request('login_status'); assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), 'capacitor://localhost');
    const first = await response.json(); assert.match(first.session, /^[a-f0-9]{64}$/); assert.deepEqual(first.result, { ok: true, data: null });
    assert.equal((await readdir(directory)).filter(file => file.endsWith('.bin')).length, 1);
    const sealed = await readFile(resolve(directory, `${first.session}.bin`));
    assert.equal(sealed.includes(Buffer.from('deviceId')), false);
    await stop(); await start();
    const restored = await (await request('login_status', first.session)).json();
    assert.equal(restored.session, first.session); assert.deepEqual(restored.result, { ok: true, data: null });
    const logout = await (await request('logout', first.session)).json(); assert.equal(logout.result.ok, true);
    console.log('PASS: operation allowlist, rejected origin, CORS, logged-out session, encrypted persistence, restart, logout. No upstream requests.');
} finally { await stop(); await rm(directory, { recursive: true, force: true }); }
