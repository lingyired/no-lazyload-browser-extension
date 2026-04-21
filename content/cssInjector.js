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
