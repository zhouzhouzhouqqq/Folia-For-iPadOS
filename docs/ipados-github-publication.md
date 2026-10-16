# GitHub 源码发布说明

发布目标：https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS

这是基于上游 Folia 0.7.19 的 iPadOS 开发快照，非官方稳定发行版。上游源码、AGPL-3.0 许可证、贡献者与署名均保留；原 README 保存为根目录 `README-upstream.md`。GitHub 首页沿用仓库所有者已编写的 `README.md`。iPad 使用入口为 [README-ipadOS.md](../README-ipadOS.md)，构建步骤见 [自构建指南](ipados-self-build.md)。

此副本通过源码导出器生成，不包含本机 Git 历史、依赖、模型权重、构建产物或私人签名。Team ID 已移除，Bundle Identifier 恢复为 `org.folia.personal`，安装者需配置自己的标识与签名。本机原工程未更改。原作者的桌面发布、定时任务与自动分诊工作流保存在 `.github/upstream-workflows/`，供参考而不自动执行；没有新增在线部署、IPA Release 或后台服务。

代码与验证状态见 [实际测试报告](ipados-test-report.md) 与 [完整功能矩阵](ipados-feature-matrix.md)。最近系统上一曲/下一曲按钮修正已通过 845 项相关测试、macOS WebKit、Web/PWA 构建、Capacitor 同步和 iOS arm64 无签名构建，但控制中心实际图标、后台长播、蓝牙及中断恢复仍待新版真机复验。完整歌词和背景代码保留不等于每种模式已在每台 iPad 上验收。

无需上传本地音频或账号来安装；网易云默认设备直连。AI 使用用户自行配置的端点，会向该端点发送选定歌词等分析输入，详见 [AI 指南](ipados-ai.md)。AutoMix 模型需安装者自行获取并核对许可，详见 [AutoMix 指南](ipados-automix.md)。

公开源码仍沿用上游 AGPL-3.0，不承诺所有桌面模组、桌面导出或最高画质性能；不提供绕过会员、版权或地区限制的能力。
