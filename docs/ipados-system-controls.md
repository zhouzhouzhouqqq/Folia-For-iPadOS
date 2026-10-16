# 锁屏与控制中心：曲目信息和系统切歌

2026-10-16。用户反馈：App 内已有切歌入口，但系统控件不能切换音乐，没有封面和曲名。此反馈记为设备故障，不能沿用此前编译通过判定系统控制可用。

## 原因与修正

### 后续反馈：仍显示 -10 / +10 秒

用户更新后明确反馈系统面板仍显示跳秒按钮，没有上一曲/下一曲。前次回调测试通过不等于系统按钮布局通过，本项继续记为真机失败反馈/新修复待复验。

本轮补齐音乐命令选择：

- `useWebMediaSessionActions.ts` 在iPad显式将 `seekbackward/seekforward` 处理器设为null，随后注册 `previoustrack/nexttrack`。`seekto`独立保留，支持拖动进度。
- 不只在App初次挂载注册：换source/显示deck、`loadedmetadata`、`playing`和回前台后重新确认音乐命令。命令注册失败时不向原生宣告该方向可用。
- 新增公开原生桥 `setMusicControls`，在主线程设置 `MPRemoteCommandCenter`：关闭 `skipForward/skipBackward/seekForward/seekBackward`，启用成功注册的上一曲/下一曲。进入后台和回前台重新应用，不轮询。
- 原生桥仅选择命令，不新增WebKit命令的native target，不发布第二套metadata，不调用 `setActive`。实际切歌仍由WebKit action进入原queue/AutoMix refs，避免双派发。
- Native日志 `Music buttons next=… previous=… skipForward=false skipBackward=false` 仅记录布尔值，可用于后续设备排查，不包含歌名/音频URL/账号。

平台依据：上游 [MediaSession.cpp](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/mediasession/MediaSession.cpp) 将 `Seekbackward/Seekforward` 映射为 SkipBackward/SkipForward，`Previoustrack/Nexttrack` 映射为 PreviousTrack/NextTrack；`setActionHandler` 按这些不同类型增加/移除supported command。本机iOS26.5 SDK `MPRemoteCommandCenter.h`同样分别公开skip、seek、next/previous命令。本轮没有证据证明设备实际WebKit构建与上游main完全相同，不把源码推断当成真机已修好。

本轮证据前缀 `system-track-buttons-*`：51文件845项播放/AutoMix/媒体回归、typecheck、实际macOS WebKit测试（新增无interval action/仍可seekto/切歌后音乐策略保持断言）、Web/PWA构建、iOS sync与App/iphoneos26.5/arm64无签名构建均通过。dist/同步public/编译App的资源SHA256一致。原生命令中心的设备布局不在Mac WebKit测试覆盖范围。USB网页检查仍返回NoDeviceConnectedError，没有新设备状态，未安装或签名。

真机须特别核对：控制中心和锁屏两侧应显示切曲图标而非10秒数字；播放中、暂停后继续、换下一首、后台回来以及AutoMix交接后仍保持。每按一次只切一首，拖动进度仍有效；若只有一首队列，先加入更多歌曲。

### 前次：metadata与命令所有者

旧 iPad 分支在 `useMediaSessionBridge.ts` 的三个 effect 中直接跳过 Web Media Session，改向宿主 `MPNowPlayingInfoCenter` 发布信息、注册宿主 `MPRemoteCommandCenter`。实际发声的仍是 WKWebView 的 HTMLMediaElement → Web Audio 图。宿主的静默会话与 WebKit 的实际会话不是同一个所有者，这条代码路径不能保证系统面板能收到信息或将命令发往播放器。

本轮以实际 API 能力决定唯一所有者：

- WebKit 提供 Media Session / MediaMetadata 时，曲名、歌手、专辑、封面、播放状态、进度与 `play/pause/previoustrack/nexttrack/seekto` 统一交给 WebKit。
- 使用既有 transport refs；上一曲/下一曲继续走原队列/FM/循环/AutoMix。更新 refs 不重复注册系统命令，StrictMode 清理后只保留一份有效处理器。
- 仍以显示曲目的音频 deck、source 和时钟发布，保留 AutoMix outgoing 画面期间的时间轴一致性；丢弃上一条 source 的迟到事件。
- iPad 封面从既有资源读取为有界图片字节的 data URL，避免系统信息依赖即将撤销的页面 blob；不重新请求音乐、登录或上传数据。图片请求随换歌/卸载取消，旧图片迟返不覆盖新曲。异常或超过4MB的图片不影响曲名/控制。
- `setPositionState` 缺失或抛错时仍发布曲名/封面。seek/rate立即同步进度，timeupdate最多每秒一次；回前台重发。切到外部 Now Playing 舞台或清空曲目时清除本地信息。
- 原生 `configureAudio({webMediaSession:true})` 只配置合法 playback 类别，不注册另一套宿主媒体命令、不向宿主写 Now Playing、不调用 `setActive`。真正缺失 Web Media Session 的系统才保留原生桥 fallback；fallback 的系统面板可用性仍需对应设备验证。
- 宿主中断仍只作诊断；拔耳机暂停保留。继续使用一套完整 Web Audio 图、EQ/音效/双deck/分析器，不增加另一个播放器或保活音轨。

入口：`src/hooks/useMediaSessionBridge.ts`、`useNativeMediaSessionBridge.ts`、`src/utils/mediaSessionSync.ts`、`src/services/mediaSessionArtwork.ts`、`src/platform/ios/audioSession.ts`、`ios/App/App/FoliaDevicePlugin.swift`。

## 本轮验证

±10秒后续修正的最新结果见上面的后续反馈节，使用 `system-track-buttons-*` 证据；下表保留前次metadata修正的结果。

| 检查 | 实际结果 | 证据 |
|---|---|---|
| 播放/AutoMix/媒体桥回归 | 51文件841项通过，含系统命令单次派发/最新refs、StrictMode清理、同显示deck时间轴、迟到封面、旧source拒绝、部分API、舞台清理、timeline节流/卸载 | `system-media-tests.log` |
| 真实macOS WebKit | 1项通过：一个真实Web Audio图与合成HTMLAudio，实际MediaMetadata曲名/作者/data封面；注册回调的上下首、pause/play/seek，host无metadata发布 | `system-media-webkit.log` |
| 类型检查 | 通过 | `system-media-typecheck.log` |
| 原Web/PWA | 构建通过，原PWA生成保留 | `system-media-web-build.log` |
| iOS前端与Capacitor | 本地资源构建及sync通过 | `system-media-ios-sync.log` |
| iOS完整工程 | 先核对实际App scheme和iphoneos26.5 SDK，再arm64 Debug无签名build通过 | `system-media-xcode-list.log`、`system-media-sdks.log`、`system-media-ios-build.log` |
| 资源一致性 | dist/sync public/编译App逐文件SHA256一致；无server.url和iOS Service Worker；探针未进入生产入口 | `system-media-bundle.json` |

证据均在 `docs/ipados-validation/`。已实现并验证限定上述代码/构建/宿主浏览器层级，真机结果见下表。

测试入口：

```sh
npm run test:unit -- test/unit/playback test/unit/automix test/unit/ipados/nativeMediaSessionOwnership.test.ts test/unit/ipados/webMediaSession.test.ts test/unit/utils/mediaSessionSync.test.ts
npx playwright test -c dev/ipados/media-session/playwright.config.ts
npm run typecheck
npm run build
npm run ios:sync
```

浏览器测试使用真正的 macOS WebKit MediaMetadata/MediaSession、生成的 WAV/封面与一个 Web Audio 图。探针与原 `usePlaybackAudioBridge` 一样在源变化后显式load；捕获已注册的action回调，从测试点击提供交互上下文后调用，避免将普通evaluate缺少交互上下文导致的媒体等待误判为系统回调失败。它不是通过锁屏/控制中心发出的系统事件。原生桥只替换I/O，不使用个人账号或曲库。新增探针不会打入App。

本轮 USB 网页检查连接返回 NoDeviceConnectedError，没有取得新的设备 JS 状态或验证系统面板；没有尝试签名、覆盖安装或操作用户账号。

## 实体 iPad 待验收

在原 Xcode 工程保留 Team/Bundle ID，选择 iPad 后 ⌘R 覆盖安装，无需卸载或重配网易 API。先从包含至少三首歌的歌单播放：

- [ ] 控制中心显示正确曲名/歌手/封面/进度；手动换歌后同步更新。
- [ ] 控制中心上一曲/下一曲各切一首，不重复跳两首；暂停/继续和拖进度正常。
- [ ] 锁屏进行同样操作，后台跨曲后信息和声音一致。
- [ ] 蓝牙/耳机上一曲/下一曲，不重复命令或恢复到旧歌。
- [ ] AutoMix 持有 outgoing 画面/转场中切歌，显示信息、时钟和声音一致。
- [ ] EQ/音效保持，宿主不再争抢焦点；60分钟后台与系统中断继续按后台专项清单验收。

当前状态：代码已实现，系统面板与耳机的实际事件仍待新版真机验收；本修正不等于后台长播或全部平台功能已完整通过。
