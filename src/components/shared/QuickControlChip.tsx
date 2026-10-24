import React from 'react';
import { Tooltip } from '../modal/settings/kit/Tooltip';

// src/components/shared/QuickControlChip.tsx
// 播放面板里紧凑参数控件的两种形态：短文字胶囊和图标开关。
// 放在 shared/ 下，让面板和各 visualizer 背景模式都能用，不产生反向依赖。
// 两种都画成控制页那几格的样子（QuickTile）：平时是一层淡底，开着的开关抬起一层、图标用强调色；
// 颜色全取面板的 --st-* 变量，亮暗跟着面板走，不用调用方再传。

const BASE = 'st-t-fast st-focus-inside inline-flex h-7 shrink-0 items-center justify-center rounded-lg transition-[background-color,color,box-shadow,scale,opacity] enabled:active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-40';

/** The value after `current` in `values`, from the first again after the last: what a chip that cycles shows next. */
export const cycleValue = <T,>(values: readonly T[], current: T): T => (
    values[(values.indexOf(current) + 1) % values.length]
);

interface QuickControlChipProps {
    onClick: () => void;
    label: string;
    title: string;
    /** Nothing to change to now (an uploaded picture is the other choice, and there is none): the chip only says what is set. */
    disabled?: boolean;
}

export const QuickControlChip: React.FC<QuickControlChipProps> = ({
    onClick,
    label,
    title,
    disabled,
}) => (
    <Tooltip text={title} className="flex">
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`${BASE} whitespace-nowrap bg-[var(--st-fill)] px-2.5 text-xs text-[color:var(--st-t2)] enabled:hover:bg-[var(--st-fill2)] enabled:hover:text-[color:var(--st-t1)]`}
            aria-label={title}
        >
            {label}
        </button>
    </Tooltip>
);

interface QuickControlToggleProps {
    active: boolean;
    onToggle: () => void;
    label: string;
    children: React.ReactNode;
}

export const QuickControlToggle: React.FC<QuickControlToggleProps> = ({
    active,
    onToggle,
    label,
    children,
}) => (
    <Tooltip text={label} className="flex">
        <button
            type="button"
            onClick={onToggle}
            className={`${BASE} w-7 ${active
                ? 'bg-[var(--st-raise)] text-[color:var(--st-accent)] shadow-[0_1px_2px_rgba(0,0,0,0.2)]'
                : 'bg-[var(--st-fill)] text-[color:var(--st-t3)] hover:bg-[var(--st-fill2)] hover:text-[color:var(--st-t1)]'}`}
            aria-label={label}
            aria-pressed={active}
        >
            {children}
        </button>
    </Tooltip>
);
