# iPadOS 测试报告

## 2026-10-26：0.7.22 / build 6 当前工作树

源码固定对齐官方 `v0.7.22` / `1f6d0f468f5bc81b23a8b40ad7ca96ccd4b1ecbe`，保留现有 iOS 修改。没有连接实体设备，没有使用真实账号、AI key 或用户音乐做测试；没有发布 GitHub。以下区分断言、构建和运行时检查，不把它们合并为“全功能通过”。

### 构建与可复现日志

实际使用 Node 24.19.0、npm 11.17.0、Xcode 26.5 / iOS 26.5 SDK。已读取 App 工程实际 scheme：App、CapApp-SPM、FoliaAutomixRuntime。日志根目录（本机源码树外）：`/Users/macbookpro/Developer/Folia-Migration/upstream-0722/`。

| 检查 | 实际结果 | 证据 / 范围 |
|---|---|---|
| 依赖安装与锁文件 | 通过；增加原生协议 bundle 所需 esbuild/Noble 及上游测试缺少的 jsdom | npm-install.log / npm-tools.log / npm-jsdom.log；没有执行 audit fix --force；安装报告的 20 个依赖漏洞未在本轮全面治理 |
| TypeScript | 通过，交付前再次检查结果见日志 | typecheck-last.log、typecheck-delivery.log |
| API + Web/PWA | 通过；PWA 原路径保留，生成 precache 220 项 | web-build-final.log；存在大 chunk / 无效 dynamic import 提示，不视为设备性能结论 |
| iOS 本地 bundle + Capacitor sync | 通过；最终 manifest 采用实验值而非键名 | ios-sync-last.log；5803 modules，App/public 是本地资源，无远程 server.url、无 sw.js 注册 |
| 视觉注册表 | 通过：15 歌词、6 背景，无模式排除 | visual-audit-final.log / ipados-visual-inventory.json；含所有源码入口、tuning 观察和 121 Tempera shots |
| App arm64 Release 无签名 archive | **ARCHIVE SUCCEEDED** | xcode-archive-last.log；包含本轮 Swift AI/Provider 修改，SDK iphoneos26.5，版本 0.7.22 / 6，通用 Bundle ID；AppIntents 无依赖的 metadata extraction 提示不影响归档 |
| IPA 打包检查 | 通过：arm64、通用 Bundle ID、无个人 profile/Team 签名、CRC/可执行位、本地资源 | ipa-manifest.json；仅供自行签名安装，不能双击直接安装 |

### 单元与 Swift 检查（不重复累计为一个总数）

| 测试组 | 实际结果 | 范围 / 修复 |
|---|---|---|
| 初轮广范围：iOS、analysis、AutoMix、theme、visualizer、onlineMusic、settings、AI | 275 文件通过、4451 断言通过、8 断言失败、1 跳过，另有 suite/worker 错误；初次整组退出失败 | tests-first.log。7 个断言为 5 秒超时，另 1 个为平台名架构计数；AI form mock 缺 initReactI18next，部分 worker 在安装 jsdom 之前未启动。后续分别修复/复测，未把初轮写成全绿 |
| 花火全部测试 + Lumiere/Fume 穷举 + 酷狗协议 + AI form | **15 文件 / 182 项通过**，串行、单项上限 60 秒 | tests-heavy-final.log；保留全部断言和效果代码，未改全局测试超时或降低效果来通过 |
| 独立官方 0.7.22 快照比较 | **4 文件 / 76 项通过**，同样单项上限 60 秒 | tests-official-baseline.log；用于核对花火/Lumiere/AI form 基线，不将超时冒称上游视觉缺陷 |
| native AI/汽水 crypto/完整扫码协议/Keychain secrets | **4 文件 / 19 项通过** | tests-native-final.log；全合成 HTTP 和存储，不访问真实账号 |
| 更新后的 native AI（含模型目录和 Anthropic） | **13 项通过** | tests-native-ai-latest.log；固定 hello、原主题/分词、GET 模型目录、端点约束、取消和 Messages schema |
| iOS QQ musicu | **2 项通过** | tests-qq-form.log 中该文件通过；无 cookie HTTPS、429/Retry-After 保留。该日志里的 form mock 失败随后由 heavy-final 修复通过 |
| 原生模组包 / Folium 1.7 | **6 项通过** | tests-manifest-boundary-final.log 中 nativeMods 通过；真实 ZIP/声明验证，queue/EQ/stage/raw 等新声明可安装，Node main 仍拒绝 |
| Omni 架构 | **3 项通过** | tests-boundary-fixed.log；保留 guard，收缩已移除的 release 字段计数；native protocol 类型是有说明的桥接契约，manifest 从共享 JSON 读取 |
| 补充组：汽水、Folium、试听时钟、Bravais、模型桥、EQ 等 | **87 文件 / 1041 项通过**，另 1 个 worker 启动失败，整组退出失败 | tests-extra.log；失败文件 foliumGuard 没执行，不能算通过 |
| foliumGuard 单独重跑 | **8 项通过**（threads pool） | tests-guard-threads.log；forks pool 两次未响应的记录保留；没有删除权限断言 |
| Swift AI 配置/安全/传输 | **通过** | ai-swift-tests-pagination.log；HTTPS、密钥端点绑定、模型/分页 GET 白名单、Anthropic/Gemini、保存、鉴权、重定向拒绝、取消、响应上限；mock transport，不等于真实 Keychain/网络 |
| 生成镜像 | AI ESM 与官方纯协议源机械生成检查通过 | `node dev/ipados/ai/sync-client.mjs --check`；汽水 vendor 可由对应生成器再生，许可证齐全 |

### 本轮 WebKit 运行未通过完整验收

已运行更新后的 `dev/ipados/webkit-smoke.mjs`，使用 macOS Playwright WebKit、full 参数、合成音频、横竖屏/卸载。claddagh 成功挂载、旋转并观察到动态像素，无 pageerror。cadenza/classic/diorama/fume/hanabi 在页面加载超时，cappella 等待探针超时；该次未完成 27 个场景即终止。记录在 `webkit/webkit-smoke.json` 和 webkit-smoke.log。没有发现可用于归因的 pageerror，**尚不能区分开发服务器/自动化时序与应用问题，不能声明其它模式运行通过**。

AI WebKit 表单脚本已更新到新版 AiModelPicker 和 aiText 入口，但两次页面加载超时，未完成交互，日志 ai-webkit.log / ai-webkit-warm.log。单元及 Swift mock 的通过不替代浏览器表单/真实服务验收。诊断 server/浏览器已停止。后续先以新版本在 Xcode 真机运行或稳定的 probe 环境复验这些失败；此前 0.7.21 全模式结果仍仅是历史记录。

### 安装包与待验证

本机产物：`/Users/macbookpro/Developer/FoliaBuild/Folia-iPadOS-0.7.22-build6-unsigned.ipa`，19,299,896 bytes（约 18.4 MiB），SHA-256 `aaea1442be004a4c2406cd406caaa94e906155140bc0e91b863226f035ad829c`。App 版本 0.7.22，build 6，最低部署目标 15.6。此系统版本不是兼容性验收承诺。未覆盖旧 Preview 3 文件，也未自动上传。

真机未验：全部视觉和参数/分镜、长期切换资源释放、帧率/功耗/内存；网易/QQ/酷狗/汽水真实扫码、续期、完整/试听播放；后台/锁屏/控制中心/蓝牙/音频中断与 route change；AutoMix/智能动感的原生模型性能和三源/四源差异；本地文件/导出。用户需自行配置 AI 服务端点和 key。Spotify/YTM iOS bridge、DSD 解码/转码、Node-main/RPC、桌面离线/透明导出未实现，逐项见功能矩阵及 0.7.22 记录。

---

## 2026-10-19：开发预览 2 发布验证

## 2026-10-23：0.7.21 合入验证（历史结果）

本节是 0.7.21 历史结果；当前 0.7.22 结果见文件开头。源码基于官方 `33b25ff75252435a78006af45114fdf10e64727a`；设备暂时无法连接，未作真机验收。验证日志与截图保存在工作区 `work/upstream-0721-validation/`，没有放入源码或上传个人数据。

| 检查 | 本次结果及边界 |
| --- | --- |
| npm 依赖安装 | 成功，使用更新后的锁文件；未改动个人 checkout 的共享依赖 |
| TypeScript | `npm run typecheck` 通过 |
| Web/PWA | `npm run build` 通过，原 Web/PWA 路径保留 |
| iOS 本地资源 | `npm run ios:sync`（iOS build + Capacitor sync）通过，无远程首页，无 iOS Service Worker |
| 原生设备编译 | Xcode 26.5、App scheme、iphoneos arm64 Debug、`CODE_SIGNING_ALLOWED=NO`，BUILD SUCCEEDED；不证明真机后台播放 |
| 相关逻辑回归 | 272 文件共 3,672 项：首次 3,669 通过、1 跳过、2 失败；诊断 mock 补充后 27 项通过；Fume 排版项以单 worker 复测通过。没有把首次失败隐去，也未将定向复测算作再次全套通过 |
| 正式工作目录最终定向回归 | 4 文件、35 项通过，覆盖 native smart beat、QQ 登录诊断、Omni 架构与 Fume 排版；最后类型检查、iOS sync、App scheme arm64 Debug 构建再次通过 |
| 新原生智能动感桥 | 2 项通过：无 WebGPU 的原生 beat 路径、鼓声数据送回原版 overlap-add 与取消 |
| 系统媒体 WebKit 探针 | 横屏/手机竖屏 2 项通过：元数据、封面、seek、上一首/下一首只触发一次。未验证真实锁屏/控制中心 |
| 视觉清单 | 14 歌词 + 6 背景，121 个真实 Tempera 分镜 ID；校验 registry 与声明一致 |
| macOS WebKit 视觉 | 26 个场景均挂载并 resize/卸载。初次 25 项无 pageerror；URL 复测已无 pageerror/console error 且像素变化，修复测试框架注入并使用静态夹具，未放宽 iframe 沙盒；Still/部分 Nomand 截图可不变化，未据此改成动画或宣布全部动态参数通过 |
| 设备与账号 | 未连接；真实扫码、QQ 完整/试听音源、内存/帧率、后台/锁屏/蓝牙、中断、模型性能、导出均待验 |

当前未实现的新版功能是 Spotify 与 YouTube Music 的 iOS 登录/播放桥；原生模型与官方 GPU 权重的差异详见 [0.7.21 适配记录](ipados-upstream-0.7.21.md)。旧手机重载/后台无声故障也必须真机复验，不能据本次编译宣称已彻底解决。

---

以下为先前版本的历史报告，保留排查记录；其中“尚未实现 BeatThis/HTDemucs”及 WebKit 无法启动等描述不代表本次结果。


公开源码使用占位 Bundle ID `org.folia.personal`、无 Team ID，iOS 构建号提升至 2，桌面与 Docker 版本不变。对同一公开工作树实际执行 `npm run typecheck` 和 `npm run ios:sync` 均 exit 0；后者包含 iOS Vite build、资源复制与 Capacitor Swift Package 更新。项目结构检查确认 App scheme / Release / iphoneos26.5。

QQ／酷狗相关 11 文件、310 项测试最终全部通过，耗时 17.88 秒。首轮有 3 项测试在模块导入时达到 30 秒超时（同期 Vite transform 耗时超过 300 秒），保留失败日志；该文件单独复跑 54/54 通过，随后相同 11 文件全量复跑 310/310 通过，没有放宽 timeout 或修改测试。[最终测试](ipados-validation/preview2-tests-final.log)、[首轮记录](ipados-validation/preview2-tests.log)、[文件复跑](ipados-validation/preview2-tests-retry.log)、[类型检查](ipados-validation/preview2-typecheck.log)、[iOS 同步](ipados-validation/preview2-ios-sync.log)。

公开 Release archive 实际返回 `ARCHIVE SUCCEEDED`，arm64、构建号 2、IPA 18,642,560 字节；1,873 个前端文件与 dist / 同步 public / App 内容逐一 SHA-256 一致，无远程页面、iOS Service Worker 或 provisioning profile。最终 App Info.plist 的 MinimumOSVersion 为 15.6，已按产物修正安装说明；不能视为已测试所有 iPadOS 15.6+ 版本。唯一归档警告为未依赖 AppIntents.framework 而跳过其元数据提取。公开源码 3,535 文件个人签名标识／路径与凭据形态扫描为零。

发布包的实际归档与结构验证见 [发布记录](ipados-validation/release-package.json)。本次发布没有新增真实账号授权、实体 iPad 安装、第三方重签、后台长播或视觉性能验收结果，先前真机待办继续有效。

## 2026-10-18：Xcode 默认依赖目录修复验证

用户截图中的两个本地 package product 缺失已定位到 Xcode 的 GitHub 超时日志，并非本地源码丢失。官方二进制重新下载、默认 `xcodebuild -resolvePackageDependencies` exit 0、默认目录 `-list` exit 0 后，使用 scheme App / Debug / iphoneos26.5 / generic iOS / `CODE_SIGNING_ALLOWED=NO` 构建 exit 0、`BUILD SUCCEEDED`。此轮没有指定自定义 DerivedData 或 SourcePackages，覆盖了此前 CLI 独立缓存与 Xcode GUI 默认缓存的差异。两个包都参与构建，没有移除 AutoMix。

CLI 通过后用户仍反馈 GUI 报错。23:10 GUI 构建日志继续引用 22:37 旧的 GitHub 超时包图；确认无未保存修改，以 `saving yes` 正常关闭并重新打开原工程后，23:14 新 GUI 包图解析成功。23:16 直接通过 Xcode AppleScript 执行工作区 Build（选择已连接 iPad），Xcode 返回 `succeeded`、completed=true、0 errors、0 warnings；对应 GUI build 日志明确 `Build succeeded`，包含 CapApp-SPM / FoliaAutomixRuntime，缺包错误为 0。沿用既有本地签名完成构建，未改 Team/Bundle ID；未执行 Run、设备安装或真实扫码。

[去标识验证记录](ipados-validation/xcode-default-package-recovery.json)。设备安装、启动与真实扫码仍待用户在 Xcode Run 后验证；此次不将 GUI Build 成功等同于设备登录成功。原始本机日志保留在 Xcode 默认 DerivedData / 会话 work 目录，不发布含个人工程元数据的完整构建日志。

## 2026-10-18：QQ / 酷狗扫码登录设备直连验证

实现和使用方法见 [QQ/酷狗指南](ipados-qq-kugou-direct.md)。本轮实际执行：

| 检查 | 结果与范围 |
|---|---|
| `npm run typecheck` | 通过，tsc exit 0；[日志](ipados-validation/qq-kugou-typecheck.log) |
| 聚焦 unit 回归 | 11 文件、310 项通过（`--maxWorkers=1 --testTimeout=30000`）；含两 provider/transport/登录方式、存储分区、新原生 HTTP、会话、签名及直连路由；[日志](ipados-validation/qq-kugou-tests.log) |
| Swift 共享 HTTPS 核心编译 | `swiftc` 编译 `ProviderHTTP` + `ProviderSecurity` + 匿名 CLI 通过 |
| 真实匿名上游 CLI | QQ 设备初始化、key、PNG、MQTT等待801；酷狗key、PNG、等待1，均通过；QQ socket Origin使用 `capacitor://localhost`；不保存/打印 QR key 与凭据；[日志](ipados-validation/qq-kugou-anonymous.log) |
| 实际 Playwright WebKit 匿名测试 | 两家均取码/图片/等待成功；运行实际适配器并桥到同一 Swift HTTPS 核心；页面内存替身不写 Keychain；不是完整 Capacitor App 或实体 iPad；[日志](ipados-validation/qq-kugou-webkit.log) |
| 原 Web/PWA 构建 | `npm run build -- --outDir ../../work/qq-kugou-web-final-dist` exit 0；前端与 PWA `generateSW` 均完成，204 个预缓存条目，生成 `sw.js` / `workbox-dcde9eb3.js`；保留原有大 chunk / 静态与动态 import 共存提示；[日志](ipados-validation/qq-kugou-web-build.log) |
| Xcode 结构/SDK | `plutil -lint` 通过，实际 scheme `App`、SDK `iphoneos26.5`，SPM Capacitor 8.5.3 |
| iOS 前端 / Capacitor 同步 | 标准 `npm run ios:sync` exit 0，包含 QQ/酷狗两家直连 chunk；copy/update/Swift Package 更新通过；[日志](ipados-validation/qq-kugou-ios-sync.log)。先前隔离 iOS 输出也成功，最终已恢复标准 dist |
| 新原生代码及最终资源无签名设备构建 | `xcodebuild ... -sdk iphoneos26.5 -destination generic/platform=iOS CODE_SIGNING_ALLOWED=NO build` exit 0 / BUILD SUCCEEDED；包含三个 MusicProviders Swift 源文件和新版前端；[构建记录](ipados-validation/qq-kugou-ios-build.json) |
| 本地资源一致性 | iOS 输出、同步 public、编译 App 内 1,873 个源文件逐一 SHA256 相同；无远程 server.url、无 iOS Service Worker，桥日志关闭；[结果](ipados-validation/qq-kugou-bundle.json) |

聚焦测试完整命令：

```bash
npm run test:unit -- --maxWorkers=1 --testTimeout=30000 \
  test/unit/ipados/mobileProviderHttp.test.ts \
  test/unit/ipados/mobileProviderState.test.ts \
  test/unit/ipados/mobileKugouProtocol.test.ts \
  test/unit/ipados/mobileQqSessions.test.ts \
  test/unit/ipados/mobileProviderRouting.test.ts \
  test/unit/ipados/providerStorage.test.ts \
  test/unit/onlineMusic/qqTransport.test.ts \
  test/unit/onlineMusic/kugouTransport.test.ts \
  test/unit/onlineMusic/qqProvider.test.ts \
  test/unit/onlineMusic/kugouProvider.test.ts \
  test/unit/onlineMusic/qqLoginMethod.test.ts
```

真实账号确认、微信通道、歌单/会员/播放、原生 Keychain 冷启动和实体 iPad 运行均**待真机验证**；没有执行账号写入、外部部署或发布。历史报告下方的“其他源必须配置后端/未迁移 Keychain”不再适用于当前 QQ/酷狗默认设备直连，远程模式规则仍保留。

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
## 2026-10-22：构建 4 手机播放故障验证

本轮 34 项定向单测、两项真实 Mac WebKit 媒体横竖屏检查、ImageIO 解码检查、typecheck、iOS 前端、标准 Web/PWA、Capacitor sync、arm64 Debug build 与 Release archive 通过。个人 Debug build 4 已签名，但覆盖安装时 iPhone 13 Pro 从 available 变为 unavailable，CoreDevice 返回 peer unreachable，因此本轮真机结果仍未取得。原构建的 Jetsam 已确认 WebContent 约 1.5 GiB highwater；不要将 Mac 测试或新包生成当作解决真机重载/后台无声的证据。全部复现边界、代码与下一步见 [故障跟踪](ipados-phone-playback-reload.md)。


2026-10-23 最终产物补记：正式工作目录 App scheme 的 iphoneos arm64 Debug 与 Release 无签名构建均为 BUILD SUCCEEDED；Release IPA 已在源码目录外生成并通过 ZIP CRC/执行权限/arm64/无个人 Team/无 profile/无远程首页/无 iOS Service Worker 检查，SHA-256 随产物保存。该 IPA 必须自行签名后安装，未上传 GitHub，未安装真机，不能代表播放与视觉的最终验收。

## 2026-10-26：底栏收起 / 隐藏增量验证

- `npm run typecheck`：通过。
- `npm run test:unit -- test/unit/stores/playerBarPresentation.test.ts test/unit/command-palette/commandRegistryContract.test.ts test/unit/command-palette/commandRegistry.test.ts --maxWorkers=1 --pool=threads --testTimeout=60000`：3 文件 / 93 项通过。覆盖已有隐藏设置的恢复、定位取消回滚、手动隐藏不覆盖持久化偏好与命令注册/三语文案。命令顺序快照按新增三个动作更新。
- Mac WebKit 触屏上下文：390×844、844×390、1024×1366、507×768、320×568 均通过收起→紧凑播放按钮可点击→隐藏→恢复，恢复按钮全部位于窗口内，0 个 pageerror。证据：`/Users/macbookpro/Developer/Folia-Migration/upstream-0722/player-bar/webkit-isolated.json` 与同目录截图；此结果仅属于底栏组件，不代表全部视觉模式通过。
- 初轮混合布局探针在两个窄屏尺寸中因主页专属的搜索悬浮按钮遮挡而失败，原记录为同目录 `webkit.json`。源码核对搜索/账号控件属于曲库/首页；新增 `playerBarOnly=1` 探针参数按实际播放页排除它们后重测。未使用强制点击掩盖命中问题。
- 本轮未连接真机；待验证真实音乐连续播放期间收起/隐藏/恢复、系统媒体控制不受影响、带键盘/触控板的恢复入口、安全区、旋转和 Stage Manager。
- 本次仅更新源码与 Xcode 内置 Web 资源，不重新发布或覆盖旧 IPA；iOS sync 结果在下方补记。

资源同步补记：`npm run ios:sync` 退出码 0；iOS Vite 构建完成（9.93 秒），本地资源复制到 `ios/App/App/public`，Capacitor 插件同步成功。日志 `/tmp/folia-bar-ios-sync.log`。本轮没有修改 Swift、签名或版本号，也没有重新执行原生 archive；可直接用当前 Xcode 工程 Run 重新安装新界面。


## 2026-10-26：收起进度条样式修订

用户否定迷你播放器形态后，收起改回原动态 ProgressBar + 当前时间/总时长 + 展开箭头，删除歌名/播放按钮；展开栏删除独立标题行，收起/隐藏按钮并入歌名区域。细轨道保持原外观、range 输入命中区为 44px。

- typecheck 通过；presentation 状态与 command registry contract：2 文件 / 17 项通过。
- Impeccable 检测（FloatingPlayerControls / PlayerBarDisclosure）：无发现。
- 初次 WebKit 检查发现 seek 命中区不足，随后已改为 ProgressBar 内显式 `h-11`，不再依赖外围选择器覆盖。后续确认轮导航超时，诊断主动终止，完整流程未通过本轮浏览器验收。先前进度条以外的迷你播放器测试结果仅属于上一轮。
- 展开态截图位于源码外 `Folia-Migration/upstream-0722/player-bar-progress/`；未取得修改后全流程截图，不声称已验证全部横竖屏/分屏。待实体设备确认拖动进度、点击展开/隐藏/恢复、安全区与切歌保持。

本轮 `npm run ios:sync` 退出码 0：iOS 前端构建 37.01 秒，内置资源复制与 Capacitor 插件同步完成（日志 `/tmp/folia-progress-ios-sync.log`）。开发服务器与本轮浏览器诊断进程已停止；未重新打包 IPA，未发布 GitHub，未修改个人签名配置。


## 2026-10-26：Preview 4 发布包验证

以当前完整 0.7.22 迁移及收起进度条修改为发布范围；App 构建号递增为 7，标签 `ipados-0.7.22-preview.4`。实际 App scheme / Xcode 26.5 / iOS 26.5 SDK / arm64 Release archive 成功，命令明确关闭签名并覆盖通用 Bundle ID。日志位于源码外 `/tmp/folia-preview4-archive.log`。

IPA `Folia-iPadOS-0.7.22-preview.4-unsigned.ipa` 为 19,305,243 字节；SHA-256 `9cc26fada8a9fc3076650602824f1a4bbf657ee80fe51c5c429adc9cbe716a34`。已检查版本 0.7.22 / build 7、最低系统 15.6、arm64、ZIP CRC、执行权限、无个人 Team/签名描述文件、无远程首页、无 iOS Service Worker；归档中 1,898 个 Web 文件与最终 dist 逐个哈希一致。类型检查及相关专项结果沿用本报告明确记录，不宣称全量通过或实体设备已验收。源码提交去除个人签名；源工作目录保留个人配置。正式发布的源码 SHA 和附件信息写入 Release manifest。
