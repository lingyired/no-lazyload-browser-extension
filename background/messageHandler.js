// background/messageHandler.js

import {
  getSiteConfig,
  setSiteConfig,
  removeSiteConfig,
  getAllSiteConfigs,
  getGlobalConfig,
  setGlobalConfig,
  getCustomAttributes,
  setCustomAttributes,
  resetCustomAttributes
} from './siteConfigManager.js';
import {
  buildPendingAction,
  savePendingAction,
  loadPendingAction,
  clearPendingAction,
  setEntitlementNotice,
  getEntitlementNotice,
  clearEntitlementNotice,
} from './pendingAction.js';

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
  // Entitlement / Purchase（Chrome/Firefox 不执行限额，但复用同一消息协议）
  GET_ENTITLEMENTS: 'getEntitlements',
  REFRESH_ENTITLEMENTS: 'refreshEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
  OPEN_HOST_APP: 'openHostApp',
  ACK_ENTITLEMENT_NOTICE: 'ackEntitlementNotice'
};

/**
 * 权限到位后补做"购买前被限额拦住的那次添加"。
 *
 * 只有真正能新增网站时才执行；执行完写一条 notice 让 UI 提示用户。
 * 幂等：待办一次性消费，成功或已存在都会清掉。
 *
 * @param {import('../shared/entitlements.js').JSEntitlementManager} manager
 * @returns {Promise<object|null>} 补做成功的待办
 */
async function completePendingEntitlementAction(manager) {
  const pending = await loadPendingAction();
  if (!pending) return null;

  const configs = await getAllSiteConfigs();
  const count = Object.keys(configs).length;

  if (!manager.canAddSite(count)) return null;

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

/**
 * 处理来自 content script 或 settings 页面的消息
 * @param {import('../shared/entitlements.js').JSEntitlementManager} jsEntitlementManager
 */
function setupMessageHandler(jsEntitlementManager) {
  const runtime = typeof browser !== 'undefined'
    ? browser.runtime
    : chrome.runtime;

  runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
      try {
        switch (request.type) {
          case MESSAGE_TYPES.GET_SITE_CONFIG:
            const config = await getSiteConfig(request.url);
            sendResponse({ success: true, data: config });
            break;

          case MESSAGE_TYPES.SET_SITE_CONFIG: {
            // 限额只拦"新增"，更新已有网站的设置不受限。
            // Chrome/Firefox 的 manager 恒为 canAddSite=true，所以这段对它们无副作用。
            const existingConfigs = await getAllSiteConfigs();
            const isNewAdd = !existingConfigs[request.domain];
            if (isNewAdd) {
              const currentCount = Object.keys(existingConfigs).length;
              if (!jsEntitlementManager.canAddSite(currentCount)) {
                // 批量导入被截断不算"用户想启用这一个网站"，不写待办，
                // 否则买完 Pro 会莫名多出一个导入里的网站。
                if (request.source !== 'import') {
                  const pending = buildPendingAction({
                    domain: request.domain,
                    strategy: request.strategy,
                    scrollFallback: request.scrollFallback,
                  });
                  await savePendingAction(pending);
                }
                sendResponse({ success: false, error: 'LIMIT_REACHED' });
                break;
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

          // ===== Entitlement / Purchase 处理（Chrome/Firefox: 无限额，全部视为已授权）=====
          // 无原生桥接，GET 与 REFRESH 返回同一份内存状态。
          case MESSAGE_TYPES.GET_ENTITLEMENTS:
            sendResponse({
              success: true,
              // snapshot() 已包含 entitlements / isLimitEnforced / freeSiteLimit / licenseMode
              ...jsEntitlementManager.snapshot(),
              pendingAction: await loadPendingAction(),
              notice: await getEntitlementNotice(),
            });
            break;

          case MESSAGE_TYPES.REFRESH_ENTITLEMENTS: {
            const ok = await jsEntitlementManager.refresh();
            // 权限到位后补做购买前的待办（关掉 popup 也不会丢）
            await completePendingEntitlementAction(jsEntitlementManager);
            sendResponse({
              success: ok,
              ...jsEntitlementManager.snapshot(),
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

          // Chrome/Firefox 商店侧免费无限制，无内购也无 Host App，
          // 这几个购买相关消息永远不会被 UI 触发。保留 case 只为协议一致，
          // 统一返回"不支持"，不静默假装成功。
          case MESSAGE_TYPES.REQUEST_PURCHASE:
          case MESSAGE_TYPES.RESTORE_PURCHASES:
          case MESSAGE_TYPES.OPEN_HOST_APP:
            sendResponse({ success: false, error: 'NOT_SUPPORTED' });
            break;

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

export { setupMessageHandler, MESSAGE_TYPES };
