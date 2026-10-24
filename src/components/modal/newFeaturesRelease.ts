import { AudioWaveform, Compass, LogIn, Music2, QrCode, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// src/components/modal/newFeaturesRelease.ts

type NewFeatureCard = {
    id: string;
    icon: LucideIcon;
};

type NewFeaturesRelease = {
    i18nKey: string;
    /** 重大更新：介绍上方显示「<代号> Update · 重大更新」标签；代号不翻译，文案在 help.majorUpdateLabel。 */
    majorUpdate?: { codename: string };
    features: NewFeatureCard[];
};

// Defines the current release's cards; their localized text lives under i18nKey in every locale.
export const NEW_FEATURES_RELEASE: NewFeaturesRelease = {
    i18nKey: 'releaseNotes.v0_7_21',
    majorUpdate: { codename: 'Sabbat-of-the-witch' },
    features: [
        { id: 'spotifyYtm', icon: Music2 },
        { id: 'loginWindow', icon: LogIn },
        { id: 'explore', icon: Compass },
        { id: 'smartBeat', icon: AudioWaveform },
        { id: 'qqMusic', icon: QrCode },
        { id: 'moreDetails', icon: Sparkles },
    ],
};
