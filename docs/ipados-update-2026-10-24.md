# 2026-10-24 源码更新

本次更新将官方 Folia 0.7.21 合入结果与后续 iPadOS 修复、性能和界面修改一起发布到源码仓库。上游 tag 对应 `33b25ff75252435a78006af45114fdf10e64727a`，保留原作者署名、AGPL-3.0 许可证与 Marcusphotograph 修改制作署名。

## 变化

- 合入统一账号窗口、探索页、Bravais / Lattice 更新、繁体中文、新设置结构、QQ 3.3.3、Folium 1.6 和新版视觉代码。设备内登录、AI 接口、文件、模型及 AutoMix 桥继续保留。
- 优化共享背景 React 渲染边界和探索页滚动样式写入，减少歌词或页面状态变化引起的重复工作。
- 缓存莫奈频谱采样几何、复用缓冲与渐变；保留 72 个采样点、动态波形、原有响应公式和分辨率。隐藏时只暂停组件绘图，播放器与共享音频图保持运行。
- 修正可选帧率上限的调度余量，避免 120Hz 显示下的 90 FPS 配置退成约 60 次回调。默认仍不限制帧率。
- 触控播放面板标签按钮达到 44px，面板和设置窗口使用动态视口与安全区预算；桌面风格和视觉功能保留。
- 带入此前未发布的 iPhone 生命周期、系统封面和 QQ 播放兼容修改。真实账号、后台和连续播放仍需真机回归，源码合入不代表这些场景已经全部通过。

没有通过关闭复杂效果或静态替换来获得本轮性能收益。没有对实体 iPad 帧率、内存或功耗作出测试结论。

## 验证

| 检查 | 本轮结果 |
| --- | --- |
| 本地依赖安装 | `npm ci --ignore-scripts --no-audit --no-fund` 完成 |
| 类型检查 | `npm run typecheck` 通过 |
| 性能相关单测 | 4 个文件、30 项通过；不代表完整测试套件通过 |
| iOS Web 构建 | `npm run build:ios` 通过，5,674 个模块转换 |
| Capacitor 同步 | `npm run ios:sync` 通过，App 内置 Web 资源已更新 |
| 原生工程配置 | `Info.plist` 校验通过；本机有 iOS / Simulator 26.5 SDK |
| 本轮原生编译与 IPA | 后续 Preview 3 已完成 arm64 Release 无签名归档与 IPA 打包；此前依赖下载超时已恢复 |
| 真机性能、全部视觉与后台 | 待验证 |

源码中的 Xcode 工程使用通用 Bundle ID，不包含个人 Team ID。自行构建时在 Xcode 的 Signing & Capabilities 选择自己的 Team，并修改为自己的 Bundle ID。安装方法见 [自行构建文档](ipados-self-build.md)。

最初的源码提交没有替换旧 IPA。随后发布的 [Preview 3](ipados-preview3.md) 提供重新构建的 0.7.21 / build 5 IPA 和对应源码；Preview 1 / 2 的附件保持原版本。GitHub 的 Code → Download ZIP 可下载当前源码，源码安装仍需在 Mac 上自行构建签名。

## 已知差异

Spotify / YouTube Music 的 iOS 登录和播放桥尚未实现；保留其上游源码和 provider，不能把桌面实现的合入当作 iOS 已可用。智能动感沿用现有 iOS ONNX 桥，模型格式、输出及性能与桌面 WGSL 路径存在待验差异。详见 [0.7.21 适配记录](ipados-upstream-0.7.21.md)、[功能矩阵](ipados-feature-matrix.md)、[视觉检查清单](ipados-visual-checklist.md)和[性能记录](ipados-performance-ui.md)。
