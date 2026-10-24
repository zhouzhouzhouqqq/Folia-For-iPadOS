# iPadOS 下载包与自行签名

下载位置：[GitHub Releases](https://github.com/zhouzhouzhouqqq/Folia-For-iPadOS/releases)。本次包为 `ipados-0.7.21-preview.3` 开发预览 3，基于上游 Folia 0.7.21；不改变上游桌面/Docker 的版本流。

| 文件 | 用途 |
| --- | --- |
| `Folia-iPadOS-0.7.21-preview.3-unsigned.ipa` | arm64 iOS Release 构建打包的未签名 IPA，接收者必须自行签名；不是点一下即可安装的公共签名包 |
| `Folia-iPadOS-0.7.21-preview.3-source.zip` | 对应发布提交的完整源码、Xcode 工程、许可证和文档；不附带依赖、模型权重或个人签名 |
| `SHA256SUMS.txt` | 两个压缩包的 SHA-256 校验值 |
| `release-manifest.json` | 对应源码提交、构建与打包验证结果 |

## IPA 安装

当前 App target 的最低版本为 iPadOS 15.6，构建架构为 arm64。这个目标范围不代表所有设备与系统版本都已验证。IPA 使用公开占位 Bundle ID `org.folia.personal`，不包含开发者证书或 provisioning profile。

下载后，需要使用支持自行签名 IPA 的工具，以自己的 Apple 身份配置唯一 App 标识、重新签名并安装。此预编译 IPA 的第三方重签与安装流程尚未真机验证；不能把未签名 IPA 直接拖入设备当成已签名 App。

推荐的源码安装路径是下载源码 ZIP，解压后按 [Xcode 自构建指南](ipados-self-build.md) 安装依赖、运行 `npm run ios:sync`，在 Xcode 选择自己的 Team 与唯一 Bundle Identifier，再对实体 iPad Run。免费 Personal Team 的有效期与数量限制由 Apple 决定。

已安装本地自用版的用户若改用重签工具，应保持原 Team 与 Bundle ID 才可能保留原沙盒；先备份重要数据。不要为了尝试新包卸载旧 App，亦不要共享账号密码、证书或签名私钥。

## 源码对应关系与校验

源码 ZIP 直接由发布提交的 Git tree 导出，不包含 `.git` 历史。GitHub 自动生成的 `Source code (zip/tar.gz)` 也指向同一标签。完整 commit SHA 与文件哈希记录在 Release 附件 `release-manifest.json` 中。

在 Mac 上将两个包与校验文件放在同一目录后执行：

```sh
shasum -a 256 -c SHA256SUMS.txt
```

本次为开发预览 3，App 版本为 0.7.21、构建号为 5。合入上游 0.7.21、保留设备内账号/AI/AutoMix 桥，包含共享背景与莫奈频谱优化、帧率调度和触控布局修正。旧预览保留，最新验证结果见 [Preview 3 说明](ipados-preview3.md)；真实账号与后台等验证边界见下文。

IPA 构建使用 Xcode 26.5 / iOS 26.5 SDK、实际 `App` scheme 与 `Release` 配置，禁用代码签名。打包脚本为 `dev/ipados/package-unsigned-ipa.py`，只打包 App，不包含 archive 的 dSYM、构建缓存或本机项目。Capacitor/WKWebView 使用 App 内前端资源，ONNX Runtime 原生库随构建链接；AutoMix 模型权重另由安装者主动下载或导入，不包含在下载包中。

## 验证边界

发布验证覆盖原生 Release archive、IPA ZIP 结构、arm64 架构、无个人 provisioning profile、App 本地前端资源一致性与源码哈希。没有因此新增真机安装结果，也没有解决所有设备上的后台长播或系统按钮布局。

当前完整歌词和背景代码保留，AI 主题与原版 AutoMix 已接入；后台连续播放、锁屏/控制中心、蓝牙、全部视觉模式性能等仍见 [实际测试报告](ipados-test-report.md)、[功能矩阵](ipados-feature-matrix.md) 与 [真机清单](ipados-device-checklist.md)。任意 Node/native 模组和部分桌面导出功能仍未完成。所有分发继续保留上游 AGPL-3.0 与署名。
