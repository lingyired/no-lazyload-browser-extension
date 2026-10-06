// shared/domain.js
// 域名规范化的唯一实现（canonical ES module）。
//
// 背景：popup 曾经把 www. 去掉，而 background 匹配时保留原样，
// 结果从 www.example.com 添加的网站在重载后匹配不上（"看起来已启用但没生效"）。
// 因此全局只允许一套规则：
//   1. 小写
//   2. 去首尾空白
//   3. 去端口
//   4. 去结尾的根点（example.com. → example.com）
//   5. 去掉一个 www. 前缀
// 刻意不做 eTLD+1 / 公共后缀折叠 —— 那是另一个产品决策，不在本任务范围。

const WWW_PREFIX = /^www\./;

/**
 * 规范化为唯一的站点键（canonical key）。
 * @param {string} hostname 主机名或用户输入的域名
 * @returns {string} 规范化结果；无法解析时返回空字符串
 */
export function normalizeHostname(hostname) {
  if (typeof hostname !== 'string') return '';

  let host = hostname.trim().toLowerCase();
  if (!host) return '';

  // 去端口。IPv6 字面量形如 [::1]:8080，只截到 ] 为止。
  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end !== -1) host = host.slice(0, end + 1);
  } else {
    const colon = host.lastIndexOf(':');
    if (colon !== -1 && /^\d+$/.test(host.slice(colon + 1))) {
      host = host.slice(0, colon);
    }
  }

  // 去结尾的根点
  while (host.endsWith('.')) host = host.slice(0, -1);
  if (!host) return '';

  // 统一的 www. 策略：www.example.com → example.com
  host = host.replace(WWW_PREFIX, '');

  return host;
}

/**
 * 从完整 URL 取规范化域名。只接受 http/https。
 * @param {string} url
 * @returns {string}
 */
export function domainFromUrl(url) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return normalizeHostname(parsed.hostname);
  } catch {
    return '';
  }
}

/**
 * 合并同一域名下的两份配置（历史上可能同时存在 www.example.com 与 example.com）。
 * 策略：保留较新的 strategy / scrollFallback，addedAt 取最早值。
 * @param {object} a
 * @param {object} b
 */
export function mergeSiteConfig(a, b) {
  if (!a) return b;
  if (!b) return a;
  const aTime = a.addedAt || 0;
  const bTime = b.addedAt || 0;
  const newer = bTime >= aTime ? b : a;
  const older = newer === a ? b : a;
  const scrollFallback = newer.scrollFallback !== undefined
    ? newer.scrollFallback === true
    : older.scrollFallback === true;
  return {
    strategy: newer.strategy || older.strategy,
    scrollFallback,
    addedAt: Math.min(aTime || Infinity, bTime || Infinity) || newer.addedAt || older.addedAt || Date.now(),
  };
}

/**
 * 迁移站点配置表：规范化所有键，并合并 www./非 www. 重复项。
 * 幂等：已经规范的输入不会再发生变化（changed=false）。
 * @param {Object<string, object>} configs
 * @returns {{configs: Object, changed: boolean}}
 */
export function migrateSiteConfigs(configs) {
  if (!configs || typeof configs !== 'object') return { configs: {}, changed: false };

  const out = {};
  let changed = false;

  for (const [rawDomain, config] of Object.entries(configs)) {
    const domain = normalizeHostname(rawDomain);
    if (!domain) {
      changed = true;
      continue;
    }
    if (domain !== rawDomain) changed = true;

    if (out[domain]) {
      out[domain] = mergeSiteConfig(out[domain], config);
      changed = true;
    } else {
      out[domain] = config;
    }
  }

  return { configs: out, changed };
}

/**
 * 在站点配置表中查找域名对应的配置。
 * 迁移尚未跑完时，也接受遗留的 www. 键，避免"看起来启用了但没生效"。
 * @param {Object<string, object>} configs
 * @param {string} host
 * @returns {object|null}
 */
export function findSiteConfig(configs, host) {
  if (!configs) return null;
  const domain = normalizeHostname(host);
  if (!domain) return null;
  return configs[domain] || configs['www.' + domain] || null;
}
