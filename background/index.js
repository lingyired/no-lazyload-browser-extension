// background/index.js

import { setupMessageHandler } from './messageHandler.js';
import { getSiteConfig } from './siteConfigManager.js';

// 获取浏览器 API
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const tabs = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const action = typeof browser !== 'undefined' ? browser.browserAction || browser.action : chrome.action;

/**
 * 更新扩展图标 badge
 * @param {string} tabId - 标签页 ID
 * @param {string} url - 当前 URL
 */
async function updateBadge(tabId, url) {
  try {
    const config = await getSiteConfig(url);

    if (!config) {
      // 未启用，清除 badge
      action.setBadgeText({ text: '', tabId });
      return;
    }

    if (config.scrollFallback) {
      // 自动滚动模式 - 显示 ↓
      action.setBadgeText({ text: '↓', tabId });
      action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      // 技术拦截模式 - 显示 ✓
      action.setBadgeText({ text: '✓', tabId });
      action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    }
  } catch (error) {
    console.error('[Background] Error updating badge:', error);
  }
}

/**
 * 更新当前活动标签页的 badge
 */
async function updateActiveTabBadge() {
  try {
    const [activeTab] = await tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id && activeTab?.url) {
      await updateBadge(activeTab.id, activeTab.url);
    }
  } catch (error) {
    console.error('[Background] Error updating active tab badge:', error);
  }
}

/**
 * 设置标签页监听
 */
function setupTabListeners() {
  // 标签页切换时更新 badge
  tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await tabs.get(activeInfo.tabId);
      if (tab?.url) {
        await updateBadge(activeInfo.tabId, tab.url);
      }
    } catch (error) {
      console.error('[Background] Error on tab activated:', error);
    }
  });

  // 标签页 URL 更新时更新 badge
  tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.url) {
      await updateBadge(tabId, tab.url);
    }
    // 页面加载完成时更新 badge（处理刷新场景）
    if (changeInfo.status === 'complete' && tab.url) {
      await updateBadge(tabId, tab.url);
    }
  });

  // 窗口焦点变化时更新 badge
  if (chrome.windows) {
    chrome.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId !== chrome.windows.WINDOW_ID_NONE) {
        await updateActiveTabBadge();
      }
    });
  }
}

// 初始化
setupMessageHandler();
setupTabListeners();

console.log('[Image Lazy Load Blocker] Background service worker started');
