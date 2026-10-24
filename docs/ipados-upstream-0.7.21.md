# Folia 0.7.21 合入与 iPadOS 适配记录

本次目标：合入官方稳定 tag `v0.7.21`，而不是用更新版本号代替移植。保留现有设备内登录、原生文件/模型桥、统一 Web Audio 图、后台与系统控件适配、AI 接口及 Marcusphotograph 署名。

## 来源与保护措施

- 官方发布：[0.7.21 Sabbat-of-the-witch Update](https://github.com/chthollyphile/folia-major/releases/tag/v0.7.21)。已读取实际 GitHub 发布说明。
- 官方 tag：`33b25ff75252435a78006af45114fdf10e64727a`。
- 原始 iPadOS 源码基线：`35db05ccef6065e868fab14f49b433c8344e9ca1`，版本 0.7.19。合并以这个实际基线为准，不能仅以 v0.7.19 标签推定相同代码。
- 本地改动起点：`c5d575a` 加尚未提交的 iPhone 生命周期、系统封面和 QQ 播放修复。
- 本次工作分支：`codex/upstream-0.7.21`。开始前已在源码树外保存 tracked binary patch、untracked tar 与状态清单；不清空现有修改。
- 本任务不提交、不推送、不发布、不登录账号、不上传用户音频或凭据。个人签名仍留在本机。

## 实施清单

| 官方改动 | 核查与 iPadOS 接入要求 | 当前状态 |
| --- | --- | --- |
| 统一账号窗口、切换/退出、错误与重试倒计时 | 保留 Omni 路由，接回现有网易/QQ/酷狗设备内 transport 和 Keychain | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| 首页探索、推荐/榜单/新歌/新碟、最近播放、再听一次 | 复用上游 UI、Omni 和资源模型；核对设备直连接口覆盖 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| Bravais 探索与 Lattice 海报墙 | 保留真实动态墙、动画、触控及资源生命周期 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| 智能动感：商籁/镜台节拍、时计鼓声、开关/强度 | 检查 WebGPU、权重 IO、推理/分轨桥及模型契约；不能以桌面条件直接删除 | 已审计；见下方差异 |
| QQ API 3.3.3、QQ 音乐 App 扫码 | 更新锁定依赖及设备内协议 bundle，保留现有凭据 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| QQ 云盘、会员、播放数、空歌单、试听回退 | 逐项对齐新 operation 和 Omni；保留 HTTPS 媒体修复及预取归一化 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| QQ Serverless 登录续期 | 区分可选服务端模式与默认设备内模式，不能把 30 天保证套到所有登录方式 | 已审计；见下方差异 |
| Spotify | 核查系统浏览器 OAuth、原生播放库与 iOS 支持；不伪造 Web API 播放能力 | 已审计；见下方差异 |
| YouTube Music | 核查匿名播放与登录对 Chromium profile/进程的依赖，评估公开 iOS 能力 | 已审计；见下方差异 |
| 繁体中文与四组设置、同步入口迁移 | 保留 AI、原生连接、模组、导出与署名在新设置结构中的可达性 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| 定位播放歌曲、鼠标闲置隐藏 | 触控/键盘/指针按能力接入，不隐藏可用动作 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| AutoMix 显示 deck、莫奈/遥控显示同步 | 保留双 deck 音频图和原生模型；检查视觉显示的歌曲身份 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| Folium 1.6 | 合入契约/运行时，检查 iOS 前端模组 bridge 与桌面 Node 模组边界 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| 单曲循环缓存修复 | 合入并跑缓存与播放相关回归 | 已合入；类型/相关单测/iOS 编译通过，待真机 |
| 壁纸/多显示器/透明窗口/Wayland/Windows/Linux ARM64 | 保留桌面源码与构建；原生 iPad UI 仅呈现实际可用能力 | 已合入桌面源码；iOS 不呈现桌面窗口控件 |

## 验证与后续

本次 0.7.21 已完成前端与 arm64 无签名构建，尚未安装到真机。下面列出本次验证；早期 0.7.19 的测试或安装结果不作为本次结果。

顺序：取得固定 tag 与基线 → 三方合并并审查冲突 → 设备内协议/模型适配 → 类型/相关测试 → Web/PWA 与 iOS sync → 实际 scheme/SDK 原生无签名构建 → 真机清单。设备暂时无法接 Mac，不阻止本地实现与构建；账号、真实播放、后台/锁屏与 GPU 性能仍需真机复验。

## 2026-10-23 本次实际结果

完整官方源码取自固定 commit 的 codeload tar.gz，已通过 gzip/tar 完整性检查。以 0.7.19 原始快照和 iPadOS 工作副本做三方合并：2,189 个路径自动处理，41 处冲突已逐项解决，4 个 fork 原本删除的桌面发布 workflow 保持删除。保留 fork README，官方 README 更新至 README-upstream.md。现有未提交修复与新增文件已带入，未修改个人签名 checkout，未提交或上传 GitHub。

### 已实现并在本机验证

- 新版统一登录/账号切换 UI、探索 UI/Omni、Bravais/Lattice、新设置四组和繁中、Folium 1.6、单曲缓存、AutoMix 显示歌曲同步随上游一起合入。
- 网易/QQ/酷狗仍默认使用设备内 transport，保留 Keychain 和原生 HTTPS 桥，不要求 Mac 或外部 API。网易 adapter 增补探索请求映射并保留退出登录映射；登录诊断报告区分设备内模式。
- QQ 3.3.3 重新生成浏览器协议 bundle，新增云盘/会员/建歌单/续期及探索/电台/搜索 operation；继续复用包内 QR 服务与 MQTT。普通界面继续经过 Omni。QQ HTTP CDN→HTTPS 与预取末端归一化修复保留。是否有完整音源仍由上游账号权限决定，试听回退使用原版规则。
- 原生 AI、连接、录屏入口迁到“连接与集成”；原生模型管理迁到“播放控制”；原生输出选取器、前端模组和 Marcusphotograph 署名恢复到新版设置。AI 客户端更新仍共用 shared 客户端及原版 prompt/schema。
- 没有裁剪任何注册歌词或背景模式，也没有强制低画质。重新生成的视觉清单为 14 种歌词、6 种背景；着色器/粒子/纹理及动感效果仍使用上游实现。
- 已完成 npm 安装、typecheck、Web/PWA build、iOS 前端 build、Capacitor sync、实际 App scheme 的 iphoneos Debug 无签名 xcodebuild。原生构建结果为 BUILD SUCCEEDED。测试详情见本次验证报告。

### 已实现待真机验证：智能动感与原生模型兼容

上游 0.7.21 的 GPU `.bin` 权重不能直接交给现有 ORT。保留新版 GPU/桌面 MNN 路径，新增独立 `shared/ipadosModelManifest.json`，明确使用 iOS 已支持的 Beat This! ONNX 与 HTDemucs v2 ONNX（SHA-256 与此前已安装版本一致）。Swift 生成器改读该清单，避免误生成 `.bin` 给 ORT。

iOS 的智能动感在设备内通过现有文件支持的串行原生推理桥取真实 beat logits 和鼓声；共用新版峰值提取、鼓点检测、动感时钟以及商籁/镜台/时计的所有动态渲染、开关和强度。没有建立第二个播放器。模型未安装会明确提示；分析中/取消/失败沿用上游状态。鼓声缓存另设 iOS ORT v2 前缀，防止与 WGSL 权重结果互用。

**体验差异与未验证事项**：HTDemucs v2 与上游 0.7.21 WGSL 导出的模型不同，鼓声/鼓点结果不能保证一致。原生 CPU 分析速度、内存峰值和前台动画干扰尚未在 iPad/iPhone 实测。上游的 GPU HPSS 能量输出不由当前原生 Beat This! 返回，现有频谱/节拍 accents 的兼容行为需真机比较。iOS 模型仍由用户在设置安装/导入，并非声称已随本包预装；后续需验证新的模型格式在 iOS GPU/MNN 的等价实现或迁移。没有替换任何动态画面为静态画面，也未对真机性能作保证。

### 尚未实现：Spotify 与 YouTube Music 的 iOS 运行桥

- Spotify：`electron/spotify/signIn.cjs` 使用 Node loopback HTTP 的 PKCE 回调；`electron/spotify/audio.cjs` 依赖 `@lox-audioserver/node-librespot`、解密流及 Electron 自定义媒体 scheme。iOS 没有对应播放桥。后续需独立验证可维护且许可兼容的原生运行库、OAuth client/redirect 条件及会员播放限制；若采用官方 SDK，还需核对其播放权限、依赖及对 EQ/分析/AutoMix 的影响。**并非判定平台永远不支持，而是本次尚未实现**。
- YouTube Music：`electron/ytm/browserSignIn.cjs`/`webSignIn.cjs` 启动并读本机 Chromium 独立 profile；iOS 无权读取另一个浏览器 App 的 profile。`electron/ytm/audio.cjs`/`ytmApiBridge.cjs` 使用 Node/youtubei.js、token/sandbox 与媒体 scheme。目前未实现设备内匿名请求、音源解析和独立 Web 登录 cookie 仓储。匿名能力与 Chromium 登录限制分别记录，不能把未实现说成无法移植。
- 保留两平台的上游源码和 provider。iOS availability 仍按实际桥缺失返回不可用，不显示可点击却永远失败的播放承诺。没有新增公共后端，也没有静默上传账号或本地文件。

### 平台差异

桌面托盘、鼠标穿透、桌面壁纸/多显示器窗口定位、Windows/Wayland/Linux 修复保留其原平台实现。iOS 使用现有单窗口、安全区、系统媒体和输出选取能力；不通过私有 API 模拟桌面窗口管理。QQ Serverless 最长 30 天续期仅适用于对应 sealed 后端，不能套到设备内 stored 会话。

### 仍待验收

所有 20 种模式在实体 iPad 的逐字/逐行、字幕/字体/遮罩/模糊/发光、全参数和旋转分屏；三平台真实扫码及退出/重启恢复；QQ 完整音源与试听；连续切歌/锁屏/后台/中断/蓝牙；AutoMix 双 deck、原生模型取消与内存；本地文件权限；录屏/导出；Folium 前端模组安装与运行。设备暂未连接，本次没有真机验收，也未发布新版 IPA。
