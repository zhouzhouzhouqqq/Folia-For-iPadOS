# 后台播放：真机故障与修复记录

更新：2026-10-16。网易云直连曾获用户可用确认；后台修复版本随后收到新反馈：**歌曲列表能显示，点播放一直转圈或无声**。当前优先恢复前台播放；前台与后台均待最新版本真机复验，不能以编译成功宣称已修好。

## 最新：系统控件切歌与曲目信息

用户随后报告系统控件不能切歌、缺少封面/名字。此次修正由实际WebKit媒体会话统一接收系统命令并发布metadata/timeline；宿主仅配置合法会话/监听route，在Web API缺失时才保留原生fallback。不会重新启用宿主setActive或增加另一播放器。实现、实测范围与安装验收见 [系统控件专项记录](ipados-system-controls.md)。旧版的宿主NowPlaying/RemoteCommand配置说明仅作为历史保留；以本节和专项记录为准。

## 前次：已取得真机事件，修正宿主与 WebKit 音频焦点冲突

已在用户开启网页检查器后读取 iPad Air 11-inch (M4)、iPadOS 27.0.1 的播放现场：播放键可点且命中正常；blob 音频 readyState=4、networkState=1、无媒体错误；播放后很快发生 pause / context interrupted / 重复宿主 audioInterruption began。设备 bootstrap 的 SHA256 与前次最新构建一致，排除了只安装旧资源这一分支。去标识记录见 [device evidence](ipados-validation/audio-session-ownership-device.json)。临时观察器已移除，没有读取账号、Cookie、Token、曲名、完整播放链接或本地文件。

代码中宿主 configureAudio 在播放前和 playing/PLAYING 更新后均 setActive(true)，同时把宿主的 interruption 直接送入 WebKit transport.pause。宿主会话与 WKWebView 的实际发声会话不是同一个对象；它们互相争抢焦点及暂停反馈与记录一致。本轮移除宿主 setActive，宿主仅配置 playback 类别/系统命令；playing 仅发布信息，不再次配置宿主；宿主中断仅作诊断，不驱动 WebKit 暂停/继续。真正的音频焦点和系统中断由实际发声的 WebKit 管理。保留网页 playback 类型、同一 Web Audio 图、EQ/全部效果/混音/分析器，以及显式锁屏命令和拔耳机暂停。

9 文件 118 项回归（含宿主 began 重复通知不暂停、ended 不擅自继续、playing 只发布信息、遥控/拔耳机/清理）通过；typecheck、Web/PWA、iOS sync、arm64 无签名编译通过。证据前缀 `audio-session-ownership-*`。这不是已经修好后台的真机结论：新原生代码必须在 Xcode 用原 Team/Bundle ID Run 覆盖安装后才能测。前台、真正电话/Siri/其他App中断及是否自动恢复、后台/锁屏/下一首长播均待新版真机复验；不能把宿主 shouldResume 当作 WebKit 播放意图，也不以反复强行 play 保活。

## 前次修复记录：播放启动回归（以下为当时结果）

前次新增的 transport 逻辑会先等待 WebKit context.resume()，再等待原生 configureAudio()，最后才调用 media.play()。在 interrupted context 或尚未激活的 WebKit 会话中，resume 可能等待媒体启动；桥接失败/迟返也会使媒体无法进入 play。源码中存在这条阻塞路径，单测可以重现，但尚未取得故障设备的 JS 会话状态，不能认定它是本次故障的唯一原因。

本轮改为：iPad 上在同一任务中发起现有图的 resume、原生激活和媒体 play；前两者独立捕获错误，不阻塞媒体启动。桌面原有 suspended-resume 等待逻辑保留。源变化后的自动播放也在 play 前连接/恢复同一张完整音效图，而不是等 playing 事件后才恢复；锁屏继续同样取消原生激活的前置等待。原 EQ、混音、分析器、淡入淡出和 pause/source revision 取消保护保留。

新增测试明确覆盖两个永不返回的 promise、两种拒绝、interrupted context、播放期间暂停，以及真实 usePlaybackAudioBridge 首次点歌/下一首共用一张图。8 文件 115 项回归通过，包含网易云直连/routing；typecheck、Web/PWA、iOS同步和无签名arm64构建证据使用 `playback-start-regression-*` 前缀，见 [实际报告](ipados-test-report.md)。这些是代码/构建层验证，前台实播与后台续播仍待覆盖安装验收。

只读设备信息显示连接的是 iPad Air 11-inch (M4)、iPadOS 27.0.1；没有读取登录数据、媒体文件或使用签名账号。尝试现有进程的控制台连接未得到有效音频状态，不算真机播放测试，也未安装或替换设备上的 App。

## 源码与平台依据

1. `usePlaybackAudioBridge.ts` 使用双 HTMLAudio deck → mix → EQ → effects → volume → fade → analyser → AudioContext.destination。声音实际经过 Web Audio，不能只给宿主勾选 Background Audio。
2. 原代码仅在 Swift 配置 AVAudioSession，未设置网页层 `navigator.audioSession.type`。WebKit `AudioContext::shouldOverrideBackgroundPlaybackRestriction` 对进入后台的处理会检查 DOM AudioSession 是否为 playback/play-and-record；仅宿主设置不会替代这个网页声明。参考 [WebKit AudioContext源码](https://github.com/WebKit/WebKit/blob/main/Source/WebCore/Modules/webaudio/AudioContext.cpp)、[AudioSession.type](https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type)。这是与症状吻合的源码依据，尚无该设备进程日志证明唯一原因。
3. 本机 iOS SDK `AVAudioSessionTypes.h` 明确 `.allowAirPlay` 仅适用于 `.playAndRecord`；原代码用于 `.playback`，是不合法的组合，可能导致 activation 前 setCategory 失败。纯 playback 本来就支持 AirPlay/A2DP，不需要该选项。
4. 未发现应用自己的 visibilitychange 逻辑主动暂停普通音乐。Capacitor 已允许 inline media、无需新手势启动媒体；本次未修改其默认实现或调用私有 WebKit API。

## 前次修复的实现范围（以顶部最新记录为准）

| 位置 | 改动 | 保留的行为 |
|---|---|---|
| `src/platform/ios/audioSession.ts` | 通过统一 Capacitor 能力检测，在创建/恢复图前选择网页 playback session；功能检测缺失/设置失败时明确输出日志 | 不修改桌面/浏览器默认会话，不创建第二播放器或静音保活音轨 |
| `usePlaybackAudioBridge.ts`、`usePlaybackTransportController.ts` | 图创建/用户恢复路径接该会话；回前台仅恢复同一个 context，清理全部监听器，避免 pending resume 重复 | EQ/音效/双deck/分析器和原淡入淡出顺序不变；后台不强制低画质，不绕过暂停 |
| `FoliaDevicePlugin.swift` | `.playback/.default/options:[]`，不重复设置未变化的category；最新版本只配置、不调用setActive，保留配置错误详情；记录宿主中断和进入后台的category/mode | MPRemoteCommand、NowPlaying、route仍接原transport；宿主中断只作诊断，不反馈pause/play；没有新增mic/录音模式 |

网页层恢复尊重用户暂停、closed/running context 与系统 interrupted session。它只在前台恢复已有图，不依赖后台轮询/无限重试维持进程。原混音代码已有 timeupdate/音频时钟调度；跨后台下一首仍需实际测试。

## 已执行验证

- 5文件56项通过，覆盖网页 playback选择、非iOS不改会话、API缺失/拒绝、可见性/用户暂停/中断结束、重复恢复与监听清理、真实transport中会话→图→resume→native顺序，以及原淡入淡出、EQ效果图与MediaSession工具。
- TypeScript通过；测试不证明 WebKit 真正后台运行。
- Web/PWA、iOS sync与arm64无签名编译证据保存在 `ipados-validation/background-audio-*.log`；最新完成状态见 [实际报告](ipados-test-report.md)。

## 实体 iPad 复验

本机已构建同步最新资源。原 `ios/App/App.xcodeproj` 中保留用户 Team/Bundle ID，选择 iPad 按 ⌘R覆盖，不卸载、不重新配置网易地址。

1. 前台播放并打开可听见差异的 EQ/音效，切其他 App 两分钟；返回应保持歌曲进度、EQ/效果与分析器，不跳回开头。
2. 锁屏两分钟，测试锁屏暂停/继续、耳机键；再跨至少两首并连续播放60分钟。短时通过不代替长播。
3. 单独测蓝牙/AirPlay换路由、拔耳机暂停、电话/Siri中断及恢复。不要将正常系统抢占当作应该强行播放。
4. 如仍失败，记录iPad型号/iPadOS、是立刻还是下一首停，以及Xcode的 `[iOS audio]` / `AudioSession` 日志。它们不包含账号Cookie、音频URL或个人文件内容。

若日志显示缺少网页 AudioSession API，或声明后WebKit仍中断/挂起，不应承诺所有旧系统能用本修复。后续需以实际系统日志决定是否开发原生音频后端，并先验证全部DSP、双deck混音、分析器数据和统一状态的兼容设计；不得偷换为无音效AVPlayer。当前尚未实施原生音频引擎。
## 2026-10-22 补充：后台同图恢复

用户反馈后台偶尔无声、进度仍继续。`bindIOSAudioContextLifecycle` 原来拒绝所有 hidden 页面恢复，现在只在播放意图仍为真且 `navigator.audioSession.state === 'active'` 时接受后台 context/session/visibility 恢复事件。用户暂停、inactive/interrupted 会话不抢占焦点，宿主仍不调用 `setActive(true)`，不启动第二个播放器、不改动原 DSP/AutoMix/分析图。事件边界已有单测，后台实际可听仍待构建 4 真机复测；冻结的网页不能靠 JS 事件恢复保证长播。同步处理的 iPhone 13 Pro highwater 重载证据及所有验证边界见 [手机故障跟踪](ipados-phone-playback-reload.md)。
