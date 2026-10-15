# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **宿主 App 重设计**：五个区块（扩展状态 / 使用方法 / 两种模式 / 遇到问题 / 页脚），
  扩展未启用时展示三步启用引导，页脚补隐私说明。新增 17 条文案，en / zh-Hans / zh-Hant 三语齐全。

### Changed
- **术语统一为「标准模式 / 兼容模式」**。此前 popup 用「技术拦截 / 自动滚动」、
  设置页用「标准 / 兼容模式」，同一概念两套叫法。
  机制描述（滚动速度、停留时长、参数区标题）按设计保留原词。
- **i18n 翻译源收敛到 `locales.js`**：popup.js 与 settings/app.js 各自内联的
  37 语言翻译表（合计约 2500 行）已删除，统一读构建期注入的 `window.__LOCALES__`。
- 宿主 App 的「使用方法」第 3 步改为直接引用 popup 里的按钮名。

### Removed
- `i18n.js`（无人加载）
- `i18n-manager.js`（被加载但 `init()` 全仓 0 处调用，实际从未生效）
- `shared-ui.js`（构建生成但无人加载，同步清理 pbxproj 12 处引用）
- 38 个语言包中的 6 个孤立 key（`useAutoScroll` 等，共 228 个实例）

### Fixed
- `detectBrowserLanguage()` 依赖已删除的 `Object.keys(TRANSLATIONS)`，
  会在 popup 打开时抛 ReferenceError —— 改为读 `__LOCALES__`。
- `locales.js` 自 commit `d49c7ae` 起一直被生成并打包，却没有任何 HTML 引用它，
  翻译实际来自内联表。现已接线，并由 `bundle.test.mjs` 加断言防止复发。

## [1.10.0] - 2026-05-22

### Added
- Browser language auto-detection for default language selection
- SVG icons for popup buttons (settings gear, refresh)

### Fixed
- Chrome/Firefox API compatibility issue with `chrome.runtime.lastError`
- Build script zip command path issue on macOS
- Language fallback now uses `en` instead of `zh` for unsupported languages

### Changed
- Version number updated to 1.10.0
- Build script now auto-syncs version to manifest files
