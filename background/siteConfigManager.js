// background/siteConfigManager.js

import { STORAGE_KEYS, DEFAULT_STRATEGY, DEFAULT_LAZY_ATTRIBUTES, DEFAULT_PLACEHOLDER_PATTERNS } from '../shared/constants.js';
import { domainFromUrl, findSiteConfig, normalizeHostname, migrateSiteConfigs } from '../shared/domain.js';

/**
 * 获取网站的规范化根域名（用于配置匹配）。
 * 唯一的规范化实现见 shared/domain.js —— 不要在别处再写一遍。
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  return domainFromUrl(url);
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
  // findSiteConfig 同时接受遗留的 www. 键，迁移跑完前后行为一致
  return findSiteConfig(configs, domain);
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

  // 入口就规范化，保证 www.example.com 与 example.com 永远只对应一个键
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
 * 删除网站配置
 * @param {string} domain
 */
async function removeSiteConfig(domain) {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const key = normalizeHostname(domain) || domain;

  const configs = await getAllSiteConfigs();
  delete configs[key];
  // 迁移尚未跑完时，也清掉遗留的 www. 键，避免删除后"复活"
  delete configs['www.' + key];

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 一次性迁移：规范化所有已存站点键，合并 www./非 www. 重复项。
 * 幂等，可在每次后台启动时安全调用。
 * @returns {Promise<boolean>} 是否发生了写入
 */
async function migrateStoredSiteConfigs() {
  const storage = typeof browser !== 'undefined'
    ? browser.storage.local
    : chrome.storage.local;

  const configs = await getAllSiteConfigs();
  const { configs: migrated, changed } = migrateSiteConfigs(configs);
  if (!changed) return false;

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: migrated });
  console.log('[SiteConfig] 已迁移域名规范化键:', Object.keys(configs).length, '→', Object.keys(migrated).length);
  return true;
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
  normalizeHostname,
  migrateStoredSiteConfigs,
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
