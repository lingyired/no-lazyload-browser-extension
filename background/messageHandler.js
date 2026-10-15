// background/messageHandler.js
//
// 所有平台（Chrome / Firefox / Safari）都是免费且无限制的：
// 这里不存在站点数量上限，也不存在"高级设置需要 Pro"这类门禁。

import { MESSAGE_TYPES } from '../shared/constants.js';
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

/**
 * 处理来自 content script 或 settings 页面的消息
 */
function setupMessageHandler() {
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
            await setSiteConfig(request.domain, request.strategy, request.scrollFallback, {
              addedAt: request.addedAt,
            });
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
