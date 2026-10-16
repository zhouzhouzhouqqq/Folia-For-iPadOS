import { beforeEach, describe, expect, it, vi } from 'vitest';

// Rejecting native text transfer must stop the AI call before it can start a request.
const state = vi.hoisted(() => ({ native: true }));
vi.mock('../../../src/platform/capabilities', () => ({ isNativeIOS: () => state.native }));
vi.mock('../../../src/i18n/config', () => ({ default: { t: (_key: string, args: { destination: string }) => args.destination } }));
beforeEach(() => { vi.resetModules(); state.native = true; vi.stubGlobal('window', { confirm: vi.fn(() => true) }); });
describe('AI text transfer consent', () => {
    it('requires approval per destination and does not retain a rejection', async () => {
        const { requireNativeAiConsent } = await import('../../../src/platform/ios/dataConsent');
        vi.mocked(window.confirm).mockReturnValueOnce(false);
        expect(() => requireNativeAiConsent('https://one.example/api/theme')).toThrow('declined');
        requireNativeAiConsent('https://one.example/api/theme');
        requireNativeAiConsent('https://one.example/api/segment');
        expect(window.confirm).toHaveBeenCalledTimes(2);
        requireNativeAiConsent('https://two.example/api/theme');
        expect(window.confirm).toHaveBeenCalledTimes(3);
    });
    it('preserves the original web flow', async () => {
        state.native = false;
        const { requireNativeAiConsent } = await import('../../../src/platform/ios/dataConsent');
        requireNativeAiConsent('/api/generate-theme');
        expect(window.confirm).not.toHaveBeenCalled();
    });
});
