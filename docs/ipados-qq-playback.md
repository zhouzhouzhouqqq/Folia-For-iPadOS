## QQ 音乐登录后播放修复

### 问题

QQ 扫码登录成功后，歌曲和歌词可以显示，但点击播放没有声音。登录、搜索和歌曲详情使用原生 QQ 协议；播放链接最终由 WKWebView 的统一 `HTMLAudioElement` 加载。

### 根因

QQ 的 `music_play` / vkey 响应可能返回 `http://sjy*.stream.qqmusic.qq.com/...`、`http://dl.stream.qqmusic.qq.com/...` 或 `http://*.tc.qq.com/...`。原生 `ProviderHTTP` 会把自己的请求升级为 HTTPS，但它不会改写随后由 WebKit 发起的音频请求。iPadOS 上该 HTTP 音频请求会被 ATS / 混合内容策略阻止，播放器因此保持暂停或静音状态。

QQ 的原生 CDN 选择器已经把可用媒体域名限制为 `*.qqmusic.qq.com` 和 `*.tc.qq.com`。因此修复只在统一播放 URL 归一化层将这两个媒体域族的 `http:` 改为 `https:`，保留路径、查询参数和 vkey；QQ API、图片以及其它未验证域名不做改写。桌面 Electron 的酷狗 HTTP 兼容分支保持不变。

### 修改

- `src/utils/appPlaybackHelpers.ts`：为 QQ 已验证媒体域升级 HTTPS。
- `test/unit/onlineMusic/audioUrlNormalization.test.ts`：覆盖 QQ 两类 CDN、查询参数和非媒体 QQ API 域名。
- `test/unit/onlineMusic/qqProvider.test.ts`：覆盖登录会话下 `music_play` 返回 HTTP CDN 地址时，provider 输出 HTTPS 播放地址。

### 验证

- `npm run typecheck`：通过。
- QQ URL 归一化、provider、transport 和移动直连状态回归：4 个测试文件、153 项通过。
- `npm run ios:sync`：通过，Vite iOS 前端构建及 Capacitor iOS 资源同步完成。
- Xcode 解析到工程 `App` scheme 和 iOS SDK 26.5；`xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphoneos -configuration Debug -destination generic/platform=iOS CODE_SIGNING_ALLOWED=NO build`：`BUILD SUCCEEDED`。

### 真机状态

代码与资源构建通过后，仍需随最新前端资源重新签名安装到实体 iPad 后确认。应按以下顺序测试：

1. QQ 扫码登录并确认登录状态保持。
2. 搜索一首歌曲，点击播放，确认有声并显示歌词/封面。
3. 切换下一首、上一首、暂停/继续，确认同一统一播放器工作。
4. 锁屏、切到其它 App、使用控制中心和蓝牙耳机，确认后台与系统媒体控制。

真机未覆盖前，状态标记为“已修复待真机验证”；不把单元测试或 IPA 构建成功当作 QQ 实播已验收。
