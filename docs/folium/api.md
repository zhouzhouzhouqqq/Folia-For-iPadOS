<!-- 本文件由 `npm run folium:api` 从 src/mods/folium/contract.ts 和 mainContract.ts 生成，请勿手动修改。 -->

# Folium API 参考

当前契约版本：**Folium 1.6**。

本文列出模组能用到的全部公开类型，内容直接来自契约文件 [`src/mods/folium/contract.ts`](../../src/mods/folium/contract.ts)
（client 入口）与 [`src/mods/folium/mainContract.ts`](../../src/mods/folium/mainContract.ts)（main 入口），
成员说明保留契约里的原文注释。平台规则（清单、权限、生命周期、安全模型）见 [Folium 规范](../../mods/README.md)，
从零开始写模组、调试与发布到模组市场见 [模组开发与贡献指南](contributing.md)。

## 目录

- **客户端入口**：[权限一览](#权限一览) · [FoliumContextKind](#foliumcontextkind) · [FoliumHostInfo](#foliumhostinfo) · [FoliumStorage](#foliumstorage) · [FoliumRpc](#foliumrpc) · [FoliumLogger](#foliumlogger) · [FoliumClientApi](#foliumclientapi) · [FoliumClientModule](#foliumclientmodule)
- **注册表与条目**：[注册表一览](#注册表一览) · [FoliumVisualizerDef](#foliumvisualizerdef) · [FoliumTuningDef](#foliumtuningdef) · [FoliumCommandContext](#foliumcommandcontext) · [FoliumCommandDef](#foliumcommanddef) · [FoliumBackgroundContext](#foliumbackgroundcontext) · [FoliumBackgroundDef](#foliumbackgrounddef) · [FoliumStageSlot](#foliumstageslot) · [FoliumStageLayerDef](#foliumstagelayerdef) · [FoliumSettingsSectionDef](#foliumsettingssectiondef) · [FoliumPlayerPanelTabDef](#foliumplayerpaneltabdef) · [FoliumHomeTabDef](#foliumhometabdef) · [FoliumProgressContext](#foliumprogresscontext) · [FoliumProgressButtonSlot](#foliumprogressbuttonslot) · [FoliumProgressButtonDef](#foliumprogressbuttondef) · [FoliumProgressLayerDef](#foliumprogresslayerdef) · [FoliumStyleDef](#foliumstyledef) · [FoliumRegistryHandle](#foliumregistryhandle) · [FoliumSettingsSectionHandle](#foliumsettingssectionhandle) · [FoliumRegistry](#foliumregistry) · [FoliumRegistries](#foliumregistries)
- **宿主容器与上下文**：[FoliumMount](#foliummount) · [FoliumSize](#foliumsize) · [FoliumMountHelpers](#foliummounthelpers) · [FoliumPanelContext](#foliumpanelcontext) · [FoliumSettingsPanelContext](#foliumsettingspanelcontext) · [FoliumClock](#foliumclock) · [FoliumSurface](#foliumsurface) · [FoliumAudioBands](#foliumaudiobands) · [FoliumAudio](#foliumaudio) · [FoliumDisplay](#foliumdisplay) · [FoliumStageContext](#foliumstagecontext)
- **事件**：[事件一览](#事件一览) · [FoliumEventPriority](#foliumeventpriority) · [FoliumPlaybackFailureReason](#foliumplaybackfailurereason) · [FoliumNotificationEvents](#foliumnotificationevents) · [FoliumLyricsTransformEvent](#foliumlyricstransformevent) · [FoliumBeforePlayEvent](#foliumbeforeplayevent) · [FoliumOmniLyricsEvent](#foliumomnilyricsevent) · [FoliumOmniAudioEvent](#foliumomniaudioevent) · [FoliumHookEvents](#foliumhookevents) · [FoliumEventMap](#foliumeventmap) · [FoliumEvents](#foliumevents)
- **服务**：[FoliumPlaybackService](#foliumplaybackservice) · [FoliumFileHandle](#foliumfilehandle) · [FoliumIconOptions](#foliumiconoptions) · [FoliumUiService](#foliumuiservice) · [FoliumFetchInit](#foliumfetchinit) · [FoliumFetchResponse](#foliumfetchresponse) · [FoliumLyricsService](#foliumlyricsservice) · [FoliumNetService](#foliumnetservice)
- **共享工具**：[FoliumWordSegment](#foliumwordsegment) · [FoliumWordColorRange](#foliumwordcolorrange) · [FoliumLyricsHelpers](#foliumlyricshelpers) · [FoliumThemeHelpers](#foliumthemehelpers)
- **设置 schema**：[FoliumSettingType](#foliumsettingtype) · [FoliumSettingOption](#foliumsettingoption) · [FoliumSetting](#foliumsetting) · [FoliumSettingValues](#foliumsettingvalues) · [FoliumSettingAccess](#foliumsettingaccess)
- **数据结构**：[FoliumLyricRuby](#foliumlyricruby) · [FoliumLyricSyllable](#foliumlyricsyllable) · [FoliumLyricAlternateText](#foliumlyricalternatetext) · [FoliumWord](#foliumword) · [FoliumBackgroundVocal](#foliumbackgroundvocal) · [FoliumLineTimingClass](#foliumlinetimingclass) · [FoliumLineTransitionMode](#foliumlinetransitionmode) · [FoliumWordRevealMode](#foliumwordrevealmode) · [FoliumLineRenderHints](#foliumlinerenderhints) · [FoliumLine](#foliumline) · [FoliumTheme](#foliumtheme) · [FoliumSong](#foliumsong) · [FoliumPlaybackState](#foliumplaybackstate) · [FoliumLoopMode](#foliumloopmode) · [FoliumQueueItem](#foliumqueueitem) · [FoliumQueueSnapshot](#foliumqueuesnapshot) · [FoliumPlaybackSnapshot](#foliumplaybacksnapshot) · [FoliumLyricFormat](#foliumlyricformat) · [FoliumLyricsTrack](#foliumlyricstrack) · [FoliumLyricsResult](#foliumlyricsresult) · [FoliumLegacyLyricsResult](#foliumlegacylyricsresult) · [FoliumParsedLyrics](#foliumparsedlyrics)
- **实验接口**：[FoliumLayoutRect](#foliumlayoutrect) · [FoliumPlayerObstacle](#foliumplayerobstacle) · [FoliumPlayerLayout](#foliumplayerlayout) · [FoliumRemoteActionDef](#foliumremoteactiondef) · [FoliumRemoteActionsContext](#foliumremoteactionscontext) · [FoliumRemoteActionsDef](#foliumremoteactionsdef) · [FoliumRemoteActionsHandle](#foliumremoteactionshandle) · [FoliumProviderSong](#foliumprovidersong) · [FoliumAudioQuality](#foliumaudioquality) · [FoliumOmniProviderDef](#foliumomniproviderdef)
- **main 入口（Node）**：[FoliumMainModule](#foliummainmodule) · [FoliumMainApi](#foliummainapi) · [FoliumManifest](#foliummanifest) · [FoliumMainStorage](#foliummainstorage) · [FoliumModPaths](#foliummodpaths) · [FoliumMainPaths](#foliummainpaths) · [FoliumMainRuntime](#foliummainruntime) · [FoliumMainRpc](#foliummainrpc) · [FoliumMainRender](#foliummainrender) · [FoliumExportSpec](#foliumexportspec) · [FoliumExportResult](#foliumexportresult)
- **基础类型**：[FOLIUM_VERSION](#folium_version) · [FoliumId](#foliumid) · [FoliumLabel](#foliumlabel) · [FoliumDisposer](#foliumdisposer)
- **[仍可用的旧名字](#仍可用的旧名字)**

## 客户端入口

模组的 `client` 入口默认导出 `activate(folium)`，参数就是 [FoliumClientApi](#foliumclientapi)，所有能力都从这里取。

### 权限一览

本表由 `electron/modSystem/foliumShared.json` 里每个权限的 `guards` 生成，`npm run folium:check` 用同一张表查模组用到的成员。

| 权限 | 解锁的成员 |
| --- | --- |
| `filesystem.data` | `folium.storage`、`api.storage` |
| `playback.read` | `api.runtime.getPlaybackSnapshot` |
| `playback.control` | `folium.playback.play`、`folium.playback.pause`、`folium.playback.toggle`、`folium.playback.seek`、`folium.playback.seekToLyricTime`、`folium.playback.next`、`folium.playback.previous`、`folium.playback.playSong`、`folium.playback.enqueue`、`folium.playback.shuffleQueue`、`folium.playback.toggleLike`、`folium.playback.setVolume`、`folium.playback.setMuted`、`folium.playback.setLoopMode`、`folium.playback.playQueueItem` |
| `render.export` | `api.render.exportVideo` |
| `net.fetch` | `folium.net.fetch` |
| `net.embed` | `folium.ui.embed` |
| `stageLayers` | `folium.registries.stageLayers` |

`folium.*` 是 client 入口的成员，`api.*` 是 main 入口的成员；写到哪一级就管到哪一级，`folium.storage` 管它下面的全部方法。
模组没有在 `mod.json` 的 `permissions` 里声明这个权限就调用时，同步的成员抛 `permission-denied:<权限>`，异步的成员返回的 promise 以同一个错误拒绝。

### FoliumContextKind

Where a client runs: the main window, or the transparent video export window.

```ts
type FoliumContextKind = 'main' | 'export'
```

### FoliumHostInfo

The host's versions (`folium.host`), for display and logs. Every member of this contract is there from
Folium 1.6 on; an older 1.x host lacks some of them.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `folium` | `{ major: number; minor: number }` | The Folium version (`major`, `minor`). |
| `folia` | `string \| null` | Folia app version, or null when the host cannot tell. |

### FoliumStorage

`folium.storage`: this mod's data file (shared with its main entry, 1 MB). Needs the `filesystem.data`
permission; values must be JSON-serializable.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `get()` | `<T = unknown>(key: string): Promise<T \| undefined>` | The stored value, or undefined. |
| `set()` | `(key: string, value: unknown): Promise<void>` | Stores a JSON-serializable value. |
| `has()` | `(key: string): Promise<boolean>` | Whether the key exists. |
| `delete()` | `(key: string): Promise<void>` | Removes the key. |
| `keys()` | `(): Promise<string[]>` | All keys. |

### FoliumRpc

`folium.rpc`: calls into this mod's main entry.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `call()` | `<T = unknown>(name: string, ...args: unknown[]): Promise<T>` | Calls the function the main entry registered with `api.rpc.handle(name, fn)`; arguments and result must be JSON-serializable. |

### FoliumLogger

`folium.log`. `error` entries show in the mods panel under the mod.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `info()` | `(message: string, details?: unknown): void` | Informational log. |
| `warn()` | `(message: string, details?: unknown): void` | Warning. |
| `error()` | `(message: string, details?: unknown): void` | Error; shown in the mods panel. |

### FoliumClientApi

The object a client entry's `activate(folium)` receives.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly modId` | `string` | This mod's id. |
| `readonly host` | `FoliumHostInfo` | Host versions, for display and logs. |
| `readonly env` | `{ readonly context: FoliumContextKind }` | Where this client runs. |
| `readonly log` | `FoliumLogger` | Logging. |
| `readonly registries` | `FoliumRegistries` | Everything a mod can add to the host. |
| `readonly events` | `FoliumEvents` | The event bus. |
| `readonly playback` | `FoliumPlaybackService` | Playback state and control. |
| `readonly ui` | `FoliumUiService` | Toasts, panels, files, embeds, icons. |
| `readonly net` | `FoliumNetService` | Network access through the host. |
| `readonly storage` | `FoliumStorage` | This mod's data file. |
| `readonly rpc` | `FoliumRpc` | Calls into this mod's main entry. |
| `readonly lyrics` | `FoliumLyricsService` | The lyric helpers builtin modes use, and the displayed song's lyrics. |
| `readonly theme` | `FoliumThemeHelpers` | The theme helpers builtin modes use. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | Calls `listener` every `ms` milliseconds (at least 16) until the mod stops; the host stops it then. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | Runs `disposer` when the mod stops, after the disposer `activate` returned; at once when the mod has already stopped. |
| `readonly experimental` | `Readonly<Record<string, unknown>>` | Unfrozen surfaces; each requires the matching manifest `experimental` opt-in. |

相关：[FoliumHostInfo](#foliumhostinfo) · [FoliumContextKind](#foliumcontextkind) · [FoliumLogger](#foliumlogger) · [FoliumRegistries](#foliumregistries) · [FoliumEvents](#foliumevents) · [FoliumPlaybackService](#foliumplaybackservice) · [FoliumUiService](#foliumuiservice) · [FoliumNetService](#foliumnetservice) · [FoliumStorage](#foliumstorage) · [FoliumRpc](#foliumrpc) · [FoliumLyricsService](#foliumlyricsservice) · [FoliumThemeHelpers](#foliumthemehelpers) · [FoliumDisposer](#foliumdisposer)

### FoliumClientModule

The shape of a client entry module.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `default` | `(folium: FoliumClientApi) => void \| FoliumDisposer \| Promise<void \| FoliumDisposer>` | `activate(folium)`; may return a disposer, which runs before the host removes the mod's registrations. |

相关：[FoliumClientApi](#foliumclientapi) · [FoliumDisposer](#foliumdisposer)

## 注册表与条目

`folium.registries.<名称>.register(def)` 返回 [FoliumRegistryHandle](#foliumregistryhandle)。条目 id 由宿主加上命名空间成为 `<modid>:<id>`；模组停用时宿主自动撤下它注册的一切。

### 注册表一览

本表由宿主里那张条目种类表（`src/mods/folium/kinds.ts`）生成。

| 注册表 | 用途 | 条目定义 | 需要的权限 | 导出窗口里 | 容器的 `data-folium-kind` |
| --- | --- | --- | --- | --- | --- |
| `visualizers` | 歌词动画模式 | [FoliumVisualizerDef](#foliumvisualizerdef) | — | 生效 | `visualizer`、`visualizer-settings` |
| `tunings` | 给声明了 Folium 可调键的内置模式调参 | [FoliumTuningDef](#foliumtuningdef) | — | 生效 | `tuning` |
| `commands` | 命令：出现在模组面板与命令面板 | [FoliumCommandDef](#foliumcommanddef) | — | 不生效 | — |
| `backgrounds` | 背景类型（出现在背景选择器，预览与导出同样生效） | [FoliumBackgroundDef](#foliumbackgrounddef) | — | 生效 | `background`、`background-settings` |
| `stageLayers` | 播放页图层 | [FoliumStageLayerDef](#foliumstagelayerdef) | `stageLayers` | 不生效 | `stage-layer` |
| `settingsSections` | 模组自己的设置，显示在模组面板里该模组展开后的区域 | [FoliumSettingsSectionDef](#foliumsettingssectiondef) | — | 生效 | `settings-section` |
| `playerPanelTabs` | 播放器面板的标签页 | [FoliumPlayerPanelTabDef](#foliumplayerpaneltabdef) | — | 不生效 | `panel-tab` |
| `homeTabs` | 首页导航末尾的整页（网格与 Bravais 首页都有），用 `folium.ui.openHomeTab` 打开 | [FoliumHomeTabDef](#foliumhometabdef) | — | 不生效 | `home-tab` |
| `progressButtons` | 进度条左右的按钮（`progress.leading` / `progress.trailing`） | [FoliumProgressButtonDef](#foliumprogressbuttondef) | — | 不生效 | `progress-button` |
| `progressLayers` | 叠在进度条轨道上的图层 | [FoliumProgressLayerDef](#foliumprogresslayerdef) | — | 不生效 | `progress-layer` |
| `styles` | 模组 CSS，只针对公开 part | [FoliumStyleDef](#foliumstyledef) | — | 不生效 | — |

「导出窗口里不生效」的注册表在导出窗口里照常调用、照常返回句柄，但什么都不登记，所以同一份代码两边都能跑。
需要权限的注册表，模组没有在 `mod.json` 里声明这个权限时，`register` 抛 `permission-denied:<权限>`。
最后一列是这种条目的容器外层 `data-folium-kind` 属性的取值（没有容器的写 —）。

### FoliumVisualizerDef

A lyric animation mode. Its mode id is `mod:<modid>:<id>`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id; the mode id becomes `mod:<modid>:<id>`. |
| `label` | `FoliumLabel` | Name in the mode picker. |
| `order?` | `number` | Position in the mode picker; default 500 (after builtin modes). |
| `mount` | `FoliumMount<FoliumStageContext>` | Draws the visualizer into its container. |
| `settings?` | `FoliumSetting[]` | Settings schema; the host renders the form under the mode picker, persists the values and includes them in visual config import/export. |
| `settingsPanel?` | `FoliumMount<FoliumSettingsPanelContext>` | Replaces the host-rendered form; values still follow `settings`. |
| `hostLayers?` | `{ background?: boolean; subtitles?: boolean }` | Host-rendered layers around the visualizer. Both default to true. |

相关：[FoliumLabel](#foliumlabel) · [FoliumMount](#foliummount) · [FoliumStageContext](#foliumstagecontext) · [FoliumSetting](#foliumsetting) · [FoliumSettingsPanelContext](#foliumsettingspanelcontext)

### FoliumTuningDef

Extra tuning knobs for a builtin visualizer mode that declares Folium tunables.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `target` | `string` | A builtin visualizer mode that declares `foliumTunables`, e.g. "sonnet". |
| `label` | `FoliumLabel` | Card title. |
| `settings` | `FoliumSetting[]` | Number fields only; keys and ranges are checked against the target's whitelist. |

相关：[FoliumLabel](#foliumlabel) · [FoliumSetting](#foliumsetting)

### FoliumCommandContext

What a command receives when it runs.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly values` | `FoliumSettingValues` | Validated parameter values (defaults merged). |

相关：[FoliumSettingValues](#foliumsettingvalues)

### FoliumCommandDef

A command in the mods panel and the command palette. `run` executes in the renderer; hand Node work to the
main entry through `folium.rpc`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `label` | `FoliumLabel` | Command name. |
| `description?` | `FoliumLabel` | Shown under the name. |
| `keywords?` | `string[]` | Extra search terms for the command palette (label texts are always included). |
| `params?` | `FoliumSetting[]` | The command's parameters, asked for in a form before it runs (the mods panel's card, or the command palette, which opens the form for a command that has any). |
| `run()` | `(ctx: FoliumCommandContext): unknown \| Promise<unknown>` | Runs the command; the result is shown as a summary (a string, `{ outputPath }` or `{ message }`). |

相关：[FoliumLabel](#foliumlabel) · [FoliumSetting](#foliumsetting) · [FoliumCommandContext](#foliumcommandcontext)

### FoliumBackgroundContext

Lyric-free context for background types: they paint behind every mode, previews included. `onChange` fires
when pause, theme, settings or cover change.

```ts
interface FoliumBackgroundContext extends FoliumMountHelpers
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly staticMode` | `boolean` | A still preview: draw one frame, do not animate. |
| `isPaused()` | `(): boolean` | Playback is paused. |
| `getTheme()` | `(): FoliumTheme` | The current theme. |
| `getSettings()` | `(): FoliumSettingValues` | This background's settings values (defaults merged). |
| `getCoverUrl()` | `(): string \| null` | Cover image URL of the displayed song. |
| `readonly audio` | `FoliumAudio` | The host's audio analyser. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumMountHelpers](#foliummounthelpers) · [FoliumTheme](#foliumtheme) · [FoliumSettingValues](#foliumsettingvalues) · [FoliumAudio](#foliumaudio)

### FoliumBackgroundDef

A background type in the background picker; it paints behind every mode, previews and export included.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `label` | `FoliumLabel` | Name in the background picker. |
| `order?` | `number` | Position in the picker; default 500. |
| `mount` | `FoliumMount<FoliumBackgroundContext>` | Draws the background into its container. |
| `settings?` | `FoliumSetting[]` | Settings schema, as for visualizers. |
| `settingsPanel?` | `FoliumMount<FoliumSettingsPanelContext>` | Replaces the host-rendered form; values still follow `settings`. |

相关：[FoliumLabel](#foliumlabel) · [FoliumMount](#foliummount) · [FoliumBackgroundContext](#foliumbackgroundcontext) · [FoliumSetting](#foliumsetting) · [FoliumSettingsPanelContext](#foliumsettingspanelcontext)

### FoliumStageSlot

Where a stage layer sits on the player page:
  - `player.stage.back`: above the background, under the lyrics;
  - `player.stage.front`: above the lyrics, under the player chrome;
  - `app.overlay`: above the whole app.

```ts
type FoliumStageSlot = 'player.stage.back' | 'player.stage.front' | 'app.overlay'
```

### FoliumStageLayerDef

A layer on the live player page (never in previews, OBS sources or the export window). Needs the `stageLayers`
permission.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `slot` | `FoliumStageSlot` | Where the layer sits. |
| `order?` | `number` | Stacking order within the slot; default 500. |
| `interactive?` | `boolean` | When false (default) the layer is click-through, so it cannot block the player; elements that should still take clicks set `pointer-events: auto`. When true the whole layer captures the pointer. |
| `mount` | `FoliumMount<FoliumStageContext>` | Draws the layer into its container. |

相关：[FoliumStageSlot](#foliumstageslot) · [FoliumMount](#foliummount) · [FoliumStageContext](#foliumstagecontext)

### FoliumSettingsSectionDef

The mod's own settings, shown in the mods panel when the mod's row is expanded. Values are readable in
every context.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `label` | `FoliumLabel` | Section title. |
| `description?` | `FoliumLabel` | Shown under the title. |
| `settings` | `FoliumSetting[]` | The fields. |
| `settingsPanel?` | `FoliumMount<FoliumSettingsPanelContext>` | Replaces the host-rendered form; values still follow `settings`. |

相关：[FoliumLabel](#foliumlabel) · [FoliumSetting](#foliumsetting) · [FoliumMount](#foliummount) · [FoliumSettingsPanelContext](#foliumsettingspanelcontext)

### FoliumPlayerPanelTabDef

A tab in the player panel. `folium.ui.openPlayerPanel(id)` opens it.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id; pass it to `folium.ui.openPlayerPanel`. |
| `label` | `FoliumLabel` | Tab title. |
| `order?` | `number` | Tab order; default 500. |
| `mount` | `FoliumMount<FoliumPanelContext>` | Draws the tab into its container. |

相关：[FoliumLabel](#foliumlabel) · [FoliumMount](#foliummount) · [FoliumPanelContext](#foliumpanelcontext)

### FoliumHomeTabDef

An owned full-page tab appended to Grid and Bravais home navigation.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id; pass it to `folium.ui.openHomeTab`. |
| `label` | `FoliumLabel` | Localized navigation label. |
| `order?` | `number` | Order among contributed home tabs; default 500. Native tabs retain their order. |
| `mount` | `FoliumMount<FoliumPanelContext>` | Mounts in an isolated, bounded full-page container. Returns cleanup on leaving the page. |

相关：[FoliumLabel](#foliumlabel) · [FoliumMount](#foliummount) · [FoliumPanelContext](#foliumpanelcontext)

### FoliumProgressContext

Progress-bar context shared by progress buttons and progress layers. `onChange` fires when the duration or
the colors change (a new track, a theme switch).

```ts
interface FoliumProgressContext extends FoliumMountHelpers
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly playbackTime` | `FoliumClock` | The playback clock: the position in the track's audio, seconds (what `seek` takes). |
| `onPlaybackTime()` | `(listener: (seconds: number) => void): FoliumDisposer` | Calls `listener` with the playback clock's time (`playbackTime`) on every change. The host stops it when the mount ends. |
| `getDuration()` | `(): number` | Track duration, seconds; 0 when unknown. |
| `timeToRatio()` | `(seconds: number): number` | 0..1 position of a time on the track (0 when the duration is unknown). |
| `seek()` | `(seconds: number): void` | Seeks the host player; ignored while the host bar is disabled. |
| `getColors()` | `(): { fill: string; track: string; text: string }` | The host bar's colors, so mod UI can match it. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumMountHelpers](#foliummounthelpers) · [FoliumClock](#foliumclock) · [FoliumDisposer](#foliumdisposer)

### FoliumProgressButtonSlot

The side of the progress bar a progress button sits on.

```ts
type FoliumProgressButtonSlot = 'progress.leading' | 'progress.trailing'
```

### FoliumProgressButtonDef

A button next to the progress bar. All three host progress bars (floating controls x2, Lattice) show it.
A click inside the button stays in it: the host stops it from reaching the bar's surroundings (the
floating capsule opens the player on a click), so the button need not stop propagation itself.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `slot` | `FoliumProgressButtonSlot` | Left or right of the bar. |
| `order?` | `number` | Order within the slot; default 500. |
| `hideWhenCollapsed?` | `boolean` | Leave the collapsed floating capsule alone. The button is not mounted there, only on the expanded capsule and Lattice. Default false. |
| `mount` | `FoliumMount<FoliumProgressContext>` | Draws the button into its container. |

相关：[FoliumProgressButtonSlot](#foliumprogressbuttonslot) · [FoliumMount](#foliummount) · [FoliumProgressContext](#foliumprogresscontext)

### FoliumProgressLayerDef

A layer over the progress track. Its container is click-through so seeking
keeps working; elements that should take clicks set `pointer-events: auto`.
As for progress buttons, the host keeps such a click inside the layer.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `order?` | `number` | Stacking order; default 500. |
| `mount` | `FoliumMount<FoliumProgressContext>` | Draws the layer into its container, which spans the track. |

相关：[FoliumMount](#foliummount) · [FoliumProgressContext](#foliumprogresscontext)

### FoliumStyleDef

Mod CSS, injected inside `@layer folium-mods` and removed with the mod. The
stable targets are the host's public parts: `[data-folium-part="progress.track"]` etc.
(see mods/README.md for the list). Anything else in the host DOM is not API.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local id. |
| `css` | `string` | The stylesheet. |

### FoliumRegistryHandle

What `register` returns.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly id` | `FoliumId` | Full namespaced id (`modid:name`). |
| `unregister()` | `(): void` | Removes the entry now (the host also removes it when the mod stops). |

相关：[FoliumId](#foliumid)

### FoliumSettingsSectionHandle

What `settingsSections.register` returns: the handle plus the section's values.

```ts
interface FoliumSettingsSectionHandle extends FoliumRegistryHandle
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly settings` | `FoliumSettingAccess` | The section's values (defaults merged) and write access. |
| `readonly id` | `FoliumId` | 继承自 [FoliumRegistryHandle](#foliumregistryhandle)。Full namespaced id (`modid:name`). |
| `unregister()` | `(): void` | 继承自 [FoliumRegistryHandle](#foliumregistryhandle)。Removes the entry now (the host also removes it when the mod stops). |

相关：[FoliumRegistryHandle](#foliumregistryhandle) · [FoliumSettingAccess](#foliumsettingaccess)

### FoliumRegistry

Every registry has this one method.

```ts
interface FoliumRegistry<Def, Handle extends FoliumRegistryHandle = FoliumRegistryHandle>
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `register()` | `(def: Def): Handle` | Adds an entry; throws on an invalid definition or a duplicate id. |

相关：[FoliumRegistryHandle](#foliumregistryhandle)

### FoliumRegistries

All registries, as `folium.registries`. Some only make sense where there is app UI: they accept
registrations and do nothing in the export window. The table of registries in docs/folium/api.md
says which, and which need a permission.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `visualizers` | `FoliumRegistry<FoliumVisualizerDef>` | Lyric animation modes. |
| `tunings` | `FoliumRegistry<FoliumTuningDef>` | Tuning knobs for builtin modes. |
| `commands` | `FoliumRegistry<FoliumCommandDef>` | Commands. |
| `backgrounds` | `FoliumRegistry<FoliumBackgroundDef>` | Background types. |
| `stageLayers` | `FoliumRegistry<FoliumStageLayerDef>` | Player page layers (`stageLayers`). |
| `settingsSections` | `FoliumRegistry<FoliumSettingsSectionDef, FoliumSettingsSectionHandle>` | The mod's own settings. |
| `playerPanelTabs` | `FoliumRegistry<FoliumPlayerPanelTabDef>` | Player panel tabs. |
| `homeTabs` | `FoliumRegistry<FoliumHomeTabDef>` | Full pages in home navigation. |
| `progressButtons` | `FoliumRegistry<FoliumProgressButtonDef>` | Buttons beside the progress bar. |
| `progressLayers` | `FoliumRegistry<FoliumProgressLayerDef>` | Layers over the progress track. |
| `styles` | `FoliumRegistry<FoliumStyleDef>` | Mod CSS for public parts. |

相关：[FoliumRegistry](#foliumregistry) · [FoliumVisualizerDef](#foliumvisualizerdef) · [FoliumTuningDef](#foliumtuningdef) · [FoliumCommandDef](#foliumcommanddef) · [FoliumBackgroundDef](#foliumbackgrounddef) · [FoliumStageLayerDef](#foliumstagelayerdef) · [FoliumSettingsSectionDef](#foliumsettingssectiondef) · [FoliumSettingsSectionHandle](#foliumsettingssectionhandle) · [FoliumPlayerPanelTabDef](#foliumplayerpaneltabdef) · [FoliumHomeTabDef](#foliumhometabdef) · [FoliumProgressButtonDef](#foliumprogressbuttondef) · [FoliumProgressLayerDef](#foliumprogresslayerdef) · [FoliumStyleDef](#foliumstyledef)

## 宿主容器与上下文

界面类条目都是 `mount(container, ctx) => dispose?`：宿主创建并回收容器，通过 `ctx` 提供时钟、主题、设置、音频等只读信息与订阅。

### FoliumMount

Everything UI-shaped is mounted into a container the host owns. The host
creates it (inside a ShadowRoot for panels), passes theme colors as
`--folium-*` CSS custom properties, and calls the disposer when it removes the
container. Mods never query or mutate host DOM outside their container.

`mount` may be `async` and return a promise of its disposer. A disposer that arrives after the host
removed the container runs at once.

```ts
type FoliumMount<Ctx> = (container: HTMLElement, ctx: Ctx) => void | FoliumDisposer | Promise<void | FoliumDisposer>
```

相关：[FoliumDisposer](#foliumdisposer)

### FoliumSize

The size of a mount's container, as `onResize` reports it.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly width` | `number` | Width, CSS pixels. |
| `readonly height` | `number` | Height, CSS pixels. |

### FoliumMountHelpers

Helpers every mount context carries. Each one keeps calling the function it is given until the mount
ends, and the host stops it then, whether or not the mod kept the disposer it returned. A mount that
throws, or whose promise rejects, has ended.

A listener belongs to the mount that subscribed it: the same function given by two mounts runs once for
each of them.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `onChange()` | `(listener: () => void): FoliumDisposer` | Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumDisposer](#foliumdisposer) · [FoliumSize](#foliumsize)

### FoliumPanelContext

Context for panel-like containers (player panel tabs, settings panels). `onChange` fires when the theme
changes (a theme switch, day and night).

```ts
interface FoliumPanelContext extends FoliumMountHelpers
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly locale` | `string` | The UI locale, e.g. `zh-CN`. |
| `getTheme()` | `(): FoliumTheme` | The current theme. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumMountHelpers](#foliummounthelpers) · [FoliumTheme](#foliumtheme)

### FoliumSettingsPanelContext

Context for a custom settings panel (`settingsPanel`): the panel draws the form, the schema still owns the
values. `onChange` fires when the theme changes; `settings.onChange` when a value does.

```ts
interface FoliumSettingsPanelContext extends FoliumPanelContext
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly settings` | `FoliumSettingAccess` | Read and write the values the schema describes. |
| `readonly locale` | `string` | 继承自 [FoliumPanelContext](#foliumpanelcontext)。The UI locale, e.g. `zh-CN`. |
| `getTheme()` | `(): FoliumTheme` | 继承自 [FoliumPanelContext](#foliumpanelcontext)。The current theme. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumPanelContext](#foliumpanelcontext) · [FoliumSettingAccess](#foliumsettingaccess)

### FoliumClock

A clock in seconds. Read it with `get` when you need the time now; to be called on every change, use the
context's `onLyricTime` or `onPlaybackTime`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `get()` | `(): number` | Current time, seconds. |

### FoliumSurface

What the host draws around the content.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `transparent` | `boolean` | The host renders onto a transparent surface (OBS source, alpha export). |
| `hostBackground` | `boolean` | The host is painting its configured background under this content. |

### FoliumAudioBands

Analyser band energies, each 0..1.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly bass` | `number` | 20–150 Hz |
| `readonly lowMid` | `number` | 150–400 Hz |
| `readonly mid` | `number` | 400–1200 Hz |
| `readonly vocal` | `number` | 1000–3500 Hz |
| `readonly treble` | `number` | 3500 Hz and up |

### FoliumAudio

The host's audio analyser, for audio-reactive content. Values
change every frame and nothing is announced: read them inside your own frame
loop. Previews feed a synthetic signal; silence (or no analyser) reads as 0.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `getPower()` | `(): number` | Overall energy (bass + low mid, shaped), 0..1. |
| `getBands()` | `(): FoliumAudioBands` | The same object on every call, refreshed in place; copy it to keep a reading. |
| `getSpectrum()` | `(): Uint8Array \| null` | Raw analyser FFT magnitudes (0–255), or null when there are none. The host reuses the array. |

相关：[FoliumAudioBands](#foliumaudiobands)

### FoliumDisplay

The host's display settings for lyric content, named and valued
as builtin modes receive them. A mod that turns off `hostLayers.subtitles`
and draws its own reads the subtitle settings here.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `showText` | `boolean` | False while lyrics should not be drawn (e.g. the settings modal covers the player, or the player page is not shown): a mod draws no lyric text then, as builtin modes do. Everything else may keep drawing. |
| `lyricsFontScale` | `number` | The user's lyric size multiplier; builtin modes scale lyric text by it. |
| `subtitleFontScale` | `number` | Subtitle size multiplier. |
| `subtitleOverlayOpacity` | `number` | Subtitle opacity, 0..1. |
| `subtitleOverlayBackground` | `boolean` | Subtitles get a backing plate. |
| `subtitleUpcomingLyricsBlur` | `boolean` | Upcoming-line subtitles are blurred. |
| `showHarmonySubtitle` | `boolean` | Background vocals are shown as subtitles. |
| `harmonySubtitleBackground` | `boolean` | Harmony subtitles get a backing plate. |
| `showSubtitleTranslation` | `boolean` | Subtitles show a translation or romanization. |
| `hideTranslationSubtitle` | `boolean` | The host hides translation subtitles here (e.g. the lyrics already carry them). |
| `subtitleContentMode` | `'translation' \| 'romanization' \| 'none'` | What subtitles show. |
| `isPlayerChromeHidden` | `boolean` | The player controls are hidden. |
| `isPanelOpen` | `boolean` | The player panel is open. |
| `visualizerOpacity` | `number` | Lyric layer opacity, 0..1. The host already applies it to the layer a visualizer and the `player.stage.*` layers draw in: do not apply it again, or the content fades twice. |

### FoliumStageContext

Context for lyric-synced content (visualizers, stage layers). Snapshot fields are fixed for one mount; the
host remounts only when the lyric data, the song or `staticMode` changes (or the preview line in static
mode). Everything else is read through getters, and `onChange` fires when the line index, pause, theme,
subtitle theme, cover, display, settings, surface or duration change, including while paused, when the
lyric clock stands still. The time itself comes through `onLyricTime`.

```ts
interface FoliumStageContext extends FoliumMountHelpers
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly lines` | `readonly FoliumLine[]` | Lyrics of this song (fixed for the mount). |
| `readonly song` | `FoliumSong \| null` | This song (fixed for the mount). |
| `readonly staticMode` | `boolean` | A still preview: draw one frame of `staticLineIndex`, do not animate. |
| `readonly staticLineIndex` | `number \| null` | Only meaningful in static mode: the line the preview shows. |
| `readonly seed` | `string \| null` | The geometry seed builtin modes get (the displayed song's id, or a per-mode fallback). Stable per song, identical in previews, playback and export, so seeded randomness matches everywhere. |
| `readonly isPreview` | `boolean` | Rendering inside a settings preview rather than the player page. |
| `readonly lyricTime` | `FoliumClock` | The lyric clock: the time lyric lines are timed in (`line.startTime`), seconds. It can differ from the playback position (the user's lyric offset, Stage sources); in previews it is the preview's own clock. |
| `getDuration()` | `(): number` | The song's length, seconds; 0 while unknown (`onChange` fires when it becomes known). In a settings preview it is the preview's length, in the export window the exported song's. Progress through the song is `lyricTime.get() / getDuration()` when the duration is above 0; it can be off by the user's lyric offset, since the lyric clock is not the playback position. |
| `getLineIndex()` | `(): number` | Index into `lines` of the active line; -1 between lines. |
| `isPaused()` | `(): boolean` | Playback is paused. |
| `getTheme()` | `(): FoliumTheme` | The current theme. |
| `getSubtitleTheme()` | `(): FoliumTheme` | The theme the host's subtitles use; equals getTheme() where there is none. |
| `getCoverUrl()` | `(): string \| null` | Cover image URL of the displayed song, or null. |
| `getDisplay()` | `(): FoliumDisplay` | The host's display settings. The same object until a value changes; `onChange` announces changes. |
| `getSettings()` | `(): FoliumSettingValues` | This entry's settings values (defaults merged); empty without a schema. |
| `getSurface()` | `(): FoliumSurface` | What the host draws around this content. |
| `getLayout()` | `(): FoliumPlayerLayout \| null` | EXPERIMENTAL (`player.layout`): frozen live-player geometry in viewport CSS pixels. Null without the manifest opt-in, outside the live player (including previews, OBS and export), or before a subscriber's first measurement. Reading never starts measurement; `onChange` also fires when the opted-in layout changes. |
| `readonly audio` | `FoliumAudio` | The host's audio analyser. |
| `onLyricTime()` | `(listener: (seconds: number) => void): FoliumDisposer` | Calls `listener` with the lyric clock's time (`lyricTime`) on every change. The host stops it when the mount ends. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` when a value this context reads through a getter changes; each context says which. Read the new values through the getters inside the listener. |
| `onFrame()` | `(listener: (timestamp: number) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` once for every frame the app draws, with the time the app's frame loop began that frame (milliseconds on the `performance.now()` clock; a little later than the number the browser passes to a `requestAnimationFrame` callback). It runs on the app's own frame loop, shared by every mod. A listener runs at most once a frame: one subscribed while a frame runs starts with the next frame. |
| `onResize()` | `(listener: (size: FoliumSize) => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` with the container's size once it is laid out, and again whenever the size changes. |
| `every()` | `(ms: number, listener: () => void): FoliumDisposer` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Calls `listener` every `ms` milliseconds. `ms` is at least 16 and at most 2147483647 (the longest a browser timer can wait); for work on every frame use `onFrame`. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | 继承自 [FoliumMountHelpers](#foliummounthelpers)。Runs `disposer` when the mount ends, after the disposer `mount` returned; at once when the mount has already ended. Returns nothing. |

相关：[FoliumMountHelpers](#foliummounthelpers) · [FoliumLine](#foliumline) · [FoliumSong](#foliumsong) · [FoliumClock](#foliumclock) · [FoliumTheme](#foliumtheme) · [FoliumDisplay](#foliumdisplay) · [FoliumSettingValues](#foliumsettingvalues) · [FoliumSurface](#foliumsurface) · [FoliumPlayerLayout](#foliumplayerlayout) · [FoliumAudio](#foliumaudio) · [FoliumDisposer](#foliumdisposer)

## 事件

`folium.events.on(type, handler, { priority })`。通知只读、事后发出；钩子让处理器依次修改同一个事件对象。

### 事件一览

本表由宿主里那张事件类型表（`src/mods/folium/eventTypes.ts`）生成。

| 事件 | 方式 | 需要选用的实验接口 |
| --- | --- | --- |
| `playback.songChanged` | 通知 | — |
| `playback.stateChanged` | 通知 | — |
| `playback.seeked` | 通知 | — |
| `lyrics.loaded` | 通知 | — |
| `app.viewChanged` | 通知 | — |
| `visualizer.modeChanged` | 通知 | — |
| `theme.changed` | 通知 | — |
| `playback.likeChanged` | 通知 | — |
| `playback.volumeChanged` | 通知 | — |
| `playback.loopModeChanged` | 通知 | — |
| `playback.queueChanged` | 通知 | — |
| `playback.failed` | 通知 | — |
| `lyrics.transform` | 钩子 | — |
| `playback.beforePlay` | 钩子 | — |
| `omni.lyricsResolved` | 钩子 | `omni.hooks` |
| `omni.audioSourceResolved` | 钩子 | `omni.hooks` |

每个事件带的内容见 [FoliumNotificationEvents](#foliumnotificationevents) 与 [FoliumHookEvents](#foliumhookevents)。
不在表里的名字，`folium.events.on` 抛 `unknown-event:<名字>`；需要选用实验接口的事件，没有在 `mod.json` 的 `experimental` 里选用就监听时抛 `experimental-not-declared:<接口>`。

### FoliumEventPriority

Handler order for one event type; handlers of the same priority run in registration order.

```ts
type FoliumEventPriority = 'highest' | 'high' | 'normal' | 'low' | 'lowest'
```

### FoliumPlaybackFailureReason

Why a song failed to play, coarsely. `auth`: sign-in needed or expired. `restricted`:
membership, purchase, entitlement, preview-only or region. `taken-down`: no longer offered. `network`:
network, timeout, service unavailable or rate limited. `unknown`: anything else. The host's own reason
codes are not API.

```ts
type FoliumPlaybackFailureReason = 'auth' | 'restricted' | 'taken-down' | 'network' | 'unknown'
```

### FoliumNotificationEvents

Read-only notifications, emitted after the fact.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `playback.songChanged` | `{ readonly song: FoliumSong \| null }` | The displayed song changed. |
| `playback.stateChanged` | `{ readonly state: FoliumPlaybackState }` | Playing, paused or stopped. |
| `playback.seeked` | `{ readonly position: number }` | The user or a mod seeked; `position` in seconds. |
| `lyrics.loaded` | `{ readonly song: FoliumSong \| null; readonly lines: readonly FoliumLine[] }` | Lyrics for the displayed song are ready (after `lyrics.transform`). |
| `app.viewChanged` | `{ readonly view: string }` | The app switched views (e.g. `home`, `player`). |
| `visualizer.modeChanged` | `{ readonly mode: string }` | The lyric animation mode changed. |
| `theme.changed` | `{ readonly theme: FoliumTheme }` | The theme or daylight mode changed. |
| `playback.likeChanged` | `{ readonly liked: boolean }` | `playback.getState().liked` changed (a like or unlike, or a new song). |
| `playback.volumeChanged` | `{ readonly volume: number; readonly muted: boolean }` | The volume or the mute switch changed, whoever changed it. |
| `playback.loopModeChanged` | `{ readonly mode: FoliumLoopMode }` | The repeat mode changed. |
| `playback.queueChanged` | `{ readonly length: number; readonly currentIndex: number }` | The queue changed, or the displayed song moved within it. Only the outline: call `playback.getQueue()` for the songs. Changes made in one task arrive as one event. |
| `playback.failed` | `{ readonly song: FoliumSong \| null; readonly reason: FoliumPlaybackFailureReason; readonly phase: 'play' \| 'restore' \| 'mid-playback'; readonly willAutoSkip: boolean; }` | A song failed to play; reported once, after the host's own retries. `phase` says where it failed: `play`, the host got no playable source for the song just picked (sign-in, membership, taken down, the address lookup failed, a missing local file); `restore`, the same while restoring the last session; `mid-playback`, the player failed on the media itself (it would not load, decode or keep streaming). Every media error is `mid-playback`, so a song just picked or restored that fails before any sound is reported as `mid-playback` too. `willAutoSkip`: the host is counting down to skip it (its policy or the user's "skip unplayable songs" setting), so do not call `next()` yourself. Not emitted in the export window. |

相关：[FoliumSong](#foliumsong) · [FoliumPlaybackState](#foliumplaybackstate) · [FoliumLine](#foliumline) · [FoliumTheme](#foliumtheme) · [FoliumLoopMode](#foliumloopmode) · [FoliumPlaybackFailureReason](#foliumplaybackfailurereason)

### FoliumLyricsTransformEvent

Synchronous hook: runs when new lyrics reach the player, before they are
shown. Assign `lines` to rewrite them; lines left untouched (same object)
keep all their host-side data, new or changed ones are built from the DTO.

It also runs when the lyric load of the current song ended with none (no
lyrics found, an instrumental, a failed fetch), with `lines` empty: assign
lines to give the song lyrics. Left empty, the song stays without lyrics, so
a handler that only rewrites the lines it is given changes nothing there.

Always runs on untransformed lyrics, never on its own output: when the host
rebuilds lyrics already on screen (a word-segmentation update,
`folium.lyrics.refresh()`) it starts again from the untransformed version,
so handlers need not be idempotent. A rebuild can come at any time, for
whatever song is current then: key what you supply on `event.song`, never
on "the last thing I parsed".

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong \| null` | The song the lyrics belong to: the player's current song. During an automix blend that is the track the blend goes to, while the one it leaves is still the displayed song (`playback.getState().song`). |
| `lines` | `readonly FoliumLine[]` | Assign a new array to rewrite the lyrics. Empty when the song's lyric load ended with none. |

相关：[FoliumSong](#foliumsong) · [FoliumLine](#foliumline)

### FoliumBeforePlayEvent

Async hook: runs before a song starts. Handlers may cancel it or play
another song instead. Not run for the track an automix blend advances to:
the blend starts that track seconds early on a fixed schedule and cannot
wait for handlers.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong` | The song about to play. |
| `readonly cancelled` | `boolean` | A handler already cancelled. |
| `cancel()` | `(): void` | Stops the song from playing; later handlers are skipped. |
| `replaceWith()` | `(song: FoliumSong): void` | Plays this song instead; it must carry a `ref` from the host. |

相关：[FoliumSong](#foliumsong)

### FoliumOmniLyricsEvent

EXPERIMENTAL (manifest `experimental: ["omni.hooks"]`): Omni answered with
lyrics for an online song. Same line rules as `lyrics.transform`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong` | The online song. |
| `lines` | `readonly FoliumLine[]` | Assign a new array to rewrite the lyrics. |
| `readonly isPureMusic` | `boolean` | Omni reported the song as instrumental. |

相关：[FoliumSong](#foliumsong) · [FoliumLine](#foliumline)

### FoliumOmniAudioEvent

EXPERIMENTAL (`omni.hooks`): Omni resolved an audio URL; assign `url` to use another one.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong` | The online song. |
| `url` | `string \| null` | Assign another https URL to play that instead. |

相关：[FoliumSong](#foliumsong)

### FoliumHookEvents

Hooks: every handler receives the same event object, in priority order, and may change it.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `lyrics.transform` | `FoliumLyricsTransformEvent` | Rewrite lyrics before they are shown (sync). |
| `playback.beforePlay` | `FoliumBeforePlayEvent` | Cancel or replace a song before it plays (async, 1.5 s per handler). |
| `omni.lyricsResolved` | `FoliumOmniLyricsEvent` | Rewrite lyrics Omni fetched (experimental, `omni.hooks`). |
| `omni.audioSourceResolved` | `FoliumOmniAudioEvent` | Replace the audio URL Omni resolved (experimental, `omni.hooks`). |

相关：[FoliumLyricsTransformEvent](#foliumlyricstransformevent) · [FoliumBeforePlayEvent](#foliumbeforeplayevent) · [FoliumOmniLyricsEvent](#foliumomnilyricsevent) · [FoliumOmniAudioEvent](#foliumomniaudioevent)

### FoliumEventMap

Every event type and its payload.

```ts
type FoliumEventMap = FoliumNotificationEvents & FoliumHookEvents
```

相关：[FoliumNotificationEvents](#foliumnotificationevents) · [FoliumHookEvents](#foliumhookevents)

### FoliumEvents

The event bus, as `folium.events`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `on()` | `<K extends keyof FoliumEventMap>(type: K, handler: (event: FoliumEventMap[K]) => void \| Promise<void>, options?: { priority?: FoliumEventPriority }): FoliumDisposer` | Adds a handler; returns its disposer. Each handler runs in its own error boundary; a sync handler over 16 ms logs a warning. The host removes the mod's handlers when the mod stops. Throws `unknown-event:<type>` for a name that is not an event type (the events table in docs/folium/api.md lists them), and `experimental-not-declared:<name>` for an experimental event whose opt-in the mod did not declare in mod.json `experimental`. |

相关：[FoliumEventMap](#foliumeventmap) · [FoliumEventPriority](#foliumeventpriority) · [FoliumDisposer](#foliumdisposer)

## 服务

`folium.playback` / `folium.ui` / `folium.net`。需要权限的方法见[权限一览](#权限一览)；导出窗口里调用会抛 `*-unavailable-in-export-context`（`ui.icon` 除外）。

### FoliumPlaybackService

`folium.playback`. The readers (`getState`, `getVolume`, `getLoopMode` and `getQueue`)
need no permission; every other method needs the `playback.control` permission. All of it is unavailable
in the export window.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `getState()` | `(): { song: FoliumSong \| null; state: FoliumPlaybackState; position: number; duration: number; liked: boolean; canLike: boolean; }` | The displayed song, player state, position and duration (seconds), `liked` (the displayed song is liked; false with no song) and `canLike` (toggleLike would act now; the host's own like button greys out otherwise). |
| `play()` | `(): void` | Resumes playback. Needs `playback.control`. |
| `pause()` | `(): void` | Pauses. Needs `playback.control`. |
| `toggle()` | `(): void` | Play/pause. Needs `playback.control`. |
| `seek()` | `(seconds: number): void` | Seeks to a playback position (audio time), seconds. Needs `playback.control`. |
| `seekToLyricTime()` | `(lyricSeconds: number): void` | Seeks to a point on the lyric clock, e.g. `line.startTime`, the way clicking a lyric line does in builtin modes. The host converts lyric time to playback time (lyric offsets, lyrics-only stage sources); `seek(line.startTime)` would land off by the offset. Ignored while the host has now-playing controls disabled. Needs `playback.control`. |
| `next()` | `(): void` | Next track. Needs `playback.control`. |
| `previous()` | `(): void` | Previous track. Needs `playback.control`. |
| `playSong()` | `(song: FoliumSong): Promise<boolean>` | Plays a song by its host `ref`. Resolves false when the ref is unknown. Needs `playback.control`. |
| `enqueue()` | `(song: FoliumSong): boolean` | Appends a song (by `ref`) to the queue. Needs `playback.control`. |
| `shuffleQueue()` | `(): boolean` | Shuffles the play queue, keeping the current song first. False when there is nothing to shuffle (Personal FM, a queue of one, external Stage playback). Needs `playback.control`. |
| `toggleLike()` | `(): boolean` | Likes or unlikes the displayed song, like the host's like button, which also reports the result. False when `canLike` is false. Needs `playback.control`. |
| `getVolume()` | `(): { volume: number; muted: boolean }` | Output volume (0–1) and the mute switch, which is separate from it. |
| `setVolume()` | `(volume: number): void` | Sets the volume, clamped to 0–1, the way the host's volume slider does; `muted` stays as it is. Every call is saved, so set the value you settled on rather than animating through it. Needs `playback.control`. |
| `setMuted()` | `(muted: boolean): void` | Mutes or unmutes. A set rather than a toggle, so two windows acting at once cannot cancel each other out. Needs `playback.control`. |
| `getLoopMode()` | `(): FoliumLoopMode` | The repeat mode. |
| `setLoopMode()` | `(mode: FoliumLoopMode): void` | Sets the repeat mode; the host reports the change like its own repeat button does. Setting the mode already in effect does nothing. Needs `playback.control`. |
| `getQueue()` | `(options?: { offset?: number; limit?: number }): FoliumQueueSnapshot` | A page of the play queue. `limit` defaults to 500, the most one call returns; without `offset` the page is centred on the displayed song. Song refs come from a pool of 2,000 shared with every other song DTO, the least recently handed out dropped first: every ref of the page you just read resolves, so read the pages you show rather than the whole queue. |
| `playQueueItem()` | `(index: number, expectedRef?: string): Promise<boolean>` | Plays queue entry `index`, with the same playback and navigation as clicking it in the host's queue panel; if it fails to play, the retry and skip buttons follow the queue as it is when pressed. In Personal FM, where the panel lists no queue, it plays the entry and FM stays on. With `expectedRef`, resolves false without acting when that position no longer holds that song (the queue changed between your calls). False for an index out of range and during external Stage playback. Needs `playback.control`. |

相关：[FoliumSong](#foliumsong) · [FoliumPlaybackState](#foliumplaybackstate) · [FoliumLoopMode](#foliumloopmode) · [FoliumQueueSnapshot](#foliumqueuesnapshot)

### FoliumFileHandle

A local file the user picked for this mod.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `url` | `string` | folia-mod:// URL usable as a media/img src for this session. |
| `name` | `string` | File name. |
| `size` | `number` | Size in bytes. |
| `grantId?` | `string` | Opaque id of a persisted grant (pickFile with `persist`, or restoreFile). Store it to get the file back after a restart. |

### FoliumIconOptions

Options for `folium.ui.icon`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `size?` | `number` | Width and height in px. Default 24. |
| `strokeWidth?` | `number` | Stroke width in the icon's 24-unit grid. Default 2. |
| `color?` | `string` | Any CSS color. Default `currentColor`, so the icon follows the surrounding text. |

### FoliumUiService

`folium.ui`. Unavailable in the export window, except `icon`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `toast()` | `(message: string, options?: { type?: 'info' \| 'success' \| 'error'; durationMs?: number }): void` | Shows a status message. |
| `openPlayerPanel()` | `(tabId?: string): void` | Opens the player panel, optionally on one of this mod's panel tabs (local id). |
| `openHomeTab()` | `(tabId: string): void` | Opens this mod's registered home tab (local id). Rejects unknown tabs. |
| `navigate()` | `(view: 'home' \| 'player'): void` | Switches to the home or player view. |
| `openVolume()` | `(): void` | Opens the host volume panel (the command palette's volume command). |
| `pickFile()` | `(options?: { accept?: 'video' \| 'audio' \| 'image' \| 'any'; persist?: boolean }): Promise<FoliumFileHandle \| null>` | Lets the user pick a local file; null when cancelled. With `persist` the pick is remembered for this mod and the handle carries a `grantId` for restoreFile. |
| `restoreFile()` | `(grantId: string): Promise<FoliumFileHandle \| null>` | A file this mod picked with `persist`, as a fresh session handle. Null when the grant is unknown to this mod or the file is gone. |
| `releaseFile()` | `(grantId: string): Promise<void>` | Forgets a persisted grant. URLs already handed out keep working this session. |
| `embed()` | `(container: HTMLElement, url: string, options?: { title?: string; allow?: string[] }): FoliumDisposer` | Embeds an external page in `container` as a sandboxed iframe. The URL's origin must be listed in the manifest `embedOrigins` (needs `net.embed`). |
| `icon()` | `(name: string, options?: FoliumIconOptions): Promise<SVGSVGElement \| null>` | One of the host's icons as a new <svg> element the mod owns, from the icon set of lucide-react 1.48, the version Folia bundles, named as on lucide.dev (e.g. "play", "skip-forward"). Resolves to null for a name that version does not have, including icons added in later lucide releases. Works in every context, the export window included. |

相关：[FoliumFileHandle](#foliumfilehandle) · [FoliumDisposer](#foliumdisposer) · [FoliumIconOptions](#foliumiconoptions)

### FoliumFetchInit

Request options for `folium.net.fetch`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `method?` | `'GET' \| 'POST' \| 'PUT' \| 'PATCH' \| 'DELETE' \| 'HEAD'` | Default `GET`. |
| `headers?` | `Record<string, string>` | Request headers. |
| `body?` | `string` | Request body (text). |
| `timeoutMs?` | `number` | Default 15000, at most 60000. |

### FoliumFetchResponse

A fully read response (body at most 5 MB); `text` and `json` return synchronously.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly ok` | `boolean` | Status is 2xx. |
| `readonly status` | `number` | HTTP status. |
| `readonly statusText` | `string` | HTTP status text. |
| `readonly headers` | `Readonly<Record<string, string>>` | Response headers, lowercase names. |
| `text()` | `(): string` | The body as text. |
| `json()` | `<T = unknown>(): T` | The body parsed as JSON; throws on invalid JSON. |

### FoliumLyricsService

`folium.lyrics`: the shared lyric helpers (FoliumLyricsHelpers, in both contexts), plus two members that
reach the displayed song's lyrics. Those two are unavailable in the export window: they throw
`lyrics-unavailable-in-export-context`.

```ts
interface FoliumLyricsService extends FoliumLyricsHelpers
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `getLines()` | `(): readonly FoliumLine[]` | The lines on screen now; empty when there are none. For a mod that starts after `lyrics.loaded` fired: read them once, then follow `lyrics.loaded`. |
| `refresh()` | `(): void` | Runs `lyrics.transform` again, now, and shows the result: on the displayed song's lyrics as they were before any transform (the way the host does when it rebuilds lyrics on screen), or, when the song's lyric load ended with none, on empty `lines` again. Does nothing while the song's lyrics are still loading. Takes no arguments: the handlers decide. This is the way to supply lyrics that take time to get, since the hook itself is synchronous: fetch or `parse` them, keep them keyed on the song, then call `refresh()`. The result is the same song's lyrics rebuilt, not a new load: it is not announced as `lyrics.loaded`. `getLines()` returns the new lines, and lyric mounts (visualizers, stage layers) get them as a new mount. |
| `getLineRenderEndTime()` | `(line: FoliumLine \| null \| undefined): number` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。When the host stops showing the line: `renderHints.renderEndTime`. -Infinity for null. |
| `segmentWords()` | `(line: Pick<FoliumLine, 'fullText' \| 'wordSegments'>): FoliumWordSegment[]` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。The user's saved split when valid, otherwise Folia's default word segmentation (icu-folia: Intl.Segmenter with jieba for Chinese and BudouX for Japanese; plain Intl.Segmenter until it has loaded). |
| `getRecentCompletedLine()` | `(lines: readonly FoliumLine[], lineIndex: number, time: number): FoliumLine \| null` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。With no active line (index -1): the last line already over, for subtitles in gaps. |
| `getUpcomingLine()` | `(lines: readonly FoliumLine[], lineIndex: number, time: number): FoliumLine \| null` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。The next line: after the active one, or the first still ahead when none is active. |
| `getUpcomingLines()` | `(lines: readonly FoliumLine[], lineIndex: number, count?: number): FoliumLine[]` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。Up to `count` (default 2) lines after the active one; empty when none is active. |
| `buildWordColorRanges()` | `(fullText: string, wordColors: FoliumTheme['wordColors']): FoliumWordColorRange[]` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。Non-overlapping keyword color spans of `fullText` for `theme.wordColors`. |
| `resolveWordColor()` | `(wordText: string, wordColors: FoliumTheme['wordColors'], fallbackColor: string, options?: { cjkMatchMode?: 'target-contains-token' \| 'bidirectional-contains' \| 'exact' }): string` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。The keyword color of one word, or `fallbackColor`. |
| `parse()` | `(track: FoliumLyricsTrack): Promise<FoliumParsedLyrics>` | 继承自 [FoliumLyricsHelpers](#foliumlyricshelpers)。Parses a lyric document with the host's local lyric file pipeline, off the main thread. Rejects with a TypeError (`invalid-lyrics-track`) when the track is malformed. |

相关：[FoliumLyricsHelpers](#foliumlyricshelpers) · [FoliumLine](#foliumline)

### FoliumNetService

`folium.net`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `fetch()` | `(url: string, init?: FoliumFetchInit): Promise<FoliumFetchResponse>` | Fetch through the host (no CORS limits); needs the `net.fetch` permission. |

相关：[FoliumFetchInit](#foliumfetchinit) · [FoliumFetchResponse](#foliumfetchresponse)

## 共享工具

`folium.lyrics` 与 `folium.theme`：内置歌词动画使用的同一批函数，主窗口与导出窗口都可用。`folium.lyrics.parse` 是唯一的异步方法，走本地歌词文件的解析流程。

### FoliumWordSegment

One word from `folium.lyrics.segmentWords`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `segment` | `string` | The segment text. |
| `index` | `number` | UTF-16 offset of the segment in the line's `fullText`. |
| `isWordLike` | `boolean` | False for whitespace and punctuation-only segments. |

### FoliumWordColorRange

A keyword-colored span of a line's `fullText` (UTF-16 offsets, end exclusive).

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `startOffset` | `number` | Start offset in `fullText` (UTF-16). |
| `endOffset` | `number` | End offset, exclusive. |
| `color` | `string` | CSS color from `wordColors`. |
| `priority` | `number` | Longer and more specific matches rank higher. |

### FoliumLyricsHelpers

The pure lyric helpers builtin modes share, so a mod lays out,
times and colors lines exactly as they do. Available in both contexts.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `getLineRenderEndTime()` | `(line: FoliumLine \| null \| undefined): number` | When the host stops showing the line: `renderHints.renderEndTime`. -Infinity for null. |
| `segmentWords()` | `(line: Pick<FoliumLine, 'fullText' \| 'wordSegments'>): FoliumWordSegment[]` | The user's saved split when valid, otherwise Folia's default word segmentation (icu-folia: Intl.Segmenter with jieba for Chinese and BudouX for Japanese; plain Intl.Segmenter until it has loaded). |
| `getRecentCompletedLine()` | `(lines: readonly FoliumLine[], lineIndex: number, time: number): FoliumLine \| null` | With no active line (index -1): the last line already over, for subtitles in gaps. |
| `getUpcomingLine()` | `(lines: readonly FoliumLine[], lineIndex: number, time: number): FoliumLine \| null` | The next line: after the active one, or the first still ahead when none is active. |
| `getUpcomingLines()` | `(lines: readonly FoliumLine[], lineIndex: number, count?: number): FoliumLine[]` | Up to `count` (default 2) lines after the active one; empty when none is active. |
| `buildWordColorRanges()` | `(fullText: string, wordColors: FoliumTheme['wordColors']): FoliumWordColorRange[]` | Non-overlapping keyword color spans of `fullText` for `theme.wordColors`. |
| `resolveWordColor()` | `(wordText: string, wordColors: FoliumTheme['wordColors'], fallbackColor: string, options?: { cjkMatchMode?: 'target-contains-token' \| 'bidirectional-contains' \| 'exact' }): string` | The keyword color of one word, or `fallbackColor`. |
| `parse()` | `(track: FoliumLyricsTrack): Promise<FoliumParsedLyrics>` | Parses a lyric document with the host's local lyric file pipeline, off the main thread. Rejects with a TypeError (`invalid-lyrics-track`) when the track is malformed. |

相关：[FoliumLine](#foliumline) · [FoliumWordSegment](#foliumwordsegment) · [FoliumTheme](#foliumtheme) · [FoliumWordColorRange](#foliumwordcolorrange) · [FoliumLyricsTrack](#foliumlyricstrack) · [FoliumParsedLyrics](#foliumparsedlyrics)

### FoliumThemeHelpers

Theme resolution builtin modes use. Available in both contexts.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `resolveFontStack()` | `(theme: Pick<FoliumTheme, 'fontStyle' \| 'fontFamily' \| 'fontFamilyStack'>): string` | CSS font-family value for lyric text. |
| `resolveTranslationFontStack()` | `(theme: Pick<FoliumTheme, 'fontStyle' \| 'fontFamily' \| 'fontFamilyStack'>): string` | CSS font-family value for translations and subtitles. |
| `resolveFontWeight()` | `(theme: Pick<FoliumTheme, 'fontWeight'> \| null \| undefined, fallback: number): number` | The theme's weight, normalized, or `fallback`. |

相关：[FoliumTheme](#foliumtheme)

## 设置 schema

设置分区、visualizer / background 设置、tunings 与命令参数共用 [FoliumSetting](#foliumsetting)。读到的值已合并默认值，写入按 schema 校验。

### FoliumSettingType

Field kinds: a slider (a number), a text box (a string), a switch (a boolean), a choice among `options`
(the chosen option's `value`), or a colour, shown as the app's own colour picker (a `#rrggbb` string,
in lower case).

```ts
type FoliumSettingType = 'number' | 'text' | 'boolean' | 'select' | 'color'
```

### FoliumSettingOption

One choice of a `select` field.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `value` | `string` | The stored value. |
| `label` | `FoliumLabel` | What the user sees. |

相关：[FoliumLabel](#foliumlabel)

### FoliumSetting

One declarative field. The same schema drives settings sections, visualizer
settings, tunings of builtin modes and command parameters, and it is the only
source of keys, defaults and validation for the values it describes.

A field the host cannot use (no key, a key used twice, an unknown type, a
default of the wrong kind, a select without options) is dropped, and the
mod's row in Settings > Mods says which and why (`settings <key>`).

Values read back are typed `unknown` (FoliumSettingValues). The host has
already checked each against its field, so a read can be cast once to the
shape the schema declares: a JSDoc `@type` cast in plain JS, or
`as { speed: number; tint: string }` in TypeScript.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `key` | `string` | Value key, unique within the schema. |
| `type` | `FoliumSettingType` | Field kind. |
| `label` | `FoliumLabel` | Field label. |
| `description?` | `FoliumLabel` | Help text. |
| `group?` | `FoliumLabel` | Fields sharing a group label render together under that heading. |
| `defaultValue?` | `string \| number \| boolean` | Used until the user changes the field; also what `reset` restores. Its kind must match `type`; a `color` default must be `#rrggbb`. Without one: `min` or 0, false, the first option, '' or `#ffffff`. |
| `min?` | `number` | `number`: lower bound (values are clamped). |
| `max?` | `number` | `number`: upper bound (values are clamped). |
| `step?` | `number` | `number`: slider step. Default 1 when both bounds are integers, else 0.01. |
| `placeholder?` | `string` | `text`: placeholder. |
| `options?` | `FoliumSettingOption[]` | `select`: the choices; values outside them are rejected. |

相关：[FoliumSettingType](#foliumsettingtype) · [FoliumLabel](#foliumlabel) · [FoliumSettingOption](#foliumsettingoption)

### FoliumSettingValues

Values keyed by field `key`, defaults merged. Read-only; write through `FoliumSettingAccess.set`.

```ts
type FoliumSettingValues = Readonly<Record<string, unknown>>
```

### FoliumSettingAccess

Read/write access to one schema's persisted values (defaults already merged).

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly schema` | `readonly FoliumSetting[]` | The fields, as registered (invalid declarations dropped). |
| `get()` | `(): FoliumSettingValues` | Current values, defaults merged. The same object until a value changes. |
| `set()` | `(patch: Record<string, unknown>): void` | Validated against the schema: unknown keys are dropped, numbers clamped, selects checked. |
| `reset()` | `(): void` | Restores every default. |
| `onChange()` | `(listener: () => void): FoliumDisposer` | Calls `listener` after any value changes, whoever changed it (the user, `set`, `reset`, an import). |

相关：[FoliumSetting](#foliumsetting) · [FoliumSettingValues](#foliumsettingvalues) · [FoliumDisposer](#foliumdisposer)

## 数据结构

歌词行与主题与内置 visualizer 收到的 `Line` / `Theme` 同名同义，是宿主投影出的冻结副本。

### FoliumLyricRuby

Ruby (furigana) over part of a syllable. Times in seconds on the lyric clock.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `string` | The ruby text. |
| `startTime` | `number` | Start, seconds. |
| `endTime` | `number` | End, seconds. |

### FoliumLyricSyllable

One timed syllable of a word. Times in seconds on the lyric clock.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `string` | The syllable text. |
| `startTime` | `number` | Start, seconds. |
| `endTime` | `number` | End, seconds. |
| `endsWithSpace?` | `boolean` | A space follows this syllable. |
| `ruby?` | `FoliumLyricRuby[]` | Ruby over this syllable. |
| `obscene?` | `boolean` | Marked explicit by the lyric source. |
| `emptyBeat?` | `number` | Beats of silence after the syllable, from the lyric source. |

相关：[FoliumLyricRuby](#foliumlyricruby)

### FoliumLyricAlternateText

Another rendering of a line or vocal: a translation, a romanization, or another role from the lyric source.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `role` | `string` | 'translation', 'romanization' or another role from the lyric source. |
| `language?` | `string` | BCP 47 language tag, when the source gives one. |
| `text` | `string` | The full text. |
| `syllables?` | `FoliumLyricSyllable[]` | Timed syllables, when the source has them. |

相关：[FoliumLyricSyllable](#foliumlyricsyllable)

### FoliumWord

One timed word of a line. Times in seconds on the lyric clock.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `string` | The word text, including a trailing space when there is one. |
| `startTime` | `number` | Start, seconds. |
| `endTime` | `number` | End, seconds. |
| `syllables?` | `FoliumLyricSyllable[]` | Timed syllables, when the source has them. |

相关：[FoliumLyricSyllable](#foliumlyricsyllable)

### FoliumBackgroundVocal

A background vocal (harmony) attached to a line, timed and structured like a line.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `text` | `string` | The full text. |
| `startTime` | `number` | Start, seconds. |
| `endTime` | `number` | End, seconds. |
| `words` | `FoliumWord[]` | Timed words. |
| `agentId?` | `string` | The singer, when the source names one. |
| `translation?` | `string` | Translation text. |
| `romanization?` | `string` | Romanization text. |
| `alternateTexts?` | `FoliumLyricAlternateText[]` | All alternate texts from the source. |

相关：[FoliumWord](#foliumword) · [FoliumLyricAlternateText](#foliumlyricalternatetext)

### FoliumLineTimingClass

How short a line is: `micro` and `short` lines get faster transitions.

```ts
type FoliumLineTimingClass = 'normal' | 'short' | 'micro'
```

### FoliumLineTransitionMode

How the host moves a line in and out: full, fast, or no transition.

```ts
type FoliumLineTransitionMode = 'normal' | 'fast' | 'none'
```

### FoliumWordRevealMode

How the host reveals the words of a line: full, fast, or all at once.

```ts
type FoliumWordRevealMode = 'normal' | 'fast' | 'instant'
```

### FoliumLineRenderHints

How the host times a line on screen; builtin modes read the same values.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `rawDuration` | `number` | `endTime - startTime`, seconds. |
| `timingClass` | `FoliumLineTimingClass` | How short the line is. |
| `renderEndTime` | `number` | When the host stops showing the line (endTime plus hold/tail). |
| `lineTransitionMode` | `FoliumLineTransitionMode` | How the line moves in and out. |
| `wordRevealMode` | `FoliumWordRevealMode` | How its words are revealed. |

相关：[FoliumLineTimingClass](#foliumlinetimingclass) · [FoliumLineTransitionMode](#foliumlinetransitionmode) · [FoliumWordRevealMode](#foliumwordrevealmode)

### FoliumLine

One lyric line, the same fields and meanings as the host `Line` builtin visualizers receive. Times in
seconds on the lyric clock.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `words` | `FoliumWord[]` | Timed words; a line without word timing has one word spanning the line. |
| `startTime` | `number` | Start, seconds. |
| `endTime` | `number` | The lyric's own end time. When the line leaves the screen is `renderHints.renderEndTime`. |
| `fullText` | `string` | The whole line. |
| `renderHints` | `FoliumLineRenderHints` | Always present: the host fills in hints the lyric source did not carry. |
| `translation?` | `string` | Translation text. |
| `romanization?` | `string` | Romanization text. |
| `alternateTexts?` | `FoliumLyricAlternateText[]` | All alternate texts from the source, with language and role. |
| `id?` | `string` | Line id from the source, when it has one. |
| `agentId?` | `string` | The singer, when the source names one. |
| `songPart?` | `string` | Song part name from the source, e.g. `Chorus`. |
| `blockIndex?` | `number` | Index of the song part this line belongs to. |
| `isChorus?` | `boolean` | The line is part of a chorus. |
| `chorusEffect?` | `'bars' \| 'circles' \| 'beams'` | The chorus effect builtin modes draw for it. |
| `backgroundVocals?` | `FoliumBackgroundVocal[]` | Background vocals. |
| `wordSegments?` | `string[]` | The user's saved word split; `join('')` equals `fullText`. See `folium.lyrics.segmentWords`. |

相关：[FoliumWord](#foliumword) · [FoliumLineRenderHints](#foliumlinerenderhints) · [FoliumLyricAlternateText](#foliumlyricalternatetext) · [FoliumBackgroundVocal](#foliumbackgroundvocal)

### FoliumTheme

The current theme, the same fields and meanings as the host `Theme` builtin visualizers receive, plus
`isDaylight`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `name` | `string` | Theme name. |
| `backgroundColor` | `string` | CSS color. |
| `primaryColor` | `string` | CSS color of lyric text. |
| `accentColor` | `string` | CSS color for highlights. |
| `secondaryColor` | `string` | CSS color for secondary text. |
| `fontStyle` | `'sans' \| 'serif' \| 'mono'` | The builtin font family class. |
| `fontFamily?` | `string` | The user's chosen family, if any. For a CSS font-family value use `folium.theme.resolveFontStack(theme)`. |
| `fontFamilyStack?` | `string[]` | The user's font fallback list. |
| `fontWeight?` | `number` | For a concrete weight use `folium.theme.resolveFontWeight(theme, fallback)`. |
| `animationIntensity` | `'calm' \| 'normal' \| 'chaotic'` | How lively animations should be; builtin modes scale motion by it. |
| `wordColors?` | `{ word: string; color: string }[]` | Keyword colors; match them with `folium.lyrics.buildWordColorRanges` / `resolveWordColor`. |
| `lyricsIcons?` | `string[]` | Decorative icon names the theme suggests. |
| `provider?` | `string` | Where the theme came from (e.g. an AI provider). |
| `description?` | `string` | Theme description. |
| `isDaylight` | `boolean` | Folium addition: builtin modes get this as a separate `isDaylight` prop. |

### FoliumSong

A song as mods see it. Pass it back to the host (playSong, enqueue, beforePlay.replaceWith) only when it
carries a `ref`.

To keep data of your own per song, key it on `source` and `id` together when `id` is not null (an id is
unique only within its source); for a song without an id, on `title` and `artist`. `ref` is no key: it
is valid for one session only.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string \| null` | The song id at its source, as a string; unique only within `source`; null when unknown. |
| `title` | `string` | Song title. |
| `artist` | `string` | Artists joined with ` / `, in the order the source gives them; '' when there are none. |
| `album` | `string \| null` | Album name. |
| `source` | `string \| null` | Where the song comes from: an Omni provider id, 'local', 'navidrome', … |
| `ref` | `string \| null` | Opaque handle the host can turn back into the real song (playSong, enqueue, beforePlay.replaceWith). Valid for the session; null when the DTO was not built from a host song. |

### FoliumPlaybackState

The host player state.

```ts
type FoliumPlaybackState = 'playing' | 'paused' | 'stopped'
```

### FoliumLoopMode

The repeat mode. `all` repeats the queue, `one` the current song.

```ts
type FoliumLoopMode = 'off' | 'all' | 'one'
```

### FoliumQueueItem

One entry of the play queue, as `folium.playback.getQueue()` lists it.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong` | The song; its `ref` works with playSong, enqueue and playQueueItem. |
| `readonly index` | `number` | Its position in the host queue; stale as soon as the queue changes (`playback.queueChanged`). |

相关：[FoliumSong](#foliumsong)

### FoliumQueueSnapshot

A page of the play queue, from `folium.playback.getQueue()`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly items` | `readonly FoliumQueueItem[]` | The requested page, in queue order; each item carries its absolute `index`. |
| `readonly length` | `number` | Songs in the whole queue, not just this page. |
| `readonly currentIndex` | `number` | Position of the displayed song in the queue; -1 when it is not in it. The host finds the current song by identity, so a song listed twice counts at its first position. |
| `readonly kind` | `'queue' \| 'fm' \| 'stage'` | `queue`: the play queue. `fm`: Personal FM, whose queue is the current FM batch. `stage`: external Stage playback; the queue has nothing to do with what is playing, and playQueueItem refuses. |

相关：[FoliumQueueItem](#foliumqueueitem)

### FoliumPlaybackSnapshot

The whole playback picture, as main entries read it with `api.runtime.getPlaybackSnapshot()`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `song` | `FoliumSong \| null` | The displayed song. |
| `state` | `FoliumPlaybackState` | The player state. |
| `position` | `number` | Seconds. |
| `duration` | `number` | Seconds; 0 when unknown. |
| `lines` | `FoliumLine[]` | Lyrics of the displayed song. |
| `theme` | `FoliumTheme \| null` | The current theme. |
| `visualizerMode` | `string \| null` | The current lyric animation mode id. |
| `volume` | `number` | Output volume, 0–1. |
| `muted` | `boolean` | The mute switch, separate from `volume`. |
| `loopMode` | `FoliumLoopMode` | The repeat mode. |

相关：[FoliumSong](#foliumsong) · [FoliumPlaybackState](#foliumplaybackstate) · [FoliumLine](#foliumline) · [FoliumTheme](#foliumtheme) · [FoliumLoopMode](#foliumloopmode)

### FoliumLyricFormat

Lyric formats the host parses, the same parsers as local lyric files. These and nothing
else: lyrics in any other form (a platform's JSON, SRT, ASS, a custom word-timing scheme) are the mod's
to convert into one of them first. QRC and KRC are the decrypted plain text; the host does not decrypt.

The format is never sniffed, and the content is not checked against it: an `lrc` track that carries
`<mm:ss.xx>` word tags is read as plain LRC (name it `enhanced-lrc`), and mislabelled or malformed text
parses to no lines or to garbled ones. `folium.lyrics.parse` runs the same pipeline, to check a conversion.

```ts
type FoliumLyricFormat = 'lrc' | 'enhanced-lrc' | 'yrc' | 'qrc' | 'krc' | 'ttml' | 'vtt' | 'awlrc'
```

### FoliumLyricsTrack

One lyric document in its raw text, parsed by the host's local lyric file pipeline.
Each text is at most 1,048,576 characters.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `format` | `FoliumLyricFormat` | How to read `text`. |
| `text` | `string` | The raw lyric document. |
| `translationText?` | `string` | Translation lines, matched to `text` by start time like a local `.t.lrc` file (VTT cues for a `vtt` track). Ignored for `ttml`, which carries its translations inline. |
| `romanizationText?` | `string` | Romanization lines, matched like `translationText`. Ignored for `ttml`. |

相关：[FoliumLyricFormat](#foliumlyricformat)

### FoliumLyricsResult

Lyrics a provider hands the host. With both tracks the host shows `wordByWord`, and falls
back to `main` when it is missing or parses to no lines; a `wordByWord` track without its own
translation or romanization borrows the ones on `main`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `main?` | `FoliumLyricsTrack` | Line-timed lyrics, also the fallback for `wordByWord`. |
| `wordByWord?` | `FoliumLyricsTrack` | Word-timed lyrics, shown in preference to `main`. |
| `isPureMusic?` | `boolean` | An instrumental: the host shows its pure-music view and ignores both tracks. |
| `chorusRanges?` | `Array<{ startTime: number; endTime: number }>` | Chorus spans in seconds on the lyric clock; lines inside one get the chorus effect. Without them the host detects choruses from repeated lines, and TTML `songPart` markers take precedence over both. At most 64 are kept; a span needs finite times with `0 <= startTime < endTime`. |

相关：[FoliumLyricsTrack](#foliumlyricstrack)

### FoliumLegacyLyricsResult

The Folium 1.3 `getLyrics` answer: plain LRC, parsed as plain LRC. Deprecated in favor of
FoliumLyricsResult; Folium 2 drops it. A mod that answers it is told so once in its row in Settings.
@deprecated Answer a FoliumLyricsResult: `{ main: { format: 'lrc', text, translationText } }`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `lrc` | `string` | LRC text. |
| `translationLrc?` | `string` | Translation LRC. |

### FoliumParsedLyrics

What `folium.lyrics.parse` returns.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `lines` | `readonly FoliumLine[]` | The parsed lines; empty when the text holds none. The host's lyric display filter is not applied. |
| `isWordByWord` | `boolean` | Whether the lines carry real word timings rather than timings the host estimated. |

相关：[FoliumLine](#foliumline)

## 实验接口

需要在 `mod.json` 的 `experimental` 里选用，经 `folium.experimental[name]` 访问；任何 minor 版本都可能变化。

### FoliumLayoutRect

EXPERIMENTAL (`player.layout`): a rectangle in viewport CSS pixels.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly left` | `number` | Left edge. |
| `readonly top` | `number` | Top edge. |
| `readonly width` | `number` | Width. |
| `readonly height` | `number` | Height. |

### FoliumPlayerObstacle

EXPERIMENTAL (`player.layout`): a native control or its interactive reveal region; no internal ids.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly role` | `'navigation' \| 'window' \| 'playback' \| 'now-playing' \| 'panel' \| 'notification' \| (string & {})` | Coarse purpose; future hosts may add roles. |
| `readonly kind` | `'control' \| 'reveal-area'` | Hidden controls still reserve the pointer region that reveals them. |
| `readonly rect` | `FoliumLayoutRect` | Occupied rectangle. |

相关：[FoliumLayoutRect](#foliumlayoutrect)

### FoliumPlayerLayout

EXPERIMENTAL (`player.layout`): immutable snapshot; identity is stable until geometry changes.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly bounds` | `FoliumLayoutRect` | Live-player bounds in viewport CSS pixels. |
| `readonly insets` | `Readonly<{ top: number; right: number; bottom: number; left: number }>` | Four safe edge distances in CSS pixels, relative to bounds. |
| `readonly obstacles` | `readonly FoliumPlayerObstacle[]` | Regions to avoid; not guaranteed complete. Count, order and roles are not compatibility promises; native ids stay private. |

相关：[FoliumLayoutRect](#foliumlayoutrect) · [FoliumPlayerObstacle](#foliumplayerobstacle)

### FoliumRemoteActionDef

EXPERIMENTAL (`remote.actions`). Append-only buttons; native remote controls stay unchanged.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local action id; the host adds the owning mod and registration prefix. |
| `label` | `FoliumLabel` | Localized button label and accessible name. |
| `icon` | `string` | Lucide icon name in kebab-case. |
| `disabled?` | `boolean` | Prevents invocation while true. |
| `pressed?` | `boolean` | Toggle state exposed through aria-pressed. |
| `count?` | `number` | Optional nonnegative finite count. |
| `tone?` | `'normal' \| 'alert'` | Host-defined visual emphasis. |
| `scope?` | `'track' \| 'session'` | `track` (default) expires when the displayed song changes; `session` survives a song change. |
| `run()` | `(): void \| Promise<void>` | Runs in the main window through the host's remote bridge. |

相关：[FoliumLabel](#foliumlabel)

### FoliumRemoteActionsContext

EXPERIMENTAL (`remote.actions`). Current playback context for additional buttons.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly song` | `FoliumSong \| null` | Currently displayed song, or null when no song is displayed. |
| `readonly state` | `FoliumPlaybackState` | Playback state of the displayed song. |

相关：[FoliumSong](#foliumsong) · [FoliumPlaybackState](#foliumplaybackstate)

### FoliumRemoteActionsDef

EXPERIMENTAL (`remote.actions`). A group of buttons appended after native remote controls.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local registration id; the host adds the owning mod prefix. |
| `order?` | `number` | Order among mod groups only; native buttons cannot be reordered. |
| `actions()` | `(context: FoliumRemoteActionsContext): readonly FoliumRemoteActionDef[]` | Buttons for the current context. The per-mod limit is not yet finalized. |

相关：[FoliumRemoteActionsContext](#foliumremoteactionscontext) · [FoliumRemoteActionDef](#foliumremoteactiondef)

### FoliumRemoteActionsHandle

EXPERIMENTAL (`remote.actions`). Owns one additional remote-button registration.

```ts
interface FoliumRemoteActionsHandle extends FoliumRegistryHandle
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `invalidate()` | `(): void` | Re-evaluates actions and refreshes the remote window without changing native buttons. |
| `readonly id` | `FoliumId` | 继承自 [FoliumRegistryHandle](#foliumregistryhandle)。Full namespaced id (`modid:name`). |
| `unregister()` | `(): void` | 继承自 [FoliumRegistryHandle](#foliumregistryhandle)。Removes the entry now (the host also removes it when the mod stops). |

相关：[FoliumRegistryHandle](#foliumregistryhandle)

### FoliumProviderSong

EXPERIMENTAL (`omni.providers`): a song as a mod provider describes it.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Song id within this provider. |
| `title` | `string` | Song title. |
| `artists` | `string[]` | Artist names. |
| `album?` | `string` | Album name. |
| `coverUrl?` | `string` | Cover image URL. |
| `durationMs?` | `number` | Duration in milliseconds. |

### FoliumAudioQuality

Audio quality levels an Omni provider may be asked for.

```ts
type FoliumAudioQuality = 'standard' | 'high' | 'lossless' | 'hires'
```

### FoliumOmniProviderDef

EXPERIMENTAL (`omni.providers`): an online music source. The host adapts it
to its provider contract; songs from it play, queue and show lyrics like any
online song. Use folium.net.fetch for network access.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `id` | `string` | Local provider id. |
| `displayName` | `string` | Full name: the second line of the source's row in the home provider switcher. |
| `shortName?` | `string` | Short name: the switcher row, the search overlay's source chip and the home placeholder title; its first character is the avatar badge. Defaults to `displayName`. |
| `search?()` | `(query: string, page: { limit: number; offset: number }): Promise<{ items: FoliumProviderSong[]; hasMore: boolean; total?: number }>` | Search songs; `page` is offset-based. |
| `getSong?()` | `(id: string): Promise<FoliumProviderSong \| null>` | One song by id. |
| `getAudioUrl?()` | `(song: FoliumProviderSong, quality: FoliumAudioQuality): Promise<{ url: string; expiresAt?: number } \| null>` | A playable URL for the song at a quality. |
| `getLyrics?()` | `(song: FoliumProviderSong): Promise<FoliumLyricsResult \| FoliumLegacyLyricsResult \| null>` | Lyrics for a song, as raw text the host parses (FoliumLyricsResult), or the deprecated Folium 1.3 plain-LRC shape. Null when there are none. |

相关：[FoliumProviderSong](#foliumprovidersong) · [FoliumAudioQuality](#foliumaudioquality) · [FoliumLyricsResult](#foliumlyricsresult) · [FoliumLegacyLyricsResult](#foliumlegacylyricsresult)

## main 入口（Node）

`mod.json` 的 `main` 指向一个 `.cjs` / `.js` 文件，它导出的 `activate(api)`（[FoliumMainModule](#foliummainmodule)）在 Folia 的主进程里运行，参数是 [FoliumMainApi](#foliummainapi)。这一节来自 [`src/mods/folium/mainContract.ts`](../../src/mods/folium/mainContract.ts)。

### FoliumMainModule

The shape of a main entry. The file `main` names exports the function itself:
`module.exports = function activate(api) { ... }`. It may return a function, which runs when the mod
stops, like one given to `api.onDispose`. It may be `async`; a throw, or a promise that rejects, marks
the mod as failed.

```ts
type FoliumMainModule = (api: FoliumMainApi) => void | FoliumDisposer | Promise<void | FoliumDisposer>
```

相关：[FoliumMainApi](#foliummainapi) · [FoliumDisposer](#foliumdisposer)

### FoliumMainApi

The object a main entry's `activate(api)` receives.

The main entry runs in Node with full access: it can `require` any Node module, and `require('electron')`
too. But only `api` is the contract; anything else may change between Folia releases.

A member that needs a permission says so. Called without that permission in mod.json `permissions`, a
synchronous member throws `permission-denied:<permission>`, and an asynchronous one returns a promise that
rejects with that error.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly manifest` | `FoliumManifest` | This mod's mod.json as the host read it (missing fields filled in), frozen. |
| `readonly host` | `FoliumHostInfo` | Host versions; the same as the client entry's `folium.host`. |
| `readonly log` | `FoliumLogger` | Logging; `error` entries show in the mods panel under the mod. |
| `readonly storage` | `FoliumMainStorage` | This mod's data file: the same file the client entry's `folium.storage` reads and writes, so both sides see one state. Needs the `filesystem.data` permission. |
| `readonly paths` | `FoliumMainPaths` | Folders to write into: this mod's own folder and the user's folders. |
| `onDispose()` | `(disposer: FoliumDisposer): void` | Runs `disposer` when the mod stops: it is turned off, reloaded, or the app quits. Release here what `activate` started: timers, watchers, listeners, child processes. Cleanups run last registered first (the function `activate` returned counts as registered when `activate` returned), and one that throws does not stop the others. After the mod has stopped, `disposer` runs at once. Returns nothing. |
| `readonly runtime` | `FoliumMainRuntime` | What the app is playing. |
| `readonly rpc` | `FoliumMainRpc` | Answers calls from this mod's client entry. |
| `readonly render` | `FoliumMainRender` | Video export. |

相关：[FoliumManifest](#foliummanifest) · [FoliumHostInfo](#foliumhostinfo) · [FoliumLogger](#foliumlogger) · [FoliumMainStorage](#foliummainstorage) · [FoliumMainPaths](#foliummainpaths) · [FoliumDisposer](#foliumdisposer) · [FoliumMainRuntime](#foliummainruntime) · [FoliumMainRpc](#foliummainrpc) · [FoliumMainRender](#foliummainrender)

### FoliumManifest

A mod's mod.json as the main entry sees it in `api.manifest`: every field there, missing ones filled in.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly folium` | `number` | The Folium major version the mod is written for. |
| `readonly id` | `string` | The mod id. |
| `readonly name` | `string` | The mod's name. |
| `readonly version` | `string` | The mod's version, `MAJOR.MINOR.PATCH`. |
| `readonly author` | `string \| null` | The author, or null. |
| `readonly description` | `string \| null` | The description, or null. |
| `readonly main` | `string \| null` | The main entry's file name, or null. |
| `readonly client` | `string \| null` | The client entry's path in the mod folder, or null. |
| `readonly depends` | `readonly string[]` | The mods this one depends on (`id` or `id@^1.2.3`). |
| `readonly permissions` | `readonly string[]` | The permissions the mod declares. |
| `readonly experimental` | `readonly string[]` | The experimental surfaces the mod opts into. |
| `readonly embedOrigins` | `readonly string[]` | The https origins `folium.ui.embed` may load. |
| `readonly folia` | `string \| null` | The Folia versions the mod needs (e.g. `>=0.7.0 <0.8.0`), or null. |
| `readonly preview` | `string \| null` | The introduction image's path in the mod folder, or null. |

### FoliumMainStorage

`api.storage`: the data file the client entry shares (FoliumStorage, capped at 1 MB), and the directories
for anything larger.

```ts
interface FoliumMainStorage extends FoliumStorage
```

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly paths` | `FoliumModPaths` | The directories this mod writes its own files to. Always there, permission or not, so `'paths' in api.storage` finds it. |
| `get()` | `<T = unknown>(key: string): Promise<T \| undefined>` | 继承自 [FoliumStorage](#foliumstorage)。The stored value, or undefined. |
| `set()` | `(key: string, value: unknown): Promise<void>` | 继承自 [FoliumStorage](#foliumstorage)。Stores a JSON-serializable value. |
| `has()` | `(key: string): Promise<boolean>` | 继承自 [FoliumStorage](#foliumstorage)。Whether the key exists. |
| `delete()` | `(key: string): Promise<void>` | 继承自 [FoliumStorage](#foliumstorage)。Removes the key. |
| `keys()` | `(): Promise<string[]>` | 继承自 [FoliumStorage](#foliumstorage)。All keys. |

相关：[FoliumStorage](#foliumstorage) · [FoliumModPaths](#foliummodpaths)

### FoliumModPaths

`api.storage.paths`, the directories this mod writes its files to. Needs the `filesystem.data` permission; without
it, reading either path throws `permission-denied:filesystem.data`. Each read creates the directory when it is
missing, and throws the file system's error when it cannot (a file or a dead link standing where the
directory should be; for `cache`, clearing the cache in the mods panel removes that entry). Both getters
are non-enumerable, so serializing or spreading `api` never reads them. Clients get no paths: they have no
file system.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly data` | `string` | Files to keep: `<userData>/mods-data/<id>/files`, beside (not holding) the data file. |
| `readonly cache` | `string` | Files the mod can rebuild: `<userData>/mods-cache/<id>`. The user can empty it from the mods panel at any time, even while the mod runs, so expect files to vanish; the host sets no size limit, so cap it yourself. |

### FoliumMainPaths

`api.paths`: where a main entry writes. Put what the user will look for (an export, a report) under one
of the user's folders; keep the mod's own files under `api.storage.paths`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `readonly documents` | `string` | The user's Documents folder. Reading it throws when the system has no such folder; so do the other three. |
| `readonly downloads` | `string` | The user's Downloads folder. |
| `readonly music` | `string` | The user's Music folder. |
| `readonly videos` | `string` | The user's Videos folder. |

### FoliumMainRuntime

`api.runtime`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `getPlaybackSnapshot()` | `(): FoliumPlaybackSnapshot \| null` | The playback state the app last sent to the main process, or null before it sent one. While playing, `position` is moved on by the time since. Needs the `playback.read` permission. |

相关：[FoliumPlaybackSnapshot](#foliumplaybacksnapshot)

### FoliumMainRpc

`api.rpc`: the main half of `folium.rpc`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `handle()` | `(name: string, handler: (...args: any[]) => unknown): void` | Answers the client entry's `folium.rpc.call(name, ...args)`: `handler` gets the call's arguments, and what it returns (or what its promise resolves to) is the call's result; a throw rejects the call. Arguments and results cross between processes, so both must be JSON-serializable. `name` must match `/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/`, and a second handler for the same name throws. |

### FoliumMainRender

`api.render`.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `exportVideo()` | `(spec: FoliumExportSpec): Promise<FoliumExportResult>` | Exports the current song as a video, drawn the way the app shows it now: the lyric animation mode, its settings and tuning, the lyrics and the theme. `spec` holds only output choices. Needs the `render.export` permission, and an ffmpeg Folia can find (the mods panel says whether it found one). Folia shows the progress. The promise resolves when the export ends, whether or not the video was written: read `ok`. |

相关：[FoliumExportSpec](#foliumexportspec) · [FoliumExportResult](#foliumexportresult)

### FoliumExportSpec

Output choices for `api.render.exportVideo`. Every field is optional; numbers are clamped to their range.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `codec?` | `'vp9' \| 'prores'` | `vp9` (default): WebM, about a tenth of the size. `prores`: ProRes 4444 in a MOV, large, opens almost anywhere. |
| `width?` | `number` | Width in pixels, 320 to 3840; default 1920. |
| `height?` | `number` | Height in pixels, 180 to 2160; default 1080. |
| `fps?` | `number` | Frames per second, 10 to 60; default 30. |
| `startSec?` | `number` | Start, seconds into the song; default 0. |
| `endSec?` | `number` | End, seconds into the song. 0, or a time not after `startSec`, means 2 seconds after the lyrics end (and at least 1 second after `startSec`). The video is at most 15 minutes long. |
| `background?` | `'transparent' \| 'theme'` | `transparent` (default): the lyrics on a transparent background; the alpha channel is kept on Windows, and may come out black elsewhere. `theme`: on the song theme's background colour, on every system. |

### FoliumExportResult

What `api.render.exportVideo` resolves to.

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `ok` | `boolean` | True when the video was written. |
| `error?` | `string` | Why not, when `ok` is false: `export-no-lyrics`, `export-invalid-duration`, `export-unsupported-platform`, `export-already-running`, `export-ffmpeg-not-found`, `export-cancelled`, or another `export-…` code. |
| `cancelled?` | `boolean` | The user cancelled the export. |
| `outputPath?` | `string` | The video file, in `Folia Exports` under the user's Videos folder. |
| `frameCount?` | `number` | Frames written. |
| `sizeBytes?` | `number` | The file's size, bytes. |
| `durationSec?` | `number` | The video's length, seconds. |
| `backgroundMode?` | `'none' \| 'theme'` | `none` (a transparent background) or `theme`. |
| `transparent?` | `boolean` | The video has a transparent background. |
| `warnings?` | `string[]` | What may be off in a written video: `export-alpha-unavailable` (this machine captured no alpha channel), `export-alpha-not-guaranteed` (not Windows: the alpha channel may be black). |

## 基础类型

### FOLIUM_VERSION

The Folium version this host implements; mods read it at runtime as `folium.host.folium`.

```ts
const FOLIUM_VERSION = Object.freeze({ major: 1, minor: 6 })
```

### FoliumId

`modid:name`, like a Forge ResourceLocation. The mod id part is added by the host.

```ts
type FoliumId = string
```

### FoliumLabel

Localized text keyed by locale (`zh-CN`, `zh-TW`, `en`, `in`); the host falls back to `en`, then to any entry.

```ts
type FoliumLabel = Record<string, string | undefined>
```

### FoliumDisposer

Undoes a registration, subscription or mount. Safe to call more than once.

```ts
type FoliumDisposer = () => void
```

## 仍可用的旧名字

为 Folium 1.5 写的模组在 Folium 1.x 里照旧能用下面这些名字；模组用到哪一个，设置里这个模组那一行就提醒一次。Folium 2 起它们不再有效。本表由 `src/mods/folium/deprecated/oldNames.ts` 和 `electron/modSystem/deprecated.cjs` 生成，`npm run folium:check` 用同样的表把它们列为提醒。

| 旧名字 | 现在写 | 在哪里 |
| --- | --- | --- |
| `ctx.subscribe` | `ctx.onChange` | client 入口 |
| `ctx.currentTime` | ctx.lyricTime (visualizers, stage layers) or ctx.playbackTime (progress buttons and layers) | client 入口 |
| `ctx.currentTime.on` | ctx.onLyricTime or ctx.onPlaybackTime | client 入口 |
| `ctx.onTime` | ctx.onLyricTime or ctx.onPlaybackTime | client 入口 |
| params (of a settings section handle, of ctx in a settingsPanel) | `settings` | client 入口 |
| `params.subscribe` | `settings.onChange` | client 入口 |
| `folium.registries.controlButtons` | `folium.registries.progressButtons` | client 入口 |
| tunings.register({ params }) | tunings.register({ settings }) | client 入口 |
| `data-folium-kind="control-button"` | `data-folium-kind="progress-button"` | client 入口 |
| `folium.internals` | removed in Folium 2, nothing takes its place | client 入口 |
| getLyrics answering { lrc, translationLrc } | { main: { format: 'lrc', text, translationText } } | client 入口 |
| folium.events.on('<a name that is no event>') | does nothing; Folium 2 throws unknown-event:<name> | client 入口 |
| `api.storage.data` | `api.storage` | main 入口 |
| `api.lifecycle.onDeactivate` | `api.onDispose` | main 入口 |
| `api.experimental` | removed in Folium 2, nothing takes its place | main 入口 |
| activate returning { dispose } | a function returned from activate, or api.onDispose | main 入口 |
| 权限 `runtime.playback` | `playback.read` | mod.json |
| 权限 `ui.stage` | `stageLayers` | mod.json |
| mod.json 不认识的字段 | 只提醒；Folium 2 起是错误，模组不加载 | mod.json |
