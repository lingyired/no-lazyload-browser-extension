// background/badge.js
// 图标 badge 与标签页监听。Chrome/Firefox 与 Safari 共用同一份实现。

import { getSiteConfig } from './siteConfigManager.js';

const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const tabs = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const action = typeof browser !== 'undefined' ? (browser.browserAction || browser.action) : chrome.action;
const windowsAPI = typeof browser !== 'undefined' ? browser.windows : chrome.windows;

/**
 * 更新扩展图标 badge
 * @param {string|number} tabId
 * @param {string} url
 */
async function updateBadge(tabId, url) {
  try {
    const config = await getSiteConfig(url);

    if (!config) {
      action.setBadgeText({ text: '', tabId });
      return;
    }

    if (config.scrollFallback) {
      // 兼容模式 - 显示 ↓
      action.setBadgeText({ text: '↓', tabId });
    } else {
      // 标准模式 - 显示 ✓
      action.setBadgeText({ text: '✓', tabId });
    }
    action.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
  } catch (error) {
    console.error('[Background] Error updating badge:', error);
  }
}

/** 更新当前活动标签页的 badge */
async function updateActiveTabBadge() {
  try {
    const [activeTab] = await tabs.query({ active: true, currentWindow: true });
    if (activeTab && activeTab.id && activeTab.url) {
      await updateBadge(activeTab.id, activeTab.url);
    }
  } catch (error) {
    console.error('[Background] Error updating active tab badge:', error);
  }
}

/** 设置标签页监听 */
function setupTabListeners() {
  tabs.onActivated.addListener(async (activeInfo) => {
    try {
      const tab = await tabs.get(activeInfo.tabId);
      if (tab && tab.url) await updateBadge(activeInfo.tabId, tab.url);
    } catch (error) {
      console.error('[Background] Error on tab activated:', error);
    }
  });

  tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if (changeInfo.url && tab && tab.url) {
      await updateBadge(tabId, tab.url);
    }
    // 页面加载完成时更新 badge（处理刷新场景）
    if (changeInfo.status === 'complete' && tab && tab.url) {
      await updateBadge(tabId, tab.url);
    }
  });

  // 窗口焦点变化时更新 badge
  if (windowsAPI) {
    windowsAPI.onFocusChanged.addListener(async (windowId) => {
      if (windowId !== windowsAPI.WINDOW_ID_NONE) {
        await updateActiveTabBadge();
      }
    });
  }
}

export { updateBadge, updateActiveTabBadge, setupTabListeners };
