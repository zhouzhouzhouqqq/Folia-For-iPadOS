# Folia iPadOS 0.7.19 · 开发预览 2

本次更新在开发预览 1 的基础上加入 QQ 音乐和酷狗音乐设备直连扫码登录。仍为持续完善中的社区适配版，非原作者官方发行版。

## 更新内容

- **QQ 音乐／酷狗音乐扫码登录**：复用原版音源与账号界面，iPad 端对应 API 地址留空时直接连接音乐厂商，无需单独部署 API，也无需让 Mac 常开。原远程模式继续保留。
- **登录保持与退出处理**：直连会话保存到安装级 Keychain，加入登录过期、退出与迟到确认处理。真实账号确认、设备重启保持、歌单和实播仍待真机验收。
- **构建与安装说明**：补充 Xcode 因 GitHub 下载超时保留旧失败包图的恢复步骤；本机 Xcode 已重新解析并成功 Build。公开源码去除个人签名配置。
- 继续保留原有歌词动画、动态背景、自定义 AI 主题、EQ／音效与原版 AutoMix 代码；本次没有减少视觉效果或替换播放器。

## 下载与安装

- `Folia-iPadOS-0.7.19-preview.2-unsigned.ipa`：arm64 Release 构建，最低 iPadOS 15.6。**未签名，需使用自己的 Apple 身份重新签名后安装**，无法直接点开安装。
- `Folia-iPadOS-0.7.19-preview.2-source.zip`：对应发布提交的完整源码、Xcode 工程、许可证和安装文档。推荐 Mac 用户通过 Xcode 自行构建。
- `SHA256SUMS.txt`：校验下载文件；`release-manifest.json`：源码提交、构建信息和文件 SHA-256。

已有用户请保持原 Team 与 Bundle ID 覆盖安装，先备份重要数据，避免卸载旧 App。QQ／酷狗若之前配置过远程地址，清空对应地址并重载以启用设备直连；需用另一设备的对应官方 App 扫码。

[安装指南](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/blob/ipados-0.7.19-preview.2/docs/ipados-self-build.md) · [QQ／酷狗指南](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/blob/ipados-0.7.19-preview.2/docs/ipados-qq-kugou-direct.md)

## 验证与已知限制

- QQ／酷狗相关 11 文件、310 项测试和 TypeScript 检查通过；真实匿名上游及 Mac WebKit 的二维码／等待链路通过。
- Web/PWA、Capacitor 同步与 iOS arm64 构建已有通过记录；本次另对公开源码执行 iOS 同步、Release archive 与 IPA 结构／资源校验，详见附件发布清单。
- **尚未验证真实账号扫码确认、iPad Keychain 冷启动、账号歌单及实际播放**。不能把匿名取码成功当作完整账号验收。
- 后台长播、锁屏／控制中心、蓝牙、中断恢复、全部视觉模式的真机性能仍待验收；第三方 IPA 重签安装亦未验证。任意 Node/native 模组、部分桌面导出尚未实现。
- 不提供会员、版权、地区或厂商风险控制绕过。AutoMix 模型不随包分发，由使用者主动下载或导入。

[实际测试报告](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/blob/ipados-0.7.19-preview.2/docs/ipados-test-report.md) · [完整功能矩阵](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/blob/ipados-0.7.19-preview.2/docs/ipados-feature-matrix.md)

基于 [chthollyphile/folia-major](https://github.com/chthollyphile/folia-major) 0.7.19，保留上游署名与 AGPL-3.0 许可证。
