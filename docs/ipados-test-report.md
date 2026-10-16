# iPadOS 实际验证报告

更新：2026-10-16，Asia/Shanghai。基线 `35db05ccef6065e868fab14f49b433c8344e9ca1`，分支 `codex/ipados-self-use`。未提交、推送、部署、发布或使用个人账号；没有上传本地音频/个人文件。

**最新结果：网易云设备内直连已实现，不再需要部署 API。** 真实匿名上游验证得到二维码 key、搜索、详情、歌词和非空标准音质播放 URL；核心加密/native会话与156项相关回归通过。类型检查、原 Web/PWA、iOS前端同步及arm64无签名构建记录如下。用户已自行更新并反馈网易云可用；随后后台停播已复现，当前修复待复验，连续播放尚未通过。不能称全部桌面功能已完整保留并验证。

## 最新：系统仍显示±10秒而非上下首

用户明确反馈前一版系统面板仍只有-10/+10，不能认定系统切歌已验收。新代码清除iPad的WebKit interval actions，保留seekto，按实际播放器loadedmetadata/playing/换source/回前台重新注册track actions，并用主线程公开原生命令中心显式禁用skip/连续seek、启用已注册的next/previous。WebKit仍是实际音频/metadata/命令回调所有者，没有重复native target或focus activation。实现和本轮结果见 [系统控件专项](ipados-system-controls.md)，证据前缀`system-track-buttons-*`。USB检查不可用，系统图标与真正OS命令仍待更新后的iPad验证。

51文件845项单测、typecheck、1项真实Mac WebKit媒体组件测试、Web/PWA、iOS sync及App/iphoneos26.5/arm64无签名build通过；打包资源逐文件一致。新增回归覆盖interval清除/保持seekto、音频成为当前session后和回前台重绑、注册被拒绝时不宣告可用、桌面策略保留；没有用浏览器回调结果代替真机按钮布局。

## 前次：系统控件无切歌、封面、曲名

用户最新报告控制中心/锁屏无法切歌、无曲名封面，记为系统控件真机失败反馈。已取消iPad对Web Media Session的跳过，使用实际WebKit会话发布信息与接收原transport命令；宿主不同时发布到静默会话。稳定封面字节、过期请求清理、AutoMix显示deck与进度一致性保留。详见 [系统控件专项](ipados-system-controls.md)。

真实macOS WebKit的MediaSession/MediaMetadata、合成WAV/图片、一个Web Audio图验证通过；用带交互上下文的测试点击调用已注册action回调，不是真正锁屏/控制中心事件。[浏览器证据](ipados-validation/system-media-webkit.log)。51文件841项回归、typecheck、Web/PWA、iOS sync与App/iphoneos26.5/arm64无签名构建全部通过，dist/同步/编译App逐文件一致；证据前缀`system-media-*`，汇总在专项文档。USB连接检查本轮未取得设备JS状态；本轮未签名/安装或读取个人媒体。系统面板、耳机事件和后台长播仍待覆盖安装验证。

## 前次：上一曲 / 下一曲触控入口

iPad有当前曲目时播放条常驻展开，曲名两侧44×44上一曲/下一曲直接可点；接触控板仍保留入口。原桌面hover/预览/动画、队列/FM/循环/AutoMix和系统远控统一transport保留。详见 [播放控制](ipados-playback-controls.md)。

[WebKit组件回归](ipados-validation/track-switch-webkit.log)：原桌面6项与触屏2项通过（窄分屏圆角最终修正后[触屏2项复验](ipados-validation/track-switch-touch-final.log)亦通过），包含前后切歌、边界、点击不误导航、44px区域、横竖屏/窄视口及原生iPad细指针。[822项播放/AutoMix/媒体桥回归](ipados-validation/track-switch-tests.log)、[typecheck](ipados-validation/track-switch-typecheck.log)、[Web/PWA](ipados-validation/track-switch-web-build.log)、[sync](ipados-validation/track-switch-ios-sync.log)、[arm64无签名构建](ipados-validation/track-switch-ios-build.log)通过。实际组件+合成队列，不代表真实账号、播放、转场听感或后台已在设备上验证。

## 最新：AutoMix 性能优化

已实现并验证（宿主）：相同Release配置与30秒合成PCM，基线3次/最终2次的分轨中位用时28.740→24.737秒（约缩短14%），STFT约74%、同工作量8声道iSTFT约65%；数值对照原版Python SNR99.47dB。详见 [完整性能记录](ipados-performance.md) 和 [逐次数据/源码SHA](ipados-validation/automix-performance.json)。RSS区间重叠，未证明稳定下降；禁止套用为iPad结论。

[968项JS回归](ipados-validation/automix-performance-tests.log)、[原生DSP/存储/输出释放](ipados-validation/automix-performance-native-tests.log)、[typecheck](ipados-validation/automix-performance-typecheck.log)、[Web/PWA](ipados-validation/automix-performance-web-build.log)、[iOS sync](ipados-validation/automix-performance-ios-sync.log)、[arm64无签名编译](ipados-validation/automix-performance-ios-build.log)通过。[Mac WebKit实际结果适配器](ipados-validation/automix-performance-webkit.json)验证30秒/6声道共享缓冲、旧结果不失效、检查期间7次动画帧回调；仅使用本机合成文件响应，没有设备模型或个人音频。

已实现待真机验证：所有完整视觉同时运行时的耗时、FPS、峰值/释放后内存、热/功耗与连续混音。此前后台播放和播放启动修复状态不因本次性能优化改变。模型仍由用户安装；原模型/采样率/分析窗/混音算法、动画和效果参数保留。

## 最新：原版 AutoMix 与本机模型

使用原 Beat This!、HTDemucs-v2 权重及原 planner/session/graph。官方 ORT 1.24.2 Apple XCFramework 仅运行模型，Swift/Accelerate 对应原 NumPy 的归一化频谱/逆频谱和三角窗拼接；单一双 deck 音频链路继续承担实际播放、EQ/音效/分轨/可视化。模型不随源码或IPA预置，在设置 → 播放 → 智能过渡中显式下载或从“文件”导入，不需要服务器、不上传音频。详见 [AutoMix 指南](ipados-automix.md)。

| 验证 | 实际结果 | 证据 |
|---|---|---|
| 原模型完整性与来源 | 两个原 manifest 文件长度和 SHA-256 校验通过，MIT；SDK官方ZIP固定SHA-256；原生常量同步检查通过 | `shared/modelManifest.json`、`ios/FoliaAutomixRuntime/Package.swift`、`dev/ipados/automix/sync-manifest.py` |
| 原生DSP/运行时 | FFT往返、非法shape/非finite、真实Beat/Stem合成推理通过；新取消提前拒绝另行通过；没有读取个人音频 | [native](ipados-validation/automix-native-tests.log)、[cancel](ipados-validation/automix-cancel-tests.log) |
| 原版Python数值对照 | 44.1kHz双声道合成30秒；Beat logits完全一致；STFT最大误差4.55e-13；三分轨最大误差3.8643e-8，SNR99.49dB；覆盖多个172032样本片段及重叠拼接 | [数值JSON](ipados-validation/automix-parity.json)、[对照日志](ipados-validation/automix-parity.log) |
| 原生存储 | 实际App类测试：尺寸/hash拒绝、桌面runtime名称拒绝、正确权重安装/重启/删除、tensor边界/清理、系统根路径别名正常且job链接拒绝 | [storage](ipados-validation/automix-storage-tests.log) |
| JS回归 | 63文件965项通过，含原AutoMix规划/图/取消/时序、播放、iPad、prefetch及命令契约；新增12项原生tensor协议/串行/取消/后台/错误恢复 | [tests](ipados-validation/automix-tests.log) |
| macOS WebKit | 原设置UI，模拟原生模型下载/导入/删除与能力刷新，横竖屏；原 `connectAutomixDeck`/`scheduleCrossfade` +一个真实AudioContext/两个HTMLAudioElement，合成WAV在转场前/中/后均采到非零音频且增益正确结束；零页面异常、零外部请求。此项不使用真实iOS插件/模型，不代表iPad后台/听感 | [WebKit JSON](ipados-validation/automix-webkit.json)、[日志](ipados-validation/automix-webkit.log)、[横屏](ipados-validation/automix-models-landscape.png)、[竖屏](ipados-validation/automix-models-portrait.png) |
| 类型/Web/PWA/同步 | 类型检查通过；原Web/PWA构建通过；iOS前端构建和Capacitor sync通过 | [typecheck](ipados-validation/automix-typecheck.log)、[Web](ipados-validation/automix-web-build.log)、[sync](ipados-validation/automix-ios-sync.log) |
| iOS工程 | 实际App scheme、iphoneos26.5 SDK、generic iOS arm64无签名build成功；包含模型原生插件、runtime和MIT许可资源；未签名安装 | [构建](ipados-validation/automix-ios-build.log)、[schemes](ipados-validation/automix-xcode-list.log) |
| 资源代价 | Mac x86_64 Debug测试进程峰值RSS1,986,125,824 bytes（约1.85GiB），30秒真实模型测试约87.6秒；含测试/调试开销，**不是iPad耗时/峰值**。C API没有原版Python memory reuse开关，不把约483MB的桌面记录套用到此实现 | 原生测试日志；设备内存/热/功耗待测 |
| 审批/环境 | 曾因沙箱不能监听本机端口及写Xcode用户缓存而中断；第一次自动审批服务503未执行启动，后续审批恢复并完成实际测试/构建。探针亦修正了本机blob误拦截与音频初始采样时机后通过，不改应用音频行为以适应探针 | 最终结果采用上列成功日志 |
| 实体iPad | 新模型下载/文件导入、真实曲库策略/表现模式/听感、连续多曲、所有效果同时运行、后台/锁屏/蓝牙/中断/取消恢复、内存与jetsam均尚待新版设备验收；此前后台播放问题也未因此标为已修复 | **已实现待真机验证 / 等待用户配置模型** |

## 自定义 AI 接口与原版歌词主题分析

个人 AI 直连已实现：设置 → 连接与集成 → 自定义 AI 接口。支持 OpenAI Compatible URL/模型/Temperature/SSE、原版固定 Gemini、Keychain 保存个人 Key、endpoint 绑定、显式 hello 测试、清除与取消。无需部署 Folia API；可选后端保留。原版提示词/JSON schema、明暗主题、配色、wordColors、lyricsIcons 与用户动画强度路径保持一致。没有宣称原接口能生成任意 shader 或全部模式调参。详见 [AI 指南](ipados-ai.md)。

| 验证 | 实际结果 | 证据 |
|---|---|---|
| 逻辑/回归 | 16 文件 204 项通过，含 AI 引擎、SSE/推理协商、主题 schema/提示词源码一致性、分词、公开 service 路由、授权拒绝、取消、设置导航与命令契约 | [tests](ipados-validation/ai-direct-tests.log) |
| 原生配置/传输 | Mac Swift 编译运行，内存 store + URLProtocol 模拟；HTTPS、端点绑定、metadata 不含 Key、恢复/清除、Header 注入、响应脱敏、revision、取消、重定向和大小限制 | [Swift tests](ipados-validation/ai-direct-swift-tests.log) |
| 设置/前端真实运行时 | macOS Playwright WebKit、模拟 Capacitor 桥；加载/保存/输入框清空/hello/未保存禁测/清除、原主题生成 pipeline 模拟响应、横竖屏无横向溢出；无外部请求或 JS 错误 | [WebKit](ipados-validation/ai-direct-settings-webkit.json) |
| TypeScript | typecheck 通过 | [typecheck](ipados-validation/ai-direct-typecheck.log) |
| 原 Web/PWA | build 通过 | [Web](ipados-validation/ai-direct-web-build.log) |
| 本地 iOS 前端与插件 | build:ios + Capacitor sync 通过 | [sync](ipados-validation/ai-direct-ios-sync.log) |
| 完整原生工程 | 实际 scheme App，iOS26.5 SDK、arm64、无签名编译通过；不是只编译孤立 Swift 文件 | [build](ipados-validation/ai-direct-ios-build.log) |
| 本地资源 | dist/同步 public/编译 App 逐文件一致，无 server.url 或 iOS Service Worker | [bundle](ipados-validation/ai-direct-bundle.json) |
| 真实 Key/模型/设备 | 没有填写用户凭据、真实 AI 调用、付费、部署或上传歌词；Keychain 的真实设备生命周期和主题生成仍待用户配置后验证 | 已实现待真机验证 / 等待用户配置 |

**播放问题仍待更新后的实体 iPad 复验。** AI 模拟响应成功、WebKit 测试及无签名构建不能作为连续播放/后台/锁屏已成功的证据。上一节音频修复已随最新原生工程保留。

复现：`npm run test:unit -- test/unit/ipados/nativeAi.test.ts`、`node dev/ipados/ai/verify-core.mjs`；启动/复用 4173 上的 Vite 后执行 `node dev/ipados/ai/webkit-settings.mjs`。更新共享引擎时运行 `node dev/ipados/ai/sync-client.mjs`，CI/本地可用 `--check` 校验 ESM 镜像。主题提示词是原桌面函数快照，回归测试直接提取原函数/schema 比较，避免漂移。

## 最新：已取得真机事件，修正宿主与 WebKit 音频焦点冲突

已在用户开启网页检查器后读取 iPad Air 11-inch (M4)、iPadOS 27.0.1 的播放现场：播放键可点且命中正常；blob 音频 readyState=4、networkState=1、无媒体错误；播放后很快发生 pause / context interrupted / 重复宿主 audioInterruption began。设备 bootstrap 的 SHA256 与前次最新构建一致，排除了只安装旧资源这一分支。去标识记录见 [device evidence](ipados-validation/audio-session-ownership-device.json)。临时观察器已移除，没有读取账号、Cookie、Token、曲名、完整播放链接或本地文件。

代码中宿主 configureAudio 在播放前和 playing/PLAYING 更新后均 setActive(true)，同时把宿主的 interruption 直接送入 WebKit transport.pause。宿主会话与 WKWebView 的实际发声会话不是同一个对象；它们互相争抢焦点及暂停反馈与记录一致。本轮移除宿主 setActive，宿主仅配置 playback 类别/系统命令；playing 仅发布信息，不再次配置宿主；宿主中断仅作诊断，不驱动 WebKit 暂停/继续。真正的音频焦点和系统中断由实际发声的 WebKit 管理。保留网页 playback 类型、同一 Web Audio 图、EQ/全部效果/混音/分析器，以及显式锁屏命令和拔耳机暂停。

9 文件 118 项回归（含宿主 began 重复通知不暂停、ended 不擅自继续、playing 只发布信息、遥控/拔耳机/清理）通过；typecheck、Web/PWA、iOS sync、arm64 无签名编译通过。证据前缀 `audio-session-ownership-*`。这不是已经修好后台的真机结论：新原生代码必须在 Xcode 用原 Team/Bundle ID Run 覆盖安装后才能测。前台、真正电话/Siri/其他App中断及是否自动恢复、后台/锁屏/下一首长播均待新版真机复验；不能把宿主 shouldResume 当作 WebKit 播放意图，也不以反复强行 play 保活。

本轮资源核对：[bundle manifest](ipados-validation/audio-session-ownership-bundle.json)。dist 的1866个文件全部逐文件匹配同步目录和编译App；后两者均为1868个文件，额外两项仅为Capacitor生成的cordova.js/cordova_plugins.js。无远程server.url，无iOS Service Worker；arm64无签名产物。

## 最新：前台播放启动回归修复

用户更新后的反馈为“歌曲能显示，点播放一直转圈或无声”。因此前台实播也重新标为失败反馈/待最新修复复验。已消除iPad上context.resume和原生configureAudio的前置等待，自动播放先完成图连接并发起恢复，锁屏继续亦不等桥；没有绕开EQ/效果/混音图。桌面原等待逻辑保留。

| 检查 | 结果与范围 | 证据 |
|---|---|---|
| 回归 | 8文件115项通过；pending/rejected桥与context、暂停取消、首次/下一首同图、原图/淡入淡出/MediaSession及网易直连/routing | [tests](ipados-validation/playback-start-regression-tests.log) |
| 类型检查 | `npm run typecheck`通过 | [typecheck](ipados-validation/playback-start-regression-typecheck.log) |
| Web/PWA | 原构建通过 | [Web build](ipados-validation/playback-start-regression-web-build.log) |
| 本地iOS前端与Capacitor | build:ios + sync通过 | [sync](ipados-validation/playback-start-regression-ios-sync.log) |
| 原生设备编译 | scheme App、iphoneos、arm64无签名构建通过 | [build](ipados-validation/playback-start-regression-ios-build.log) |
| 本地资源一致性 | dist/public/编译App逐文件校验 | [bundle](ipados-validation/playback-start-regression-bundle.json) |
| 实体iPad | 只读设备信息为M4 iPad Air/iPadOS27.0.1；未取得故障JS音频状态，未执行新版签名安装/实播 | 前台、后台、下一首均待用户原标识Run后复验 |

以上pending情形可在单测中复现，但没有该设备日志证明唯一根因；这次测试通过不等于已在iPad上恢复声音。后续以此节及最新专项记录为准，下节保留前次结果。

## 后续真机反馈与后台修复（前次快照）

用户确认网易云新版已可用；接着复现**切其他App/锁屏立即停，回前台又可播**。后台当前状态是“真机失败后已修复，待更新复验”，不是已验证成功。具体依据与代码见 [后台专项](ipados-background-audio.md)。

| 检查 | 结果/证据 |
|---|---|
| 网页/宿主会话修复 | navigator.audioSession.type=playback；原生playback options清空非法allowAirPlay；同图恢复、用户暂停/中断保护 |
| 相关回归 | 5文件56项通过，含真实transport恢复顺序与原DSP图/淡入淡出；[日志](ipados-validation/background-audio-tests.log) |
| 类型检查 | 通过；[日志](ipados-validation/background-audio-typecheck.log) |
| 原Web/PWA | 本轮构建通过；[日志](ipados-validation/background-audio-web-build.log) |
| iOS前端同步 | 本轮build:ios/cap sync通过；[日志](ipados-validation/background-audio-ios-sync.log) |
| 原生arm64无签名 | 实际App scheme/iphoneos编译；[日志](ipados-validation/background-audio-ios-build.log) |
| 最新bundle | 本轮dist/sync public/编译App逐文件一致；[证据](ipados-validation/background-audio-bundle.json) |
| 实体复验 | **尚未完成**，需覆盖更新后测切后台、锁屏/控制中心、下一首、60分钟、EQ/音效与中断 |

以上测试不与网易156项或旧665项相加，不代表全部项目回归。原生音频引擎尚未实现，仍使用原完整Web Audio graph。

## 最新：网易云无部署直连

| 检查 | 结果/实际范围 | 证据 |
|---|---|---|
| 独立加密对照 | Swift EAPI/WEAPI/RSA/X25519/HMAC/GCM/XEAPI/gzip/form 与独立桌面Node oracle一致 | [crypto与native测试](ipados-validation/netease-direct-crypto.log) |
| native会话与请求边界 | 假store/HTTP测Cookie保存、恢复、退出、过期；QR单次重试、mutation不自动重发、端点/Watchman拒绝、并发prepare、HTTPS白名单及拒绝跳转；不读真实Keychain | 同上；`dev/ipados/netease/CoreTests.swift` |
| 上游真实匿名请求 | 同一Swift核心在Mac直接访问网易；QR/search/detail/lyric/audio均200，音频URL非空；匿名注册此次400但未阻断主请求。无账号/扫码确认、未下载音乐内容 | [脱敏live结果](ipados-validation/netease-direct-live.log) |
| 前端/契约回归 | 5文件156项；36个参数模块与安装的4.41.1原CJS对照、二维码PNG/轮询、8音质参数、错误envelope/512恢复、真实service直连路由、账号分区及原provider控制器 | [tests](ipados-validation/netease-direct-tests.log) |
| TypeScript | 最新typecheck通过 | [typecheck](ipados-validation/netease-direct-typecheck.log) |
| 原Web/PWA | 原构建入口通过；不影响原桌面/远程分支 | [Web](ipados-validation/netease-direct-web-build.log) |
| iOS前端与sync | build:ios与Capacitor同步通过，插件源码已注册 | [sync](ipados-validation/netease-direct-ios-sync.log) |
| iOS原生编译 | 新Swift插件已通过iphoneos/arm64 Debug无签名编译；同scheme App/SPM | [build](ipados-validation/netease-direct-ios-build.log) |
| 当前资源一致性 | dist/public/编译App资源逐文件hash与无远程server.url/SW检查 | [本次bundle](ipados-validation/netease-direct-bundle.json) |
| 真机仍待 | 用户用原Team/Bundle ID更新后扫码确认、Keychain重启、CDN实播/音效/可视化、后台与蓝牙 | [真机清单](ipados-device-checklist.md) |

明确未实现：Watchman v2歌单订阅与NCBL听歌上报；直连capability返回false。其他已映射账号写操作未用真实账号执行。QQ/酷狗/波点等仍是各自可选服务，不声称所有源均已设备直连。实现和数据流见 [专门文档](ipados-netease-direct.md)。

以下环境和665项证据属于首次移植快照，未将它们和本轮测试相加，也未重复完整旧回归。下文首次报告中“无签名/未执行”描述对应当时自动化范围；本机已有用户自行设置的签名，本次保留，源码ZIP仅清理导出副本。

## 首次移植：环境与实际命令

Node 24.19.0、npm 11.17.0、Xcode 26.5 (17F42)，iPhoneOS/iPhoneSimulator SDK26.5。已先检查工程、scheme和SDK；实际工程为 `ios/App/App.xcodeproj`，scheme `App`，SPM，不是 Pods workspace。用户已确认自行接受 Xcode 许可。

| 检查 | 结果/实际范围 | 证据 |
|---|---|---|
| 锁文件安装 | `npm ci --ignore-scripts --no-audit --no-fund` 初始安装1170 packages成功；随后固定添加 Capacitor8.5.3，锁文件更新 | 当前 package-lock.json；未下载Electron运行二进制 |
| TypeScript | `npm run typecheck` 通过；含native adapter/测试/录屏/模组入口 | [typecheck](ipados-validation/final-typecheck.log) |
| 原Web/PWA | `npm run build` 通过，PWA生成195 precache entries约14.6MiB | [Web build](ipados-validation/final-web-build.log) |
| iOS本地前端 | `npm run ios:sync` 内 `build:ios` / `cap sync ios` 均通过 | [iOS build+sync](ipados-validation/final-ios-sync.log) |
| iOS原生 | Debug、iphoneos、generic/platform=iOS、CODE_SIGNING_ALLOWED=NO，`BUILD SUCCEEDED` | [最新原生build](ipados-validation/final-ios-device-build.log) |
| bundle一致性 | dist中1864文件逐个SHA256匹配sync后public和编译App的public；额外只有Capacitor生成的cordova.js/cordova_plugins.js；无server.url，无生成PWA sw.js | [bundle证据](ipados-validation/bundle-verification.json) |
| 视觉清点 | 实际entry与声明列表一致，14歌词/6背景；参数定义、默认值、Tempera121shot均在inventory | [audit日志](ipados-validation/final-inventory.log)、[清单JSON](ipados-visual-inventory.json) |
| 视觉源码保留 | 对每模式目录文件与基线比对；唯一变化是Tempera图像ZIP保存控件，动画renderer未改；FluidBackground Safari/iOS修复未变 | [源码比对](ipados-source-preservation.json) |
| 最终相关回归 | **58文件/665测试通过** | [完整回归日志](ipados-validation/final-suite.log) |
| 最后补充检查 | native文本传输同意、模组文件grant/依赖、边界与命令契约等38项通过；包含于最终665项，不重复相加 | [补充测试](ipados-validation/final-additions-tests.log) |
| 波点可选网关 | operation白名单、origin拒绝/CORS、未登录session、加密落盘、重启恢复、退出通过；仅login_status/logout，未访问上游/账号 | [网关smoke](ipados-validation/bodian-gateway-smoke.log) |
| git diff格式 | `git diff --check` 通过 | 当前diff；没有自动提交 |
| macOS WebKit运行smoke | **失败于浏览器启动前**，LaunchServices/NSApplication注册导致Abort；没有打开页面或产生有效视觉截图 | [失败日志](ipados-validation/webkit-smoke.log) |
| 模拟器运行 | CoreSimulator/simdiskimaged服务在本自动化环境不可访问，未运行App | scheme检查和build日志中的环境诊断 |
| 实体iPad运行/签名/安装 | 首次自动化未执行；用户后来自行安装旧版并反馈要码失败，最新直连待更新 | 按self-build文档用户自行签名Run |
| 真实在线源账号/权限 | **未执行**；后续网易匿名协议请求见上节，仍无账号扫码确认 | 不把mock/transport单测当登录成功 |
| 性能/功耗/后台长播/蓝牙/导出音频 | **未执行**，无设备数字 | [真机清单](ipados-device-checklist.md) |
| Electron启动回归 | 未执行；Electron二进制未安装，桌面main/preload源码未删 | 原Web/PWA构建不等于Electron运行 |

最终相关回归覆盖：native HTTPS地址、provider凭据隔离、文件descriptor/扫描不读整库、模组包信任/版本/依赖/文件grant/权限、共享services无app-store依赖、播放transport、playbackGraph、MediaSession状态、本地曲库/封面/播放列表、QQ/酷狗/波点transport、NowPlaying/PlayerCap时钟、命令palette。它不覆盖所有项目测试，也不替代WKWebView与原生系统功能。

期间遇到的命令快照差异已人工核对，仅添加两个录屏命令；模组services依赖边界失败已通过store-free native bridge修正。最终回归为绿。日志中的jsdom无法解析CSS `@layer` 是测试DOM实现诊断，相关测试实际通过；不据此证明真机CSS显示。npm沿用上游`.npmrc`时提示未知onnxruntime-node-install配置，命令仍成功，未将它删除掩盖。

## 最新无签名设备构建

实际运行：

```bash
CLANG_MODULE_CACHE_PATH="$PWD/../../work/clang-cache" \
SWIFTPM_MODULECACHE_OVERRIDE="$PWD/../../work/clang-cache" \
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -configuration Debug -sdk iphoneos -destination generic/platform=iOS \
  -derivedDataPath ../../work/DerivedData \
  -clonedSourcePackagesDirPath ../../work/SourcePackages \
  -disableAutomaticPackageResolution CODE_SIGNING_ALLOWED=NO build
```

产物架构arm64，App已包含最新本地bundle。`CODE_SIGNING_ALLOWED=NO` 产物只用于编译验证，不能当已签名可安装App。用户安装用[安装文档](ipados-self-build.md)中的个人Team和真实iPad Run。

成功日志仍含CoreSimulator不可访问诊断，以及无AppIntents依赖导致metadata extraction skipped；本次是iphoneos设备编译，不依赖启动模拟器。原模板asset/storyboard的actool/ibtool在该环境会因模拟器服务不可用失败；工程改用公共的程序化SceneDelegate、字典启动屏和Folia loose PNG图标，不是裁剪视觉效果。

为了在嵌套自动化沙盒中解析SPM manifest，曾临时设置本机Xcode `IDEPackageSupportDisableManifestSandbox`；原来不存在，结束已删除恢复。仓库Git临时固定连接IP/protocol设置也已移除。两者不是工程安装要求，**不要在自己的Mac照搬全局安全设置**。没有关闭TLS或ATS。

SPM官方Capacitor8.5.3 artifacts按原Package校验：Capacitor ZIP SHA256 `9316f568444411d362dcb4d1946e7572d4aef5d690c122ff6f1cb8a44a920c9f`，Cordova ZIP `bdcd8eab2d62a077efd76c3c8b9629e65ae7043c1462289a1e55de9be19bbf1f`。缓存位于会话work，未放进Git改动。

## 当前交付状态（包含最新直连）

| 分类 | 本次结果 |
|---|---|
| 已实现并验证 | 网易云直连协议/匿名上游/加密/会话测试；统一能力层、HTTPS配置/校验、账号backend隔离、文件/模组逻辑的单测、原Web/PWA和iOS前端构建、Capacitor同步、Swift/arm64编译、当前本地资源匹配；验证仅到这些层级 |
| 已实现待真机验证 | 网易云扫码确认/保持/实播；全部14+6视觉入口及参数、原Web Audio效果/双deck、原生系统媒体桥/中断/route、文件副本导入/恢复/封面、前端模组host/设置/文件grant、系统分享导出、ReplayKit实时录屏、安全区/触摸/布局 |
| 等待用户配置 | 其他源/AI的可选HTTPS API、同步/外部联动地址（网易默认无需）；用户自行登录账号；Xcode个人签名；iPad型号/iPadOS与连接 |
| 尚未实现 | 网易Watchman订阅与NCBL报告；BeatThis/htdemucs的iOS推理、任意Node/native模组和桌面RPC、离线/透明视频和独立音频导出、桌面转码、本机Stage/OBS/歌词HTTP服务/原生多Scene、持久外部目录引用、原生模组签名校验；详见高级边界文档 |
| 平台不支持及理由 | 桌面托盘、任意动态壁纸宿主/跨App置顶/鼠标穿透、桌面Discord IPC、Linux DBus/MPRIS缺少iPadOS公共对应能力；不能推广为整个模组/导出/本地曲库“不支持” |

## 尚待用户提供或自行配置的信息

1. 网易默认设备直连，不需要部署地址。只有选择其他源/AI/代理或网易远程覆盖时才按需填写HTTPS地址。
2. 若使用，Navidrome、同步、NowPlaying/PlayerCap的可达HTTPS/WSS地址和服务版本。
3. iPad型号和iPadOS版本；在自己的Xcode选择Team、唯一Bundle ID并连接设备。**无需把Apple账号、密码、Team私钥、证书、音乐Token或服务端密钥发给Codex。**
4. 账号联调、部署/付费、远程分析等外部操作需按具体操作取得授权；本次没有执行这些操作。
