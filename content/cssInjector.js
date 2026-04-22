// content/cssInjector.js

import { LAZY_LOAD_SELECTORS } from '../shared/constants.js';

/**
 * 注入内联样式覆盖懒加载
 */
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

    /* 处理 background-image 懒加载 */
    [data-bg], [data-background] {
      background-image: attr(data-bg) !important;
    }
  `;

  (document.head || document.documentElement).appendChild(style);
  console.log('[LazyLoad Blocker] CSS styles injected');
}

/**
 * 处理原生 loading="lazy" 属性
 */
function handleNativeLazyLoading() {
  console.log('[LazyLoad Blocker] Handling native lazy loading...');

  // 处理已有的 loading="lazy" 图片
  const processLazyImages = () => {
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    console.log('[LazyLoad Blocker] Found', lazyImages.length, 'native lazy images');

    lazyImages.forEach((img, index) => {
      console.log(`[LazyLoad Blocker] Processing native lazy image ${index + 1}:`, img.src || 'no src yet');
      img.setAttribute('loading', 'eager');
      img.loading = 'eager';
    });
  };

  // 立即处理
  if (document.readyState !== 'loading') {
    processLazyImages();
  }

  // DOMContentLoaded 时再次处理
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', processLazyImages);
  }

  // 延迟处理（确保捕获所有动态添加的图片）
  setTimeout(processLazyImages, 100);
  setTimeout(processLazyImages, 500);
  setTimeout(processLazyImages, 1000);
}

/**
 * 遍历并强制加载 CSS 中可能未覆盖的元素
 */
function forceLoadImages() {
  console.log('[LazyLoad Blocker] Force loading images...');

  // 处理所有带有 data-src 的图片
  const images = document.querySelectorAll('img');
  console.log('[LazyLoad Blocker] Processing', images.length, 'total images');

  images.forEach((img, index) => {
    // 将各种 data-* 属性复制到 src
    const srcAttr = img.getAttribute('data-src') ||
                   img.getAttribute('data-original') ||
                   img.getAttribute('data-lazy-src');

    if (srcAttr && !img.src) {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: setting src from data attribute`, srcAttr);
      img.src = srcAttr;
    }

    // 处理 srcset
    const srcsetAttr = img.getAttribute('data-srcset') ||
                      img.getAttribute('data-lazy-srcset');

    if (srcsetAttr && !img.srcset) {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: setting srcset`, srcsetAttr);
      img.srcset = srcsetAttr;
    }

    // 移除 loading="lazy" 属性
    if (img.getAttribute('loading') === 'lazy') {
      console.log(`[LazyLoad Blocker] Image ${index + 1}: removing loading="lazy"`);
      img.setAttribute('loading', 'eager');
    }

    // 移除懒加载相关类名
    img.classList.remove('lazy', 'lazyload', 'lazyloading', 'lozad');
  });

  // 处理背景图片懒加载
  const bgElements = document.querySelectorAll('[data-bg], [data-background]');
  console.log('[LazyLoad Blocker] Processing', bgElements.length, 'background elements');

  bgElements.forEach((el, index) => {
    const bgUrl = el.getAttribute('data-bg') || el.getAttribute('data-background');
    if (bgUrl) {
      console.log(`[LazyLoad Blocker] Background ${index + 1}:`, bgUrl);
      el.style.backgroundImage = `url(${bgUrl})`;
    }
  });
}

/**
 * 初始化 CSS 注入模块
 */
function initCSSInjector() {
  console.log('[LazyLoad Blocker] Initializing CSS injector...');

  injectInlineStyles();
  handleNativeLazyLoading();
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
      console.log('[LazyLoad Blocker] DOM mutation detected, processing new images');
      forceLoadImages();
    }
  });

  observer.observe(document.body || document.documentElement, {
    childList: true,
    subtree: true
  });

  console.log('[LazyLoad Blocker] CSS injector initialized');
}

export { initCSSInjector, forceLoadImages };
