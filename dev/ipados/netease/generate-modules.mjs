import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';

// Reuse audited upstream request mappings as ESM; no Node runtime or dynamic code loading ships in iOS.
const require = createRequire(import.meta.url);
const root = path.dirname(require.resolve('@neteasecloudmusicapienhanced/api/package.json'));
const version = JSON.parse(fs.readFileSync(path.join(root, 'package.json'))).version;
if (version !== '4.41.1') throw new Error(`Re-audit upstream mappings before generating from ${version}`);
const destination = path.resolve('src/services/onlineMusic/neteaseDirect/vendor');
fs.mkdirSync(destination, { recursive: true });
const source = fs.readFileSync('src/services/onlineMusic/netease/netease.ts', 'utf8');
const routes = [...new Set(['/logout', ...[...source.matchAll(/fetchWithCreds\(`([^?`$]+)/g)].map(match => match[1])])].sort();
const special = new Set(['/login/qr/create', '/login/qr/check', '/song/url/v1', '/scrobble/v1']);
const names = [];
const manifest = [];
for (const route of routes) {
  if (special.has(route)) continue;
  const name = route.slice(1).replaceAll('/', '_');
  const original = fs.readFileSync(path.join(root, 'module', `${name}.js`), 'utf8');
  const imports = [...original.matchAll(/require\('([^']+)'\)/g)].map(match => match[1]);
  if (imports.some(value => !['../util/option.js', '../util/config.json'].includes(value))) throw new Error(`Review dependencies for ${name}`);
  let converted = original.replace("const createOption = require('../util/option.js')", "import createOption from '../options';")
    .replace("const { APP_CONF } = require('../util/config.json')", "import { APP_CONF } from '../upstreamConfig';")
    .replace('module.exports =', 'export default');
  if (converted.includes('require(') || converted.includes('process.')) throw new Error(`Node dependency remains in ${name}`);
  converted = '// @ts-nocheck\n// Derived from @neteasecloudmusicapienhanced/api 4.41.1 (MIT); mapping preserved. See LICENSE and manifest.json.\n' + converted;
  fs.writeFileSync(path.join(destination, `${name}.js`), converted);
  names.push([route, name]);
  manifest.push({ route, module: name, upstreamSha256: crypto.createHash('sha256').update(original).digest('hex') });
}
fs.writeFileSync(path.join(destination, 'index.ts'), names.map(([,name], i) => `import operation${i} from './${name}.js';`).join('\n') + '\n\n// Statically bundled upstream route adapters.\nexport const upstreamRoutes: Record<string, (query: any, request: any) => Promise<any>> = {\n' + names.map(([route], i) => `    '${route}': operation${i},`).join('\n') + '\n};\n');
fs.writeFileSync(path.join(destination, 'LICENSE'), fs.readFileSync(path.join(root, 'LICENSE')));
fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify({ package: '@neteasecloudmusicapienhanced/api', version: '4.41.1', routes: manifest }, null, 2) + '\n');
const conf = JSON.parse(fs.readFileSync(path.join(root, 'util/config.json')));
fs.writeFileSync(path.join(destination, '../upstreamConfig.ts'), '// Public protocol constants from API Enhanced 4.41.1 (MIT); not server credentials.\nexport const APP_CONF = ' + JSON.stringify(conf.APP_CONF, null, 2) + ';\n');
console.log(`Generated ${names.length} upstream mappings; ${special.size} explicit platform adaptations.`);
