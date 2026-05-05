// background/siteConfigManager.js

import { STORAGE_KEYS, DEFAULT_STRATEGY, DEFAULT_LAZY_ATTRIBUTES, DEFAULT_PLACEHOLDER_PATTERNS } from '../shared/constants.js';

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
 * @param {boolean} scrollFallback
 */
async function setSiteConfig(domain, strategy, scrollFallback = false) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const configs = await getAllSiteConfigs();
  configs[domain] = {
    strategy,
    scrollFallback,
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

/**
 * 获取自定义属性配置
 * @returns {Promise<{lazyAttributes: string[], placeholderPatterns: string[]}>}
 */
async function getCustomAttributes() {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const result = await storage.get(STORAGE_KEYS.CUSTOM_ATTRIBUTES);
  const stored = result[STORAGE_KEYS.CUSTOM_ATTRIBUTES];

  return {
    lazyAttributes: stored?.lazyAttributes || DEFAULT_LAZY_ATTRIBUTES,
    placeholderPatterns: stored?.placeholderPatterns || DEFAULT_PLACEHOLDER_PATTERNS
  };
}

/**
 * 设置自定义属性配置
 * @param {string[]} lazyAttributes
 * @param {string[]} placeholderPatterns
 */
async function setCustomAttributes(lazyAttributes, placeholderPatterns) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  await storage.set({
    [STORAGE_KEYS.CUSTOM_ATTRIBUTES]: {
      lazyAttributes,
      placeholderPatterns
    }
  });
}

/**
 * 重置自定义属性配置为默认值
 */
async function resetCustomAttributes() {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  await storage.set({
    [STORAGE_KEYS.CUSTOM_ATTRIBUTES]: {
      lazyAttributes: DEFAULT_LAZY_ATTRIBUTES,
      placeholderPatterns: DEFAULT_PLACEHOLDER_PATTERNS
    }
  });

  return {
    lazyAttributes: DEFAULT_LAZY_ATTRIBUTES,
    placeholderPatterns: DEFAULT_PLACEHOLDER_PATTERNS
  };
}

export {
  extractDomain,
  getAllSiteConfigs,
  getSiteConfig,
  setSiteConfig,
  removeSiteConfig,
  getGlobalConfig,
  setGlobalConfig,
  getCustomAttributes,
  setCustomAttributes,
  resetCustomAttributes
};
