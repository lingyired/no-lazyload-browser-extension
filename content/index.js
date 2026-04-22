// content/index.js

import { STRATEGIES, DEFAULT_STRATEGY } from '../shared/constants.js';
import { initCSSInjector } from './cssInjector.js';
import { initJSInterceptor } from './jsInterceptor.js';
import { initAutoScroller } from './autoScroller.js';

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG'
};

// 立即执行同步初始化（在页面加载前拦截关键 API）
console.log('[Image Lazy Load Blocker] Content script loaded at document_start');

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
  const url = window.location.href;
  console.log('[Image Lazy Load Blocker] Checking strategy for:', url);

  const response = await sendMessage(MESSAGE_TYPES.GET_SITE_CONFIG, { url });
  console.log('[Image Lazy Load Blocker] Site config response:', response);

  if (response?.success && response.data) {
    return response.data.strategy;
  }

  // 未配置，使用全局默认
  console.log('[Image Lazy Load Blocker] No site config, checking global config...');
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  console.log('[Image Lazy Load Blocker] Global config response:', globalResponse);

  if (globalResponse?.success && globalResponse.data) {
    return globalResponse.data.defaultStrategy || DEFAULT_STRATEGY;
  }

  return DEFAULT_STRATEGY;
}

/**
 * 初始化内容脚本
 */
async function init() {
  console.log('[Image Lazy Load Blocker] Starting initialization...');
  console.log('[Image Lazy Load Blocker] Document readyState:', document.readyState);

  const strategy = await getCurrentSiteStrategy();
  console.log('[Image Lazy Load Blocker] Final strategy:', strategy);

  switch (strategy) {
    case STRATEGIES.TECH_BLOCK:
      console.log('[Image Lazy Load Blocker] Applying TECH_BLOCK strategy');
      // 技术拦截：CSS + JS
      initCSSInjector();
      initJSInterceptor();
      break;

    case STRATEGIES.SCROLL_FALLBACK:
      console.log('[Image Lazy Load Blocker] Applying SCROLL_FALLBACK strategy');
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

  console.log('[Image Lazy Load Blocker] Initialization complete');
}

// 立即初始化 - 在 document_start 时就开始
console.log('[Image Lazy Load Blocker] Scheduling initialization...');

// 在 DOM 构建开始时立即执行
if (document.readyState === 'loading') {
  // document_start 阶段 - 立即开始异步初始化
  init();
} else {
  // 已经在 DOMContentLoaded 之后
  init();
}
