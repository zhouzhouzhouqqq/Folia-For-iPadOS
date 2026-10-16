# 网易云设备内直连：无需部署 API

更新：2026-10-16。此实现回应“像 Mac 一样安装后直接登录”的要求。默认网易云无需填写服务器地址，也不依赖 Mac 开机。其他源不因此自动具备同样的直连协议。

## 为什么 Mac 原来可以直接登录

桌面版 `electron/neteaseBackend.cjs` 在 Electron 的 Node 环境启动增强 API，前端通过 `getNeteasePort` 访问本机回环端口。用户看不到部署步骤，是因为请求适配器与 App 一同安装。iPadOS 不能直接运行该 Node/Electron 后端；此前 iPad 版本只接了远程 HTTPS transport，导致没有服务时二维码直接失败。

现在设备内实现同一请求协议所需的平台能力：现有 UI → Omni → neteaseProvider → netease.ts → 参数适配模块 → FoliaNetease Swift 插件 → 网易云 HTTPS。主界面、歌词、背景与播放 graph 都继续本地运行，没有第二套播放器。

## 实际实现范围

| 部分 | 实现与位置 | 当前边界 |
|---|---|---|
| 请求参数/响应 | `src/services/onlineMusic/neteaseDirect/vendor`：从安装的增强 API 4.41.1 提取36个无 Node 依赖模块；manifest 记录源 SHA256，保留 MIT 许可证 | 逐个与原 CJS 模块用相同输入/假请求比较；不是每个账号操作都已真实执行 |
| 四个单独适配入口 | `transport.ts`：二维码本地 PNG、扫码结果、播放 URL、NCBL 明确未实现错误 | 二维码失败分支沿用桌面修正；保留8种音质请求参数；音质可得性由上游权限决定 |
| 加密与编码 | `NeteaseCrypto.swift`：WEAPI双AES/RSA、EAPI、XEAPI X25519/HMAC/AES-GCM/内层AES、gzip/form | CryptoKit/CommonCrypto/Security/zlib 公共 API；没有打包 macOS 二进制或 Node |
| 启动/匿名会话 | `NeteaseBootstrap.swift`：交换密钥签名校验、缓存、匿名注册 | 上游匿名注册可返回400；保留警告但仍允许二维码/搜索请求。已遇到此情况且主要请求仍成功 |
| HTTPS | `NeteaseHTTP.swift`：ephemeral URLSession、限定4个网易 host、拒绝跳转，不共享系统 Cookie jar | 保持 TLS 验证/ATS；响应32MiB上限在 data 缓冲后检查，不是流式内存上限；音频CDN仍走原音频元素 |
| 登录保持 | `NeteaseState.swift`：每安装 Keychain 记录，AfterFirstUnlockThisDeviceOnly；保存设备ID、Cookie、交换密钥和会话 | 假 store 恢复/退出/过期已测；真实 Keychain/设备重启尚待真机。原 provider 页面仍存登录返回 Cookie，可信模组仍可读取页面数据 |
| 能力声明 | `neteaseProvider.ts`：默认可要码；直连下 playlistSubscription/playbackReports 返回false | 避免显示未实现的订阅动作及自动发送失败上报；桌面/主动选择远程保持原能力声明 |

上游公开协议常量属于客户端实现，不是用户密钥或服务端私密配置。用户 Cookie、设备交换密钥只在本安装会话和上游请求中使用；不会发送给开发者或默认第三方代理。没有上传本地音频/个人文件。

## 两项明确尚未实现

1. `/playlist/subscribe` 的 Watchman v2 checkToken：上游依赖 jsdom/远程设备 SDK，不能简单删掉令牌。Swift 原生层明确拒绝该操作，直连 capability 为 false。后续需在隔离 WebKit 环境评估真实 SDK、生命周期/数据访问及数值/接口契约，才可恢复能力。
2. `/scrobble/v1` 的 NCBL 听歌报告：上游使用二进制封包、压缩和签名。尚未写设备协议适配，直连 capability 为 false；没有偷换成别的 scrobble 接口。原播放队列、FM、分析器、音效不依赖新增第二播放器。

以上不代表 iPadOS 平台绝对不支持。其他已映射的账号/歌单操作仍需用户自行登录和实测，不能将参数对照测试当作真实写入通过。

## 验证与复现

```sh
node dev/ipados/netease/verify-core.mjs
npm run test:unit -- test/unit/ipados/neteaseDirect.test.ts test/unit/ipados/neteaseRouting.test.ts test/unit/ipados/providerStorage.test.ts test/unit/onlineMusic/neteaseProvider.test.ts test/unit/library/core/providerAccountController.test.ts
npm run typecheck
npm run ios:sync
```

`verify-core.mjs` 用独立的桌面 Node 加密实现检验确切 Swift 核心，并运行假 HTTP/native store 测试；无用户 Keychain 或账号。真上游探针需主动运行其输出的 `core-probe --live`，会从 Mac 向网易发起匿名密钥/要码/搜索/详情/歌词/播放链接请求，不下载音乐内容，不自动登录。

本次实测：5文件156项通过，类型检查通过；独立加密对照/native session测试通过。Mac上同一Swift核心的二维码key、搜索、详情、歌词、标准音质URL均返回200，取得非空音频URL；见 [脱敏上游结果](ipados-validation/netease-direct-live.log)。用户随后反馈更新后已可用，但没有逐项记录扫码/实播细节；后台立即停播已复现并在[后台专项](ipados-background-audio.md)修复待复验。协议探针不证明iPad音效/后台或账号写操作已通过。

iOS arm64无签名编译、原Web/PWA与最新资源同步记录见 [完整验证报告](ipados-test-report.md)。全部效果继续按 [视觉清单](ipados-visual-checklist.md) 和 [真机清单](ipados-device-checklist.md) 验收，没有本次设备帧率/功耗结论。

## 更新到 iPad

在原仓库运行 `npm run ios:sync`，打开 `ios/App/App.xcodeproj`，保留此前 Team/Bundle ID，选择原 iPad 按 ⌘R 覆盖安装。不要卸载来更新。网易云远程字段与构建变量 `VITE_NETEASE_API_BASE` 保持为空即可进入直连，不需要部署、注册托管平台或申请公共API。

如果曾主动填写远程服务，先从该服务退出账号，再清空网易云远程字段、保存重载；直连和远程页面凭据/缓存分别存储。运行时空值仍回退构建配置，因此也需确保没有构建时预填远程地址。远程模式只是可选兼容功能。
