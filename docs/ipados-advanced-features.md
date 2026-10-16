# 本地音乐、模组、导出和模型的适配边界

更新时间 2026-10-16。以下按源码依赖区分已写入工程的适配与仍需实现的能力；未完成项没有被删除，也不标为笼统“iPadOS 不支持”。本轮已下载并校验公开 AutoMix 权重以测试设备内推理；没有运行云端分析或上传个人音频。

## 本地曲库与存储

原 `localMusicService.ts`、metadata worker、IndexedDB、sidecar 歌词解析继续使用。`src/platform/ios/files.ts` 实现项目所需的目录/文件 adapter；原生系统文档选择器可以选择文件夹，或多个音频/歌词文件，协调复制进 `Application Support/Folia/libraries/<uuid>/...`。复制和磁盘操作使用串行工作队列。复制失败会尝试清除半成品。

- **导入副本：已实现，待真机**。首次导入可能先从 iCloud 下载；需有足够额外空间。
- **引用外部文件：尚未实现**。源文件移动、修改不会自动同步到副本。
- **持久目录授权：尚未实现**。安全作用域仅覆盖本次协调复制，不保存 bookmark，不声称可扫描整个“文件”App/其他 App 沙盒。
- 目录 descriptor 以普通对象进入 IndexedDB，重启 hydration 恢复 adapter；`statFile` 失败报告 denied/不可用，不假装权限还在。
- 扫描 audio 使用 stat，不把整库读成 Blob；播放使用 Capacitor file URL。标签解析仍按单个 File 读取，多个大 FLAC/封面解析的峰值内存需真机测。
- 本地封面独立使用内容哈希文件和 native URL，避免 native 不运行 SW 时 `/__folia_cover` 失效。普通在线封面 OPFS、音频 IndexedDB/缓存配额仍需系统版本实测。
- 歌词逐字/逐行、翻译、匹配、原编辑流程和导出格式保留；编辑/导出不会直接覆盖外部来源。adapter 不是整个 File System Access 标准的完整 polyfill；未用到的 seek/truncate/任意新建目录语义未实现。
- 原桌面 FFmpeg 转码没有 iOS 构建目标。WebKit 是否解码 mp3/aac/m4a/flac/wav/ogg/opus 要逐样本测试；ape/wv/wma 等若依赖桌面转码，目前不能声称可播。
- 录屏和分享导出副本保留在 App exports 目录，暂未实现自动配额/清理面板；长期使用应关注 App 占用空间。删除 App 会丢失沙盒副本。

## Folium 模组

上游 main 与 client 清楚分离。native host 不伪造 `window.electron`；由启动入口安装 store-free transport contract，避免共享 Folium services 导入应用 store。原 `clientLoader`、registries、settings sections、commands、params、视觉配置存储、teardown 与错误报告复用。设置页和命令面板使用同一 native 管理界面。

| 能力 | 当前实现 | 验证与差异 |
|---|---|---|
| frontend JS/CSS/shader/声明式资源 | ZIP 导入，SHA256 内容版本路径，动态 module import，原 registries | 包管理单测通过；WKWebView 动态 import、MIME、纹理真实运行待测 |
| manifest/依赖/宿主版本 | 使用桌面纯 validator 的 portable mirror；`depends`、caret/wildcard 和 `folia` comparator 对齐 | 非整个 npm semver 语义；随上游更新应同步 mirror |
| 启用/禁用/更新/移除 | 导入默认禁用；明确页面脚本权限确认；内容变更撤销旧指纹授权；master 联动共享 lifecycle | 信任/变更/缺依赖/版本拒绝测试通过 |
| 签名 | 没有实现原桌面 signature verifier，全部显式标 unsigned | 绝不标 verified；待单独移植签名验证和受信任 key 管理 |
| storage | per-mod 本地值、`filesystem.data` 声明检查 | 不是安全隔离沙箱；受信任 JS 本身可接触 App 页面数据 |
| net.fetch | HTTPS、超时、5MB 有流时分块上限、权限声明检查、credentials omit | Capacitor HTTP 补丁可能先缓冲底层响应，不能因此承诺网络内存严格5MB；需实际大响应检查 |
| embed | 原 API 检查 `net.embed`、embedOrigins；保留 iframe | 目标站 CSP/内容/网络和 iPad 媒体规则决定是否可用；不规避限制 |
| 文件选择/恢复/释放 | 系统按类型选择单文件并复制；独立 grant，释放后下一启动回收临时副本 | 跨 mod grant 与释放测试通过；不是外部永久引用 |
| client settings/commands | 原 ModSurfaceRenderer、FoliumSettingsSections、client issue 展示 | 本地构建，待真机操作 |
| Node main/native/RPC handler/子进程 | 不执行，含 main 包明确拒绝 | 尚未实现最小原生 RPC 替代；个人签名不提供 Node/Electron 能力 |
| 桌面 cache usage、目录打开、FFmpeg 状态、离线 export host | 保留桌面源码，native 管理页不展示对应死按钮 | 未完成这些宿主 API；不能宣称兼容所有桌面模组 |
| 模组市场/签名下载体验 | 未实现 native 市场安装流程；使用 ZIP 导入 | 不在后台下载/执行未确认代码 |

ZIP 最大20MB、解压声明总量50MB、1000条目；路径穿越和 native binary 后缀拒绝。启用前提示页面代码可读取账号与本地数据；权限列表用于声明和 API 检查，不是假定隔离能力。未启用不执行，内容变更需重新确认。

### 仓库样例逐项审计

以下是源码可移植性判断，**没有在 iPad 实际运行，不能作为通过结果**。用包含该模组自身 `mod.json`、client 与资源的 ZIP 安装，不要把整个仓库打成包含多个 mod.json 的包。

| 样例目录 | 实际依赖/入口 | iPad 当前预期与待验 |
|---|---|---|
| `mods/sample-beta-hello` | client、console | 可导入；签名仍标 unsigned，不能沿用原测试签名徽标 |
| `mods/sample-progress-bar` | client、progressLayers/styles/settings、net.fetch/storage | 适配已具备；检查 CSS、HTTPS marker endpoint、开关、seek、重启 |
| `mods/sample-aurora-visualizer` | client、visualizers、逐字虹光 | 动态 renderer 原样；检查 shader/逐字/注册卸载；其“可透明导出”仅指原桌面，不代表 iOS 离线宿主已实现 |
| `mods/sample-rickroll` | client、stageLayers、net.embed、YouTube allowlist | 原 iframe API 保留；目标站 CSP/网络/自动播放限制未验证 |
| `mods/k3panel` | client、sonnet tuning multiplier | 设置 registry 与原 sonnet 可复用；验证11项倍率、预览和配置往返 |
| `mods/more-progress-buttons` | client、playback.control、按钮 | 使用原 host actions；验证打乱/音量/喜爱与账号权限 |
| `mods/visualizer52hz` | client、vendor Pixi、audio、settings、experimental ponder.targets | 资源与 registry 路径保留；验证 vendor 相对 import、音频响应、GPU 清理和 Ponder |
| `mods/sample-transparent-mov-export` | client + main、Node FFmpeg export RPC | native 明确拒绝当前混合包；尚未实现该桌面导出任务，可用 ReplayKit 录真实画面但不等价 |

## 导出和 FFmpeg 决策

现有歌词/ZIP/M3U/Tempera 图像包等保留原文件格式，经 `saveDownload` 分块写入沙盒并显示系统分享面板。没有把 WKWebView 的 anchor download 当作已保存文件。

原视频路径分为浏览器 capture/MediaRecorder、Electron export window/offline 时间线、模组 FFmpeg 透明 MOV。`packaging/ffmpeg/fetch-ffmpeg.mjs` 固定 `v8.1.2-folia.3`，只列 Linux、Windows、macOS 资产，**没有 iOS artifact**；不能复制 macOS arm64 的可执行文件进 iPad。具体 FFmpeg 构建选项/codec 的 LGPL/GPL 条件应检查对应发行元数据后才选用，不能以“FFmpeg 开源”代替许可证分析。

本次选择系统 SDK 自带、已在当前 SDK 编译成功的 **ReplayKit 实时录屏**，没有引入第三方 FFmpeg wrapper，尤其没有用未核实维护状态的 FFmpegKit 作为默认方案。开始时系统授权，mic 关闭；停止输出 MP4 并分享。录的是原动态画面，未用截图替代动画。

ReplayKit 不是原桌面导出的同功能实现：没有透明 alpha、离线逐帧、固定分辨率、精确歌曲裁切、批处理或独立混音文件。系统中断、受保护内容、Web Audio 捕获、同步和文件完成状态需实体设备测。

后续实现原导出应先建立：原 renderer 逐帧可控时间输入 → 像素缓冲 → AVAssetWriter；原 Web Audio offline 效果/双 deck 混音 → 同一时间线音轨；再评估 HEVC alpha 等系统 codec 的实际设备能力。若选 FFmpeg 则单独编译 iOS library 并审查 codec/license/build 配置。没有采用停止维护库作为捷径，也没有上传录屏/音频到远程任务。

## 模型与 AutoMix

Beat This! 与 HTDemucs 的 iPad 原生运行层现已实现，使用官方 Microsoft ORT 1.24.2 Apple XCFramework，Swift/Accelerate 还原原 NumPy STFT/iSTFT。模型仍由用户下载或从“文件”导入，长度/SHA-256 与原 manifest 一致。普通信号分析、原 planner、双 deck、EQ/音效、分轨总线和所有可视化继续复用。

30 秒合成音频对照、存储/桥接与原生构建通过；尚待实体 iPad 验证连续混音、真实曲库、内存/热状态/功耗和后台切换。原桌面 Python 的 memory reuse 选项未被官方 C API 暴露，不能照搬其约 483 MB 记录；当前 Mac 调试测试进程峰值约 1.85 GiB，并非 iPad 数值。完整模型选项保留，未上传音频或改用远程服务。

详细依赖、参数保留、模型安装、差异、复现命令和设备清单见 [ipados-automix.md](ipados-automix.md)。任意 Node/native 模组、桌面 FFmpeg 离线/透明视频导出等前述未完成项仍按各节记录，不能因 AutoMix 接通而标为完成。
