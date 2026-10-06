// background/index.js
// Chrome / Firefox 入口（MV3 service worker，ES module）。
//
// Chrome 与 Firefox 都是"免费且无限制"的平台：
// enforceLimit=false → 所有权限视为已授予，UI 也不会显示任何付费入口。

import { setupMessageHandler } from './messageHandler.js';
import { migrateStoredSiteConfigs } from './siteConfigManager.js';
import { setupTabListeners } from './badge.js';
import { JSEntitlementManager } from '../shared/entitlements.js';

const jsEntitlementManager = new JSEntitlementManager({ enforceLimit: false });

// 初始化
setupMessageHandler(jsEntitlementManager);
setupTabListeners();

// 一次性把历史站点键规范化（www.example.com → example.com），幂等。
migrateStoredSiteConfigs().catch(e => console.warn('[Background] 站点键迁移失败', e));

console.log('[Image Lazy Load Blocker] Background service worker started');
