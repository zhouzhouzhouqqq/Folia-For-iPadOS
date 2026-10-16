# 全部视觉模式与效果验收清单

基线：Folia 0.7.19 / 35db05c。以 `src/types/visualizerModes.ts`、`visualizer/registry.tsx`、`backgrounds/registry.tsx`、`tuningRegistry.ts` 和真实 entry 为准。当前 **14 个歌词模式 + 6 个背景 entry 全部参与本地构建**，没有按设备屏蔽 renderer，没有将动态效果换成静态图。

本表是**待执行的真机验收表，所有空框均未验收**。macOS Playwright WebKit 因环境 LaunchServices 在页面启动前失败，未生成有效效果截图，也未证明 WebKit 等价。不能把代码构建/单测当成下面的通过结果。

机器清单：[ipados-visual-inventory.json](ipados-visual-inventory.json)，含每个模式源码路径/SHA256/import/局部 tuning 属性观察、共享 Tuning 定义和默认值、121个 Tempera shot ID。运行 `npm run ios:audit` 重建；脚本校验实际 entry 与声明列表一致。清单包含参数定义，不代替像素效果检查；共用 helper 的最终行为仍须按源码/真机判断。

## 设备与比较方法

记录设备型号、芯片、内存规格（已知时）、iPadOS 版本、屏幕刷新率、横竖屏/窗口尺寸、画质/电源模式、歌曲/歌词格式与字体、音频来源。用同一歌曲/歌词、同一时间点、同一主题与参数在原桌面版对照；动态效果要录一段转场，不能仅凭一张截图。

每个模式至少检查：逐行及实际支持的逐字歌词、中日韩/拉丁/emoji、空/无歌词/纯音乐、长行、译文、空拍/重叠时间、seek/暂停/快进/切歌；所有设置从最小/默认/最大值与枚举逐项调节、保存重启及视觉配置导入导出；预览/正式播放一致性；日夜/主题切换；横竖屏、分屏、Stage Manager resize；切入切出30次观察 context/纹理/RAF/事件 listener 是否累积。

不要给原本没有逐字输入的模式凭空增加功能保证；测试其源码实际支持的路径即可。`still` 是原有模式名，不是移植降级开关。完整效果始终可选，未新增强制 iOS 低画质或强制静态模式。

## 注册表逐项

| 待验 | 模式 | 源码与依赖 | 当前实现/证据 | 真机结果/差异 |
|---|---|---|---|---|
| [ ] | 歌词 `cadenza` | `src/components/visualizer/cadenza/entry.tsx`；DOM/Canvas、文字测量、RAF | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `cappella` | `src/components/visualizer/cappella/entry.tsx`；DOM/Motion、IndexedDB 自定义头像与 emoji | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `claddagh` | `src/components/visualizer/claddagh/entry.tsx`；环状行、pretext、音频分析/RAF | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `classic` | `src/components/visualizer/classic/entry.tsx`；DOM/Motion、GlowWord | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `diorama` | `src/components/visualizer/diorama/entry.tsx`；Three.js、React Three Fiber、文字栅格化、粒子 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `fume` | `src/components/visualizer/fume/entry.tsx`；Canvas/DOM、测量、RAF | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `lumiere` | `src/components/visualizer/lumiere/entry.tsx`；Pixi.js、滤镜、纹理、full/balanced/low tuning | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `monet` | `src/components/visualizer/monet/entry.tsx`；DOM、音频 overlay、图像处理、歌词 rail | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `partita` | `src/components/visualizer/partita/entry.tsx`；DOM/Motion、GlowWord | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `pendolo` | `src/components/visualizer/pendolo/entry.tsx`；WebGL2；源码已有 Canvas2D fallback | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `sonnet` | `src/components/visualizer/sonnet/entry.tsx`；Pixi.js、滤镜、文字纹理 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `still` | `src/components/visualizer/still/entry.tsx`；DOM、原布局/转场 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `tempera` | `src/components/visualizer/tempera/entry.tsx`；Pixi.js、121 种 shot、纹理/滤镜 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 歌词 `tilt` | `src/components/visualizer/tilt/entry.tsx`；DOM/Motion、透视变换 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `common` | `src/components/visualizer/backgrounds/common/entry.tsx`；封面流体、几何形状、音频 analyser、CSS 合成 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `latent` | `src/components/visualizer/backgrounds/latent/entry.tsx`；Canvas/shader、dithering / mesh / both | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `monet` | `src/components/visualizer/backgrounds/monet/entry.tsx`；图像、画布与原装饰 | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `nomand` | `src/components/visualizer/backgrounds/nomand/entry.tsx`；@paper-design/shaders-react、WebGL | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `sora` | `src/components/visualizer/backgrounds/sora/entry.tsx`；WebGL starfield；用户可选 blank | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |
| [ ] | 背景 `url` | `src/components/visualizer/backgrounds/url/entry.tsx`；iframe、第三方 CSP / X-Frame-Options | 原实现已编入 bundle；待 WebKit/真机 | 未执行 |

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

- [ ] `duo-split`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `quad-split`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `tri-column`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `thirds-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `checker-quad`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `corner-wedge`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `diagonal-halves`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cross-axis`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `offset-halves`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `stair-blocks`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `pillar-gap`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `corner-quad`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `sliver-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `band-strip`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `horizon-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `deep-dive`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `tone-ramp`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `double-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `tilt-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `edge-rails`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `gradient-wall`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `terrace`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `frame-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `double-frame`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `circle-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `ladder-frame`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `corner-brackets`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `inset-box`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `bracket-pair`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `arch-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `grid-cells`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `keyhole`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `poster-panel`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `diamond-stack`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `slash-poster`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `arrow-wedge`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `edge-bleed`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `triangle-mass`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `ribbon-cross`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `half-disc`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `stacked-slabs`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `wedge-pair`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `quiet-line`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `starfield-dots`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `ripple-lines`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `hair-grid`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `margin-rule`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `dot-drift`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `arc-sweep`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `blank-page`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-scope`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-wide`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-academy`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-square`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-portrait`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-tall`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cinema-twin`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `bubble-drift`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `cloud-window`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `heart-burst`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `sparkle-field`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `petal-arc`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `scallop-band`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `ribbon-loop`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `round-plate`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `halo-burst`：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `s live
    // background shows in it - see `compositions/temperaCutout.ts`.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    // Instrument panels: measured geometric decoration around one heavy focal mass.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    // Corridors: openings cut along the flow vector, so the hand-off between two shots keeps
    // the same opening moving instead of cutting to a new one.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    // Brutalist monoliths: one enormous matte solid, cropped by the frame, type on its edge.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    // The same language read as ground and structure rather than as objects.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    // Monogatari-style interstitials: one flat field, type as the whole picture.
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。
- [ ] `,
    `：动态进场/离场、字形、相机、镂空/滤镜、resize；结果待填写。

## macOS WebKit 开发 smoke

```bash
npm run dev -- --host 127.0.0.1 --port 4173
# 另一个终端：
npx playwright install webkit
node dev/ipados/webkit-smoke.mjs
```

脚本走实际 probe/registry，使用合成歌词、音频信号和本地动画 iframe，无个人文件。它检查装载、错误、动态像素差异、resize 和卸载；不会给出实体 iPad FPS/功耗结论，也不能独立证明121分镜和所有参数已验收。当前环境失败证据见测试报告，不能算通过。不要把开发 probe 或远程调试网站替代 App 最终本地资源。

## 性能与泄漏记录

实体设备用 Xcode Instruments/调试内存图检查持续时间与趋势：每模式先2分钟，再选最重的组合连续30分钟；音频长播单独60分钟。记录 frame pacing、主线程阻塞、GPU/纹理占用、RSS/峰值、热状态、电量变化与后台行为，保留设备和场景。不要用 Mac/模拟器帧率替代。

优化顺序：先定位未清理 listener/RAF/context、重复 render、纹理池和图片引用、后台无意义绘制、不必要计算，再评估采样/分辨率。任何画质档差异都必须记录、可恢复 full；没有“所有 iPad 最高画质稳定运行”的承诺。
