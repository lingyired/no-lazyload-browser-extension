// background/safari.js
// Safari 入口（源码，ES module）。
//
// ⚠️ 本文件不会被直接加载：build.js 会用 scripts/bundle-classic.js 把它和它的
// 依赖打包成 dist/<browser>/background-safari.js（经典脚本）。
// Safari 16.4 之前 "type": "module" 的 service worker 不稳定，所以沿用经典脚本。
//
// Safari 是唯一区分"免费版 / Pro"的平台：enforceLimit=true，
// 权限全部来自 Host App 写入的 App Group。

import { setupMessageHandler } from './messageHandler.js';
import { migrateStoredSiteConfigs } from './siteConfigManager.js';
import { setupTabListeners } from './badge.js';
import { JSEntitlementManager } from '../shared/entitlements.js';

// Host App 的 bundle id。扩展通过它发原生消息（购买只能由 Host App 弹出）。
const HOST_APP_BUNDLE_ID = 'com.lingyi01.imagelazyloadblocker';

const jsEntitlementManager = new JSEntitlementManager({
  enforceLimit: true,
  nativeBundleId: HOST_APP_BUNDLE_ID,
});

// 初始化
setupMessageHandler(jsEntitlementManager);
setupTabListeners();

// 一次性把历史站点键规范化（www.example.com → example.com），幂等。
migrateStoredSiteConfigs().catch(e => console.warn('[BG] 站点键迁移失败', e));

// 后台预热权限（fire-and-forget，绝不阻塞 service worker 启动）：
// 先读本地快照供 UI 立即使用，再异步走原生拉一次最新值。
// 两者都自带超时，Swift 侧无响应也不会卡死。
jsEntitlementManager
  .loadCache()
  .then(() => jsEntitlementManager.refresh())
  .catch(e => console.warn('[BG] entitlement 预热失败', e));

console.log('[Image Lazy Load Blocker] Background service worker started (Safari MV3)');
