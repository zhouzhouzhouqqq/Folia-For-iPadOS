# Folia iPadOS 个人自用构建、安装与续签

QQ 音乐和酷狗音乐已接入设备直连扫码登录，API 地址留空即可；使用方法与验收范围见 [QQ/酷狗登录指南](ipados-qq-kugou-direct.md)。新增 `FoliaMusicProviders` 插件后须先 `npm run ios:sync`，再在 Xcode 选择实体 iPad、按 ⌘R 覆盖安装；旧安装不会自动获得插件。

自定义 AI 已支持原版歌词主题分析，无需部署 Folia 后端。新增原生插件后需 Xcode ⌘R 覆盖安装；配置步骤与范围见 [iPad AI 指南](ipados-ai.md)。

本工程复用 Folia 0.7.19 的完整前端、内置视觉模式和 Web Audio 链路，以 Capacitor 8.5.3 打包本地资源。你需要在自己的 Xcode 中选择个人 Team 并运行到 iPad。**本仓库没有签名证书、个人 Team ID、已签名 IPA 或账号。无签名编译通过不是完整移植验收。**

先读 [当前功能状态](ipados-feature-matrix.md) 与 [实际验证报告](ipados-test-report.md)。当前后台连续播放尚未通过实体 iPad 验收；所有效果 WebKit 运行和设备性能未完成实体 iPad 验证；AutoMix 两模型已接通设备内推理并通过合成数据对照，需用户安装模型及真机验收，详见 [AutoMix 指南](ipados-automix.md)。任意 Node/native 模组和桌面离线/透明导出尚未完成。

AutoMix 新增独立 Swift 包 `ios/FoliaAutomixRuntime`。首次 Xcode 构建会从 Microsoft 官方下载带固定 SHA-256 的 ONNX Runtime 1.24.2 Apple SDK（约 50 MB 下载）；不需要 CocoaPods、桌面 Python 或 Node runtime。模型在 App 设置中另外下载/导入，不打进源码包。

## Mac 环境

本次实际使用 Node 24.19.0、npm 11.17.0、Xcode 26.5 (17F42)、iOS 26.5 SDK；项目级配置与运行库包含 iOS 15.0 基线，但当前 App target 的有效部署版本为 iOS 15.6；以 Xcode target 实际设置为准。该编译目标不代表相应 OS 的全部 API/codec/OPFS/效果均已验收。建议先用近期 iPadOS 真机，记录设备型号与系统版本。

安装完整 Xcode，首次打开完成组件安装。在 Xcode Settings → Locations 选择对应 Command Line Tools。你已在本次会话确认接受许可；以后更换 Xcode 可能需要本人重新阅读许可。不要在脚本里自动替用户接受条款。

在终端进入**本仓库目录**：

```bash
node --version
npm --version
xcodebuild -version
xcodebuild -showsdks
git status --short
```

保留当前 `codex/ipados-self-use` 分支的未提交修改，不执行 `git reset --hard`、清理未跟踪文件或重新克隆覆盖。不需要将 .dmg/.app 转成 .ipa，也不需要在 iPad 运行 Electron。

## 安装依赖与构建

已有依赖时可直接检查/构建。全新取出工程时用锁文件：

```bash
npm ci --ignore-scripts
npm run typecheck
npm run ios:audit
npm run ios:sync
```

`--ignore-scripts` 是本次 Web/iOS 构建方式，避免不必要的 Electron/桌面模型 runtime 安装；不是声称完整 Electron 开发环境也已安装。要运行原桌面版应另按原 README 安装其原生依赖。

`ios:sync` 先执行 `build:ios`，再 `cap sync ios`；生成 `dist`，复制到 `ios/App/App/public`，同步 SPM。**每次前端修改后都要 sync；仅 Xcode Run 不会自动重建前端。** 原生 Swift 修改由 Xcode 构建。

可选配置：

```bash
cp .env.ios.example .env.ios.local
# 网易云、QQ、酷狗各自 API 保持为空即使用内置直连，无需部署。
# 其他可选服务填写自己的 HTTPS 地址；也可在 App 设置。
npm run ios:sync
```

不要将服务器密钥或个人账号放进 `VITE_*`。网易云、QQ、酷狗默认直连不需要配置；仅其他服务或主动选择的远程覆盖需要地址。见 [设备内直连](ipados-netease-direct.md) 与 [可选服务配置](ipados-api-deployment.md)。没有附带公共代理实例。

原 Web/PWA 构建仍是：

```bash
npm run build
```

两个 build 会写同一个 `dist`，不要并行运行。Web build 后若要装 iPad，**再运行一次 `npm run ios:sync`**，保证 App 内是 iOS 模式资源。iOS 构建不启用 PWA Service Worker；App 主界面本地加载，在线音频/API 仍依赖网络。

## 打开实际 Xcode 工程

```bash
npm run ios:open
```

或打开 `ios/App/App.xcodeproj`。本工程是 **Swift Package Manager** 版本，实际 scheme 是 `App`，不是 CocoaPods workspace。依赖固定到 Capacitor 8.5.3；首次 Xcode 会通过 SPM 解析并获取官方框架。保持网络/TLS 正常，不要把本次构建缓存或下载的 macOS 程序复制进 iOS。

当前使用程序化 SceneDelegate 和 `FoliaBridgeViewController` 注册本地插件；启动屏用 Info.plist，图标为 Folia loose PNG。源模板 `Assets.xcassets`/storyboard 未加入构建资源阶段。这样也避开本次自动化环境无法连接 CoreSimulator 时 actool/ibtool 的失败；无需在你的 Mac 修改全局安全设置。不要改回普通 `CAPBridgeViewController` 而漏掉 `FoliaDevice` / `FoliaNetease` / `FoliaMusicProviders` 注册。

## 签名并安装到实体 iPad

1. 在 Xcode Settings → Accounts 添加你自己的 Apple ID。
2. 在工程导航选择 `App` project → `App` target → Signing & Capabilities。
3. 开启 Automatically manage signing，选择你的 Personal Team 或已有开发者 Team。不要把 Team ID 写死进共享配置。
4. 将 Bundle Identifier 改为你拥有的唯一值，例如你自己的反向域名。`org.folia.personal` 是工程占位标识，可能无法用于你的签名。
5. 为了以后 `cap sync` 保持标识一致，同时将根 `capacitor.config.ts` 的 `appId` 改成同一值，再运行 `npm run ios:sync`。已有安装更新时保持 Team/Bundle ID 一致。
6. 用数据线连接、解锁 iPad，允许“信任此电脑”。在 Xcode Window → Devices and Simulators 等待配对/支持文件准备完成。
7. iPadOS 16+：设置 → 隐私与安全性 → 开发者模式，开启并按系统提示重启确认；入口出现条件以系统与 Xcode 提示为准。
8. 在 Xcode 顶部选择实际 iPad 作为运行目的地，scheme `App`，按 Run。不要选择 “Any iOS Device” 后期待自动安装。
9. 若 iPad 提示未信任开发者，按设置 → 通用 → VPN 与设备管理中的实际开发者条目处理，再打开 App。
10. 启动后先检查本地界面、设置和模式列表，然后在首页连接 QQ/酷狗/网易云并自行扫码登录；这三源默认不填 API。仅其他源或主动远程覆盖需要填写 HTTPS 地址。使用 [真机清单](ipados-device-checklist.md) 逐项记录。

Background Modes 的 Audio 已在 Info.plist 声明，AVAudioSession/系统媒体命令也已接入；**不要据此判断锁屏长播一定成功**。WebKit 的 Web Audio 后台行为必须按真机清单实测。没有新增第二套原生播放器来掩盖音效缺失。

## 可重复的无签名构建

先检查工程和 scheme，再编译：

```bash
xcodebuild -list -project ios/App/App.xcodeproj
xcodebuild -showsdks
xcodebuild -project ios/App/App.xcodeproj \
  -scheme App -configuration Debug \
  -sdk iphoneos -destination 'generic/platform=iOS' \
  -derivedDataPath /tmp/folia-ios-derived \
  CODE_SIGNING_ALLOWED=NO build
```

此命令只验证代码/资源/链接，不签名、不安装。输出 `App.app` 也不能直接拖进 iPad 当成可用已签名 App。正常安装优先 Xcode 对实体设备 Run；个人侧载不要求先生成 IPA。

可做模拟器编译/运行，但音频路由、锁屏续播、功耗和帧率仍以实体 iPad 为准。本次自动化环境的 CoreSimulator/LaunchServices 无法启动，浏览器 WebKit smoke 在页面启动前失败；详见验证报告。该限制不是让你关闭 Mac 的沙盒或 TLS。

## 更新、续签与备份

前端更新后 `npm run ios:sync`，Xcode 同一 Team/Bundle ID 再 Run，通常覆盖安装保留沙盒。不要通过删除 App 更新，否则导入的本地音乐副本、账号状态和本地数据库会丢失。备份包不等于完整备份全部音频，应另保留原音乐/歌词文件与模组 ZIP。

免费 Personal Team 配置的开发签名通常约 7 天到期，并受安装数量/服务能力等限制；以 Xcode 和 iPad 的实际提示为准。到期重新连接并 Run 续签，保持标识一致。付费 Team 配置有效期与设备管理规则不同，本次没有购买、申请或代为使用账号。

若更换 Team/Bundle ID，系统可能视为新 App，不自动继承旧沙盒；先在旧安装导出配置/歌词/同步数据，保留原导入音频，准备重新导入。没有自动提交签名文件或证书。

## 常见问题

| 现象 | 检查/处理 |
|---|---|
| 白屏或旧界面 | 先 `npm run ios:sync`；确认 `public/index.html` 和 assets 已生成；使用本地 `dist`，capacitor.config 没有 server.url；查看 Xcode console |
| FoliaDevice not implemented | SceneDelegate 必须创建 FoliaBridgeViewController；本地插件由 capacitorDidLoad 注册；不要仅改 Web 侧 mock |
| SPM 下载失败 | 检查代理/GitHub 可达性、Xcode Package Resolution；保持证书校验；不要把临时固定 IP 写成长期配置 |
| Missing package product `CapApp-SPM` / `FoliaAutomixRuntime` | 先展开 Package Resolution 日志；本机曾因 GitHub 连接超时使整套包图失败，两个本地包并未缺失。网络恢复后在项目根目录运行 `xcodebuild -resolvePackageDependencies -project ios/App/App.xcodeproj -scheme App`，等成功后再 Run；界面仍保留旧错误可用 File → Packages → Resolve Package Versions。若新 build 仍引用旧超时日志，先保存所有编辑，再关闭工程窗口并重新打开 `ios/App/App.xcodeproj`，等待包图重载后以 ⌘B 验证。本机实际以重新打开工程恢复，GUI Build succeeded / 0 errors；无需清空下载缓存。独立 `-derivedDataPath` / `-clonedSourcePackagesDirPath` 的成功构建不代表 Xcode 默认目录或 GUI 内存状态也已恢复；不要先删包引用或清空所有缓存 |
| Signing/Provisioning 错误 | 选个人 Team、唯一 Bundle ID、正确设备/开发者模式，按 Xcode 的签名提示处理 |
| 歌曲可见但播放转圈/无声 | 真机已读到音频就绪但playing后立即pause/interrupted、重复宿主中断；最新修复移除宿主setActive抢焦点及宿主中断暂停反馈。必须先ios:sync并以原Team/Bundle ID Run覆盖（含Swift改动，仅刷新网页无效），勿卸载；先测首次播放、暂停继续和下一首，再测后台。若仍失败检查系统输出、音量和播放链接/会员限制，提供Xcode音频错误日志，勿发送Cookie/Token；见[专项记录](ipados-background-audio.md) |
| API 返回 HTML/404 | base/path 配置错误，尤其 `/api/api`、QQ 少 `/api/qq`；按实际后端路径填写 |
| 网易云立即登录错误/二维码不出现 | 先更新至设备直连版本：`npm run ios:sync` 后 Xcode Run；保留原 Team/Bundle ID。网易云远程字段与构建变量留空；检查 Xcode 中 FoliaNetease 注册、设备网络和错误详情，不必部署 API |
| 扫码后没有登录 | 二维码过期、服务端 session secret 不稳定、QQ channel 不支持、扫码 App 与方式不匹配；用另一设备扫描并看原错误提示 |
| 能搜歌但无法播/分析器为零 | Audio CDN 的 HTTPS/CORS/Range/codec 与 API 是两件事；HTTP 插件不代理 HTMLAudioElement；禁止用禁用 TLS/ATS 全放开“修复” |
| 锁屏后停播 | 已按用户真机复现补网页playback session、修正宿主AirPlay类别选项；先ios:sync和Xcode Run覆盖更新，见[后台专项](ipados-background-audio.md)。仍需复验；记录 iPad/系统、来源、EQ/音效/混音开关、停止时间与日志；不要偷偷改成无音效原生播放器 |
| 导入慢/无空间 | 是复制到 App 沙盒，iCloud 可能先下载；保留足够空间；大文件元数据读取内存仍需测；取消/失败后重新选择 |
| 外部文件改动没反映 | 当前是导入副本，需重新导入；未实现持久外部目录引用 |
| 模组启用后报错 | 查看模组面板原 client issue，检查纯前端入口/depends/宿主版本、资源 MIME；本宿主尚未验证签名；Node main 包会明确拒绝 |
| 导出后找不到文件 | 使用系统分享面板“存储到文件”；取消不等于已保存；ReplayKit 与桌面透明/离线导出不同 |
| 旧系统 OPFS/codec 差异 | 按真机日志定位；最低部署版本不是功能保证，不强制降低视觉画质 |

## 可继续开发的位置

先读 `docs/ipados-progress.md`，保留分支和所有未提交修改。`src/platform` 是原生能力边界，Swift 插件在 `ios/App/App`，provider 仍经 Omni。不要删除未适配桌面源码；功能状态与验证结果分别更新。未经验收不要把本工程称作“完整保留全部功能”。
