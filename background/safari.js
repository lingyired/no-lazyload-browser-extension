// background/safari.js
// Safari 入口（源码，ES module）。
//
// ⚠️ 本文件不会被直接加载：build.js 会用 scripts/bundle-classic.js 把它和它的
// 依赖打包成 dist/<browser>/background-safari.js（经典脚本）。
// Safari 16.4 之前 "type": "module" 的 service worker 不稳定，所以沿用经典脚本。
//
// Safari 与 Chrome / Firefox 完全一致：免费且无限制，
// 不存在内购、授权查询或站点数量上限。

import { setupMessageHandler } from './messageHandler.js';
import { migrateStoredSiteConfigs } from './siteConfigManager.js';
import { setupTabListeners } from './badge.js';

// 初始化
setupMessageHandler();
setupTabListeners();

// 一次性把历史站点键规范化（www.example.com → example.com），幂等。
migrateStoredSiteConfigs().catch(e => console.warn('[BG] 站点键迁移失败', e));

console.log('[Image Lazy Load Blocker] Background service worker started (Safari MV3)');
