import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePlayerBarPresentationStore } from '../../../src/stores/usePlayerBarPresentationStore';
import { usePlayerBottomBarLayoutStore } from '../../../src/stores/usePlayerBottomBarLayoutStore';
import { playerBottomBarLiveOffset } from '../../../src/stores/motionSignals';
import { useAppChromeStore } from '../../../src/stores/useAppChromeStore';
import { usePlayerChromeSettingsStore } from '../../../src/stores/usePlayerChromeSettingsStore';

// Disclosure must have a recovery path even after hiding chrome or entering positioning mode.
vi.mock('../../../src/stores/usePlayerChromeSettingsStore', () => ({
    usePlayerChromeSettingsStore: { getState: () => chrome },
}));
const chrome = vi.hoisted(() => ({
    hidePlayerProgressBar: false,
    handleToggleHidePlayerProgressBar: vi.fn(),
}));

describe('bottom player disclosure', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chrome.hidePlayerProgressBar = false;
        usePlayerBarPresentationStore.setState({ presentation: 'automatic' });
        usePlayerBottomBarLayoutStore.setState({ isPositioning: false });
        useAppChromeStore.setState({ isPlayerChromeHidden: false });
    });

    it('restores controls even when the existing persistent hide switch is on', () => {
        chrome.hidePlayerProgressBar = true;
        useAppChromeStore.setState({ isPlayerChromeHidden: true });
        usePlayerBarPresentationStore.getState().setPresentation('hidden');
        usePlayerBarPresentationStore.getState().setPresentation('expanded');
        expect(chrome.handleToggleHidePlayerProgressBar).toHaveBeenCalledWith(false);
        expect(useAppChromeStore.getState().isPlayerChromeHidden).toBe(false);
        expect(usePlayerBarPresentationStore.getState().presentation).toBe('expanded');
    });

    it.each(['collapsed', 'hidden'] as const)('%s cancels an unfinished drag and rolls back the offset', presentation => {
        playerBottomBarLiveOffset.set(64);
        usePlayerBottomBarLayoutStore.getState().startPositioning();
        playerBottomBarLiveOffset.set(200);
        usePlayerBarPresentationStore.getState().setPresentation(presentation);
        expect(usePlayerBottomBarLayoutStore.getState().isPositioning).toBe(false);
        expect(playerBottomBarLiveOffset.get()).toBe(64);
        expect(usePlayerBarPresentationStore.getState().presentation).toBe(presentation);
    });

    it('keeps manual hiding transient without overwriting the saved visibility preference', () => {
        usePlayerBarPresentationStore.getState().setPresentation('hidden');
        expect(chrome.handleToggleHidePlayerProgressBar).not.toHaveBeenCalled();
    });
});
