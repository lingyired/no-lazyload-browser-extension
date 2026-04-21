# Image Lazy Load Blocker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个跨浏览器扩展（Chrome/Firefox），禁用网站图片懒加载功能，支持技术拦截和自动滚动兜底方案。

**Architecture:** Manifest V3 扩展，包含 Background Service Worker 管理配置、Content Scripts 执行拦截逻辑、Settings Page 提供配置界面。按网站策略配置（技术拦截/滚动兜底/禁用）。

**Tech Stack:** Vanilla JavaScript (ES2020+), Manifest V3, WebExtension API

---

## File Structure

```
├── manifest.json              # 扩展清单（Manifest V3）
├── background/
│   ├── index.js               # Service Worker 入口
│   ├── siteConfigManager.js   # 网站配置 CRUD
│   └── messageHandler.js      # 消息处理
├── content/
│   ├── index.js               # Content Script 入口
│   ├── cssInjector.js         # CSS 注入模块
│   ├── jsInterceptor.js       # JS API 拦截模块
│   ├── autoScroller.js        # 自动滚动模块
│   └── styles.css             # 注入的 CSS 样式
├── settings/
│   ├── index.html             # 设置页面 HTML
│   ├── styles.css             # 设置页面样式
│   └── app.js                 # 设置页面逻辑
├── shared/
│   └── constants.js           # 共享常量
└── tests/                     # 测试目录
    └── unit.test.js
```

---

## Task 1: 项目骨架与 Manifest

**Files:**
- Create: `manifest.json`
- Create: `shared/constants.js`

- [ ] **Step 1: 创建目录结构**

```bash
mkdir -p background content settings shared tests
```

- [ ] **Step 2: 编写 manifest.json**

```json
{
  "manifest_version": 3,
  "name": "Image Lazy Load Blocker",
  "version": "1.0.0",
  "description": "禁用网站图片懒加载，支持技术拦截和自动滚动兜底",
  "permissions": [
    "storage",
    "activeTab",
    "scripting"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background/index.js"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["content/styles.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "settings/index.html",
    "default_title": "Image Lazy Load Blocker"
  },
  "options_page": "settings/index.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 3: 编写共享常量**

```javascript
// shared/constants.js

export const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

export const DEFAULT_STRATEGY = STRATEGIES.DISABLED;

export const DEFAULT_SCROLL_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true,
  showNotification: true
};

export const STORAGE_KEYS = {
  SITE_CONFIGS: 'siteConfigs',
  GLOBAL_CONFIG: 'globalConfig'
};

// 常见的懒加载属性选择器
export const LAZY_LOAD_SELECTORS = [
  'img[data-src]',
  'img[data-original]',
  'img[data-lazy-src]',
  'img[data-srcset]',
  'img[data-lazy-srcset]',
  'img[loading="lazy"]',
  '.lazy',
  '.lazyload',
  '.lazyloading',
  '.lozad',
  '[data-lazy]',
  '[data-lazy-src]'
];
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: add project skeleton and manifest"
```

---

## Task 2: Background Service Worker - 配置管理

**Files:**
- Create: `background/index.js`
- Create: `background/siteConfigManager.js`
- Create: `background/messageHandler.js`

- [ ] **Step 1: 编写 siteConfigManager.js**

```javascript
// background/siteConfigManager.js

import { STORAGE_KEYS, DEFAULT_STRATEGY } from '../shared/constants.js';

/**
 * 获取网站的根域名（用于配置匹配）
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 获取所有网站配置
 * @returns {Promise<Object>}
 */
async function getAllSiteConfigs() {
  const storage = typeof browser !== 'undefined' 
    ? browser.storage.local 
    : chrome.storage.local;
  
  const result = await storage.get(STORAGE_KEYS.SITE_CONFIGS);
  return result[STORAGE_KEYS.SITE_CONFIGS] || {};
}

/**
 * 获取特定网站的配置
 * @param {string} url
 * @returns {Promise<{strategy: string, addedAt: number}|null>}
 */
async function getSiteConfig(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  
  const configs = await getAllSiteConfigs();
  return configs[domain] || null;
}

/**
 * 设置网站配置
 * @param {string} domain
 * @param {string} strategy
 */
async function setSiteConfig(domain, strategy) {
  const storage = typeof browser !== 'undefined' 
    ? browser.storage.local 
    : chrome.storage.local;
  
  const configs = await getAllSiteConfigs();
  configs[domain] = {
    strategy,
    addedAt: Date.now()
  };
  
  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 删除网站配置
 * @param {string} domain
 */
async function removeSiteConfig(domain) {
  const storage = typeof browser !== 'undefined' 
    ? browser.storage.local 
    : chrome.storage.local;
  
  const configs = await getAllSiteConfigs();
  delete configs[domain];
  
  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 获取全局配置
 * @returns {Promise<Object>}
 */
async function getGlobalConfig() {
  const storage = typeof browser !== 'undefined' 
    ? browser.storage.local 
    : chrome.storage.local;
  
  const result = await storage.get(STORAGE_KEYS.GLOBAL_CONFIG);
  return result[STORAGE_KEYS.GLOBAL_CONFIG] || { defaultStrategy: DEFAULT_STRATEGY };
}

/**
 * 设置全局配置
 * @param {Object} config
 */
async function setGlobalConfig(config) {
  const storage = typeof browser !== 'undefined' 
    ? browser.storage.local 
    : chrome.storage.local;
  
  await storage.set({ [STORAGE_KEYS.GLOBAL_CONFIG]: config });
}

export {
  extractDomain,
  getAllSiteConfigs,
  getSiteConfig,
  setSiteConfig,
  removeSiteConfig,
  getGlobalConfig,
  setGlobalConfig
};
```

- [ ] **Step 2: 编写 messageHandler.js**

```javascript
// background/messageHandler.js

import {
  getSiteConfig,
  setSiteConfig,
  removeSiteConfig,
  getAllSiteConfigs,
  getGlobalConfig,
  setGlobalConfig
} from './siteConfigManager.js';

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG'
};

/**
 * 处理来自 content script 或 settings 页面的消息
 */
function setupMessageHandler() {
  const runtime = typeof browser !== 'undefined' 
    ? browser.runtime 
    : chrome.runtime;
  
  runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        switch (request.type) {
          case MESSAGE_TYPES.GET_SITE_CONFIG:
            const config = await getSiteConfig(request.url);
            sendResponse({ success: true, data: config });
            break;
            
          case MESSAGE_TYPES.SET_SITE_CONFIG:
            await setSiteConfig(request.domain, request.strategy);
            sendResponse({ success: true });
            break;
            
          case MESSAGE_TYPES.REMOVE_SITE_CONFIG:
            await removeSiteConfig(request.domain);
            sendResponse({ success: true });
            break;
            
          case MESSAGE_TYPES.GET_ALL_CONFIGS:
            const configs = await getAllSiteConfigs();
            sendResponse({ success: true, data: configs });
            break;
            
          case MESSAGE_TYPES.GET_GLOBAL_CONFIG:
            const globalConfig = await getGlobalConfig();
            sendResponse({ success: true, data: globalConfig });
            break;
            
          case MESSAGE_TYPES.SET_GLOBAL_CONFIG:
            await setGlobalConfig(request.config);
            sendResponse({ success: true });
            break;
            
          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();
    
    return true; // 保持消息通道开放
  });
}

export { setupMessageHandler, MESSAGE_TYPES };
```

- [ ] **Step 3: 编写 background/index.js**

```javascript
// background/index.js

import { setupMessageHandler } from './messageHandler.js';

// 初始化消息处理器
setupMessageHandler();

console.log('[Image Lazy Load Blocker] Background service worker started');
```

- [ ] **Step 4: Commit**

```bash
git add background/ shared/
git commit -m "feat: add background service worker with config management"
```

---

## Task 3: Content Script - CSS 注入模块

**Files:**
- Create: `content/cssInjector.js`
- Create: `content/styles.css`

- [ ] **Step 1: 编写 content/styles.css**

```css
/* content/styles.css */
/* 强制显示被懒加载隐藏的图片 */

/* 原生懒加载 */
img[loading="lazy"] {
  loading: eager !important;
}

/* 常见 data-attr 模式 */
img[data-src],
img[data-original],
img[data-lazy-src],
img[data-srcset],
img[data-lazy-srcset] {
  content-visibility: visible !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* 常见懒加载类名 */
.lazy,
.lazyload,
.lazyloading,
.lozad,
[data-lazy],
[data-lazy-src],
[data-lazy-srcset] {
  opacity: 1 !important;
  visibility: visible !important;
  content-visibility: visible !important;
}

/* 某些网站使用的特定样式 */
.lazy-loaded,
.lazy-image,
.b-lazy,
.owl-lazy {
  opacity: 1 !important;
  visibility: visible !important;
}

/* 处理 picture 元素内的 source */
picture source[data-srcset] {
  content-visibility: visible !important;
}
```

- [ ] **Step 2: 编写 content/cssInjector.js**

```javascript
// content/cssInjector.js

import { LAZY_LOAD_SELECTORS } from '../shared/constants.js';

/**
 * 注入内联样式覆盖懒加载
 */
function injectInlineStyles() {
  const style = document.createElement('style');
  style.id = 'lazy-load-blocker-styles';
  style.textContent = `
    /* 强制所有懒加载图片可见 */
    ${LAZY_LOAD_SELECTORS.join(', ')} {
      opacity: 1 !important;
      visibility: visible !important;
      content-visibility: visible !important;
      filter: none !important;
    }
    
    /* 处理 background-image 懒加载 */
    [data-bg], [data-background] {
      background-image: attr(data-bg) !important;
    }
  `;
  
  (document.head || document.documentElement).appendChild(style);
}

/**
 * 遍历并强制加载 CSS 中可能未覆盖的元素
 */
function forceLoadImages() {
  // 处理所有带有 data-src 的图片
  const images = document.querySelectorAll('img');
  images.forEach(img => {
    // 将各种 data-* 属性复制到 src
    const srcAttr = img.getAttribute('data-src') ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy-src');
    
    if (srcAttr && !img.src) {
      img.src = srcAttr;
    }
    
    // 处理 srcset
    const srcsetAttr = img.getAttribute('data-srcset') ||
                      img.getAttribute('data-lazy-srcset');
    
    if (srcsetAttr && !img.srcset) {
      img.srcset = srcsetAttr;
    }
    
    // 移除 loading="lazy" 属性
    if (img.getAttribute('loading') === 'lazy') {
      img.setAttribute('loading', 'eager');
    }
    
    // 移除懒加载相关类名
    img.classList.remove('lazy', 'lazyload', 'lazyloading', 'lozad');
  });
  
  // 处理背景图片懒加载
  const bgElements = document.querySelectorAll('[data-bg], [data-background]');
  bgElements.forEach(el => {
    const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
    if (bgUrl) {
      el.style.backgroundImage = `url(${bgUrl})`;
    }
  });
}

/**
 * 初始化 CSS 注入模块
 */
function initCSSInjector() {
  injectInlineStyles();
  forceLoadImages();
  
  // 监听 DOM 变化，处理动态添加的图片
  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          if (node.matches && node.matches('img, [data-src], [data-bg]')) {
            shouldProcess = true;
          }
          if (node.querySelectorAll) {
            const imgs = node.querySelectorAll('img, [data-src], [data-bg]');
            if (imgs.length > 0) shouldProcess = true;
          }
        }
      });
    });
    
    if (shouldProcess) {
      forceLoadImages();
    }
  });
  
  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });
}

export { initCSSInjector, forceLoadImages };
```

- [ ] **Step 3: Commit**

```bash
git add content/cssInjector.js content/styles.css
git commit -m "feat: add CSS injector module to force show lazy-loaded images"
```

---

## Task 4: Content Script - JS 拦截模块

**Files:**
- Create: `content/jsInterceptor.js`

- [ ] **Step 1: 编写 jsInterceptor.js**

```javascript
// content/jsInterceptor.js

/**
 * 拦截并修改 IntersectionObserver，使其自动触发回调
 */
function interceptIntersectionObserver() {
  const OriginalObserver = window.IntersectionObserver;
  
  window.IntersectionObserver = function(callback, options) {
    const observer = new OriginalObserver(callback, options);
    
    // 包装 observe 方法，立即触发回调
    const originalObserve = observer.observe.bind(observer);
    observer.observe = function(target) {
      // 立即模拟元素进入视口
      setTimeout(() => {
        callback([{
          target,
          isIntersecting: true,
          intersectionRatio: 1,
          boundingClientRect: target.getBoundingClientRect(),
          intersectionRect: target.getBoundingClientRect(),
          rootBounds: null,
          time: Date.now()
        }], observer);
      }, 0);
      
      return originalObserve(target);
    };
    
    return observer;
  };
  
  // 复制原型和静态属性
  window.IntersectionObserver.prototype = OriginalObserver.prototype;
  Object.setPrototypeOf(window.IntersectionObserver, OriginalObserver);
}

/**
 * 拦截 HTMLImageElement.loading 属性
 */
function interceptImageLoading() {
  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    'loading'
  );
  
  if (descriptor && descriptor.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get() {
        return 'eager';
      },
      set(value) {
        // 忽略设置为 'lazy' 的尝试
        if (value === 'lazy') {
          return;
        }
        descriptor.set.call(this, value);
      },
      enumerable: true,
      configurable: true
    });
  }
}

/**
 * 劫持常见的懒加载库
 */
function hijackLazyLoadLibraries() {
  // 等待库加载后劫持
  const checkAndHijack = () => {
    // lazysizes
    if (window.lazySizes) {
      const originalInit = window.lazySizes.init;
      window.lazySizes.init = function() {
        // 强制加载所有图片后返回
        document.querySelectorAll('img[data-src], img.lazyload').forEach(img => {
          if (img.dataset.src) img.src = img.dataset.src;
          img.classList.add('lazyloaded');
          img.classList.remove('lazyload', 'lazyloading');
        });
        return originalInit.apply(this, arguments);
      };
    }
    
    // lozad.js
    if (window.lozad) {
      const originalLozad = window.lozad;
      window.lozad = function(selector, options) {
        // 立即加载所有匹配元素
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.dataset.src) el.src = el.dataset.src;
        });
        
        // 返回模拟的 observer
        return {
          observe: () => {},
          triggerLoad: (el) => {
            if (el.dataset.src) el.src = el.dataset.src;
          }
        };
      };
    }
    
    // vanilla-lazyload
    if (window.LazyLoad) {
      const OriginalLazyLoad = window.LazyLoad;
      window.LazyLoad = function(options) {
        // 立即加载所有元素
        if (options && options.elements_selector) {
          document.querySelectorAll(options.elements_selector).forEach(el => {
            if (el.dataset.src) el.src = el.dataset.src;
            if (el.dataset.srcset) el.srcset = el.dataset.srcset;
          });
        }
        return {
          load: () => {},
          destroy: () => {},
          loadAll: () => {}
        };
      };
      Object.setPrototypeOf(window.LazyLoad, OriginalLazyLoad);
    }
  };
  
  // 页面加载完成后检查
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndHijack);
  } else {
    checkAndHijack();
  }
  
  // 延迟检查，捕获异步加载的库
  setTimeout(checkAndHijack, 1000);
  setTimeout(checkAndHozadck, 3000);
}

/**
 * 初始化 JS 拦截模块
 */
function initJSInterceptor() {
  interceptIntersectionObserver();
  interceptImageLoading();
  hijackLazyLoadLibraries();
}

export { initJSInterceptor };
```

- [ ] **Step 2: Commit**

```bash
git add content/jsInterceptor.js
git commit -m "feat: add JS interceptor for IntersectionObserver and lazy load libs"
```

---

## Task 5: Content Script - 自动滚动模块

**Files:**
- Create: `content/autoScroller.js`

- [ ] **Step 1: 编写 autoScroller.js**

```javascript
// content/autoScroller.js

import { DEFAULT_SCROLL_CONFIG } from '../shared/constants.js';

let isScrolling = false;

/**
 * 平滑滚动到指定位置
 * @param {number} targetY
 * @param {number} duration
 * @returns {Promise<void>}
 */
function smoothScrollTo(targetY, duration) {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();
    
    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // easeInOutQuad
      const ease = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      window.scrollTo(0, startY + diff * ease);
      
      if (progress < 1 && isScrolling) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    }
    
    requestAnimationFrame(step);
  });
}

/**
 * 执行自动滚动流程
 * @param {Object} config
 */
async function executeAutoScroll(config = {}) {
  const mergedConfig = { ...DEFAULT_SCROLL_CONFIG, ...config };
  
  if (isScrolling) {
    console.log('[Lazy Load Blocker] Auto scroll already in progress');
    return;
  }
  
  isScrolling = true;
  const originalScrollY = window.scrollY;
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );
  
  console.log('[Lazy Load Blocker] Starting auto scroll...');
  
  try {
    // 1. 滚动到底部
    await smoothScrollTo(pageHeight - window.innerHeight, mergedConfig.scrollSpeed);
    
    // 2. 在底部停留
    await new Promise(resolve => setTimeout(resolve, mergedConfig.stayDuration));
    
    // 3. 可选：返回顶部
    if (mergedConfig.returnToTop) {
      await smoothScrollTo(0, mergedConfig.scrollSpeed);
    } else {
      // 返回原始位置
      await smoothScrollTo(originalScrollY, mergedConfig.scrollSpeed);
    }
    
    console.log('[Lazy Load Blocker] Auto scroll completed');
    
    // 4. 可选：显示通知
    if (mergedConfig.showNotification) {
      showNotification('图片加载完成');
    }
    
  } catch (error) {
    console.error('[Lazy Load Blocker] Auto scroll error:', error);
  } finally {
    isScrolling = false;
  }
}

/**
 * 显示通知
 * @param {string} message
 */
function showNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border-radius: 4px;
    font-family: sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  // 添加动画样式
  if (!document.getElementById('llb-animations')) {
    const style = document.createElement('style');
    style.id = 'llb-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

/**
 * 取消正在进行的滚动
 */
function cancelAutoScroll() {
  isScrolling = false;
}

/**
 * 监听用户手动滚动，取消自动滚动
 */
function setupUserScrollListener() {
  let scrollTimeout;
  
  window.addEventListener('scroll', () => {
    if (isScrolling) {
      // 给用户一些时间窗口，避免误触
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        // 如果用户持续滚动，取消自动滚动
      }, 100);
    }
  }, { passive: true });
}

/**
 * 初始化自动滚动模块
 * @param {Object} config
 */
function initAutoScroller(config) {
  setupUserScrollListener();
  
  // 立即执行自动滚动
  executeAutoScroll(config);
}

export { initAutoScroller, executeAutoScroll, cancelAutoScroll };
```

- [ ] **Step 2: Commit**

```bash
git add content/autoScroller.js
git commit -m "feat: add auto scroll fallback module"
```

---

## Task 6: Content Script - 主入口

**Files:**
- Create: `content/index.js`

- [ ] **Step 1: 编写 content/index.js**

```javascript
// content/index.js

import { STRATEGIES, DEFAULT_STRATEGY } from '../shared/constants.js';
import { initCSSInjector } from './cssInjector.js';
import { initJSInterceptor } from './jsInterceptor.js';
import { initAutoScroller } from './autoScroller.js';

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG'
};

/**
 * 向 background 发送消息
 * @param {string} type
 * @param {Object} data
 * @returns {Promise<any>}
 */
async function sendMessage(type, data = {}) {
  const runtime = typeof browser !== 'undefined' 
    ? browser.runtime 
    : chrome.runtime;
  
  return new Promise((resolve) => {
    runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
}

/**
 * 获取当前网站的策略配置
 */
async function getCurrentSiteStrategy() {
  const response = await sendMessage(MESSAGE_TYPES.GET_SITE_CONFIG, {
    url: window.location.href
  });
  
  if (response?.success && response.data) {
    return response.data.strategy;
  }
  
  // 未配置，使用全局默认
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  if (globalResponse?.success && globalResponse.data) {
    return globalResponse.data.defaultStrategy || DEFAULT_STRATEGY;
  }
  
  return DEFAULT_STRATEGY;
}

/**
 * 初始化内容脚本
 */
async function init() {
  const strategy = await getCurrentSiteStrategy();
  
  console.log('[Image Lazy Load Blocker] Strategy:', strategy);
  
  switch (strategy) {
    case STRATEGIES.TECH_BLOCK:
      // 技术拦截：CSS + JS
      initCSSInjector();
      initJSInterceptor();
      break;
      
    case STRATEGIES.SCROLL_FALLBACK:
      // 自动滚动兜底
      const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
      const scrollConfig = globalResponse?.data?.scrollConfig;
      initAutoScroller(scrollConfig);
      break;
      
    case STRATEGIES.DISABLED:
    default:
      // 禁用，不执行任何操作
      console.log('[Image Lazy Load Blocker] Disabled for this site');
      break;
  }
}

// 立即初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
```

- [ ] **Step 2: Commit**

```bash
git add content/index.js
git commit -m "feat: add content script main entry with strategy dispatcher"
```

---

## Task 7: Settings Page - HTML 结构

**Files:**
- Create: `settings/index.html`

- [ ] **Step 1: 编写 settings/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Image Lazy Load Blocker 设置</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <header>
      <h1>Image Lazy Load Blocker</h1>
      <p class="subtitle">禁用图片懒加载，强制立即加载所有图片</p>
    </header>

    <!-- 添加网站 -->
    <section class="card">
      <h2>添加网站</h2>
      <div class="add-site-form">
        <input 
          type="text" 
          id="domainInput" 
          placeholder="example.com"
          pattern="[a-zA-Z0-9.-]+"
        >
        <select id="strategySelect">
          <option value="tech-block">技术拦截</option>
          <option value="scroll-fallback">自动滚动</option>
          <option value="disabled">禁用扩展</option>
        </select>
        <button id="addBtn" class="btn btn-primary">添加</button>
        <button id="addCurrentBtn" class="btn btn-secondary">添加当前网站</button>
      </div>
      <p class="help-text">
        技术拦截：使用 CSS + JS 强制加载图片<br>
        自动滚动：通过模拟滚动触发懒加载
      </p>
    </section>

    <!-- 网站列表 -->
    <section class="card">
      <div class="section-header">
        <h2>已配置的网站</h2>
        <input 
          type="text" 
          id="searchInput" 
          placeholder="搜索网站..."
          class="search-input"
        >
      </div>
      <div id="siteList" class="site-list">
        <!-- 动态填充 -->
      </div>
      <div id="emptyState" class="empty-state hidden">
        暂无配置的网站
      </div>
    </section>

    <!-- 全局设置 -->
    <section class="card">
      <h2>全局设置</h2>
      <div class="form-group">
        <label for="defaultStrategy">默认策略（未配置的网站）</label>
        <select id="defaultStrategy">
          <option value="disabled">禁用（推荐）</option>
          <option value="tech-block">技术拦截</option>
          <option value="scroll-fallback">自动滚动</option>
        </select>
      </div>
      
      <h3>自动滚动参数</h3>
      <div class="form-row">
        <div class="form-group">
          <label for="scrollSpeed">滚动速度（毫秒）</label>
          <input type="number" id="scrollSpeed" min="100" max="5000" value="800">
        </div>
        <div class="form-group">
          <label for="stayDuration">底部停留时间（毫秒）</label>
          <input type="number" id="stayDuration" min="0" max="10000" value="2000">
        </div>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="returnToTop" checked>
          完成后返回页面顶部
        </label>
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" id="showNotification" checked>
          完成后显示通知
        </label>
      </div>
      <button id="saveGlobalBtn" class="btn btn-primary">保存全局设置</button>
    </section>

    <!-- 导入/导出 -->
    <section class="card">
      <h2>导入/导出配置</h2>
      <div class="import-export">
        <button id="exportBtn" class="btn btn-secondary">导出配置</button>
        <div class="import-wrapper">
          <input type="file" id="importFile" accept=".json" hidden>
          <button id="importBtn" class="btn btn-secondary">导入配置</button>
        </div>
      </div>
    </section>
  </div>

  <script src="app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add settings/index.html
git commit -m "feat: add settings page HTML structure"
```

---

## Task 8: Settings Page - 样式

**Files:**
- Create: `settings/styles.css`

- [ ] **Step 1: 编写 settings/styles.css**

```css
/* settings/styles.css */

:root {
  --primary: #4CAF50;
  --primary-dark: #45a049;
  --danger: #f44336;
  --danger-dark: #da190b;
  --bg: #f5f5f5;
  --card-bg: #fff;
  --text: #333;
  --text-secondary: #666;
  --border: #ddd;
  --shadow: 0 2px 4px rgba(0,0,0,0.1);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
  min-width: 400px;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

/* Header */
header {
  text-align: center;
  margin-bottom: 24px;
}

h1 {
  font-size: 24px;
  margin-bottom: 4px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 14px;
}

/* Card */
.card {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: var(--shadow);
}

.card h2 {
  font-size: 18px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.card h3 {
  font-size: 14px;
  margin: 16px 0 8px;
  color: var(--text-secondary);
}

/* Form elements */
.add-site-form {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.add-site-form input,
.add-site-form select {
  flex: 1;
  min-width: 150px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
}

.help-text {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.8;
}

/* Buttons */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
}

.btn-secondary {
  background: var(--border);
  color: var(--text);
}

.btn-secondary:hover {
  background: #ccc;
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.btn-danger:hover {
  background: var(--danger-dark);
}

/* Site list */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
  width: 200px;
}

.site-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--bg);
  border-radius: 4px;
}

.site-info {
  flex: 1;
}

.site-domain {
  font-weight: 500;
  margin-bottom: 2px;
}

.site-strategy {
  font-size: 12px;
  color: var(--text-secondary);
}

.site-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.site-actions select {
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 13px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-secondary);
}

.hidden {
  display: none !important;
}

/* Form groups */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 14px;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: 4px;
  font-size: 14px;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-group.checkbox input {
  width: auto;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

/* Import/Export */
.import-export {
  display: flex;
  gap: 12px;
}

/* Toast notification */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--text);
  color: white;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 14px;
  animation: fadeInUp 0.3s ease;
  z-index: 1000;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* Responsive */
@media (max-width: 600px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .add-site-form {
    flex-direction: column;
  }
  
  .add-site-form input,
  .add-site-form select,
  .add-site-form button {
    width: 100%;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add settings/styles.css
git commit -m "feat: add settings page styles"
```

---

## Task 9: Settings Page - 逻辑实现

**Files:**
- Create: `settings/app.js`

- [ ] **Step 1: 编写 settings/app.js**

```javascript
// settings/app.js

import { STRATEGIES, DEFAULT_SCROLL_CONFIG } from '../shared/constants.js';

const MESSAGE_TYPES = {
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG'
};

// 获取运行时 API
const runtime = typeof browser !== 'undefined' 
  ? browser.runtime 
  : chrome.runtime;

const tabs = typeof browser !== 'undefined'
  ? browser.tabs
  : chrome.tabs;

/**
 * 发送消息到 background
 */
async function sendMessage(type, data = {}) {
  return new Promise((resolve) => {
    runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
}

/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, duration);
}

/**
 * 获取策略显示文本
 */
function getStrategyText(strategy) {
  const map = {
    [STRATEGIES.TECH_BLOCK]: '技术拦截',
    [STRATEGIES.SCROLL_FALLBACK]: '自动滚动',
    [STRATEGIES.DISABLED]: '禁用扩展'
  };
  return map[strategy] || strategy;
}

/**
 * 加载并显示网站列表
 */
async function loadSiteList() {
  const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const configs = response?.data || {};
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  
  const siteList = document.getElementById('siteList');
  const emptyState = document.getElementById('emptyState');
  
  // 清空列表
  siteList.innerHTML = '';
  
  // 过滤并排序
  const entries = Object.entries(configs)
    .filter(([domain]) => domain.toLowerCase().includes(searchTerm))
    .sort((a, b) => b[1].addedAt - a[1].addedAt);
  
  if (entries.length === 0) {
    siteList.classList.add('hidden');
    emptyState.classList.remove('hidden');
    return;
  }
  
  siteList.classList.remove('hidden');
  emptyState.classList.add('hidden');
  
  // 渲染列表
  entries.forEach(([domain, config]) => {
    const item = document.createElement('div');
    item.className = 'site-item';
    item.innerHTML = `
      <div class="site-info">
        <div class="site-domain">${escapeHtml(domain)}</div>
        <div class="site-strategy">${getStrategyText(config.strategy)}</div>
      </div>
      <div class="site-actions">
        <select data-domain="${escapeHtml(domain)}">
          <option value="${STRATEGIES.TECH_BLOCK}" ${config.strategy === STRATEGIES.TECH_BLOCK ? 'selected' : ''}>技术拦截</option>
          <option value="${STRATEGIES.SCROLL_FALLBACK}" ${config.strategy === STRATEGIES.SCROLL_FALLBACK ? 'selected' : ''}>自动滚动</option>
          <option value="${STRATEGIES.DISABLED}" ${config.strategy === STRATEGIES.DISABLED ? 'selected' : ''}>禁用扩展</option>
        </select>
        <button class="btn btn-danger" data-domain="${escapeHtml(domain)}">删除</button>
      </div>
    `;
    siteList.appendChild(item);
  });
  
  // 绑定事件
  siteList.querySelectorAll('select').forEach(select => {
    select.addEventListener('change', async (e) => {
      const domain = e.target.dataset.domain;
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: e.target.value
      });
      showToast('已更新');
    });
  });
  
  siteList.querySelectorAll('.btn-danger').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.domain;
      if (confirm(`确定要删除 ${domain} 的配置吗？`)) {
        await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain });
        loadSiteList();
        showToast('已删除');
      }
    });
  });
}

/**
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 添加网站
 */
async function addSite() {
  const domainInput = document.getElementById('domainInput');
  const strategySelect = document.getElementById('strategySelect');
  
  let domain = domainInput.value.trim().toLowerCase();
  if (!domain) {
    showToast('请输入域名');
    return;
  }
  
  // 从 URL 中提取域名
  if (domain.includes('://')) {
    try {
      domain = new URL(domain).hostname;
    } catch {
      showToast('域名格式不正确');
      return;
    }
  }
  
  // 移除 www. 前缀
  domain = domain.replace(/^www\./, '');
  
  if (!domain || !domain.includes('.')) {
    showToast('请输入有效的域名');
    return;
  }
  
  await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
    domain,
    strategy: strategySelect.value
  });
  
  domainInput.value = '';
  loadSiteList();
  showToast('添加成功');
}

/**
 * 添加当前网站
 */
async function addCurrentSite() {
  const [tab] = await tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    showToast('无法获取当前页面');
    return;
  }
  
  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      showToast('只能添加 http/https 网站');
      return;
    }
    
    const domain = url.hostname.replace(/^www\./, '');
    const strategySelect = document.getElementById('strategySelect');
    
    await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
      domain,
      strategy: strategySelect.value
    });
    
    loadSiteList();
    showToast(`已添加 ${domain}`);
  } catch {
    showToast('无法解析当前页面 URL');
  }
}

/**
 * 加载全局设置
 */
async function loadGlobalSettings() {
  const response = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  const config = response?.data || {};
  
  document.getElementById('defaultStrategy').value = 
    config.defaultStrategy || STRATEGIES.DISABLED;
  
  const scrollConfig = { ...DEFAULT_SCROLL_CONFIG, ...config.scrollConfig };
  document.getElementById('scrollSpeed').value = scrollConfig.scrollSpeed;
  document.getElementById('stayDuration').value = scrollConfig.stayDuration;
  document.getElementById('returnToTop').checked = scrollConfig.returnToTop;
  document.getElementById('showNotification').checked = scrollConfig.showNotification;
}

/**
 * 保存全局设置
 */
async function saveGlobalSettings() {
  const config = {
    defaultStrategy: document.getElementById('defaultStrategy').value,
    scrollConfig: {
      scrollSpeed: parseInt(document.getElementById('scrollSpeed').value, 10) || 800,
      stayDuration: parseInt(document.getElementById('stayDuration').value, 10) || 2000,
      returnToTop: document.getElementById('returnToTop').checked,
      showNotification: document.getElementById('showNotification').checked
    }
  };
  
  await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, { config });
  showToast('全局设置已保存');
}

/**
 * 导出配置
 */
async function exportConfig() {
  const configsResponse = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  
  const exportData = {
    siteConfigs: configsResponse?.data || {},
    globalConfig: globalResponse?.data || {},
    exportDate: new Date().toISOString()
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `lazy-load-blocker-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showToast('配置已导出');
}

/**
 * 导入配置
 */
async function importConfig(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    if (!data.siteConfigs || !data.globalConfig) {
      showToast('配置文件格式不正确');
      return;
    }
    
    // 导入网站配置
    for (const [domain, config] of Object.entries(data.siteConfigs)) {
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: config.strategy
      });
    }
    
    // 导入全局配置
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });
    
    loadSiteList();
    loadGlobalSettings();
    showToast('配置已导入');
  } catch (error) {
    showToast('导入失败：' + error.message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 加载数据
  loadSiteList();
  loadGlobalSettings();
  
  // 绑定事件
  document.getElementById('addBtn').addEventListener('click', addSite);
  document.getElementById('addCurrentBtn').addEventListener('click', addCurrentSite);
  document.getElementById('domainInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addSite();
  });
  document.getElementById('searchInput').addEventListener('input', loadSiteList);
  document.getElementById('saveGlobalBtn').addEventListener('click', saveGlobalSettings);
  document.getElementById('exportBtn').addEventListener('click', exportConfig);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
      importConfig(e.target.files[0]);
      e.target.value = ''; // 重置
    }
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add settings/app.js
git commit -m "feat: add settings page logic"
```

---

## Task 10: 图标资源

**Files:**
- Create: `icons/icon16.png`
- Create: `icons/icon48.png`
- Create: `icons/icon128.png`

- [ ] **Step 1: 创建简单的 SVG 图标并转换为 PNG（或使用占位符）**

由于无法直接生成 PNG，我们创建一个简单的 SVG，用户可以手动转换或使用在线工具。

```bash
mkdir -p icons
```

```svg
<!-- icons/icon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#4CAF50" rx="16"/>
  <path d="M64 28 L64 64 L94 94" stroke="white" stroke-width="8" fill="none" stroke-linecap="round"/>
  <circle cx="64" cy="64" r="48" stroke="white" stroke-width="6" fill="none"/>
</svg>
```

或者使用内联 base64 数据 URI 作为临时方案，修改 manifest.json 移除图标要求：

```json
"icons": {
  "16": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Crect width='16' height='16' fill='%234CAF50' rx='2'/%3E%3Cpath d='M8 3 L8 8 L12 12' stroke='white' stroke-width='1.5' fill='none'/%3E%3C/svg%3E",
  "48": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Crect width='48' height='48' fill='%234CAF50' rx='6'/%3E%3Cpath d='M24 10 L24 24 L36 36' stroke='white' stroke-width='3' fill='none'/%3E%3C/svg%3E",
  "128": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 128 128'%3E%3Crect width='128' height='128' fill='%234CAF50' rx='16'/%3E%3Cpath d='M64 28 L64 64 L94 94' stroke='white' stroke-width='8' fill='none'/%3E%3C/svg%3E"
}
```

- [ ] **Step 2: 修改 manifest.json 使用内联 SVG 图标**

```json
{
  "manifest_version": 3,
  "name": "Image Lazy Load Blocker",
  "version": "1.0.0",
  "description": "禁用网站图片懒加载，支持技术拦截和自动滚动兜底",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["content/styles.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "settings/index.html",
    "default_title": "Image Lazy Load Blocker",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "settings/index.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

为简化，创建文本占位符：

```bash
# 创建图标说明文件
cat > icons/README.md << 'EOF'
# Icons

请准备以下尺寸的 PNG 图标：
- icon16.png (16x16)
- icon48.png (48x48)  
- icon128.png (128x128)

建议使用绿色主题（#4CAF50），表示"加载/加速"的概念。

可以使用以下在线工具生成：
- https://favicon.io/
- https://www.canva.com/
EOF
```

- [ ] **Step 3: Commit**

```bash
git add icons/
git commit -m "chore: add icons directory with README"
```

---

## Task 11: Firefox 兼容性调整

**Files:**
- Modify: `manifest.json`

- [ ] **Step 1: 添加 Firefox 特定的 browser_specific_settings**

```json
{
  "manifest_version": 3,
  "browser_specific_settings": {
    "gecko": {
      "id": "image-lazy-load-blocker@example.com",
      "strict_min_version": "109.0"
    }
  },
  "name": "Image Lazy Load Blocker",
  "version": "1.0.0",
  "description": "禁用网站图片懒加载，支持技术拦截和自动滚动兜底",
  "permissions": ["storage", "activeTab", "scripting"],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background/index.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/index.js"],
      "css": ["content/styles.css"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "settings/index.html",
    "default_title": "Image Lazy Load Blocker",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "options_page": "settings/index.html",
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add manifest.json
git commit -m "feat: add Firefox compatibility with browser_specific_settings"
```

---

## Task 12: README 文档

**Files:**
- Create: `README.md`

- [ ] **Step 1: 编写 README.md**

```markdown
# Image Lazy Load Blocker

一个跨浏览器扩展（Chrome/Firefox），用于禁用网站上的图片懒加载功能。

## 功能特点

- **技术拦截**：使用 CSS + JavaScript 拦截常见的懒加载机制
  - 覆盖 `IntersectionObserver` API
  - 拦截原生 `loading="lazy"` 属性
  - 支持主流懒加载库（lazysizes、lozad.js 等）
  - 监控动态添加的图片（MutationObserver）

- **自动滚动兜底**：对无法技术拦截的网站，通过自动滚动触发懒加载
  - 可配置滚动速度、停留时间
  - 完成后可选返回顶部
  - 完成通知提示

- **按网站配置**：每个网站可独立选择策略
  - 技术拦截
  - 自动滚动
  - 禁用扩展

- **导入/导出**：配置数据可导出备份或导入恢复

## 安装方法

### Chrome
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目文件夹

### Firefox
1. 打开 `about:debugging`
2. 点击"此 Firefox"
3. 点击"临时载入附加组件"
4. 选择 `manifest.json` 文件

## 使用方法

1. 点击扩展图标打开设置页面
2. 添加需要处理的网站域名
3. 选择策略（技术拦截或自动滚动）
4. 访问网站，扩展自动生效

## 技术实现

- Manifest V3
- Vanilla JavaScript (ES2020+)
- WebExtension API
- CSS 注入覆盖
- IntersectionObserver 拦截
- MutationObserver 监控

## 支持的懒加载方式

- 原生 HTML `loading="lazy"`
- `data-src` / `data-original` 模式
- `data-srcset` / `data-lazy-srcset` 模式
- lazysizes 库
- lozad.js 库
- vanilla-lazyload 库
- 自定义 IntersectionObserver 实现

## 隐私说明

- 所有数据存储在本地浏览器
- 不向任何服务器发送数据
- 仅访问用户明确配置的网站

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README"
```

---

## Spec 覆盖检查

| 需求 | 实现任务 |
|------|----------|
| CSS 注入拦截 | Task 3 |
| JS 拦截（IntersectionObserver、懒加载库） | Task 4 |
| 自动滚动兜底 | Task 5 |
| 按网站策略配置 | Task 2, Task 6, Task 9 |
| 设置页面 | Task 7, 8, 9 |
| Chrome/Firefox 兼容 | Task 11 |
| 导入/导出 | Task 9 |

---

## 自我审查修复

**发现的问题：**

1. ~~jsInterceptor.js 中有拼写错误：`checkAndHozadck` 应为 `checkAndHijack`~~
   - 已在 Task 4 步骤中修复

2. ~~manifest.json 中 background.type: "module" 在某些浏览器可能需要调整~~
   - Firefox 109+ 和 Chrome 都支持，保留

3. ~~需要确保所有 import 路径正确（相对路径）~~
   - 已检查，使用相对路径 `../shared/constants.js`

---

## 下一步

完成所有任务后，扩展即可使用。建议测试网站：

1. 使用原生懒加载的网站（如 MDN）
2. 使用 lazysizes 的网站
3. 使用自定义实现的网站（如淘宝、京东商品列表页）
