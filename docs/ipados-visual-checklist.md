# 全部视觉模式与效果验收清单

基线：Folia 0.7.21 / 33b25ff。以 `src/types/visualizerModes.ts`、`visualizer/registry.tsx`、`backgrounds/registry.tsx`、`tuningRegistry.ts` 和真实 entry 为准。当前 **14 个歌词模式 + 6 个背景 entry 全部参与本地构建**，没有按设备屏蔽 renderer，没有将动态效果换成静态图。

本表的真机空框均未验收。0.7.21 的 macOS WebKit 历史检查曾挂载 14 种歌词和 6 种背景，并检查旋转 resize、卸载和截图；另覆盖四项 Nomand 后处理、两项 Latent 显示变体，共 26 个场景。URL 背景初次受开发脚本和 Playwright 的 Service Worker 拦截注入影响；改用无注入的静态夹具并取消测试框架的沙盒拦截后，单独复测无 pageerror/console error 且动态像素有变化。挂载与像素变化不代表所有参数、分镜或实体 iPad 的视觉等价、帧率和功耗已通过。

机器清单：[ipados-visual-inventory.json](ipados-visual-inventory.json)，含每个模式源码路径/SHA256/import/局部 tuning 属性观察、共享 Tuning 定义和默认值、121个 Tempera shot ID。运行 `npm run ios:audit` 重建；脚本校验实际 entry 与声明列表一致。清单包含参数定义，不代替像素效果检查；共用 helper 的最终行为仍须按源码/真机判断。

## 设备与比较方法

记录设备型号、芯片、内存规格（已知时）、iPadOS 版本、屏幕刷新率、横竖屏/窗口尺寸、画质/电源模式、歌曲/歌词格式与字体、音频来源。用同一歌曲/歌词、同一时间点、同一主题与参数在原桌面版对照；动态效果要录一段转场，不能仅凭一张截图。

每个模式至少检查：逐行及实际支持的逐字歌词、中日韩/拉丁/emoji、空/无歌词/纯音乐、长行、译文、空拍/重叠时间、seek/暂停/快进/切歌；所有设置从最小/默认/最大值与枚举逐项调节、保存重启及视觉配置导入导出；预览/正式播放一致性；日夜/主题切换；横竖屏、分屏、Stage Manager resize；切入切出30次观察 context/纹理/RAF/事件 listener 是否累积。

不要给原本没有逐字输入的模式凭空增加功能保证；测试其源码实际支持的路径即可。`still` 是原有模式名，不是移植降级开关。完整效果始终可选，未新增强制 iOS 低画质或强制静态模式。

## 注册表逐项

| 待验 | 模式 | 源码与依赖 | 当前实现/证据 | 真机结果/差异 |
|---|---|---|---|---|
| [ ] | 歌词 `cadenza` | `src/components/visualizer/cadenza/entry.tsx`；DOM/Canvas、文字测量、RAF | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `cappella` | `src/components/visualizer/cappella/entry.tsx`；DOM/Motion、IndexedDB 自定义头像与 emoji | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `claddagh` | `src/components/visualizer/claddagh/entry.tsx`；环状行、pretext、音频分析/RAF | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `classic` | `src/components/visualizer/classic/entry.tsx`；DOM/Motion、GlowWord | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `diorama` | `src/components/visualizer/diorama/entry.tsx`；Three.js、React Three Fiber、文字栅格化、粒子 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `fume` | `src/components/visualizer/fume/entry.tsx`；Canvas/DOM、测量、RAF | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `hanabi` 花火 | `src/components/visualizer/hanabi/entry.tsx`；Pixi、字形纹理、烟火粒子、bloom、beat FX、拼贴转场 | 0.7.22 原动态实现和全部参数已编入；本轮 WebKit 结果见报告 | 未执行 |
| [ ] | 歌词 `lumiere` | `src/components/visualizer/lumiere/entry.tsx`；Pixi.js、滤镜、纹理、full/balanced/low tuning | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `monet` | `src/components/visualizer/monet/entry.tsx`；DOM、音频 overlay、图像处理、歌词 rail | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `partita` | `src/components/visualizer/partita/entry.tsx`；DOM/Motion、GlowWord | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `pendolo` | `src/components/visualizer/pendolo/entry.tsx`；WebGL2；源码已有 Canvas2D fallback | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `sonnet` | `src/components/visualizer/sonnet/entry.tsx`；Pixi.js、滤镜、文字纹理 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `still` | `src/components/visualizer/still/entry.tsx`；DOM、原布局/转场 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `tempera` | `src/components/visualizer/tempera/entry.tsx`；Pixi.js、121 种 shot、纹理/滤镜 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 歌词 `tilt` | `src/components/visualizer/tilt/entry.tsx`；DOM/Motion、透视变换 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `common` | `src/components/visualizer/backgrounds/common/entry.tsx`；封面流体、几何形状、音频 analyser、CSS 合成 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `latent` | `src/components/visualizer/backgrounds/latent/entry.tsx`；Canvas/shader、dithering / mesh / both | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `monet` | `src/components/visualizer/backgrounds/monet/entry.tsx`；图像、画布与原装饰 | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `nomand` | `src/components/visualizer/backgrounds/nomand/entry.tsx`；@paper-design/shaders-react、WebGL | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `sora` | `src/components/visualizer/backgrounds/sora/entry.tsx`；WebGL starfield；用户可选 blank | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |
| [ ] | 背景 `url` | `src/components/visualizer/backgrounds/url/entry.tsx`；iframe、第三方 CSP / X-Frame-Options | 原实现已编入 bundle；macOS WebKit 已挂载，待真机 | 未执行 |

## 子模式、共享特效和资源

| 待验 | 组合/参数 | 检查重点 |
|---|---|---|
| [ ] | common FluidBackground 全部流体/封面色选项 | 原 Safari/iOS 软焦点/合成修复未删；封面加载/换图、透明度/模糊、没有白闪 |
| [ ] | common 几何/音频响应设置 | 全部形状、尺寸、数量、变化参数与 analyser 输入，暂停和静态模式是用户选择 |
| [ ] | latent dithering | 抖动粒度、速度/音频速度、opacity、封面/主题色 |
| [ ] | latent mesh | 扭曲、swirl、速度、叠层和音频响应 |
| [ ] | latent both | 两条动态路径同时运行，组合 alpha 不被 WebKit 合成吞掉 |
| [ ] | nomand dithering | GLSL、音频/颜色/粒度参数 |
| [ ] | nomand fluted-glass | 玻璃折射/纹理尺寸与透明度 |
| [ ] | nomand paper-texture | 纸纹、速度与字体前后层 |
| [ ] | nomand halftone-dots | 网点/旋转/阈值与 DPR |
| [ ] | nomand lens-distortion | 镜头形变、resize/纹理边界 |
| [ ] | monet 背景及歌词内嵌图像/装饰 | 自定义图片池、封面、缺图、图片切换与清理 |
| [ ] | sora 星空及原 blank 选项 | 动态星点/调参；暂停不继续无意义绘制，用户主动 blank 可恢复 |
| [ ] | url HTTPS 嵌入背景 | 动态目标站 CSP/X-Frame-Options/网络；记录具体 URL，不能测空 iframe 便打勾 |
| [ ] | lumiere full | 光场、烟雾、浮尘、bloom/text bloom、镜头/过渡、纹理清理 |
| [ ] | lumiere balanced / low | 由用户选择；按原 profile 对照，文字清晰度、回 full 无丢失；不作为强制移动版 |
| [ ] | pendolo WebGL2 与原 Canvas fallback | 可用能力的路径一致；降级必须记录上下文失败原因，不人为强制 fallback |
| [ ] | diorama Three/R3F | 相机、粒子、文字材质、深度/透明、旋转和 context lost |
| [ ] | sonnet Pixi | glyph/滤镜、时间线、transitions、字体纹理尺寸、k3panel 倍率 |
| [ ] | tempera Pixi | 全分镜、difference/filter、半透明/镂空、图池、相机/剪辑/过渡 |
| [ ] | mask/filter/glow/blur | 正文、译文、逐字遮罩，CSS -webkit-mask/合成/CSS filter/Canvas/Pixi 逐层对照 |
| [ ] | 字体导入与重测量 | woff2/woff/ttf/otf，字体加载后布局、emoji fallback、冷启动 |
| [ ] | 主题/配色/日夜/AI 主题 | 颜色过渡与视觉配置短码往返；AI 先确认文本传输并配自有服务 |
| [ ] | Grid/Lattice/Bravais/主页/Ponder | 曲库墙、封面动效、进出场/层级、触摸、滚动、虚拟键盘、分屏 |

## 原参数定义检查

下面从真实共享 interface 提取属性名。每组对照 `src/types.ts` 中类型、默认值、设置卡片及 JSON inventory 的完整 declaration。对枚举逐值、对数值最小/默认/最大值、对布尔开关双向测试；依赖同一渲染器的高级参数也不能因 UI 折叠而漏测。

- [ ] `ClassicTuning`：`enableWordRotation`, `breathingFloatMultiplier`, `useLegacyLayout`, `wordSpacing`。
- [ ] `CadenzaTuning`：`fontScale`, `widthRatio`, `motionAmount`, `glowIntensity`, `beamIntensity`。
- [ ] `PartitaTuning`：`showGuideLines`, `useSemanticLayout`, `staggerMin`, `staggerMax`。
- [ ] `FumeTuning`：`hidePrintSymbols`, `disableGeometricBackground`, `backgroundObjectOpacity`, `textHoldRatio`, `cameraTrackingMode`, `cameraSpeed`, `glowIntensity`, `heroScale`。
- [ ] `CladdaghTuning`：`focusScaleRatio`, `radiusScale`, `ellipseTiltDeg`, `showAxisLine`, `letterSpacingOffset`。
- [ ] `CappellaTuning`：`showEmoMessages`, `emojiPackSource`, `avatarSource`。
- [ ] `TiltTuning`：`splitProbability`, `tiltStyleProbability`, `colorScheme`。
- [ ] `PendoloTuning`：`arcRadius`, `arcAngleDeg`, `wheelCenterX`, `wheelCenterY`, `tickSnappiness`, `activeScale`, `showGearDecor`, `showCenterGradient`, `showCoverOnWatchFace`, `enableLineGlow`。
- [ ] `SonnetTuning`：`cameraIntensity`, `typographyMotion`, `mgDensity`, `showOnlyText`, `showGuide`, `showBackgroundMg`, `showFixedGeo`, `showGiantDecorativeText`, `showBackgroundDecor`, `enableTransitions`, `outerFrameMode`, `textureResolution`, `postProcessEnabled`, `postProcessGrain`, `postProcessContrast`, `postProcessRgbShift`, `postProcessHalftone`, `postProcessVignette`, `postProcessLensDistortion`, `postProcessLensDispersion`。
- [ ] `TemperaTuning`：`cameraIntensity`, `glyphMotion`, `wholeLineLyrics`, `glyphSettleStretch`, `colorMode`, `showBlocks`, `showDecor`, `showCornerMarks`, `textInversion`, `layerImages`, `layerImageDepth`, `layerImageFrequency`, `enableTransitions`, `textureResolution`, `postProcessEnabled`, `postProcessTextureCompression`, `postProcessGrain`, `postProcessContrast`, `postProcessRgbShift`, `postProcessVignette`, `postProcessLensDistortion`。
- [ ] `LumiereTuning`：`lightIntensity`, `audioResponse`, `fogDensity`, `darkField`, `moteAmount`, `bloom`, `textBloom`, `unlitOpacity`, `windowNeighbors`, `decay`, `echo`, `fogOctaves`, `lineArt`, `frontBokeh`, `trails`, `hideTrails`, `seamlessTransitions`, `overlayFrame`, `textOnly`, `keywordColors`, `themeIcons`, `themeColorMix`, `renderQuality`。
- [ ] `DioramaTuning`：`cameraSpeed`, `motionAmount`, `audioReactivity`, `geometryVisibility`, `particleDensity`, `particleScale`, `particleGlowEnabled`, `particleGlowIntensity`, `showParticles`, `backgroundParticleCircumference`, `backgroundParticleRadial`, `glowEnabled`, `glowIntensity`, `soulEnabled`, `soulIntensity`, `soulActiveEnabled`, `gradientEnabled`, `gradientIntensity`, `keywordColoringEnabled`。
- [ ] `MonetBackgroundTuning`：`backgroundSource`, `backgroundLayout`, `backgroundBlurPx`, `backgroundOverlayOpacity`, `backgroundGrayscale`, `backgroundSaturation`, `backgroundWash`, `backgroundHalfPaneOffsetX`, `backgroundWashColorMode`, `backgroundWashCustomColor`, `backgroundDriftEnabled`, `backgroundDriftStrength`, `backgroundStreaksEnabled`。
- [ ] `NomandBackgroundTuning`：`imageSource`, `effect`, `ditheringType`, `size`, `colorSteps`, `originalColors`, `inverted`, `flutedGlassSize`, `flutedGlassDistortion`, `flutedGlassBlur`, `paperTextureContrast`, `paperTextureRoughness`, `paperTextureFiber`, `halftoneDotsSize`, `halftoneDotsRadius`, `halftoneDotsContrast`, `halftoneDotsOriginalColors`, `halftoneDotsInverted`, `lensDistortionSpread`, `lensDistortionBulge`, `lensDistortionDispersion`, `overlayEnabled`, `overlayOpacity`。
- [ ] `LatentBackgroundTuning`：`displayMode`, `colorSource`, `dynamicOnlyInPlayer`, `enhancedBeatResponse`, `ditheringSpeed`, `ditheringAudioSpeed`, `ditheringSize`, `ditheringOpacity`, `meshSpeed`, `meshAudioSpeed`, `meshDistortion`, `meshSwirl`, `overlayEnabled`, `overlayOpacity`。
- [ ] `SoraBackgroundTuning`：`blank`。
- [ ] `MonetTuning`：`keywordColoringEnabled`, `showDescription`, `showAudioVisualization`, `audioStyle`, `fontScale`, `portraitSource`, `portraitOffsetX`, `portraitStyle`, `showPortraitDragHanger`。

## Tempera 全部分镜

来源：`tempera/types.ts` 的 `TEMPERA_SHOT_KINDS`，绘制分散在 `tempera/compositions/*`，相机/布局在 `temperaShotProfiles.ts`。共121项；所有项保持原代码。原程序按歌曲/段落选择分镜，随机播放不能证明已覆盖每项。需要开发探针/固定 seed 或逐项受控时间线来验收；本次没有完成该逐项真机运行。


- [ ] `duo-split`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `quad-split`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `tri-column`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `thirds-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `checker-quad`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `corner-wedge`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `diagonal-halves`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cross-axis`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `offset-halves`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `stair-blocks`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `pillar-gap`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `corner-quad`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `sliver-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `band-strip`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `horizon-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `deep-dive`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `tone-ramp`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `double-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `tilt-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `edge-rails`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `gradient-wall`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `terrace`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `frame-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `double-frame`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `circle-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ladder-frame`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `corner-brackets`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `inset-box`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `bracket-pair`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `arch-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `grid-cells`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `keyhole`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `poster-panel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `diamond-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `slash-poster`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `arrow-wedge`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `edge-bleed`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `triangle-mass`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ribbon-cross`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `half-disc`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `stacked-slabs`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `wedge-pair`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `quiet-line`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `starfield-dots`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ripple-lines`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `hair-grid`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `margin-rule`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `dot-drift`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `arc-sweep`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `blank-page`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-scope`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-wide`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-academy`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-square`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-portrait`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-tall`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cinema-twin`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `bubble-drift`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cloud-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `heart-burst`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `sparkle-field`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `petal-arc`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `scallop-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ribbon-loop`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `round-plate`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `halo-burst`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `iris-hole`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `slot-rail`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `punch-row`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `film-gate`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cross-vent`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `louvre-slats`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ring-eye`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `notch-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `wedge-gap`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `dot-sieve`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `sight-mark`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `dial-scale`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `chevron-run`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `tally-column`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `grid-focus`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `axis-caps`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `strobe-slats`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `offset-plate`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `radial-comb`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `bracket-target`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `flow-channel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `twin-channel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `reed-run`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `taper-channel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `chain-ports`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `dash-channel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `window-run`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `bridge-span`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `braid-channel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `port-ladder`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `apex-mass`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ziggurat`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `slab-wall`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `cantilever`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `pylon-pair`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `bunker-slit`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `plinth-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `buttress-run`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `void-core`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `shear-block`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `ridge-line`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `chasm`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `overhang`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `step-well`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `pier-row`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `revetment`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `tower-crop`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `lintel`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `rubble-fan`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `gnomon`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `monogatari-card`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `monogatari-rule`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `monogatari-edge`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `monogatari-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。
- [ ] `monogatari-flash`：动态进场/离场、字形、相机、镂空/滤镜、resize；真机待验。

## macOS WebKit 开发 smoke

```bash
npm run dev -- --host 127.0.0.1 --port 4173
# 另一个终端：
npx playwright install webkit
node dev/ipados/webkit-smoke.mjs
```

脚本走实际 probe/registry，使用合成歌词、音频信号和本地动画 iframe，无个人文件。它检查装载、错误、动态像素差异、resize 和卸载；不会给出实体 iPad FPS/功耗结论，也不能独立证明121分镜和所有参数已验收。本次实际结果及测试环境差异见测试报告。不要把开发 probe 或远程调试网站替代 App 最终本地资源。

## 性能与泄漏记录

实体设备用 Xcode Instruments/调试内存图检查持续时间与趋势：每模式先2分钟，再选最重的组合连续30分钟；音频长播单独60分钟。记录 frame pacing、主线程阻塞、GPU/纹理占用、RSS/峰值、热状态、电量变化与后台行为，保留设备和场景。不要用 Mac/模拟器帧率替代。

优化顺序：先定位未清理 listener/RAF/context、重复 render、纹理池和图片引用、后台无意义绘制、不必要计算，再评估采样/分辨率。任何画质档差异都必须记录、可恢复 full；没有“所有 iPad 最高画质稳定运行”的承诺。

## 0.7.22 验收补充

本轮注册表为 **15 种歌词 + 6 种背景**，以重新生成的 inventory 为准。此前 0.7.21 的 26 个 macOS WebKit 场景是历史结果，不能直接作为新版通过。新版运行结果及失败项统一见 [测试报告](ipados-test-report.md)。全部真机框仍保持未勾选。

- [ ] 花火：所有预设/布局/色块、逐字唱词、字色对比、enter/sing/exit、烟火 rise/粒子、镜头/拼贴、bloom、节拍/强度参数。
- [ ] 花火：中文/日文/拉丁长句、旋转、分屏、seek/倒放时序、切歌、prepare/atlas 生命周期、连续切入切出 30 次。
- [ ] 随机模式：池内全选/部分/单个，切歌不紧邻重复，reroll、视觉配置导出导入、同步和重启；不得私自过滤复杂模式。
- [ ] 新分析调度：on/cached/off 的节拍/鼓声和旧结果缓存，前后台切换、AutoMix 双 deck，模型缺失可理解提示。
- [ ] 试听：clipStartMs 在歌词、字幕、Lattice、seek 和 API 一致，实际音频进度不被二次偏移。

本轮执行状态：macOS WebKit 脚本只完成 claddagh 的动态挂载/旋转/卸载记录；cadenza/cappella/classic/diorama/fume/hanabi 未能在页面/探针超时内通过，其余场景尚未执行完。全部保留为待验，不继承历史勾选，具体失败日志见测试报告。
