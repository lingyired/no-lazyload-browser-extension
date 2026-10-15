# 宿主 App 重设计 + i18n 清理 设计文档

> 日期：2026-10-15 ｜ 状态：待评审
> 前置：内购移除重构（同分支，已完成并验证）

## 1. 背景

Safari 版本移除内购后，宿主 App 失去全部功能性职责（不再弹付款面板、不再写 App Group），
只剩两件事：**作为扩展的打包容器**、**引导用户启用并使用扩展**。

同时排查发现 i18n 层有一处**半途而废的重构**（commit `d49c7ae`）：该提交的目标是
「删掉 popup.js / settings/app.js 各自内联的 37 语言翻译表，改读构建期生成的 locales.js」，
但只完成了 "生成 locales.js" 一半 —— HTML 从未加载它，内联表也从未删除。

本项目一次处理两件事：**A. 重设计宿主 App**、**B. 收尾 i18n 重构并统一术语**。

## 2. 目标

- 宿主 App 提供完整、准确、可照做的使用说明
- 扩展的术语在全平台统一为「标准模式 / 兼容模式」
- i18n 只有一个生效的翻译源，杜绝再次漂移
- 删除全部死代码与死产物

## 3. 非目标

- **不建立 App ↔ 扩展的运行期数据通道**（不恢复 App Group）。App 只能查询
  「扩展是否已启用」（`SFSafariExtensionManager`），不能读站点配置或模式设置。
  因此新增内容**只能是静态引导文案**。
- **不重写视觉体系**。沿用现有 `HostDesignTokens`（系统字体 + 系统语义色 + 4pt 网格）。
- **不改 popup / 设置页的 CSS 与布局**。只改文案与翻译加载方式。
- 不做 Tab / 侧边栏 / 多页导航。

## 4. 现状（已核实）

### 4.1 i18n 机制盘点

| 机制 | 是否加载 | 是否生效 | 结论 |
|---|---|---|---|
| `_locales/*/messages.json` | — | 仅 manifest 的 `__MSG_*` 用 | 保留 |
| `i18n.js` | ❌ 无 HTML 引用 | ❌ | 删除 |
| `locales.js`（构建生成，228 KB） | ❌ 无 HTML 引用 | ❌ | **接线启用** |
| `shared-ui.js`（构建生成） | ❌ 无 HTML 引用 | ❌ | 删除 |
| `i18n-manager.js` | ✅ 被加载 | ❌ `init()` 全仓 0 处调用 | 删除 |
| popup.js / settings 内联 37 语言表 | ✅ | ✅ **唯一真实生效** | 删除（迁移到 locales.js） |

> 核对过 git HEAD：以上状态**在本次重构前就已如此**，非本次引入。

### 4.2 关键约束（来自 d49c7ae 的决策记录）

> 刻意不用运行时 fetch —— 扩展里 fetch 自己的包内 JSON 依赖 `web_accessible_resources`
> 等条件，失败时整个 UI 会退化成显示 key 名。

**因此必须用构建期同步注入的 `window.__LOCALES__`，不得改用运行时 fetch。**

### 4.3 术语现状

| 界面 | 当前用词 |
|---|---|
| popup | 技术拦截 / 自动滚动 |
| 设置页 | 标准 / 兼容模式（已迁移） |

同一概念两套叫法，根因就是 4.1 的两套翻译源。

## 5. 设计 A：宿主 App 重设计

### 5.1 信息架构

单页滚动，五个区块：

| # | 区块 | 数据来源 |
|---|---|---|
| ① | 扩展状态（含启用步骤） | 动态（`SFSafariExtensionManager`） |
| ② | 在网站上使用 | 静态 |
| ③ | 两种模式 | 静态 |
| ④ | 遇到问题？ | 静态 |
| ⑤ | 页脚 | 静态 |

窗口最小尺寸维持 420×560。

### 5.2 区块 ① 扩展状态

三种状态，**只有「未启用」显示启用步骤**：

| 状态 | 徽标 | 说明 | 按钮 |
|---|---|---|---|
| 已启用 | 已启用（绿） | `extensionReady` | 无 |
| 未启用 | 未启用（橙） | `enableExtensionHint` + **启用步骤 1-2-3** | 打开 Safari 设置 |
| 读不到 | 状态不可用（橙） | `extensionStatusUnknownHint` | 打开 Safari 设置 |

「读不到」**不得**降级显示为「未启用」（既有设计，保留）。

### 5.3 区块 ② 在网站上使用

三步。第 3 步改为明确引用 popup 里的按钮名（现文案未提及按钮，用户对不上）：

1. `stepOpenWebsite`
2. `stepOpenExtension`
3. `stepEnableSite` —— **文案修改**，见 5.6

### 5.4 区块 ③ 两种模式

两条并列说明，名称统一为「标准模式 / 兼容模式」。

### 5.5 区块 ④ 遇到问题？

三条问答：

1. **图片还是没加载？** → 确认网站已在 popup 启用 → 试兼容模式 → 用「刷新页面」
2. **工具栏上没有按钮？** → 到 Safari → 设置 → 扩展 确认已勾选
3. **想停用某个网站？** → 打开 popup，点「移除当前网站」

运行期信息有限，因此第 1 条以「确认 → 试 → 刷新」的自查顺序呈现，不承诺自动诊断。

### 5.6 文案表（String Catalog，三语）

**复用（不改动）**：`appName`、`appSubtitle`、`safariExtension`、`extensionEnabled`、
`extensionDisabled`、`extensionStatusUnknown`、`extensionReady`、`enableExtensionHint`、
`extensionStatusUnknownHint`、`openSafariSettings`、`howToUse`、`stepOpenWebsite`、
`stepOpenExtension`、`versionFormat`

**修改 1 条**：

| key | en | zh-Hans | zh-Hant |
|---|---|---|---|
| `stepEnableSite` | Click “Add Current Site” — images load at once | 点「添加当前网站」，图片会立即全部加载 | 點一下「加入目前網站」，圖片會立即全部載入 |

**新增 17 条**：

| key | en | zh-Hans | zh-Hant |
|---|---|---|---|
| `enableStepsTitle` | To enable it | 启用步骤 | 啟用步驟 |
| `enableStep1` | Click the button below to open Safari extension settings | 点下面的按钮打开 Safari 扩展设置 | 點下面的按鈕開啟 Safari 擴充功能設定 |
| `enableStep2` | Turn on No Lazyload in the list | 在列表里勾选 No Lazyload | 在列表裡勾選 No Lazyload |
| `enableStep3` | Back in Safari, the toolbar button appears | 回到 Safari，工具栏上就会出现按钮 | 回到 Safari，工具列上就會出現按鈕 |
| `modesTitle` | Two modes | 两种模式 | 兩種模式 |
| `modeStandardName` | Standard | 标准模式 | 標準模式 |
| `modeStandardHelp` | Blocks lazy loading directly. The default, and works on most sites | 直接拦截懒加载。默认方式，绝大多数网站用这个 | 直接攔截延遲載入。預設方式，絕大多數網站用這個 |
| `modeCompatibilityName` | Compatibility | 兼容模式 | 相容模式 |
| `modeCompatibilityHelp` | Scrolls the page to the bottom to trigger loading. Use it only when Standard mode doesn't work | 自动滚动页面到底部触发加载。只在标准模式没效果时使用 | 自動捲動頁面到底部觸發載入。只在標準模式沒效果時使用 |
| `troubleshootingTitle` | Troubleshooting | 遇到问题？ | 遇到問題？ |
| `troubleshoot1Title` | Images still not loading? | 图片还是没加载？ | 圖片還是沒載入？ |
| `troubleshoot1Body` | Make sure the site is enabled in the popup. If it is, try Compatibility mode. Still nothing? Use Refresh Page | 先确认这个网站已在 popup 里启用；再试试兼容模式；还不行就用 popup 底部的「刷新页面」 | 先確認這個網站已在 popup 裡啟用；再試試相容模式；還不行就用 popup 底部的「重新整理頁面」 |
| `troubleshoot2Title` | No toolbar button? | 工具栏上没有按钮？ | 工具列上沒有按鈕？ |
| `troubleshoot2Body` | Check Safari → Settings → Extensions and make sure No Lazyload is on | 到 Safari → 设置 → 扩展，确认 No Lazyload 已勾选 | 到 Safari → 設定 → 擴充功能，確認 No Lazyload 已勾選 |
| `troubleshoot3Title` | Want to turn a site off? | 想停用某个网站？ | 想停用某個網站？ |
| `troubleshoot3Body` | Open the popup and click “Remove Current Site” | 打开 popup，点「移除当前网站」 | 開啟 popup，點一下「移除目前網站」 |
| `privacyNote` | No Lazyload only acts on the websites you enable. Other websites are untouched | No Lazyload 只作用于你启用的网站，其它网站不做任何改动 | No Lazyload 只作用於你啟用的網站，其它網站不做任何改動 |

> 文案中的「添加当前网站 / 移除当前网站」取自扩展 `_locales` 的实际值，
> 确保用户能在 popup 里对上同一个按钮。

### 5.7 文件结构

| 文件 | 动作 |
|---|---|
| `HostCopy.swift` | 加 17 个 `String(localized:)` 访问器 |
| `Localizable.xcstrings` | 加 17 条、改 1 条，各三语 |
| `Host/ExtensionStatusView.swift` | 改为「状态 + 启用步骤」；移出 `HowToUseView` / `StepRow` |
| `Host/HowToUseView.swift` | 新建（从上面移出） |
| `Host/ModesView.swift` | 新建 |
| `Host/TroubleshootingView.swift` | 新建 |
| `Host/HostDesignTokens.swift` | 接收 `StepRow`（改为共享组件） |
| `Host/HostFooterView.swift` | 加隐私说明行 |
| `Host/HostRootView.swift` | 组合五个区块 |
| `pbxproj` | 新增 3 个 Swift 文件引用 |

## 6. 设计 B1：删除死代码

| 动作 | 对象 |
|---|---|
| 删除文件 | `i18n.js`、`i18n-manager.js` |
| 停止生成 | `shared-ui.js`（删 `writeSharedUiBundle`） |
| **保留并接线** | `locales.js`（见 B2） |

同步改动：`build.js`（删函数与调用）、`safari-xcode/.../project.pbxproj`（删 `shared-ui.js`
的 PBXFileReference 与 Resources 引用）、`tests/bundle.test.mjs`（不再断言 shared-ui.js）、
`tests/visual/*.html`（不再加载这两个产物）。

> `shared/domain.js`、`shared/constants.js` **保留** —— background 的 ES module 仍在 import 它们。

## 7. 设计 B2：完成 locales.js 接线（统一翻译源）

1. `popup.html` 在 `popup.js` **之前**加 `<script src="locales.js"></script>`
2. `settings/index.html` 在 `app.js` **之前**加 `<script src="../locales.js"></script>`
3. `popup.js` / `settings/app.js`：**删除内联 `TRANSLATIONS` 表**，`t()` 改为：

```js
function t(key, replacements = {}) {
  const table = (window.__LOCALES__ || {})[currentLanguage]
             || (window.__LOCALES__ || {})['en'] || {};
  const raw = table[key];
  if (typeof raw !== 'string') return key;
  return raw.replace(/\{(\w+)\}/g, (m, name) =>
    Object.prototype.hasOwnProperty.call(replacements, name)
      ? String(replacements[name]) : m);
}
```

4. 语言代码对齐：UI 使用的语言码必须存在于 `__LOCALES__`，缺失则回落 `en`。
   （UI 用 37 个码，`_locales` 有 38 个目录，多出 `zh_CN`，不冲突但需断言）

**可行性已核实**：popup.js 的 18 个 `t()` key、settings/app.js 的 25 个，
在 38 个语言包中**全部存在**，删除内联表不会丢文案。

## 8. 设计 B3：术语统一

**规则**：
- **模式名称**统一 → 「标准模式 / 兼容模式」
- **机制描述**保留原词（滚动速度、停留时长、拦截提示）—— 它们描述"怎么做"，不是"叫什么模式"

| 位置 | 现在 | 改为 |
|---|---|---|
| popup 复选框标签 | `useAutoScroll` | `compatibilityMode` |
| popup 复选框说明 | `autoScrollDesc` | `compatibilityModeHelp` |
| popup 站点列表短标签 | `autoScroll` | `compatibilityMode` |
| popup toast（开/关） | `autoScrollEnabled` / `autoScrollDisabled` | `compatibilityMode` / `standardMode` |
| 设置页说明 | `autoScrollHelp` | `compatibilityModeHelpSection` |
| 设置页参数区标题 | `scrollParams` | **保留**（机制描述） |
| 设置页滚动速度/停留时长 | `scrollSpeed` / `stayDuration` | **保留**（机制描述） |
| 设置页拦截提示开关 | `showInterceptionToast` | **保留**（机制描述） |

**孤立的旧 key（从 38 个语言包删除）**：`useAutoScroll`、`autoScrollDesc`、
`autoScroll`、`autoScrollEnabled`、`autoScrollDisabled`、`autoScrollHelp`

**取舍**：toast 改后只显示模式名（如「兼容模式」），比原来的「已开启自动滚动」简短。
零翻译成本。若要更完整的句子，需新增 key × 38 语言翻译 —— **本设计选择前者**。

## 9. 验证计划

| 项 | 方法 |
|---|---|
| 编译 | `xcodebuild`（App + Extension 两个 target） |
| App 三态 | 已启用可自动截；未启用需手动在 Safari 取消勾选；状态不可用需未签名构建 |
| App 最小窗口 | 420×560 截图不破版 |
| App 深色模式 | 截图对照 |
| App 三语 | en / zh-Hans / zh-Hant 截图查溢出 |
| 扩展 popup / 设置页 | headless Chrome 渲染，**重点验证占位符未丢**（「已添加 {domain}」类） |
| 术语统一 | 渲染后全文搜索「自动滚动 / 技术拦截」应只剩机制描述处 |
| 死代码 | 全仓 grep 确认 `i18n.js`/`i18n-manager.js`/`shared-ui.js` 零引用 |
| 自动化测试 | `npm test` 5/5 |
| 产物 | 三个平台包内不得再含 `shared-ui.js`；`locales.js` 必须被引用 |

## 10. 风险

| 风险 | 缓解 |
|---|---|
| 翻译源切换导致 UI 显示 key 名 | 语言码缺失回落 `en`；渲染后逐页截图核对 |
| `{name}` 占位符丢失 | 渲染验证「已添加 {domain}」等 3 处含占位符的 toast |
| B 动到被回退三次的 popup / 设置页 | **只改文案与加载方式，不碰 CSS 与布局**；改动前后各出一张对照图 |
| pbxproj 手改出错 | 改后必须 `xcodebuild` 通过 + `tests/package.test.mjs` 校验资源引用 |
| App 新增文案未翻译 | String Catalog 三语齐全；缺失会回落 defaultValue（英文） |

## 11. 实施顺序

1. **B1** 删死代码（含 build.js / pbxproj / 测试）
2. **B2** 接线 locales.js、删内联表 → 渲染验证 UI 文案正常
3. **B3** 术语统一 + 清理孤立 key → 渲染验证
4. **A** 宿主 App 重设计（文案已定，独立于 B）
5. 全量验证 + 更新文档
