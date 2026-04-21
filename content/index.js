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
