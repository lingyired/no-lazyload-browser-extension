// background/pendingAction.js
// "购买前想启用的网站" 的持久化待办。
//
// 为什么需要它：Safari 的 popup 在 Host App 被激活时会被系统关掉，
// 原来"打开 App 后轮询权限、成功再补加网站"的逻辑会随 popup 一起消失，
// 用户买完 Pro 回来会发现第 4 个网站没被加上。
//
// 因此把动作写进 storage.local，由 background 在拿到 Pro 之后补做：
//   1. SET_SITE_CONFIG 撞上限 → 存 pending（含 domain/strategy/scrollFallback）
//   2. 用户去 Host App 完成购买
//   3. 任一次成功的权限刷新 → background 补做 pending → 写 notice
//   4. UI 下次打开时读到 notice，提示"Pro 已解锁，example.com 已启用"，然后 ACK 清除
//
// 超过 PENDING_ACTION_TTL_MS（24h）的待办直接丢弃。

import { STORAGE_KEYS, PENDING_ACTION_TTL_MS, STRATEGIES } from '../shared/constants.js';
import { normalizeHostname } from '../shared/domain.js';

function storageArea() {
  return typeof browser !== 'undefined' ? browser.storage.local : chrome.storage.local;
}

/**
 * 构造一条待办动作。域名会规范化；无效域名返回 null。
 * @param {{domain: string, strategy?: string, scrollFallback?: boolean}} input
 * @param {number} [now]
 */
export function buildPendingAction(input, now = Date.now()) {
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

/**
 * 校验并返回一条待办；格式非法 / 过期 / 不是 addSite 时返回 null。
 * @param {any} raw
 * @param {number} [now]
 */
export function validatePendingAction(raw, now = Date.now()) {
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

/** 写入待办（同一时间只保留一条：最后一次意图为准）。 */
export async function savePendingAction(action) {
  if (!action) return false;
  await storageArea().set({ [STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION]: action });
  return true;
}

/**
 * 读取待办。已过期的会顺手清掉。
 * @returns {Promise<object|null>}
 */
export async function loadPendingAction(now = Date.now()) {
  const result = await storageArea().get(STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION);
  const raw = result ? result[STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION] : null;
  if (!raw) return null;

  const action = validatePendingAction(raw, now);
  if (!action) {
    await clearPendingAction();
    return null;
  }
  return action;
}

export async function clearPendingAction() {
  await storageArea().remove(STORAGE_KEYS.PENDING_ENTITLEMENT_ACTION);
}

/** 写一条给 UI 的一次性提示（待办补做完成 / 购买完成）。 */
export async function setEntitlementNotice(notice) {
  await storageArea().set({ [STORAGE_KEYS.ENTITLEMENT_NOTICE]: notice });
}

/** 读取提示（不清除，UI 展示后需显式 ACK）。 */
export async function getEntitlementNotice() {
  const result = await storageArea().get(STORAGE_KEYS.ENTITLEMENT_NOTICE);
  return (result && result[STORAGE_KEYS.ENTITLEMENT_NOTICE]) || null;
}

export async function clearEntitlementNotice() {
  await storageArea().remove(STORAGE_KEYS.ENTITLEMENT_NOTICE);
}
