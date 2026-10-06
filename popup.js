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
  GET_ALL_CONFIGS: 'GET_ALL_CONFIGS',
  // Entitlement / Purchase（值与 background 一致）
  //   GET_ENTITLEMENTS     —— 读 background 的本地快照，毫秒级返回
  //   REFRESH_ENTITLEMENTS —— 让 background 走原生 App Group 拉最新值（慢）
  GET_ENTITLEMENTS: 'getEntitlements',
  REFRESH_ENTITLEMENTS: 'refreshEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
  OPEN_HOST_APP: 'openHostApp',
  ACK_ENTITLEMENT_NOTICE: 'ackEntitlementNotice'
};

// ===== 域名规范化（内联自 shared/domain.js）=====
// ⚠️ 唯一实现是 shared/domain.js；这里是经典脚本的内联副本。
// 规则：小写 → 去空白 → 去端口 → 去结尾根点 → 去一个 www. 前缀。
// 千万不要在别处再写一遍（历史上 popup 去 www.、background 不去，导致启用后不生效）。
function normalizeHostname(hostname) {
  if (typeof hostname !== 'string') return '';

  let host = hostname.trim().toLowerCase();
  if (!host) return '';

  if (host.startsWith('[')) {
    const end = host.indexOf(']');
    if (end !== -1) host = host.slice(0, end + 1);
  } else {
    const colon = host.lastIndexOf(':');
    if (colon !== -1 && /^\d+$/.test(host.slice(colon + 1))) {
      host = host.slice(0, colon);
    }
  }

  while (host.endsWith('.')) host = host.slice(0, -1);
  if (!host) return '';

  return host.replace(/^www\./, '');
}

// ===== Entitlement System 常量（内联自 shared/constants.js）=====
const APP_LIMITS = {
  FREE_SITE_LIMIT: 3,
};

const ENTITLEMENTS = {
  UNLIMITED_SITES: 'unlimitedSites',
};

// 授权模式常量（内联自 shared/constants.js）
//   unrestricted = Chrome/Firefox：免费且不限额，不是 Pro，绝不显示付费 UI
//   free         = Safari 免费版
//   pro          = Safari 已解锁 Pro
const LICENSE_MODES = {
  UNRESTRICTED: 'unrestricted',
  FREE: 'free',
  PRO: 'pro',
};

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
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers',
    'upgradeTitle': '解锁 Pro',
    'upgradeBody': '免费版最多支持 3 个网站。升级以解锁无限网站及未来的高级功能。',
    'upgradeButton': '升级',
    'cancelUpgrade': '取消',
    'siteLimitReached': '已达网站数量上限',
    'importPartial': '已导入 {added}/{total} 个网站，免费版上限为 3 个。',
    'openingHostApp': '正在打开宿主 App，请完成购买后返回扩展',
    'upgradeOpenFailed': '无法自动打开 App，请手动启动 No Lazy Load 完成购买',
    'licenseFree': '免费版 · 最多 3 个网站',
    'licensePro': 'Pro · 无限网站',
    'licenseUpgrade': '升级到 Pro',
    'licenseManage': '管理 / 恢复购买',
    'proBadge': 'PRO',
    'noticeSiteEnabled': '已解锁 Pro · 已启用 {domain}',
    'purchaseUnavailable': '购买服务暂时不可用，请稍后再试',
    'currentWebsite': '当前网站',
    'siteSwitchHelp': '在此网站禁用懒加载，直接加载全部图片。',
    'mode': '模式',
    'standardMode': '标准',
    'compatibilityMode': '兼容模式',
    'standardModeHelp': '用 No Lazyload 的常规引擎立即加载图片。',
    'compatibilityModeHelp': '自动滚动页面来触发图片加载。仅在标准模式无效时使用。',
    'enabledWebsites': '已启用的网站',
    'removeSite': '移除',
    'undo': '撤销',
    'upgradeNote': '无限网站 · 一次性购买，无订阅',
    'upgradePrice': '一次性购买',
    'oneTimePurchase': '一次性购买',
    'noSubscription': '无订阅',
    'upgradeToPro': '升级到 Pro',
    'notNow': '暂不升级',
    'upgradeBodyLimit': '你已用完 3 个免费网站。升级一次即可在无限网站上启用 No Lazyload。'
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
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers',
    'upgradeTitle': 'Unlock Pro',
    'upgradeBody': 'Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features.',
    'upgradeButton': 'Upgrade',
    'cancelUpgrade': 'Cancel',
    'siteLimitReached': 'Site limit reached',
    'importPartial': 'Imported {added} of {total} sites. Free limit is 3.',
    'openingHostApp': 'Opening Host App to complete purchase…',
    'upgradeOpenFailed': 'Could not open the app. Please launch No Lazy Load manually to complete the purchase.',
    'licenseFree': 'Free · up to 3 websites',
    'licensePro': 'Pro · unlimited websites',
    'licenseUpgrade': 'Upgrade to Pro',
    'licenseManage': 'Manage / Restore',
    'proBadge': 'PRO',
    'noticeSiteEnabled': 'Pro unlocked · {domain} was enabled',
    'purchaseUnavailable': 'Purchases are temporarily unavailable. Please try again later.',
    'currentWebsite': 'Current Website',
    'siteSwitchHelp': 'Load all images on this website without lazy loading.',
    'mode': 'Mode',
    'standardMode': 'Standard',
    'compatibilityMode': 'Compatibility',
    'standardModeHelp': "Loads images immediately using No Lazyload's normal engine.",
    'compatibilityModeHelp': 'Automatically scrolls the page to trigger images. Use this only when Standard mode does not work.',
    'enabledWebsites': 'Enabled Websites',
    'removeSite': 'Remove',
    'undo': 'Undo',
    'upgradeNote': 'Unlimited websites · One-time purchase, no subscription',
    'upgradePrice': 'One-time purchase',
    'oneTimePurchase': 'One-time purchase',
    'noSubscription': 'No subscription',
    'upgradeToPro': 'Upgrade to Pro',
    'notNow': 'Not Now',
    'upgradeBodyLimit': "You're using all 3 free websites. Upgrade once to enable No Lazyload on unlimited websites."
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
  },
  'ko': {
    'currentSite': '현재 사이트',
    'loading': '로딩 중...',
    'enabled': '활성화됨',
    'disabled': '비활성화됨',
    'notAvailable': '사용 불가',
    'nonWebPage': '웹 페이지가 아님',
    'cannotAdd': '추가할 수 없음',
    'addCurrentSite': '현재 사이트 추가',
    'removeCurrentSite': '현재 사이트 제거',
    'useAutoScroll': '기술 차단 대신 자동 스크롤 사용',
    'autoScrollDesc': '하단까지 자동 스크롤하여 로딩을 트리거합니다. 기술적 차단이 실패하는 사이트에 적합합니다',
    'configuredSites': '설정된 사이트',
    'noSites': '설정된 사이트가 없습니다',
    'fullSettings': '전체 설정',
    'refreshPage': '페이지 새로고침',
    'siteAdded': '{domain} 추가됨',
    'siteAddedWithScroll': '{domain} 추가됨 (자동 스크롤)',
    'siteRemoved': '{domain} 제거됨',
    'siteDeleted': '{domain} 삭제됨',
    'autoScrollEnabled': '자동 스크롤 활성화됨',
    'autoScrollDisabled': '자동 스크롤 비활성화됨',
    'pageRefreshed': '페이지가 새로고침되었습니다',
    'autoScroll': '자동 스크롤',
    'delete': '삭제',
    'author': '작성자',
    'tools': 'Kimi 2.5 + ClaudeCode + superpowers'
  },
  'bg': {
    'currentSite': 'Текущ сайт',
    'loading': 'Loading...',
    'enabled': 'Активирано',
    'disabled': 'Деактивирано',
    'notAvailable': 'Не е налично',
    'nonWebPage': 'Не е уеб страница',
    'cannotAdd': 'Не може да се добави',
    'addCurrentSite': 'Добавяне на текущия сайт',
    'removeCurrentSite': 'Премахване на текущия сайт',
    'useAutoScroll': 'Използвай автоматично превъртане',
    'autoScrollDesc': 'Превъртете автоматично надолу, за да задействате зареждането; подходящо за сайтове, където техническата блокировка не сработва',
    'configuredSites': 'Конфигурирани сайтове',
    'noSites': 'Няма конфигурирани сайтове',
    'fullSettings': 'Пълни настройки',
    'refreshPage': 'Опресняване на страницата',
    'siteAdded': 'Добавен {domain}',
    'siteAddedWithScroll': 'Добавен {domain} (Автоматично превъртане)',
    'siteRemoved': 'Премахнат {domain}',
    'siteDeleted': 'Изтрит {domain}',
    'autoScrollEnabled': 'Автоматичното превъртане е активирано',
    'autoScrollDisabled': 'Автоматичното превъртане е деактивирано',
    'pageRefreshed': 'Страницата е опреснена',
    'autoScroll': 'Автоматично превъртане',
    'delete': 'Delete',
    'author': 'от',
    'tools': 'Инструменти',
  },
  'ca': {
    'currentSite': 'Lloc actual',
    'loading': 'Loading...',
    'enabled': 'Habilitat',
    'disabled': 'Inhabilitat',
    'notAvailable': 'No disponible',
    'nonWebPage': 'Pàgina no web',
    'cannotAdd': 'No es pot afegir',
    'addCurrentSite': 'Afegeix el lloc actual',
    'removeCurrentSite': 'Elimina el lloc actual',
    'useAutoScroll': 'Fes servir el desplaçament automàtic',
    'autoScrollDesc': 'Desplaça automàticament cap avall per activar la càrrega; adequat per a llocs on el bloqueig tècnic falla',
    'configuredSites': 'Llocs configurats',
    'noSites': 'Cap lloc configurat',
    'fullSettings': 'Configuració completa',
    'refreshPage': 'Actualitza la pàgina',
    'siteAdded': 'Afegit {domain}',
    'siteAddedWithScroll': 'Afegit {domain} (Desplaçament automàtic)',
    'siteRemoved': 'Eliminat {domain}',
    'siteDeleted': 'Suprimit {domain}',
    'autoScrollEnabled': 'Desplaçament automàtic habilitat',
    'autoScrollDisabled': 'Desplaçament automàtic inhabilitat',
    'pageRefreshed': 'Pàgina actualitzada',
    'autoScroll': 'Desplaçament automàtic',
    'delete': 'Delete',
    'author': 'per',
    'tools': 'Eines',
  },
  'cs': {
    'currentSite': 'Aktuální stránka',
    'loading': 'Loading...',
    'enabled': 'Povoleno',
    'disabled': 'Zakázáno',
    'notAvailable': 'Nedostupné',
    'nonWebPage': 'Není webová stránka',
    'cannotAdd': 'Nelze přidat',
    'addCurrentSite': 'Přidat aktuální stránku',
    'removeCurrentSite': 'Odebrat aktuální stránku',
    'useAutoScroll': 'Použít automatické posouvání',
    'autoScrollDesc': 'Automaticky posuňte dolů pro spuštění načítání; vhodné pro stránky, kde technické blokování selže',
    'configuredSites': 'Nakonfigurované stránky',
    'noSites': 'Žádné nakonfigurované stránky',
    'fullSettings': 'Úplná nastavení',
    'refreshPage': 'Obnovit stránku',
    'siteAdded': 'Přidáno {domain}',
    'siteAddedWithScroll': 'Přidáno {domain} (Automatické posouvání)',
    'siteRemoved': 'Odebráno {domain}',
    'siteDeleted': 'Smazáno {domain}',
    'autoScrollEnabled': 'Automatické posouvání povoleno',
    'autoScrollDisabled': 'Automatické posouvání zakázáno',
    'pageRefreshed': 'Stránka obnovena',
    'autoScroll': 'Automatické posouvání',
    'delete': 'Delete',
    'author': 'od',
    'tools': 'Nástroje',
  },
  'da': {
    'currentSite': 'Aktuel hjemmeside',
    'loading': 'Loading...',
    'enabled': 'Aktiveret',
    'disabled': 'Deaktiveret',
    'notAvailable': 'Ikke tilgængelig',
    'nonWebPage': 'Ikke-web-side',
    'cannotAdd': 'Kan ikke tilføje',
    'addCurrentSite': 'Tilføj aktuel hjemmeside',
    'removeCurrentSite': 'Fjern aktuel hjemmeside',
    'useAutoScroll': 'Brug automatisk rulning',
    'autoScrollDesc': 'Rul automatisk til bunden for at udløse indlæsning; egnet til sider hvor teknisk blokering fejler',
    'configuredSites': 'Konfigurerede hjemmesider',
    'noSites': 'Ingen konfigurerede hjemmesider',
    'fullSettings': 'Fulde indstillinger',
    'refreshPage': 'Opdater side',
    'siteAdded': 'Tilføjet {domain}',
    'siteAddedWithScroll': 'Tilføjet {domain} (Automatisk rulning)',
    'siteRemoved': 'Fjernet {domain}',
    'siteDeleted': 'Slettet {domain}',
    'autoScrollEnabled': 'Automatisk rulning aktiveret',
    'autoScrollDisabled': 'Automatisk rulning deaktiveret',
    'pageRefreshed': 'Side opdateret',
    'autoScroll': 'Automatisk rulning',
    'delete': 'Delete',
    'author': 'af',
    'tools': 'Værktøjer',
  },
  'el': {
    'currentSite': 'Τρέχων ιστότοπος',
    'loading': 'Loading...',
    'enabled': 'Ενεργοποιημένο',
    'disabled': 'Απενεργοποιημένο',
    'notAvailable': 'Μη διαθέσιμο',
    'nonWebPage': 'Μη ιστοσελίδα',
    'cannotAdd': 'Δεν είναι δυνατή η προσθήκη',
    'addCurrentSite': 'Προσθήκη τρέχοντος ιστότοπου',
    'removeCurrentSite': 'Κατάργηση τρέχοντος ιστότοπου',
    'useAutoScroll': 'Χρήση αυτόματης κύλισης',
    'autoScrollDesc': 'Κυλήστε αυτόματα προς τα κάτω για να ενεργοποιήσετε τη φόρτωση· κατάλληλο για ιστότοπους όπου η τεχνική αποκλεισμού αποτυγχάνει',
    'configuredSites': 'Ρυθμισμένοι ιστότοποι',
    'noSites': 'Δεν υπάρχουν ρυθμισμένοι ιστότοποι',
    'fullSettings': 'Πλήρεις ρυθμίσεις',
    'refreshPage': 'Ανανέωση σελίδας',
    'siteAdded': 'Προστέθηκε {domain}',
    'siteAddedWithScroll': 'Προστέθηκε {domain} (Αυτόματη κύλιση)',
    'siteRemoved': 'Καταργήθηκε {domain}',
    'siteDeleted': 'Διαγράφηκε {domain}',
    'autoScrollEnabled': 'Η αυτόματη κύλιση είναι ενεργοποιημένη',
    'autoScrollDisabled': 'Η αυτόματη κύλιση είναι απενεργοποιημένη',
    'pageRefreshed': 'Η σελίδα ανανεώθηκε',
    'autoScroll': 'Αυτόματη κύλιση',
    'delete': 'Delete',
    'author': 'από',
    'tools': 'Εργαλεία',
  },
  'fa': {
    'currentSite': 'سایت فعلی',
    'loading': 'Loading...',
    'enabled': 'فعال',
    'disabled': 'غیرفعال',
    'notAvailable': 'در دسترس نیست',
    'nonWebPage': 'صفحه غیروب',
    'cannotAdd': 'افزودن ممکن نیست',
    'addCurrentSite': 'افزودن سایت فعلی',
    'removeCurrentSite': 'حذف سایت فعلی',
    'useAutoScroll': 'استفاده از پیمایش خودکار',
    'autoScrollDesc': 'برای شروع بارگذاری به‌صورت خودکار به پایین بپیمایید؛ مناسب برای سایت‌هایی که مسدودسازی فنی در آن‌ها شکست می‌خورد',
    'configuredSites': 'سایت‌های پیکربندی‌شده',
    'noSites': 'هیچ سایتی پیکربندی نشده است',
    'fullSettings': 'تنظیمات کامل',
    'refreshPage': 'بازخوانی صفحه',
    'siteAdded': '{domain} افزوده شد',
    'siteAddedWithScroll': '{domain} افزوده شد (پیمایش خودکار)',
    'siteRemoved': '{domain} حذف شد',
    'siteDeleted': '{domain} حذف شد',
    'autoScrollEnabled': 'پیمایش خودکار فعال شد',
    'autoScrollDisabled': 'پیمایش خودکار غیرفعال شد',
    'pageRefreshed': 'صفحه بازخوانی شد',
    'autoScroll': 'پیمایش خودکار',
    'delete': 'Delete',
    'author': 'توسط',
    'tools': 'ابزارها',
  },
  'fi': {
    'currentSite': 'Nykyinen sivusto',
    'loading': 'Loading...',
    'enabled': 'Käytössä',
    'disabled': 'Pois käytöstä',
    'notAvailable': 'Ei saatavilla',
    'nonWebPage': 'Muu kuin verkkosivu',
    'cannotAdd': 'Ei voi lisätä',
    'addCurrentSite': 'Lisää nykyinen sivusto',
    'removeCurrentSite': 'Poista nykyinen sivusto',
    'useAutoScroll': 'Käytä automaattista vieritystä',
    'autoScrollDesc': 'Vieritä automaattisesti alas käynnistääksesi lataamisen; sopii sivustoille, joissa tekninen esto epäonnistuu',
    'configuredSites': 'Määritetyt sivustot',
    'noSites': 'Ei määritettyjä sivustoja',
    'fullSettings': 'Täydet asetukset',
    'refreshPage': 'Päivitä sivu',
    'siteAdded': 'Lisätty {domain}',
    'siteAddedWithScroll': 'Lisätty {domain} (Automaattinen vieritys)',
    'siteRemoved': 'Poistettu {domain}',
    'siteDeleted': 'Poistettu {domain}',
    'autoScrollEnabled': 'Automaattinen vieritys käytössä',
    'autoScrollDisabled': 'Automaattinen vieritys pois käytöstä',
    'pageRefreshed': 'Sivu päivitetty',
    'autoScroll': 'Automaattinen vieritys',
    'delete': 'Delete',
    'author': 'tekijä',
    'tools': 'Työkalut',
  },
  'he': {
    'currentSite': 'האתר הנוכחי',
    'loading': 'Loading...',
    'enabled': 'מופעל',
    'disabled': 'מושבת',
    'notAvailable': 'לא זמין',
    'nonWebPage': 'לא דף אינטרנט',
    'cannotAdd': 'לא ניתן להוסיף',
    'addCurrentSite': 'הוסף את האתר הנוכחי',
    'removeCurrentSite': 'הסר את האתר הנוכחי',
    'useAutoScroll': 'השתמש בגלילה אוטומטית',
    'autoScrollDesc': 'גלול אוטומטית למטה כדי להפעיל את הטעינה; מתאים לאתרים שבהם החסימה הטכנית נכשלת',
    'configuredSites': 'אתרים מוגדרים',
    'noSites': 'אין אתרים מוגדרים',
    'fullSettings': 'הגדרות מלאות',
    'refreshPage': 'רענן דף',
    'siteAdded': 'נוסף {domain}',
    'siteAddedWithScroll': 'נוסף {domain} (גלילה אוטומטית)',
    'siteRemoved': 'הוסר {domain}',
    'siteDeleted': 'נמחק {domain}',
    'autoScrollEnabled': 'גלילה אוטומטית מופעלת',
    'autoScrollDisabled': 'גלילה אוטומטית מושבתת',
    'pageRefreshed': 'הדף רוענן',
    'autoScroll': 'גלילה אוטומטית',
    'delete': 'Delete',
    'author': 'מאת',
    'tools': 'כלים',
  },
  'hr': {
    'currentSite': 'Trenutna stranica',
    'loading': 'Loading...',
    'enabled': 'Omogućeno',
    'disabled': 'Onemogućeno',
    'notAvailable': 'Nedostupno',
    'nonWebPage': 'Nije web-stranica',
    'cannotAdd': 'Ne mogu dodati',
    'addCurrentSite': 'Dodaj trenutnu stranicu',
    'removeCurrentSite': 'Ukloni trenutnu stranicu',
    'useAutoScroll': 'Koristi automatsko pomicanje',
    'autoScrollDesc': 'Automatski se pomaknite prema dolje da biste pokrenuli učitavanje; pogodno za stranice gdje tehničko blokiranje ne uspijeva',
    'configuredSites': 'Konfigurirane stranice',
    'noSites': 'Nema konfiguriranih stranica',
    'fullSettings': 'Potpune postavke',
    'refreshPage': 'Osvježi stranicu',
    'siteAdded': 'Dodana {domain}',
    'siteAddedWithScroll': 'Dodana {domain} (Automatsko pomicanje)',
    'siteRemoved': 'Uklonjena {domain}',
    'siteDeleted': 'Izbrisana {domain}',
    'autoScrollEnabled': 'Automatsko pomicanje omogućeno',
    'autoScrollDisabled': 'Automatsko pomicanje onemogućeno',
    'pageRefreshed': 'Stranica osvježena',
    'autoScroll': 'Automatsko pomicanje',
    'delete': 'Delete',
    'author': 'od',
    'tools': 'Alati',
  },
  'hu': {
    'currentSite': 'Jelenlegi oldal',
    'loading': 'Loading...',
    'enabled': 'Engedélyezve',
    'disabled': 'Letiltva',
    'notAvailable': 'Nem elérhető',
    'nonWebPage': 'Nem weboldal',
    'cannotAdd': 'Nem adható hozzá',
    'addCurrentSite': 'Jelenlegi oldal hozzáadása',
    'removeCurrentSite': 'Jelenlegi oldal eltávolítása',
    'useAutoScroll': 'Automatikus görgetés használata',
    'autoScrollDesc': 'Görgessen automatikusan az aljára a betöltés indításához; olyan oldalakhoz megfelelő, ahol a technikai blokkolás nem működik',
    'configuredSites': 'Beállított oldalak',
    'noSites': 'Nincsenek beállított oldalak',
    'fullSettings': 'Teljes beállítások',
    'refreshPage': 'Oldal frissítése',
    'siteAdded': 'Hozzáadva: {domain}',
    'siteAddedWithScroll': 'Hozzáadva: {domain} (Automatikus görgetés)',
    'siteRemoved': 'Eltávolítva: {domain}',
    'siteDeleted': 'Törölve: {domain}',
    'autoScrollEnabled': 'Automatikus görgetés engedélyezve',
    'autoScrollDisabled': 'Automatikus görgetés letiltva',
    'pageRefreshed': 'Oldal frissítve',
    'autoScroll': 'Automatikus görgetés',
    'delete': 'Delete',
    'author': 'készítette:',
    'tools': 'Eszközök',
  },
  'id': {
    'currentSite': 'Situs Saat Ini',
    'loading': 'Loading...',
    'enabled': 'Aktif',
    'disabled': 'Nonaktif',
    'notAvailable': 'Tidak Tersedia',
    'nonWebPage': 'Bukan Halaman Web',
    'cannotAdd': 'Tidak Dapat Menambahkan',
    'addCurrentSite': 'Tambah Situs Saat Ini',
    'removeCurrentSite': 'Hapus Situs Saat Ini',
    'useAutoScroll': 'Gunakan Gulir Otomatis',
    'autoScrollDesc': 'Gulir otomatis ke bawah untuk memicu pemuatan; cocok untuk situs di mana pemblokiran teknis gagal',
    'configuredSites': 'Situs yang Dikonfigurasi',
    'noSites': 'Tidak ada situs yang dikonfigurasi',
    'fullSettings': 'Pengaturan Lengkap',
    'refreshPage': 'Muat Ulang Halaman',
    'siteAdded': 'Ditambahkan {domain}',
    'siteAddedWithScroll': 'Ditambahkan {domain} (Gulir Otomatis)',
    'siteRemoved': 'Dihapus {domain}',
    'siteDeleted': 'Dihapus {domain}',
    'autoScrollEnabled': 'Gulir otomatis aktif',
    'autoScrollDisabled': 'Gulir otomatis nonaktif',
    'pageRefreshed': 'Halaman dimuat ulang',
    'autoScroll': 'Gulir otomatis',
    'delete': 'Delete',
    'author': 'oleh',
    'tools': 'Alat',
  },
  'it': {
    'currentSite': 'Sito corrente',
    'loading': 'Loading...',
    'enabled': 'Attivo',
    'disabled': 'Disattivo',
    'notAvailable': 'Non disponibile',
    'nonWebPage': 'Pagina non web',
    'cannotAdd': 'Impossibile aggiungere',
    'addCurrentSite': 'Aggiungi sito corrente',
    'removeCurrentSite': 'Rimuovi sito corrente',
    'useAutoScroll': 'Usa scorrimento automatico',
    'autoScrollDesc': 'Scorri automaticamente fino in fondo per attivare il caricamento; adatto ai siti in cui il blocco tecnico fallisce',
    'configuredSites': 'Siti configurati',
    'noSites': 'Nessun sito configurato',
    'fullSettings': 'Impostazioni complete',
    'refreshPage': 'Aggiorna pagina',
    'siteAdded': 'Aggiunto {domain}',
    'siteAddedWithScroll': 'Aggiunto {domain} (Scorrimento automatico)',
    'siteRemoved': 'Rimosso {domain}',
    'siteDeleted': 'Eliminato {domain}',
    'autoScrollEnabled': 'Scorrimento automatico attivo',
    'autoScrollDisabled': 'Scorrimento automatico disattivo',
    'pageRefreshed': 'Pagina aggiornata',
    'autoScroll': 'Scorrimento automatico',
    'delete': 'Delete',
    'author': 'di',
    'tools': 'Strumenti',
  },
  'nb': {
    'currentSite': 'Gjeldende nettsted',
    'loading': 'Loading...',
    'enabled': 'Aktivert',
    'disabled': 'Deaktivert',
    'notAvailable': 'Ikke tilgjengelig',
    'nonWebPage': 'Ikke-nettleserside',
    'cannotAdd': 'Kan ikke legge til',
    'addCurrentSite': 'Legg til gjeldende nettsted',
    'removeCurrentSite': 'Fjern gjeldende nettsted',
    'useAutoScroll': 'Bruk automatisk rulling',
    'autoScrollDesc': 'Rull automatisk til bunnen for å utløse lasting; egnet for nettsteder der teknisk blokkering feiler',
    'configuredSites': 'Konfigurerte nettsteder',
    'noSites': 'Ingen konfigurerte nettsteder',
    'fullSettings': 'Fullstendige innstillinger',
    'refreshPage': 'Oppdater side',
    'siteAdded': 'Lagt til {domain}',
    'siteAddedWithScroll': 'Lagt til {domain} (Automatisk rulling)',
    'siteRemoved': 'Fjernet {domain}',
    'siteDeleted': 'Slettet {domain}',
    'autoScrollEnabled': 'Automatisk rulling aktivert',
    'autoScrollDisabled': 'Automatisk rulling deaktivert',
    'pageRefreshed': 'Siden oppdatert',
    'autoScroll': 'Automatisk rulling',
    'delete': 'Delete',
    'author': 'av',
    'tools': 'Verktøy',
  },
  'nl': {
    'currentSite': 'Huidige site',
    'loading': 'Loading...',
    'enabled': 'Ingeschakeld',
    'disabled': 'Uitgeschakeld',
    'notAvailable': 'Niet beschikbaar',
    'nonWebPage': 'Geen webpagina',
    'cannotAdd': 'Kan niet toevoegen',
    'addCurrentSite': 'Huidige site toevoegen',
    'removeCurrentSite': 'Huidige site verwijderen',
    'useAutoScroll': 'Gebruik automatisch scrollen',
    'autoScrollDesc': 'Scroll automatisch naar beneden om laden te activeren; geschikt voor sites waar technische blokkering faalt',
    'configuredSites': 'Geconfigureerde sites',
    'noSites': 'Geen geconfigureerde sites',
    'fullSettings': 'Volledige instellingen',
    'refreshPage': 'Pagina vernieuwen',
    'siteAdded': '{domain} toegevoegd',
    'siteAddedWithScroll': '{domain} toegevoegd (Automatisch scrollen)',
    'siteRemoved': '{domain} verwijderd',
    'siteDeleted': '{domain} verwijderd',
    'autoScrollEnabled': 'Automatisch scrollen ingeschakeld',
    'autoScrollDisabled': 'Automatisch scrollen uitgeschakeld',
    'pageRefreshed': 'Pagina vernieuwd',
    'autoScroll': 'Automatisch scrollen',
    'delete': 'Delete',
    'author': 'door',
    'tools': 'Hulpmiddelen',
  },
  'pl': {
    'currentSite': 'Bieżąca strona',
    'loading': 'Loading...',
    'enabled': 'Włączone',
    'disabled': 'Wyłączone',
    'notAvailable': 'Niedostępne',
    'nonWebPage': 'Strona niebędąca stroną internetową',
    'cannotAdd': 'Nie można dodać',
    'addCurrentSite': 'Dodaj bieżącą stronę',
    'removeCurrentSite': 'Usuń bieżącą stronę',
    'useAutoScroll': 'Użyj automatycznego przewijania',
    'autoScrollDesc': 'Automatycznie przewiń do dołu, aby wyzwolić ładowanie; przydatne na stronach, gdzie blokada techniczna zawodzi',
    'configuredSites': 'Skonfigurowane strony',
    'noSites': 'Brak skonfigurowanych stron',
    'fullSettings': 'Pełne ustawienia',
    'refreshPage': 'Odśwież stronę',
    'siteAdded': 'Dodano {domain}',
    'siteAddedWithScroll': 'Dodano {domain} (Autoprzewijanie)',
    'siteRemoved': 'Usunięto {domain}',
    'siteDeleted': 'Usunięto {domain}',
    'autoScrollEnabled': 'Autoprzewijanie włączone',
    'autoScrollDisabled': 'Autoprzewijanie wyłączone',
    'pageRefreshed': 'Strona odświeżona',
    'autoScroll': 'Autoprzewijanie',
    'delete': 'Delete',
    'author': 'przez',
    'tools': 'Narzędzia',
  },
  'ps': {
    'currentSite': 'اوسنی سایټ',
    'loading': 'Loading...',
    'enabled': 'فعال',
    'disabled': 'غیر فعال',
    'notAvailable': 'شتون نلري',
    'nonWebPage': 'غیر ویب پاڼه',
    'cannotAdd': 'نشي زیاتولی',
    'addCurrentSite': 'اوسنی سایټ زیات کړئ',
    'removeCurrentSite': 'اوسنی سایټ لرې کړئ',
    'useAutoScroll': 'اتوماتیک سکرول کارول',
    'autoScrollDesc': 'د بار کولو د فعالولو لپاره اتوماتیک ښکته سکرول کړئ؛ د هغو سایټونو لپاره مناسب چیرې چې تخنیکي بندیز ناکامیږي',
    'configuredSites': 'ترتیب شوي سایټونه',
    'noSites': 'هیڅ ترتیب شوی سایټ نشته',
    'fullSettings': 'مکمل تنظیمات',
    'refreshPage': 'پاڼه تازه کړئ',
    'siteAdded': '{domain} زیات شو',
    'siteAddedWithScroll': '{domain} زیات شو (اتوماتیک سکرول)',
    'siteRemoved': '{domain} لرې شو',
    'siteDeleted': '{domain} ګذارل شو',
    'autoScrollEnabled': 'اتوماتیک سکرول فعال دی',
    'autoScrollDisabled': 'اتوماتیک سکرول غیر فعال دی',
    'pageRefreshed': 'پاڼه تازه شوه',
    'autoScroll': 'اتوماتیک سکرول',
    'delete': 'Delete',
    'author': 'له خوا',
    'tools': 'اوزارونه',
  },
  'ro': {
    'currentSite': 'Site curent',
    'loading': 'Loading...',
    'enabled': 'Activat',
    'disabled': 'Dezactivat',
    'notAvailable': 'Indisponibil',
    'nonWebPage': 'Pagină non-web',
    'cannotAdd': 'Nu se poate adăuga',
    'addCurrentSite': 'Adaugă site-ul curent',
    'removeCurrentSite': 'Elimină site-ul curent',
    'useAutoScroll': 'Folosește derularea automată',
    'autoScrollDesc': 'Derulează automat în jos pentru a declanșa încărcarea; potrivit pentru site-urile unde blocarea tehnică eșuează',
    'configuredSites': 'Site-uri configurate',
    'noSites': 'Niciun site configurat',
    'fullSettings': 'Setări complete',
    'refreshPage': 'Reîmprospătează pagina',
    'siteAdded': 'Adăugat {domain}',
    'siteAddedWithScroll': 'Adăugat {domain} (Derulare automată)',
    'siteRemoved': 'Eliminat {domain}',
    'siteDeleted': 'Șters {domain}',
    'autoScrollEnabled': 'Derulare automată activată',
    'autoScrollDisabled': 'Derulare automată dezactivată',
    'pageRefreshed': 'Pagina reîmprospătată',
    'autoScroll': 'Derulare automată',
    'delete': 'Delete',
    'author': 'de',
    'tools': 'Instrumente',
  },
  'sk': {
    'currentSite': 'Aktuálna stránka',
    'loading': 'Loading...',
    'enabled': 'Povolené',
    'disabled': 'Zakázané',
    'notAvailable': 'Nedostupné',
    'nonWebPage': 'Nie je webová stránka',
    'cannotAdd': 'Nedá sa pridať',
    'addCurrentSite': 'Pridať aktuálnu stránku',
    'removeCurrentSite': 'Odstrániť aktuálnu stránku',
    'useAutoScroll': 'Použiť automatické posúvanie',
    'autoScrollDesc': 'Automaticky posuňte nadol na spustenie načítavania; vhodné pre stránky, kde technické blokovanie zlyhá',
    'configuredSites': 'Nakonfigurované stránky',
    'noSites': 'Žiadne nakonfigurované stránky',
    'fullSettings': 'Úplné nastavenia',
    'refreshPage': 'Obnoviť stránku',
    'siteAdded': 'Pridané {domain}',
    'siteAddedWithScroll': 'Pridané {domain} (Automatické posúvanie)',
    'siteRemoved': 'Odstránené {domain}',
    'siteDeleted': 'Vymazané {domain}',
    'autoScrollEnabled': 'Automatické posúvanie povolené',
    'autoScrollDisabled': 'Automatické posúvanie zakázané',
    'pageRefreshed': 'Stránka obnovená',
    'autoScroll': 'Automatické posúvanie',
    'delete': 'Delete',
    'author': 'od',
    'tools': 'Nástroje',
  },
  'sv': {
    'currentSite': 'Aktuell webbplats',
    'loading': 'Loading...',
    'enabled': 'Aktiverad',
    'disabled': 'Inaktiverad',
    'notAvailable': 'Inte tillgänglig',
    'nonWebPage': 'Icke-webbplats',
    'cannotAdd': 'Kan inte lägga till',
    'addCurrentSite': 'Lägg till aktuell webbplats',
    'removeCurrentSite': 'Ta bort aktuell webbplats',
    'useAutoScroll': 'Använd automatisk rullning',
    'autoScrollDesc': 'Rulla automatiskt till botten för att utlösa inladdning; lämpligt för webbplatser där teknisk blockering misslyckas',
    'configuredSites': 'Konfigurerade webbplatser',
    'noSites': 'Inga konfigurerade webbplatser',
    'fullSettings': 'Fullständiga inställningar',
    'refreshPage': 'Uppdatera sida',
    'siteAdded': 'Tillagd {domain}',
    'siteAddedWithScroll': 'Tillagd {domain} (Automatisk rullning)',
    'siteRemoved': 'Borttagen {domain}',
    'siteDeleted': 'Raderad {domain}',
    'autoScrollEnabled': 'Automatisk rullning aktiverad',
    'autoScrollDisabled': 'Automatisk rullning inaktiverad',
    'pageRefreshed': 'Sidan uppdaterad',
    'autoScroll': 'Automatisk rullning',
    'delete': 'Delete',
    'author': 'av',
    'tools': 'Verktyg',
  },
  'th': {
    'currentSite': 'เว็บไซต์ปัจจุบัน',
    'loading': 'Loading...',
    'enabled': 'เปิดใช้งาน',
    'disabled': 'ปิดใช้งาน',
    'notAvailable': 'ไม่พร้อมใช้งาน',
    'nonWebPage': 'ไม่ใช่หน้าเว็บ',
    'cannotAdd': 'ไม่สามารถเพิ่มได้',
    'addCurrentSite': 'เพิ่มเว็บไซต์ปัจจุบัน',
    'removeCurrentSite': 'ลบเว็บไซต์ปัจจุบัน',
    'useAutoScroll': 'ใช้การเลื่อนอัตโนมัติ',
    'autoScrollDesc': 'เลื่อนอัตโนมัติลงด้านล่างเพื่อกระตุ้นการโหลด เหมาะสำหรับเว็บไซต์ที่การบล็อกแบบเทคนิคล้มเหลว',
    'configuredSites': 'เว็บไซต์ที่กำหนดค่าแล้ว',
    'noSites': 'ยังไม่มีเว็บไซต์ที่กำหนดค่า',
    'fullSettings': 'การตั้งค่าแบบเต็ม',
    'refreshPage': 'รีเฟรชหน้า',
    'siteAdded': 'เพิ่ม {domain} แล้ว',
    'siteAddedWithScroll': 'เพิ่ม {domain} แล้ว (เลื่อนอัตโนมัติ)',
    'siteRemoved': 'ลบ {domain} แล้ว',
    'siteDeleted': 'ลบ {domain} แล้ว',
    'autoScrollEnabled': 'เปิดใช้งานการเลื่อนอัตโนมัติ',
    'autoScrollDisabled': 'ปิดใช้งานการเลื่อนอัตโนมัติ',
    'pageRefreshed': 'รีเฟรชหน้าแล้ว',
    'autoScroll': 'เลื่อนอัตโนมัติ',
    'delete': 'Delete',
    'author': 'โดย',
    'tools': 'เครื่องมือ',
  },
  'tr': {
    'currentSite': 'Geçerli Site',
    'loading': 'Loading...',
    'enabled': 'Etkin',
    'disabled': 'Devre Dışı',
    'notAvailable': 'Mevcut Değil',
    'nonWebPage': 'Web Olmayan Sayfa',
    'cannotAdd': 'Eklenemiyor',
    'addCurrentSite': 'Geçerli Siteyi Ekle',
    'removeCurrentSite': 'Geçerli Siteyi Kaldır',
    'useAutoScroll': 'Otomatik Kaydırmayı Kullan',
    'autoScrollDesc': 'Yüklemeyi tetiklemek için otomatik olarak en alta kaydır; teknik engellemenin başarısız olduğu siteler için uygundur',
    'configuredSites': 'Yapılandırılmış Siteler',
    'noSites': 'Yapılandırılmış site yok',
    'fullSettings': 'Tüm Ayarlar',
    'refreshPage': 'Sayfayı Yenile',
    'siteAdded': '{domain} eklendi',
    'siteAddedWithScroll': '{domain} eklendi (Otomatik Kaydırma)',
    'siteRemoved': '{domain} kaldırıldı',
    'siteDeleted': '{domain} silindi',
    'autoScrollEnabled': 'Otomatik kaydırma etkin',
    'autoScrollDisabled': 'Otomatik kaydırma devre dışı',
    'pageRefreshed': 'Sayfa yenilendi',
    'autoScroll': 'Otomatik kaydırma',
    'delete': 'Delete',
    'author': 'tarafından',
    'tools': 'Araçlar',
  },
  'uk': {
    'currentSite': 'Поточний сайт',
    'loading': 'Loading...',
    'enabled': 'Увімкнено',
    'disabled': 'Вимкнено',
    'notAvailable': 'Недоступно',
    'nonWebPage': 'Не вебсторінка',
    'cannotAdd': 'Не вдалося додати',
    'addCurrentSite': 'Додати поточний сайт',
    'removeCurrentSite': 'Видалити поточний сайт',
    'useAutoScroll': 'Використовувати автопрокрутку',
    'autoScrollDesc': 'Автоматично прокручуйте вниз, щоб запустити завантаження; підходить для сайтів, де технічне блокування не спрацьовує',
    'configuredSites': 'Налаштовані сайти',
    'noSites': 'Немає налаштованих сайтів',
    'fullSettings': 'Повні налаштування',
    'refreshPage': 'Оновити сторінку',
    'siteAdded': 'Додано {domain}',
    'siteAddedWithScroll': 'Додано {domain} (Автопрокрутка)',
    'siteRemoved': 'Видалено {domain}',
    'siteDeleted': 'Видалено {domain}',
    'autoScrollEnabled': 'Автопрокрутку увімкнено',
    'autoScrollDisabled': 'Автопрокрутку вимкнено',
    'pageRefreshed': 'Сторінку оновлено',
    'autoScroll': 'Автопрокрутка',
    'delete': 'Delete',
    'author': 'автор',
    'tools': 'Інструменти',
  },
  'ur': {
    'currentSite': 'موجودہ سائٹ',
    'loading': 'Loading...',
    'enabled': 'فعال',
    'disabled': 'غیر فعال',
    'notAvailable': 'دستیاب نہیں',
    'nonWebPage': 'غیر ویب صفحہ',
    'cannotAdd': 'شامل نہیں کر سکتے',
    'addCurrentSite': 'موجودہ سائٹ شامل کریں',
    'removeCurrentSite': 'موجودہ سائٹ ہٹائیں',
    'useAutoScroll': 'خودکار سکرول استعمال کریں',
    'autoScrollDesc': 'لوڈنگ کو متحرک کرنے کے لیے خودکار نیچے اسکرول کریں؛ ان سائٹس کے لیے موزوں جنہیں تکنیکی روک غیر مؤثر ہے',
    'configuredSites': 'ترتیب دی گئی سائٹس',
    'noSites': 'کوئی ترتیب دی گئی سائٹ نہیں',
    'fullSettings': 'مکمل ترتیبات',
    'refreshPage': 'صفحہ ریفریش کریں',
    'siteAdded': '{domain} شامل کیا گیا',
    'siteAddedWithScroll': '{domain} شامل کیا گیا (خودکار سکرول)',
    'siteRemoved': '{domain} ہٹایا گیا',
    'siteDeleted': '{domain} حذف کیا گیا',
    'autoScrollEnabled': 'خودکار سکرول فعال',
    'autoScrollDisabled': 'خودکار سکرول غیر فعال',
    'pageRefreshed': 'صفحہ ریفریش ہو گیا',
    'autoScroll': 'خودکار سکرول',
    'delete': 'Delete',
    'author': 'از',
    'tools': 'اوزار',
  },
  'vi': {
    'currentSite': 'Trang hiện tại',
    'loading': 'Loading...',
    'enabled': 'Đã bật',
    'disabled': 'Đã tắt',
    'notAvailable': 'Không khả dụng',
    'nonWebPage': 'Trang không phải web',
    'cannotAdd': 'Không thể thêm',
    'addCurrentSite': 'Thêm trang hiện tại',
    'removeCurrentSite': 'Xóa trang hiện tại',
    'useAutoScroll': 'Dùng tự động cuộn',
    'autoScrollDesc': 'Tự động cuộn xuống dưới để kích hoạt tải; phù hợp với các trang mà chặn kỹ thuật thất bại',
    'configuredSites': 'Các trang đã cấu hình',
    'noSites': 'Chưa có trang nào được cấu hình',
    'fullSettings': 'Cài đặt đầy đủ',
    'refreshPage': 'Làm mới trang',
    'siteAdded': 'Đã thêm {domain}',
    'siteAddedWithScroll': 'Đã thêm {domain} (Tự động cuộn)',
    'siteRemoved': 'Đã xóa {domain}',
    'siteDeleted': 'Đã xóa {domain}',
    'autoScrollEnabled': 'Đã bật tự động cuộn',
    'autoScrollDisabled': 'Đã tắt tự động cuộn',
    'pageRefreshed': 'Trang đã làm mới',
    'autoScroll': 'Tự động cuộn',
    'delete': 'Delete',
    'author': 'bởi',
    'tools': 'Công cụ',
  },
  'zh_HK': {
    'currentSite': '目前網站',
    'loading': 'Loading...',
    'enabled': '已啟用',
    'disabled': '未啟用',
    'notAvailable': '不可用',
    'nonWebPage': '非網頁頁面',
    'cannotAdd': '無法加入',
    'addCurrentSite': '加入目前網站',
    'removeCurrentSite': '移除目前網站',
    'useAutoScroll': '使用自動捲動代替技術攔截',
    'autoScrollDesc': '自動捲動到底部觸發載入，適合技術攔截失效的網站',
    'configuredSites': '已設定的網站',
    'noSites': '暫無設定的網站',
    'fullSettings': '完整設定',
    'refreshPage': '重新整理頁面',
    'siteAdded': '已加入 {domain}',
    'siteAddedWithScroll': '已加入 {domain}（自動捲動）',
    'siteRemoved': '已移除 {domain}',
    'siteDeleted': '已刪除 {domain}',
    'autoScrollEnabled': '已開啟自動捲動',
    'autoScrollDisabled': '已關閉自動捲動',
    'pageRefreshed': '頁面已重新整理',
    'autoScroll': '自動捲動',
    'delete': 'Delete',
    'author': '作者',
    'tools': '開發工具',
  },
  'zh_TW': {
    'currentSite': '目前網站',
    'loading': 'Loading...',
    'enabled': '已啟用',
    'disabled': '未啟用',
    'notAvailable': '不可用',
    'nonWebPage': '非網頁頁面',
    'cannotAdd': '無法加入',
    'addCurrentSite': '加入目前網站',
    'removeCurrentSite': '移除目前網站',
    'useAutoScroll': '使用自動捲動代替技術攔截',
    'autoScrollDesc': '自動捲動到底部觸發載入，適合技術攔截失效的網站',
    'configuredSites': '已設定的網站',
    'noSites': '暫無設定的網站',
    'fullSettings': '完整設定',
    'refreshPage': '重新整理頁面',
    'siteAdded': '已加入 {domain}',
    'siteAddedWithScroll': '已加入 {domain}（自動捲動）',
    'siteRemoved': '已移除 {domain}',
    'siteDeleted': '已刪除 {domain}',
    'autoScrollEnabled': '已開啟自動捲動',
    'autoScrollDisabled': '已關閉自動捲動',
    'pageRefreshed': '頁面已重新整理',
    'autoScroll': '自動捲動',
    'delete': 'Delete',
    'author': '作者',
    'tools': '開發工具',
  },

};

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
 */
function t(key, replacements = {}) {
  const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'] || TRANSLATIONS['zh'];
  // 回退顺序：当前语言 → en → zh → key 本身
  let text = lang[key] || (TRANSLATIONS['en'] && TRANSLATIONS['en'][key]) || (TRANSLATIONS['zh'] && TRANSLATIONS['zh'][key]) || key;

  Object.keys(replacements).forEach(function (placeholder) {
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
 * 当前授权模式（UI 只认这一个判断）
 * @returns {'unrestricted'|'free'|'pro'}
 */
function getLicenseMode() {
  if (!_entitlementState.isLimitEnforced) return LICENSE_MODES.UNRESTRICTED;
  return _entitlementState.entitlements.includes(ENTITLEMENTS.UNLIMITED_SITES)
    ? LICENSE_MODES.PRO
    : LICENSE_MODES.FREE;
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
      notice.textContent = t('purchaseUnavailable');
    }
    return;
  }

  if (notice) notice.hidden = true;

  if (mode === LICENSE_MODES.FREE) {
    if (upgradeGroup) upgradeGroup.hidden = false;
    if (manageBtn) manageBtn.textContent = t('licenseUpgrade');
    if (upgradeNote) upgradeNote.textContent = t('upgradeNote');
  } else if (upgradeGroup) {
    upgradeGroup.hidden = true;
  }
}

// ===== 升级弹窗（plan Phase E）=====

/**
 * 显示升级弹窗。
 * @param {{price?: string|null}} [options]
 * @returns {Promise<boolean>} true=用户点击 Upgrade
 */
function showUpgradeDialog({ price } = {}) {
  return new Promise(function (resolve) {
    const existing = document.getElementById('upgradeDialogOverlay');
    if (existing) existing.remove();

    const previouslyFocused = document.activeElement;

    const overlay = document.createElement('div');
    overlay.id = 'upgradeDialogOverlay';
    overlay.className = 'nl-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-labelledby', 'upgradeDialogTitle');

    const dialog = document.createElement('div');
    dialog.className = 'nl-dialog';

    const title = document.createElement('h2');
    title.id = 'upgradeDialogTitle';
    title.className = 'nl-dialog-title';
    title.textContent = t('upgradeTitle');

    const body = document.createElement('p');
    body.className = 'nl-dialog-body';
    body.textContent = t('upgradeBodyLimit');

    const priceLine = document.createElement('p');
    priceLine.className = 'nl-dialog-body';
    // 没取到真实价格时只说"一次性购买"，绝不显示硬编码价格
    priceLine.textContent = price ? price + ' · ' + t('oneTimePurchase') : t('upgradePrice');

    const subline = document.createElement('p');
    subline.className = 'nl-dialog-body';
    subline.textContent = t('noSubscription');

    const actions = document.createElement('div');
    actions.className = 'nl-dialog-actions';

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'nl-btn';
    cancelBtn.textContent = t('notNow');

    const upgradeBtn = document.createElement('button');
    upgradeBtn.type = 'button';
    upgradeBtn.className = 'nl-btn nl-btn-primary';
    upgradeBtn.textContent = t('upgradeToPro');

    actions.append(cancelBtn, upgradeBtn);
    dialog.append(title, body, priceLine, subline, actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = function (result) {
      overlay.remove();
      document.removeEventListener('keydown', onKey);
      // 焦点回到触发控件（plan Task F1）
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') previouslyFocused.focus();
      resolve(result);
    };

    const onKey = function (e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        close(false);
        return;
      }
      // 焦点困在弹窗内
      if (e.key === 'Tab') {
        const focusables = [cancelBtn, upgradeBtn];
        const index = focusables.indexOf(document.activeElement);
        const next = e.shiftKey
          ? focusables[(index - 1 + focusables.length) % focusables.length]
          : focusables[(index + 1) % focusables.length];
        e.preventDefault();
        next.focus();
      }
    };

    cancelBtn.addEventListener('click', function () { close(false); });
    upgradeBtn.addEventListener('click', function () { close(true); });
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(false); });
    document.addEventListener('keydown', onKey);
    cancelBtn.focus();
  });
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
  const wantUpgrade = await showUpgradeDialog({ price: _entitlementState.price || null });
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
    removeBtn.textContent = '−';

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
