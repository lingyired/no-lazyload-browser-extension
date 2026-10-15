// tests/messageHandler.test.mjs
// background/messageHandler.js 的行为回归：
//   · 网站配置的增删改查
//   · 自定义检测规则（懒加载属性 / 占位符）读写
//   · 三个平台一视同仁 —— 没有站点数量上限，也没有 Pro 门禁

import assert from 'node:assert/strict';
import { installChromeStub } from './helpers/chrome-stub.mjs';

export const name = 'background/messageHandler.js';

export async function run() {
  const ctx = installChromeStub();
  const { setupMessageHandler } = await import('../background/messageHandler.js');
  setupMessageHandler();

  // ---- 网站配置：新增 / 读取 / 更新 / 删除 ----
  for (const [i, domain] of ['a.com', 'b.com', 'c.com', 'www.d.com', 'e.com'].entries()) {
    const r = await ctx.dispatch({ type: 'SET_SITE_CONFIG', domain, strategy: 'tech-block' });
    assert.equal(r.success, true, domain + ' 应当可以添加（没有数量上限）');
  }
  assert.deepEqual(Object.keys(ctx.store.siteConfigs).sort(),
                   ['a.com', 'b.com', 'c.com', 'd.com', 'e.com'],
                   '域名键必须规范化，www. 前缀不入库');

  const single = await ctx.dispatch({ type: 'GET_SITE_CONFIG', url: 'https://www.b.com/x' });
  assert.equal(single.success, true);
  assert.equal(single.data.strategy, 'tech-block');

  const updated = await ctx.dispatch({
    type: 'SET_SITE_CONFIG', domain: 'a.com', strategy: 'scroll-fallback', scrollFallback: true,
  });
  assert.equal(updated.success, true, '更新已有网站应成功');
  assert.equal(ctx.store.siteConfigs['a.com'].scrollFallback, true);
  assert.equal(ctx.store.siteConfigs['a.com'].strategy, 'scroll-fallback');

  const all = await ctx.dispatch({ type: 'GET_ALL_CONFIGS' });
  assert.equal(Object.keys(all.data).length, 5);

  const removed = await ctx.dispatch({ type: 'REMOVE_SITE_CONFIG', domain: 'e.com' });
  assert.equal(removed.success, true);
  assert.equal(ctx.store.siteConfigs['e.com'], undefined);

  // ---- addedAt 透传（导入排序依赖它）----
  await ctx.dispatch({ type: 'SET_SITE_CONFIG', domain: 'sorted.com', addedAt: 12345 });
  assert.equal(ctx.store.siteConfigs['sorted.com'].addedAt, 12345, '导入时必须保留原始 addedAt');

  // ---- 全局配置 ----
  const globalDefault = await ctx.dispatch({ type: 'GET_GLOBAL_CONFIG' });
  assert.equal(globalDefault.success, true);
  assert.equal(globalDefault.data.defaultStrategy, 'disabled', '未配置时返回默认策略');

  await ctx.dispatch({ type: 'SET_GLOBAL_CONFIG', config: { scrollSpeed: 900 } });
  const globalAfter = await ctx.dispatch({ type: 'GET_GLOBAL_CONFIG' });
  assert.equal(globalAfter.data.scrollSpeed, 900);

  // ---- 自定义检测规则：任何平台都可读写 ----
  const attrsDefault = await ctx.dispatch({ type: 'GET_CUSTOM_ATTRIBUTES' });
  assert.equal(attrsDefault.success, true);
  assert.ok(Array.isArray(attrsDefault.data.lazyAttributes) && attrsDefault.data.lazyAttributes.length > 0);
  assert.ok(Array.isArray(attrsDefault.data.placeholderPatterns));

  const writeAttrs = await ctx.dispatch({
    type: 'SET_CUSTOM_ATTRIBUTES',
    lazyAttributes: ['data-x'],
    placeholderPatterns: ['x'],
  });
  assert.equal(writeAttrs.success, true, '高级设置对所有平台开放');
  assert.deepEqual(ctx.store.customAttributes.lazyAttributes, ['data-x']);

  const resetAttrs = await ctx.dispatch({ type: 'RESET_CUSTOM_ATTRIBUTES' });
  assert.equal(resetAttrs.success, true);
  assert.ok(resetAttrs.data.lazyAttributes.length > 1, '重置应回到默认列表');
  assert.deepEqual(ctx.store.customAttributes.lazyAttributes, resetAttrs.data.lazyAttributes);

  // ---- 批量导入：不受任何数量上限截断 ----
  const ctx2 = installChromeStub();
  setupMessageHandler();
  for (let i = 0; i < 10; i++) {
    const r = await ctx2.dispatch({ type: 'SET_SITE_CONFIG', domain: 'site' + i + '.com' });
    assert.equal(r.success, true, '第 ' + (i + 1) + ' 个网站也不该被拒绝');
  }
  assert.equal(Object.keys(ctx2.store.siteConfigs).length, 10, '10 个网站必须全部写入');

  // ---- 未知消息类型明确报错，不静默成功 ----
  const unknown = await ctx.dispatch({ type: 'NOPE' });
  assert.deepEqual({ success: unknown.success, error: unknown.error },
                   { success: false, error: 'Unknown message type' });

  // ---- 内购 / 授权相关的消息类型已彻底移除 ----
  for (const legacy of ['getEntitlements', 'refreshEntitlements', 'requestPurchase',
                        'restorePurchases', 'openHostApp', 'ackEntitlementNotice']) {
    const r = await ctx.dispatch({ type: legacy });
    assert.equal(r.success, false, legacy + ' 不应再被处理');
  }
}
