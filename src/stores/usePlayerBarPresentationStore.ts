import { create } from 'zustand';
import { usePlayerBottomBarLayoutStore } from './usePlayerBottomBarLayoutStore';
import { usePlayerChromeSettingsStore } from './usePlayerChromeSettingsStore';
import { useAppChromeStore } from './useAppChromeStore';

// Session-only disclosure state, like an open panel; not an appearance preset or audio setting.
export type PlayerBarPresentation = 'automatic' | 'expanded' | 'collapsed' | 'hidden';

export const usePlayerBarPresentationStore = create<{
    presentation: PlayerBarPresentation;
    setPresentation: (presentation: PlayerBarPresentation) => void;
}>((set) => ({
    presentation: 'automatic',
    setPresentation: (presentation) => {
        const layout = usePlayerBottomBarLayoutStore.getState();
        if (layout.isPositioning && (presentation === 'collapsed' || presentation === 'hidden')) {
            layout.cancelPositioning();
        }
        if (presentation === 'expanded' || presentation === 'collapsed') {
            const chrome = usePlayerChromeSettingsStore.getState();
            if (chrome.hidePlayerProgressBar) chrome.handleToggleHidePlayerProgressBar(false);
            useAppChromeStore.getState().setIsPlayerChromeHidden(false);
        }
        set({ presentation });
    },
}));
