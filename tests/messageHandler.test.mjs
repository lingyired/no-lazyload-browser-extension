// tests/messageHandler.test.mjs
// background/messageHandler.js 的行为回归：
//   · 免费额度撞上限 → 拒绝新增 + 写入购买待办
//   · 批量导入被截断 → 不写待办
//   · 权限刷新后 → 自动补做待办并留下一次性 notice
//   · 权限快照 → 带上 licenseMode / storageAvailable

import assert from 'node:assert/strict';
import { installChromeStub, makeManager } from './helpers/chrome-stub.mjs';

export const name = 'background/messageHandler.js';

export async function run() {
  const ctx = installChromeStub();
  const { setupMessageHandler } = await import('../background/messageHandler.js');

  // ---- Safari Free：第 4 个网站被拦，并留下待办 ----
  const freeManager = makeManager({ enforceLimit: true, entitlements: [] });
  setupMessageHandler(freeManager);

  for (const domain of ['a.com', 'b.com', 'c.com']) {
    const r = await ctx.dispatch({ type: 'SET_SITE_CONFIG', domain, strategy: 'tech-block' });
    assert.equal(r.success, true, domain + ' 应当可以添加');
  }

  const denied = await ctx.dispatch({
    type: 'SET_SITE_CONFIG', domain: 'www.d.com', strategy: 'tech-block', scrollFallback: true,
  });
  assert.deepEqual({ success: denied.success, error: denied.error },
                   { success: false, error: 'LIMIT_REACHED' });

  const pending = ctx.store.pendingEntitlementAction;
  assert.ok(pending, '撞上限时必须写入待办');
  assert.equal(pending.domain, 'd.com', '待办域名必须规范化');
  assert.equal(pending.scrollFallback, true);
  assert.equal(pending.version, 1);
  assert.equal(pending.action, 'addSite');

  // 导入被截断不应覆盖待办
  await ctx.dispatch({ type: 'SET_SITE_CONFIG', domain: 'e.com', source: 'import' });
  assert.equal(ctx.store.pendingEntitlementAction.domain, 'd.com', '导入不应改写待办');

  // ---- 购买完成后刷新权限 → 自动补做待办 ----
  freeManager.setEntitlements(['unlimitedSites']);
  const refreshed = await ctx.dispatch({ type: 'refreshEntitlements' });
  assert.equal(refreshed.licenseMode, 'pro');
  assert.ok(ctx.store.siteConfigs['d.com'], 'Pro 生效后应补做待办');
  assert.equal(ctx.store.siteConfigs['d.com'].scrollFallback, true, '补做时保留兼容模式设置');
  assert.equal(ctx.store.pendingEntitlementAction, undefined, '待办应被消费');
  assert.equal(refreshed.notice.type, 'pendingSiteAdded');
  assert.equal(refreshed.notice.domain, 'd.com');

  // ACK 后 notice 消失
  await ctx.dispatch({ type: 'ackEntitlementNotice' });
  const after = await ctx.dispatch({ type: 'getEntitlements' });
  assert.equal(after.notice, null);

  // ---- Chrome/Firefox：不限额，永不产生待办 ----
  const ctx2 = installChromeStub();
  const chromeManager = makeManager({ enforceLimit: false });
  setupMessageHandler(chromeManager);
  for (let i = 0; i < 10; i++) {
    const r = await ctx2.dispatch({ type: 'SET_SITE_CONFIG', domain: 'site' + i + '.com' });
    assert.equal(r.success, true);
  }
  assert.equal(ctx2.store.pendingEntitlementAction, undefined, '免费平台不该出现待办');

  const snap = await ctx2.dispatch({ type: 'getEntitlements' });
  assert.equal(snap.licenseMode, 'unrestricted', 'Chrome/Firefox 不是 Pro');

  // ---- 过期待办会被丢弃 ----
  const ctx3 = installChromeStub({
    pendingEntitlementAction: {
      version: 1, action: 'addSite', domain: 'old.com',
      strategy: 'tech-block', scrollFallback: false,
      createdAt: Date.now() - 25 * 60 * 60 * 1000,
    },
  });
  const proManager = makeManager({ enforceLimit: true, entitlements: ['unlimitedSites'] });
  setupMessageHandler(proManager);
  await ctx3.dispatch({ type: 'refreshEntitlements' });
  assert.equal(ctx3.store.siteConfigs && ctx3.store.siteConfigs['old.com'], undefined,
               '超过 24 小时的待办必须被丢弃');

  // ---- 已存在的网站在限额下仍可更新策略 ----
  const ctx4 = installChromeStub({
    siteConfigs: { 'x.com': { strategy: 'tech-block', scrollFallback: false, addedAt: 1 } },
  });
  const free4 = makeManager({ enforceLimit: true });
  setupMessageHandler(free4);
  const update = await ctx4.dispatch({
    type: 'SET_SITE_CONFIG', domain: 'x.com', strategy: 'scroll-fallback', scrollFallback: true,
  });
  assert.equal(update.success, true, '更新已有网站不受限额影响');
  assert.equal(ctx4.store.siteConfigs['x.com'].scrollFallback, true);
}
