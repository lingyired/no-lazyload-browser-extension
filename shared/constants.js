// shared/constants.js

export const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

export const DEFAULT_STRATEGY = STRATEGIES.DISABLED;

export const DEFAULT_SCROLL_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true,
  showNotification: true
};

export const STORAGE_KEYS = {
  SITE_CONFIGS: 'siteConfigs',
  GLOBAL_CONFIG: 'globalConfig',
  CUSTOM_ATTRIBUTES: 'customAttributes',
  // 免费额度撞上限时，把"用户想启用的网站"持久化下来，
  // 购买流程结束后由 background 补做 —— Safari 的 popup 在 Host App 置前后会被关掉。
  PENDING_ENTITLEMENT_ACTION: 'pendingEntitlementAction',
  // 待办被补做 / 购买完成后的提示，供 UI 一次性展示后清除。
  ENTITLEMENT_NOTICE: 'entitlementNotice',
};

/** 待办动作的过期时间：超过 24 小时视为用户已经放弃。 */
export const PENDING_ACTION_TTL_MS = 24 * 60 * 60 * 1000;

// 默认的懒加载属性列表（用户可在设置中修改）
export const DEFAULT_LAZY_ATTRIBUTES = [
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
export const DEFAULT_PLACEHOLDER_PATTERNS = [
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

// 默认的懒加载 CSS 选择器
export const LAZY_LOAD_SELECTORS = [
  'img[data-src]',
  'img[data-original]',
  'img[data-lazy-src]',
  'img[data-srcset]',
  'img[data-lazy-srcset]',
  'img[loading="lazy"]',
  '.lazy',
  '.lazyload',
  '.lazyloading',
  '.lozad',
  '[data-lazy]',
  '[data-lazy-src]'
];

// ===== Entitlement System =====
// 免费版网站数量上限（Pro 解锁后无限制）
export const APP_LIMITS = {
  FREE_SITE_LIMIT: 3,
};

// 权限项枚举（与 Swift Entitlement.swift 的 rawValue 一一对应）
// 业务层永远只判断 has(...)，不要判断 isPro
export const ENTITLEMENTS = {
  UNLIMITED_SITES: 'unlimitedSites',
  CLOUD_SYNC: 'cloudSync',
  IMPORT_EXPORT: 'importExport',
  ADVANCED_RULES: 'advancedRules',
  SMART_NETWORK_POLICY: 'smartNetworkPolicy',
  AI_RULES: 'aiRules',
};

// 权限/购买相关消息类型。
// GET_ENTITLEMENTS / OPEN_HOST_APP 的值与 Swift action 字符串大小写敏感一致。
// REQUEST_PURCHASE / RESTORE_PURCHASES 在 Safari 侧最终都会走 openHostApp
// （StoreKit 付款面板只能由 Host App 弹出）。
export const ENTITLEMENT_MESSAGE_TYPES = {
  GET_ENTITLEMENTS: 'getEntitlements',
  REFRESH_ENTITLEMENTS: 'refreshEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
  OPEN_HOST_APP: 'openHostApp',
  // UI 展示完 notice 后调用，清除这条一次性提示。
  ACK_ENTITLEMENT_NOTICE: 'ackEntitlementNotice',
};

// UI（popup / settings）与 background 之间的完整消息协议。
// 两端必须使用同一份定义 —— 手工复制迟早会漂移。
export const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG',
  GET_CUSTOM_ATTRIBUTES: 'GET_CUSTOM_ATTRIBUTES',
  SET_CUSTOM_ATTRIBUTES: 'SET_CUSTOM_ATTRIBUTES',
  RESET_CUSTOM_ATTRIBUTES: 'RESET_CUSTOM_ATTRIBUTES',
  ...ENTITLEMENT_MESSAGE_TYPES,
};

// ===== License / Plan state =====
// "商业平台" 与 "Pro 权益" 是两件事：
//   Chrome/Firefox 是免费且无限制的平台，它们不是 Pro，也不该显示任何付费 UI。
//   Safari 才区分 免费版 / Pro。
// UI 一律通过 getLicenseModeFor()/licenseMode() 决定展示什么，
// 绝不要用 hasUnlimitedSites() 反推套餐名。
export const LICENSE_MODES = {
  UNRESTRICTED: 'unrestricted', // Chrome / Firefox：免费且不限额
  FREE: 'free',                 // Safari 免费版
  PRO: 'pro',                   // Safari 已解锁 Pro
};

/**
 * 由权限快照推导 UI 用的授权模式。
 * @param {{isLimitEnforced?: boolean, entitlements?: string[]}|null|undefined} snapshot
 * @returns {'unrestricted'|'free'|'pro'}
 */
export function getLicenseModeFor(snapshot) {
  if (!snapshot || !snapshot.isLimitEnforced) return LICENSE_MODES.UNRESTRICTED;
  const entitlements = Array.isArray(snapshot.entitlements) ? snapshot.entitlements : [];
  return entitlements.includes(ENTITLEMENTS.UNLIMITED_SITES)
    ? LICENSE_MODES.PRO
    : LICENSE_MODES.FREE;
}
