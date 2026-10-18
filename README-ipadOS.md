# Folia iPadOS 源码自签名版

下载入口：[开发预览 2](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases/tag/ipados-0.7.19-preview.2)。提供未签名 IPA、对应源码 ZIP 和 SHA-256 校验文件；安装者需自行签名。详见 [下载包说明](docs/ipados-release-downloads.md)。

本次新增 QQ 音乐／酷狗音乐设备直连扫码登录：对应远程 API 地址留空即可启用，无需部署 API。真实匿名取码及 WebKit 已验证，账号确认、重启保持和实播仍待 iPad 验收；见 [使用指南](docs/ipados-qq-kugou-direct.md)。

自定义 AI 已支持原版歌词主题分析，无需部署 Folia 后端。新增原生插件后需 Xcode ⌘R 覆盖安装；配置步骤与范围见 [iPad AI 指南](docs/ipados-ai.md)。

基于 [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) 0.7.19 的 iPadOS 适配，沿用上游 AGPL-3.0 许可证与署名。采用本地前端资源 + Capacitor/WKWebView + Swift 平台桥。保留原 Web/PWA/Electron 构建入口。

这是用于自行构建和验证的源码，不是已签名 IPA，也不是已完整验收的公开稳定版。当前全部歌词动画和背景代码保留；实际 iPad 上的效果、后台持续播放、蓝牙与系统中断仍需验收。AutoMix 原版两模型已接入设备内推理并通过合成音频对照，需用户下载模型与真机验收；任意 Node/native 模组、桌面离线/透明视频和独立音频导出等尚未实现，见功能矩阵。

AutoMix：设置 → 播放 → 智能过渡 → iPad AutoMix 模型，下载或导入 Beat This! 与 HTDemucs 后使用原版完整分析，无需部署服务。内存、真实曲库、连续混音和后台仍待设备验证，详见 [AutoMix 指南](docs/ipados-automix.md)。

## 安装

每位用户需要自己的 Mac、Xcode、Apple 签名身份和 iPad。免费 Personal Team 的有效期和能力以 Apple 实际限制为准；通常需要定期重新 Run 续签。不要共享签名私钥或登录别人账号。

```sh
npm ci --ignore-scripts
npm run typecheck
npm run ios:sync
npm run ios:open
```

在 Xcode 的 App target 中选择自己的 Team，将 Bundle Identifier 改成自己的唯一值，并同步修改 `capacitor.config.ts` 的 appId。连接实体 iPad、启用开发者模式后选择设备，按 Run。每次前端改动后先重新 ios:sync。

完整步骤与常见问题：[自构建指南](docs/ipados-self-build.md)。

## 在线音乐服务

**网易云默认内置设备直连：安装后直接扫码登录，无需部署 API，无需保持 Mac 开机。** 复用增强 API 4.41.1 的参数/响应适配，Swift 完成协议加密、HTTPS 和设备 Keychain 会话；没有嵌入 Node/Electron、没有公共代理服务器。原歌词/视觉和 Web Audio 链路保留。见 [直连实现与验证](docs/ipados-netease-direct.md)。

“设置 → 连接与集成 → iPad 服务连接”的网易云远程地址应留空。只有主动选用自己远程服务时才填写；构建配置 `VITE_NETEASE_API_BASE` 也要留空才能启用默认直连。旧安装需重新构建同步并用 Xcode Run 覆盖更新。

网易云真实扫码确认、重启保持、播放 CDN/CORS 与后台播放尚待 iPad 验收；歌单订阅 Watchman 与 NCBL 听歌上报尚未实现直连，当前 capability 明确关闭这两项操作，其余能力未因此删除。QQ/酷狗也已提供默认设备直连；波点、Navidrome、同步及用户主动选择的远程模式仍按 [可选服务配置](docs/ipados-api-deployment.md) 各自配置。AI 使用用户自己的接口，见 [AI 指南](docs/ipados-ai.md)。没有新增公共服务器或执行部署。

## 当前验证与限制

最新真机反馈为歌曲能显示，但点播放转圈或无声；前台实播与后台播放均待新版复验。本轮已修正播放启动等待 `AudioContext.resume()` / 原生会话响应可能卡住的路径，保留原 EQ、音效、双 deck 混音与分析器。115 项相关回归、类型检查、Web/PWA、iOS同步及 arm64 无签名构建通过；这些结果不等于设备播放已恢复。现有安装请保留 Team / Bundle ID，Xcode Run 覆盖更新，不需要卸载或重新部署网易 API。

- [完整功能矩阵](docs/ipados-feature-matrix.md)
- [实际测试报告](docs/ipados-test-report.md)
- [性能优化记录与真机待测项](docs/ipados-performance.md)
- [上一曲／下一曲与触屏播放控制](docs/ipados-playback-controls.md)
- [锁屏／控制中心切歌、封面与曲名](docs/ipados-system-controls.md)
- [14种歌词、6种背景和121个Tempera分镜清单](docs/ipados-visual-checklist.md)
- [真机检查表](docs/ipados-device-checklist.md)
- [继续开发记录](docs/ipados-progress.md)

公开此源码不等于可以将任意 IPA 直接安装到所有人的 iPad。每位用户自行签名；本项目不承诺兼容所有 iPad、最高画质稳定帧率或绕过在线源账号权限。
