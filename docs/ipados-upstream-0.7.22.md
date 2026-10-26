# Folia 0.7.22 对齐与 iPadOS 适配

本轮以官方 [v0.7.22 发布](https://github.com/chthollyphile/folia-major/releases/tag/v0.7.22)及对应固定提交 `1f6d0f468f5bc81b23a8b40ad7ca96ccd4b1ecbe` 为准；不是只改版本号。前一官方基线为 `33b25ff75252435a78006af45114fdf10e64727a`（0.7.21），iPadOS 起点为 `71b30d041bca5dab188e7561ad80af4976d54b77`（Preview 3）。工作分支 `codex/upstream-0.7.22`，当前 App 版本 0.7.22 / build 6。

## 来源、合并与保留

GitHub compare 响应只列出前 300 个文件，因此实际以两个完整 recursive Git tree 比较，得到 692 个变化路径。通过 GitHub Git Blob API 取得缺失文件，每个 blob 校验 Git SHA-1，再做三方合并。649 个文件直接更新、25 个自动合并、16 个冲突逐项处理、2 个移除。官方 README 保存在 `README-upstream.md`，本项目 README 和 iOS 专属代码保留。

本机审计证据、源码快照、合并前备份和构建日志在源码树外的 `/Users/macbookpro/Developer/Folia-Migration/upstream-0722/`；不把下载中的不完整 tar.gz 当作源码证据。开始时的个人 Xcode 签名修改已备份并留在本机，不能加入公开源码包。没有自动提交、推送、发布、部署或上传用户文件。

保留了既有 iOS 音频统一图、EQ/分析器/双 deck、网易/QQ/酷狗设备直连、Keychain、文件导入、原生模型、录屏、前端模组、自定义 AI 和 Marcusphotograph 署名。保留 Preview 3 的共享背景、莫奈频谱、帧率调度、触控/安全区修改；没有将歌词动画静态化，也没有强制低画质。

## 官方增量与当前实现

| 官方更新及源码入口 | 本次 iPadOS 接入 | 完成度与差异 |
|---|---|---|
| 花火 Hanabi：`src/components/visualizer/hanabi/` | 完整导入场景、拼贴文字、进出场、烟火、粒子、bloom、调参和智能动感；原 registry 自动注册 | 已实现；动态 WebKit/真机结果见验证报告。没有只保留封面或静态图 |
| 随机歌词池：`visualizer/random/`、`utils/randomVisualizerModes.ts` | 用户选池、避免紧邻重复、reroll、设置导入导出和同步沿用上游 | 已实现；逻辑测试与实际设置交互分别验收 |
| AI 10 个服务商及模型目录：`shared/ai/`、`electron/ai/` | 用 esbuild 将同一官方纯协议客户端编入 ESM；原生设置使用同一 provider preset / model picker；Keychain 注入鉴权 | 已实现；模拟原生桥及 Swift mock 验证；真实模型/配额需用户配置 |
| Anthropic Messages、推理参数、主题竞争修复 | 官方 task/answerTokens/schema/adapter 和 theme generation race 实现保留；原生 POST 同端点、模型 GET 同目录白名单 | 已实现；不能把“兼容接口”推定为任意模型均接受输出 schema |
| QQ 播放重试、试听、数字 ID 详情、匿名搜索、登录保持 | 合入 QQ 3.3.3 路径，设备内 musicu 请求改用原生 HTTPS，无 cookie；保留 429/Retry-After；原 HTTPS CDN 修复仍在 | 已实现待真机；完整音源、试听和权限仍服从上游 |
| 试听偏移：`useLyricReadHead.ts`、`utils/lyrics/lyricSeekTime.ts` | `clipStartMs` 接回歌词时钟、Lattice/API，不篡改音频进度 | 已实现；需实际试听歌曲验证 |
| 汽水：`onlineMusic/qishui/`、`electron/qishui/` | 复用官方钉死的 qishui-music-api 0.2.2，增加浏览器 P-256/MD5 最小边界；设备内 URLSession + 独立 Keychain；扫码、目录/推荐/电台、喜欢/歌单操作、歌词和标准未加密流按原 Omni 能力保留 | 已实现待真实扫码和播放；模拟完整 QR→access code→CSR→ticket→account 通过，不代表上游服务可用性 |
| 分析服务共享 bytes/decode/beat grid、任务期限、分段 stem；本地/Navidrome AutoMix | 合并上游 analysis/scheduler/trackBytes/stemRange；保留 iOS 文件推理桥和取消/暂停路径 | 已实现但存在模型差异，见下节；设备算力/内存待测 |
| Folium 1.7：`src/mods/folium/`、`src/mods/ios/` | 更新 native manifest 权限/实验契约，复用 Omni、replaceQueue、EQ 曲线、account、网易 raw；secret 放 Keychain 独立命名空间，不进入配置导出 | 前端部分已实现；Node-main/RPC 服务端仍未移植，不能声称所有桌面模组通用 |
| Bravais seam/探索墙、再听一次、空状态 | 原布局/交互及 recent/relisten 接口合并 | 已实现待设备交互验收 |
| DSD 扩展识别：元数据与扫描模块 | 导入上游扩展识别；不把识别当成 iOS 解码器 | DSD 原生解码/转码未实现；现有桌面 FFmpeg 不可复制进 iOS |
| 桌面全局快捷键、默认禁 background throttling、GPU/Wayland/Mac 壁纸、Linux Vulkan/MNN | 官方桌面源码完整保留；iOS 仅使用已有 app 内键盘/Stage Manager | iPadOS 无 Electron BrowserWindow、桌面层或任意系统全局快捷键 API；不是删除桌面功能 |
| Docker AI 空模型修复 | 原 `api-ts/`、`deploy/docker/` 保留并重编译 API | 可选外部后端源码，未部署服务；设备内登录仍不要求部署 |

## 分析和模型边界

上游 GPU 四源 WGSL 分段输出和现有 iOS HTDemucs v2 ONNX 三源输出不同。iOS 保留实际原生模型桥、Beat This! 节拍检测及鼓声分析，并共享可共享的轨道 bytes/decode/beat 数据；原生鼓声结果使用独立缓存身份，**不会写入四源共享 stem segment 缓存**。不把更换运行时解释为模型兼容，也不减少前台音效、可视化或 AutoMix 双 deck。

iOS 原生 `stemInference()` 继续作为 AutoMix 的 CPU seam，避免合并后误走 `window.electron`；暂停会清理 deadline。`cached` 智能动感按缓存读取，不为了读取缓存要求安装模型。模型安装、算子/输出及前后台任务仍须设备验收；新桌面 MNN/Vulkan 不能直接在 iOS 调用。

## AI 数据和凭据

用户主动保存自定义连接后，密钥仅由原生 Keychain 保存、原生请求注入；renderer 只拿 metadata/revision。GET 模型目录只能访问已保存连接的同源目录及指定分页参数，不能带编辑器未保存的密钥请求另一主机。改变端点需要重新输入 key。Anthropic 使用原生 `x-api-key` / `anthropic-version`，Gemini 选中的模型也加入原生端点校验。保留 TLS 校验和拒绝跨域跳转。

模型目录只发送连接鉴权；连接测试只发固定 hello。生成主题/AI 分词继续使用原有显式数据传输同意，歌词片段会发往用户配置的 AI 服务；没有新增静默上传本地音频、模型或个人文件。未配置 AI 时保留可选 Folia 后端路线，没有内置公用服务器或服务端密钥。

## 前端模组边界

新增 secrets 声明/读写/状态/变更通知，按 modId 隔离；每个模组最多声明 64 个键、键长 128 字符、值上限 8 KiB，原生存储总体上限 512 KiB。并发写入串行化，读取原生状态后重新核对启用状态；失效/锁定/额度超限明确失败，通知不包含值。前端模组与 App 同属 renderer，不能将此称为恶意 JS 的强隔离沙盒。

需 Node、子进程、native 二进制、main entry 或桌面 RPC server 的模组仍不可在当前 iOS host 执行；已明确拒绝安装 main entry，不显示为成功运行。模组移除后的 secure record 清理和完整 desktop RPC 替代仍需后续实现，不虚称完整 Folium 平台等价。

## 未完成与真机验收

Spotify/YouTube Music 的 iOS 登录和播放桥、本地 DSD 转码、桌面离线/透明导出、Node/native 模组继续列为尚未实现；官方桌面实现保留。公开 iOS SDK 没有桌面壁纸、托盘、鼠标穿透桌面窗口或跨 App 全局热键接口，对应入口按能力隐藏。

真机待验：全部 15 种歌词/6 种背景及全部调参/121 个 Tempera 分镜、花火长歌词/旋转/反复切换、帧率/功耗/内存、三源及汽水登录恢复和试听、连续播放/AutoMix、切后台/锁屏/控制中心上一下一曲与封面、蓝牙/中断/route change、本地文件权限、导出。Mac WebKit 和无签名 archive 不能代替这些结果。

继续开发从本分支和本文件开始，不要重新覆盖已经合并的源码。具体验证结果见 [测试报告](ipados-test-report.md)，完整逐项状态见 [功能表](ipados-feature-matrix.md)。
