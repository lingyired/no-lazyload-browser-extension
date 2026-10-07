// settings/app.js
// 依赖 shared-ui.js（由 scripts/bundle-classic.js 从 shared/*.js 生成）：
//   STRATEGIES / MESSAGE_TYPES / APP_LIMITS / ENTITLEMENTS / LICENSE_MODES /
//   getLicenseModeFor / showUpgradeDialog / normalizeHostname


const DEFAULT_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true,
  fallbackToScroll: false,
  showInterceptionToast: false
};

// 当前用户权限状态缓存（由 background GET_ENTITLEMENTS 填充）
let _entitlementState = {
  entitlements: [],
  isLimitEnforced: false,
  // 购买前被限额拦住、等待后台补做的动作（background 持久化）
  pendingAction: null,
  // 一次性提示：待办被补做
  notice: null,
};

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

// 默认的懒加载属性与占位符关键词来自 shared/constants.js（shared-ui.js 提供），
// 不要再在页面脚本里复制一份。

// 翻译内容


let currentLanguage = 'zh';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  // 支持的语言列表以 i18n-manager.js 为唯一来源（_locales 下的语言目录）
  const supportedLangs = Object.keys(window.I18nLanguages || {});
  const runtime = getRuntime();

  // 优先使用 chrome.i18n API 获取浏览器 UI 语言
  if (runtime && runtime.i18n) {
    const uiLang = runtime.i18n.getUILanguage();
    const langCode = uiLang.split('-')[0];
    if (supportedLangs.includes(langCode)) {
      return langCode;
    }
  }

  // 回退：使用 navigator.language
  const navLang = navigator.language.split('-')[0];
  if (supportedLangs.includes(navLang)) {
    return navLang;
  }

  return 'en';
}

// 获取运行时 API - 必须在任何函数之前定义
function getRuntime() {
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser.runtime;
  }
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome.runtime;
  }
  console.error('[Settings] Runtime API not available');
  return null;
}

function getTabs() {
  if (typeof browser !== 'undefined' && browser.tabs) {
    return browser.tabs;
  }
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    return chrome.tabs;
  }
  return null;
}

// 获取 storage API
function getStorage() {
  if (typeof browser !== 'undefined' && browser.storage) {
    return browser.storage;
  }
  if (typeof chrome !== 'undefined' && chrome.storage) {
    return chrome.storage;
  }
  console.error('[Settings] Storage API not available');
  return null;
}

/**
 * 获取翻译文本（占位符 {name}）
 *
 * 文案的唯一来源是 _locales/<lang>/messages.json：
 * 构建时由 build.js 打包成 locales.js（window.__LOCALES__），
 * 页面脚本里不再维护第二份翻译表 —— 那正是过去最难同步的重复。
 */
function t(key, replacements = {}) {
  const locales = window.__LOCALES__ || {};
  const table = locales[currentLanguage] || locales.en || {};
  let text = table[key] || (locales.en && locales.en[key]) || key;

  Object.keys(replacements).forEach((placeholder) => {
    text = text.split('{' + placeholder + '}').join(String(replacements[placeholder]));
  });

  return text;
}

/**
 * 用 i18n-manager 的语言表填充语言下拉框。
 * 之前语言列表写死在 HTML 里，加一种语言就要改两处。
 */
function populateLanguageSelect() {
  const select = document.getElementById('languageSelect');
  if (!select || select.options.length > 0) return;

  const catalog = window.I18nLanguages || {};
  const locales = window.__LOCALES__ || {};
  const codes = Object.keys(catalog).length ? Object.keys(catalog) : Object.keys(locales);
  const languages = codes.map((code) => ({ code, name: (catalog[code] && catalog[code].name) || code }));

  languages.forEach(({ code, name }) => {
    const option = document.createElement('option');
    option.value = code;
    option.textContent = name;
    select.appendChild(option);
  });
}

/**
 * 加载语言设置
 */
async function loadLanguageSetting() {
  populateLanguageSelect();
  return new Promise((resolve) => {
    const storage = getStorage();
    if (!storage) {
      console.warn('[Settings] Storage not available');
      currentLanguage = detectBrowserLanguage();
      resolve(currentLanguage);
      return;
    }
    storage.local.get([LANGUAGE_STORAGE_KEY], (result) => {
      currentLanguage = result[LANGUAGE_STORAGE_KEY] || detectBrowserLanguage();

      // 设置下拉框
      const langSelect = document.getElementById('languageSelect');
      if (langSelect) {
        langSelect.value = currentLanguage;
      }

      // 文案来自构建期打包的 locales.js，无需异步加载
      resolve(currentLanguage);
    });
  });
}

/**
 * 保存语言设置
 */
async function saveLanguageSetting() {
  const langSelect = document.getElementById('languageSelect');
  if (!langSelect) return;

  const newLang = langSelect.value;
  if (newLang === currentLanguage) {
    showToast(t('saved'));
    return;
  }

  const storage = getStorage();
  if (!storage) {
    console.error('[Settings] Cannot save: storage not available');
    return;
  }

  await new Promise((resolve) => {
    storage.local.set({ [LANGUAGE_STORAGE_KEY]: newLang }, resolve);
  });

  currentLanguage = newLang;
  applyTranslations();
  // 授权卡片的文案由 updateLicenseStatus() 动态设置，不走 data-i18n，需单独刷新
  updateLicenseStatus();
  showToast(t('saved'));
}

/**
 * 应用翻译到页面
 */
function applyTranslations() {
  // 所有文案统一走 data-i18n，不再按下标 / 父元素猜测定位
  // （旧实现插一张卡片就会整体串位）
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });

  document.querySelectorAll('[data-i18n-title]').forEach((el) => {
    const key = el.getAttribute('data-i18n-title');
    if (key) el.title = t(key);
  });

  // 页面标题与副标题
  document.title = t('settingsTitle');
  const subtitle = document.querySelector('.page .subtitle') || document.querySelector('.subtitle');
  if (subtitle) subtitle.textContent = t('settingsSubtitle');

  // 动态文案：套餐卡、计数、模式列
  updateLicenseStatus();
}
/**
 * 发送消息到 background
 */
async function sendMessage(type, data = {}) {
  return new Promise((resolve) => {
    const rt = getRuntime();
    if (!rt) {
      console.error('[Settings] Runtime not available');
      resolve({ success: false, error: 'Runtime not available' });
      return;
    }
    // 超时保护：5 秒内未响应则 resolve(null)，避免 background 卡死时整个 settings 瘫痪
    const timer = setTimeout(() => {
      console.warn('[Settings] sendMessage timeout:', type);
      resolve(null);
    }, 5000);
    try {
      rt.sendMessage({ type, ...data }, (response) => {
        clearTimeout(timer);
        if (rt.lastError) {
          console.error('[Settings] Message error:', rt.lastError);
          resolve({ success: false, error: rt.lastError.message });
          return;
        }
        resolve(response);
      });
    } catch (e) {
      clearTimeout(timer);
      console.warn('[Settings] sendMessage threw:', type, e);
      resolve(null);
    }
  });
}

// ===== Entitlement 辅助函数 =====
//
// 与 popup 同样的快慢双路径设计：
//   · loadCachedEntitlements() —— 读 background 的 storage.local 快照，毫秒级
//   · refreshEntitlements()    —— 走原生 App Group 拉最新值，慢但精确
// 页面渲染一律用快照，绝不因为原生慢而让列表空着。

/**
 * 快路径：从 background 读取权限快照。不触发任何原生调用。
 */
async function loadCachedEntitlements() {
  try {
    const resp = await sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS);
    if (resp && resp.success) {
      _entitlementState = {
        entitlements: resp.entitlements || [],
        isLimitEnforced: !!resp.isLimitEnforced,
        storageAvailable: typeof resp.storageAvailable === 'boolean' ? resp.storageAvailable : null,
        pendingAction: resp.pendingAction || null,
        notice: resp.notice || null,
      };
    }
  } catch (e) {
    console.warn('[Settings] loadCachedEntitlements failed', e);
  }
  return _entitlementState;
}

/**
 * 慢路径：让 background 走原生 App Group 拉最新权限。
 * @returns {Promise<boolean>} 权限状态是否发生了变化
 */
async function refreshEntitlements() {
  try {
    const before = JSON.stringify(_entitlementState.entitlements);
    const resp = await sendMessage(MESSAGE_TYPES.REFRESH_ENTITLEMENTS);
    if (resp && resp.success) {
      _entitlementState = {
        entitlements: resp.entitlements || [],
        isLimitEnforced: !!resp.isLimitEnforced,
        storageAvailable: typeof resp.storageAvailable === 'boolean' ? resp.storageAvailable : null,
        pendingAction: resp.pendingAction || null,
        notice: resp.notice || null,
      };
      const after = JSON.stringify(_entitlementState.entitlements);
      console.log('[Settings] 权限刷新:', before, '->', after);
      return before !== after;
    }
    console.warn('[Settings] 权限刷新失败（原生无响应），继续用快照:', before);
  } catch (e) {
    console.warn('[Settings] refreshEntitlements failed', e);
  }
  return false;
}

/**
 * 更新授权卡片。
 *
 * Chrome/Firefox 无付费概念 → 整卡隐藏。
 * Safari Free            → 显示免费额度 + 升级入口。
 * Safari Pro             → 隐藏购买入口（不再显示 Buy CTA），只显示 PRO 徽章。
 */
function updateLicenseStatus(siteCount) {
  const mode = getLicenseMode();
  const card = document.getElementById('licenseCard');
  const status = document.getElementById('licenseStatus');
  const btn = document.getElementById('manageLicenseBtn');
  const planNote = document.getElementById('planNote');

  const count = typeof siteCount === 'number'
    ? siteCount
    : document.querySelectorAll('#siteList .nl-list-item').length;

  const badge = document.getElementById('planBadge');
  if (badge) {
    badge.hidden = mode !== LICENSE_MODES.PRO;
    badge.textContent = t('proBadge');
  }

  const countEl = document.getElementById('siteCount');
  if (countEl) countEl.textContent = formatSiteCount(count);

  // App Group 不可用：明确告知，而不是假装免费版 / 假装 Pro
  const storageBroken = _entitlementState.isLimitEnforced && _entitlementState.storageAvailable === false;
  if (storageBroken) {
    if (card) card.hidden = false;
    if (status) status.textContent = t('purchaseUnavailable');
    if (btn) btn.hidden = true;
    return;
  }

  // Chrome/Firefox：整卡隐藏（plan Task D6）
  if (mode === LICENSE_MODES.UNRESTRICTED) {
    if (card) card.hidden = true;
    return;
  }

  if (card) card.hidden = false;
  if (!status || !btn) return;
  if (btn) btn.hidden = false;

  if (mode === LICENSE_MODES.FREE) {
    status.textContent = t('planFreeDetail', {
      count,
      limit: APP_LIMITS.FREE_SITE_LIMIT,
    });
    const freeLabel = btn.querySelector('span');
    if (freeLabel) freeLabel.textContent = t('licenseUpgrade');
    // 升级按钮是付费版的主 CTA（琥珀强调）；Pro 用户则降级为普通按钮
    btn.className = 'nl-btn nl-btn-accent';
    if (planNote) planNote.hidden = false;
  } else {
    // Pro：只说明已解锁 + 管理购买，绝不再出现 Buy CTA
    status.textContent = t('planProDetail');
    const proLabel = btn.querySelector('span');
    if (proLabel) proLabel.textContent = t('managePurchases');
    btn.className = 'nl-btn';
    if (planNote) planNote.hidden = true;
  }
}

/**
 * 展示 Background 留下的一次性提示（购买完成后补做了待办），然后确认清除。
 * 不依赖页面存活：下次打开设置页仍会看到。
 */
async function showEntitlementNotice() {
  const notice = _entitlementState.notice;
  if (!notice || notice.type !== 'pendingSiteAdded') return;

  showToast(t('noticeSiteEnabled', { domain: notice.domain }));
  _entitlementState.notice = null;
  await sendMessage(MESSAGE_TYPES.ACK_ENTITLEMENT_NOTICE);
  await loadSiteList();
}

/**
 * 当前授权模式（UI 只认这一个判断）
 * @returns {'unrestricted'|'free'|'pro'}
 */
function getLicenseMode() {
  return getLicenseModeFor(_entitlementState);
}

/**
 * 当前是否不受网站数量限制（Chrome/Firefox 恒为 true，Safari 仅 Pro 为 true）
 */
function hasUnlimitedSites() {
  return getLicenseMode() !== LICENSE_MODES.FREE;
}

/**
 * 格式化网站计数：Free 显示 count/3，其余只显示数量（不显示 ∞）
 */
function formatSiteCount(count) {
  if (getLicenseMode() === LICENSE_MODES.FREE) return `${count}/${APP_LIMITS.FREE_SITE_LIMIT}`;
  return String(count);
}

/**
 * 显示升级弹窗。
 * 结构与交互由 shared-ui.js（shared/upgrade-dialog.js）提供 —— 只有一份实现。
 * @returns {Promise<boolean>} true=用户点击 Upgrade
 */
function openUpgradeDialog() {
  return showUpgradeDialog({ t, price: _entitlementState.price || null });
}

/**
 * 唤起 Host App，由用户在那边完成 StoreKit 付款。
 *
 * 扩展进程无法弹出系统付款面板，所以这里拿不到"购买成功"的结果。
 * 购买完成后回到设置页刷新，loadSiteList() 会从 App Group 读到新权限。
 *
 * @returns {Promise<boolean>} Host App 是否成功被唤起
 */
async function requestUpgrade() {
  console.log('[Settings] requestUpgrade: 唤起 Host App 完成 StoreKit 购买');

  const resp = await sendMessage(MESSAGE_TYPES.REQUEST_PURCHASE);
  console.log('[Settings] REQUEST_PURCHASE response:', JSON.stringify(resp));
  if (resp && resp.success) {
    showToast(t('openingHostApp'));
    return true;
  }

  // 兜底：原生唤起没成功，试 URL scheme
  console.warn('[Settings] 原生唤起失败，尝试 URL scheme 兜底');
  try {
    const a = document.createElement('a');
    a.href = 'imagelazyloadblocker://upgrade';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast(t('openingHostApp'));
    return true;
  } catch (e) {
    console.warn('[Settings] URL scheme 兜底也失败', e);
  }

  showToast(t('upgradeOpenFailed'));
  return false;
}

/**
 * 显示 Toast 提示
 */
function showToast(message, options = {}) {
  const existing = document.querySelector('.nl-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'nl-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  // 删除网站用"撤销"而不是模态确认（plan Task D2）
  if (options.action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nl-link-btn';
    btn.style.color = 'inherit';
    btn.textContent = options.action.label;
    btn.addEventListener('click', () => {
      options.action.onClick();
      toast.remove();
    });
    toast.append(' ', btn);
  }

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), options.action ? 5000 : (options.duration || 2000));
}


/**
 * 加载并显示网站列表
 *
 * 每行：域名 + 当前模式 + 移除按钮。
 * 删除是即时 + Undo（plan Task D2），不再弹模态确认。
 */
async function loadSiteList() {
  const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const configs = (response && response.success && response.data) || {};

  const siteList = document.getElementById('siteList');
  const emptyState = document.getElementById('emptyState');
  const count = Object.keys(configs).length;

  if (!siteList || !emptyState) {
    updateLicenseStatus(count);
    return;
  }

  siteList.innerHTML = '';

  if (count === 0) {
    emptyState.hidden = false;
  } else {
    emptyState.hidden = true;

    const entries = Object.entries(configs)
      .sort((a, b) => (b[1].addedAt || 0) - (a[1].addedAt || 0));

    const modeOf = (config) => (config.scrollFallback === true
      ? t('compatibilityMode')
      : t('standardMode'));

    entries.forEach(([domain, config]) => {
      const item = document.createElement('div');
      item.className = 'nl-list-item';

      const domainSpan = document.createElement('span');
      domainSpan.className = 'nl-domain';
      domainSpan.title = domain;
      domainSpan.textContent = domain;

      const modeSpan = document.createElement('span');
      modeSpan.className = 'nl-mode';
      modeSpan.textContent = modeOf(config);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'nl-icon-btn';
      removeBtn.dataset.domain = domain;
      removeBtn.title = t('removeSite');
      removeBtn.setAttribute('aria-label', t('removeSite') + ' ' + domain);
      // 图标用 SVG，不用文本符号
      removeBtn.innerHTML = '<svg class="nl-icon nl-icon-sm" aria-hidden="true"><use href="#i-minus"></use></svg>';

      item.append(domainSpan, modeSpan, removeBtn);
      siteList.appendChild(item);
    });

    siteList.querySelectorAll('.nl-icon-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const domain = e.currentTarget.dataset.domain;
        const removedConfig = configs[domain];

        await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain });
        showToast(t('deleted'), {
          action: {
            label: t('undo'),
            onClick: async () => {
              await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
                domain,
                strategy: (removedConfig && removedConfig.strategy) || STRATEGIES.TECH_BLOCK,
                scrollFallback: !!(removedConfig && removedConfig.scrollFallback === true),
              });
              loadSiteList();
            },
          },
        });
        loadSiteList();
      });
    });
  }

  // 渲染完再刷新计数与套餐文案（顺序反了会显示上一次的数量）
  updateLicenseStatus(count);

  // 免费版额度用满时，列表卡内直接给升级入口
  const upgradeBox = document.getElementById('siteListUpgrade');
  const upgradeBtn = document.getElementById('siteListUpgradeBtn');
  if (upgradeBox && upgradeBtn) {
    const full = getLicenseMode() === LICENSE_MODES.FREE && count >= APP_LIMITS.FREE_SITE_LIMIT;
    upgradeBox.hidden = !full;
    const label = upgradeBtn.querySelector('span');
    if (label) label.textContent = t('licenseUpgrade');
  }
}
/**
 * 加载全局设置
 */
async function loadGlobalSettings() {
  const response = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);
  const config = response?.data || {};

  const globalConfig = { ...DEFAULT_CONFIG, ...config };

  document.getElementById('showInterceptionToast').checked = globalConfig.showInterceptionToast === true;
  document.getElementById('fallbackToScroll').checked = globalConfig.fallbackToScroll;
  // 内部存储用毫秒，界面用秒（plan Task D4）
  document.getElementById('scrollSpeed').value = (globalConfig.scrollSpeed / 1000).toFixed(1);
  document.getElementById('stayDuration').value = (globalConfig.stayDuration / 1000).toFixed(1);
  document.getElementById('returnToTop').checked = globalConfig.returnToTop;
}

/** 秒 → 毫秒（带范围保护），界面用秒、存储仍是毫秒 */
function secondsToMs(value, fallbackMs) {
  const seconds = parseFloat(value);
  if (!Number.isFinite(seconds) || seconds < 0) return fallbackMs;
  return Math.round(seconds * 1000);
}

/**
 * 保存全局设置
 */
async function saveGlobalSettings() {
  const config = {
    showInterceptionToast: document.getElementById('showInterceptionToast').checked,
    fallbackToScroll: document.getElementById('fallbackToScroll').checked,
    // 界面是秒，存储仍是毫秒（其它端按毫秒读取）
    scrollSpeed: secondsToMs(document.getElementById('scrollSpeed').value, 800),
    stayDuration: secondsToMs(document.getElementById('stayDuration').value, 2000),
    returnToTop: document.getElementById('returnToTop').checked
  };

  await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, { config });
  showToast(t('saved'));
}

/**
 * 加载自定义属性配置
 */
async function loadCustomAttributes() {
  const response = await sendMessage(MESSAGE_TYPES.GET_CUSTOM_ATTRIBUTES);
  console.log('[Settings] loadCustomAttributes response:', response);

  // 使用默认值或从存储加载的值
  const lazyAttributes = response?.data?.lazyAttributes || DEFAULT_LAZY_ATTRIBUTES;
  const placeholderPatterns = response?.data?.placeholderPatterns || DEFAULT_PLACEHOLDER_PATTERNS;

  const lazyInput = document.getElementById('lazyAttributesInput');
  const placeholderInput = document.getElementById('placeholderPatternsInput');

  if (lazyInput) {
    lazyInput.value = lazyAttributes.join(', ');
  }
  if (placeholderInput) {
    placeholderInput.value = placeholderPatterns.join(', ');
  }
}

/**
 * 保存自定义属性配置
 */
async function saveCustomAttributes() {
  const lazyInput = document.getElementById('lazyAttributesInput');
  const placeholderInput = document.getElementById('placeholderPatternsInput');

  if (!lazyInput || !placeholderInput) return;

  // 解析输入（按逗号分割，去除空白）
  const lazyAttributes = lazyInput.value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  const placeholderPatterns = placeholderInput.value
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  await sendMessage(MESSAGE_TYPES.SET_CUSTOM_ATTRIBUTES, {
    lazyAttributes,
    placeholderPatterns
  });

  showToast(t('attributesSaved'));
}

/**
 * 重置自定义属性配置为默认值
 */
async function resetCustomAttributes() {
  const response = await sendMessage(MESSAGE_TYPES.RESET_CUSTOM_ATTRIBUTES);
  if (response?.success && response.data) {
    const { lazyAttributes, placeholderPatterns } = response.data;

    const lazyInput = document.getElementById('lazyAttributesInput');
    const placeholderInput = document.getElementById('placeholderPatternsInput');

    if (lazyInput) {
      lazyInput.value = lazyAttributes.join(', ');
    }
    if (placeholderInput) {
      placeholderInput.value = placeholderPatterns.join(', ');
    }

    showToast(t('attributesReset'));
  }
}

/**
 * 导出配置
 */
async function exportConfig() {
  const configsResponse = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const globalResponse = await sendMessage(MESSAGE_TYPES.GET_GLOBAL_CONFIG);

  const exportData = {
    siteConfigs: configsResponse?.data || {},
    globalConfig: globalResponse?.data || {},
    exportDate: new Date().toISOString()
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `lazy-load-blocker-config-${new Date().toISOString().split('T')[0]}.json`;
  a.click();

  URL.revokeObjectURL(url);
  showToast(t('configExported'));
}

/**
 * 导入配置
 */
async function importConfig(file) {
  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (!data.siteConfigs || !data.globalConfig) {
      showToast(t('invalidConfig'));
      return;
    }

    // 导入网站配置（逐条检查限额，Safari Free 用户达上限时停止）
    // 每条都要完整保留 strategy 与 scrollFallback，否则导出→清空→导入会丢配置。
    // source:'import' 告诉 background 这不算"用户想启用当前网站"，不写购买待办。
    const entries = Object.entries(data.siteConfigs);
    const totalSites = entries.length;
    let added = 0;
    let limitReached = false;
    const seen = new Set();

    for (const [rawDomain, config] of entries) {
      // 与 background 完全一致的域名规范化（shared/domain.js 规则）
      const domain = normalizeHostname(rawDomain);
      if (!domain || seen.has(domain)) continue;
      seen.add(domain);

      const resp = await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: (config && config.strategy) || STRATEGIES.TECH_BLOCK,
        scrollFallback: config && config.scrollFallback === true,
        addedAt: config && config.addedAt,
        source: 'import'
      });
      if (resp && resp.success === false && resp.error === 'LIMIT_REACHED') {
        limitReached = true;
        break;
      }
      added++;
    }

    // 导入全局配置（即使网站导入被截断，全局配置仍可导入）
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });

    loadSiteList();
    loadGlobalSettings();
    showToast(limitReached
      ? t('importPartial', { added, total: totalSites })
      : t('configImported'));
  } catch (error) {
    showToast(t('importFailed') + error.message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 「作者的其他扩展」营销卡已从主界面移除（plan Task D7）：
  // 商店工具里不该让开发者工具宣传与产品操作抢注意力。
  // UA 嗅探（chrome-only）也随之删除。

  // 先加载语言设置
  await loadLanguageSetting();

  // 应用翻译
  applyTranslations();

  // 权限分两步：
  //   1) await 本地快照 —— 只读 storage，毫秒级
  //   2) 异步走原生刷新 —— 慢，绝不 await，失败也不影响页面可用性
  await loadCachedEntitlements();
  updateLicenseStatus();
  refreshEntitlements()
    .then(async (changed) => {
      if (changed) await loadSiteList();
      // 后台可能刚补做完购买前的待办（例如免费额度撞上限后完成购买）
      await showEntitlementNotice();
    })
    .catch(e => console.warn('[Settings] entitlement refresh error', e));

  // 加载数据
  await loadSiteList();
  await loadGlobalSettings();
  await loadCustomAttributes();

  // 绑定事件
  // 授权入口：先看清升级内容，再唤起 Host App（与 popup 行为一致）
  const manageLicenseBtn = document.getElementById('manageLicenseBtn');
  if (manageLicenseBtn) {
    manageLicenseBtn.addEventListener('click', async () => {
      if (getLicenseMode() === LICENSE_MODES.PRO) {
        // Pro 用户：「管理购买」直接去 Host App，不做推销弹窗
        requestUpgrade();
        return;
      }
      if (await openUpgradeDialog()) requestUpgrade();
    });
  }

  // 列表卡内的升级入口（免费额度用满时出现）
  const siteListUpgradeBtn = document.getElementById('siteListUpgradeBtn');
  if (siteListUpgradeBtn) {
    siteListUpgradeBtn.addEventListener('click', async () => {
      if (await openUpgradeDialog()) requestUpgrade();
    });
  }

  document.getElementById('saveGlobalBtn').addEventListener('click', saveGlobalSettings);
  document.getElementById('saveLangBtn').addEventListener('click', saveLanguageSetting);
  document.getElementById('exportBtn').addEventListener('click', exportConfig);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', (e) => {
    if (e.target.files?.[0]) {
      importConfig(e.target.files[0]);
      e.target.value = ''; // 重置
    }
  });

  // 绑定高级设置按钮事件
  const saveAttrsBtn = document.getElementById('saveAttrsBtn');
  const resetAttrsBtn = document.getElementById('resetAttrsBtn');
  if (saveAttrsBtn) {
    saveAttrsBtn.addEventListener('click', saveCustomAttributes);
  }
  if (resetAttrsBtn) {
    resetAttrsBtn.addEventListener('click', resetCustomAttributes);
  }
});
