# iPad AutoMix：原版算法、设备内模型与验证边界

更新：2026-10-16。基线 Folia 0.7.19，分支 `codex/ipados-self-use`。本轮已接通原版 AutoMix 的 iPad 模型运行接口；模型和预后处理的数值对照通过，实体 iPad 上的连续混音、峰值内存、功耗及后台播放仍待验收。不要把普通 Crossfade、成功构建或模型已下载当作完整混音已经在设备上验证。

## 使用

1. 在本源码目录执行 `npm run ios:sync`，然后用 Xcode 打开 `ios/App/App.xcodeproj`，选择 **App** scheme、自己的 Team 和实体 iPad，按 **⌘R** 覆盖安装。保留原 Bundle ID/Team；删除 App 会删除沙盒模型和已导入的音乐。此次增加原生插件和 ONNX 库，单独刷新网页资源不能完成更新。
2. 打开 **设置 → 播放 → 智能过渡（FOLIA）**，启用过渡并选择 **AutoMix**。也可在命令面板搜索「智能过渡 / automix / 模型」进入同一设置。
3. 在该区块底部的 **iPad AutoMix 模型** 中下载 **Beat This!（83.1 MB）** 和 **HTDemucs（107.9 MB）**。两者合计 190,980,642 字节。每个模型均校验长度和 SHA-256，完成后保存到 App 私有目录，重启仍保留。
4. 镜像无法连接时，从原项目模型镜像取得同名 `beat_this.onnx` / `htdemucs-v2.onnx`，用「从文件导入」。原生文档选择器只在本次操作中读取选中的文件，校验后复制到沙盒；不保留外部文件或目录授权。不需要下载桌面 Python runtime。
5. 在线曲库启用**媒体缓存**，按正常队列播放并给预分析留出时间；本地歌曲使用已导入副本。至少安排两首可正常播放的歌曲。原版只预分析当前曲和下一首，并分离出场曲尾、入场曲头各最多 30 秒；没有准备好的模型、音频或结果时，本次转场沿用原版估算器/主轨过渡。
6. 两模型就绪后能力标记显示「完全体 / Full」。它表示安装与运行接口齐备，不保证每一对歌曲都适合某种转场，也不表示当前曲对已完成分轨。模型报错会显示在此设置区；不会用静态动画伪装推理成功。

无需 AutoMix API、Mac 常驻服务、AI 账号或云端分轨。模型下载使用原项目公开镜像，服务器收到通常的下载网络信息；歌曲、音频采样和本地文件均留在设备中。本功能没有远程上传分支。

## 原版能力对应

| 能力 | iPad 实现 | 当前状态 |
|---|---|---|
| AutoMix / Crossfade 两种模式、总开关、Crossfade 秒数 | 原 store、命令与 `transitionStrategy.ts` | 原样复用；单测通过；待真机混音 |
| 曲目分析：首尾、响度、调性、速度、小节、段落、前奏/结尾形态 | 原 `profileService.ts` / `trackProfile.ts` / analysis worker | 原样复用；增加取消后重新分析；待实际曲库覆盖 |
| Beat This! 逐帧拍点/重拍、网格后处理 | 原 mel、分块、拼接、峰值挑选；官方 ORT iOS CPU 推理 | 已实现；同权重合成数据对照通过；待真机 |
| HTDemucs 分离 | 官方 ORT + Swift/Accelerate 还原原 NumPy STFT/iSTFT、固定段长与三角窗拼接 | 已实现；30 秒样本对照通过；待真机内存/速度 |
| drums / bass / vocals / other | 原前端缓存与 stem bus；`other` 仍由原 PCM 减去三分轨，保持重构一致 | 原样复用；桥接通道序列测试通过 |
| bassSwap / beatCut / tailRide / plainBlend | 原 chooser/planner/session | 原样复用；相关回归通过 |
| 变速与保调、三频段 EQ、回声抛掷、限幅、响度补偿 | 原双 deck Web Audio 图 | 原样复用；待真机听感和节点生命周期 |
| 表现模式：build-up、升调/抽拉/甩盘等采样手法 | 原 `expansionGesture.ts`、`stemGesture.ts` 和执行图 | 原样复用；依赖已就绪的分轨；待真机听感 |
| 转场圆环/卡片动画与歌词/背景/音频可视化 | 原 renderer、显示 deck 与 analyser | 原样复用；此次没有削减视觉模式或参数 |
| 模型下载、导入、删除、完整性检查 | 原 manifest 生成原生常量；HTTPS 下载、文档选择器、沙盒副本 | 已实现；存储测试通过；实际设备下载/导入待验收 |

## 实现入口

- `src/services/automix/inferenceBridge.ts`：唯一推理分派入口，选择真实 Electron 或 Capacitor 插件；不伪造 `window.electron`。
- `src/platform/ios/automix.ts`：官方 Capacitor 检测及类型契约。
- `src/services/automix/nativeInference.ts`：串行请求、二进制文件桥、维度/输出校验、错误和清理。桥接 JSON 只传 job ID、shape、结果路径，不传大数组。
- `src/services/automix/nativeLifecycle.ts` / `useNativeAutomixRevision.ts`：前后台取消、清空等待队列、回前台后重排分析；模型安装后刷新能力。
- `ios/App/App/Automix/`：模型 SHA/长度校验、原子安装、下载进度与取消、文档导入、隔离 job 目录、单 utility 队列推理。模型/中间音频目录不备份，启动清理上次中断的 job。
- `ios/FoliaAutomixRuntime/`：Swift + C++ 小包，只做推理；Microsoft 官方 ONNX Runtime **1.24.2** Apple XCFramework，校验值锁定。`ORT-LICENSE` 同时作为资源进入 App。没有内嵌 Node/Python，没有第二套播放器。
- `shared/modelManifest.json`：模型的唯一来源；`python3 dev/ipados/automix/sync-manifest.py --check` 检查原生镜像/长度/hash 是否同步。

模型均采用 manifest 指定的 MIT 文件；来源为 Beat This! 社区导出及 HTDemucs FFT-cut 导出。参考 `src/services/automix/MODELS.md` 和原 manifest 的上游/许可证说明。没有替换成其他模型或缩短原 30 秒窗口。

本轮性能优化与同配置前后对照见 [性能记录](ipados-performance.md)：30秒宿主分轨中位用时约减14%，FFT与缓冲路径已优化；iPad结果仍待测。

## 内存、取消与后台

iOS 使用官方 ORT CPU，未假定 Core ML 支持该模型的每个算子。每次请求结束释放推理 session，原生只串行运行一个模型；合法系统目录别名在创建后规范化，job 内部符号链接仍拒绝；CPU arena/memory pattern 关闭，分轨采用 parallel 执行模式与 1 个 inter-op worker。现有 JS 分轨缓存仍最多四个窗口，采用原来的 Int16 存储；双 deck、音效、分析器和所有视觉 renderer 保留。

原版桌面分轨通过 Python 的 `enable_mem_reuse=False` 显著降低内存，**官方 ORT C API 没有此选项**。当前 iOS 配置不能声称获得相同效果。Mac x86_64 调试测试进程（包含 FFT 测试及真实 30 秒推理）峰值 RSS **1,986,125,824 字节，约 1.85 GiB**；其中还包含测试夹具/调试开销。这不是 iPad 的测量，也不能将桌面 manifest 的约 483 MB 直接套用到本工程。需要在实体 iPad 使用 Xcode Memory/能源/热状态观察与 jetsam 日志核实；如果内存不足，应先优化运行库和缓冲生命周期。完整模型选项保留，不强制关闭歌词效果。

切后台、内存告警或用户取消会撤销当前分析及排队分析；当前 ONNX 调用采用**段与段之间的协作取消**，正在执行的单段可能继续到返回。回前台会等待已取消工作退出，再安排当前曲对。推理取消不调用播放器 pause，也不重建音效图。没有通过后台任务、静音音轨或反复强行 play 保活。

此前后台音频/宿主会话修复仍须在最新 App 上复验。此轮不宣称后台长播问题已经由 AutoMix 解决，也不保证后台能启动新的重模型分析；后台缺少结果时保留原版主轨过渡。

## 可复现验证

常规检查：

```bash
python3 dev/ipados/automix/sync-manifest.py --check
npm run typecheck
npm run test:unit -- test/unit/automix test/unit/playback test/unit/ipados test/unit/prefetchService.test.ts test/unit/command-palette/commandRegistryContract.test.ts
npm run ios:sync
```

原生 DSP 单测可用 `swift test --package-path ios/FoliaAutomixRuntime` 在 Mac 运行，首次 SwiftPM 从官方地址取得 SDK。真实模型对照测试需要自己将上述原文件放在源码树外，通过 `FOLIA_AUTOMIX_TEST_MODELS` 指定目录；`FOLIA_AUTOMIX_TEST_OUTPUT` 指定临时输出，`FOLIA_AUTOMIX_TEST_SECONDS=30` 测完整窗口。它们只生成合成信号，不读取音乐库。

需要同时验证 App 存储类时，可用 `dev/ipados/automix/prepare-native-tests.py --work <源码树外临时目录> --archive <官方SDK ZIP>` 生成测试包。脚本校验官方 ZIP 的固定 SHA-256，并保留 Apple framework 符号链接。然后 `swift test --package-path <该临时目录>`。不要把本机测试绝对路径、SDK、权重或 `.build` 加进版本控制。

Python 原版对照使用独立环境安装 `numpy` 和兼容的 `onnxruntime`；Intel Mac 可用 1.23.2。执行：

```bash
python dev/ipados/automix/compare-reference.py \
  --models <模型目录> --fixtures <上述临时输出目录> --output <报告.json>
```

该脚本直接导入本仓库未修改的 `electron/analysis/htdemucs_runner.py`，对照同一合成 PCM、mel 及权重，不会上传文件。实际数值结果见 [automix-parity.json](ipados-validation/automix-parity.json)。完整测试记录见 [验证报告](ipados-test-report.md)。

## 真机验收

按 [设备清单](ipados-device-checklist.md) 新增 AutoMix 项完成：模型镜像/断网/取消/导入坏文件、重启恢复；两首本地曲和两首已缓存在线曲；四种策略及表现模式；连续多首、seek/暂停/下一首/上一首/循环；转场中歌词和锁屏显示；蓝牙/耳机/中断；切后台后取消与回前台重算；完整歌词/背景同时运行时的峰值内存、帧率与热状态。实体 iPad 结果须记录型号、OS 和构建，不以 Mac WebKit 或模拟器替代。
