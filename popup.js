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

// 消息类型
const MESSAGE_TYPES = {
  GET_SITE_CONFIG: 'GET_SITE_CONFIG',
  SET_SITE_CONFIG: 'SET_SITE_CONFIG',
  REMOVE_SITE_CONFIG: 'REMOVE_SITE_CONFIG',
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS'
};

// 策略常量
const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

// 当前语言
let currentLanguage = 'zh';
const LANGUAGE_STORAGE_KEY = 'preferredLanguage';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  const supportedLangs = Object.keys(TRANSLATIONS);
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
const TRANSLATIONS = {
  'zh': {
    'currentSite': '当前网站',
    'loading': '加载中...',
    'enabled': '已启用',
    'disabled': '未启用',
    'notAvailable': '不可用',
    'nonWebPage': '非网页页面',
    'cannotAdd': '无法添加',
    'addCurrentSite': '添加当前网站',
    'removeCurrentSite': '移除当前网站',
    'useAutoScroll': '使用自动滚动代替技术拦截',
    'autoScrollDesc': '自动滚动到底部触发加载，适合技术拦截失效的网站',
    'configuredSites': '已配置的网站',
    'noSites': '暂无配置的网站',
    'fullSettings': '完整设置',
    'refreshPage': '刷新页面',
    'siteAdded': '已添加 {domain}',
    'siteAddedWithScroll': '已添加 {domain}（自动滚动）',
    'siteRemoved': '已移除 {domain}',
    'siteDeleted': '已删除 {domain}',
    'autoScrollEnabled': '已开启自动滚动',
    'autoScrollDisabled': '已关闭自动滚动',
    'pageRefreshed': '页面已刷新',
    'autoScroll': '自动滚动',
    'delete': '删除',
    'author': '作者',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'en': {
    'currentSite': 'Current Site',
    'loading': 'Loading...',
    'enabled': 'Enabled',
    'disabled': 'Disabled',
    'notAvailable': 'Not Available',
    'nonWebPage': 'Non-web Page',
    'cannotAdd': 'Cannot Add',
    'addCurrentSite': 'Add Current Site',
    'removeCurrentSite': 'Remove Current Site',
    'useAutoScroll': 'Use Auto-scroll Instead of Tech Blocking',
    'autoScrollDesc': 'Auto-scroll to bottom to trigger loading, suitable for sites where tech blocking fails',
    'configuredSites': 'Configured Sites',
    'noSites': 'No configured sites',
    'fullSettings': 'Full Settings',
    'refreshPage': 'Refresh Page',
    'siteAdded': 'Added {domain}',
    'siteAddedWithScroll': 'Added {domain} (Auto-scroll)',
    'siteRemoved': 'Removed {domain}',
    'siteDeleted': 'Deleted {domain}',
    'autoScrollEnabled': 'Auto-scroll enabled',
    'autoScrollDisabled': 'Auto-scroll disabled',
    'pageRefreshed': 'Page refreshed',
    'autoScroll': 'Auto-scroll',
    'delete': 'Delete',
    'author': 'by',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'es': {
    'currentSite': 'Sitio Actual',
    'loading': 'Cargando...',
    'enabled': 'Activado',
    'disabled': 'Desactivado',
    'notAvailable': 'No Disponible',
    'nonWebPage': 'Página No Web',
    'cannotAdd': 'No Se Puede Agregar',
    'addCurrentSite': 'Agregar Sitio Actual',
    'removeCurrentSite': 'Eliminar Sitio Actual',
    'useAutoScroll': 'Usar Desplazamiento Automático',
    'autoScrollDesc': 'Desplazarse hasta el final para activar la carga, adecuado para sitios donde falla el bloqueo técnico',
    'configuredSites': 'Sitios Configurados',
    'noSites': 'No hay sitios configurados',
    'fullSettings': 'Configuración Completa',
    'refreshPage': 'Actualizar Página',
    'siteAdded': 'Agregado {domain}',
    'siteAddedWithScroll': 'Agregado {domain} (Desplaz. Auto.)',
    'siteRemoved': 'Eliminado {domain}',
    'siteDeleted': 'Eliminado {domain}',
    'autoScrollEnabled': 'Desplazamiento automático activado',
    'autoScrollDisabled': 'Desplazamiento automático desactivado',
    'pageRefreshed': 'Página actualizada',
    'autoScroll': 'Desplaz. Auto.',
    'delete': 'Eliminar',
    'author': 'por',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'ar': {
    'currentSite': 'الموقع الحالي',
    'loading': 'جاري التحميل...',
    'enabled': 'مفعّل',
    'disabled': 'معطّل',
    'notAvailable': 'غير متاح',
    'nonWebPage': 'صفحة غير ويب',
    'cannotAdd': 'لا يمكن الإضافة',
    'addCurrentSite': 'إضافة الموقع الحالي',
    'removeCurrentSite': 'إزالة الموقع الحالي',
    'useAutoScroll': 'استخدام التمرير التلقائي',
    'autoScrollDesc': 'التمرير للأسفل لتفعيل التحميل، مناسب للمواقع التي يفشل فيها الحظر التقني',
    'configuredSites': 'المواقع المُعدّة',
    'noSites': 'لا توجد مواقع مُعدّة',
    'fullSettings': 'الإعدادات الكاملة',
    'refreshPage': 'تحديث الصفحة',
    'siteAdded': 'تمت إضافة {domain}',
    'siteAddedWithScroll': 'تمت إضافة {domain} (تمرير تلقائي)',
    'siteRemoved': 'تمت إزالة {domain}',
    'siteDeleted': 'تم حذف {domain}',
    'autoScrollEnabled': 'التمرير التلقائي مفعّل',
    'autoScrollDisabled': 'التمرير التلقائي معطّل',
    'pageRefreshed': 'تم تحديث الصفحة',
    'autoScroll': 'تمرير تلقائي',
    'delete': 'حذف',
    'author': 'بواسطة',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'hi': {
    'currentSite': 'वर्तमान साइट',
    'loading': 'लोड हो रहा है...',
    'enabled': 'सक्षम',
    'disabled': 'अक्षम',
    'notAvailable': 'अनुपलब्ध',
    'nonWebPage': 'नॉन-वेब पेज',
    'cannotAdd': 'जोड़ नहीं सकते',
    'addCurrentSite': 'वर्तमान साइट जोड़ें',
    'removeCurrentSite': 'वर्तमान साइट हटाएं',
    'useAutoScroll': 'ऑटो-स्क्रॉल का उपयोग करें',
    'autoScrollDesc': 'लोड ट्रिगर करने के लिए नीचे स्क्रॉल करें, तकनीकी ब्लॉकिंग विफल होने पर उपयुक्त',
    'configuredSites': 'कॉन्फ़िगर की गई साइटें',
    'noSites': 'कोई कॉन्फ़िगर की गई साइट नहीं',
    'fullSettings': 'पूर्ण सेटिंग्स',
    'refreshPage': 'पेज रिफ्रेश करें',
    'siteAdded': '{domain} जोड़ा गया',
    'siteAddedWithScroll': '{domain} जोड़ा गया (ऑटो-स्क्रॉल)',
    'siteRemoved': '{domain} हटाया गया',
    'siteDeleted': '{domain} हटाया गया',
    'autoScrollEnabled': 'ऑटो-स्क्रॉल सक्षम',
    'autoScrollDisabled': 'ऑटो-स्क्रॉल अक्षम',
    'pageRefreshed': 'पेज रिफ्रेश किया गया',
    'autoScroll': 'ऑटो-स्क्रॉल',
    'delete': 'हटाएं',
    'author': 'द्वारा',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'fr': {
    'currentSite': 'Site Actuel',
    'loading': 'Chargement...',
    'enabled': 'Activé',
    'disabled': 'Désactivé',
    'notAvailable': 'Non Disponible',
    'nonWebPage': 'Page Non Web',
    'cannotAdd': 'Impossible d\'ajouter',
    'addCurrentSite': 'Ajouter le Site Actuel',
    'removeCurrentSite': 'Supprimer le Site Actuel',
    'useAutoScroll': 'Utiliser le Défilement Automatique',
    'autoScrollDesc': 'Défiler jusqu\'en bas pour déclencher le chargement, adapté aux sites où le blocage technique échoue',
    'configuredSites': 'Sites Configurés',
    'noSites': 'Aucun site configuré',
    'fullSettings': 'Paramètres Complets',
    'refreshPage': 'Actualiser la Page',
    'siteAdded': 'Ajouté {domain}',
    'siteAddedWithScroll': 'Ajouté {domain} (Défil. Auto.)',
    'siteRemoved': 'Supprimé {domain}',
    'siteDeleted': 'Supprimé {domain}',
    'autoScrollEnabled': 'Défilement automatique activé',
    'autoScrollDisabled': 'Défilement automatique désactivé',
    'pageRefreshed': 'Page actualisée',
    'autoScroll': 'Défil. Auto.',
    'delete': 'Supprimer',
    'author': 'par',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'pt': {
    'currentSite': 'Site Atual',
    'loading': 'Carregando...',
    'enabled': 'Ativado',
    'disabled': 'Desativado',
    'notAvailable': 'Não Disponível',
    'nonWebPage': 'Página Não Web',
    'cannotAdd': 'Não é Possível Adicionar',
    'addCurrentSite': 'Adicionar Site Atual',
    'removeCurrentSite': 'Remover Site Atual',
    'useAutoScroll': 'Usar Rolagem Automática',
    'autoScrollDesc': 'Rolar até o final para acionar o carregamento, adequado para sites onde o bloqueio técnico falha',
    'configuredSites': 'Sites Configurados',
    'noSites': 'Nenhum site configurado',
    'fullSettings': 'Configurações Completas',
    'refreshPage': 'Atualizar Página',
    'siteAdded': 'Adicionado {domain}',
    'siteAddedWithScroll': 'Adicionado {domain} (Rolagem Auto)',
    'siteRemoved': 'Removido {domain}',
    'siteDeleted': 'Excluído {domain}',
    'autoScrollEnabled': 'Rolagem automática ativada',
    'autoScrollDisabled': 'Rolagem automática desativada',
    'pageRefreshed': 'Página atualizada',
    'autoScroll': 'Rolagem Auto',
    'delete': 'Excluir',
    'author': 'por',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'de': {
    'currentSite': 'Aktuelle Seite',
    'loading': 'Lädt...',
    'enabled': 'Aktiviert',
    'disabled': 'Deaktiviert',
    'notAvailable': 'Nicht Verfügbar',
    'nonWebPage': 'Keine Webseite',
    'cannotAdd': 'Kann Nicht Hinzufügen',
    'addCurrentSite': 'Aktuelle Seite Hinzufügen',
    'removeCurrentSite': 'Aktuelle Seite Entfernen',
    'useAutoScroll': 'Automatisches Scrollen Verwenden',
    'autoScrollDesc': 'Nach unten scrollen zum Laden auslösen, geeignet für Seiten bei denen das technische Blockieren fehlschlägt',
    'configuredSites': 'Konfigurierte Seiten',
    'noSites': 'Keine konfigurierten Seiten',
    'fullSettings': 'Vollständige Einstellungen',
    'refreshPage': 'Seite Aktualisieren',
    'siteAdded': '{domain} Hinzugefügt',
    'siteAddedWithScroll': '{domain} Hinzugefügt (Auto-Scroll)',
    'siteRemoved': '{domain} Entfernt',
    'siteDeleted': '{domain} Gelöscht',
    'autoScrollEnabled': 'Automatisches Scrollen aktiviert',
    'autoScrollDisabled': 'Automatisches Scrollen deaktiviert',
    'pageRefreshed': 'Seite aktualisiert',
    'autoScroll': 'Auto-Scroll',
    'delete': 'Löschen',
    'author': 'von',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'ja': {
    'currentSite': '現在のサイト',
    'loading': '読み込み中...',
    'enabled': '有効',
    'disabled': '無効',
    'notAvailable': '利用不可',
    'nonWebPage': '非ウェブページ',
    'cannotAdd': '追加不可',
    'addCurrentSite': '現在のサイトを追加',
    'removeCurrentSite': '現在のサイトを削除',
    'useAutoScroll': '自動スクロールを使用',
    'autoScrollDesc': '読み込みをトリガーするために下部までスクロールします。技術的なブロッキングが失敗するサイトに適しています',
    'configuredSites': '設定済みサイト',
    'noSites': '設定済みサイトはありません',
    'fullSettings': '詳細設定',
    'refreshPage': 'ページを更新',
    'siteAdded': '{domain} を追加しました',
    'siteAddedWithScroll': '{domain} を追加しました（自動スクロール）',
    'siteRemoved': '{domain} を削除しました',
    'siteDeleted': '{domain} を削除しました',
    'autoScrollEnabled': '自動スクロールを有効にしました',
    'autoScrollDisabled': '自動スクロールを無効にしました',
    'pageRefreshed': 'ページを更新しました',
    'autoScroll': '自動スクロール',
    'delete': '削除',
    'author': '作成者',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'ru': {
    'currentSite': 'Текущий Сайт',
    'loading': 'Загрузка...',
    'enabled': 'Включено',
    'disabled': 'Выключено',
    'notAvailable': 'Недоступно',
    'nonWebPage': 'Не Веб-Страница',
    'cannotAdd': 'Невозможно Добавить',
    'addCurrentSite': 'Добавить Текущий Сайт',
    'removeCurrentSite': 'Удалить Текущий Сайт',
    'useAutoScroll': 'Использовать Автопрокрутку',
    'autoScrollDesc': 'Прокрутить вниз для активации загрузки, подходит для сайтов где техническая блокировка не работает',
    'configuredSites': 'Настроенные Сайты',
    'noSites': 'Нет настроенных сайтов',
    'fullSettings': 'Полные Настройки',
    'refreshPage': 'Обновить Страницу',
    'siteAdded': 'Добавлен {domain}',
    'siteAddedWithScroll': 'Добавлен {domain} (Автопрокрутка)',
    'siteRemoved': 'Удалён {domain}',
    'siteDeleted': 'Удалён {domain}',
    'autoScrollEnabled': 'Автопрокрутка включена',
    'autoScrollDisabled': 'Автопрокрутка выключена',
    'pageRefreshed': 'Страница обновлена',
    'autoScroll': 'Автопрокрутка',
    'delete': 'Удалить',
    'author': 'от',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  }
};

// 当前标签页信息
let currentTab = null;
let currentDomain = '';

/**
 * 获取翻译文本
 */
function t(key, replacements = {}) {
  const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS['zh'];
  let text = lang[key] || TRANSLATIONS['zh'][key] || key;

  // 替换占位符
  Object.keys(replacements).forEach(placeholder => {
    text = text.replace(`{${placeholder}}`, replacements[placeholder]);
  });

  return text;
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
      currentLanguage = result[LANGUAGE_STORAGE_KEY] || detectBrowserLanguage();
      resolve(currentLanguage);
    });
  });
}

/**
 * 应用翻译到页面
 */
function applyTranslations() {
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
    runtime.sendMessage({ type, ...data }, (response) => {
      resolve(response);
    });
  });
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
    await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
      domain: currentDomain,
      strategy: STRATEGIES.TECH_BLOCK,
      scrollFallback
    });
    showToast(scrollFallback ? t('siteAddedWithScroll', { domain: currentDomain }) : t('siteAdded', { domain: currentDomain }));
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
  const siteCount = document.getElementById('siteCount');

  // 更新计数
  const count = Object.keys(configs).length;
  siteCount.textContent = count;

  // 清空列表
  siteList.innerHTML = '';

  if (count === 0) {
    siteList.innerHTML = `<div class="empty-state">${t('noSites')}</div>`;
    return;
  }

  // 按添加时间排序（最新的在前）
  const entries = Object.entries(configs)
    .sort((a, b) => (b[1].addedAt || 0) - (a[1].addedAt || 0));

  entries.forEach(([domain, config]) => {
    const item = document.createElement('div');
    item.className = 'site-item';

    const isScrollEnabled = config.scrollFallback === true;

    item.innerHTML = `
      <span class="domain" title="${escapeHtml(domain)}">${escapeHtml(domain)}</span>
      <label class="scroll-toggle" title="${t('useAutoScroll')}">
        <input type="checkbox" data-domain="${escapeHtml(domain)}" ${isScrollEnabled ? 'checked' : ''}>
        <span>${t('autoScroll')}</span>
      </label>
      <button class="delete-btn" data-domain="${escapeHtml(domain)}" title="${t('delete')}">×</button>
    `;

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
        showToast(scrollFallback ? t('autoScrollEnabled') : t('autoScrollDisabled'));
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
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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
        showToast(e.target.checked ? t('autoScrollEnabled') : t('autoScrollDisabled'));
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
