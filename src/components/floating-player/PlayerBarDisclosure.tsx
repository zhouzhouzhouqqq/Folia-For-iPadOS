import React from 'react';
import { ChevronDown, ChevronUp, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePlayerBarPresentationStore } from '../../stores/usePlayerBarPresentationStore';

// Explicit touch/keyboard disclosure controls; changing chrome never touches the audio transport.
type Props = {
    compact?: boolean;
    touchControls?: boolean;
};

const buttonClass = 'flex shrink-0 items-center justify-center rounded-full touch-manipulation select-none opacity-60 hover:opacity-100 hover:bg-current/10 active:scale-95 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2';

export const PlayerBarRestoreButton = () => {
    const { t } = useTranslation();
    const manuallyHidden = usePlayerBarPresentationStore(state => state.presentation === 'hidden');
    return (
        <button type="button" data-player-bar-restore
            autoFocus={manuallyHidden}
            aria-label={t('playerBar.show')} title={t('playerBar.show')}
            className={`${buttonClass} h-11 w-14 bg-(--bg-color)/80 shadow-lg`}
            onClick={(event) => {
                event.stopPropagation();
                usePlayerBarPresentationStore.getState().setPresentation('expanded');
            }}>
            <ChevronUp size={18} aria-hidden="true" />
        </button>
    );
};

export default function PlayerBarDisclosure({ compact = false, touchControls = false }: Props) {
    const { t } = useTranslation();
    const setPresentation = usePlayerBarPresentationStore(state => state.setPresentation);
    const explicitlyExpanded = usePlayerBarPresentationStore(state => state.presentation === 'expanded');
    return (
        <div className="flex shrink-0 items-center" onClick={event => event.stopPropagation()}>
            {compact ? (
                    <button type="button" className={`${buttonClass} h-11 w-11`}
                        autoFocus
                        aria-label={t('playerBar.expand')} title={t('playerBar.expand')}
                        onClick={() => setPresentation('expanded')}>
                        <ChevronUp size={16} aria-hidden="true" />
                    </button>
            ) : (
                <>
                    <button type="button" className={`${buttonClass} ${touchControls ? 'h-11 w-11' : 'h-7 w-7'}`}
                        autoFocus={explicitlyExpanded}
                        aria-label={t('playerBar.collapse')} title={t('playerBar.collapse')}
                        onClick={() => setPresentation('collapsed')}><ChevronDown size={16} aria-hidden="true" /></button>
                    <button type="button" className={`${buttonClass} ${touchControls ? 'h-11 w-11' : 'h-7 w-7'}`}
                        aria-label={t('playerBar.hide')} title={t('playerBar.hide')}
                        onClick={() => setPresentation('hidden')}><EyeOff size={16} aria-hidden="true" /></button>
                </>
            )}
        </div>
    );
}
