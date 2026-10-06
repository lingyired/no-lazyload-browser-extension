// tests/domain.test.mjs
import assert from 'node:assert/strict';
import { normalizeHostname, domainFromUrl, migrateSiteConfigs, findSiteConfig } from '../shared/domain.js';

export const name = 'shared/domain.js';

export function run() {
  // 统一策略：小写 → 去空白 → 去端口 → 去根点 → 去 www.
  assert.equal(normalizeHostname('WWW.Example.COM'), 'example.com');
  assert.equal(normalizeHostname('  www.example.com  '), 'example.com');
  assert.equal(normalizeHostname('example.com.'), 'example.com');
  assert.equal(normalizeHostname('example.com:8080'), 'example.com');
  assert.equal(normalizeHostname('example.com'), 'example.com');
  assert.equal(normalizeHostname('192.168.1.1'), '192.168.1.1');
  assert.equal(normalizeHostname(''), '');
  assert.equal(normalizeHostname(undefined), '');
  assert.equal(normalizeHostname('   '), '');

  assert.equal(domainFromUrl('https://www.example.com/a?b=1'), 'example.com');
  assert.equal(domainFromUrl('http://EXAMPLE.com'), 'example.com');
  assert.equal(domainFromUrl('chrome://settings'), '');
  assert.equal(domainFromUrl('not a url'), '');

  // www. 与非 www. 重复项合并：保留较新的 strategy/scrollFallback
  const migrated = migrateSiteConfigs({
    'www.example.com': { strategy: 'tech-block', scrollFallback: true, addedAt: 100 },
    'example.com': { strategy: 'tech-block', scrollFallback: false, addedAt: 200 },
    'Other.COM': { strategy: 'scroll-fallback', scrollFallback: true, addedAt: 1 },
  });
  assert.deepEqual(Object.keys(migrated.configs).sort(), ['example.com', 'other.com']);
  assert.equal(migrated.configs['example.com'].scrollFallback, false);
  assert.equal(migrated.configs['example.com'].addedAt, 100, 'addedAt 取最早值');
  assert.equal(migrated.changed, true);

  // 幂等
  assert.equal(migrateSiteConfigs(migrated.configs).changed, false);

  // 未迁移的遗留 www. 键仍可命中
  assert.deepEqual(findSiteConfig({ 'www.legacy.com': { strategy: 'tech-block' } }, 'legacy.com'),
                   { strategy: 'tech-block' });
  assert.equal(findSiteConfig({}, 'example.com'), null);
}
