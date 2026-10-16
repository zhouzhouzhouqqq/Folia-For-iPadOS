# iPad 上一曲 / 下一曲

2026-10-16。修复 iPad 播放时底栏自动收起、切歌箭头依赖鼠标悬浮导致触屏无法发现入口的问题。

有当前曲目时，iPad 原生 App 的底部播放条保持展开，曲名左右显示上一曲 / 下一曲，点击区域均为 44×44 CSS px。接入鼠标或触控板后仍保留这两个入口；普通 Web 触屏也采用此行为。窄分屏展开时改用较小圆角，避免多行控制布局的底部时间被胶囊边缘裁切。桌面细指针保留原来的收起/悬浮展开、预览曲名和切歌确认动画。用户显式隐藏整条控制栏或开启播放页自动隐藏时，原设置仍有效。

按钮调用现有 `handlePrevTrack` / `handleNextTrack`，不建立另一套队列或播放器：

- 队列中间正常前后切换；列表循环按原规则首尾相接。
- 非列表循环到头/到尾时，对应按钮置灰。单曲队列没有相邻曲目时不可切换，应先从歌单播放或将多首加入队列。
- 私人 FM、当前曲不在队列、远程 Stage 控制限制由原邻居解析和播放控制处理，不猜测下一首。
- AutoMix 进行中仍以用户正在看到/听到的曲目为切换基准，沿原逻辑结束持有转场，避免多跳一首。
- 触摸不会触发模拟鼠标的曲名悬浮预览；真实鼠标预览保留。点击箭头阻止向播放条冒泡，不误触页面导航。
- 不改自定义槽位、音频会话、锁屏/耳机远控、模型或歌词/背景效果。

## 代码和验证

入口：`src/components/FloatingPlayerControls.tsx` → `floating-player/TrackTitleNavigator.tsx`。能力判断复用 `useSupportsFinePointer` 和统一 `platform/capabilities.isNativeIOS`，不使用 UA 或屏幕宽度猜设备。

- `test/component/trackTitleNavigatorTouch.spec.ts`：实际组件 + 合成异步队列，在 macOS WebKit 检查无 hover 可见、44px 点击、前/后切换、队列边界置灰、点击不误导航、横竖屏与375px窄视口、iPad接细指针仍可切换。
- 最终窄分屏圆角修正后，两项触屏用例另行复验通过，见 `track-switch-touch-final.log`。
- 原 `trackTitleNavigator.spec.ts`：桌面命中、悬浮预览、StrictMode、异步切歌不闪旧标题、确认窗口、常驻开关共6项回归。
- 播放/AutoMix/原生媒体桥共48文件822项单测，以及typecheck通过。
- 原Web/PWA构建、iOS资源构建/Capacitor sync、App scheme/iphoneos26.5/arm64无签名build通过。证据见 `docs/ipados-validation/track-switch-*`。

构建时可选的提交版本命名查询，其两秒超时现覆盖响应正文读取，避免服务器仅返回响应头后阻塞构建；查询失败仍沿用原有回退。

复测浏览器：

```sh
npx playwright test -c dev/ipados/transport/playwright.config.ts
```

本机只使用macOS WebKit、原组件与合成队列，不使用个人账号/音频；它不代替实体iPad的实播、锁屏、蓝牙和转场听感验证。更新时保留原Team/Bundle ID，在Xcode选择iPad并Run覆盖安装；无需卸载或重新部署API。

## 真机待验收

- 普通歌单至少三首：上一曲/下一曲、暂停中切换、连续点按；列表循环/不循环首尾状态。
- 横屏、竖屏、分屏、连接/断开触控板；默认设置无需悬浮或修改实验室开关。
- AutoMix准备中/转场中手动切歌，显示/歌词/音效与目标曲一致。
- 锁屏、耳机/蓝牙下一曲仍接原统一transport；后台播放状态继续按此前专项文档验收。
