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
