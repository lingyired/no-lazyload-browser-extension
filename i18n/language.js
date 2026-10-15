// Shared resolver, bundled into locales.js by build.js.
(function (root) {
  'use strict';
  const RTL = new Set(['ar', 'fa', 'he', 'ps', 'ur']);

  function resolveLanguage(candidate, supported = Object.keys(root.__LOCALES__ || {})) {
    if (typeof candidate !== 'string' || !candidate.trim()) return null;
    const value = candidate.trim().replace(/_/g, '-').toLowerCase();
    const match = code => supported.find(
      lang => lang.toLowerCase().replace(/_/g, '-') === code.toLowerCase().replace(/_/g, '-')
    ) || null;
    if (value === 'zh' || value.startsWith('zh-')) {
      const variants = /(^|-)hk($|-)|(^|-)mo($|-)/.test(value)
        ? ['zh_HK', 'zh_TW', 'zh', 'zh_CN']
        : /(^|-)tw($|-)|(^|-)hant($|-)/.test(value)
          ? ['zh_TW', 'zh_HK', 'zh', 'zh_CN']
          : ['zh', 'zh_CN', 'zh_TW', 'zh_HK'];
      for (const variant of variants) {
        const found = match(variant);
        if (found) return found;
      }
      return null;
    }
    return match(value) || match(value.split('-')[0]);
  }

  function detectBrowserLanguage(runtime, navigatorLanguage, supported = Object.keys(root.__LOCALES__ || {})) {
    let uiLanguage = null;
    try { uiLanguage = runtime?.i18n?.getUILanguage?.(); }
    catch { /* Fall back to navigator when the browser API is unavailable. */ }
    return resolveLanguage(uiLanguage, supported)
      || resolveLanguage(navigatorLanguage, supported)
      || resolveLanguage('en', supported)
      || supported[0]
      || 'en';
  }

  function applyDocumentLanguage(language, doc = root.document) {
    if (!doc?.documentElement) return;
    doc.documentElement.lang = language === 'zh' ? 'zh-CN' : language.replace(/_/g, '-');
    doc.documentElement.dir = RTL.has(language.split(/[-_]/)[0]) ? 'rtl' : 'ltr';
  }

  root.NoLazyloadLanguage = Object.freeze({
    resolveLanguage, detectBrowserLanguage, applyDocumentLanguage
  });
})(window);
