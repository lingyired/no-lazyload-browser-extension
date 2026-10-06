// shared/entitlements.js
// JS 侧权限管理器 —— 唯一实现。
//
// Chrome/Firefox: enforceLimit=false → 所有权限视为已授予（无限制）
// Safari:         enforceLimit=true  → 通过 sendNativeMessage 向原生 EntitlementStore 查询
//
// 设计要点 —— cache-first：
//   权限的唯一真实来源是 Swift 侧 EntitlementStore（App Group），
//   但读它必须走原生消息，冷启动会明显拖慢 UI。
//   所以维护一份 storage.local 快照：
//     · 快照读取 —— 毫秒级，UI 立刻渲染
//     · refresh() —— 走原生拉最新值，慢但不阻塞首次渲染
//
// 业务层永远只调用 has(...)，不要判断 isPro。

import { ENTITLEMENTS, APP_LIMITS, LICENSE_MODES, getLicenseModeFor } from './constants.js';

/** 权限快照在 storage.local 中的缓存键 */
const ENTITLEMENT_CACHE_KEY = 'entitlementCache';

/** 原生调用超时上限。Safari 冷启动 handler 进程大约需要 0.5–1s，给足余量。 */
const NATIVE_TIMEOUT_MS = 5000;

/** 给 Promise 加超时，避免 sendNativeMessage 无响应时永久挂起。 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timeout')), ms)),
  ]);
}

function runtimeApi() {
  return typeof browser !== 'undefined' ? browser.runtime : chrome.runtime;
}

function storageApi() {
  return typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
}

class JSEntitlementManager {
  constructor(options = {}) {
    /** @type {Set<string>} */
    this.entitlements = new Set();
    /** 是否执行限额（Safari=true, Chrome/Firefox=false） */
    this.enforceLimit = options.enforceLimit ?? false;
    /** 原生消息接收方 bundle id（Safari=Host App bundle id, 其它=null） */
    this.nativeBundleId = options.nativeBundleId ?? null;
    /** 原生调用超时（毫秒） */
    this.nativeTimeoutMs = options.nativeTimeoutMs ?? NATIVE_TIMEOUT_MS;
    /**
     * 原生权限存储（App Group）是否可用。
     * null = 尚未查询过；false = 明确不可用（UI 必须显式提示，不能拿它当免费版）。
     */
    this.storageAvailable = null;
    this._cacheLoaded = false;
  }

  /** 读取上次的权限快照（每个进程只读一次）。 */
  async loadCache() {
    if (this._cacheLoaded) return this.entitlements;
    try {
      const result = await storageApi().get(ENTITLEMENT_CACHE_KEY);
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
      await storageApi().set({
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
        runtimeApi().sendNativeMessage(this.nativeBundleId, { action: 'getEntitlements' }),
        this.nativeTimeoutMs,
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

  /**
   * 判断是否拥有某项权限。
   * Chrome/Firefox 永远返回 true（无限制）。
   */
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
    return getLicenseModeFor({
      isLimitEnforced: this.enforceLimit,
      entitlements: Array.from(this.entitlements),
    });
  }

  /** 权限快照（供 background 返回给 UI 的纯数据） */
  snapshot() {
    return {
      entitlements: Array.from(this.entitlements),
      isLimitEnforced: this.enforceLimit,
      freeSiteLimit: APP_LIMITS.FREE_SITE_LIMIT,
      licenseMode: this.licenseMode(),
      // false 表示原生 App Group 不可用：权限状态不可信，UI 必须给出明确提示，
      // 而不是把它当成"用户没买过"。
      storageAvailable: this.storageAvailable,
    };
  }

  /**
   * 是否还能新增网站。
   * @param {number} currentCount 当前已配置网站数
   */
  canAddSite(currentCount) {
    if (this.has(ENTITLEMENTS.UNLIMITED_SITES)) return true;
    return currentCount < APP_LIMITS.FREE_SITE_LIMIT;
  }

  /**
   * 唤起 Host App 完成 StoreKit 购买。
   *
   * 扩展进程无法弹出系统付款面板，所以这里只是"打开 App"，
   * 返回 true 不代表购买完成 —— 购买结果要等下一次 refresh() 才读到。
   * Chrome/Firefox 无内购，直接返回 false。
   */
  async openHostApp() {
    if (!this.nativeBundleId) return false;
    try {
      const resp = await withTimeout(
        runtimeApi().sendNativeMessage(this.nativeBundleId, { action: 'openHostApp' }),
        this.nativeTimeoutMs,
        'openHostApp'
      );
      return !!(resp && resp.success);
    } catch (e) {
      console.warn('[Entitlement] openHostApp failed:', (e && e.message) || e);
      return false;
    }
  }
}

export { JSEntitlementManager, ENTITLEMENTS, APP_LIMITS, LICENSE_MODES, NATIVE_TIMEOUT_MS };
