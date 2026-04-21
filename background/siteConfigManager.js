// background/siteConfigManager.js

import { STORAGE_KEYS, DEFAULT_STRATEGY } from '../shared/constants.js';

/**
 * 获取网站的根域名（用于配置匹配）
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

/**
 * 获取所有网站配置
 * @returns {Promise<Object>}
 */
async function getAllSiteConfigs() {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const result = await storage.get(STORAGE_KEYS.SITE_CONFIGS);
  return result[STORAGE_KEYS.SITE_CONFIGS] || {};
}

/**
 * 获取特定网站的配置
 * @param {string} url
 * @returns {Promise<{strategy: string, addedAt: number}|null>}
 */
async function getSiteConfig(url) {
  const domain = extractDomain(url);
  if (!domain) return null;

  const configs = await getAllSiteConfigs();
  return configs[domain] || null;
}

/**
 * 设置网站配置
 * @param {string} domain
 * @param {string} strategy
 */
async function setSiteConfig(domain, strategy) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const configs = await getAllSiteConfigs();
  configs[domain] = {
    strategy,
    addedAt: Date.now()
  };

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 删除网站配置
 * @param {string} domain
 */
async function removeSiteConfig(domain) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const configs = await getAllSiteConfigs();
  delete configs[domain];

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 获取全局配置
 * @returns {Promise<Object>}
 */
async function getGlobalConfig() {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const result = await storage.get(STORAGE_KEYS.GLOBAL_CONFIG);
  return result[STORAGE_KEYS.GLOBAL_CONFIG] || { defaultStrategy: DEFAULT_STRATEGY };
}

/**
 * 设置全局配置
 * @param {Object} config
 */
async function setGlobalConfig(config) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  await storage.set({ [STORAGE_KEYS.GLOBAL_CONFIG]: config });
}

export {
  extractDomain,
  getAllSiteConfigs,
  getSiteConfig,
  setSiteConfig,
  removeSiteConfig,
  getGlobalConfig,
  setGlobalConfig
};
