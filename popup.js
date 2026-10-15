// popup.js with i18n support

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

// 消息类型（与 shared/constants.js 的 MESSAGE_TYPES 一致）
const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG',
  GET_CUSTOM_ATTRIBUTES: 'GET_CUSTOM_ATTRIBUTES',
  SET_CUSTOM_ATTRIBUTES: 'SET_CUSTOM_ATTRIBUTES',
  RESET_CUSTOM_ATTRIBUTES: 'RESET_CUSTOM_ATTRIBUTES'
};

// 策略常量
const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

// 当前语言
let currentLanguage = 'en';
const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  return window.NoLazyloadLanguage.detectBrowserLanguage(
    runtime, navigator.language, Object.keys(window.__LOCALES__ || {})
  );
}


// 当前标签页信息
let currentTab = null;
let currentDomain = '';

/**
 * 获取翻译文本
 */
/**
 * 取一条文案。
 *
 * 唯一翻译源是构建期注入的 window.__LOCALES__（由 locales.js 定义），
 * 内容取自 _locales/<lang>/messages.json。
 *
 * ⚠️ 不要再往页面里加内联翻译表。历史上 popup.js 与 settings/app.js
 * 各有一份 37 语言的内联表，两份独立演进，结果就是同一个模式在 popup 叫
 * 「自动滚动」、在设置页叫「兼容模式」—— 术语漂移的根因。
 */
function t(key, replacements = {}) {
  const locales = window.__LOCALES__ || {};
  const table = locales[currentLanguage] || locales['en'] || {};
  const raw = table[key];
  if (typeof raw !== 'string') return key;
  return raw.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(replacements, name)
      ? String(replacements[name])
      : match);
}

/**
 * 加载语言设置
 */
async function loadLanguageSetting() {
  return new Promise((resolve) => {
    if (!storage) {
      currentLanguage = detectBrowserLanguage();
      resolve(currentLanguage);
      return;
    }
    storage.local.get([LANGUAGE_STORAGE_KEY], (result) => {
      currentLanguage = window.NoLazyloadLanguage.resolveLanguage(
        result[LANGUAGE_STORAGE_KEY], Object.keys(window.__LOCALES__ || {})
      ) || detectBrowserLanguage();
      resolve(currentLanguage);
    });
  });
}

/**
 * 应用翻译到页面
 */
function applyTranslations() {
  window.NoLazyloadLanguage.applyDocumentLanguage(currentLanguage);
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });
}

/**
 * 发送消息到 background
 */
async function sendMessage(type, data = {}) {
  return new Promise((resolve) => {
    // 超时保护：5 秒内未响应则 resolve(null)，避免 background 卡死时整个 popup 瘫痪
    const timer = setTimeout(() => {
      console.warn('[Popup] sendMessage timeout:', type);
      resolve(null);
    }, 5000);
    try {
      runtime.sendMessage({ type, ...data }, (response) => {
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

// 网站计数 badge：显示已配置的网站总数。
function updateSiteCount(count) {
  const siteCount = document.getElementById('siteCount');
  if (siteCount) siteCount.textContent = String(count);
}

/**
 * 显示 Toast 提示
 */
function showToast(message) {
  const existingToast = document.querySelector('.toast');
  if (existingToast) {
    existingToast.remove();
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 2000);
}

/**
 * 获取当前标签页的域名
 */
async function getCurrentDomain() {
  const [tab] = await tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (!tab?.url) {
    return null;
  }

  try {
    const url = new URL(tab.url);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null;
    }
    return url.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

/**
 * 检查当前网站是否已配置
 */
async function checkCurrentSite() {
  currentDomain = await getCurrentDomain();

  const domainEl = document.getElementById('currentDomain');
  const statusEl = document.getElementById('currentStatus');
  const statusTextEl = document.getElementById('statusText');
  const toggleBtn = document.getElementById('toggleBtn');

  if (!currentDomain) {
    domainEl.textContent = t('nonWebPage');
    statusEl.className = 'site-status disabled';
    statusTextEl.textContent = t('notAvailable');
    toggleBtn.disabled = true;
    toggleBtn.textContent = t('cannotAdd');
    toggleBtn.className = 'toggle-btn';
    return;
  }

  domainEl.textContent = currentDomain;

  // 检查是否已配置
  const configs = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const siteConfigs = configs?.data || {};
  const siteConfig = siteConfigs[currentDomain];
  const isEnabled = !!siteConfig;

  // 更新滚动选项区域
  const scrollOption = document.getElementById('scrollOption');
  const scrollToggle = document.getElementById('currentScrollToggle');

  if (isEnabled) {
    const isScrollFallback = siteConfig.scrollFallback === true;
    statusEl.className = 'site-status enabled';
    statusEl.querySelector('.dot').textContent = isScrollFallback ? '↓' : '✓';
    statusTextEl.textContent = t('enabled');
    toggleBtn.textContent = t('removeCurrentSite');
    toggleBtn.className = 'toggle-btn remove';
    // 启用滚动选项
    scrollOption.classList.remove('disabled');
    scrollToggle.disabled = false;
    scrollToggle.checked = isScrollFallback;
  } else {
    statusEl.className = 'site-status disabled';
    statusEl.querySelector('.dot').textContent = '○';
    statusTextEl.textContent = t('disabled');
    toggleBtn.textContent = t('addCurrentSite');
    toggleBtn.className = 'toggle-btn add';
    // 禁用滚动选项
    scrollOption.classList.add('disabled');
    scrollToggle.disabled = true;
    scrollToggle.checked = false;
  }
}

/**
 * 切换当前网站的启用状态
 */
async function toggleCurrentSite() {
  if (!currentDomain) return;

  const configs = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const siteConfigs = configs?.data || {};
  const isEnabled = siteConfigs[currentDomain];

  if (isEnabled) {
    // 移除网站
    await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain: currentDomain });
    showToast(t('siteRemoved', { domain: currentDomain }));
  } else {
    // 添加网站，根据复选框决定是否使用自动滚动
    const scrollFallback = document.getElementById('currentScrollToggle').checked;
    const addSite = () => sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
      domain: currentDomain,
      strategy: STRATEGIES.TECH_BLOCK,
      scrollFallback
    });

    const addResp = await addSite();
    if (addResp && addResp.success === true) {
      showToast(scrollFallback ? t('siteAddedWithScroll', { domain: currentDomain }) : t('siteAdded', { domain: currentDomain }));
    }
  }

  // 刷新显示
  await checkCurrentSite();
  await loadSiteList();
}

/**
 * 加载网站列表
 */
async function loadSiteList() {
  const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
  const configs = response?.data || {};

  const siteList = document.getElementById('siteList');

  // 计数 badge：已配置的网站总数
  const count = Object.keys(configs).length;
  updateSiteCount(count);

  // 清空列表
  siteList.innerHTML = '';

  if (count === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'empty-state';
    emptyDiv.textContent = t('noSites');
    siteList.appendChild(emptyDiv);
    return;
  }

  // 按添加时间排序（最新的在前）
  const entries = Object.entries(configs)
    .sort((a, b) => (b[1].addedAt || 0) - (a[1].addedAt || 0));

  entries.forEach(([domain, config]) => {
    const item = document.createElement('div');
    item.className = 'site-item';

    const isScrollEnabled = config.scrollFallback === true;

    const domainSpan = document.createElement('span');
    domainSpan.className = 'domain';
    domainSpan.title = domain;
    domainSpan.dir = 'ltr';
    domainSpan.textContent = domain;

    const scrollLabel = document.createElement('label');
    scrollLabel.className = 'scroll-toggle';
    scrollLabel.title = t('compatibilityModeHelp');
    const scrollCheckbox = document.createElement('input');
    scrollCheckbox.type = 'checkbox';
    scrollCheckbox.dataset.domain = domain;
    if (isScrollEnabled) scrollCheckbox.checked = true;
    const scrollText = document.createElement('span');
    scrollText.textContent = t('compatibilityMode');
    scrollLabel.append(scrollCheckbox, scrollText);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.domain = domain;
    deleteBtn.title = t('delete');
    deleteBtn.textContent = '×';

    item.append(domainSpan, scrollLabel, deleteBtn);

    siteList.appendChild(item);
  });

  // 绑定滚动兜底复选框事件
  siteList.querySelectorAll('.scroll-toggle input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', async (e) => {
      const domain = e.target.dataset.domain;
      const scrollFallback = e.target.checked;

      // 获取当前配置
      const config = configs[domain];
      if (config) {
        await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
          domain,
          strategy: config.strategy || STRATEGIES.TECH_BLOCK,
          scrollFallback
        });
        showToast(scrollFallback ? t('compatibilityMode') : t('standardMode'));
      }
    });
  });

  // 绑定删除按钮事件
  siteList.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const domain = e.target.dataset.domain;
      await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain });
      showToast(t('siteDeleted', { domain }));
      await loadSiteList();
      await checkCurrentSite();
    });
  });
}


/**
 * 打开设置页面
 */
function openSettings() {
  runtime.openOptionsPage();
}

/**
 * 刷新当前页面
 */
async function refreshPage() {
  if (currentTab?.id) {
    await tabs.reload(currentTab.id);
    showToast(t('pageRefreshed'));
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 先加载语言设置
  await loadLanguageSetting();
  // 应用翻译
  applyTranslations();

  // 加载当前网站状态和列表
  checkCurrentSite();
  loadSiteList();

  // 绑定事件
  document.getElementById('toggleBtn').addEventListener('click', toggleCurrentSite);
  document.getElementById('openSettings').addEventListener('click', openSettings);
  document.getElementById('refreshPage').addEventListener('click', refreshPage);

  // 绑定当前网站滚动选项事件
  const scrollToggle = document.getElementById('currentScrollToggle');
  if (scrollToggle) {
    scrollToggle.addEventListener('change', async (e) => {
      if (!currentDomain) return;

      const configs = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
      const siteConfigs = configs?.data || {};
      const config = siteConfigs[currentDomain];

      if (config) {
        // 更新配置
        await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
          domain: currentDomain,
          strategy: config.strategy || STRATEGIES.TECH_BLOCK,
          scrollFallback: e.target.checked
        });
        showToast(e.target.checked ? t('compatibilityMode') : t('standardMode'));
        // 实时更新状态符号
        const dot = document.querySelector('#currentStatus .dot');
        if (dot) {
          dot.textContent = e.target.checked ? '↓' : '✓';
        }
        await loadSiteList();
      }
    });
  }
});
