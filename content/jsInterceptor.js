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
  console.log('[LazyLoad Blocker] IntersectionObserver intercepted');
}

/**
 * 拦截 HTMLImageElement.loading 属性
 */
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
        // 忽略设置为 'lazy' 的尝试
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

  // 立即处理已有的 loading="lazy" 图片
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  console.log('[LazyLoad Blocker] Found', lazyImages.length, 'images with loading="lazy"');

  lazyImages.forEach((img, index) => {
    console.log(`[LazyLoad Blocker] Processing image ${index + 1}:`, img.src);
    img.setAttribute('loading', 'eager');
    // 尝试强制加载
    if (img.dataset && img.dataset.src) {
      console.log(`[LazyLoad Blocker] Image ${index + 1} has data-src:`, img.dataset.src);
      img.src = img.dataset.src;
    }
  });
}

/**
 * 劫持常见的懒加载库
 */
function hijackLazyLoadLibraries() {
  console.log('[LazyLoad Blocker] Setting up library interceptors');

  // 等待库加载后劫持
  const checkAndHijack = () => {
    console.log('[LazyLoad Blocker] Checking for lazy load libraries...');

    // lazysizes
    if (window.lazySizes) {
      console.log('[LazyLoad Blocker] Found lazysizes library');
      const originalInit = window.lazySizes.init;
      window.lazySizes.init = function() {
        console.log('[LazyLoad Blocker] Hijacking lazysizes.init');
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
      console.log('[LazyLoad Blocker] Found lozad.js library');
      const originalLozad = window.lozad;
      window.lozad = function(selector, options) {
        console.log('[LazyLoad Blocker] Hijacking lozad()');
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
      console.log('[LazyLoad Blocker] Found vanilla-lazyload library');
      const OriginalLazyLoad = window.LazyLoad;
      window.LazyLoad = function(options) {
        console.log('[LazyLoad Blocker] Hijacking LazyLoad constructor');
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
  setTimeout(checkAndHijack, 3000);
}

/**
 * 初始化 JS 拦截模块
 */
function initJSInterceptor() {
  console.log('[LazyLoad Blocker] Initializing JS interceptor...');
  interceptIntersectionObserver();
  interceptImageLoading();
  hijackLazyLoadLibraries();
  console.log('[LazyLoad Blocker] JS interceptor initialized');
}

export { initJSInterceptor };
