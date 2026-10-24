# 手机竖屏重载与后台无声：构建 4 跟踪

本文件记录 2026-10-22 的故障证据、修复范围与未完成验证。不能将构建成功理解为已经消除了所有手机上的重载或后台音频问题。

## 已确认的故障

用户反馈竖屏点击播放/切歌会重新加载页面，而非退出到主屏幕；另有后台无声但进度继续的反馈。实际取得的复现设备是 iPhone 13 Pro（iPhone14,2），iOS 27.2 beta / 24B5089g。其他手机的复现仍是用户反馈，尚无逐机日志。

2026-10-22 12:39:07 的系统 Jetsam 记录中，Folia 所属进程组的 WebContent 达到 **1536.125 MiB**，终止原因为 **highwater**；同组 GPU 进程约 **373.05 MiB**，也有 highwater 记录。宿主 App 约 41.64 MiB，未在该条记录中被终止。这证实了网页进程被内存限额终止，能解释 App 内重载。

**该记录没有证明哪一处图片、歌词、音频或合成分配导致了峰值。** 不能据此断言某种歌词效果不受支持，或将封面处理直接认定为唯一根因。原始设备报告仅留在本机工作目录；不把设备标识、账号存储或原始设备日志纳入公开仓库。

## 本轮修改

- `src/services/mediaSessionArtwork.ts`、`src/hooks/useMediaSessionBridge.ts`、`src/platform/ios/device.ts`：iOS 系统媒体封面通过原生 ImageIO 生成最长边 512 像素的 JPEG。准备期间先发布歌曲文字信息，不先把原图交给系统再重复替换；取消或切歌后忽略旧结果。
- `ios/App/App/FoliaArtwork.swift`、`FoliaDevicePlugin.swift`：限制压缩输入为 4 MB，并在解码阶段缩图、应用 EXIF 方向、只取动画图首帧；旧系统原生媒体信息回退路径也使用像素受限封面。512 像素只用于系统控件，应用内封面、取色、歌词和背景不使用此限制。
- `src/platform/ios/audioSession.ts`：在播放意图仍有效、网页音频会话为 active 时，允许后台的暂停/中断恢复事件恢复**现有** AudioContext。inactive/interrupted 会话、用户暂停、已关闭图不强制恢复。无轮询、无额外播放器、无宿主 `setActive(true)`，不重建 EQ、AutoMix 或 analyser。
- `ios/App/App/FoliaBridgeViewController.swift`：仅 Debug 构建开启 Web Inspector，并每 3 秒在前台记录最近 40 个资源计数快照至 App 的 `Library/Caches/folia-playback-resources.json`。内容限于视口、DPR、DOM/图片/画布数量与像素数、音频就绪/暂停/时间/错误码、网页会话状态；不记录标题、链接、账号、Cookie、Token 或个人文件内容。Release 没有该定时器。
- 工程构建号提升为 **4**，营销版本仍为 0.7.19。个人工程的 Bundle ID 和签名设置保留。

本轮没有关闭歌词模式、背景模式、模糊/发光/转场、音效、AutoMix 或模型。

## 实际验证

| 检查 | 结果与边界 |
| --- | --- |
| 依赖 | 按锁文件 `npm ci --ignore-scripts --no-audit --no-fund` 完成；本轮不依赖 Electron 安装脚本 |
| TypeScript | `npm run typecheck` 通过 |
| 播放会话回归 | 4 个 Vitest 文件、34 项通过，包含后台恢复边界、用户暂停、播放启动、系统媒体所有权、封面取消和过期结果 |
| 原生图片解码 | `xcrun swiftc ios/App/App/FoliaArtwork.swift dev/ipados/artwork/main.swift -o /tmp/folia-artwork-test && /tmp/folia-artwork-test` 通过；4096×2048 高压缩图片、EXIF 旋转、512 像素上限、JPEG 输出、非法/过大输入 |
| Mac WebKit | 媒体组件横屏与 390×844 / DPR 3 竖屏两项通过；每项连续 12 次前后切歌，再测 seek/pause/play、封面/曲名与单份系统命令 |
| iOS 前端 | `npm run build:ios` 通过，全部原视觉入口仍编入资源 |
| Capacitor | `cap sync ios` 通过，本地打包资源，未改为远程网页 |
| 原生 Debug | iOS 26.5 SDK、App scheme、arm64 无签名构建通过 |
| Web/PWA | 标准 `npm run build` 通过，输出到独立目录，包含 Service Worker precache；iOS 资源未被覆盖 |
| Release | iOS 26.5 SDK、App scheme、arm64 无签名 archive 通过，版本 0.7.19 / build 4 |
| 签名安装 | 个人 Bundle 的 Debug build 4 已构建并通过签名校验；尝试覆盖安装时设备连接断开（CoreDevice peer unreachable），尚未安装成功 |
| 真机复测 | 尚待安装构建 4 后，重做竖屏切歌及后台/锁屏验证 |

Mac WebKit 测试使用合成 WAV 与小封面、原媒体桥、一个音频图和模拟原生接口，**不等同于完整 App 的 iPhone 内存或后台测试**。独立 ImageIO 测试运行在 Mac，iOS 编译验证实际插件接入。早期测试因云盘占位依赖读取超时而没有执行，后改用本地依赖后实际通过；不能把早期超时写为测试断言失败。

## 真机后续顺序

1. 保留原数据覆盖安装构建 4，确认竖屏冷启动、首次播放、暂停继续、连续上一首/下一首及快速切歌是否重载。
2. 如再次重载，读取有界资源计数与对应时间的新 Jetsam 条目，区分 DOM、图片、Canvas、GPU 合成与音频分析；必要时用 Instruments 分配/内存图继续定位。计数本身不等于实际内存。
3. 测后台 1/5/30 分钟、锁屏、控制中心切歌、耳机/蓝牙、来电或其他媒体打断后恢复；同时核对实际听感与进度，不能仅凭进度宣称有声音。
4. 保持用户原视觉与 AutoMix 设置，逐个模式复测，不强制低画质；真机帧率、峰值内存、功耗仍需实测。
5. 若系统冻结 JS 或 Web Audio 会话不能在后台保持，当前事件恢复不能解决该平台问题。先记录实际会话/route，再按 `ipados-background-audio.md` 的同一 transport、全部 DSP/双 deck/分析器兼容要求评估原生引擎，不能用无音效的第二个播放器代替。
6. 用户真机确认前，不将本轮候选包覆盖为 GitHub 已验证修复版本。

## 本地交付与继续安装

- 个人签名 Debug App：本机 `~/.cache/folia-ipados-validation/IPhonePersonalDerivedData/Build/Products/Debug-iphoneos/App.app`；该目录为本机构建缓存，不加入公开仓库。
- 无签名 Release archive：本机 `~/.cache/folia-ipados-validation/Folia-iOS-build4.xcarchive`。候选 IPA 放在会话输出的 `outputs/releases/ipados-0.7.19-build4-candidate/`，需要用户自行签名；不是已验收的 GitHub 更新。
- 个人工程保留在 `outputs/folia-major/ios/App/App.xcodeproj`（相对于会话工作区），已同步本轮源码与 1873 个前端资源。原依赖目录、Bundle ID、Team 和签名设置保留。
- 已向用户请求重新连接并解锁 iPhone 13 Pro。连接恢复后，用 CoreDevice 覆盖安装以上 Debug App，然后按真机顺序复测。不要把旧构建 3 的复现当作构建 4 的结果。
