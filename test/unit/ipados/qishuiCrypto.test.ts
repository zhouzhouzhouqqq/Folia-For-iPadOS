import { createPublicKey, verify, createHash as nodeHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { Buffer } from 'buffer';
import { createPrivateKey, generateKeyPairSync, sign, createHash, randomBytes } from '../../../dev/ipados/qishui-crypto.mjs';

// Interoperability checks for the browser replacement of the upstream ticket-guard crypto contract.
describe('Qishui browser P-256 boundary', () => {
    it('exports PKCS8/SPKI accepted by OpenSSL and restores the same signing key', () => {
        const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
        const pem = pair.privateKey.export({ type: 'pkcs8', format: 'pem' });
        const key = createPrivateKey(pem);
        const publicKey = createPublicKey(pem);
        expect(publicKey.export({ type: 'spki', format: 'der' })).toEqual(pair.publicKey.export({ type: 'spki', format: 'der' }));
        const message = Buffer.from('ticket=synthetic&path=/api/luna/v1/platform/me/info/&timestamp=12345');
        expect(verify('sha256', message, publicKey, sign('sha256', message, key))).toBe(true);
        expect(verify('sha256', Buffer.from('modified'), publicKey, sign('sha256', message, key))).toBe(false);
        expect(key.asymmetricKeyDetails.namedCurve).toBe('prime256v1');
    });
    it('keeps the upstream MD5 identity and bounded secure random byte contract', () => {
        expect(createHash('md5').update('com.luna.music.car').digest('hex')).toBe(nodeHash('md5').update('com.luna.music.car').digest('hex'));
        expect(randomBytes(8).readBigUInt64BE()).toBeTypeOf('bigint');
        expect(randomBytes(16)).not.toEqual(randomBytes(16));
        expect(() => randomBytes(65537)).toThrow();
        expect(() => createPrivateKey('not a key')).toThrow();
        expect(() => generateKeyPairSync('rsa', {})).toThrow();
    });
});
