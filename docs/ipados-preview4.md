# Folia iPadOS 0.7.22 · Preview 4

发布标签：`ipados-0.7.22-preview.4`。App 版本 `0.7.22`，构建号 `7`。此版本为供个人自行签名的开发预览；保留原作者、AGPL-3.0 与「由 Marcusphotograph修改制作」署名。

下载：[Preview 4](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases/tag/ipados-0.7.22-preview.4)。此前 Preview 3 与更早附件保留。

## 相对 Preview 3

- 对齐官方 0.7.22 固定提交 `1f6d0f468f5bc81b23a8b40ad7ca96ccd4b1ecbe`：带入完整花火 Hanabi 歌词实现、随机歌词池、新版 AI 服务商/模型适配、QQ 修复、分析调度与 Folium 1.7；不以改版本号代替移植。视觉登记为 15 种歌词模式、6 种背景，保留原动态效果与参数。
- 自定义 AI 接入官方纯协议适配器与模型选择，补充 Anthropic 等服务处理；个人 Key 仍由设备 Keychain 保存，需用户自行配置服务与额度。
- 保留网易云、QQ、酷狗设备内登录；适配 QQ 数字歌曲详情、限流与试听偏移，带入汽水 0.2.2 的设备内协议。汽水真实扫码确认和播放未验收。
- 保留既有 iOS 统一音频图、EQ/音效/分析器、双 deck 与原生 AutoMix 模型桥；新分析缓存与现有 iOS 模型的边界已区分。
- 底栏新增收起、隐藏和恢复：收起后是当前时间、可拖动音乐进度条、总时长与展开箭头；展开栏按钮融入歌名行，无独立标题行；隐藏后仅留恢复箭头。细进度条的触摸命中区域增至 44px。命令面板可搜索展开/收起/隐藏底栏。
- 沿用 Preview 3 共享背景、莫奈频谱、渲染调度与触控适配，没有强制降低特效画质。

## 文件与安装

- `Folia-iPadOS-0.7.22-preview.4-unsigned.ipa`：arm64 设备版，最低 iOS / iPadOS 15.6，需每位安装者自行签名，不能下载后直接点开安装。
- `Folia-iPadOS-0.7.22-preview.4-source.zip`：与发布标签提交一致的完整源码与 Xcode 工程，不含依赖、模型权重或私人签名。
- `release-manifest.json`：源码提交、构建工具、验证结果和附件校验值。
- `SHA256SUMS.txt`：下载文件的 SHA-256。

Mac 用户可按 [自构建文档](ipados-self-build.md) 安装。更新时沿用自己的 Team 和 Bundle ID 覆盖安装，以保留原沙盒；不要先卸载原 App。

## 验证边界

类型检查、底栏状态/命令相关测试与 iOS 前端/Capacitor sync 已通过；官方 0.7.22 迁移专项结果详见 [测试报告](ipados-test-report.md) 与 [迁移记录](ipados-upstream-0.7.22.md)。本次新归档和 IPA 结构/资源校验以附件 manifest 为准。

底栏上一版迷你播放器曾通过 5 尺寸 WebKit 点击检查；本版按反馈改成音乐进度条后，首轮发现 seek 命中区过窄并已修正，确认轮遇导航超时。因此不将旧结果当成本版进度条的完整验收。全视觉 Mac WebKit 烟测也未完成，不能认为全部模式已验证。

真实设备的全部视觉模式、帧率/内存/功耗、扫码登录/账号保持、连续播放/后台/锁屏/蓝牙/中断、底栏拖动与旋转、AutoMix、本地文件权限和导出仍需按 [真机清单](ipados-device-checklist.md) 与 [视觉清单](ipados-visual-checklist.md) 验收。

Spotify / YouTube Music 的 iOS 登录/播放桥、DSD、任意 Node/native 模组与部分桌面离线/透明导出尚未实现。iOS ONNX 与桌面 WGSL 模型不是同一运行路径，设备性能和效果差异需实测。AutoMix 模型需用户主动下载或导入；不会静默上传本地音频。不保证绕过会员、版权、地区或平台风控。

基于 [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major)，社区 iPadOS 适配，非原作者官方 iPadOS 发行版。
