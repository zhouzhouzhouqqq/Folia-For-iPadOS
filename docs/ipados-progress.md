## 2026-10-19：开发预览 2 发布

用户已授权提交、推送到自己的仓库并发布 IPA。最新 iPadOS 代码同步至独立公开分支 `codex/ipados-preview-2`，保留仓库现有首页与上游署名；本机自用工作树的 Team／Bundle 和未提交修改保留。公开版构建号 2，包内资源，无个人签名。类型检查、iOS build/sync、310 项相关测试已通过，详情见测试报告；Release archive 与最终包结果见发布记录。公开更新说明见 [preview 2](ipados-release-preview-2.md)。GitHub 登录凭据不存入仓库；后续操作记录保留在会话 work 目录。

## 2026-10-18：Xcode 默认目录缺包修复

用户在 Xcode Run 时看到 `Missing package product 'CapApp-SPM'` / `'FoliaAutomixRuntime'`。实际打开的是本工作目录；本地包路径、产品和 project 引用完整。Xcode 原日志明确记录 GitHub 连接超时（`Failed to connect to github.com port 443`），导致包图失败；此前通过的是独立 work/SourcePackages 与 DerivedData，不能代替 GUI 默认目录验证。

已在默认目录执行 `xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App`，官方 Capacitor / Cordova 8.5.3 与 ONNX Runtime 1.24.2 二进制成功下载并解析，exit 0。随后实际 `-list` 确认 App / CapApp-SPM / FoliaAutomixRuntime schemes，未指定自定义 DerivedData / SourcePackages 的 arm64 / iphoneos26.5 / 无签名 build exit 0，`BUILD SUCCEEDED`。

用户再次反馈“还是这样”后，读取 23:10 的 GUI build 日志，发现仍引用 22:37 的同一个超时包图，没有重新解析。确认工作区无未保存修改后，以 `saving yes` 正常关闭并重新打开同一 `ios/App/App.xcodeproj`，保留已下载缓存。23:14 新 GUI Package 日志明确 `Resolving Package Graph Succeeded`；23:16 通过 Xcode AppleScript 对实际工作区执行 Build（选择已连接 iPad，未执行 Run），返回 `succeeded` / completed=true / 0 errors / 0 warnings，实际 GUI build 日志为 `Build succeeded`，两个包均参与。此次沿用本机现有签名完成签名构建，未更改个人 Team/Bundle ID，未安装或启动设备 App。未改包引用、SDK版本或功能。记录见 `docs/ipados-validation/xcode-default-package-recovery.json`；接下来用户可在 Xcode ⌘R 覆盖安装，真实扫码仍待设备验证。不要仅凭 CLI 成功认定 GUI 已恢复，也不要清空所有缓存。

## 2026-10-18：QQ / 酷狗设备直连扫码

用户要求添加 QQ 音乐和酷狗音乐扫码登录，继续遵守无需另部署 API 的 iPad 体验。实现位于本目录 `outputs/folia-major`，独立分支 `codex/ipados-self-use`；保留所有原有未提交修改，未提交/推送/发布，未更新 `outputs/github-publish`。

- 新增 `mobileDirect/{qq,kugou,http,state}`、固定上游可移植协议 vendor 和 `MusicProviders` 三个 Swift 文件；本地桥注册及 Xcode project 已接入。原 Omni/账号 UI/音频/视觉模式复用。
- QQ/酷狗 API base 为空默认设备直连；显式远程地址继续旧路由。QQ MQTT 通过 WebKit WebSocket；原生 URLSession 只做白名单 HTTPS，不引入 Node 或第二套播放器。
- 登录秘密存安装级 Keychain；页面仅账号提示。补齐退出迟到确认、401/403/152过期、429冷却、Cookie域/路径/跳转隔离及安全保存失败处理。
- TypeScript 检查通过；11 个文件 310 项相关测试通过；实际 Swift arm64 无签名编译通过（scheme App，iphoneos26.5）。标准 `npm run ios:sync`、最终 arm64 原生编译和 1,873 个资源文件 SHA256 核对均通过，结果见测试报告。
- 使用真实匿名上游：QQ 初始化/key/二维码/MQTT等待801、酷狗key/二维码/等待1，命令行及实际 Playwright WebKit 均通过。没有扫码确认、使用用户账号或写个人歌单。
- 真机扫码确认、微信 channel、真实 Keychain 持久化与音频/账号各能力仍待用户验收；不要把 Mac WebKit 验证称为实体 iPad 通过。
- 新文档 [QQ/酷狗设备直连](ipados-qq-kugou-direct.md)，已更新功能表、API部署说明、安装及真机清单。安装必须先 `npm run ios:sync` 再 Xcode ⌘R。

原 Web/PWA 构建也已 exit 0，前端及 `generateSW` 均完成（204 个预缓存条目）；隔离输出未覆盖最终 iOS dist。日志已保存到 `docs/ipados-validation/qq-kugou-web-build.log`。

后续：按真机清单验收真实账号和 Keychain/播放。不要重新克隆，也不要恢复旧的“QQ/酷狗必须部署后端”描述。

# Folia iPadOS 移植执行记录与继续工作入口

## 2026-10-16：系统按钮仍显示±10秒的后续修正

用户确认系统面板仍是跳秒按钮，上一版系统切歌UI不能算通过。已补齐iPad显式清除WebKit interval actions、音频成为当前会话后重绑track actions，以及主线程公开MPRemoteCommandCenter关闭skip/连续seek并启用已注册的next/previous。拖进度seekto保留，原生仅配置按钮类型、不新增WebKit命令target/metadata/音频focus。具体实现与最终验证见 [系统控件记录](ipados-system-controls.md)，证据前缀`system-track-buttons-*`。实体系统图标/事件仍待本轮原生工程Run覆盖复验；不重新部署或修改签名。

本轮51文件845项回归、typecheck、实际Mac WebKit组件测试、Web/PWA、iOS sync、App/iphoneos26.5/arm64无签名build及资源SHA验证通过；源码ZIP随后刷新。新Swift桥必须随原Team/Bundle ID Run覆盖，不能只重开旧App。

## 2026-10-16：系统切歌与曲目信息

用户报告控制中心/锁屏不能切歌且没有封面和名字。已修复 iPad 分支跳过 Web Media Session、改向静默宿主会话发信息/接命令的问题：实际 WebKit 播放会话统一拥有 metadata、timeline 与原 transport refs。宿主保留合法会话配置/route观察，只在 Web API 缺失时注册 fallback，不争抢焦点或重复命令。iPad封面转稳定data URL，旧资源异步返回/切歌清理受保护。完整音效图、双deck/AutoMix和全部视觉保留。

真实macOS WebKit上用合成WAV/封面和单一Web Audio图验证曲名/封面/上下首/seek/暂停继续通过；捕获已注册回调并从点击触发以提供用户交互上下文，不冒充实体系统命令。51文件841项回归、typecheck、Web/PWA、iOS sync、App/iphoneos26.5/arm64无签名build与资源SHA一致性检查通过，见 [系统控件记录](ipados-system-controls.md)。本轮USB检查不可用，锁屏/控制中心/耳机的设备事件仍待新原生版本Run覆盖验收。

## 2026-10-16：iPad 上一曲 / 下一曲入口

已修复触屏上播放条收起和箭头依赖hover：原生iPad（含接触控板）/Web触屏有曲目时常驻展开，曲名左右44px上一曲/下一曲，队列边界置灰。复用统一能力与原邻居解析/队列/AutoMix切换；未改音频引擎。真实鼠标悬浮预览与桌面收起保留，触摸不触发模拟鼠标预览。

验证与安装见 [播放控制记录](ipados-playback-controls.md)；48文件822项播放/AutoMix/媒体桥回归、typecheck、8项WebKit组件回归（原桌面6项+触屏2项）、Web/PWA、iOS sync与arm64无签名build通过。实体iPad实播/转场/蓝牙/后台仍需用本轮构建复验；保留原Team/Bundle ID用⌘R覆盖更新。源码ZIP同步刷新，未提交/推送。

## 2026-10-16：性能优化已实现并完成宿主验证

已优化 AutoMix 的 ORT 输出生命周期（借用而非重复大块复制）、双层 reflect 索引缓存、Accelerate STFT/iSTFT 与三角窗拼接、仅重建 JS 实际消费的6声道、对齐tensor文件读取、前端不重叠视图与按8ms预算让出主线程的结果检查。取消/切后台后拒绝过期结果；显式关闭ORT线程空转。原模型/精度/30秒窗/所有歌词与背景/音效/四策略均保留，未改音频会话。

同机Release、30秒合成PCM：基线3次/最终2次，分轨中位28.740→24.737秒（用时约减14%），STFT约减74%、8声道iSTFT约减65%；宿主RSS范围仍重叠且接近2GiB，不能声称整体内存问题已解决。原版Python对照SNR99.47dB，63文件968项JS回归、原生存储/DSP/输出释放测试、typecheck、Web/PWA、iOS sync和arm64无签名build通过。实际macOS WebKit合成30秒结果共享一个31,752,000-byte缓冲，避免同样大小的额外声道拷贝，检查期间可继续绘制，无外部请求。

继续从 [性能记录](ipados-performance.md) 与 `automix-performance-*` 证据开始；测试基线保存在会话work/AutomixPerfBaseline，不纳入发布源码，已记录前后source SHA。实体iPad完整特效下的FPS、内存、热/功耗、连续推理与取消恢复尚待测；之前后台播放仍待新版复验。不得将Mac微基准或Release切换当作iPad实测。公开源码ZIP随本轮刷新，保留本地签名，未提交/推送。

## 2026-10-16：原版 AutoMix 模型运行层已接通

已完成：官方 ORT 1.24.2 Apple XCFramework Swift 包与 MIT 许可资源；原 Beat This! 权重/前后处理、HTDemucs FFT-cut 权重和 NumPy STFT/iSTFT 的 Swift/Accelerate 对应；统一 Capacitor/Electron 推理层；沙盒二进制 tensor 桥；模型下载进度/取消/镜像/长度与SHA校验/文件导入/删除/重启恢复；前后台协作取消及回前台重算。原双 deck、四转场策略、表现模式、EQ/回声/限幅、圆环与卡片动画和全部歌词/背景保留。入口为设置 → 播放 → 智能过渡 → iPad AutoMix 模型；不需要部署服务或上传音频。

验证：965 项相关 JS 回归、typecheck、原 Web/PWA、iOS sync、arm64无签名编译；原生 FFT/实际模型/存储测试通过；30秒合成PCM与未修改的桌面Python对照，beat输出一致、stem最大误差3.8643e-8（99.49dB SNR）；Mac WebKit原设置UI模型下载/导入/删除模拟桥、横竖屏、同一AudioContext的双媒体元素真实发声/原过渡增益通过，无外部请求。新增系统目录别名与job符号链接隔离测试通过。详见 `docs/ipados-automix.md`、`docs/ipados-test-report.md` 与 `automix-*` 证据。

必须保留的限制：尚未安装到实体iPad验证此轮AutoMix；原版Python专用的memory reuse开关不在官方C API中，当前Mac调试测试进程峰值1,986,125,824字节不能当作iPad数值。完整模型由用户选择下载，内存不足需优化runtime/缓冲；没有强制降低歌词效果。取消在ONNX段之间生效，正在执行的单段可能继续至返回。最新前台/后台音频修复仍待用户更新后的真机复验。模型安装、真实曲库/听感/连续播放/性能/后台均标为待真机，不能称全功能已验证。

继续会话时从此节和 AutoMix 指南接着做真机验证，不重写算法或重新克隆。权重与SDK只在 `work/` 缓存，源码包没有包含它们。未提交、未推送；保留本地Team/Bundle签名，公开ZIP导出时清除个人签名字段。

## 2026-10-16：原版自定义 AI 直连

已完成自定义 AI 设置、FoliaAI 原生插件、安装独立 Keychain 凭据、精确 endpoint/revision 绑定、可取消有界 HTTPS、原主题提示词/schema/解析及分词复用。无须部署 AI 后端，原可选后端模式保留。新增 `docs/ipados-ai.md`，功能表与自建指南已更新。

状态：204 项回归、Swift 模拟、WebKit 模拟桥与真实前端 pipeline、typecheck、Web/PWA、iOS sync、完整 arm64 无签名编译通过；无真实 Key、付费调用或歌词上传。需用户 Xcode ⌘R 更新后填写自己的 endpoint/model/key，在实体 iPad 验证主题、Keychain 重启恢复、错误与取消。此前播放/后台问题仍待最新音频修复的真机复验，不能因 AI 完成而关闭。

继续会话时从本节与 `ipados-test-report.md` 最新 AI 节开始，不回退到“必须先部署 AI API”的旧说明。原引擎来自 `shared/aiTextClient.cjs`，浏览器 ESM 由 `dev/ipados/ai/sync-client.mjs` 生成并有一致性测试，桌面 import 兼容。不要编辑根 README、覆盖本地签名或提交用户 Key。未提交、未推送。

更新：2026-10-16。目标仍是尽可能完整的个人iPadOS版，尤其完整歌词动画、背景、主题/参数和原Web Audio链路。本轮交付可构建工程与完整审计/安装文档，仍有明确未实现项；不能称“全部功能已保留”。

## 最新：已取得真机事件，修正宿主与 WebKit 音频焦点冲突

已在用户开启网页检查器后读取 iPad Air 11-inch (M4)、iPadOS 27.0.1 的播放现场：播放键可点且命中正常；blob 音频 readyState=4、networkState=1、无媒体错误；播放后很快发生 pause / context interrupted / 重复宿主 audioInterruption began。设备 bootstrap 的 SHA256 与前次最新构建一致，排除了只安装旧资源这一分支。去标识记录见 [device evidence](ipados-validation/audio-session-ownership-device.json)。临时观察器已移除，没有读取账号、Cookie、Token、曲名、完整播放链接或本地文件。

代码中宿主 configureAudio 在播放前和 playing/PLAYING 更新后均 setActive(true)，同时把宿主的 interruption 直接送入 WebKit transport.pause。宿主会话与 WKWebView 的实际发声会话不是同一个对象；它们互相争抢焦点及暂停反馈与记录一致。本轮移除宿主 setActive，宿主仅配置 playback 类别/系统命令；playing 仅发布信息，不再次配置宿主；宿主中断仅作诊断，不驱动 WebKit 暂停/继续。真正的音频焦点和系统中断由实际发声的 WebKit 管理。保留网页 playback 类型、同一 Web Audio 图、EQ/全部效果/混音/分析器，以及显式锁屏命令和拔耳机暂停。

9 文件 118 项回归（含宿主 began 重复通知不暂停、ended 不擅自继续、playing 只发布信息、遥控/拔耳机/清理）通过；typecheck、Web/PWA、iOS sync、arm64 无签名编译通过。证据前缀 `audio-session-ownership-*`。这不是已经修好后台的真机结论：新原生代码必须在 Xcode 用原 Team/Bundle ID Run 覆盖安装后才能测。前台、真正电话/Siri/其他App中断及是否自动恢复、后台/锁屏/下一首长播均待新版真机复验；不能把宿主 shouldResume 当作 WebKit 播放意图，也不以反复强行 play 保活。

## 前次修复记录：后台修复后前台歌曲转圈/无声（以下为当时结果）

用户明确歌曲列表可显示，点播放转圈/无声。当前不能再称前台已可用。已消除iPad transport对context.resume/native configureAudio的前置等待，在同一任务发起媒体play，接通源变化自动播放的图恢复；原图、DSP、暂停取消及桌面逻辑保留。8文件115项包含首次/下一首、pending/rejected会话与网易直连路由的回归通过。最新构建证据前缀`playback-start-regression-*`，详见[后台/启动专项记录](ipados-background-audio.md)。待用户用原Team/Bundle ID Run后先验证前台，再验后台。只读设备信息已获得M4 iPad Air/iPadOS27.0.1；没有有效故障JS状态，根因不能认定唯一，也没有自动签名/安装。

## 前次真机反馈：后台立即停播

用户已确认网易新版“好使了”；随后报告切其他App/锁屏立即停，返回又能播。应记录后台真机失败，不能仍笼统“未执行”。已修复网页 AudioSession playback 声明缺失，以及宿主 playback错误搭配allowAirPlay（SDK限定仅playAndRecord）。在同一Web Audio图接前台恢复/暂停与中断保护，未建立第二播放器/静音保活/减少视觉。见 [后台专项记录](ipados-background-audio.md)。5文件56项播放/图/会话回归及typecheck通过；最终Web/iOS sync/arm64构建见background-audio日志，用户需原标识Run复验切后台/锁屏/下一首/60分钟。若仍失败，先读iOS audio/AudioSession日志再决定native engine完整DSP兼容方案，不能直接dry AVPlayer。

## 已完成并获得用户可用反馈：网易云设备内直连

用户要求像Mac一样安装后直接登录，不部署API。已停止Vercel/共享服务器路线。36个4.41.1纯参数模块加4个明确适配接Swift公开加密/URLSession/安装级Keychain，无Node runtime/本地HTTP服务。网易远程字段为空即直连；无需Mac开机。没有修改歌词/背景/音效graph。

已通过5文件156项回归、typecheck、Swift独立Node加密对照和native session假HTTP测试；真匿名上游二维码key/搜索/详情/歌词/标准音质URL均200且URL非空。arm64无签名编译已通过；前端最终sync/build证据见test-report。用户已确认新版可用；细分账号/Keychain重启验收仍待记录。Watchman v2歌单订阅、NCBL上报尚未实现，direct capability返回false；其他源仍独立适配，不能声称全部源已直连。详见 [实现文档](ipados-netease-direct.md)。

此前“未配置网易API则不可用”和“必须部署”的提示已被本实现取代。用户已自行在Xcode签名安装过旧版；本机已有个人Team/Bundle ID，必须保留，不要重置。更新用原标识Run覆盖，不卸载。公开源码ZIP只在导出副本清理个人签名，必须在最新代码完成后刷新。

## 工作区与基线

- 项目：`outputs/folia-major`；上游 https://github.com/chthollyphile/folia-major。
- HEAD `35db05ccef6065e868fab14f49b433c8344e9ca1`，Folia0.7.19、AGPL-3.0；独立分支 `codex/ipados-self-use`。
- 最初工作目录为空，无原有用户修改。现有大量未提交实现必须保留；没有提交/推送。
- 已读根AGENTS、README/CODEMAP及相关skills：导航、README引用、测试、模块化、动画guardrails、工具复用、设置接入、Omni路由；另用write-swift。保留所有@note。
- Node24.19.0/npm11.17.0/Xcode26.5(17F42)/iOS26.5SDK。用户已确认接受Xcode许可，不要再询问。
- 依赖已安装，Capacitor固定8.5.3；不要重新下载模型、Electron或重克隆。原始`npm ci --ignore-scripts`；Electron运行二进制未安装。
- 网易默认无需API地址；用户已自行签名安装旧版，本机Team字段保留，未代用账号；已记录iPad Air 11-inch (M4)、iPadOS27.0.1。没有部署/账号操作/付费/上传音频。

## 阶段状态

| 阶段 | 当前实际结果 | 仍缺 |
|---|---|---|
| 1 审计/骨架/API | 已审计主要注册表、Electron/IPC、provider、音效/模型/导出/本地/模组；功能矩阵；本地资源Capacitor/SPM工程；统一HTTPS配置 | 网易真机扫码/实播；其他源可选服务配置 |
| 2 在线/完整视觉 | 保留14歌词/6背景、121Tempera分镜和全部原renderer；Fluid Safari修复未改；四源transport/可选波点gateway适配；原Web/PWA和iOS构建通过 | WKWebView/真机所有效果与参数；账号/API实际回归 |
| 3 系统音频/恢复 | AVAudioSession、NowPlaying/remote commands、中断/route接同一Web transport；不另起dry播放器；登录按backend隔离；原缓存保留 | 锁屏/后台长播、蓝牙/耳机/中断真机；缓存/OPFS容量与重启 |
| 4 本地/模组/导出/模型 | 原生副本导入/descriptor/封面；前端模组ZIP/信任/depends/设置/命令/文件grant；分享导出；ReplayKit实时动态录屏；原版两模型设备内ORT与数值对齐 | 两模型真机内存/听感/长播、Node/native模组、桌面离线/透明视频/音频导出和转码、本机Stage服务/多Scene、外部持久目录引用、模组签名验证 |
| 5 回归/安装 | 最终58文件665项回归通过；typecheck/Web-PWA/ios sync/arm64无签名build通过；bundle1864文件匹配；安装/部署/全视觉/真机清单和已知限制交付 | 实体iPad签名安装与完整验收；不能用编译成功代替 |

## 实现入口

- `src/platform/capabilities.ts`：官方Capacitor检测；`src/platform/ios`：设备contract、文件/封面、录屏、布局、AI文本传输确认。
- `ios/App/App`：FoliaBridgeViewController、FoliaDevicePlugin、FoliaRecording与Netease六文件；SceneDelegate必须用本地controller，不能替回通用Capacitor类而丢插件。
- `src/services/nativeConnections.ts`、`useNativeConnectionStore`、NativeConnectionsSettings：7类HTTPS配置，保存重载、前缀、旧字段补齐。
- provider仍经Omni；QQ native opaque token header；`providerStorage`按backend URL隔离凭据/缓存。
- `useNativeMediaSessionBridge`接原refs/显示deck；`usePlaybackTransportController`在桥await之前解锁AudioContext。
- `src/mods/ios`：portable manifest validator、host、files、store-free bridge/installHost、NativeModsSettings。注册从native bootstrap执行；共享services不得依赖app store。ModManager的native wrapper同时覆盖设置/命令palette。
- `deploy/ipados-bodian`：可选自托管Node网关，不是公共实例；本地smoke不访问上游。
- `src/services/fileDownload.ts`：保留原格式，native分块写+share；不要退回anchor-only并假装已保存。
- `dev/ipados`：inventory与macOS WebKit smoke；probe用了实际registry、本地合成数据；WebKit此环境启动失败。

## 验证证据与环境收尾

读 [实际报告](ipados-test-report.md) 和 `docs/ipados-validation`。有初期多轮构建，最终打包对应最新源码；无签名App位于会话work的DerivedData，不能安装到iPad。

CoreSimulator/LaunchServices在自动化环境不可启动；最初未测真实WebKit页面。最新已通过用户启用的真机检查器读取播放状态和中断事件，但未安装本轮修复，也未测模拟器运行或iPad性能。不要反复下载runtime来掩盖。原模板资源编译受该环境阻碍，当前采用程序化scene+字典launch screen+Folia loose PNG图标；没有关闭ATS/TLS。

曾临时设置Xcode manifest sandbox preference、Git固定连接IP/protocol以通过当前受限环境；**现已恢复/移除**，不属于工程默认配置。签名、证书、IPA、构建缓存未提交。原Web/PWA构建路径保持；Electron运行未验证。

## 后续会话顺序

1. 检查当前branch/status，保留现有修改；先看matrix、test-report和本文件，禁止重新克隆或覆盖。
2. 用户按self-build签名Run后收集iPad型号/系统与错误日志。先处理冷启动/音频/完整视觉的实际阻塞，不无依据降低画质。
3. 按device-checklist验锁屏长播、所有效果、内存/热/蓝牙/账号/文件/导出；每项实测才改状态。
4. 若Web Audio后台不持续，先对同一transport、所有DSP、双deck、analyser、恢复、离线导出设计兼容native engine，再实施。不能直接dry-player切换。
5. 模型原生ORT和预后处理数值对齐现已完成，详见顶部AutoMix节；下一步为实体iPad峰值内存、耗时、连续推理、取消恢复、热状态及听感验证。CoreML转换尚未实现。
6. 导出/Node模组按高级文档逐项原生桥接，不用静态视频或停止维护wrapper充数；任何可选远程个人数据任务先单独授权。
7. 网易默认直连无需地址；其他服务按需配置，账号由用户自行登录；不得索取密钥/账号Token放进前端。部署、发布、付费、使用账号或上传文件仍需具体授权。
8. 测试通过后只按新改动/新失败扩展回归；更新文档与证据。不自动commit/push。


## 2026-10-19：设置页适配署名

- 按用户要求，在 `src/components/modal/SettingsModal.tsx` 共有页脚加入固定文案「由 Marcusphotograph修改制作」，帮助与选项标签均显示，保留原作者信息。使用主题文本颜色、可换行布局，无动画或播放副作用。
- 已同步到个人构建仓库及公开源码准备仓库；两份工程 `npm run ios:sync` 与公开源码 `npm run typecheck` 通过。
- 本地 WebKit 浏览器检查通过：1024×768、768×1024、375×768 三种尺寸，帮助/选项共 6 项；截图与记录位于工作区 `work/settings-credit-*`。浏览器检查不等同于 iPad 实机安装验收。
- 用户已授权将署名更新作为构建 3 替换现有 `ipados-0.7.19-preview.2` 的附件；不移动历史 Git 标签。实际上传结果记录在工作区 `work/github-replace-preview2-result.json`，未产生该结果前不得声称已发布。
## 2026-10-22：手机竖屏重载 / 后台无声，构建 4

当前独立修复分支：`codex/iphone-playback-lifecycle`，未自动提交/推送。iPhone 13 Pro 的系统记录已确认 WebContent 约 1.5 GiB highwater 终止；具体分配来源仍待测。已实现系统媒体封面原生解码缩图、active 网页会话的后台同图恢复、仅 Debug 的有界资源计数。歌词/背景/AutoMix/音效均保留。34 项定向单测、两项 Mac WebKit 横竖屏切歌检查、类型、前端、同步与原生 Debug 构建通过。详见 [故障与验证跟踪](ipados-phone-playback-reload.md)，发布和真机状态以该文档后续记录为准，不把本轮标为全部修复。
## 2026-10-22：QQ 音乐登录后无法播放修复

用户反馈 QQ 扫码登录完成后歌曲能显示，但点击播放无声。审计确认 QQ 原生 `music_play` 返回的 vkey CDN 地址可能是 HTTP；原生 ProviderHTTP 的 HTTPS 升级只作用于协议请求，最终 `<audio>` 请求由 WKWebView 发起，因 ATS / 混合内容策略被阻止。已在统一 `toSafeRemoteUrl` 层仅对 QQ CDN 选择器允许的 `*.qqmusic.qq.com`、`*.tc.qq.com` 媒体域升级 HTTPS，保留 vkey 查询参数，并保持其它 QQ API、图片和 Electron 酷狗兼容逻辑不变。

定向 QQ provider / transport / 原生状态 / URL 归一化回归 4 个文件、153 项通过；`typecheck` 和 iOS build/sync 通过，`App` scheme / iOS SDK 26.5 已核实，arm64 Debug 无签名构建 `BUILD SUCCEEDED`。本轮代码尚未提交或推送。必须用最新资源覆盖安装到实体 iPad，复验 QQ 登录、播放、切歌、后台和系统控件；真机确认前状态为“已修复待真机验证”。


## 2026-10-23：官方 0.7.21 合入

已完成完整源码获取、三方冲突处理、设置/账号/分析桥迁移和本机基础构建。分支 codex/upstream-0.7.21，无提交/推送。详见 ipados-upstream-0.7.21.md；Spotify/YTM iOS bridge 未实现，不能声称全量平台支持。最新日志为 work/upstream-0721-validation/，真机未接入。本轮不得以旧版安装成功或锁屏成功推定新版通过。


## 2026-10-23 最终落地检查

已将完整 0.7.21 合并结果原子写回本公开 checkout，清理上游删除/重命名后的旧路径，保留用户原有未提交更改。依赖目录由临时安装迁回公开 checkout，解除原来指向个人 checkout 的共享软链接；未改个人签名工程。

正式目录 typecheck、iOS sync、4 文件 35 项定向回归、App scheme iphoneos arm64 Debug 无签名构建均通过；git diff --check 无错误，无冲突标记，无远程 WebView URL/iOS SW。修正 tsconfig 排除生成的 iOS public 资源，避免类型检查读取旧打包 JS。

视觉 26 场景均挂载；URL 单独复测已无错误并有动画像素变化，未放宽 iframe sandbox。清单使用 AST 提取 121 个真实 Tempera shot ID，避免注释中的引号污染。证据保存至 workspace 的 work/upstream-0721-validation。

仍需真机：所有视觉参数/分镜、三源账号和真实播放、连续切歌/后台/锁屏/中断/蓝牙、旧手机 WebContent 重载、智能动感/AutoMix 模型 CPU/内存、文件与导出。未实现 Spotify/YTM iOS 运行桥，不宣称全部移植完成。后续从 docs/ipados-upstream-0.7.21.md 的逐项差异继续；无需重新审计或覆盖本分支。


2026-10-23 最终产物补记：正式工作目录 App scheme 的 iphoneos arm64 Debug 与 Release 无签名构建均为 BUILD SUCCEEDED；Release IPA 已在源码目录外生成并通过 ZIP CRC/执行权限/arm64/无个人 Team/无 profile/无远程首页/无 iOS Service Worker 检查，SHA-256 随产物保存。该 IPA 必须自行签名后安装，未上传 GitHub，未安装真机，不能代表播放与视觉的最终验收。


## 2026-10-23 Xcode 工程入口纠正

用户反馈 Xcode 仍为 0.7.19。已实际读取 Xcode workspace/window 路径，确认此前打开的是 outputs/folia-major/ios/App/App.xcodeproj（旧签名工程），而更新后的源码在 outputs/github-publish/Folia-For-iPadOS。现已打开新版并关闭旧版窗口，保留旧工程与签名。xcodebuild -showBuildSettings 确认新版 MARKETING_VERSION=0.7.21；package.json 同为 0.7.21，Info.plist 从 MARKETING_VERSION 取值，iOS public 本地 bundle 存在。未覆盖个人 Team/Bundle ID；新版公开工程需要用户在 Signing & Capabilities 选择自己的签名。以后从本目录 ios/App/App.xcodeproj 打开，勿从旧 Recent 项目进入。

## 2026-10-24 Preview 3

源码 0.7.21 合入及性能/触控布局更新已发布到 main（0daaaf9）。后续 Preview 3 使用 0.7.21 / build 5，重新完成 iOS Web 构建、Capacitor sync 与 arm64 Release 无签名归档。分发使用通用 Bundle ID，个人签名设置仅留在本机。安装包、对应源码 ZIP、校验清单与 manifest 发布到 `ipados-0.7.21-preview.3`；详情与未完成项见 `docs/ipados-preview3.md`。实际帧率、全模式视觉、账号、后台/锁屏/蓝牙等仍待真机回归，不把归档成功解释为完整验收。

## 2026-10-26：官方 0.7.22 对齐（当前工作树）

工作目录 `/Users/macbookpro/Developer/Folia-For-iPadOS`，分支 `codex/upstream-0.7.22`，起点 `71b30d0`。不在 iCloud。开始时仅有个人签名修改，已备份至源码树外并原样保留。当前 package 和 Xcode 均为 0.7.22 / build 6；未提交/推送/发布，不能把 GitHub 上旧 Preview 3 当作此版本。

已取得并逐 blob 校验官方 `v0.7.22` / `1f6d0f468f5bc81b23a8b40ad7ca96ccd4b1ecbe` 完整树，按实际 692 个路径变化三方合并；16 处冲突已处理。合并脚本和 before/快照均在 `/Users/macbookpro/Developer/Folia-Migration/upstream-0722/`。不要再次执行 merge.py/resolve.py 覆盖之后的原生适配。

已接入花火完整效果、随机歌词池、AI 官方适配器与模型列表/Anthropic/Keychain、QQ numeric detail 原生 HTTPS 和限流、试听偏移、新分析调度/缓存、汽水 0.2.2 设备内协议、Folium 1.7 前端与 secure secrets。视觉清单为 15 歌词 / 6 背景；保留 Preview 3 性能/触控优化和原生音频/模型/账号桥。native manifest 改为直接读取共享 Folium JSON，避免权限/实验项漂移；实验项必须用 Object.values，权限用 Object.keys，已用真实模组包安装测试覆盖。

专项中 native AI/汽水完整模拟扫码签名/secret 19 项通过，新增模型目录及 Anthropic 后 AI 13 项通过，QQ musicu 2 项通过；花火等耗时专项 15 文件 / 182 项通过，官方独立快照同类 76 项也通过。初轮大范围运行的超时、缺少 jsdom/mock 和架构计数已分开定位，最终结果以测试报告为准，不将初次失败隐去或用旧结果代替新结果。

详见 `docs/ipados-upstream-0.7.22.md`、功能矩阵和测试报告。后续重点仍为真机登录/音频生命周期、全视觉与模型内存；Spotify/YTM iOS bridge、DSD 解码/转码、Node main/RPC、桌面离线/透明导出尚未实现。本轮没有请求账号、真实 key 或上传本地音频。

本轮收尾：Web/PWA、最终 iOS sync、App arm64 Release archive 均成功，已生成本地未签名 `Folia-iPadOS-0.7.22-build6-unsigned.ipa`（FoliaBuild 目录），版本与 bundle 实际核验。补充测试 87 文件/1041 项通过但 1 个 worker 启动失败；该 foliumGuard 随后 threads pool 的 8 项通过，Omni 计数已修复复测 3 项通过。初轮与重跑结果均保留，见最新版报告。

本轮 WebKit 烟测不算通过：只有 claddagh 已记录动态挂载，其余已试模式或 AI form 遇页面/探针超时，27 场景未完成；没有足够证据将原因归为应用或 harness。不要把历史 0.7.21 全模式通过写到此版本。诊断进程已停止；下一轮优先稳定 probe/真机验证花火和 AI UI，然后连续音频生命周期。不要重新合并官方源码、覆盖个人签名或上传当前个人工程设置。

### 2026-10-26：底部播放控制栏收起与隐藏

新增 `PlayerBarDisclosure` 与会话状态 `usePlayerBarPresentationStore`。展开栏右上角向下箭头收起，眼睛图标隐藏；收起后保留可拖动音乐进度条和时间，点击向上箭头展开。隐藏后底部只保留“显示控制栏”。恢复动作同时解除已有的控制栏隐藏开关，避免恢复后仍不可见；收起/隐藏会取消未完成的定位拖动并回滚，切歌/切视图不强制展开。命令面板可搜索展开底栏、收起底栏、隐藏底栏。不新增外观持久化字段，不触碰音频图、原生播放或特效参数。

typecheck 与 3 文件 / 93 项定向测试通过。Mac WebKit 的 390×844、844×390、1024×1366、507×768、320×568 五个尺寸通过真实点击的收起、播放键可点、隐藏、恢复和恢复按钮边界检查，无 pageerror。使用现有 `playerBottomBar` 探针的 `playerBarOnly=1` 排除仅首页才出现的控件；初次复用混合布局探针时两个窄屏场景被探针同时摆放的主页搜索按钮挡住，已保留原始失败记录，不能当作完整应用回归。证据在源码外 `Folia-Migration/upstream-0722/player-bar/`。实体触控、旋转、Stage Manager 和真实音乐播放未在本轮验证。iOS 资源同步最终结果见测试报告；旧 build 6 IPA 不包含本次改动，不应作为本次安装包发布。


### 2026-10-26：按用户反馈恢复收起进度条

用户明确要求收起后是音乐进度条，撤销上一轮的歌名/播放按钮迷你播放器。手动收起现在复用原 `CollapsedView` / `ProgressBar`：当前时间、可拖动进度、总时长和单个展开箭头；保留 Folium 的 progress 槽位与原 iOS seek 补偿。细条的 range 输入命中高度改为 44px，视觉轨道保持原尺寸。展开栏移除“播放控制”独立标题行，将收起与隐藏图标合入歌名行；隐藏恢复按钮仅显示向上箭头，保留完整无障碍标签。命令面板文案同步为“仅保留音乐进度条”。会话状态/音频/全部视觉模式均沿用已有实现。

本轮类型检查、2 文件 / 17 项定向测试通过。首轮探针识别到进度拖动命中区域过窄后已在 `ProgressBar` 修正；确认轮遭遇 WebKit 导航超时，已终止诊断进程，不能把前一轮 5 尺寸通过套用到新样式。展开态截图已取得；新版拖动/恢复全流程待真机确认。日志 `/tmp/folia-progress-types.log`、`/tmp/folia-progress-unit.log`、`/tmp/folia-progress-confirm.log`；iOS sync 结果见测试报告最新补记。


### Preview 4 发布准备

已按用户授权准备公开 0.7.22 Preview 4（build 7）：App arm64 无签名 Release archive 成功，IPA 版本/CRC/权限/无个人签名检查通过，1,898 个内置 Web 文件与 dist 哈希一致。新源码 ZIP 从 sanitized 发布提交直接生成；保留本地个人 Team/Bundle 配置。发布位置 `zhouzhouzhouqqq/Folia-For-iPadOS`，不覆盖历史 Preview 3。GitHub 插件确认账号/仓库可访问，但当前工具不含 Release/附件写入，CLI 未登录且 github.com 直连超时；上传完成前不要宣称已发布。继续时使用 `docs/ipados-preview4.md` 与源码外 `FoliaBuild/preview.4/` 材料，先核对远端状态。
