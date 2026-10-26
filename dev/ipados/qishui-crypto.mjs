import { Buffer } from 'buffer';
import { p256 } from '@noble/curves/nist.js';
import md5 from 'blueimp-md5';

// Minimal Node crypto contract used by qishui-music-api 0.2.2, backed by browser CSPRNG and Noble P-256.
const der = (tag, ...parts) => {
    const bytes = Buffer.concat(parts);
    const size = bytes.length;
    return Buffer.concat([Buffer.from([tag, ...(size < 128 ? [size] : size < 256 ? [0x81, size] : [0x82, size >> 8, size & 255])]), bytes]);
};
const algorithm = der(0x30, Buffer.from('06072a8648ce3d020106082a8648ce3d030107', 'hex'));
const publicDer = secret => der(0x30, algorithm, der(3, Buffer.from([0]), Buffer.from(p256.getPublicKey(secret, false))));
const privateDer = secret => der(0x30, der(2, Buffer.from([0])), algorithm,
    der(4, der(0x30, der(2, Buffer.from([1])), der(4, secret), der(0xa1, der(3, Buffer.from([0]), Buffer.from(p256.getPublicKey(secret, false)))))));
const pem = bytes => `-----BEGIN PRIVATE KEY-----\n${bytes.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END PRIVATE KEY-----\n`;
const keyObject = secret => ({
    secret, asymmetricKeyType: 'ec', asymmetricKeyDetails: { namedCurve: 'prime256v1' },
    export(options) {
        if (options.type !== 'pkcs8' || options.format !== 'pem') throw new Error('Unsupported Qishui private key encoding');
        return pem(privateDer(secret));
    },
});
export const randomBytes = count => {
    if (!Number.isInteger(count) || count < 0 || count > 65536) throw new Error('Invalid random size');
    return Buffer.from(globalThis.crypto.getRandomValues(new Uint8Array(count)));
};
export const randomUUID = () => globalThis.crypto.randomUUID();
export const generateKeyPairSync = (type, options) => {
    if (type !== 'ec' || options.namedCurve !== 'prime256v1') throw new Error('Unsupported Qishui key algorithm');
    const secret = Buffer.from(p256.utils.randomSecretKey());
    return { privateKey: keyObject(secret), publicKey: { export(options) {
        if (options.type !== 'spki' || options.format !== 'der') throw new Error('Unsupported Qishui public key encoding');
        return publicDer(secret);
    } } };
};
export const createPrivateKey = raw => {
    if (typeof raw !== 'string' || raw.length > 4096 || !/^-----BEGIN PRIVATE KEY-----\n[\s\S]+\n-----END PRIVATE KEY-----\n?$/.test(raw)) throw new Error('Invalid Qishui private key');
    const bytes = Buffer.from(raw.replace(/-----[^\n]+-----|\s/g, ''), 'base64');
    const start = bytes.indexOf(Buffer.from('0201010420', 'hex'));
    if (start < 0) throw new Error('Invalid Qishui EC key');
    const secret = bytes.subarray(start + 5, start + 37);
    if (secret.length !== 32 || !privateDer(secret).equals(bytes)) throw new Error('Invalid Qishui P-256 PKCS8');
    return keyObject(secret);
};
export const sign = (algorithm, bytes, key) => {
    if (algorithm !== 'sha256' || key?.secret?.length !== 32) throw new Error('Invalid Qishui signature');
    return Buffer.from(p256.sign(bytes, key.secret, { prehash: true, format: 'der', lowS: false }));
};
export const createHash = algorithm => {
    if (algorithm !== 'md5') throw new Error('Unsupported Qishui digest');
    let input = '';
    const hash = { update(value) { input += String(value); return hash; }, digest(encoding) {
        if (encoding !== 'hex') throw new Error('Unsupported Qishui digest encoding');
        return md5(input);
    } };
    return hash;
};
