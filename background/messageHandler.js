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
  OPEN_HOST_APP: 'openHostApp'
};

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

          case MESSAGE_TYPES.SET_SITE_CONFIG:
            // Chrome/Firefox 不执行网站数量限额（enforceLimit=false）
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
          case MESSAGE_TYPES.REFRESH_ENTITLEMENTS:
            sendResponse({
              success: true,
              // snapshot() 已包含 entitlements / isLimitEnforced / freeSiteLimit / licenseMode
              ...jsEntitlementManager.snapshot(),
            });
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
