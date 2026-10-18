import { rolldown } from 'rolldown';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { createServer } from 'node:http';

// Opt-in anonymous QR smoke test. No login confirmation, credentials or QR images are printed or saved.
// Compile ProviderHTTPProbe.swift first; pass its executable as the sole argument.
const executable = process.argv[2];
const useWebKit = process.argv.includes('--webkit');
if (!executable) throw new Error('Usage: node dev/ipados/probe-mobile-providers.mjs /absolute/path/provider-http-probe');
const output = await mkdtemp(path.join(tmpdir(), 'folia-provider-probe-'));
const timeout = setTimeout(() => { console.error('Anonymous provider probe timed out'); process.exit(1); }, 90000);
const require = createRequire(import.meta.url);
try {
    const entry = `
${useWebKit ? '' : `import WS from ${JSON.stringify(require.resolve('ws'))};
globalThis.WebSocket = class extends WS { constructor(url, protocol) { super(url, protocol, {origin:'capacitor://localhost'}); } };`}
import {requestQqDirect} from ${JSON.stringify(path.resolve('src/services/onlineMusic/mobileDirect/qq.ts'))};
import {requestKugouDirect} from ${JSON.stringify(path.resolve('src/services/onlineMusic/mobileDirect/kugou.ts'))};
export async function probe() {
 let failures=0;
 for (const provider of ['kugou','qq']) {
  let stage='key'; let key;
  const request=provider==='qq'?requestQqDirect:requestKugouDirect;
  try {
   const result=await request('login_qr_key', provider==='qq'?{channel:'qq'}:{});
   key=provider==='qq'?result.data?.unikey:result.data?.qrcode;
   if(!key)throw new Error('Missing QR key');
   stage='image';
   const image=await request('login_qr_create',{key,qrimg:true});
   const uri=provider==='qq'?image.data?.qrimg:image.data?.base64;
   if(!uri?.startsWith('data:image/'))throw new Error('Invalid QR image');
   stage='waiting';
   const check=await request('login_qr_check',{key});
   const status=provider==='qq'?check.code:check.data?.status;
   const waiting=provider==='qq'?status===801:status===1;
   console.log(JSON.stringify({provider,key:true,image:true,waiting,status}));
   if(!waiting)failures++;
  } catch(error) { failures++;console.log(JSON.stringify({provider,stage,ok:false,code:error.code||'protocol',httpStatus:error.httpStatus})); }
  finally { if(provider==='qq'&&key)await request('login_qr_cancel',{key}).catch(()=>{}); }
 }
 return failures;
}`;
    const shim = `
import {spawn} from 'node:child_process';
const records = new Map();
export const FoliaMusicProviders={
 loadState:async({provider})=>({value:records.get(provider)||'{}'}),
 saveState:async({provider,value})=>{records.set(provider,value)},
 request:(options)=>new Promise((resolve,reject)=>{
  const child=spawn(${JSON.stringify(path.resolve(executable))},[],{stdio:['pipe','pipe','pipe']});
  let stdout='';
  child.stdout.on('data',data=>stdout+=data);
  child.stderr.on('data',data=>process.stderr.write(data));
  child.on('error',()=>reject(new Error('Native probe process failed')));
  child.on('close',code=>{if(code!==0)reject(new Error('Native HTTPS failed'));else{try{const response=JSON.parse(stdout); console.error(JSON.stringify({host:new URL(options.url).hostname,httpStatus:response.status}));resolve(response)}catch{reject(new Error('Native response parse failed'))}}});
  child.stdin.end(JSON.stringify(options));
 })
};`;
    const browserShim = `const records=new Map();export const FoliaMusicProviders={
        loadState:async({provider})=>({value:records.get(provider)||'{}'}),
        saveState:async({provider,value})=>{records.set(provider,value)},
        request:options=>globalThis.nativeProviderRequest(options)};`;
    const bundle = await rolldown({ input: 'probe-entry', platform: useWebKit ? 'browser' : 'node', external: ['ws', require.resolve('ws')], plugins: [{
        name: 'anonymous-probe',
        resolveId(source) {
            if (source === 'probe-entry') return '\0entry';
            if (source.endsWith('/ios/musicProviders')) return '\0native';
            if (source.endsWith('/providerStorage')) return '\0storage';
        },
        load(id) {
            if (id === '\0entry') return entry;
            if (id === '\0native') return useWebKit ? browserShim : shim;
            if (id === '\0storage') return 'export const writeProviderSessionValue=()=>{};export const removeProviderSessionValue=()=>{};';
        },
    }] });
    const target = path.join(output, 'probe.mjs');
    await bundle.write({ file: target, format: 'esm' });
    await bundle.close();
    if (useWebKit) {
        const nativeTarget = path.join(output, 'native.mjs');
        const { writeFile } = await import('node:fs/promises');
        await writeFile(nativeTarget, shim);
        const { FoliaMusicProviders } = await import(pathToFileURL(nativeTarget).href);
        const source = await readFile(target);
        const server = createServer((request, response) => {
            response.setHeader('Content-Type', request.url === '/probe.mjs' ? 'text/javascript' : 'text/html');
            response.end(request.url === '/probe.mjs' ? source : '<!doctype html><title>Anonymous provider test</title>');
        });
        await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
        let browser;
        try {
            const { webkit } = await import('@playwright/test');
            browser = await webkit.launch();
            const page = await browser.newPage();
            page.on('console', message => { if (message.type() === 'log') console.log(message.text()); });
            await page.exposeFunction('nativeProviderRequest', options => FoliaMusicProviders.request(options));
            await page.goto(`http://127.0.0.1:${server.address().port}`);
            process.exitCode = await page.evaluate(async () => (await import('/probe.mjs')).probe()) ? 1 : 0;
        } finally {
            await browser?.close();
            await new Promise(resolve => server.close(resolve));
        }
    } else {
        const { probe } = await import(pathToFileURL(target).href);
        process.exitCode = await probe() ? 1 : 0;
    }
} finally {
    clearTimeout(timeout);
    await rm(output, { recursive: true, force: true });
}
// Upstream auth sweep timers are intentionally not left running by the CLI.
process.exit(process.exitCode || 0);
