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
    domainSpan.textContent = domain;

    const scrollLabel = document.createElement('label');
    scrollLabel.className = 'scroll-toggle';
    scrollLabel.title = t('useAutoScroll');
    const scrollCheckbox = document.createElement('input');
    scrollCheckbox.type = 'checkbox';
    scrollCheckbox.dataset.domain = domain;
    if (isScrollEnabled) scrollCheckbox.checked = true;
    const scrollText = document.createElement('span');
    scrollText.textContent = t('autoScroll');
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
