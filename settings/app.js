// settings/app.js

// 内联常量定义
const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

const DEFAULT_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true,
  fallbackToScroll: false,
  showInterceptionToast: false
};

const MESSAGE_TYPES = {
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_GLOBAL_CONFIG: 'GET_GLOBAL_CONFIG',
  SET_GLOBAL_CONFIG: 'SET_GLOBAL_CONFIG',
  GET_CUSTOM_ATTRIBUTES: 'GET_CUSTOM_ATTRIBUTES',
  SET_CUSTOM_ATTRIBUTES: 'SET_CUSTOM_ATTRIBUTES',
  RESET_CUSTOM_ATTRIBUTES: 'RESET_CUSTOM_ATTRIBUTES'
};

const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

// 默认的懒加载属性和占位符模式
const DEFAULT_LAZY_ATTRIBUTES = [
  'data-src', 'data-original', 'data-lazy-src', 'data-srcset', 'data-lazy-srcset',
  'data-custom-src', 'data-lazy', 'data-defer-src', 'data-async', 'data-img-url',
  'data-url', 'data-image', 'data-image-src', 'data-href'
];

const DEFAULT_PLACEHOLDER_PATTERNS = [
  'thumb', 'placeholder', 'loading', 'spinner', 'blank', 'empty', 'lazy', 'preview', 'temp', 'default'
];


let currentLanguage = 'zh';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  const supportedLangs = Object.keys(window.__LOCALES__ || {});
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
  showToast(t('saved'));
}

/**
 * 应用翻译到页面
 */
function applyTranslations() {
  // 更新页面标题
  document.title = `Image Lazy Load Blocker - ${t('globalSettings')}`;

  // 更新副标题
  const subtitle = document.querySelector('.header .subtitle');
  if (subtitle) {
    subtitle.textContent = t('globalSettings');
  }

  // 更新所有带有 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // 卡片标题统一走 data-i18n（不要再按下标定位 —— 插一张卡片就会整体串位）

  // 更新复选框标签
  const showToastLabel = document.querySelector('#showInterceptionToast').parentElement;
  if (showToastLabel) {
    showToastLabel.querySelector('span').textContent = t('showInterceptionToast');
  }

  const autoScrollLabel = document.querySelector('#fallbackToScroll').parentElement;
  if (autoScrollLabel) {
    autoScrollLabel.querySelector('span').textContent = t('useAutoScrollGlobal');
  }

  const returnTopLabel = document.querySelector('#returnToTop').parentElement;
  if (returnTopLabel) {
    returnTopLabel.querySelector('span').textContent = t('returnToTop');
  }

  // 更新帮助文本
  const helpText = document.querySelector('.help-text');
  if (helpText) {
    helpText.textContent = t('compatibilityModeHelpSection');
  }

  // 更新输入框标签
  const scrollSpeedLabel = document.querySelector('label[for="scrollSpeed"]');
  if (scrollSpeedLabel) scrollSpeedLabel.textContent = t('scrollSpeed');

  const stayDurationLabel = document.querySelector('label[for="stayDuration"]');
  if (stayDurationLabel) stayDurationLabel.textContent = t('stayDuration');

  // 更新按钮文本
  const saveGlobalBtn = document.getElementById('saveGlobalBtn');
  if (saveGlobalBtn) saveGlobalBtn.textContent = t('saveGlobal');

  const saveLangBtn = document.getElementById('saveLangBtn');
  if (saveLangBtn) saveLangBtn.textContent = t('saveLanguage');

  const exportBtn = document.getElementById('exportBtn');
  if (exportBtn) exportBtn.textContent = t('exportConfig');

  const importBtn = document.getElementById('importBtn');
  if (importBtn) importBtn.textContent = t('importConfig');

  // 更新空状态
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.textContent = t('emptyState');

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


/**
 * 显示 Toast 提示
 */
function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, duration);
}


/**
 * 加载并显示网站列表
 */
async function loadSiteList() {
  try {
    console.log('[Settings] Loading site list...');
    const response = await sendMessage(MESSAGE_TYPES.GET_ALL_CONFIGS);
    console.log('[Settings] Got response:', response);

    // 检查响应是否成功
    if (!response || !response.success) {
      console.error('[Settings] Failed to load site configs:', response?.error || 'Unknown error');
      // 显示空状态
      const siteList = document.getElementById('siteList');
      const emptyState = document.getElementById('emptyState');
      if (siteList) siteList.classList.add('hidden');
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    const configs = response.data || {};
    console.log('[Settings] Configs:', configs, 'Count:', Object.keys(configs).length);

    const siteList = document.getElementById('siteList');
    const emptyState = document.getElementById('emptyState');
    const siteCount = document.getElementById('siteCount');

    console.log('[Settings] Elements:', { siteList: !!siteList, emptyState: !!emptyState, siteCount: !!siteCount });

    if (!siteList || !emptyState) {
      console.error('[Settings] Required elements not found');
      return;
    }

    // 清空列表
    siteList.innerHTML = '';

    // 更新计数：已配置的网站总数
    const count = Object.keys(configs).length;
    if (siteCount) {
      siteCount.textContent = String(count);
    }

    if (count === 0) {
      console.log('[Settings] No sites configured, showing empty state');
      siteList.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    console.log('[Settings] Found', count, 'sites, rendering list');
    siteList.classList.remove('hidden');
    emptyState.classList.add('hidden');

    // 排序
    const entries = Object.entries(configs)
      .sort((a, b) => b[1].addedAt - a[1].addedAt);

    // 渲染列表
    entries.forEach(([domain, config]) => {
      const item = document.createElement('div');
      item.className = 'site-item';

      const isScrollEnabled = config.scrollFallback === true;

      const domainSpan = document.createElement('span');
      domainSpan.className = 'domain';
      domainSpan.title = domain;
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

    // 绑定自动滚动复选框事件
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
          showToast(scrollFallback ? t('scrollEnabled') : t('scrollDisabled'));
        }
      });
    });

    // 绑定删除事件
    siteList.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const domain = e.target.dataset.domain;
        if (confirm(t('deleteConfirm', { domain }))) {
          await sendMessage(MESSAGE_TYPES.REMOVE_SITE_CONFIG, { domain });
          loadSiteList();
          showToast(t('deleted'));
        }
      });
    });
  } catch (error) {
    console.error('[Settings] Error loading site list:', error);
    const siteList = document.getElementById('siteList');
    const emptyState = document.getElementById('emptyState');
    if (siteList) siteList.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      emptyState.textContent = t('emptyState');
    }
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
  document.getElementById('scrollSpeed').value = globalConfig.scrollSpeed;
  document.getElementById('stayDuration').value = globalConfig.stayDuration;
  document.getElementById('returnToTop').checked = globalConfig.returnToTop;
}

/**
 * 保存全局设置
 */
async function saveGlobalSettings() {
  const config = {
    showInterceptionToast: document.getElementById('showInterceptionToast').checked,
    fallbackToScroll: document.getElementById('fallbackToScroll').checked,
    scrollSpeed: parseInt(document.getElementById('scrollSpeed').value, 10) || 800,
    stayDuration: parseInt(document.getElementById('stayDuration').value, 10) || 2000,
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

    // 导入网站配置（无数量上限，逐条写入）
    for (const [domain, config] of Object.entries(data.siteConfigs)) {
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: config.strategy || STRATEGIES.TECH_BLOCK
      });
    }

    // 导入全局配置
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });

    loadSiteList();
    loadGlobalSettings();
    showToast(t('configImported'));
  } catch (error) {
    showToast(t('importFailed') + error.message);
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  // 浏览器检测：只有 Chrome 显示 chrome-only 扩展项
  // Safari 同时暴露 browser.* 和 chrome.*，旧逻辑（仅判断 browser 且无 chrome）会漏判 Safari
  // 这里用 UA 判断，只有明确是 Chrome 才显示
  const ua = navigator.userAgent;
  const isChrome = /Chrome/.test(ua) && !/Edg|OPR/.test(ua);
  if (!isChrome) {
    document.querySelectorAll('.chrome-only').forEach(el => el.style.display = 'none');
    // 如果扩展列表中没有可见项，隐藏整个区域
    const extensionList = document.querySelector('.extension-list');
    if (extensionList) {
      const visibleItems = extensionList.querySelectorAll('.extension-item:not([style*="display: none"])');
      if (visibleItems.length === 0) {
        extensionList.closest('.card').style.display = 'none';
      }
    }
  }

  // 先加载语言设置
  await loadLanguageSetting();

  // 应用翻译
  applyTranslations();

  // 加载数据
  await loadSiteList();
  await loadGlobalSettings();
  await loadCustomAttributes();

  // 绑定事件
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
