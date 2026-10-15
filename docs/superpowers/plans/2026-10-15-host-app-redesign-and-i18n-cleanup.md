# 宿主 App 重设计 + i18n 清理 实施计划

> **设计文档：** [2026-10-15-host-app-redesign-and-i18n-cleanup-design.md](../specs/2026-10-15-host-app-redesign-and-i18n-cleanup-design.md)
> **Goal:** 宿主 App 提供完整使用说明；扩展 i18n 收敛为单一翻译源；术语统一为「标准 / 兼容模式」。
> **Architecture:** 删除三套死掉的 i18n 机制，把 `d49c7ae` 未完成的 locales.js 接线做完；
> 宿主 App 在现有 SwiftUI + String Catalog 上扩充内容，不引入新视觉语言。
> **Tech Stack:** Vanilla JS (ES2020+), WebExtension MV3, SwiftUI, String Catalog (xcstrings)

> ⚠️ **环境提示**：本机 `node` 不在默认 PATH。所有命令前加：
> ```bash
> export PATH="/Users/lingsmbp/.nvm/versions/node/v24.16.0/bin:$PATH"
> ```

---

## 目标文件结构

```
├── popup.html                  # + <script src="locales.js">
├── popup.js                    # - 内联 TRANSLATIONS 表；t() 改读 __LOCALES__
├── settings/
│   ├── index.html              # + <script src="../locales.js">
│   └── app.js                  # - 内联 TRANSLATIONS 表
├── i18n.js                     # 【删除】
├── i18n-manager.js             # 【删除】
├── build.js                    # - writeSharedUiBundle；- i18n.js 条目
└── safari-xcode/.../
    ├── HostCopy.swift          # +17 访问器，改 1 条
    ├── Localizable.xcstrings   # +17 条，改 1 条（三语）
    └── Host/
        ├── ExtensionStatusView.swift   # 改为状态 + 启用步骤
        ├── HowToUseView.swift          # 【新建】
        ├── ModesView.swift             # 【新建】
        ├── TroubleshootingView.swift   # 【新建】
        ├── HostFooterView.swift        # + 隐私说明行
        └── HostRootView.swift          # 组合五区块
```

---

## Task 1: B1 删除死代码

**Files:**
- Delete: `i18n.js`、`i18n-manager.js`
- Modify: `build.js`、`safari-xcode/.../project.pbxproj`、`tests/bundle.test.mjs`、`tests/visual/*.html`

- [ ] **Step 1: 先记录基线，确认这两个文件确实零引用**

```bash
grep -rn "i18n\.js\|i18n-manager\.js\|shared-ui\.js" --include="*.html" . \
  | grep -v node_modules | grep -v "^./dist/" | grep -v "^./tests/visual/"
# 期望：无输出（除 build.js / 测试 / 预览壳外无产品代码引用）
```

- [ ] **Step 2: 删除源文件**

```bash
git rm i18n.js i18n-manager.js
```

- [ ] **Step 3: build.js 移除 i18n.js 条目与 writeSharedUiBundle**

从 `COMMON_FILES` 删除 `'i18n.js',` 一行。
删除整个 `writeSharedUiBundle` 函数，**并删除它的调用点**（在 `buildChrome`/`buildFirefox`/`buildSafari` 中）。
保留 `writeLocalesBundle` 与它的调用点（locales.js 要接线启用）。

- [ ] **Step 4: 清理 Xcode 工程**

- 从 `ImageLazyLoadBlocker Extension/Resources/` 删除 `i18n.js`、`shared-ui.js`
- 在 `project.pbxproj` 删除这两个文件的 PBXFileReference、PBXBuildFile、
  group children 与 Resources build phase 条目
- `locales.js` 的引用**保留不动**

- [ ] **Step 5: 更新测试**

`tests/bundle.test.mjs`：删除所有对 `shared-ui.js` 的断言（`loadClassic` 调用、
`purchaseMarkers` 循环里的 sharedUi 分支、`occurrences(sharedUi, ...)`）。
保留对 `background-safari.js` 的断言，并把 `locales.js` 加入"不得含内购标识"的检查对象。

`tests/visual/popup-preview.html`、`tests/visual/settings-preview.html`：
删除 `../../dist/safari/locales.js`、`../../dist/safari/shared-ui.js` 的加载条目，
改为加载 `../../locales.js`（locales.js 现在必须被加载）。

- [ ] **Step 6: 验收**

```bash
node build.js all
node tests/run.js          # 期望 5/5
grep -rn "i18n-manager\|shared-ui" --include="*.html" --include="*.js" . | grep -v node_modules | grep -v "^./dist/"
# 期望：无输出
```

---

## Task 2: B2 接线 locales.js（统一翻译源）

**Files:**
- Modify: `popup.html`、`popup.js`、`settings/index.html`、`settings/app.js`

- [ ] **Step 1: HTML 加 script 标签（必须在页面脚本之前）**

`popup.html`：
```html
<script src="locales.js"></script>
<script src="popup.js"></script>
```

`settings/index.html`：
```html
<script src="../locales.js"></script>
<script src="app.js"></script>
```

- [ ] **Step 2: popup.js 删除内联 TRANSLATIONS 表**

删除 `const TRANSLATIONS = { ... };` 整个字面量（37 语言，约 1000 行）。

- [ ] **Step 3: popup.js 重写 t()**

```js
function t(key, replacements = {}) {
  const locales = window.__LOCALES__ || {};
  const table = locales[currentLanguage] || locales['en'] || {};
  const raw = table[key];
  if (typeof raw !== 'string') return key;
  return raw.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(replacements, name)
      ? String(replacements[name])
      : match);
}
```

- [ ] **Step 4: settings/app.js 同样处理**

删除内联 `TRANSLATIONS` 表；`t()` 换成与 Step 3 **完全相同**的实现
（两处必须逐字一致，否则又是一次漂移源）。

- [ ] **Step 5: 语言码回落保护**

确认 `currentLanguage` 的取值都能在 `__LOCALES__` 里找到；
找不到时已由 `|| locales['en']` 兜底。加一条断言脚本：

```bash
node -e "
const L=require('./dist/safari/locales.js');" 2>/dev/null || true
node -e "
const fs=require('fs');
const src=fs.readFileSync('dist/safari/locales.js','utf8');
const codes=[...src.matchAll(/^  \"([A-Za-z_]+)\": \{/gm)].map(m=>m[1]);
console.log('locales.js 语言数:', codes.length);
for (const c of ['zh','en','zh_HK','zh_TW']) console.log('  ', c, codes.includes(c)?'✓':'✗ 缺失');
"
```

- [ ] **Step 6: 验收——重点是占位符不能丢**

```bash
node build.js safari
# 用 headless Chrome 渲染 popup 并触发一次"添加网站"，确认 toast 文案里
# {domain} 已被真实域名替换，而不是显示成 "Added {domain}"
```

必查的 3 处含占位符文案：`siteAdded`、`siteRemoved`、`siteDeleted`（popup）、
`deleteConfirm`（settings）。

---

## Task 3: B3 术语统一

**Files:**
- Modify: `popup.html`、`popup.js`、`settings/index.html`、`settings/app.js`、`_locales/*/messages.json`（38 个）

- [ ] **Step 1: popup.html 换 key**

| 位置 | 现在 | 改为 |
|---|---|---|
| 复选框标签 | `data-i18n="useAutoScroll"` | `data-i18n="compatibilityMode"` |
| 复选框说明 | `data-i18n="autoScrollDesc"` | `data-i18n="compatibilityModeHelp"` |

- [ ] **Step 2: popup.js 换 key**

- 站点列表短标签：`t('autoScroll')` → `t('compatibilityMode')`
- 开关 toast：`t('autoScrollEnabled')` / `t('autoScrollDisabled')`
  → `t('compatibilityMode')` / `t('standardMode')`

- [ ] **Step 3: settings 换 key**

- `autoScrollHelp` → `compatibilityModeHelpSection`
- `scrollParams` / `scrollSpeed` / `stayDuration` / `showInterceptionToast`
  **保持不变**（机制描述，非模式名称）

- [ ] **Step 4: 从 38 个语言包删除 6 个孤立 key**

`useAutoScroll`、`autoScrollDesc`、`autoScroll`、`autoScrollEnabled`、
`autoScrollDisabled`、`autoScrollHelp`

用脚本批量删除，保持 `JSON.stringify(json, null, 2) + '\n'` 格式（与仓库既有格式一致）。

- [ ] **Step 5: 验收**

```bash
node tests/run.js          # locales.test.mjs 必须过：38 语言 key 齐平
node build.js all
# 渲染 popup + 设置页，全文搜索应为空：
#   自动滚动 / Auto-scroll（除 scrollParams/scrollSpeed/stayDuration/showInterceptionToast 的值）
```

---

## Task 4: A.1 文案层

**Files:**
- Modify: `HostCopy.swift`、`Localizable.xcstrings`

- [ ] **Step 1: HostCopy.swift 加 17 个访问器**

按设计文档 §5.6 的 key 名逐一添加：`enableStepsTitle`、`enableStep1`~`enableStep3`、
`modesTitle`、`modeStandardName`、`modeStandardHelp`、`modeCompatibilityName`、
`modeCompatibilityHelp`、`troubleshootingTitle`、`troubleshoot1Title`~`troubleshoot3Body`、
`privacyNote`。每个都用 `String(localized: "<key>", defaultValue: "<en>")` 形式。

- [ ] **Step 2: 修改 stepEnableSite 的文案**

en: `Click “Add Current Site” — images load at once`
zh-Hans: `点「添加当前网站」，图片会立即全部加载`
zh-Hant: `點一下「加入目前網站」，圖片會立即全部載入`

- [ ] **Step 3: Localizable.xcstrings 补 17 条新 key**

每条含 `en` / `zh-Hans` / `zh-Hant` 三个 `stringUnit`，`state` 为 `translated`，
`extractionState` 为 `manual`。**key 保持字典序**（diff 更干净）。

- [ ] **Step 4: 验收**

```bash
python3 -c "
import json
j=json.load(open('safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker/Localizable.xcstrings'))
need=['enableStepsTitle','enableStep1','enableStep2','enableStep3','modesTitle',
 'modeStandardName','modeStandardHelp','modeCompatibilityName','modeCompatibilityHelp',
 'troubleshootingTitle','troubleshoot1Title','troubleshoot1Body','troubleshoot2Title',
 'troubleshoot2Body','troubleshoot3Title','troubleshoot3Body','privacyNote']
for k in need:
    v=j['strings'].get(k)
    assert v, 'missing '+k
    for t in ['en','zh-Hans','zh-Hant']:
        assert v['localizations'].get(t), k+' 缺 '+t
print('✅ 17 条 key 三语齐全')
"
```

---

## Task 5: A.2 视图层

**Files:**
- Create: `Host/HowToUseView.swift`、`Host/ModesView.swift`、`Host/TroubleshootingView.swift`
- Modify: `Host/ExtensionStatusView.swift`、`Host/HostDesignTokens.swift`、`pbxproj`

- [ ] **Step 1: 把 StepRow 移到 HostDesignTokens.swift**

`StepRow` 目前是 `ExtensionStatusView.swift` 里的 `private struct`。
移到 `HostDesignTokens.swift` 并去掉 `private`（它是通用的编号行组件，两个视图都要用）。

- [ ] **Step 2: ExtensionStatusView.swift 改为「状态 + 启用步骤」**

- 保留三态徽标与 hint 逻辑
- 当 `extensionEnabled != true` 时，在 hint 与按钮之间插入：
  `HostCopy.enableStepsTitle` 小标题 + 三条 `StepRow`
- 把 `HowToUseView` 从本文件**移出**到新文件

- [ ] **Step 3: 新建 HowToUseView.swift**

内容不变（三条 `StepRow`），只是换了文件与归属。

- [ ] **Step 4: 新建 ModesView.swift**

`HostSection(title: HostCopy.modesTitle)` 内两条并列说明，
每条 = 模式名（`.headline`）+ 说明（`.callout`，`HostColor.secondaryText`）。
用现有 `HostSpacing` / `HostColor`，**不新增设计令牌**。

- [ ] **Step 5: 新建 TroubleshootingView.swift**

`HostSection(title: HostCopy.troubleshootingTitle)` 内三条问答，
每条 = 问题（`.subheadline.weight(.semibold)`）+ 答案（`.callout`）。

- [ ] **Step 6: pbxproj 加 3 个 Swift 文件引用**

每个新文件需要：PBXFileReference + PBXBuildFile + Host group child +
主 target 的 Sources build phase 条目。沿用既有 ID 命名规律（`E1...` / `E2...`）。

- [ ] **Step 7: 验收——必须编译通过**

```bash
xcodebuild -project "safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj" \
  -scheme ImageLazyLoadBlocker -configuration Debug -destination 'platform=macOS' \
  build CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO CODE_SIGN_IDENTITY="" 2>&1 \
  | grep -E "error:|BUILD (SUCCEEDED|FAILED)"
```

---

## Task 6: A.3 组合根视图与页脚

**Files:**
- Modify: `Host/HostRootView.swift`、`Host/HostFooterView.swift`

- [ ] **Step 1: HostRootView 插入新区块**

```swift
HeaderView()
ExtensionStatusView(viewModel: viewModel)
HowToUseView()
ModesView()
TroubleshootingView()
```

- [ ] **Step 2: HostFooterView 加隐私说明行**

在 GitHub 链接之前插入 `HostCopy.privacyNote`，用 `.caption` + `HostColor.tertiaryText`，
`fixedSize(horizontal: false, vertical: true)`（长文案要能换行）。

- [ ] **Step 3: 验收——三态截图**

```bash
# 已启用：直接跑签名版本
# 未启用：Safari → 设置 → 扩展 取消勾选后重开 App
# 状态不可用：用未签名构建（CODE_SIGNING_ALLOWED=NO）运行
```

三种状态各截一张，确认「未启用」才显示启用步骤。

- [ ] **Step 4: 验收——尺寸与主题**

- 窗口拉到最小 420×560：不破版、无横向滚动
- 深色模式：文字对比度正常
- 三语切换（en / zh-Hans / zh-Hant）：无文案溢出

---

## Task 7: 全量验证与文档

- [ ] **Step 1: 自动化测试**

```bash
node tests/run.js          # 期望 5/5
```

- [ ] **Step 2: 三平台全量构建**

```bash
node build.js all
```

- [ ] **Step 3: 产物扫描**

必须为空：
- 三个平台的包内不得含 `shared-ui.js`
- 不得含内购标识（`Entitlement` / `requestPurchase` / `LIMIT_REACHED` 等）
- `locales.js` 必须存在**且被 HTML 引用**

- [ ] **Step 4: 死代码终检**

```bash
grep -rn "i18n-manager\|shared-ui\|window.i18nManager" --include="*.js" --include="*.html" . \
  | grep -v node_modules | grep -v "^./dist/"
# 期望：无输出
```

- [ ] **Step 5: 更新文档**

- `CHANGELOG.md`：加一条 i18n 收敛 + 宿主 App 重设计
- `docs/safari-compatibility.md`：若宿主 App 能力描述有变则同步
- `docs/testing.md`：第 3 节的宿主 App 检查项补上新区块

---

## 完成标准

- [ ] `npm test` 5/5
- [ ] `xcodebuild` 两个 target 编译通过
- [ ] 宿主 App 三态截图均正确，未启用时显示启用步骤
- [ ] 宿主 App 三语、深色、最小窗口均无破版
- [ ] popup / 设置页文案正常，**占位符未丢**
- [ ] 全平台术语只剩「标准 / 兼容模式」；机制描述处按设计保留
- [ ] 三个平台包内无死产物、无内购残留
