// tests/visual/chrome-stub.js
// 视觉预览用的 chrome.* 替身。
//
// ⚠️ 必须同时支持回调式与 Promise 式调用：MV3 里 popup.js 用
//    `await chrome.tabs.query(...)`（Promise），却用回调形式 sendMessage。
//    行为对齐 background 的真实返回。
(function () {
  // 直接读 URL：本脚本在预览页内联脚本之前执行，
  // 那时 window.__PREVIEW_STATE__ 还没赋值。
  const state = new URLSearchParams(location.search).get('state') || 'free';

  const sites = {
    'example.com': { strategy: 'tech-block', scrollFallback: false, addedAt: 3 },
    'news.example.org': { strategy: 'scroll-fallback', scrollFallback: true, addedAt: 2 },
  };
  if (state === 'empty') {
    delete sites['example.com'];
    delete sites['news.example.org'];
  }
  if (state === 'pro' || state === 'unrestricted' || state === 'notice') {
    sites['blog.example.net'] = { strategy: 'tech-block', scrollFallback: false, addedAt: 1 };
  }

  const entitlement = {
    free: { entitlements: [], isLimitEnforced: true, licenseMode: 'free', storageAvailable: true },
    pro: { entitlements: ['unlimitedSites'], isLimitEnforced: true, licenseMode: 'pro', storageAvailable: true },
    unrestricted: { entitlements: [], isLimitEnforced: false, licenseMode: 'unrestricted', storageAvailable: null },
    empty: { entitlements: [], isLimitEnforced: true, licenseMode: 'free', storageAvailable: true },
    limit: { entitlements: [], isLimitEnforced: true, licenseMode: 'free', storageAvailable: true },
    unavailable: { entitlements: [], isLimitEnforced: true, licenseMode: 'free', storageAvailable: false },
    notice: { entitlements: ['unlimitedSites'], isLimitEnforced: true, licenseMode: 'pro', storageAvailable: true },
  }[state];

  // state=notice 模拟"买完 Pro 回来"：background 已补做第 4 个网站，并留下一次性提示
  let noticeData = state === 'notice'
    ? { type: 'pendingSiteAdded', domain: 'blog.example.net', at: 1700000000000 }
    : null;

  const limitHit = state === 'limit';

  function respond(message) {
    switch (message.type) {
      case 'GET_ALL_CONFIGS':
        return { success: true, data: JSON.parse(JSON.stringify(sites)) };
      case 'getEntitlements':
      case 'refreshEntitlements':
        return Object.assign({ success: true, pendingAction: null, notice: noticeData }, entitlement);
      case 'SET_SITE_CONFIG':
        if (limitHit && !sites[message.domain] && entitlement.entitlements.length === 0) {
          return { success: false, error: 'LIMIT_REACHED' };
        }
        sites[message.domain] = {
          strategy: message.strategy || 'tech-block',
          scrollFallback: message.scrollFallback === true,
          addedAt: Date.now(),
        };
        return { success: true };
      case 'REMOVE_SITE_CONFIG':
        delete sites[message.domain];
        return { success: true };
      case 'ackEntitlementNotice':
        window.__ACK_COUNT__ = (window.__ACK_COUNT__ || 0) + 1;
        noticeData = null;   // 一次性：ACK 之后不该再弹
        return { success: true };
      case 'requestPurchase':
        return { success: false, error: 'PREVIEW' };
      default:
        return { success: false, error: 'PREVIEW_UNKNOWN' };
    }
  }

  // 回调式 + Promise 式双支持
  function dual(fn) {
    return function () {
      const args = Array.prototype.slice.call(arguments);
      const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null;
      const result = fn.apply(null, args);
      return new Promise(function (resolve) {
        setTimeout(function () {
          if (cb) cb(result);
          resolve(result);
        }, 0);
      });
    };
  }

  // i18n-manager.js 用 runtime.getURL('_locales/<lang>/messages.json') + fetch 读文案。
  // 预览页在 tests/visual/ 下，把 URL 指回仓库根目录。
  const localeUrl = function (p) {
    return '../../' + p.replace(/^\.\.\//, '');
  };
  const originalFetch = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = function (input, init) {
    const url = typeof input === 'string' ? input : (input && input.url) || '';
    if (url.indexOf('_locales/') !== -1) {
      return originalFetch(localeUrl(url), init);
    }
    return originalFetch(input, init);
  };

  window.chrome = {
    runtime: {
      sendMessage: dual(function (message) { return respond(message); }),
      openOptionsPage: function () {},
      getURL: function (p) { return p; },
    },
    storage: {
      local: {
        get: dual(function () { return { preferredLanguage: 'en' }; }),
        set: dual(function () { return undefined; }),
      },
    },
    tabs: {
      query: dual(function () { return [{ id: 1, url: 'https://www.example.com/some/page' }]; }),
      reload: dual(function () { return undefined; }),
    },
    i18n: {
      getUILanguage: function () { return 'en'; },
      getMessage: function (key) { return ''; },
    },
  };
})();
