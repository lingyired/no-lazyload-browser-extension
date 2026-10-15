// background/index.js
// Chrome / Firefox 入口（MV3 service worker，ES module）。
//
// Chrome、Firefox 与 Safari 都是"免费且无限制"的平台：
// 没有内购、没有授权查询，也没有站点数量上限。

import { setupMessageHandler } from './messageHandler.js';
import { migrateStoredSiteConfigs } from './siteConfigManager.js';
import { setupTabListeners } from './badge.js';

// 初始化
setupMessageHandler();
setupTabListeners();

// 一次性把历史站点键规范化（www.example.com → example.com），幂等。
migrateStoredSiteConfigs().catch(e => console.warn('[Background] 站点键迁移失败', e));

console.log('[Image Lazy Load Blocker] Background service worker started');
