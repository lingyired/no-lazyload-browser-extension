// shared/entitlements.js
// JS 侧权限管理器（canonical ES module，供 Chrome/Firefox background/index.js 使用）
// Safari 的 background-safari.js 是单文件经典脚本，会把本文件内容内联
// （参考 MESSAGE_TYPES 的既有重复模式）——改这里时记得同步那边。
//
// 业务层永远只调用 has(...)，不要判断 isPro。
// Chrome/Firefox: enforceLimit=false → 所有权限视为已授予（无限制）
// Safari: enforceLimit=true → 通过 sendNativeMessage 向原生 EntitlementStore 查询

import { ENTITLEMENTS, APP_LIMITS, LICENSE_MODES, getLicenseMode } from './constants.js';

class JSEntitlementManager {
  constructor(options = {}) {
    /** @type {Set<string>} */
    this.entitlements = new Set();
    /** 是否执行限额（Safari=true, Chrome/Firefox=false） */
    this.enforceLimit = options.enforceLimit ?? false;
    /** 原生消息接收方 bundle id（Safari=包含 App bundle id, 其它=null） */
    this.nativeBundleId = options.nativeBundleId ?? null;
    /**
     * 原生权限存储（App Group）是否可用。
     * null = 尚未查询过；false = 明确不可用（UI 必须显式提示，不能拿它当免费版）。
     */
    this.storageAvailable = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    await this.reload();
    this._initialized = true;
  }

  /**
   * 从原生 EntitlementStore（App Group）重新读取权限。
   * StoreKit 购买在 Host App 进程完成，结果通过 App Group 在这里被读到。
   */
  async reload() {
    if (!this.nativeBundleId) return; // Chrome/Firefox: 无原生桥接
    try {
      const resp = await browser.runtime.sendNativeMessage(this.nativeBundleId, {
        action: 'getEntitlements',
      });
      if (resp && typeof resp.storageAvailable === 'boolean') {
        this.storageAvailable = resp.storageAvailable;
      }
      if (resp && Array.isArray(resp.entitlements)) {
        this.entitlements = new Set(resp.entitlements);
      }
    } catch (e) {
      console.warn('[Entitlement] reload failed', e);
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
    return getLicenseMode({
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
   * 返回 true 不代表购买完成 —— 购买结果要等下一次 reload() 才读到。
   * Chrome/Firefox 无内购，直接返回 false。
   */
  async openHostApp() {
    if (!this.nativeBundleId) return false;
    try {
      const resp = await browser.runtime.sendNativeMessage(this.nativeBundleId, {
        action: 'openHostApp',
      });
      return !!(resp && resp.success);
    } catch (e) {
      console.warn('[Entitlement] openHostApp failed', e);
      return false;
    }
  }
}

export { JSEntitlementManager, ENTITLEMENTS, APP_LIMITS, LICENSE_MODES };
