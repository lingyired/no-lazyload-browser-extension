// popup.js
// 依赖 shared-ui.js（由 scripts/bundle-classic.js 从 shared/*.js 生成）：
//   STRATEGIES / MESSAGE_TYPES / APP_LIMITS / ENTITLEMENTS / LICENSE_MODES /
//   getLicenseModeFor / showUpgradeDialog / normalizeHostname

// 获取运行时 API
const runtime = typeof browser !== 'undefined'
  ? browser.runtime
  : chrome.runtime;

const tabs = typeof browser !== 'undefined'
  ? browser.tabs
  : chrome.tabs;

// 获取 storage API
const storage = typeof browser !== 'undefined' && browser.storage
  ? browser.storage
  : chrome.storage;

// 当前用户权限状态缓存（由 background GET_ENTITLEMENTS 填充）
let _entitlementState = {
  entitlements: [],
  isLimitEnforced: false,
  // 原生权限存储（App Group）是否可用：false 时权限状态不可信，必须显式提示
  storageAvailable: null,
  // 购买前被限额拦住、等待后台补做的动作（background 持久化）
  pendingAction: null,
  // 一次性提示：待办被补做 / 购买完成
  notice: null,
};

// 当前语言
let currentLanguage = 'zh';
const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  // 支持的语言列表以 i18n-manager.js 为唯一来源（_locales 下的语言目录）
  const supportedLangs = Object.keys(window.I18nLanguages || {});
  const runtime = typeof browser !== 'undefined' ? browser : chrome;

  // 优先使用 chrome.i18n API 获取浏览器 UI 语言
  if (runtime.i18n) {
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

// 翻译内容（内联，避免依赖 _locales 文件结构）


// ============================================================================
// 运行时逻辑
//
// 结构（plan Phase C）：
//   当前网站  →  一个开关 + 一个模式选择
//   已启用网站 →  计数 / PRO 徽章 / 列表
//   升级入口  →  仅 Safari 免费版可见
//   页脚      →  设置 / 刷新
// ============================================================================

let currentTab = null;
let currentDomain = '';
/** 当前网站在 storage 里的最新配置（null = 未启用） */
let currentSiteConfig = null;
/** 最近一次移除，用于 Undo */
let lastRemoved = null;

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

/** 加载语言设置 */
async function loadLanguageSetting() {
  return new Promise(function (resolve) {
    if (!storage) {
      currentLanguage = detectBrowserLanguage();
      resolve(currentLanguage);
      return;
    }
    storage.local.get([LANGUAGE_STORAGE_KEY], function (result) {
      currentLanguage = result[LANGUAGE_STORAGE_KEY] || detectBrowserLanguage();
      resolve(currentLanguage);
    });
  });
}

/** 应用静态翻译（data-i18n） */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(function (el) {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
}

/** 发送消息到 background */
async function sendMessage(type, data = {}) {
  return new Promise(function (resolve) {
    // 超时保护：5 秒内未响应则 resolve(null)，避免 background 卡死时整个 popup 瘫痪
    const timer = setTimeout(function () {
      console.warn('[Popup] sendMessage timeout:', type);
      resolve(null);
    }, 5000);
    try {
      runtime.sendMessage(Object.assign({ type: type }, data), function (response) {
        clearTimeout(timer);
        resolve(response);
      });
    } catch (e) {
      clearTimeout(timer);
      console.warn('[Popup] sendMessage threw:', type, e);
      resolve(null);
    }
  });
}

// ===== Entitlement 辅助函数 =====
//
// 权限读取刻意拆成快慢两条路径，避免原生调用拖慢 UI：
//   · loadCachedEntitlements() —— 读 background 的 storage.local 快照，毫秒级
//   · refreshEntitlements()    —— 走原生 App Group 拉最新值，慢但精确

function applyEntitlementResponse(resp) {
  _entitlementState = {
    entitlements: resp.entitlements || [],
    isLimitEnforced: !!resp.isLimitEnforced,
    storageAvailable: typeof resp.storageAvailable === 'boolean' ? resp.storageAvailable : null,
    pendingAction: resp.pendingAction || null,
    notice: resp.notice || null,
  };
}

/** 快路径：从 background 读取权限快照。不触发任何原生调用。 */
async function loadCachedEntitlements() {
  try {
    const resp = await sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS);
    if (resp && resp.success) applyEntitlementResponse(resp);
  } catch (e) {
    console.warn('[Popup] loadCachedEntitlements failed', e);
  }
  return _entitlementState;
}

/**
 * 慢路径：让 background 走原生 App Group 拉一次最新权限。
 * @returns {Promise<boolean>} 权限状态是否发生了变化
 */
async function refreshEntitlements() {
  try {
    const before = JSON.stringify(_entitlementState.entitlements);
    const resp = await sendMessage(MESSAGE_TYPES.REFRESH_ENTITLEMENTS);
    if (resp && resp.success) {
      applyEntitlementResponse(resp);
      return before !== JSON.stringify(_entitlementState.entitlements);
    }
    console.warn('[Popup] 权限刷新失败（原生无响应），继续用快照:', before);
  } catch (e) {
    console.warn('[Popup] refreshEntitlements failed', e);
  }
  return false;
}

/**
 * 展示 Background 留下的一次性提示（购买完成 / 待办已补做），然后确认清除。
 * 提示不依赖 popup 存活 —— popup 被系统关掉也没关系，下次打开仍在 storage 里。
 */
async function showEntitlementNotice() {
  const notice = _entitlementState.notice;
  if (!notice || notice.type !== 'pendingSiteAdded') return;

  showToast(t('noticeSiteEnabled', { domain: notice.domain }));
  _entitlementState.notice = null;
  await sendMessage(MESSAGE_TYPES.ACK_ENTITLEMENT_NOTICE);
}

/**
 * 等待 Pro 权限生效（用户正在 Host App 里付款）。
 * 每 2 秒走一次原生刷新，最多等 90 秒。
 */
async function waitForUnlimitedSites(timeoutMs = 90000, intervalMs = 2000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    await refreshEntitlements();
    if (hasUnlimitedSites()) return true;
    await new Promise(function (resolve) { setTimeout(resolve, intervalMs); });
  }
  return false;
}

// ===== 授权模式 =====

/**
 * 当前授权模式（UI 只认这一个判断）。
 * 实现来自 shared/constants.js 的 getLicenseMode()，这里只是绑定当前状态。
 * @returns {'unrestricted'|'free'|'pro'}
 */
function getLicenseMode() {
  return getLicenseModeFor(_entitlementState);
}

/** 是否不受网站数量限制（Chrome/Firefox 恒真，Safari 仅 Pro 为真） */
function hasUnlimitedSites() {
  return getLicenseMode() !== LICENSE_MODES.FREE;
}

/** Free 显示 count/3，其余只显示数量（不显示 ∞） */
function formatSiteCount(count) {
  if (getLicenseMode() === LICENSE_MODES.FREE) return count + '/' + APP_LIMITS.FREE_SITE_LIMIT;
  return String(count);
}

/**
 * 渲染授权相关区域。
 *
 * Chrome/Firefox   → 完全没有付费 UI
 * Safari Free      → 计数 count/3 + 升级入口
 * Safari Pro       → 只显示 PRO 徽章，不出现任何购买 CTA
 * 权限存储不可用   → 明确提示，不假装免费版
 */
function updateLicenseUI(siteCount) {
  const mode = getLicenseMode();
  const storageBroken = _entitlementState.isLimitEnforced && _entitlementState.storageAvailable === false;

  const badge = document.getElementById('planBadge');
  const countEl = document.getElementById('siteCount');
  const upgradeGroup = document.getElementById('upgradeGroup');
  const manageBtn = document.getElementById('manageLicense');
  const upgradeNote = document.getElementById('upgradeNote');
  const notice = document.getElementById('licenseNotice');

  if (badge) badge.hidden = mode !== LICENSE_MODES.PRO;
  if (countEl) countEl.textContent = formatSiteCount(siteCount);

  if (storageBroken) {
    if (upgradeGroup) upgradeGroup.hidden = true;
    if (notice) {
      notice.hidden = false;
      const label = notice.querySelector('span');
      if (label) label.textContent = t('purchaseUnavailable');
    }
    return;
  }

  if (notice) notice.hidden = true;

  if (mode === LICENSE_MODES.FREE) {
    if (upgradeGroup) upgradeGroup.hidden = false;
    const manageLabel = manageBtn && manageBtn.querySelector('span');
    if (manageLabel) manageLabel.textContent = t('licenseUpgrade');
    if (upgradeNote) upgradeNote.textContent = t('upgradeNote');
  } else if (upgradeGroup) {
    upgradeGroup.hidden = true;
  }
}

// ===== 升级弹窗 =====
//
// 结构由 shared-ui.js（shared/upgrade-dialog.js）提供，只有一份实现。
// 这里只负责把 t() 与真实价格传进去。

function openUpgradeDialog() {
  return showUpgradeDialog({ t, price: _entitlementState.price || null });
}

/**
 * 唤起 Host App 完成 StoreKit 付款。
 *
 * 扩展进程无法弹出系统付款面板，所以这里只能"打开 App"。
 * 购买结果由 background 通过 App Group 读取，并在下次刷新时补做待办。
 */
async function requestUpgrade() {
  const resp = await sendMessage(MESSAGE_TYPES.REQUEST_PURCHASE);
  if (resp && resp.success) {
    showToast(t('openingHostApp'));
    return true;
  }

  // 兜底：原生唤起没成功，试 URL scheme
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
    console.warn('[Popup] URL scheme 兜底也失败', e);
  }

  showToast(t('upgradeOpenFailed'));
  return false;
}

// ===== Toast =====

function showToast(message, action) {
  const existing = document.querySelector('.nl-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'nl-toast';
  toast.setAttribute('role', 'status');
  toast.textContent = message;

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nl-link-btn';
    btn.style.color = 'inherit';
    btn.textContent = action.label;
    btn.addEventListener('click', function () {
      action.onClick();
      toast.remove();
    });
    toast.append(' ', btn);
  }

  document.body.appendChild(toast);
  setTimeout(function () { toast.remove(); }, action ? 5000 : 2200);
}

// ===== 当前网站 =====

/** 取当前标签页的规范化域名（与 background 的匹配规则完全一致） */
async function getCurrentDomain() {
  const [tab] = await tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (!tab || !tab.url) return null;

  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return normalizeHostname(url.hostname);
  } catch (e) {
    return null;
  }
}

function setSwitchState({ checked, disabled, busy }) {
  const el = document.getElementById('siteSwitch');
  if (!el) return;
  el.setAttribute('aria-checked', checked ? 'true' : 'false');
  el.disabled = !!disabled;
  el.dataset.busy = busy ? 'true' : 'false';
  el.setAttribute('aria-label', checked ? t('removeSite') : t('addCurrentSite'));
}

function updateModeHelp(mode) {
  const help = document.getElementById('modeHelp');
  if (!help) return;
  if (!currentDomain) {
    help.textContent = '';
    return;
  }
  help.textContent = mode === STRATEGIES.SCROLL_FALLBACK
    ? t('compatibilityModeHelp')
    : t('standardModeHelp');
}

/** 读取当前网站状态并渲染 */
async function checkCurrentSite() {
  const domainEl = document.getElementById('currentDomain');
  const switchEl = document.getElementById('siteSwitch');
  const modeSelect = document.getElementById('modeSelect');
  const siteHelp = document.getElementById('siteHelp');

  currentDomain = await getCurrentDomain();

  if (!currentDomain) {
    if (domainEl) domainEl.textContent = t('nonWebPage');
    if (siteHelp) siteHelp.textContent = t('notAvailable');
    setSwitchState({ checked: false, disabled: true, busy: false });
    if (modeSelect) modeSelect.disabled = true;
    updateModeHelp(STRATEGIES.TECH_BLOCK);
    currentSiteConfig = null;
    return;
  }

  const configs = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const siteConfigs = (configs && configs.data) || {};
  // 兼容 background 迁移尚未跑完时的遗留 www. 键
  currentSiteConfig = siteConfigs[currentDomain] || siteConfigs['www.' + currentDomain] || null;

  const isEnabled = !!currentSiteConfig;
  const mode = (currentSiteConfig && currentSiteConfig.scrollFallback === true)
    ? STRATEGIES.SCROLL_FALLBACK
    : ((currentSiteConfig && currentSiteConfig.strategy) || STRATEGIES.TECH_BLOCK);

  if (domainEl) domainEl.textContent = currentDomain;
  if (siteHelp) siteHelp.textContent = t('siteSwitchHelp');
  setSwitchState({ checked: isEnabled, disabled: false, busy: false });

  if (modeSelect) {
    modeSelect.disabled = !isEnabled;
    modeSelect.value = mode;
  }
  updateModeHelp(isEnabled ? mode : STRATEGIES.TECH_BLOCK);

  if (switchEl && !switchEl.dataset.bound) {
    switchEl.dataset.bound = '1';
    switchEl.addEventListener('click', onSwitchClick);
  }
}

/**
 * 开关点击：只有在权限确认之后才真正切到 ON（plan Task C1）。
 */
async function onSwitchClick() {
  const switchEl = document.getElementById('siteSwitch');
  if (!switchEl || !currentDomain || switchEl.disabled) return;

  const wantOn = switchEl.getAttribute('aria-checked') !== 'true';
  setSwitchState({ checked: false, disabled: true, busy: true });

  if (wantOn) {
    const modeSelect = document.getElementById('modeSelect');
    const scrollFallback = !!modeSelect && modeSelect.value === STRATEGIES.SCROLL_FALLBACK;
    const resp = await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
      domain: currentDomain,
      strategy: scrollFallback ? STRATEGIES.SCROLL_FALLBACK : STRATEGIES.TECH_BLOCK,
      scrollFallback: scrollFallback,
    });

    if (resp && resp.success === false && resp.error === 'LIMIT_REACHED') {
      // 免费额度用完：先问用户要不要升级，绝不先切到 ON 再回滚
      setSwitchState({ checked: false, disabled: false, busy: false });
      await handleLimitReached();
      return;
    }

    if (resp && resp.success) {
      showToast(scrollFallback
        ? t('siteAddedWithScroll', { domain: currentDomain })
        : t('siteAdded', { domain: currentDomain }));
    }
  } else {
    const removedDomain = currentDomain;
    const removedConfig = currentSiteConfig;
    await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain: removedDomain });
    showToast(t('siteRemoved', { domain: removedDomain }), {
      label: t('undo'),
      onClick: async function () {
        await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
          domain: removedDomain,
          strategy: (removedConfig && removedConfig.strategy) || STRATEGIES.TECH_BLOCK,
          scrollFallback: !!(removedConfig && removedConfig.scrollFallback === true),
        });
        await checkCurrentSite();
        await loadSiteList();
      },
    });
  }

  await checkCurrentSite();
  await loadSiteList();
}

/**
 * 免费额度用完的流程。
 * 待办已由 background 持久化，popup 被关掉也不会丢。
 */
async function handleLimitReached() {
  const wantUpgrade = await openUpgradeDialog();
  if (!wantUpgrade) return;

  const sent = await requestUpgrade();
  if (!sent) return;

  await waitForUnlimitedSites();
  await showEntitlementNotice();
  await checkCurrentSite();
  await loadSiteList();
}

// ===== 网站列表 =====

async function loadSiteList() {
  const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const configs = (response && response.data) || {};

  const siteList = document.getElementById('siteList');
  const emptyState = document.getElementById('emptyState');
  const count = Object.keys(configs).length;

  updateLicenseUI(count);

  if (!siteList || !emptyState) return;
  siteList.innerHTML = '';

  if (count === 0) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;

  const entries = Object.entries(configs)
    .sort(function (a, b) { return (b[1].addedAt || 0) - (a[1].addedAt || 0); });

  entries.forEach(function (entry) {
    const domain = entry[0];
    const config = entry[1];

    const item = document.createElement('div');
    item.className = 'nl-list-item';

    const domainSpan = document.createElement('span');
    domainSpan.className = 'nl-domain';
    domainSpan.title = domain;
    domainSpan.textContent = domain;

    // 只显示"标准 / 兼容"，不暴露 IntersectionObserver、data-src 这类实现细节
    const modeSpan = document.createElement('span');
    modeSpan.className = 'nl-mode';
    modeSpan.textContent = config.scrollFallback === true
      ? t('compatibilityMode')
      : t('standardMode');

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'nl-icon-btn';
    removeBtn.dataset.domain = domain;
    removeBtn.title = t('removeSite');
    removeBtn.setAttribute('aria-label', t('removeSite') + ' ' + domain);
    // 图标用 SVG，不用文本符号（ui-ux-pro-max：禁止 emoji/字形当图标）
    removeBtn.innerHTML = '<svg class="nl-icon nl-icon-sm" aria-hidden="true"><use href="#i-minus"></use></svg>';

    item.append(domainSpan, modeSpan, removeBtn);
    siteList.appendChild(item);
  });

  siteList.querySelectorAll('.nl-icon-btn').forEach(function (btn) {
    btn.addEventListener('click', async function (e) {
      const domain = e.currentTarget.dataset.domain;
      const removedConfig = configs[domain];
      await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain: domain });
      // 轻一点：即时删除 + Undo，不用模态确认（plan Task D2）
      showToast(t('siteDeleted', { domain: domain }), {
        label: t('undo'),
        onClick: async function () {
          await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
            domain: domain,
            strategy: (removedConfig && removedConfig.strategy) || STRATEGIES.TECH_BLOCK,
            scrollFallback: !!(removedConfig && removedConfig.scrollFallback === true),
          });
          await loadSiteList();
          await checkCurrentSite();
        },
      });
      await loadSiteList();
      await checkCurrentSite();
    });
  });
}

// ===== 页脚动作 =====

function openSettings() {
  runtime.openOptionsPage();
}

async function refreshPage() {
  if (currentTab && currentTab.id) {
    await tabs.reload(currentTab.id);
    showToast(t('pageRefreshed'));
  }
}

// ===== 模式选择 =====

async function onModeChange(e) {
  if (!currentDomain || !currentSiteConfig) return;

  const mode = e.target.value;
  const scrollFallback = mode === STRATEGIES.SCROLL_FALLBACK;

  await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
    domain: currentDomain,
    strategy: scrollFallback ? STRATEGIES.SCROLL_FALLBACK : STRATEGIES.TECH_BLOCK,
    scrollFallback: scrollFallback,
  });

  updateModeHelp(mode);
  showToast(scrollFallback ? t('autoScrollEnabled') : t('autoScrollDisabled'));
  await checkCurrentSite();
  await loadSiteList();
}

// ===== 初始化 =====

document.addEventListener('DOMContentLoaded', async function () {
  await loadLanguageSetting();
  applyTranslations();

  // 权限分两步：先读快照（毫秒级）渲染，再异步走原生刷新
  await loadCachedEntitlements();

  const modeSelect = document.getElementById('modeSelect');
  if (modeSelect) modeSelect.addEventListener('change', onModeChange);

  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('refreshPage').addEventListener('click', refreshPage);

  const manageLicenseBtn = document.getElementById('manageLicense');
  if (manageLicenseBtn) {
    manageLicenseBtn.addEventListener('click', function () { handleLimitReached(); });
  }

  await checkCurrentSite();
  await loadSiteList();

  refreshEntitlements()
    .then(async function (changed) {
      if (changed) await loadSiteList();
      // 后台可能刚补做完购买前的待办，给用户一个明确反馈
      await showEntitlementNotice();
      await checkCurrentSite();
      await loadSiteList();
    })
    .catch(function (e) { console.warn('[Popup] entitlement refresh error', e); });
});
