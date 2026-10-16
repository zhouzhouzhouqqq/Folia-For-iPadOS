# 当前源码的在线能力清单

以下是四个 provider 的**实际 capability 声明**，仅说明上游 Folia 代码有对应路径，不表示本次已经用真实账号在 iPad 验收。运行时 availability、账号权限、后端版本、地区和版权仍决定可用性。普通 UI 继续经 Omni；没有新增音乐源。

## netease

iPad 默认为设备内直连，不需要部署 API；[实现与验证](ipados-netease-direct.md)。下面是桌面/远程 provider 的原能力声明。设备直连中 **playlistSubscription 与 playbackReports 当前返回 false**：Watchman v2 与 NCBL 尚未实现，显式配置远程 API 或桌面模式仍保持原值。普通歌单读取/增删歌曲、红心、专辑收藏等映射保留，未用真实账号验证写操作。

来源：`src/services/onlineMusic/neteaseProvider.ts`。

```ts
capabilities: {
        search: true,
        playback: true,
        lyrics: true,
        auth: true,
        userLibrary: true,
        playlists: true,
        albums: true,
        artists: true,
        recommendations: true,
        mutations: true,
        personalFmModes: true,
        wordByWordLyrics: true,
        userCloud: true,
        historyRecommendations: true,
        playlistSubscription: true,
        playlistTrackMutations: true,
        likes: true,
        userAlbums: true,
        playbackReports: true,
}
```

## kugou

来源：`src/services/onlineMusic/kugouProvider.ts`。

```ts
capabilities: {
        search: true, playback: true, lyrics: true, auth: true, userLibrary: true,
        playlists: true, albums: true, artists: true, recommendations: true, mutations: true,
        wordByWordLyrics: true, userCloud: true, historyRecommendations: true,
        playlistSubscription: true, playlistTrackMutations: true, likes: true, userAlbums: true,
}
```

## qq

来源：`src/services/onlineMusic/qqProvider.ts`。

```ts
capabilities: {
        search: true,
        playback: true,
        lyrics: true,
        auth: true,
        userLibrary: true,
        playlists: true,
        albums: true,
        artists: true,
        // 推荐、歌单增删与收藏歌单是 qq-music-api 3.3.0 的路由，红心与收藏专辑是 3.3.1 的。
        recommendations: true,
        mutations: true,
        playlistTrackMutations: true,
        playlistSubscription: true,
        wordByWordLyrics: true,
        likes: true,
        userAlbums: true,
}
```

## bodian

来源：`src/services/onlineMusic/bodianProvider.ts`。

```ts
capabilities: {
        search: true, playback: true, lyrics: true, wordByWordLyrics: true, auth: true,
        playlists: true, albums: true, artists: true, recommendations: true,
        userLibrary: true, userAlbums: true, likes: true, mutations: true, playlistTrackMutations: true,
}
```

## 审计边界与登录

- 四源保留搜索/详情、播放 URL、歌词/封面、账号、歌单、专辑/歌手与声明的写入操作；具体实现仍以 provider 与 transport 路由为准。
- 网易/酷狗还声明 userCloud、历史推荐；网易 playbackReports、personalFmModes；QQ 未声明这些能力，不能因其他源有就假造接口。
- QQ 原实现含微信/QQ QR channels、日推/私人 FM/推荐歌单、歌单增删/订阅、红心和专辑收藏；写操作必须按原规则回读。默认 Vercel/Worker 不维持 QQ 扫码 MQTT，DO/Node 才可提供对应 channel。
- 波点只代理 bodian-music-api 的 BODIAN_OPERATIONS 现有操作；login_status 读取恢复的本地会话，不声称进行了实时远端鉴权。账号接口拒绝后由原 provider 处理过期。
- 当前扫码流程通过 key/create/check/cancel 轮询，扫描需另一台登录音乐 App 的设备；没有凭空新增 OAuth callback。源的跳转/二维码有效期仍需实际设备测试。
- Navidrome 独立于四源 provider 注册，`src/services/navidromeService.ts` 的扩展探测决定 OpenSubsonic lyrics/scrobble 等能力；不承诺服务器未声明的扩展。
- 原在线错误分类仍区分网络、超时、认证、会员/购买、地区、下架/试听；不绕过会员或地域限制。
- 客户端登录保持按 backend URL 分区；更改地址保存会重载。网易云直连原生 Cookie/交换密钥保存在本安装 Keychain；现有 provider 仍会在页面存储登录返回值，可信前端模组仍可接触页面账号数据。其他源未迁移 Keychain。
- 网易云确切 Swift 核心已在 Mac 发起匿名真实上游请求（不使用用户账号），二维码 key/搜索等结果见新验证报告。这不是 iPad 扫码确认、CDN 实播或写操作通过；其他源仍需各自后端与用户自行登录验收。
