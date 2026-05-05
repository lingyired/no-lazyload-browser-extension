# Image Lazy Load Blocker - 项目需求文档

## 1. 项目概述

### 1.1 产品定位
浏览器扩展程序，用于**禁用网页上的图片懒加载功能**，强制立即加载所有图片。

### 1.2 目标平台
- Chrome (Manifest V3)
- Firefox (Manifest V2)

### 1.3 核心用户场景
- 需要批量下载网页图片的用户
- 希望一次性查看页面所有内容的用户
- 自动化脚本/爬虫需要完整页面内容

---

## 2. 核心功能需求

### 2.1 懒加载拦截策略

#### 2.1.1 技术拦截模式（Tech Block）
- **IntersectionObserver 劫持**：预初始化 IO 劫持，强制所有被观察元素立即触发 `isIntersecting: true`
- **HTMLImageElement.loading 拦截**：拦截 `loading` 属性设置，阻止设置为 `lazy`
- **原生懒加载处理**：将 `loading="lazy"` 强制改为 `loading="eager"`
- **第三方库劫持**：劫持 lazysizes、lozad.js、vanilla-lazyload 等常见懒加载库

#### 2.1.2 自动滚动模式（Auto Scroll）
- **平滑滚动动画**：支持自定义滚动速度（默认 800ms）
- **底部停留**：到达页面底部后停留指定时间（默认 2000ms）
- **返回顶部**：可选完成后返回页面顶部
- **后台标签页支持**：页面在后台时等待切换前台再执行滚动

#### 2.1.3 双模式并存
- 全局配置可设置默认使用自动滚动代替技术拦截
- 每个网站可独立选择使用哪种模式

### 2.2 图片懒加载检测

#### 2.2.1 支持的懒加载属性（可配置）
默认包含：
- `data-src`
- `data-original`
- `data-lazy-src`
- `data-srcset`
- `data-lazy-srcset`
- `data-custom-src`
- `data-lazy`
- `data-defer-src`
- `data-async`
- `data-img-url`
- `data-url`
- `data-image`
- `data-image-src`
- `data-href`

#### 2.2.2 占位符检测（可配置）
默认检测关键词：
- `thumb`, `placeholder`, `loading`, `spinner`
- `blank`, `empty`, `lazy`, `preview`, `temp`, `default`

#### 2.2.3 特殊容器支持
- 支持 `<ignore_js_op>` 等特殊容器包裹的图片
- 支持任意自定义容器中的懒加载图片

#### 2.2.4 背景图片懒加载
- 检测 `data-bg` 和 `data-background` 属性
- 自动设置为内联 `background-image` 样式

### 2.3 网站管理

#### 2.3.1 网站列表功能
- 添加/移除当前网站
- 显示已配置网站数量
- 删除单个网站配置
- 每个网站可独立设置是否使用自动滚动

#### 2.3.2 配置存储
- 使用 Chrome Storage API 持久化配置
- 按域名存储网站配置
- 全局配置与网站配置分离

### 2.4 设置页面功能

#### 2.4.1 已配置的网站列表
- 显示所有已添加的网站域名
- 每个网站显示自动滚动开关
- 支持删除操作

#### 2.4.2 全局设置
- 显示拦截成功提示（右上角 Toast，2秒）
- 全局自动滚动开关（默认关闭）
- 自动滚动参数配置：
  - 滚动速度（100-5000ms，默认 800）
  - 底部停留时间（0-10000ms，默认 2000）
  - 完成后返回页面顶部（默认开启）

#### 2.4.3 导入/导出配置
- 导出为 JSON 文件
- 从 JSON 文件导入
- 配置格式验证

#### 2.4.4 语言设置
- 支持 10 种语言：
  - 中文 (zh)
  - English (en)
  - Español (es)
  - العربية (ar)
  - हिन्दी (hi)
  - Français (fr)
  - Português (pt)
  - Deutsch (de)
  - 日本語 (ja)
  - Русский (ru)

#### 2.4.5 高级设置
- **懒加载属性**：可自定义检测的属性列表，逗号分隔
- **占位符检测**：可自定义占位符关键词，逗号分隔
- **重置为默认**：一键恢复默认配置

---

## 3. UI 需求

### 3.1 Popup 弹窗
- 显示当前网站域名
- 显示当前网站状态（已启用/未启用）
- 添加/移除当前网站按钮
- 自动滚动开关（仅当网站启用时可用）
- 已配置网站列表（最多显示数量，支持删除）
- 完整设置页面入口
- 刷新页面按钮
- 底部版本号和作者信息

### 3.2 设置页面
- 分卡片布局：
  1. 已配置的网站
  2. 全局设置
  3. 导入/导出配置
  4. 语言设置
  5. 高级设置
- 底部作者信息统一格式：
  `v{version} | by 灵亦rEd | Built with Kimi 2.5 + ClaudeCode + Superpowers`

### 3.3 国际化 (i18n)
- 使用 `data-i18n` 属性标记可翻译元素
- 内联翻译对象（避免依赖 `_locales` 文件结构）
- 语言切换后页面自动刷新

---

## 4. 技术实现需求

### 4.1 架构设计

```
manifest.json
├── background/
│   ├── index.js (Chrome MV3 service worker)
│   ├── messageHandler.js
│   └── siteConfigManager.js
├── background-firefox.js (Firefox MV2 兼容)
├── content/
│   ├── index.js (主入口，合并所有模块)
│   └── styles.css
├── settings/
│   ├── index.html
│   └── app.js
├── popup.html
├── popup.js
├── i18n.js
├── i18n-manager.js
├── shared/
│   └── constants.js
└── _locales/
    └── {lang}/messages.json
```

### 4.2 内容脚本执行时机
- `run_at: "document_start"` - 确保在页面 JS 执行前完成拦截器注入

### 4.3 跨浏览器兼容
- Chrome: 使用 `chrome.*` API，MV3 manifest
- Firefox: 使用 `browser.*` API（支持 Promise），MV2 manifest
- 统一封装 Storage API 调用

### 4.4 版本管理
- 使用 `build.js` 脚本自动管理版本号
- 语义化版本控制（SemVer）：`major.minor.patch`
- 支持命令行参数：`major`, `minor`, `patch`
- 自动更新 `manifest.json` 和 HTML 文件中的版本显示
- 版本信息存储在 `version.json`

### 4.5 构建系统
- 一键构建 Chrome 和 Firefox 版本
- 自动复制公共资源
- 自动注入版本号到 HTML 文件
- 输出目录：`dist/chrome/` 和 `dist/firefox/`

### 4.6 图标处理
- 源图标：`icon.png`（建议 890x890+）
- 自动生成：`icons/icon16.png`, `icon48.png`, `icon128.png`
- 使用 `sharp` (Node.js) 进行图片缩放

---

## 5. 非功能需求

### 5.1 性能要求
- 内容脚本在页面加载前注入，无感知拦截
- 最小化 DOM 操作，使用 MutationObserver 仅处理必要变化
- 后台标签页支持，不阻塞页面加载

### 5.2 用户体验
- 默认关闭（新网站需要手动添加）
- 可选的拦截成功提示
- 自动滚动动画平滑流畅

### 5.3 可维护性
- 模块化代码结构
- 常量集中管理
- 详细的日志输出（仅调试模式）

---

## 6. 测试页面需求

提供以下测试页面验证功能：
- `test1-native-lazy.html` - 原生 `loading="lazy"` 测试
- `test2-data-src.html` - `data-src` 懒加载测试
- `test3-lazysizes.html` - lazysizes 库测试
- `test4-background.html` - 背景图片懒加载测试
- `test5-dynamic-mixed.html` - 动态加载和混合模式测试
- `test6-custom-io.html` - 自定义 IntersectionObserver 测试

---

## 7. 历史需求变更记录

| 版本 | 日期 | 变更内容 |
|------|------|----------|
| 1.0.0 | 初始 | 基础懒加载拦截功能 |
| 1.0.1 | 修复 | 修复 i18n 切换问题，修复 runtime.storage 错误 |
| 1.0.2 | 优化 | 优化语言显示，统一底部信息为英文 |
| 1.0.3 | 功能 | 支持 `<ignore_js_op>` 等特殊容器；懒加载属性和占位符可配置；版本自动管理 |

---

## 8. 待办事项/未来需求

- [ ] 支持自定义规则（正则匹配 URL）
- [ ] 黑白名单模式切换
- [ ] 按网站统计拦截图片数量
- [ ] 支持视频懒加载拦截
- [ ] iframe 懒加载拦截
- [ ] 快捷键快速启用/禁用
