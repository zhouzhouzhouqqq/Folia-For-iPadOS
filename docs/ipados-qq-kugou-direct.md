# QQ 音乐 / 酷狗音乐：iPad 设备直连扫码

本轮在现有 Folia 账号、二维码弹窗和 Omni provider 上接入设备直连：iPad 的 QQ/酷狗 API 地址留空时，App 自己完成请求、签名、二维码和会话保持，**无需部署 API，也不需要 Mac 常开**。如果主动配置了远程 HTTPS 地址，则继续使用原远程模式。

## 安装与使用

这次新增了原生 `FoliaMusicProviders` 插件，必须更新 App，不能只刷新旧页面。

```bash
npm run typecheck
npm run ios:sync
npm run ios:open
```

在 Xcode 选择 scheme `App`、自己的签名 Team 和实际 iPad，按 ⌘R 覆盖安装。保持原 Bundle ID/Team 可保留本机数据。工程是 `ios/App/App.xcodeproj`，使用 SPM，无需 Pod workspace。详见 [安装指南](ipados-self-build.md)。

1. 如果之前配过远程 QQ/酷狗 API，在「设置 → 连接与集成 → iPad 服务连接」清空对应地址、保存重载。构建时的 `VITE_QQ_API_BASE` / `VITE_KUGOU_API_BASE` 也要为空，因为运行时空值会回退构建配置。
2. 返回首页，在连接音源区域或音源切换器中选择 QQ 音乐 / 酷狗音乐并登录。右侧账号页的未登录入口也会引导返回首页。
3. QQ 沿用原版登录方式选择（QQ / 微信，以上游声明为准）；酷狗显示酷狗二维码。用另一台设备对应的官方 App 扫码并自行确认。二维码失效时按重试重新取码。
4. 登录后验收头像、名字、歌单和播放；关闭重开 App 后验收恢复；退出后不应自动恢复。真实账号尚未由本次自动化测试确认，待用户真机验收。

## 实现与数据流

入口仍是原账号 controller → Omni → `qqProvider` / `kugouProvider` → transport。没有新增第二套账号 UI 或播放器，不修改原歌词、背景、音效和 AutoMix 链路。

| 层 | 代码与职责 |
|---|---|
| 平台选择 | `src/platform/capabilities.ts` 使用 Capacitor 官方检测；两家 transport 仅在 iOS 且对应 API base 为空时使用直连 |
| QQ 协议 | `src/services/onlineMusic/mobileDirect/qq.ts`；复用锁定的 qq-music-api 3.3.1 MIT QR service、端点、会话逻辑；替换 HTTP、设备/会话仓储和 MQTT socket |
| QQ 实时状态 | WebKit WebSocket → `wss://mu.y.qq.com`；复用原 MQTT 编解码/订阅/取消逻辑，先建立订阅再显示二维码；没有 Node runtime 或额外 MQTT 服务 |
| 酷狗协议 | `mobileDirect/kugou.ts`；复用 KuGouMusicApi 1.6.0 MIT 端点与签名；生成官方二维码登录 URL；20028 时按原协议注册设备重试，SSA 验证明确报错 |
| HTTPS | `mobileDirect/http.ts` → `src/platform/ios/musicProviders.ts` → `ios/App/App/MusicProviders/ProviderHTTP.swift`；只访问各自音乐厂商 HTTPS 白名单，不共用系统 Cookie jar |
| 凭据 | `mobileDirect/state.ts` / `ProviderSecurity.swift`；安装级 Keychain，`AfterFirstUnlockThisDeviceOnly`；QQ 保存设备/会话及 opaque bearer，酷狗保存 token/userid/dfid；页面存储仅留非秘密账号提示 |
| 隔离 | `providerStorage.ts` 为各源保留独立 `device-direct-v1` 分区，与远程 API URL 分区隔离；原 Web/PWA/Electron 路径保留 |

扫码与普通账号请求会直接发给腾讯/酷狗服务；QQ 建立厂商实时状态连接。KuGou 使用随机合成 GUID/MID，QQ 设备配置沿用上游生成逻辑，不读取 iPad 硬件序列号。没有新增第三方代理，不上传用户本地音频、文件或 AI 数据。本轮只做匿名取码，未使用用户账号。

原生桥限制 HTTPS/443、厂商域名、方法、响应大小、请求大小和超时；JS 管理域名/路径 Cookie 和有限跳转，跨 origin 移除显式凭据。HTTP Host 等传输头由 URLSession 生成。未关闭 TLS 校验或全局放开 ATS。Capacitor 日志关闭，错误不打印带 Token 的请求 URL。Keychain 写入失败会报错，不假报登录成功。

Keychain 隔离不等于把所有页面代码沙箱化：可信前端模组与 App 处于同一运行环境，仍可能调用桥或接触账号数据。远程模式继续原凭据规则，不属于本轮设备直连安全存储迁移范围。卸载 App 后新安装使用新的本地安装标识，不自动继承旧记录；更新时保持签名及 Bundle ID。

## 已验证及待验收

2026-10-18：两家真实匿名取码链路在 Mac 命令行原生 HTTPS 核心和 Playwright WebKit 中均通过。WebKit 测试运行实际打包的协议适配器，通过测试桥调用同一 Swift HTTP/域名校验实现；它没有在 iPad 内运行 Capacitor，也不测试实际 Keychain。

| 项目 | 状态 |
|---|---|
| 酷狗 key、PNG 二维码、等待扫码状态 1 | 已实现并验证：真实匿名上游、WebKit |
| QQ 设备初始化、key、PNG 二维码、MQTT 订阅、等待状态 801 | 已实现并验证：真实匿名上游、WebKit；命令行还检查 `capacitor://localhost` WebSocket Origin |
| 确认保存、重启恢复、退出、过期清理、退出中的迟到确认、直连/远程/Web 路由 | 已实现并验证：合成响应单测；不是账号验收 |
| TypeScript 与原生 arm64 插件编译 | 已验证；完整资源构建结果以 [测试报告](ipados-test-report.md) 为准 |
| QQ 微信 channel、真实账号扫码确认、iPad 原生桥/Keychain 重启、歌单与音频实播、会员/地区、写操作回读 | 已实现待真机验证；不声称全能力验收 |
| 原远程模式 | 保留；选择此模式时等待用户配置自己的服务 |
| 酷狗 SSA/厂商风险控制 | 未实现绕过；要求用户在官方 App 完成验证或等待恢复，不伪造成功 |

真实账号授权有效性、会员与版权仍由厂商决定。公开协议有变动的风险；登录成功也不代表所有音频链接可播放。无效链接、网络、过期和权限应按原 provider 错误处理。

## 维护与复测

可移植协议源码与许可证在 `src/services/onlineMusic/mobileDirect/vendor/`。生成器仅选择客户端端点，排除 Express/Node HTTP/runtime 和服务端 OAuth 私钥配置；不要把上游完整 `config.json` 打包到 App。前端有意保留原协议所需公共 app id/签名常量，不把它们当成用户私密配置。

```bash
# 依赖版本变动后重新生成，并重新进行协议对照/匿名测试。
node dev/ipados/vendor-mobile-providers.mjs

# 编译实际原生 HTTPS 核心为 Mac 匿名测试工具（不写 Keychain）。
swiftc -parse-as-library \
  ios/App/App/MusicProviders/ProviderHTTP.swift \
  ios/App/App/MusicProviders/ProviderSecurity.swift \
  dev/ipados/ProviderHTTPProbe.swift -o /tmp/folia-provider-http-probe
node dev/ipados/probe-mobile-providers.mjs /tmp/folia-provider-http-probe
# 可选浏览器匿名验证；先安装对应 Playwright WebKit。
npx playwright install webkit
node dev/ipados/probe-mobile-providers.mjs /tmp/folia-provider-http-probe --webkit
```

测试只输出 host、HTTP 状态、阶段和二维码是否存在，不输出 QR key/图片/Cookie/Token；不能将它改成静默扫描用户账号的测试。真机项目见 [设备验收清单](ipados-device-checklist.md)。
