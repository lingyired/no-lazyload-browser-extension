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

// 翻译内容
const TRANSLATIONS = {
  'zh': {
    'siteListTitle': '已配置的网站',
    'emptyState': '暂无配置的网站',
    'globalSettings': '网站配置列表',
    'showInterceptionToast': '显示拦截成功提示（右上角 2 秒）',
    'useAutoScroll': '使用自动滚动代替技术拦截（适合拦截失败的网站）',
    'autoScrollHelp': '开启后禁用技术拦截，通过自动滚动到底部触发图片加载',
    'scrollParams': '自动滚动参数',
    'scrollSpeed': '滚动速度（毫秒）',
    'stayDuration': '底部停留时间（毫秒）',
    'returnToTop': '完成后返回页面顶部',
    'saveGlobal': '保存全局设置',
    'saved': '已保存',
    'importExport': '导入/导出配置',
    'exportConfig': '导出配置',
    'importConfig': '导入配置',
    'autoScroll': '自动滚动',
    'delete': '删除',
    'deleteConfirm': '确定要删除 {domain} 的配置吗？',
    'deleted': '已删除',
    'scrollEnabled': '已开启自动滚动',
    'scrollDisabled': '已关闭自动滚动',
    'configImported': '配置已导入',
    'configExported': '配置已导出',
    'importFailed': '导入失败：',
    'invalidConfig': '配置文件格式不正确',
    'languageSettings': '语言设置',
    'saveLanguage': '保存语言设置',
    'languageSaved': '语言设置已保存，页面即将刷新...',
    'advancedSettings': '高级设置',
    'lazyAttributes': '懒加载属性',
    'lazyAttributesHelp': '检测这些属性来加载图片，用逗号分隔',
    'placeholderPatterns': '占位符检测',
    'placeholderPatternsHelp': '如果图片 src 包含这些关键词，将被视为占位符并替换，用逗号分隔',
    'resetToDefault': '重置为默认',
    'attributesSaved': '属性配置已保存',
    'attributesReset': '已恢复为默认配置',
    'save': '保存'
  },
  'en': {
    'siteListTitle': 'Configured Sites',
    'emptyState': 'No configured sites',
    'globalSettings': 'Site Configuration List',
    'showInterceptionToast': 'Show interception success toast (top-right, 2s)',
    'useAutoScroll': 'Use auto-scroll instead of tech blocking (for sites where blocking fails)',
    'autoScrollHelp': 'When enabled, disables tech blocking and triggers image loading by auto-scrolling to bottom',
    'scrollParams': 'Auto-scroll Parameters',
    'scrollSpeed': 'Scroll Speed (ms)',
    'stayDuration': 'Stay Duration at Bottom (ms)',
    'returnToTop': 'Return to top when complete',
    'saveGlobal': 'Save Global Settings',
    'saved': 'Saved',
    'importExport': 'Import/Export Config',
    'exportConfig': 'Export Config',
    'importConfig': 'Import Config',
    'autoScroll': 'Auto-scroll',
    'delete': 'Delete',
    'deleteConfirm': 'Are you sure you want to delete config for {domain}?',
    'deleted': 'Deleted',
    'scrollEnabled': 'Auto-scroll enabled',
    'scrollDisabled': 'Auto-scroll disabled',
    'configImported': 'Config imported',
    'configExported': 'Config exported',
    'importFailed': 'Import failed: ',
    'invalidConfig': 'Invalid config file format',
    'languageSettings': 'Language Settings',
    'saveLanguage': 'Save Language',
    'languageSaved': 'Language saved, page will refresh...',
    'advancedSettings': 'Advanced Settings',
    'lazyAttributes': 'Lazy Load Attributes',
    'lazyAttributesHelp': 'Detect these attributes to load images, comma-separated',
    'placeholderPatterns': 'Placeholder Detection',
    'placeholderPatternsHelp': 'Images with src containing these keywords will be treated as placeholders, comma-separated',
    'resetToDefault': 'Reset to Default',
    'attributesSaved': 'Attributes saved',
    'attributesReset': 'Reset to default configuration',
    'save': 'Save'
  },
  'es': {
    'siteListTitle': 'Sitios Configurados',
    'emptyState': 'No hay sitios configurados',
    'globalSettings': 'Lista de Configuración de Sitios',
    'showInterceptionToast': 'Mostrar notificación de éxito (arriba derecha, 2s)',
    'useAutoScroll': 'Usar desplazamiento automático en lugar de bloqueo técnico',
    'autoScrollHelp': 'Deshabilita el bloqueo técnico y activa la carga desplazándose al final',
    'scrollParams': 'Parámetros de Desplazamiento',
    'scrollSpeed': 'Velocidad (ms)',
    'stayDuration': 'Duración de Estancia (ms)',
    'returnToTop': 'Volver arriba al completar',
    'saveGlobal': 'Guardar Configuración',
    'saved': 'Guardado',
    'importExport': 'Importar/Exportar',
    'exportConfig': 'Exportar',
    'importConfig': 'Importar',
    'autoScroll': 'Desplaz. Auto.',
    'delete': 'Eliminar',
    'languageSettings': 'Configuración de Idioma',
    'saveLanguage': 'Guardar Idioma',
    'languageSaved': 'Idioma guardado, la página se actualizará...',
    'advancedSettings': 'Configuración Avanzada',
    'lazyAttributes': 'Atributos de Carga Perezosa',
    'lazyAttributesHelp': 'Detectar estos atributos para cargar imágenes, separados por comas',
    'placeholderPatterns': 'Detección de Marcadores',
    'placeholderPatternsHelp': 'Las imágenes con src que contengan estas palabras clave se tratarán como marcadores, separados por comas',
    'resetToDefault': 'Restablecer por Defecto',
    'attributesSaved': 'Atributos guardados',
    'attributesReset': 'Restablecido a configuración predeterminada',
    'save': 'Guardar'
  },
  'ar': {
    'siteListTitle': 'المواقع المُعدّة',
    'emptyState': 'لا توجد مواقع مُعدّة',
    'globalSettings': 'قائمة تكوين الموقع',
    'showInterceptionToast': 'عرض إشعار النجاح (أعلى اليمين، 2 ثانية)',
    'useAutoScroll': 'استخدام التمرير التلقائي بدلاً من الحظر التقني',
    'autoScrollHelp': 'يعطل الحظر التقني ويُفعّل التحميل بالتمرير للأسفل',
    'scrollParams': 'معايير التمرير التلقائي',
    'scrollSpeed': 'سرعة التمرير (مللي ثانية)',
    'stayDuration': 'مدة البقاء (مللي ثانية)',
    'returnToTop': 'العودة للأعلى عند الانتهاء',
    'saveGlobal': 'حفظ الإعدادات',
    'saved': 'تم الحفظ',
    'importExport': 'استيراد/تصدير',
    'exportConfig': 'تصدير',
    'importConfig': 'استيراد',
    'autoScroll': 'تمرير تلقائي',
    'delete': 'حذف',
    'languageSettings': 'إعدادات اللغة',
    'saveLanguage': 'حفظ اللغة',
    'languageSaved': 'تم حفظ اللغة، سيتم تحديث الصفحة...',
    'advancedSettings': 'إعدادات متقدمة',
    'lazyAttributes': 'سمات التحميل الكسول',
    'lazyAttributesHelp': 'اكتشاف هذه السمات لتحميل الصور، مفصولة بفاصلة',
    'placeholderPatterns': 'كشف العناصر النائبة',
    'placeholderPatternsHelp': 'سيتم معاملة الصور التي تحتوي على src تحتوي على هذه الكلمات الرئيسية كعناصر نائبة، مفصولة بفاصلة',
    'resetToDefault': 'إعادة تعيين للافتراضي',
    'attributesSaved': 'تم حفظ السمات',
    'attributesReset': 'تمت إعادة التعيين إلى الإعدادات الافتراضية',
    'save': 'حفظ'
  },
  'hi': {
    'siteListTitle': 'कॉन्फ़िगर की गई साइटें',
    'emptyState': 'कोई कॉन्फ़िगर की गई साइट नहीं',
    'globalSettings': 'वेबसाइट कॉन्फ़िगरेशन सूची',
    'showInterceptionToast': 'सफलता का संदेश दिखाएं (ऊपर दाएं, 2 सेकंड)',
    'useAutoScroll': 'तकनीकी ब्लॉकिंग के बजाय ऑटो-स्क्रॉल का उपयोग करें',
    'autoScrollHelp': 'तकनीकी ब्लॉकिंग को अक्षम करता है और नीचे स्क्रॉल करके लोड करता है',
    'scrollParams': 'ऑटो-स्क्रॉल पैरामीटर',
    'scrollSpeed': 'स्क्रॉल गति (मि.से.)',
    'stayDuration': 'रुकने की अवधि (मि.से.)',
    'returnToTop': 'पूर्ण होने पर ऊपर जाएं',
    'saveGlobal': 'सेटिंग्स सहेजें',
    'saved': 'सहेजा गया',
    'importExport': 'आयात/निर्यात',
    'exportConfig': 'निर्यात',
    'importConfig': 'आयात',
    'autoScroll': 'ऑटो-स्क्रॉल',
    'delete': 'हटाएं',
    'languageSettings': 'भाषा सेटिंग्स',
    'saveLanguage': 'भाषा सहेजें',
    'languageSaved': 'भाषा सहेजी गई, पेज रिफ्रेश होगा...',
    'advancedSettings': 'उन्नत सेटिंग्स',
    'lazyAttributes': 'लेजी लोड गुण',
    'lazyAttributesHelp': 'छवियों को लोड करने के लिए इन गुणों का पता लगाएं, अल्पविराम से अलग',
    'placeholderPatterns': 'प्लेसहोल्डर का पता लगाना',
    'placeholderPatternsHelp': 'src में इन कीवर्ड वाली छवियों को प्लेसहोल्डर के रूप में माना जाएगा, अल्पविराम से अलग',
    'resetToDefault': 'डिफ़ॉल्ट पर रीसेट करें',
    'attributesSaved': 'गुण सहेजे गए',
    'attributesReset': 'डिफ़ॉल्ट कॉन्फ़िगरेशन पर रीसेट',
    'save': 'सहेजें'
  },
  'fr': {
    'siteListTitle': 'Sites Configurés',
    'emptyState': 'Aucun site configuré',
    'globalSettings': 'Liste de Configuration des Sites',
    'showInterceptionToast': 'Afficher notification de succès (haut droite, 2s)',
    'useAutoScroll': 'Utiliser défilement auto au lieu du blocage technique',
    'autoScrollHelp': 'Désactive le blocage technique et déclenche le chargement en défilant',
    'scrollParams': 'Paramètres de Défilement',
    'scrollSpeed': 'Vitesse (ms)',
    'stayDuration': 'Durée de Séjour (ms)',
    'returnToTop': 'Retour en haut à la fin',
    'saveGlobal': 'Enregistrer',
    'saved': 'Enregistré',
    'importExport': 'Import/Export',
    'exportConfig': 'Exporter',
    'importConfig': 'Importer',
    'autoScroll': 'Défil. Auto.',
    'delete': 'Supprimer',
    'languageSettings': 'Paramètres de Langue',
    'saveLanguage': 'Enregistrer Langue',
    'languageSaved': 'Langue enregistrée, actualisation...',
    'advancedSettings': 'Paramètres Avancés',
    'lazyAttributes': 'Attributs de Chargement Paresseux',
    'lazyAttributesHelp': 'Détecter ces attributs pour charger les images, séparés par des virgules',
    'placeholderPatterns': 'Détection de Placeholders',
    'placeholderPatternsHelp': 'Les images dont le src contient ces mots-clés seront traitées comme des placeholders, séparés par des virgules',
    'resetToDefault': 'Réinitialiser par Défaut',
    'attributesSaved': 'Attributs enregistrés',
    'attributesReset': 'Réinitialisé à la configuration par défaut',
    'save': 'Enregistrer'
  },
  'pt': {
    'siteListTitle': 'Sites Configurados',
    'emptyState': 'Nenhum site configurado',
    'globalSettings': 'Lista de Configuração de Sites',
    'showInterceptionToast': 'Mostrar notificação de sucesso (canto superior, 2s)',
    'useAutoScroll': 'Usar rolagem automática em vez de bloqueio técnico',
    'autoScrollHelp': 'Desativa o bloqueio técnico e ativa o carregamento rolando até o final',
    'scrollParams': 'Parâmetros de Rolagem',
    'scrollSpeed': 'Velocidade (ms)',
    'stayDuration': 'Duração de Estadia (ms)',
    'returnToTop': 'Voltar ao topo ao concluir',
    'saveGlobal': 'Salvar Configurações',
    'saved': 'Salvo',
    'importExport': 'Importar/Exportar',
    'exportConfig': 'Exportar',
    'importConfig': 'Importar',
    'autoScroll': 'Rolagem Auto',
    'delete': 'Excluir',
    'languageSettings': 'Configurações de Idioma',
    'saveLanguage': 'Salvar Idioma',
    'languageSaved': 'Idioma salvo, atualizando página...',
    'advancedSettings': 'Configurações Avançadas',
    'lazyAttributes': 'Atributos de Carregamento Preguiçoso',
    'lazyAttributesHelp': 'Detectar esses atributos para carregar imagens, separados por vírgulas',
    'placeholderPatterns': 'Detecção de Marcadores',
    'placeholderPatternsHelp': 'Imagens com src contendo essas palavras-chave serão tratadas como marcadores, separados por vírgulas',
    'resetToDefault': 'Restaurar Padrão',
    'attributesSaved': 'Atributos salvos',
    'attributesReset': 'Restaurado para configuração padrão',
    'save': 'Salvar'
  },
  'de': {
    'siteListTitle': 'Konfigurierte Seiten',
    'emptyState': 'Keine konfigurierten Seiten',
    'globalSettings': 'Website-Konfigurationsliste',
    'showInterceptionToast': 'Erfolgsbenachrichtigung anzeigen (oben rechts, 2s)',
    'useAutoScroll': 'Automatisches Scrollen statt technischer Blockierung',
    'autoScrollHelp': 'Deaktiviert technische Blockierung und lädt durch Scrollen',
    'scrollParams': 'Scroll-Parameter',
    'scrollSpeed': 'Geschwindigkeit (ms)',
    'stayDuration': 'Verweildauer (ms)',
    'returnToTop': 'Nach Abschluss nach oben zurückkehren',
    'saveGlobal': 'Einstellungen Speichern',
    'saved': 'Gespeichert',
    'importExport': 'Import/Export',
    'exportConfig': 'Exportieren',
    'importConfig': 'Importieren',
    'autoScroll': 'Auto-Scroll',
    'delete': 'Löschen',
    'languageSettings': 'Spracheinstellungen',
    'saveLanguage': 'Sprache Speichern',
    'languageSaved': 'Sprache gespeichert, Seite wird aktualisiert...',
    'advancedSettings': 'Erweiterte Einstellungen',
    'lazyAttributes': 'Lazy-Load Attribute',
    'lazyAttributesHelp': 'Diese Attribute zum Laden von Bildern erkennen, kommagetrennt',
    'placeholderPatterns': 'Platzhalter-Erkennung',
    'placeholderPatternsHelp': 'Bilder mit src, die diese Schlüsselwörter enthalten, werden als Platzhalter behandelt, kommagetrennt',
    'resetToDefault': 'Auf Standard Zurücksetzen',
    'attributesSaved': 'Attribute gespeichert',
    'attributesReset': 'Auf Standardkonfiguration zurückgesetzt',
    'save': 'Speichern'
  },
  'ja': {
    'siteListTitle': '設定済みサイト',
    'emptyState': '設定済みサイトはありません',
    'globalSettings': 'ウェブサイト設定リスト',
    'showInterceptionToast': '成功通知を表示（右上、2秒）',
    'useAutoScroll': '技術ブロックの代わりに自動スクロールを使用',
    'autoScrollHelp': '技術ブロックを無効化し、スクロールで読み込みをトリガー',
    'scrollParams': '自動スクロール設定',
    'scrollSpeed': '速度（ミリ秒）',
    'stayDuration': '停止時間（ミリ秒）',
    'returnToTop': '完了後にトップに戻る',
    'saveGlobal': '設定を保存',
    'saved': '保存しました',
    'importExport': 'インポート/エクスポート',
    'exportConfig': 'エクスポート',
    'importConfig': 'インポート',
    'autoScroll': '自動スクロール',
    'delete': '削除',
    'languageSettings': '言語設定',
    'saveLanguage': '言語を保存',
    'languageSaved': '言語を保存しました、ページを更新します...',
    'advancedSettings': '詳細設定',
    'lazyAttributes': '遅延読み込み属性',
    'lazyAttributesHelp': '画像を読み込むためのこれらの属性を検出、カンマ区切り',
    'placeholderPatterns': 'プレースホルダー検出',
    'placeholderPatternsHelp': 'srcにこれらのキーワードを含む画像はプレースホルダーとして扱われます、カンマ区切り',
    'resetToDefault': 'デフォルトに戻す',
    'attributesSaved': '属性を保存しました',
    'attributesReset': 'デフォルト設定にリセットしました',
    'save': '保存'
  },
  'ru': {
    'siteListTitle': 'Настроенные Сайты',
    'emptyState': 'Нет настроенных сайтов',
    'globalSettings': 'Список Конфигурации Сайтов',
    'showInterceptionToast': 'Показывать уведомление об успехе (справа сверху, 2с)',
    'useAutoScroll': 'Использовать автопрокрутку вместо технической блокировки',
    'autoScrollHelp': 'Отключает техническую блокировку и загружает прокруткой',
    'scrollParams': 'Параметры Автопрокрутки',
    'scrollSpeed': 'Скорость (мс)',
    'stayDuration': 'Время Остановки (мс)',
    'returnToTop': 'Вернуться наверх по завершении',
    'saveGlobal': 'Сохранить Настройки',
    'saved': 'Сохранено',
    'importExport': 'Импорт/Экспорт',
    'exportConfig': 'Экспорт',
    'importConfig': 'Импорт',
    'autoScroll': 'Автопрокрутка',
    'delete': 'Удалить',
    'languageSettings': 'Настройки Языка',
    'saveLanguage': 'Сохранить Язык',
    'languageSaved': 'Язык сохранен, обновление страницы...',
    'advancedSettings': 'Расширенные Настройки',
    'lazyAttributes': 'Атрибуты Отложенной Загрузки',
    'lazyAttributesHelp': 'Обнаруживать эти атрибуты для загрузки изображений, через запятую',
    'placeholderPatterns': 'Обнаружение Заглушек',
    'placeholderPatternsHelp': 'Изображения с src, содержащим эти ключевые слова, будут считаться заглушками, через запятую',
    'resetToDefault': 'Сбросить по Умолчанию',
    'attributesSaved': 'Атрибуты сохранены',
    'attributesReset': 'Сброшено к конфигурации по умолчанию',
    'save': 'Сохранить'
  }
};

let currentLanguage = 'zh';

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
    const storage = getStorage();
    if (!storage) {
      console.warn('[Settings] Storage not available');
      resolve('zh');
      return;
    }
    storage.local.get([LANGUAGE_STORAGE_KEY], (result) => {
      currentLanguage = result[LANGUAGE_STORAGE_KEY] || 'zh';

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
  showToast(t('languageSaved'));

  // 刷新页面以应用新语言
  setTimeout(() => {
    window.location.reload();
  }, 1500);
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

  // 更新 section 标题（按实际 DOM 顺序）
  const allCardH2s = document.querySelectorAll('.card h2');
  const sectionTitles = {
    'importExport': allCardH2s[2],
    'languageSettings': allCardH2s[3]
  };

  Object.entries(sectionTitles).forEach(([key, el]) => {
    if (el) el.textContent = t(key);
  });

  // 更新复选框标签
  const showToastLabel = document.querySelector('#showInterceptionToast').parentElement;
  if (showToastLabel) {
    showToastLabel.querySelector('span').textContent = t('showInterceptionToast');
  }

  const autoScrollLabel = document.querySelector('#fallbackToScroll').parentElement;
  if (autoScrollLabel) {
    autoScrollLabel.querySelector('span').textContent = t('useAutoScroll');
  }

  const returnTopLabel = document.querySelector('#returnToTop').parentElement;
  if (returnTopLabel) {
    returnTopLabel.querySelector('span').textContent = t('returnToTop');
  }

  // 更新帮助文本
  const helpText = document.querySelector('.help-text');
  if (helpText) {
    helpText.textContent = t('autoScrollHelp');
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
    rt.sendMessage({ type, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('[Settings] Message error:', chrome.runtime.lastError);
        resolve({ success: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(response);
    });
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
 * HTML 转义
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
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

    // 更新计数
    const count = Object.keys(configs).length;
    if (siteCount) {
      siteCount.textContent = count;
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

    // 导入网站配置
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
