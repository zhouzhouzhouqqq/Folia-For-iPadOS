import { describe, expect, it } from 'vitest';
import { normalizeNativeEndpoint } from '../../../src/utils/nativeEndpoint';

// test/unit/ipados/nativeEndpoint.test.ts — credentials and insecure API addresses cannot enter the native configuration.
describe('native HTTPS service addresses', () => {
    it('retains reverse proxy prefixes and normalizes whitespace', () => {
        expect(normalizeNativeEndpoint(' https://music.example.test/personal/qq/ ')).toBe('https://music.example.test/personal/qq');
        expect(normalizeNativeEndpoint('')).toBe('');
    });
    it.each(['http://music.example.test', 'capacitor://localhost/api', 'https://user:secret@example.test', 'https://example.test/?token=secret', 'https://example.test/#fragment', '/api/qq'])('rejects %s', address => {
        expect(() => normalizeNativeEndpoint(address)).toThrow();
    });
});
