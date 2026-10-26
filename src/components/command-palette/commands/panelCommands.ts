import { ListMusic } from 'lucide-react';
import type { CommandPaletteCommand } from '../types';
import { createPanelCommand, createToggleCommand } from '../commandFactories';

// src/components/command-palette/commands/panelCommands.ts
// Commands in the `panel` group: opening the unified side panel on a given tab.

export const panelCommands: CommandPaletteCommand[] = [
    createToggleCommand('player-bar-expand', 'panel', 'Show bottom controls', 'Expand the bottom playback controls', ['restore player bar', '展开底栏', '显示播放控制'], context => context.panel.setPlayerBarPresentation('expanded')),
    createToggleCommand('player-bar-collapse', 'panel', 'Collapse bottom controls', 'Keep only the music progress bar', ['compact player bar', '收起底栏', '折叠播放控制'], context => context.panel.setPlayerBarPresentation('collapsed')),
    createToggleCommand('player-bar-hide', 'panel', 'Hide bottom controls', 'Hide playback controls and leave a restore button', ['dismiss player bar', '隐藏底栏', '隐藏播放控制'], context => context.panel.setPlayerBarPresentation('hidden')),
    createPanelCommand('cover', 'Panel: cover', 'Open the cover panel tab', ['cover panel', '封面'], undefined, { executeShortcut: 'c' }),
    createPanelCommand('controls', 'Panel: controls', 'Open the controls panel tab', ['controls panel', '控制']),
    createPanelCommand('queue', 'Panel: queue', 'Open the queue panel tab', ['queue panel', '队列'], ListMusic),
    createPanelCommand('account', 'Panel: quality', 'Open the quality panel tab', ['quality panel', 'audio quality', 'account panel', '音质', '账号', '账户']),
    createPanelCommand('local', 'Panel: local', 'Open the local panel tab', ['local panel', '本地面板']),
    createPanelCommand('navi', 'Panel: Navidrome', 'Open the Navidrome panel tab', ['panel navi', 'navi panel', 'navidrome 面板', '服务器面板']),
    createPanelCommand('onlineLyrics', 'Panel: lyrics', 'Open the online lyrics panel tab', ['lyrics panel', '歌词面板']),
];
