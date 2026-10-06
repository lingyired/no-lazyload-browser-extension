// content/index.js - 合并所有模块

// ============================================
// 常量定义 (来自 shared/constants.js)
// ============================================
const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

const DEFAULT_STRATEGY = STRATEGIES.DISABLED;

const DEFAULT_SCROLL_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true
};

const LAZY_LOAD_SELECTORS = [
  'img[data-src]',
  'img[data-original]',
  'img[data-lazy-src]',
  'img[data-srcset]',
  'img[data-lazy-srcset]',
  'img[loading="lazy"]',
  // 各种自定义懒加载实现
  'img[data-custom-src]',
  'img[data-lazy]',
  'img[data-defer-src]',
  'img[data-async]',
  'img[data-img-url]',
  'img[data-url]',
  'img[data-image]',
  'img[data-image-src]',
  'img[data-href]',
  // 包裹在 ignore_js_op 等自定义容器中的图片
  'ignore_js_op img[data-original]',
  'ignore_js_op img[data-src]',
  'ignore_js_op img[data-lazy-src]',
  '.ignore_js_op img[data-original]',
  '.ignore_js_op img[data-src]',
  '.ignore_js_op img[data-lazy-src]',
  '[class*="ignore"] img[data-original]',
  '[class*="ignore"] img[data-src]',
  // 通用包裹容器
  '[data-lazy] img',
  '[data-src] img',
  '.lazy',
  '.lazyload',
  '.lazyloading',
  '.lozad',
  '[data-lazy]',
  '[data-lazy-src]',
  '.custom-lazy',
  '.my-lazy',
  '.deferred',
  '.async-load'
];

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  GET_CUSTOM_ATTRIBUTES: 'GET_CUSTOM_ATTRIBUTES'
};

// 自定义属性配置（将从存储中加载）
let customAttributes = {
  lazyAttributes: ['data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'data-lazy-srcset'],
  placeholderPatterns: ['thumb', 'placeholder', 'loading', 'spinner', 'blank', 'empty', 'lazy', 'preview', 'temp', 'default']
};

/**
 * 从存储加载自定义属性配置
 */
async function loadCustomAttributes() {
  try {
    const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
    const response = await new Promise((resolve) => {
      runtime.sendMessage({ type: MESSAGE_TYPES.GET_CUSTOM_ATTRIBUTES }, (response) => {
        resolve(response);
      });
    });

    if (response?.success && response.data) {
      customAttributes = response.data;
      log('[LazyLoad Blocker] Loaded custom attributes:', customAttributes);
    }
  } catch (error) {
    logError('[LazyLoad Blocker] Failed to load custom attributes:', error);
  }
}

// ============================================
// 日志工具
// ============================================
let isLoggingEnabled = false;

function enableLogging() {
  isLoggingEnabled = true;
}

function log(...args) {
  if (isLoggingEnabled) {
    console.log(...args);
  }
}

function logError(...args) {
  // 错误始终输出，但使用原始 console.error
  console.error(...args);
}

// ============================================
// CSS 注入模块 (来自 cssInjector.js)
// ============================================
function injectInlineStyles() {
  log('[LazyLoad Blocker] Injecting CSS styles...');

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
  `;

  (document.head || document.documentElement).appendChild(style);
  log('[LazyLoad Blocker] CSS styles injected');
}

function handleNativeLazyLoading() {
  log('[LazyLoad Blocker] Handling native lazy loading...');

  const processLazyImages = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    log('[LazyLoad Blocker] Found', lazyImages.length, 'native lazy images');

    lazyImages.forEach((img, index) => {
      log(`[LazyLoad Blocker] Processing native lazy image ${index + 1}:`, img.src || 'no src yet');
      img.setAttribute('loading', 'eager');
      img.loading = 'eager';
    });
  };

  const processBackgrounds = () => {
    const bgElements = document.querySelectorAll('[data-bg], [data-background]');
    log('[LazyLoad Blocker] Found', bgElements.length, 'background elements to process early');

    bgElements.forEach((el, index) => {
      const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
      if (bgUrl) {
        const currentBg = el.style.backgroundImage;
        if (!currentBg || currentBg === 'none') {
          log(`[LazyLoad Blocker] Early background ${index + 1}: setting to "${bgUrl}"`);
          el.style.backgroundImage = `url("${bgUrl}")`;
          el.classList.add('loaded');
        }
      }
    });
  };

  // 立即处理
  if (document.readyState !== 'loading') {
    processLazyImages();
    processBackgrounds();
  }

  // DOMContentLoaded 时处理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      processLazyImages();
      processBackgrounds();
    });
  }

  // 延迟处理
  setTimeout(processLazyImages, 100);
  setTimeout(processBackgrounds, 100);
  setTimeout(processLazyImages, 500);
  setTimeout(processBackgrounds, 500);
  setTimeout(processLazyImages, 1000);
  setTimeout(processBackgrounds, 1000);
}

function forceLoadImages() {
  log('[LazyLoad Blocker] Force loading images...');

  // 处理被任意容器包裹的图片（支持 ignore_js_op 等特殊容器）
  const processWrappedImages = () => {
    // 使用用户配置的懒加载属性
    const lazyAttrs = customAttributes.lazyAttributes;

    lazyAttrs.forEach(attr => {
      // 查找所有有这个属性的 img
      const imgs = document.querySelectorAll(`img[${attr}]`);
      imgs.forEach((img, index) => {
        const currentSrc = img.getAttribute('src') || '';
        const currentSrcLower = currentSrc.toLowerCase();

        // 检查是否是占位图（使用用户配置的关键词）
        const isPlaceholder = !currentSrc ||
                             currentSrc.startsWith('data:image/gif') ||
                             currentSrc.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') ||
                             // 使用用户配置的占位符检测关键词
                             customAttributes.placeholderPatterns.some(pattern =>
                               currentSrcLower.includes(pattern.toLowerCase())
                             ) ||
                             // 检测预览图类名
                             img.classList.contains('preview-img') ||
                             img.classList.contains('thumb');

        if (isPlaceholder) {
          const src = img.getAttribute(attr);
          if (src) {
            log(`[LazyLoad Blocker] Image with ${attr} ${index + 1}: setting src`, src);
            img.src = src;
            // 移除懒加载类名
            img.classList.remove('lazy', 'lazyload', 'lazyloading', 'lozad');
            // 添加已加载标记
            img.classList.add('loaded');
            // 触发自定义事件通知某些网站
            img.dispatchEvent(new Event('load'));
          }
        }
      });
    });
  };

  // 立即处理被包裹的图片
  processWrappedImages();

  const images = document.querySelectorAll('img');
  log('[LazyLoad Blocker] Processing', images.length, 'total images');

  images.forEach((img, index) => {
    // 处理标准懒加载属性
    const srcAttr = img.getAttribute('data-src') ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy-src');

    // 检查是否是占位图（data URI 或空/无效 src 或常见占位图文件名）
    const currentSrc = img.getAttribute('src') || '';
    const currentSrcLower = currentSrc.toLowerCase();
    const isPlaceholder = !currentSrc ||
                         currentSrc.startsWith('data:image/gif') ||
                         currentSrc.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==') ||
                         // 使用用户配置的占位符检测关键词
                         customAttributes.placeholderPatterns.some(pattern =>
                           currentSrcLower.includes(pattern.toLowerCase())
                         ) ||
                         // 检测预览图类名
                         img.classList.contains('preview-img') ||
                         img.classList.contains('thumb');

    if (srcAttr && isPlaceholder) {
      log(`[LazyLoad Blocker] Image ${index + 1}: setting src from data attribute`, srcAttr);
      img.src = srcAttr;
    }

    // 处理 srcset
    const srcsetAttr = img.getAttribute('data-srcset') ||
                      img.getAttribute('data-lazy-srcset');

    if (srcsetAttr && !img.srcset) {
      log(`[LazyLoad Blocker] Image ${index + 1}: setting srcset`, srcsetAttr);
      img.srcset = srcsetAttr;
    }

    // 处理自定义懒加载属性（使用用户配置的属性列表）
    const customSrcAttrs = customAttributes.lazyAttributes;

    for (const attr of customSrcAttrs) {
      const customSrc = img.getAttribute(attr);
      if (customSrc && isPlaceholder) {
        log(`[LazyLoad Blocker] Image ${index + 1}: setting src from ${attr}`, customSrc);
        img.src = customSrc;
        break; // 只使用第一个找到的
      }
    }

    // 移除原生懒加载属性
    if (img.getAttribute('loading') === 'lazy') {
      log(`[LazyLoad Blocker] Image ${index + 1}: removing loading="lazy"`);
      img.setAttribute('loading', 'eager');
    }

    // 移除懒加载相关类名
    img.classList.remove('lazy', 'lazyload', 'lazyloading', 'lozad', 'custom-lazy', 'my-lazy', 'deferred', 'async-load');
  });

  // 再次处理被包裹的图片（可能在DOM处理后有变化）
  setTimeout(processWrappedImages, 100);
  setTimeout(processWrappedImages, 500);

  const bgElements = document.querySelectorAll('[data-bg], [data-background]');
  log('[LazyLoad Blocker] Processing', bgElements.length, 'background elements');

  bgElements.forEach((el, index) => {
    const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
    if (bgUrl) {
      // 检查是否已经设置了背景图片
      const currentBg = el.style.backgroundImage;
      if (!currentBg || currentBg === 'none') {
        log(`[LazyLoad Blocker] Background ${index + 1}: setting to "${bgUrl}"`);
        el.style.backgroundImage = `url("${bgUrl}")`;
        el.classList.add('loaded');
      } else {
  log(`[LazyLoad Blocker] Background ${index + 1}: already set to "${currentBg}"`);
      }
    }
  });
}

function initCSSInjector() {
  log('[LazyLoad Blocker] Initializing CSS injector...');

  injectInlineStyles();
  handleNativeLazyLoading();
  forceLoadImages();

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    mutations.forEach(mutation => {
      // 处理新增节点
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches && node.matches('img, [data-src], [data-bg], [data-background]')) {
              shouldProcess = true;
            }
            if (node.querySelectorAll) {
              const imgs = node.querySelectorAll('img, [data-src], [data-bg], [data-background]');
              if (imgs.length > 0) shouldProcess = true;
            }
          }
        });
      }
      // 处理属性变化
      if (mutation.type === 'attributes') {
        if (mutation.attributeName === 'data-bg' || mutation.attributeName === 'data-background') {
          const target = mutation.target;
          const bgUrl = target.getAttribute(mutation.attributeName);
          if (bgUrl) {
            log('[LazyLoad Blocker] Attribute mutation detected:', mutation.attributeName, bgUrl);
            target.style.backgroundImage = `url("${bgUrl}")`;
            target.classList.add('loaded');
          }
        }
      }
    });

    if (shouldProcess) {
      log('[LazyLoad Blocker] DOM mutation detected, processing new images');
      forceLoadImages();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-bg', 'data-background']
  });

  log('[LazyLoad Blocker] CSS injector initialized');
}

// ============================================
// JS 拦截模块 (来自 jsInterceptor.js)
// ============================================
// 策略标志，初始为 null（未确定）
let currentStrategy = null;
let strategyResolved = false;
let pendingIOObservers = []; // 存储后台模式下创建的 IO 实例

// IO 劫持现在通过 preInitIntersectionObserver() 在文件顶部完成

function initJSInterceptor() {
  log('[LazyLoad Blocker] Initializing JS interceptor...');
  // IO 拦截已在文件顶部预初始化
  // 这里只初始化其他拦截器
  hijackLazyLoadLibraries();
  log('[LazyLoad Blocker] JS interceptor initialized');
}

function interceptImageLoading() {
  log('[LazyLoad Blocker] Setting up loading property interceptor');

  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    'loading'
  );

  log('[LazyLoad Blocker] Original loading descriptor:', descriptor);

  if (descriptor && descriptor.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get() {
        return 'eager';
      },
      set(value) {
        log('[LazyLoad Blocker] loading setter called with:', value);
        if (value === 'lazy') {
          log('[LazyLoad Blocker] Blocked lazy loading attempt');
          return;
        }
        descriptor.set.call(this, value);
      },
      enumerable: true,
      configurable: true
    });
    log('[LazyLoad Blocker] loading property intercepted');
  } else {
    log('[LazyLoad Blocker] loading descriptor not found or no setter');
  }

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  log('[LazyLoad Blocker] Found', lazyImages.length, 'images with loading="lazy"');

  lazyImages.forEach((img, index) => {
    log(`[LazyLoad Blocker] Processing image ${index + 1}:`, img.src);
    img.setAttribute('loading', 'eager');
    if (img.dataset && img.dataset.src) {
      log(`[LazyLoad Blocker] Image ${index + 1} has data-src:`, img.dataset.src);
      img.src = img.dataset.src;
    }
  });
}

function hijackLazyLoadLibraries() {
  log('[LazyLoad Blocker] Setting up library interceptors');

  const checkAndHijack = () => {
    log('[LazyLoad Blocker] Checking for lazy load libraries...');

    if (window.lazySizes) {
      log('[LazyLoad Blocker] Found lazysizes library');
      const originalInit = window.lazySizes.init;
      window.lazySizes.init = function() {
        log('[LazyLoad Blocker] Hijacking lazysizes.init');
        document.querySelectorAll('img[data-src], img.lazyload').forEach(img => {
          if (img.dataset.src) img.src = img.dataset.src;
          img.classList.add('lazyloaded');
          img.classList.remove('lazyload', 'lazyloading');
        });
        return originalInit.apply(this, arguments);
      };
    }

    if (window.lozad) {
      log('[LazyLoad Blocker] Found lozad.js library');
      const originalLozad = window.lozad;
      window.lozad = function(selector, options) {
        log('[LazyLoad Blocker] Hijacking lozad()');
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el.dataset.src) el.src = el.dataset.src;
        });
        return {
          observe: () => {},
          triggerLoad: (el) => {
            if (el.dataset.src) el.src = el.dataset.src;
          }
        };
      };
    }

    if (window.LazyLoad) {
      log('[LazyLoad Blocker] Found vanilla-lazyload library');
      const OriginalLazyLoad = window.LazyLoad;
      window.LazyLoad = function(options) {
        log('[LazyLoad Blocker] Hijacking LazyLoad constructor');
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAndHijack);
  } else {
    checkAndHijack();
  }

  setTimeout(checkAndHijack, 1000);
  setTimeout(checkAndHijack, 3000);
}

// ============================================
// 自动滚动模块 (来自 autoScroller.js)
// ============================================
let isScrolling = false;
let autoScrollExecuted = false; // 标记是否已经执行过自动滚动

function smoothScrollTo(targetY, duration) {
  return new Promise((resolve) => {
    // 在后台标签页，window.scrollTo 可能不生效
    // 但我们仍然尝试执行，以便页面切换到前台时位置正确
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = Date.now();
    const stepTime = 16; // ~60fps

    function step() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      // 尝试滚动，即使在后台也要执行
      window.scrollTo(0, startY + diff * ease);

      if (progress < 1 && isScrolling) {
        setTimeout(step, stepTime);
      } else {
        resolve();
      }
    }

    setTimeout(step, stepTime);
  });
}

async function executeAutoScroll(config = {}) {
  const mergedConfig = { ...DEFAULT_SCROLL_CONFIG, ...config };

  // 如果已经执行过自动滚动，不再执行
  if (autoScrollExecuted) {
    log('[Lazy Load Blocker] Auto scroll already executed, skipping');
    return;
  }

  if (isScrolling) {
    log('[Lazy Load Blocker] Auto scroll already in progress');
    return;
  }

  // 如果页面在后台，等待切换到前台再执行
  if (document.hidden) {
    log('[Lazy Load Blocker] Page is in background, waiting for visibility...');
    await new Promise(resolve => {
      const handler = () => {
        if (!document.hidden) {
          document.removeEventListener('visibilitychange', handler);
          // 稍微延迟确保渲染完成
          setTimeout(resolve, 100);
        }
      };
      document.addEventListener('visibilitychange', handler);
    });
    log('[Lazy Load Blocker] Page is now visible, starting auto scroll');
  }

  isScrolling = true;
  const originalScrollY = window.scrollY;
  const pageHeight = Math.max(
    document.body.scrollHeight,
    document.documentElement.scrollHeight
  );

  log('[Lazy Load Blocker] Starting auto scroll...');

  try {
    await smoothScrollTo(pageHeight - window.innerHeight, mergedConfig.scrollSpeed);
    await new Promise(resolve => setTimeout(resolve, mergedConfig.stayDuration));

    if (mergedConfig.returnToTop) {
      await smoothScrollTo(0, mergedConfig.scrollSpeed);
    } else {
      await smoothScrollTo(originalScrollY, mergedConfig.scrollSpeed);
    }

    log('[Lazy Load Blocker] Auto scroll completed');
    // 标记自动滚动已执行
    autoScrollExecuted = true;
  } catch (error) {
    console.error('[Lazy Load Blocker] Auto scroll error:', error);
  } finally {
    isScrolling = false;
  }
}

function setupUserScrollListener() {
  let scrollTimeout;

  window.addEventListener('scroll', () => {
    if (isScrolling) {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {}, 100);
    }
  }, { passive: true });
}

function initAutoScroller(config) {
  setupUserScrollListener();
  executeAutoScroll(config);
}

// ============================================
// Toast 提示模块
// ============================================
function showToast(message, duration = 1500) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: llb-slideIn 0.3s ease;
    max-width: 280px;
    line-height: 1.4;
  `;
  toast.textContent = message;

  // 添加动画样式（如果还没有）
  if (!document.getElementById('llb-toast-styles')) {
    const style = document.createElement('style');
    style.id = 'llb-toast-styles';
    style.textContent = `
      @keyframes llb-slideIn {
        from { transform: translateY(100%); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes llb-slideOut {
        from { transform: translateY(0); opacity: 1; }
        to { transform: translateY(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'llb-slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================
// 主逻辑 (来自 index.js)
// ============================================

// 预初始化标志 - 用于控制劫持行为
let ioImmediateTrigger = false;
let ioInterceptorReady = false;

// 立即执行关键的 JS 拦截（必须在页面 JS 运行前完成）
// 使用预初始化的 IO 劫持，支持后台标签页
preInitIntersectionObserver();
interceptImageLoading();

// 预初始化 IO 劫持 - 在策略确定前就能工作
function preInitIntersectionObserver() {
  if (ioInterceptorReady) return;

  const OriginalObserver = window.IntersectionObserver;

  window.IntersectionObserver = function(callback, options) {
    const observer = new OriginalObserver(callback, options);
    const originalObserve = observer.observe.bind(observer);

    observer.observe = function(target) {
      const result = originalObserve(target);

      // 如果启用了立即触发模式，立即触发回调
      if (ioImmediateTrigger) {
        setTimeout(() => {
          try {
            callback([{
              target,
              isIntersecting: true,
              intersectionRatio: 1,
              boundingClientRect: target.getBoundingClientRect ? target.getBoundingClientRect() : { top: 0, left: 0, bottom: 0, right: 0, width: target.offsetWidth || 0, height: target.offsetHeight || 0 },
              intersectionRect: target.getBoundingClientRect ? target.getBoundingClientRect() : { top: 0, left: 0, bottom: 0, right: 0, width: target.offsetWidth || 0, height: target.offsetHeight || 0 },
              rootBounds: null,
              time: Date.now()
            }], observer);
          } catch (e) {
            // 忽略回调错误
          }
        }, 0);
      }

      return result;
    };

    return observer;
  };

  window.IntersectionObserver.prototype = OriginalObserver.prototype;
  Object.setPrototypeOf(window.IntersectionObserver, OriginalObserver);
  ioInterceptorReady = true;
}

// 启用 IO 立即触发模式
function enableIOImmediateTrigger() {
  ioImmediateTrigger = true;
  log('[LazyLoad Blocker] IO immediate trigger enabled');
}

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

async function getCurrentSiteStrategy() {
  const url = window.location.href;

  const response = await sendMessage(MESSAGE_TYPES.GET_SITE_CONFIG, { url });

  if (response?.success && response.data) {
    return {
      strategy: response.data.strategy,
      scrollFallback: response.data.scrollFallback
    };
  }

  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);

  if (globalResponse?.success && globalResponse.data) {
    return {
      strategy: globalResponse.data.defaultStrategy || DEFAULT_STRATEGY,
      scrollFallback: false
    };
  }

  return {
    strategy: DEFAULT_STRATEGY,
    scrollFallback: false
  };
}

async function init() {
  // 先加载自定义属性配置
  await loadCustomAttributes();

  const siteConfig = await getCurrentSiteStrategy();
  const strategy = siteConfig.strategy;
  const siteScrollFallback = siteConfig.scrollFallback;
  currentStrategy = strategy;
  strategyResolved = true;

  // 只有在网站启用时才启用日志
  if (strategy !== STRATEGIES.DISABLED) {
    enableLogging();
  }

  log('[Image Lazy Load Blocker] Starting initialization...');
  log('[Image Lazy Load Blocker] Document readyState:', document.readyState);

  // 获取全局配置
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  const globalConfig = globalResponse?.data || {};

  log('[Image Lazy Load Blocker] Final strategy:', strategy, 'siteScrollFallback:', siteScrollFallback, 'globalFallback:', globalConfig.fallbackToScroll);
  // 优先使用网站的 scrollFallback 设置，否则使用全局设置（默认 false）
  const fallbackToScroll = siteScrollFallback === true || globalConfig.fallbackToScroll === true;
  const showInterceptionToast = globalConfig.showInterceptionToast === true; // 默认关闭
  const scrollConfig = {
    scrollSpeed: globalConfig.scrollSpeed || 800,
    stayDuration: globalConfig.stayDuration || 2000,
    returnToTop: globalConfig.returnToTop !== false
  };

  switch (strategy) {
    case STRATEGIES.TECH_BLOCK:
      // 启用 IO 立即触发模式（支持后台标签页）
      enableIOImmediateTrigger();

      if (fallbackToScroll) {
        // 自动滚动模式：启用预初始化的 IO 劫持
        log('[Image Lazy Load Blocker] Applying AUTO SCROLL mode');

        // 同时处理已有的 data-src 图片
        initCSSInjector();
        hijackLazyLoadLibraries();

        // 如果页面在前台，执行滚动动画；在后台时 IO 劫持已经处理了加载
        if (!document.hidden) {
          initAutoScroller(scrollConfig);
        } else {
          log('[Image Lazy Load Blocker] Page in background, IO hijack active');
        }

        // 监听页面变为可见，执行滚动动画（只执行一次）
        document.addEventListener('visibilitychange', () => {
          if (!document.hidden && !isScrolling && !autoScrollExecuted) {
            log('[Image Lazy Load Blocker] Page became visible, starting scroll');
            initAutoScroller(scrollConfig);
          }
        });
      } else {
        // 纯技术拦截模式
        log('[Image Lazy Load Blocker] Applying TECH_BLOCK strategy');
        initCSSInjector();
        hijackLazyLoadLibraries();

        // 显示拦截成功提示
        if (showInterceptionToast) {
          showToast('已拦截懒加载，图片正在加载中...', 1500);
        }
      }
      break;

    case STRATEGIES.DISABLED:
    default:
      log('[Image Lazy Load Blocker] Disabled for this site');
      break;
  }

  log('[Image Lazy Load Blocker] Initialization complete');
}

/**
 * 检查是否还有未加载的懒加载图片，如果有则执行自动滚动兜底
 */
function checkAndFallback(scrollConfig) {
  log('[Image Lazy Load Blocker] Checking for unloaded lazy images...');

  // 检查各种可能表示图片未加载的状态
  const unloadedSelectors = [
    'img[data-src]',
    'img[data-original]',
    'img[data-lazy-src]',
    'img[data-custom-src]',
    'img[data-lazy]',
    'img[data-async]',
    'img[loading="lazy"]',
    '.lazy:not(.loaded)',
    '.lazyload:not(.loaded)',
    '.custom-lazy:not(.loaded)'
  ];

  let unloadedCount = 0;
  unloadedSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    unloadedCount += elements.length;
    if (elements.length > 0) {
      log(`[Image Lazy Load Blocker] Found ${elements.length} unloaded images with selector: ${selector}`);
    }
  });

  // 同时检查图片的 complete 状态
  const allImages = document.querySelectorAll('img');
  const incompleteImages = Array.from(allImages).filter(img => !img.complete || img.naturalHeight === 0);

  log(`[Image Lazy Load Blocker] Unloaded by selector: ${unloadedCount}, Incomplete images: ${incompleteImages.length}`);

  // 如果还有未加载的图片，执行自动滚动兜底
  if (unloadedCount > 0 || incompleteImages.length > 5) {
    log('[Image Lazy Load Blocker] Unloaded images detected, triggering auto-scroll fallback...');
    initAutoScroller(scrollConfig);
  } else {
    log('[Image Lazy Load Blocker] All images appear to be loaded, no fallback needed');
  }
}

if (document.readyState === 'loading') {
  init();
} else {
  init();
}
