# iPadOS 性能优化记录

2026-10-16。本轮优先处理新增 AutoMix 分析链路中的缓冲复制、FFT 开销和主线程长任务。原模型、精度、30 秒分析窗、所有混音策略、音效、歌词动画及背景参数保留。没有通过减少效果、缩短窗口、降低采样率或模型量化换取以下数字。

## 实际对照结果

同一 MacBookPro16,1、Intel i9-9980HK 2.40GHz（8 核 / 16 线程）、macOS 26.7.1，SwiftPM **Release**、官方 ORT 1.24.2 CPU，intra-op 2 / inter-op 1。固定 44.1kHz、双声道 30 秒合成音频及同一组 SHA 校验权重。每次独立测试进程，无同时运行的模型基准；构建时间不计入处理时间。基线与最终版本分别 3 / 2 次，完整逐次数据见 [JSON](ipados-validation/automix-performance.json)。少量宿主样本只说明本轮优化方向，不代表所有曲目、负载或设备。

| 测量 | 优化前 | 优化后 | 中位数变化 |
|---|---:|---:|---:|
| 30 秒 HTDemucs 分轨（含 session 创建、FFT 和重叠拼接） | 28.740 秒（25.767–29.495） | 24.737 秒（24.621–24.854） | 用时缩短 13.9% |
| 单段 stereo STFT | 47.075 ms（43.715–53.218） | 12.178 ms（10.315–14.040） | 用时缩短 74.1% |
| 单段完整 8 声道 iSTFT | 136.934 ms（130.451–140.044） | 48.542 ms（46.793–50.291） | 用时缩短 64.6% |
| 宿主测试进程峰值 RSS | 2,021,974,016–2,124,943,360 bytes | 1,966,731,264–2,058,858,496 bytes | 范围重叠，**未证实稳定下降** |

最终路径实际仅重建返回的 drums / bass / vocals 共 6 声道；上表 iSTFT 特意仍测完整 8 声道，使前后工作量相同。完整模型仍计算全部声部，原版通过 master 减去这三组声部生成 `other` 的精确重构方式保留。

没有把之前 Debug 的约 87.6 秒与本次 Release 数值相比。早期缓冲优化试跑与 `disable_prepacking` 实验未纳入最终统计；后者没有显示足够收益，没有成为产品默认配置。

## 已落地的修改

- `FoliaORTC` 将 ORT 输出所有权交给小型 owner，替代逐 tensor 的 malloc / memcpy。Swift 在同步闭包内借用输出，成功或抛错均释放，不让裸指针进入异步回调或缓存。小型 Beat 输出仍复制成独立数组供后续保存。
- `HTDemucsFFT` 每次分析请求只计算一次双层反射映射，保持与原 NumPy 嵌套 reflect 相同的边缘采样。窗口乘法、float/double 转换、频谱打包、逆变换归一化与叠加改用 Accelerate；保留 float 窗、float 叠加的数值边界。
- 分轨只做接口实际消费的 6 声道逆变换；片段三角窗拼接和最终权重归一化也向量化。段长、重叠、声部顺序不变。
- C++ 官方 session 配置显式关闭 intra/inter-op 空转等待。仍只有一条原生分析队列，session 每次请求后释放。未声称已测得真机功耗下降。
- 原生 tensor 文件使用一次有界内存拷贝填充对齐 Float 数组，移除逐 float 的 unaligned load；保留文件尺寸复查、有限数值、沙盒和符号链接校验。
- 前端用不重叠的 `subarray` 视图替代 6 次 `slice`，共享一个由 fetch 创建、由 JS 持有的 ArrayBuffer。完整 30 秒结果避免额外 **31,752,000 bytes，约 30.3 MiB** 的声道拷贝；这是确定的临时分配减少，不能等同于整个 App 的 RSS 减少。
- 约 794 万个 float 的结果检查按已有 `YIELD_BUDGET_MS=8` 和 `yieldToUi` 让出主线程；每次最多扫描一小块再检查时间。让出后复查取消/前后台状态，阻止已失效结果写回。8ms 是调度目标，系统调度和 GC 仍可能超出。

## 正确性与运行验证

- 原版未修改的 `electron/analysis/htdemucs_runner.py` / Python ORT 1.23.2 对照：Beat logits 相同；STFT 最大误差 4.55e-13；分轨最大误差 3.8650e-8、SNR **99.47dB**。见 [数值证据](ipados-validation/automix-performance-parity.json)。优化后与优化前原生结果也对照过：Beat/STFT 相同，stem 最大差 1.8627e-9、SNR 118.30dB。
- 原生往返 / 6 声道选择 / 非法输入 / 存储 / 系统目录别名 / 取消 / 抛错后 ORT 输出释放和 session 再使用测试通过。30 秒真实权重推理另外在上述独立基准中运行；未设置输出目录时测试中的 optional fixture 项会直接返回，不计为再次完整推理。
- 63 文件 **968 项 JS 测试**、typecheck、原 Web/PWA 构建、iOS sync、App / iphoneos26.5 / arm64 无签名构建通过；日志前缀 `automix-performance-*`。构建保留既有动态导入/大 chunk 提示，没有通过删除 renderer 改变包内容。
- 实际 macOS WebKit 中调用前端原生结果适配器，以本机合成的 30 秒、6 声道 float 文件响应替代设备插件：6 个视图共享一个 31,752,000-byte 缓冲，后续推理与 job 清理不使旧结果失效。该次检查与视图构建用了 178ms，期间发生 **7 次动画帧回调**，零页面异常、零外部请求。它说明等待期间可让浏览器绘制，**不是 iPad FPS 或整页视觉性能测试**。见 [WebKit 证据](ipados-validation/automix-performance-webkit.json)。

## 复测命令

从仓库根运行，`work/` 只存本机 SDK、模型和测试产物，不纳入源码包：

```sh
python3 dev/ipados/automix/prepare-native-tests.py \
  --work ../../work/AutomixRuntimeProbe \
  --archive ../../work/onnxruntime-c-1.24.2.zip

FOLIA_AUTOMIX_TEST_MODELS="$PWD/../../work/automix-models" \
FOLIA_AUTOMIX_TEST_OUTPUT="$PWD/../../work/automix-performance-rerun" \
FOLIA_AUTOMIX_TEST_SECONDS=30 \
FOLIA_AUTOMIX_BENCH_LABEL=release-rerun \
CLANG_MODULE_CACHE_PATH="$PWD/../../work/clang-cache" \
SWIFTPM_MODULECACHE_OVERRIDE="$PWD/../../work/clang-cache" \
swift test -c release --disable-sandbox \
  --package-path ../../work/AutomixRuntimeProbe \
  --cache-path ../../work/swift-cache \
  --filter RuntimeTests.originalModelsSyntheticParity
```

fixture 输出目录中的 `benchmark.json` 包含计时和峰值；float 文件完全由测试合成。实际模型与 SDK 来源/校验见 [AutoMix 文档](ipados-automix.md)。先单独完成构建，再在无其他构建/模型任务的条件下多次运行；可用 `--skip-build` 排除重建。比较版本应保持相同编译配置，保留全部逐次结果。

WebKit 检查：先 `npm run dev -- --host 127.0.0.1 --port 4173 --strictPort`，另一终端运行 `node dev/ipados/automix/webkit-performance.mjs`。仅访问本机探针，不使用用户账号或媒体文件。

## 尚待真机

以上 Mac 数字不代替 iPad 性能。官方 C API 仍没有桌面 Python 专用的 `enable_mem_reuse=False`，重模型约 2GiB 的宿主峰值仍是实际风险，不能承诺任何 iPad 都能在全效果下稳定分析。Core ML / 自编译 ORT 分配策略尚未实现。

在实体 iPad 用原 Bundle ID / Team 覆盖安装，按 [设备清单](ipados-device-checklist.md) 记录：完整歌词/背景下冷/热分析耗时、帧率、峰值及释放后内存、连续 10 首、能源/热状态、内存告警、切后台/回前台、取消和恢复。性能验收可用 Release，排障保留 Debug，结果注明配置；不将 Release 切换本身计算成本次算法收益。

本次没有改动音频会话与播放器所有权。之前的前台/后台播放修复、锁屏/蓝牙/中断等仍需新版真机复验，不能因性能测试通过而标记为已解决。
