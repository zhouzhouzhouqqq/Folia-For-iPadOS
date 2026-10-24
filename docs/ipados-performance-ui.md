# iPadOS 性能和显示适配记录（2026-10-24）

本轮基于已合并官方 0.7.21 的 iPadOS 工程。保留已有歌词、背景、音效、主题和画质设置。本轮未连接真机采集性能，因此不能将下列 CPU 测试结果解释为设备帧率，也不能宣称已解决所有卡顿。

用户补充：首页／设置滚动与歌词／背景播放两类场景都有卡顿，因此除莫奈局部优化外，也处理了共享背景层的重复渲染与探索页滚动样式写入。工作分支为 `codex/performance-ui-0721`，未提交、未推送。

## 已修改的代码

| 项目 | 原因及实现 | 验证状态 |
| --- | --- | --- |
| 共享背景 React 渲染（`src/components/visualizer/VisualizerBackdrop.tsx`、`backdropLayerInputs.ts`） | 歌词行等上层状态更新会生成新的 props 外壳。背景层现在按它实际消费的输入比较并复用渲染树，避免背景输入未变时重复执行背景组件。比较包含全部 8 个 shared 输入及主题、音频信号对象、背景可见性、转场和等待状态；新增 shared 输入需补齐比较表。MotionValue 的音频与转场信号仍独立更新，子组件自身订阅也照常工作。 | 15 项边界测试通过；主题、封面、背景配置、暂停和转场均会触发更新。复杂 WebGL／视频／模组场景仍待整应用和真机验证。 |
| 探索页滚动（`src/components/app/home/explore/ExploreSurface.tsx`） | 顶部渐隐达到 56px 后，原先仍在每次滚动重写同一个继承 CSS 变量。现只在渐隐值变化或 DOM 节点变化时写入，浮动按钮属性也只在状态变化时写入；保留原渐隐公式和滚动位置恢复。 | Oxc 语法检查通过；真实推荐数据列表的滚动表现待验。 |
| 莫奈底部频谱（`src/components/visualizer/monet/AudioOverlay.tsx`、`monetSpectrumSampler.ts`） | 原先在每个柱/曲线点重复构造频段锚点、计算 FFT 采样几何和频率补偿。现缓存固定几何，复用输出、频段和曲线点缓冲，每帧读取一次时间。保留 72 个采样点、原始响应公式、动态波形、渐变和分辨率。 | 1,728 个原公式采样值与优化后结果最大绝对差为 0；2 项回归测试通过。Canvas 最终观感待真机验证。 |
| 频谱生命周期 | 增加尺寸观察；隐藏或尺寸为零时停止该组件绘图，恢复可见后重新调度；卸载释放 RAF、监听和观察器。只处理绘图，不暂停播放器、音频图或分析器。 | 代码核对完成；前后台和分屏操作待完整运行验证。 |
| 全局可选帧率限制（`src/utils/frameRateLimiter.ts`） | 原先每次按实际显示帧重新计时，90 FPS 上限在 120 Hz 显示时容易变成约 60 次回调。改为保持理想截止时间，跨显示帧保留间隔余量，长时间挂起后跳过过期时隙，不集中补跑。 | 3 项新测试及仓库的 10 项既有调度测试通过，含取消、同帧批处理、异常恢复、下一帧延迟和解除限制。 |
| iPhone 高刷新率资格（`ios/App/App/Info.plist`） | 加入公开键 `CADisableMinimumFrameDurationOnPhone = true`，申请系统允许的较高刷新率。未使用私有 API，未覆盖用户帧率设置。 | 源配置已修改；尚未进入新设备构建。实际刷新率由设备、系统、WebKit、低电量、温度及负载决定。 |
| 播放面板（`src/components/panelTab/shell/PanelShell.tsx`、`PanelShell.css`、`TabDock.tsx`） | 触控设备底部标签行增至 48px，扣除行内边距后按钮为 44px；内容高度预算与标签行同步。使用动态视口，原生 iOS 扣除根容器已经占用的安全区；保留桌面原有尺寸。 | 源码已接入；全应用截图、横竖屏与分屏验证受文件下载阻塞。 |
| 设置窗口（`src/components/modal/SettingsModal.tsx`、`settings/settingsLayout.css`） | 使用动态视口高度，加入安全区与可用高度上限，避免小窗口及横屏时窗口越界。保留原有风格、设置分组和功能。 | 源码已接入；关闭按钮、内部滚动及软键盘场景待浏览器和真机验证。 |

## 迁移前的检查记录（后续结果见文末）

- Vitest 4.1.11：3 个文件、15 项测试通过。先以临时配置隔离下载问题，再在文件恢复读取后以仓库标准 `vitest.config.ts` 运行实际测试，执行耗时 690ms；不是全量测试通过。标准配置的运行在结束阶段仍报告退出等待超时；测试断言本身已完成。另一次设置内联空 PostCSS 的隔离运行正常退出，15 项通过、耗时 708ms。
- 新增背景渲染边界后，以无项目插件、内联空 PostCSS 的临时配置运行当前实际 4 个测试文件，30 项全部通过、846ms，并正常退出。该配置没有修改仓库默认构建；只隔离纯逻辑测试无须使用的构建插件。
- 9 个修改后的 TypeScript / TSX 源文件通过 Vite Oxc 语法转换；此检查不替代完整类型检查。`plutil -lint ios/App/App/Info.plist` 通过。
- 独立 Node 检查：模拟每秒 120 个显示 tick，60 / 90 / 120 / off 配置分别产生 60 / 90 / 120 / 120 次回调。
- Mac CPU 微基准：Node 24.19.0、darwin x64，交替 5 轮，每轮 6,000 次频谱采样。原始 FFT 路径总耗时中位数 74.349ms → 25.514ms；五频段回退路径 103.993ms → 1.802ms。测试不包含 Canvas、GPU、歌词和合成，总体收益必须另测。
- 完整 `tsc --noEmit`、Vite 开发预览已尝试，均等待 iCloud 占位文件读取，未产生成功结果。重试 iOS 生产构建后进入 `transforming...`，但再次等待 `postcss.config.js`、HTML 等文件读取，CPU 空闲、未完成构建。
- 原有 WebKit 启动超时。另行下载独立 WebKit，前两个下载地址断开后第三个地址下载成功。用当前实际新增 CSS 在 macOS WebKit 26.6 的独立布局夹具中检查 390×844、844×390、834×1194、1194×834、375×667，窗口均在视口内，触控按钮高度均为 44px；已保留截图并人工查看横屏和窄竖屏。此夹具不包含完整应用，不验证 iOS 实际安全区、设置内部控件或整应用截图。
- 本轮未完成生产 Web 构建、Capacitor 同步、Xcode 构建和 IPA 生成。现有 0.7.21 IPA 仍是优化前的包，不能用于验证本轮修改。

原始备份、微基准脚本、结果和测试日志保存在工作区 `work/performance-20261024/`；此目录位于仓库之外，不作为应用运行依赖。

## 迁移前遇到的阻塞与当时继续步骤

仓库位于 iCloud 同步的 Documents 下，多份源文件、配置、Git 对象和构建产物显示 `compressed,dataless`。系统收到下载请求后，部分文件恢复，部分文件的读取仍长时间挂起。没有用官方文件覆盖无法读取的适配源码，也没有删除原有未提交修改。

1. 在 Finder 中对当前 `Folia-For-iPadOS` 目录使用“立即下载 / 保留下载”，确认云朵占位状态消失。若持续下载失败，先解决 iCloud 同步；不要用另一份旧工程代替。
2. 检查 Git HEAD、仍在运行的进程和锁。仅可清理由本轮已退出进程留下且无人持有的锁；不得删除活动锁。
3. 执行 `npm run typecheck`，随后针对 `test/unit/utils/frameRateLimiter.test.ts`、`frameRateCadence.test.ts` 和 `test/unit/visualizer/monetSpectrumSampler.test.ts` 跑仓库标准单测配置。
4. 启动一次开发服务器，按下列清单检查并保留截图；关闭该服务器后执行 `npm run ios:sync`，将新 Web 资源打入实际 iOS 工程。
5. 检查 Xcode scheme、SDK 后做无签名构建；真机重新签名安装。新构建验证完成前，不替换 GitHub 上的 IPA。

## 真机回归与性能采集

固定同一设备、系统、歌曲、歌词、主题、背景、音量、亮度和画质，分别记录优化前后的数据。第一次加载和稳定播放分开比较；至少记录实际帧间隔、CPU、GPU、内存峰值、温度及低电量模式。使用 Instruments / Safari 时间线；Mac 和模拟器结果不能替代这些数据。

- 莫奈柱状与曲线各播放 5 分钟，确认频率响应、颜色、渐变和动态波形一致；切换 FFT/音频来源后无残留值。
- 全部歌词和背景模式按 `docs/ipados-visual-checklist.md` 中的实际清单逐项回归；不因本轮只优化莫奈就跳过其他模式。
- 120Hz 设备分别测试不限制、60、90、120；60Hz 设备测试不会产生回调追赶或错误倍速。音乐和歌词时间仍以播放时间为准。
- iPhone 竖屏与横屏、iPad 竖屏与横屏、窄分屏和 Stage Manager：播放面板标签可点、标题可读、内容可滚动；设置可关闭；无安全区遮挡。
- 软键盘弹出、动态调整窗口尺寸、连续切换歌词和背景、连续打开关闭面板后检查布局与内存；不出现 ResizeObserver 循环或 RAF 泄漏。
- 连续播放、锁屏、切后台、蓝牙、音频中断和恢复；确认绘图休眠不会影响现有原生后台音频。

迁移前状态为“代码已实现，局部逻辑及布局夹具已验证”；下节补充迁移后完成的类型检查、Web 构建和同步。整应用截图、真机帧率/内存实测及优化版安装包仍待完成。

## 本地迁移与本轮构建结果（2026-10-24）

工程已从 Documents 下的云管理目录复制到 `$HOME/Developer/Folia-For-iPadOS`；原目录保留作备份。迁移脚本实际读取并写入每个文件内容，最终 8,255/8,255 项完成，复制错误为 0，目的地没有 `compressed,dataless` 占位文件；逐项 SHA256 核对通过（Xcode 自动改写的个人 `xcuserdata` 界面状态文件除外）。迁移时 Git 分支为 `codex/performance-ui-0721`，HEAD 为 `c5d575ae37be5ed97449c74e3ecc7f266857ffbd`。随后用户要求发布源码；本次发布范围与当前验证状态见 [源码更新记录](ipados-update-2026-10-24.md)。

新目录验证：

- `npm ci --ignore-scripts --no-audit --no-fund` 已完成，目标目录使用自己的 `node_modules`。
- `npm run typecheck` 已通过。
- `npm run test:unit -- test/unit/utils/frameRateLimiter.test.ts test/unit/utils/frameRateCadence.test.ts test/unit/visualizer/monetSpectrumSampler.test.ts test/unit/visualizer/backdropLayerInputs.test.ts`：4 个文件、30 项通过。
- `npm run build:ios` 已通过（Vite 8.3.1，5,674 个模块转换，`dist` 约 28 MB）。存在大 chunk 和无效动态导入的既有警告，没有构建错误。
- `npm run ios:sync` 已通过，Web 资源已复制到 `ios/App/App/public`，Capacitor 配置和插件清单已更新。
- `xcodebuild -showsdks` 确认 iOS 26.5 / iOS Simulator 26.5。Xcode 的 Swift Package 解析需要访问 `https://github.com/ionic-team/capacitor-swift-pm.git`，本机连接多次超时，因此尚未完成 Xcode 原生编译或 IPA；不是源码编译错误。网络恢复后在 Xcode 中重新打开本工程并执行 Resolve Package Versions，再进行无签名或个人 Team 签名构建。

本地 Xcode 工程：`$HOME/Developer/Folia-For-iPadOS/ios/App/App.xcodeproj`。本次优化版 IPA 尚未生成，也没有替换旧的 GitHub 文件。
