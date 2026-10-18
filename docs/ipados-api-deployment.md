# iPadOS API 配置与服务端部署

**网易云、QQ 音乐和酷狗音乐在 iPad 默认均无需部署 API。** QQ/酷狗实现与验收范围见 [设备直连扫码](ipados-qq-kugou-direct.md)。

网易云默认由 App 内置设备直连，Swift 替换桌面 Node 请求/加密/会话层，主界面和全部视觉资源仍本地打包。请将网易云远程地址和 `VITE_NETEASE_API_BASE` 留空。仅在你主动选用远程服务时，才需要该源的部署配置。详见 [直连实现](ipados-netease-direct.md)。

**自定义 AI 也无需部署 Folia API。** 在「设置 → 连接与集成 → 自定义 AI 接口」填写个人 HTTPS 接口、模型和 Key，详见 [AI 配置](ipados-ai.md)。下方 AI 环境变量仅用于选择自托管后端的用户；不要把服务端私有 Key 放进前端构建变量。

下文是其他源、可选 AI 后端、同步、外部联动以及网易云可选远程覆盖的配置说明，不是网易云、QQ 或酷狗扫码的前置步骤。仓库有服务端源码不等于存在公共实例；本次未部署外部服务、使用账号或上传个人文件。

## 客户端地址

可复制根目录 `.env.ios.example` 到 `.env.ios.local` 再构建，或直接在 iPad「设置 → 连接与集成 → iPad 服务连接」填写。保存会重载 App，避免旧账号/连接继续发往新地址；应先停止录屏、保存编辑。更换已有服务时，先在旧服务退出登录。原生 provider 凭据与缓存按 backend URL 分区；网易云、QQ、酷狗直连使用各自独立 device-direct-v1 分区，会话另存本安装 Keychain。

| 配置项 / 设置字段 | 应填写 | 不填写时 |
|---|---|---|
| `VITE_FOLIA_API_BASE` / Folia | 根地址，例如 `https://folia.example.invalid`；有反代前缀则包含前缀 | 未设个人 AI Key 时，AI 后端/歌词代理报未配置；个人 AI 直连与本地视觉不依赖它 |
| `VITE_NETEASE_API_BASE` / 网易 | 增强 API 根地址；现有 Docker 网关例 `https://folia.example.invalid/netease` | 使用内置设备直连，无需服务 |
| `VITE_KUGOU_API_BASE` / 酷狗 | KuGou API 根地址；Docker 网关例 `/kugou` 的完整 HTTPS URL | 使用内置设备直连，无需服务 |
| `VITE_QQ_API_BASE` / QQ | 内置 serverless 为 `https://folia.example.invalid/api/qq`；Docker 网关为 `https://folia.example.invalid/qq`；独立 Node 是其根地址 | 使用内置设备直连，无需服务 |
| `VITE_BODIAN_API_BASE` / 波点 | 本次提供的网关根地址，例如 `https://bodian.example.invalid` | 波点不显示为已配置 |
| `VITE_NOWPLAYING_API_BASE` | 原 Now Playing 服务的 HTTPS 反代根地址 | 不使用 iPad localhost 连接 Mac |
| `VITE_PLAYERCAP_API_BASE` | 原 PlayerCap 服务的 HTTPS 反代根地址 | 不使用 iPad localhost 连接 Mac |
| Navidrome | 原有 Navidrome 面板填写 HTTPS 服务器/用户名/密码 | 不从 Docker 预置读取个人凭据 |
| 同步 | 原同步设置填写自己的同步服务器 | 不自动上传本地数据 |

以上域名是不可用的示例，不是实例。原生配置拒绝 HTTP、相对地址、URL 用户名/密码、query、fragment。Folia base 后仍由代码追加 `/api/...`；不要误填成 `https://host/api` 导致 `/api/api/...`。QQ 独立填写其完整 API base；不要给 native 写 `/api/qq` 这样的相对路径。运行时设置优先于构建配置，空值回退构建配置。

`VITE_*` 会进入 App，可放服务地址与 AI provider 选项；不可放服务端密钥、账号 Cookie、Token、Team ID。服务端 `.env` 也不要复制到 App。

## 源码中实际存在的服务

| 服务 | 源码/依赖 | 可部署位置 | 本次状态 |
|---|---|---|---|
| Folia AI/歌词代理 | `api-ts/*`、`worker/*`、Docker backend | 原 Vercel / Cloudflare / Node Docker；见已有配置 | 保留，native URL 已适配；未部署 |
| QQ | `api-ts/qq.ts`、`worker/qq.ts`、`deploy/docker/qq-api`；qq-music-api 3.3.1 | Vercel / Worker；QQ QR 另需 DO 或常驻 Node/Docker | iPad 默认设备直连；此行是可选远程服务；真实账号待验收 |
| 网易 | `deploy/docker/netease-api/package.json`；原增强 Node API | 现有 Docker 栈或单独 Node 后端；不能把 iOS 当 localhost 服务器 | 可选远程覆盖；默认不需要 |
| 酷狗 | `deploy/docker/kugou-api/package.json`；KuGouMusicApi 1.6.0 | 现有 Docker 栈或单独 Node 服务 | iPad 默认设备直连；此行是可选远程服务 |
| 波点 | `deploy/ipados-bodian`；bodian-music-api 0.1.2 | 常驻 Node 24 + HTTPS 反代；本次没有编写 Worker 版本 | 已完成可选网关和本地无账号 smoke，未真实上游联调 |
| 同步 | `sync-server/src`、独立 `sync-server/wrangler.toml`、Docker sync | Node/SQLite 或 Worker/D1；不是 Folia worker 自动附带的同一个服务 | 待用户配置 |
| Navidrome | 现有用户服务器；App OpenSubsonic 客户端 | 你已有/另建的 HTTPS 服务器 | 不在 App 内启动 |

完整 capability 见 [源码在线清单](ipados-online-capabilities.md)。不要将可部署到 Vercel 的 QQ/AI 等同于网易、酷狗也已经部署。没有验证过任何公共 API 默认地址。

## 复用现有 Docker 栈

从 [Docker 原文档](../deploy/docker/README.md) 开始。原 `compose.yaml`、`compose.build.yaml`、镜像与版本参数保持原样。它们在服务器运行，不在 iPad 运行。网关原路由是 `/netease/`、`/kugou/`、`/qq/`、`/api/`，确认健康检查与域名 TLS 后再填客户端。

可在自己的反代参考 [Nginx 模板](../deploy/ipados/https-proxy.conf.example)。需要替换证书/域名/上游端口并在自己的服务器上检查配置；本次没有执行。模板保留 HTTPS、明确 origin/headers 和 WebSocket Upgrade，日志不记录 query。请结合原栈访问控制，仅对自己使用。CORS allowlist 不是鉴权。

## Vercel / Cloudflare

原 [QQ 部署说明](qq-music-deployment.md) 已详细列出 `QQ_SESSION_SECRET`、回滚/轮换、Cloudflare Durable Object 和 Node 登录态持久化。本次没有改写这些协议或申请云资源。

- Vercel 原 `vercel.json` 将 `/api/qq/:path*` 路由到处理器。iPad QQ base 应是完整 `https://域名/api/qq`。
- 默认 Vercel/Worker 支持微信扫码；QQ 扫码需要在二维码有效期保留 MQTT 连接，按原文档启用 DO 或选 Node。渠道以 `/login/channels` 返回值为准。
- AI 用自己的服务端 `GEMINI_API_KEY` 或 `OPENAI_API_KEY` 等原配置，绝不加 `VITE_` 前缀。Cloudflare 使用原项目 secret 配置流程；没有代你创建或部署。
- `.env.ios.local` 的 `VITE_AI_PROVIDER` 按原 getter 选择 Google/OpenAI；请求的歌词/歌名在 native 首次每会话和目的地会先确认，后端可能再发给其配置的 AI 服务。不会上传本地音频用于模型分析。
- serverless Cookie/opaque session 的密钥必须稳定，轮换按原方案处理；否则现有登录会失效。

## 波点可选 HTTPS 网关

该网关只是现有 Node 包的远程 transport，未新增音乐源或编造 API。只能在自己的受控服务使用；不要当公开多人服务。它保留扫码、用户歌单/专辑/喜欢、搜索、歌曲详情/音频/歌词、推荐/FM、歌单增删等原包操作。

在你授权部署的服务器目录中：

```bash
cd deploy/ipados-bodian
npm ci --ignore-scripts
cp .env.example .env
# 在服务器本地生成并填写 BODIAN_SESSION_SECRET；不要贴到聊天或客户端。
openssl rand -hex 32
node --env-file=.env server.mjs
```

默认只监听 `127.0.0.1:4305`，通过自己的 HTTPS 反代。对 iPad 填网关根地址；客户端 POST `/request`，body `{operation,params}`，会话通过 `X-Folia-Bodian-Session` 传递。不要把该值放进 URL 日志。

- `BODIAN_SESSION_SECRET` 是固定 32 字节随机 hex；会话以 AES-256-GCM 加密存在 `BODIAN_DATA_DIR`，不是前端密钥。
- `BODIAN_ALLOWED_ORIGINS` 默认 `capacitor://localhost`；按自己 Web 调试域名显式扩展，拒绝未知 origin。native HTTP 不一定携带 Origin，仍需反代访问控制。
- 单请求 64KiB、operation allowlist、参数标量校验、120 请求/分钟/会话、30 天有效期、最多256个内存 host。它不是面向公网攻击的完整账号平台；反代应有访问限制和总请求限制。
- 过期磁盘会话文件不会自动定时清理；管理员应清理过期文件并保管密钥/备份。换密钥将使旧会话无法解密，需要重登。
- `login_status` 只读已恢复会话；未用真实账号验证过扫码、权限、会员音频或写入接口。
- 本地 smoke：`node dev/ipados/bodian-smoke.mjs`，只用 login_status/logout，不访问音乐上游。测试创建的临时目录会移除。

## CORS、Cookie、音频与跳转

CapacitorHttp/Cookies 启用以适配 API 请求和系统 Cookie jar；这**不会代理 HTMLAudioElement、图片、WebGL 纹理、iframe 或 WSS**。音频元素仍带 `crossOrigin="anonymous"`，CDN 必须给合适 CORS 头、TLS、Range/206 和 Content-Type，才能既播放又进入完整 Web Audio graph。若源只给 HTTP 音频，不能通过全局 ATS 放行解决；需实际允许的 HTTPS 链接或经过用户选择的受控中继，并明确流量/凭据去向。未添加任意 URL 开放代理。

服务器需按真实请求允许 `capacitor://localhost`、OPTIONS、GET/POST 和 `Content-Type`、`X-QQ-Session`、`X-Folia-Bodian-Session` 等实际头；使用带浏览器 credentials 的请求不能搭配 `Access-Control-Allow-Origin: *`。QQ native 使用裸 opaque token 的 `X-QQ-Session`，不是整串 Cookie。仅在选择远程服务时，网易/酷狗保留原包 Cookie 参数协议，反代和上游日志应去 query/凭据；没有伪造未经验证的新 header 协议。

扫码登录使用原轮询/取消/过期流程，不需要一个假造的 OAuth callback。若服务端实际返回外部跳转，需分别验证在 WKWebView/Safari 的行为与回到 App 的状态；本次没有新增 URL scheme 登录回调。

Now Playing / PlayerCap 的外部连接从配置 HTTPS 推导同 base 的 WSS；配置 Mac 的真实可达域名，反代保留 WS Upgrade 和 path prefix。不要填写 iPad 自己的 `127.0.0.1`。对这些可控播放的服务也需要访问控制。

出现 401/过期：先在原账号界面重新登录；不要清空整个 App 数据作为首选。更换服务地址会进入不同的凭据命名空间。403 可能是 origin、代理规则、权限或上游限制；404 可能是 base/path 重复或后端版本缺路由；成功返回 HTML 登录页不等于 API 成功。
