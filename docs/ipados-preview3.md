# Folia iPadOS 0.7.21 · Preview 3

发布标签：`ipados-0.7.21-preview.3`。App 版本 `0.7.21`，构建号 `5`。此版本为供个人自行签名的开发预览，保留原作者、AGPL-3.0 与 Marcusphotograph 修改制作署名。

下载：[Preview 3](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases/tag/ipados-0.7.21-preview.3)。旧 Preview 1 / 2 保留，不覆盖或重新标记旧包。

## 相对 Preview 2

- 合入官方 0.7.21 的统一账号窗口、探索页、新设置分组、繁体中文、QQ 3.3.3、Folium 1.6 及新版歌词和背景实现。设备内网易云、QQ、酷狗桥继续保留。
- 加入共享背景渲染和探索页滚动优化，缓存莫奈频谱采样与渐变并复用缓冲；保留动态效果、原有公式、参数和分辨率。
- 修正可选帧率上限在高刷新率显示下的调度；默认仍不限制帧率。高刷新率能力由设备和系统决定。
- 触控播放面板标签按钮为 44px，设置窗口和面板按动态视口与安全区布局。
- 带入 iPhone 生命周期、系统封面及 QQ 播放兼容修改。账号、后台和连续播放仍需要实体设备回归，不能据本地构建判断这些问题已经完全解决。

## 构建与包内容

Release 使用实际 `App` scheme、iOS 26.5 SDK、arm64 设备目标，关闭代码签名，并覆盖为通用 Bundle ID `org.folia.personal`。不包含个人 Team ID、签名证书或 provisioning profile；安装者必须自行签名。

IPA 内置最新前端资源，使用 Capacitor 8.5.3 / WKWebView，保留 ONNX 原生运行库。AutoMix / 智能动感模型权重仍需用户在设置中主动下载或导入，不是内置了所有模型。

源码 ZIP 从发布提交直接导出。附件 `release-manifest.json` 记录完整源码 SHA、构建信息、校验结果与验证边界；`SHA256SUMS.txt` 用于校验 IPA、源码 ZIP 及 manifest。

## 本轮验证

前端类型检查和性能相关 4 文件 30 项单测已通过；iOS 前端重新构建和 Capacitor 同步通过。实际 `App` scheme 的 arm64 Release 无签名归档已成功（`ARCHIVE SUCCEEDED`）。IPA 打包脚本核对通用 Bundle ID、arm64、无个人签名/描述文件、App 内置资源及 ZIP CRC；完整哈希和资源核对结果见 `release-manifest.json`。

这不是完整测试套件或实体设备验收。所有视觉模式、实际帧率/内存/功耗、在线源账号、长时间前后台播放、锁屏/蓝牙/中断、AutoMix 双 deck、本地文件权限与导出仍按 [真机清单](ipados-device-checklist.md) 和 [视觉清单](ipados-visual-checklist.md) 逐项验证。

## 已知限制

Spotify / YouTube Music 的 iOS 登录及播放桥尚未实现，保留上游源码不能等同于设备可用。智能动感的现有 iOS ONNX 模型与上游 WGSL 路径存在格式和输出差异，性能及等价性仍待验。任意 Node/native 模组及部分桌面导出尚未完成；完整状态见 [功能矩阵](ipados-feature-matrix.md) 和 [0.7.21 合入记录](ipados-upstream-0.7.21.md)。

安装和更新请阅读 [下载包与自行签名](ipados-release-downloads.md) 及 [Xcode 自构建](ipados-self-build.md)。保留原 Team / Bundle ID 覆盖更新有助于保留原沙盒；不要仅为安装预览而先卸载现有 App。
