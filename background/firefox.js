// background/firefox.js
// Firefox MV2 入口（源码，ES module）。
//
// ⚠️ 本文件不会被直接加载：build.js 会用 scripts/bundle-classic.js 把它和它的
// 依赖打包成 dist/<browser>/background-firefox.js（MV2 经典脚本）。

import { STRATEGIES, STORAGE_KEYS, MESSAGE_TYPES } from '../shared/constants.js';
import { domainFromUrl, findSiteConfig, normalizeHostname, migrateSiteConfigs } from '../shared/domain.js';

// 常量定义
// 获取运行时 API
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const storage = typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
const tabs = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const browserAction = typeof browser !== 'undefined' ? (browser.browserAction || browser.action) : chrome.browserAction;

/**
 * 获取网站的规范化根域名（唯一实现见 shared/domain.js）
 */
function extractDomain(url) {
  return domainFromUrl(url);
}
/**
 * 获取所有网站配置
 */
async function getAllSiteConfigs() {
  const result = await storage.get(STORAGE_KEYS.SITE_CONFIGS);
  return result[STORAGE_KEYS.SITE_CONFIGS] || {};
}

/**
 * 获取特定网站的配置
 */
async function getSiteConfig(url) {
  const domain = extractDomain(url);
  if (!domain) return null;
  const configs = await getAllSiteConfigs();
  // 迁移完成前也接受遗留的 www. 键
  return findSiteConfig(configs, domain);
}

/**
 * 设置网站配置
 */
async function setSiteConfig(domain, strategy, scrollFallback = false) {
  const key = normalizeHostname(domain) || domain;
  const configs = await getAllSiteConfigs();
  configs[key] = {
    strategy,
    scrollFallback,
    addedAt: Date.now()
  };
  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 一次性规范化历史站点键（幂等）。
 * 规则与 Chrome/Safari 完全一致 —— 都来自 shared/domain.js。
 */
async function migrateStoredSiteConfigs() {
  const configs = await getAllSiteConfigs();
  const { configs: migrated, changed } = migrateSiteConfigs(configs);
  if (changed) await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: migrated });
  return changed;
}
/**
 * 获取全局配置
 */
async function getGlobalConfig() {
  const result = await storage.get(STORAGE_KEYS.GLOBAL_CONFIG);
  return result[STORAGE_KEYS.GLOBAL_CONFIG] || { defaultStrategy: STRATEGIES.DISABLED };
}

/**
 * 设置全局配置
 */
async function setGlobalConfig(config) {
  await storage.set({ [STORAGE_KEYS.GLOBAL_CONFIG]: config });
}

/**
 * 处理消息
 */
function setupMessageHandler() {
  runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        switch (request.type) {
          case MESSAGE_TYPES.GET_SITE_CONFIG:
            const config = await getSiteConfig(request.url);
            sendResponse({ success: true, data: config });
            break;

          case MESSAGE_TYPES.SET_SITE_CONFIG:
            await setSiteConfig(request.domain, request.strategy, request.scrollFallback);
            sendResponse({ success: true });
            break;

          case MESSAGE_TYPES.REMOVE_SITE_CONFIG:
            await removeSiteConfig(request.domain);
            sendResponse({ success: true });
            break;

          case MESSAGE_TYPES.GET_ALL_CONFIGS:
            const configs = await getAllSiteConfigs();
            sendResponse({ success: true, data: configs });
            break;

          case MESSAGE_TYPES.GET_GLOBAL_CONFIG:
            const globalConfig = await getGlobalConfig();
            sendResponse({ success: true, data: globalConfig });
            break;

          case MESSAGE_TYPES.SET_GLOBAL_CONFIG:
            await setGlobalConfig(request.config);
            sendResponse({ success: true });
            break;

          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true;
  });
}

// 初始化
setupMessageHandler();
console.log('[Image Lazy Load Blocker] Background script started (Firefox MV2)');

// 一次性规范化历史站点键（幂等）
migrateStoredSiteConfigs().catch(e => console.warn('[Firefox BG] 站点键迁移失败', e));

/**
 * 更新扩展图标 badge
 * @param {number} tabId - 标签页 ID
 * @param {string} url - 当前 URL
 */
async function updateBadge(tabId, url) {
  try {
    const config = await getSiteConfig(url);

    if (!config) {
      // 未启用，清除 badge
      browserAction.setBadgeText({ text: '', tabId });
      return;
    }

    if (config.scrollFallback) {
      // 自动滚动模式 - 显示 ↓
      browserAction.setBadgeText({ text: '↓', tabId });
      browserAction.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
    } else {
      // 技术拦截模式 - 显示 ✓
      browserAction.setBadgeText({ text: '✓', tabId });
      browserAction.setBadgeBackgroundColor({ color: '#4CAF50', tabId });
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
  if (browser.windows) {
    browser.windows.onFocusChanged.addListener(async (windowId) => {
      if (windowId !== browser.windows.WINDOW_ID_NONE) {
        await updateActiveTabBadge();
      }
    });
  }
}

// 设置标签页监听
setupTabListeners();
