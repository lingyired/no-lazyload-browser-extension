# Image Lazy Load Blocker - 设计文档

## 项目概述

一个跨浏览器扩展（Chrome/Firefox），用于禁用网站上的图片懒加载功能。针对不同类型的懒加载实现提供技术拦截方案，同时支持自动滚动作为兜底方案。

## 核心目标

- 禁用各种懒加载机制（原生 `loading="lazy"`、第三方库、自定义实现）
- 提供可配置的按网站策略（技术拦截 / 滚动兜底 / 禁用）
- 保持性能友好，仅在用户明确启用的网站上运行

---

## 架构设计

### 组件结构

```
┌─────────────────────────────────────────────────────────────┐
│                      Browser Extension                       │
├─────────────────────────────────────────────────────────────┤
│  manifest.json (Manifest V3)                                 │
├─────────────────────────────────────────────────────────────┤
│  Background Service Worker                                   │
│  ├── siteConfigManager.js    # 网站配置管理                  │
│  └── messageHandler.js       # 跨组件消息处理                │
├─────────────────────────────────────────────────────────────┤
│  Content Scripts                                             │
│  ├── injector.js             # 主入口，根据配置分发          │
│  ├── cssInjector.js          # CSS 覆盖层                    │
│  ├── jsInterceptor.js        # JS API 拦截层                 │
│  └── autoScroller.js         # 自动滚动兜底                  │
├─────────────────────────────────────────────────────────────┤
│  Settings Page                                               │
│  ├── index.html              # 设置页面 HTML                 │
│  ├── styles.css              # 设置页面样式                  │
│  └── app.js                  # 设置页面逻辑                  │
└─────────────────────────────────────────────────────────────┘
```

### 文件清单

```
├── manifest.json
├── background/
│   ├── siteConfigManager.js
│   └── messageHandler.js
├── content/
│   ├── injector.js
│   ├── cssInjector.js
│   ├── jsInterceptor.js
│   ├── autoScroller.js
│   └── styles.css          # Content script 注入的 CSS
├── settings/
│   ├── index.html
│   ├── styles.css
│   └── app.js
└── shared/
    └── constants.js        # 共享常量
```

---

## 核心功能模块

### 1. 网站配置系统

每个网站可配置三种策略：

| 策略 | 描述 |
|------|------|
| `tech-block` | 使用 CSS + JS 拦截技术禁用懒加载 |
| `scroll-fallback` | 直接执行自动滚动方案 |
| `disabled` | 该网站不启用扩展 |

**数据结构：**

```javascript
{
  "example.com": {
    "strategy": "tech-block",  // | "scroll-fallback" | "disabled"
    "addedAt": 1713700800000
  }
}
```

### 2. 技术拦截层 (tech-block)

#### 2.1 CSS 注入
覆盖常见的懒加载隐藏样式：

```css
/* 原生懒加载 */
img[loading="lazy"] {
  loading: eager !important;
}

/* 常见 data-attr 模式 */
img[data-src], img[data-original], img[data-lazy-src],
img[data-srcset], img[data-lazy-srcset] {
  content-visibility: visible !important;
}

/* 常见懒加载类名 */
.lazy, .lazyload, .lazyloading, .lozad,
[data-lazy], [data-lazy-src] {
  opacity: 1 !important;
  visibility: visible !important;
}
```

#### 2.2 JS 拦截
- 覆盖 `HTMLImageElement.prototype.loading` setter，强制设为 `"eager"`
- 劫持 `IntersectionObserver`：返回模拟的 Observer 自动触发 callback
- 拦截主流库检测：
  - `window.lazySizes` - lazysizes 库
  - `window.lozad` - lozad.js 库
  - `window.LazyLoad` - vanilla-lazyload 库
- 使用 `MutationObserver` 监听新增图片，自动处理

#### 2.3 图片强制加载逻辑
遍历所有图片元素：
1. 将 `data-src`, `data-original`, `data-lazy-src` 复制到 `src`
2. 将 `data-srcset`, `data-lazy-srcset` 复制到 `srcset`
3. 移除 `loading="lazy"` 属性

### 3. 自动滚动兜底 (scroll-fallback)

**执行流程：**

```
1. 记录初始滚动位置
2. 平滑滚动到页面底部
3. 停留 X 秒（可配置，默认 2 秒）
4. 可选择：停留后返回顶部或保持底部
5. 完成后可选：弹出通知显示已加载图片数
```

**配置参数：**

```javascript
{
  "scrollSpeed": 800,        // 滚动到底部耗时（毫秒）
  "stayDuration": 2000,      // 底部停留时间（毫秒）
  "returnToTop": true,       // 是否返回顶部
  "showNotification": true   // 完成后显示通知
}
```

### 4. 设置页面

**功能模块：**

1. **网站列表**
   - 显示已配置的网站
   - 每行：域名 + 策略下拉框 + 删除按钮
   - 支持搜索/筛选

2. **添加网站**
   - 输入框输入域名
   - 选择默认策略
   - 快速添加当前标签页网站

3. **全局设置**
   - 默认策略（对新网站）
   - 滚动参数配置

4. **导入/导出**
   - 配置 JSON 导出
   - JSON 配置导入

---

## 数据流

```
用户打开目标网站
        │
        ▼
Background: 检查该网站配置
        │
        ├── 未配置 ──► 使用默认策略（默认 disabled）
        │
        └── 已配置 ──► 读取 strategy
                          │
                    ┌─────┴─────┐
                    ▼           ▼
              tech-block    scroll-fallback
                    │           │
                    ▼           ▼
         注入 CSS + JS      执行自动滚动
         拦截懒加载         触发图片加载
```

---

## 跨浏览器兼容性

**Manifest V3 统一方案：**

| 特性 | Chrome | Firefox |
|------|--------|---------|
| Manifest V3 | ✅ 原生支持 | ✅ 支持 |
| Service Worker | ✅ | ✅ |
| Content Script | ✅ | ✅ |
| storage.local | ✅ | ✅ |

**差异处理：**
- 浏览器 API 检测：`typeof browser !== 'undefined'` 判断 Firefox
- manifest.json 中 `browser_specific_settings` 用于 Firefox 额外配置

---

## 错误处理

| 场景 | 处理方案 |
|------|----------|
| 内容脚本注入失败 | 静默失败，记录日志 |
| 滚动过程中用户手动滚动 | 中断自动滚动，保持用户控制 |
| 配置存储读取失败 | 使用内存默认配置，下次启动修复 |
| 大量图片导致卡顿 | 分批处理，使用 requestIdleCallback |

---

## 测试策略

1. **单元测试**
   - 配置管理逻辑
   - URL 匹配逻辑

2. **手动测试网站**
   - 使用原生 `loading="lazy"` 的网站
   - 使用 lazysizes 的网站
   - 使用 lozad.js 的网站
   - 使用自定义实现的网站（如淘宝、京东）

3. **跨浏览器测试**
   - Chrome 最新版
   - Firefox 最新版

---

## 未来扩展

1. 支持自动检测懒加载并提示用户添加
2. 图片加载进度显示
3. 按域名统计节省的滚动次数
4. 支持 Shadow DOM 内的懒加载

---

## 技术栈

- **标准：** Manifest V3
- **语言：** Vanilla JavaScript (ES2020+)
- **样式：** 原生 CSS
- **存储：** `chrome.storage.local` / `browser.storage.local`
