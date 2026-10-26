# Folia-For-iPadOS
Folia 的 iPadOS 适配版，基于 Capacitor 与 WKWebView，保留原版歌词动画、动态背景、视觉主题和音效，支持网易云设备内直连、自定义 AI 歌词主题生成及 AutoMix。开源供个人构建、自行签名安装，持续完善中。
本项目基于 Folia Major，旨在将尽可能完整的 Folia 音乐与歌词视觉体验带到 iPad。
通过复用原有前端、歌词动画和音频处理代码，结合 Capacitor、WKWebView 与 Swift 原生桥接，适配 iPadOS 的播放、文件访问和系统交互能力。保留原版内置歌词动画、动态背景、视觉主题、均衡器与音效，并接入网易云设备内直连、自定义 AI 接口，以及使用原版模型和混音逻辑的设备内 AutoMix。
项目提供完整源码、Xcode 工程、功能适配矩阵和自行构建安装文档，无需上架 App Store，用户可在 Mac 上使用 Xcode 自行签名安装。
当前仍处于开发和真机验证阶段。后台连续播放、锁屏与控制中心、部分桌面扩展功能仍在完善，不代表已经完整兼容原版全部功能。具体实现状态与已知限制以仓库文档为准。
本项目为社区适配项目，非原作者官方 iPadOS 发行版，遵循上游 AGPL-3.0 许可证。


本工作树已合入官方 **0.7.22**（`1f6d0f4`）：新增花火歌词、随机歌词池、AI 服务商/模型选择、汽水音乐协议、新版分析调度与 Folium 1.7，合入 QQ、试听歌词时钟及探索墙修复。继续保留设备内登录、iOS 音频桥、原生模型、完整效果和既有性能优化。汽水真实扫码/播放、新版全模式及后台音频仍待设备验收；Spotify / YouTube Music 的 iOS 播放桥尚未实现。

- [0.7.22 适配记录与未完成项](docs/ipados-upstream-0.7.22.md)
- [功能矩阵](docs/ipados-feature-matrix.md) · [测试结果](docs/ipados-test-report.md)
- [全部视觉模式验收表](docs/ipados-visual-checklist.md)
- [Mac / Xcode 自行签名安装](docs/ipados-self-build.md)
- [性能和显示优化记录（含待验证项）](docs/ipados-performance-ui.md)

本次更新尚未经过实体设备验收，请勿把无签名编译成功当作后台播放、账号和所有视觉参数均已通过。

最新预览：[**0.7.22 · Preview 4（build 7）下载**](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases/tag/ipados-0.7.22-preview.4)，提供未签名 IPA、对应源码 ZIP、SHA-256 校验和构建清单。底栏可收起为音乐进度条、隐藏和恢复，未减少歌词动画或背景效果。具体内容与限制见 [Preview 4 发布说明](docs/ipados-preview4.md)。

2026-10-24 更新包含 0.7.21 合入、共享背景渲染与莫奈频谱优化、帧率限制调度修正、触控播放面板及设置窗口适配。[Preview 3 下载](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases/tag/ipados-0.7.21-preview.3)提供 **0.7.21 / build 5 未签名 IPA**、对应源码 ZIP 与校验文件。类型检查、相关 30 项单测、iOS Web 构建、Capacitor 同步与 arm64 Release 归档已通过；真机帧率和全模式验收仍待完成。详见[Preview 3 说明](docs/ipados-preview3.md)和[本次源码更新记录](docs/ipados-update-2026-10-24.md)。
