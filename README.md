# Folia-For-iPadOS
Folia 的 iPadOS 适配版，基于 Capacitor 与 WKWebView，保留原版歌词动画、动态背景、视觉主题和音效，支持网易云设备内直连、自定义 AI 歌词主题生成及 AutoMix。开源供个人构建、自行签名安装，持续完善中。
本项目基于 Folia Major，旨在将尽可能完整的 Folia 音乐与歌词视觉体验带到 iPad。
通过复用原有前端、歌词动画和音频处理代码，结合 Capacitor、WKWebView 与 Swift 原生桥接，适配 iPadOS 的播放、文件访问和系统交互能力。保留原版内置歌词动画、动态背景、视觉主题、均衡器与音效，并接入网易云设备内直连、自定义 AI 接口，以及使用原版模型和混音逻辑的设备内 AutoMix。
项目提供完整源码、Xcode 工程、功能适配矩阵和自行构建安装文档，无需上架 App Store，用户可在 Mac 上使用 Xcode 自行签名安装。
当前仍处于开发和真机验证阶段。后台连续播放、锁屏与控制中心、部分桌面扩展功能仍在完善，不代表已经完整兼容原版全部功能。具体实现状态与已知限制以仓库文档为准。
本项目为社区适配项目，非原作者官方 iPadOS 发行版，遵循上游 AGPL-3.0 许可证。


本工作树已合入官方 **0.7.21**（`33b25ff`）：统一账号窗口、探索、繁体中文、新设置结构、QQ 3.3.3、Folium 1.6 及新版视觉代码。智能动感接入现有 iOS ONNX 桥，模型和性能仍有待验差异；Spotify / YouTube Music 的 iOS 登录与播放桥尚未实现。

- [0.7.21 适配记录与未完成项](docs/ipados-upstream-0.7.21.md)
- [功能矩阵](docs/ipados-feature-matrix.md) · [测试结果](docs/ipados-test-report.md)
- [全部视觉模式验收表](docs/ipados-visual-checklist.md)
- [Mac / Xcode 自行签名安装](docs/ipados-self-build.md)
- [性能和显示优化记录（含待验证项）](docs/ipados-performance-ui.md)

本次更新尚未经过实体设备验收，请勿把无签名编译成功当作后台播放、账号和所有视觉参数均已通过。

2026-10-24 源码更新包含 0.7.21 合入、共享背景渲染与莫奈频谱优化、帧率限制调度修正、触控播放面板及设置窗口适配。当前源码已通过类型检查、相关 30 项单测、iOS Web 构建与 Capacitor 同步。本轮优化尚未生成新的 IPA，Releases 中已有安装包不包含本轮全部改动；真机帧率和全模式验收仍待完成。详见[本次源码更新记录](docs/ipados-update-2026-10-24.md)。
