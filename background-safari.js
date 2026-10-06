// background-safari.js - Safari MV3 兼容版本（无 ES 模块）
// 由 background/index.js + messageHandler.js + siteConfigManager.js + shared/constants.js 合并而成
// Safari 15.4+ 支持 MV3 service worker，但 "type": "module" 在 16.4 前不稳定，故使用经典脚本

// ============================================
// 常量定义 (来自 shared/constants.js)
// ============================================
const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

const DEFAULT_STRATEGY = STRATEGIES.DISABLED;

const STORAGE_KEYS = {
  SITE_CONFIGS: 'siteConfigs',
  GLOBAL_CONFIG: 'globalConfig',
  CUSTOM_ATTRIBUTES: 'customAttributes',
  PENDING_ENTITLEMENT_ACTION: 'pendingEntitlementAction',
  ENTITLEMENT_NOTICE: 'entitlementNotice',
};

// 默认的懒加载属性列表（用户可在设置中修改）
const DEFAULT_LAZY_ATTRIBUTES = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-srcset',
  'data-lazy-srcset',
  'data-custom-src',
  'data-lazy',
  'data-defer-src',
  'data-async',
  'data-img-url',
  'data-url',
  'data-image',
  'data-image-src',
  'data-href'
];

// 默认的占位符检测关键词（用户可在设置中修改）
const DEFAULT_PLACEHOLDER_PATTERNS = [
  'thumb',
  'placeholder',
  'loading',
  'spinner',
  'blank',
  'empty',
  'lazy',
  'preview',
  'temp',
  'default'
];

const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG',
  GET_CUSTOM_ATTRIBUTES: 'GET_CUSTOM_ATTRIBUTES',
  SET_CUSTOM_ATTRIBUTES: 'SET_CUSTOM_ATTRIBUTES',
  RESET_CUSTOM_ATTRIBUTES: 'RESET_CUSTOM_ATTRIBUTES',
  // Entitlement / Purchase
  //   GET_ENTITLEMENTS     —— 读本地快照，立即返回（不碰原生，保证 UI 秒开）
  //   REFRESH_ENTITLEMENTS —— 走 sendNativeMessage 拉 App Group 最新值（慢，异步）
  GET_ENTITLEMENTS: 'getEntitlements',
  REFRESH_ENTITLEMENTS: 'refreshEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
  OPEN_HOST_APP: 'openHostApp',
  ACK_ENTITLEMENT_NOTICE: 'ackEntitlementNotice'
};

// ===== 待办动作（内联自 background/pendingAction.js + shared/constants.js）=====
// 免费额度撞上限时把"用户想启用的网站"持久化，购买结束后由后台补做。
const PENDING_ACTION_TTL_MS = 24 * 60 * 60 * 1000;

function buildPendingAction(input, now = Date.now()) {
  const domain = normalizeHostname(input && input.domain);
  if (!domain) return null;

  return {
    version: 1,
    action: 'addSite',
    domain,
    strategy: (input && input.strategy) || STRATEGIES.TECH_BLOCK,
    scrollFallback: input && input.scrollFallback === true,
    createdAt: now,
  };
}

function validatePendingAction(raw, now = Date.now()) {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.version !== 1 || raw.action !== 'addSite') return null;

  const domain = normalizeHostname(raw.domain);
  if (!domain) return null;

  const createdAt = Number(raw.createdAt) || 0;
  if (!createdAt || now - createdAt > PENDING_ACTION_TTL_MS) return null;

  return {
    version: 1,
    action: 'addSite',
    domain,
    strategy: raw.strategy || STRATEGIES.TECH_BLOCK,
    scrollFallback: raw.scrollFallback === true,
    createdAt,
  };
}

async function savePendingAction(action) {
  if (!action) return false;
  await storage.set({ [STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION]: action });
  return true;
}

async function loadPendingAction(now = Date.now()) {
  const result = await storage.get(STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION);
  const raw = result ? result[STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION] : null;
  if (!raw) return null;

  const action = validatePendingAction(raw, now);
  if (!action) {
    await clearPendingAction();
    return null;
  }
  return action;
}

async function clearPendingAction() {
  await storage.remove(STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION);
}

async function setEntitlementNotice(notice) {
  await storage.set({ [STORAGE_KEYS.ENTITLEMENT_NOTICE]: notice });
}

async function getEntitlementNotice() {
  const result = await storage.get(STORAGE_KEYS.ENTITLEMENT_NOTICE);
  return (result && result[STORAGE_KEYS.ENTITLEMENT_NOTICE]) || null;
}

async function clearEntitlementNotice() {
  await storage.remove(STORAGE_KEYS.ENTITLEMENT_NOTICE);
}

// ===== Entitlement System 常量（内联自 shared/constants.js + shared/entitlements.js）=====
// Safari 的 background 是单文件经典脚本，无法 import ES module，故内联
const APP_LIMITS = {
  FREE_SITE_LIMIT: 3,
};

const ENTITLEMENTS = {
  UNLIMITED_SITES: 'unlimitedSites',
  CLOUD_SYNC: 'cloudSync',
  IMPORT_EXPORT: 'importExport',
  ADVANCED_RULES: 'advancedRules',
  SMART_NETWORK_POLICY: 'smartNetworkPolicy',
  AI_RULES: 'aiRules',
};

// ===== License / Plan state（内联自 shared/constants.js）=====
// Chrome/Firefox 是"免费且不限额"的平台，不是 Pro。UI 必须靠 licenseMode 区分。
const LICENSE_MODES = {
  UNRESTRICTED: 'unrestricted',
  FREE: 'free',
  PRO: 'pro',
};

function getLicenseMode(snapshot) {
  if (!snapshot || !snapshot.isLimitEnforced) return LICENSE_MODES.UNRESTRICTED;
  const entitlements = Array.isArray(snapshot.entitlements) ? snapshot.entitlements : [];
  return entitlements.includes(ENTITLEMENTS.UNLIMITED_SITES)
    ? LICENSE_MODES.PRO
    : LICENSE_MODES.FREE;
}

/**
 * 给 Promise 加超时，避免 sendNativeMessage 无响应时永久挂起。
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timeout')), ms)),
  ]);
}

/** 原生调用超时上限。Safari 冷启动 handler 进程大约需要 0.5–1s，给足余量。 */
const NATIVE_TIMEOUT_MS = 5000;

/** 权限快照在 storage.local 中的缓存键 */
const ENTITLEMENT_CACHE_KEY = 'entitlementCache';

// ============================================
// JSEntitlementManager（内联自 shared/entitlements.js）
//
// 设计要点 —— cache-first：
//   权限的唯一真实来源是 Swift 侧 EntitlementStore（App Group），
//   但读它必须走 sendNativeMessage，冷启动会明显拖慢 UI。
//   所以这里维护一份 storage.local 快照：
//     · GET_ENTITLEMENTS     读快照 —— 毫秒级返回，UI 立刻渲染
//     · REFRESH_ENTITLEMENTS 走原生 —— 慢，但不阻塞首次渲染
//
//   业务层永远只调用 has(...)，不要判断 isPro。
// ============================================
class JSEntitlementManager {
  constructor(options = {}) {
    this.entitlements = new Set();
    this.enforceLimit = options.enforceLimit ?? false;
    this.nativeBundleId = options.nativeBundleId ?? null;
    /**
     * 原生权限存储（App Group）是否可用。
     * null = 尚未查询过；false = 明确不可用（UI 必须显式提示，不能拿它当免费版）。
     */
    this.storageAvailable = null;
    this._cacheLoaded = false;
  }

  /** 读取上次的权限快照（首次会落一次磁盘）。 */
  async loadCache() {
    if (this._cacheLoaded) return this.entitlements;
    try {
      const result = await storage.get(ENTITLEMENT_CACHE_KEY);
      const cached = result && result[ENTITLEMENT_CACHE_KEY];
      if (cached && Array.isArray(cached.entitlements)) {
        this.entitlements = new Set(cached.entitlements);
      }
    } catch (e) {
      console.warn('[Entitlement] loadCache failed', e);
    }
    this._cacheLoaded = true;
    return this.entitlements;
  }

  async saveCache() {
    try {
      await storage.set({
        [ENTITLEMENT_CACHE_KEY]: {
          entitlements: Array.from(this.entitlements),
          updatedAt: Date.now(),
        },
      });
    } catch (e) {
      console.warn('[Entitlement] saveCache failed', e);
    }
  }

  /**
   * 走原生 App Group 拉取最新权限。
   * 永不抛出：失败时保留现有快照并返回 false。
   * @returns {Promise<boolean>} 是否成功从原生取到值
   */
  async refresh() {
    if (!this.nativeBundleId) return false; // Chrome/Firefox: 无原生桥接
    try {
      const resp = await withTimeout(
        browser.runtime.sendNativeMessage(this.nativeBundleId, { action: 'getEntitlements' }),
        NATIVE_TIMEOUT_MS,
        'getEntitlements'
      );
      if (resp && typeof resp.storageAvailable === 'boolean') {
        this.storageAvailable = resp.storageAvailable;
        if (!resp.storageAvailable) {
          console.error('[Entitlement] 原生权限存储不可用（App Group 配置问题）');
        }
      }
      if (resp && Array.isArray(resp.entitlements)) {
        this.entitlements = new Set(resp.entitlements);
        this._cacheLoaded = true;
        await this.saveCache();
        console.log('[Entitlement] refresh ok ->', resp.entitlements);
        return true;
      }
      console.warn('[Entitlement] refresh 响应异常:', JSON.stringify(resp));
      return false;
    } catch (e) {
      console.warn('[Entitlement] refresh failed:', (e && e.message) || e);
      return false;
    }
  }

  /** 当前权限快照（给 UI 用的纯数据） */
  snapshot() {
    return {
      entitlements: Array.from(this.entitlements),
      isLimitEnforced: this.enforceLimit,
      freeSiteLimit: APP_LIMITS.FREE_SITE_LIMIT,
      licenseMode: this.licenseMode(),
      // false 表示原生 App Group 不可用：权限状态不可信，
      // UI 必须明确提示，而不是当成"用户没买过"。
      storageAvailable: this.storageAvailable,
    };
  }

  has(entitlement) {
    if (!this.enforceLimit) return true;
    return this.entitlements.has(entitlement);
  }

  isLimitEnforced() {
    return this.enforceLimit;
  }

  /**
   * UI 用的授权模式：unrestricted（Chrome/Firefox）/ free（Safari 免费）/ pro。
   * 不要用 has(UNLIMITED_SITES) 反推套餐名 —— 那会把 Chrome 也显示成 Pro。
   */
  licenseMode() {
    return getLicenseMode({
      isLimitEnforced: this.enforceLimit,
      entitlements: Array.from(this.entitlements),
    });
  }

  canAddSite(currentCount) {
    if (this.has(ENTITLEMENTS.UNLIMITED_SITES)) return true;
    return currentCount < APP_LIMITS.FREE_SITE_LIMIT;
  }

  /**
   * 唤起 Host App 完成 StoreKit 购买。
   *
   * 返回 true 只代表 App 被打开了，不代表购买完成 ——
   * 扩展进程无法弹出付款面板，购买结果要通过下一次 refresh() 才读得到。
   */
  async openHostApp() {
    if (!this.nativeBundleId) return false;
    try {
      const resp = await withTimeout(
        browser.runtime.sendNativeMessage(this.nativeBundleId, { action: 'openHostApp' }),
        NATIVE_TIMEOUT_MS,
        'openHostApp'
      );
      console.log('[Entitlement] openHostApp resp =', JSON.stringify(resp));
      return !!(resp && resp.success);
    } catch (e) {
      console.warn('[Entitlement] openHostApp failed:', (e && e.message) || e);
      return false;
    }
  }
}

// Safari 实例：执行限额，权限全部来自原生 App Group
const jsEntitlementManager = new JSEntitlementManager({
  enforceLimit: true,
  nativeBundleId: 'com.lingyi01.imagelazyloadblocker',
});

// ============================================
// 浏览器 API 统一封装
// Safari 同时支持 browser.* 和 chrome.*，这里沿用项目双命名空间约定
// ============================================
const runtime = typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
const storage = typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
const tabs = typeof browser !== 'undefined' ? browser.tabs : chrome.tabs;
const action = typeof browser !== 'undefined' ? (browser.browserAction || browser.action) : chrome.action;
const windowsAPI = typeof browser !== 'undefined' ? browser.windows : chrome.windows;



// ============================================
// 站点配置管理 (来自 siteConfigManager.js)
// ============================================
// ===== 域名规范化（内联自 shared/domain.js）=====
// ⚠️ 唯一实现是 shared/domain.js；这里是经典脚本的内联副本（Phase H 会由构建生成）。
// 规则：小写 → 去空白 → 去端口 → 去结尾根点 → 去一个 www. 前缀。
function normalizeHostname(hostname) {
  if (typeof hostname !== 'string') return '';

  let host = hostname.trim().toLowerCase();
  if (!host) return '';

  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end !== -1) host = host.slice(0, end + 1);
  } else {
    const colon = host.lastIndexOf(':');
    if (colon !== -1 && /^\d+$/.test(host.slice(colon + 1))) {
      host = host.slice(0, colon);
    }
  }

  while (host.endsWith('.')) host = host.slice(0, -1);
  if (!host) return '';

  return host.replace(/^www\./, '');
}

/**
 * 在站点配置表里查找域名（兼容尚未迁移的遗留 www. 键）
 */
function findSiteConfig(configs, host) {
  if (!configs) return null;
  const domain = normalizeHostname(host);
  if (!domain) return null;
  return configs[domain] || configs['www.' + domain] || null;
}

/**
 * 获取网站的规范化根域名（用于配置匹配）
 * @param {string} url
 * @returns {string}
 */
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') return '';
    return normalizeHostname(urlObj.hostname);
  } catch {
    return '';
  }
}

/**
 * 获取所有网站配置
 * @returns {Promise<Object>}
 */
async function getAllSiteConfigs() {
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
  return findSiteConfig(configs, domain);
}

/**
 * 设置网站配置
 * @param {string} domain
 * @param {string} strategy
 * @param {boolean} scrollFallback
 */
async function setSiteConfig(domain, strategy, scrollFallback = false, options = {}) {
  // 入口就规范化，保证 www.example.com 与 example.com 永远只对应一个键
  const key = normalizeHostname(domain) || domain;

  const configs = await getAllSiteConfigs();
  configs[key] = {
    strategy,
    scrollFallback,
    // 导入时保留原始 addedAt（列表排序需要）
    addedAt: Number.isFinite(options.addedAt) ? options.addedAt : Date.now()
  };

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 删除网站配置
 * @param {string} domain
 */
async function removeSiteConfig(domain) {
  const key = normalizeHostname(domain) || domain;

  const configs = await getAllSiteConfigs();
  delete configs[key];
  // 迁移尚未跑完时，也清掉遗留的 www. 键，避免删除后"复活"
  delete configs['www.' + key];

  await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: configs });
}

/**
 * 一次性迁移：规范化所有已存站点键，合并 www./非 www. 重复项。幂等。
 * @returns {Promise<boolean>} 是否发生了写入
 */
async function migrateStoredSiteConfigs() {
  const configs = await getAllSiteConfigs();
  const out = {};
  let changed = false;

  for (const [rawDomain, config] of Object.entries(configs)) {
    const domain = normalizeHostname(rawDomain);
    if (!domain) { changed = true; continue; }
    if (domain !== rawDomain) changed = true;

    if (out[domain]) {
      changed = true;
      // 保留较新的 strategy / scrollFallback
      const prev = out[domain];
      const newer = (config.addedAt || 0) >= (prev.addedAt || 0) ? config : prev;
      const older = newer === config ? prev : config;
      out[domain] = {
        strategy: newer.strategy || older.strategy,
        scrollFallback: newer.scrollFallback === true,
        addedAt: Math.min(config.addedAt || Infinity, prev.addedAt || Infinity) || newer.addedAt,
      };
    } else {
      out[domain] = config;
    }
  }

  if (changed) {
    await storage.set({ [STORAGE_KEYS.SITE_CONFIGS]: out });
    console.log('[SiteConfig] 已迁移域名规范化键:', Object.keys(configs).length, '→', Object.keys(out).length);
  }
  return changed;
}

/**
 * 获取全局配置
 * @returns {Promise<Object>}
 */
async function getGlobalConfig() {
  const result = await storage.get(STORAGE_KEYS.GLOBAL_CONFIG);
  return result[STORAGE_KEYS.GLOBAL_CONFIG] || { defaultStrategy: DEFAULT_STRATEGY };
}

/**
 * 设置全局配置
 * @param {Object} config
 */
async function setGlobalConfig(config) {
  await storage.set({ [STORAGE_KEYS.GLOBAL_CONFIG]: config });
}

/**
 * 获取自定义属性配置
 * @returns {Promise<{lazyAttributes: string[], placeholderPatterns: string[]}>}
 */
async function getCustomAttributes() {
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

/**
 * 权限到位后补做"购买前被限额拦住的那次添加"。
 * 幂等：待办一次性消费；执行完写一条 notice 供 UI 提示。
 * @returns {Promise<object|null>} 补做成功的待办
 */
async function completePendingEntitlementAction() {
  const pending = await loadPendingAction();
  if (!pending) return null;

  const configs = await getAllSiteConfigs();
  const count = Object.keys(configs).length;
  if (!jsEntitlementManager.canAddSite(count)) return null;

  if (!configs[pending.domain]) {
    await setSiteConfig(pending.domain, pending.strategy, pending.scrollFallback);
  }
  await clearPendingAction();

  const notice = {
    type: 'pendingSiteAdded',
    domain: pending.domain,
    at: Date.now(),
  };
  await setEntitlementNotice(notice);
  console.log('[BG] 已补做购买前的待办:', pending.domain);
  return notice;
}

// ============================================
// 消息处理 (来自 messageHandler.js)
// ============================================
/**
 * 处理来自 content script 或 settings 页面的消息
 */
function setupMessageHandler() {
  runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        // 注意：正常路径绝不 await 原生调用。权限判断一律用 storage.local 快照
        // （由后台启动预热 + popup 的 REFRESH_ENTITLEMENTS 保持新鲜），
        // 否则任何 native 卡顿都会拖垮包括 GET_ALL_CONFIGS 在内的全部消息。
        // 唯一例外：SET_SITE_CONFIG 判定"疑似超限"时会先走一次原生确认再拒绝，
        // 避免用户刚在 Host App 买完、快照还没刷新就被误判为限额。

        switch (request.type) {
          case MESSAGE_TYPES.GET_SITE_CONFIG:
            const config = await getSiteConfig(request.url);
            sendResponse({ success: true, data: config });
            break;

          case MESSAGE_TYPES.SET_SITE_CONFIG: {
            // 限额检查：仅对"新增"网站拦截，更新已有网站策略不受限
            const existingConfigs = await getAllSiteConfigs();
            const isNewAdd = !existingConfigs[request.domain];
            if (isNewAdd) {
              // 用本地快照判断（毫秒级）。只有新增网站才检查，更新已有策略不受限。
              await jsEntitlementManager.loadCache();
              const currentCount = Object.keys(existingConfigs).length;
              if (!jsEntitlementManager.canAddSite(currentCount)) {
                // 快照可能过期：用户刚在 Host App 里买完、还没触发过刷新。
                // 真正拒绝之前先走一次原生 App Group 确认。
                await jsEntitlementManager.refresh();
                if (!jsEntitlementManager.canAddSite(currentCount)) {
                  // 持久化用户意图：popup 会在 Host App 置前后被关掉，
                  // 购买完成后由 completePendingEntitlementAction() 补做。
                  // 批量导入被截断不算"想启用这一个网站"，不写待办。
                  if (request.source !== 'import') {
                    await savePendingAction(buildPendingAction({
                      domain: request.domain,
                      strategy: request.strategy,
                      scrollFallback: request.scrollFallback,
                    }));
                  }
                  sendResponse({ success: false, error: 'LIMIT_REACHED' });
                  break;
                }
              }
            }
            await setSiteConfig(request.domain, request.strategy, request.scrollFallback, {
              addedAt: request.addedAt,
            });
            sendResponse({ success: true });
            break;
          }

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

          case MESSAGE_TYPES.GET_CUSTOM_ATTRIBUTES:
            const customAttrs = await getCustomAttributes();
            sendResponse({ success: true, data: customAttrs });
            break;

          case MESSAGE_TYPES.SET_CUSTOM_ATTRIBUTES:
            await setCustomAttributes(request.lazyAttributes, request.placeholderPatterns);
            sendResponse({ success: true });
            break;

          case MESSAGE_TYPES.RESET_CUSTOM_ATTRIBUTES:
            const resetAttrs = await resetCustomAttributes();
            sendResponse({ success: true, data: resetAttrs });
            break;

          // ===== Entitlement / Purchase 处理 =====
          case MESSAGE_TYPES.GET_ENTITLEMENTS:
            // 快路径：只读本地快照，立即返回。UI 先用它渲染，绝不阻塞。
            await jsEntitlementManager.loadCache();
            sendResponse({
              success: true,
              ...jsEntitlementManager.snapshot(),
              source: 'cache',
              pendingAction: await loadPendingAction(),
              notice: await getEntitlementNotice(),
            });
            break;

          case MESSAGE_TYPES.REFRESH_ENTITLEMENTS: {
            // 慢路径：走原生 App Group 拉最新值（StoreKit 购买结果由此进入扩展）。
            const ok = await jsEntitlementManager.refresh();
            // 权限到位后补做购买前的待办（关掉 popup 也不会丢）
            await completePendingEntitlementAction();
            sendResponse({
              success: ok,
              ...jsEntitlementManager.snapshot(),
              source: 'native',
              pendingAction: await loadPendingAction(),
              notice: await getEntitlementNotice(),
            });
            break;
          }

          // UI 展示完一次性提示后确认清除
          case MESSAGE_TYPES.ACK_ENTITLEMENT_NOTICE:
            await clearEntitlementNotice();
            sendResponse({ success: true });
            break;

          // 购买与恢复都只做一件事：唤起 Host App。
          // StoreKit 的付款面板只能由 Host App 弹出，扩展侧拿不到同步结果。
          case MESSAGE_TYPES.REQUEST_PURCHASE:
          case MESSAGE_TYPES.RESTORE_PURCHASES:
          case MESSAGE_TYPES.OPEN_HOST_APP: {
            console.log('[BG] %s: opening Host App for StoreKit...', request.type);
            const opened = await jsEntitlementManager.openHostApp();
            sendResponse({ success: opened, openedHostApp: opened });
            break;
          }

          default:
            sendResponse({ success: false, error: 'Unknown message type' });
        }
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    })();

    return true; // 保持消息通道开放
  });
}

// ============================================
// Badge 与标签页监听 (来自 background/index.js)
// ============================================
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
  // 使用统一封装的 windowsAPI，避免直接引用 chrome.windows（Safari 也提供 chrome.windows）
  if (windowsAPI) {
    windowsAPI.onFocusChanged.addListener(async (windowId) => {
      if (windowId !== windowsAPI.WINDOW_ID_NONE) {
        await updateActiveTabBadge();
      }
    });
  }
}

// ============================================
// 初始化
// ============================================
setupMessageHandler();
setupTabListeners();

// 一次性把历史站点键规范化（www.example.com → example.com），幂等。
migrateStoredSiteConfigs().catch(e => console.warn('[BG] 站点键迁移失败', e));

jsEntitlementManager
  .loadCache()
  .then(() => jsEntitlementManager.refresh())
  .catch(e => console.warn('[BG] entitlement 预热失败', e));

// 后台预热权限（fire-and-forget，绝不阻塞 service worker 启动）：
// 先读本地快照供 UI 立即使用，再异步走原生拉一次最新值。
// 两者都自带超时，Swift 侧无响应也不会卡死。

console.log('[Image Lazy Load Blocker] Background service worker started (Safari MV3)');
