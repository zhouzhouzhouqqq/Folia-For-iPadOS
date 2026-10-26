import { build } from 'esbuild';
import { copyFile } from 'node:fs/promises';
import path from 'node:path';

// Bundle only the pinned protocol package, replacing its small synchronous crypto boundary for WKWebView.
const out = 'src/services/onlineMusic/qishui/vendor';
await build({ stdin: { contents: `import api from 'qishui-music-api'; export const {createQishuiApi, createQishuiDeviceId, isQishuiDeviceId, QISHUI_OPERATIONS} = api;`, resolveDir: process.cwd() },
    bundle: true, platform: 'browser', format: 'esm', target: 'safari18', outfile: `${out}/qishui.js`,
    inject: ['dev/ipados/mobile-buffer.mjs'], legalComments: 'eof',
    banner: { js: '// Generated from qishui-music-api 0.2.2 (MIT), Noble curves/hashes (MIT) and buffer; see licenses.' },
    plugins: [{ name: 'qishui-browser-crypto', setup(build) {
        build.onResolve({ filter: /^node:crypto$/ }, () => ({ path: path.resolve('dev/ipados/qishui-crypto.mjs') }));
    } }],
});
for (const [name, file] of [['qishui-music-api', 'QISHUI-LICENSE'], ['@noble/curves', 'NOBLE-CURVES-LICENSE'], ['@noble/hashes', 'NOBLE-HASHES-LICENSE'], ['buffer', 'BUFFER-LICENSE'], ['base64-js', 'BASE64-LICENSE'], ['ieee754', 'IEEE754-LICENSE']]) {
    await copyFile(`node_modules/${name}/LICENSE`, `${out}/${file}`);
}
await copyFile('node_modules/blueimp-md5/LICENSE.txt', `${out}/MD5-LICENSE`);
