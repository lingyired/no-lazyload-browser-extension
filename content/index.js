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
  returnToTop: true,
  showNotification: true
};

const LAZY_LOAD_SELECTORS = [
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

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG'
};

// ============================================
// CSS 注入模块 (来自 cssInjector.js)
// ============================================
function injectInlineStyles() {
  console.log('[LazyLoad Blocker] Injecting CSS styles...');

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
  console.log('[LazyLoad Blocker] CSS styles injected');
}

function handleNativeLazyLoading() {
  console.log('[LazyLoad Blocker] Handling native lazy loading...');

  const processLazyImages = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    console.log('[LazyLoad Blocker] Found', lazyImages.length, 'native lazy images');

    lazyImages.forEach((img, index) => {
      console.log(`[LazyLoad Blocker] Processing native lazy image ${index + 1}:`, img.src || 'no src yet');
      img.setAttribute('loading', 'eager');
      img.loading = 'eager';
    });
  };

  const processBackgrounds = () => {
    const bgElements = document.querySelectorAll('[data-bg], [data-background]');
    console.log('[LazyLoad Blocker] Found', bgElements.length, 'background elements to process early');

    bgElements.forEach((el, index) => {
      const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
      if (bgUrl) {
        const currentBg = el.style.backgroundImage;
        if (!currentBg || currentBg === 'none') {
          console.log(`[LazyLoad Blocker] Early background ${index + 1}: setting to "${bgUrl}"`);
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
  console.log('[LazyLoad Blocker] Force loading images...');

  const images = document.querySelectorAll('img');
  console.log('[LazyLoad Blocker] Processing', images.length, 'total images');

  images.forEach((img, index) => {
    const srcAttr = img.getAttribute('data-src') ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy-src');

    if (srcAttr && !img.src) {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: setting src from data attribute`, srcAttr);
      img.src = srcAttr;
    }

    const srcsetAttr = img.getAttribute('data-srcset') ||
                      img.getAttribute('data-lazy-srcset');

    if (srcsetAttr && !img.srcset) {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: setting srcset`, srcsetAttr);
      img.srcset = srcsetAttr;
    }

    if (img.getAttribute('loading') === 'lazy') {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: removing loading="lazy"`);
      img.setAttribute('loading', 'eager');
    }

    img.classList.remove('lazy', 'lazyload', 'lazyloading', 'lozad');
  });

  const bgElements = document.querySelectorAll('[data-bg], [data-background]');
  console.log('[LazyLoad Blocker] Processing', bgElements.length, 'background elements');

  bgElements.forEach((el, index) => {
    const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
    if (bgUrl) {
      // 检查是否已经设置了背景图片
      const currentBg = el.style.backgroundImage;
      if (!currentBg || currentBg === 'none') {
        console.log(`[LazyLoad Blocker] Background ${index + 1}: setting to "${bgUrl}"`);
        el.style.backgroundImage = `url("${bgUrl}")`;
        el.classList.add('loaded');
      } else {
        console.log(`[LazyLoad Blocker] Background ${index + 1}: already set to "${currentBg}"`);
      }
    }
  });
}

function initCSSInjector() {
  console.log('[LazyLoad Blocker] Initializing CSS injector...');

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
            console.log('[LazyLoad Blocker] Attribute mutation detected:', mutation.attributeName, bgUrl);
            target.style.backgroundImage = `url("${bgUrl}")`;
            target.classList.add('loaded');
          }
        }
      }
    });

    if (shouldProcess) {
      console.log('[LazyLoad Blocker] DOM mutation detected, processing new images');
      forceLoadImages();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-bg', 'data-background']
  });

  console.log('[LazyLoad Blocker] CSS injector initialized');
}

// ============================================
// JS 拦截模块 (来自 jsInterceptor.js)
// ============================================
function interceptIntersectionObserver() {
  const OriginalObserver = window.IntersectionObserver;

  window.IntersectionObserver = function(callback, options) {
    const observer = new OriginalObserver(callback, options);

    const originalObserve = observer.observe.bind(observer);
    observer.observe = function(target) {
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

  window.IntersectionObserver.prototype = OriginalObserver.prototype;
  Object.setPrototypeOf(window.IntersectionObserver, OriginalObserver);
  console.log('[LazyLoad Blocker] IntersectionObserver intercepted');
}

function interceptImageLoading() {
  console.log('[LazyLoad Blocker] Setting up loading property interceptor');

  const descriptor = Object.getOwnPropertyDescriptor(
    HTMLImageElement.prototype,
    'loading'
  );

  console.log('[LazyLoad Blocker] Original loading descriptor:', descriptor);

  if (descriptor && descriptor.set) {
    Object.defineProperty(HTMLImageElement.prototype, 'loading', {
      get() {
        return 'eager';
      },
      set(value) {
        console.log('[LazyLoad Blocker] loading setter called with:', value);
        if (value === 'lazy') {
          console.log('[LazyLoad Blocker] Blocked lazy loading attempt');
          return;
        }
        descriptor.set.call(this, value);
      },
      enumerable: true,
      configurable: true
    });
    console.log('[LazyLoad Blocker] loading property intercepted');
  } else {
    console.log('[LazyLoad Blocker] loading descriptor not found or no setter');
  }

  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  console.log('[LazyLoad Blocker] Found', lazyImages.length, 'images with loading="lazy"');

  lazyImages.forEach((img, index) => {
    console.log(`[LazyLoad Blocker] Processing image ${index + 1}:`, img.src);
    img.setAttribute('loading', 'eager');
    if (img.dataset && img.dataset.src) {
      console.log(`[LazyLoad Blocker] Image ${index + 1} has data-src:`, img.dataset.src);
      img.src = img.dataset.src;
    }
  });
}

function hijackLazyLoadLibraries() {
  console.log('[LazyLoad Blocker] Setting up library interceptors');

  const checkAndHijack = () => {
    console.log('[LazyLoad Blocker] Checking for lazy load libraries...');

    if (window.lazySizes) {
      console.log('[LazyLoad Blocker] Found lazysizes library');
      const originalInit = window.lazySizes.init;
      window.lazySizes.init = function() {
        console.log('[LazyLoad Blocker] Hijacking lazysizes.init');
        document.querySelectorAll('img[data-src], img.lazyload').forEach(img => {
          if (img.dataset.src) img.src = img.dataset.src;
          img.classList.add('lazyloaded');
          img.classList.remove('lazyload', 'lazyloading');
        });
        return originalInit.apply(this, arguments);
      };
    }

    if (window.lozad) {
      console.log('[LazyLoad Blocker] Found lozad.js library');
      const originalLozad = window.lozad;
      window.lozad = function(selector, options) {
        console.log('[LazyLoad Blocker] Hijacking lozad()');
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
      console.log('[LazyLoad Blocker] Found vanilla-lazyload library');
      const OriginalLazyLoad = window.LazyLoad;
      window.LazyLoad = function(options) {
        console.log('[LazyLoad Blocker] Hijacking LazyLoad constructor');
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

function initJSInterceptor() {
  console.log('[LazyLoad Blocker] Initializing JS interceptor...');
  interceptIntersectionObserver();
  interceptImageLoading();
  hijackLazyLoadLibraries();
  console.log('[LazyLoad Blocker] JS interceptor initialized');
}

// ============================================
// 自动滚动模块 (来自 autoScroller.js)
// ============================================
let isScrolling = false;

function smoothScrollTo(targetY, duration) {
  return new Promise((resolve) => {
    const startY = window.scrollY;
    const diff = targetY - startY;
    const startTime = performance.now();

    function step(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
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
    await smoothScrollTo(pageHeight - window.innerHeight, mergedConfig.scrollSpeed);
    await new Promise(resolve => setTimeout(resolve, mergedConfig.stayDuration));

    if (mergedConfig.returnToTop) {
      await smoothScrollTo(0, mergedConfig.scrollSpeed);
    } else {
      await smoothScrollTo(originalScrollY, mergedConfig.scrollSpeed);
    }

    console.log('[Lazy Load Blocker] Auto scroll completed');

    if (mergedConfig.showNotification) {
      showNotification('图片加载完成');
    }
  } catch (error) {
    console.error('[Lazy Load Blocker] Auto scroll error:', error);
  } finally {
    isScrolling = false;
  }
}

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
// 主逻辑 (来自 index.js)
// ============================================
console.log('[Image Lazy Load Blocker] Content script loaded at document_start');

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
  console.log('[Image Lazy Load Blocker] Checking strategy for:', url);

  const response = await sendMessage(MESSAGE_TYPES.GET_SITE_CONFIG, { url });
  console.log('[Image Lazy Load Blocker] Site config response:', response);

  if (response?.success && response.data) {
    return response.data.strategy;
  }

  console.log('[Image Lazy Load Blocker] No site config, checking global config...');
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  console.log('[Image Lazy Load Blocker] Global config response:', globalResponse);

  if (globalResponse?.success && globalResponse.data) {
    return globalResponse.data.defaultStrategy || DEFAULT_STRATEGY;
  }

  return DEFAULT_STRATEGY;
}

async function init() {
  console.log('[Image Lazy Load Blocker] Starting initialization...');
  console.log('[Image Lazy Load Blocker] Document readyState:', document.readyState);

  const strategy = await getCurrentSiteStrategy();
  console.log('[Image Lazy Load Blocker] Final strategy:', strategy);

  switch (strategy) {
    case STRATEGIES.TECH_BLOCK:
      console.log('[Image Lazy Load Blocker] Applying TECH_BLOCK strategy');
      initCSSInjector();
      initJSInterceptor();
      break;

    case STRATEGIES.SCROLL_FALLBACK:
      console.log('[Image Lazy Load Blocker] Applying SCROLL_FALLBACK strategy');
      const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
      const scrollConfig = globalResponse?.data?.scrollConfig;
      initAutoScroller(scrollConfig);
      break;

    case STRATEGIES.DISABLED:
    default:
      console.log('[Image Lazy Load Blocker] Disabled for this site');
      break;
  }

  console.log('[Image Lazy Load Blocker] Initialization complete');
}

console.log('[Image Lazy Load Blocker] Scheduling initialization...');

if (document.readyState === 'loading') {
  init();
} else {
  init();
}
