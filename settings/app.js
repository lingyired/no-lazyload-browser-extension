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
    'languageSaved': "语言设置已保存",
    'advancedSettings': '高级设置',
    'lazyAttributes': '懒加载属性',
    'lazyAttributesHelp': '检测这些属性来加载图片，用逗号分隔',
    'placeholderPatterns': '占位符检测',
    'placeholderPatternsHelp': '如果图片 src 包含这些关键词，将被视为占位符并替换，用逗号分隔',
    'resetToDefault': '重置为默认',
    'attributesSaved': '属性配置已保存',
    'attributesReset': '已恢复为默认配置',
    'save': '保存',
    'otherExtensions': '作者的其他扩展',
    'newtab01Desc': '书签驱动的新标签页。将文件夹作为标签组或分屏打开。12 个内置主题 + 无限自定义主题。'
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
    'languageSaved': "Language saved",
    'advancedSettings': 'Advanced Settings',
    'lazyAttributes': 'Lazy Load Attributes',
    'lazyAttributesHelp': 'Detect these attributes to load images, comma-separated',
    'placeholderPatterns': 'Placeholder Detection',
    'placeholderPatternsHelp': 'Images with src containing these keywords will be treated as placeholders, comma-separated',
    'resetToDefault': 'Reset to Default',
    'attributesSaved': 'Attributes saved',
    'attributesReset': 'Reset to default configuration',
    'save': 'Save',
    'otherExtensions': 'More Extensions by the Author',
    'newtab01Desc': 'Bookmark-driven new tab. Open folders as tab groups or in split view. 12 built-in themes + unlimited custom themes.'
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
    'languageSaved': "Idioma guardado",
    'advancedSettings': 'Configuración Avanzada',
    'lazyAttributes': 'Atributos de Carga Perezosa',
    'lazyAttributesHelp': 'Detectar estos atributos para cargar imágenes, separados por comas',
    'placeholderPatterns': 'Detección de Marcadores',
    'placeholderPatternsHelp': 'Las imágenes con src que contengan estas palabras clave se tratarán como marcadores, separados por comas',
    'resetToDefault': 'Restablecer por Defecto',
    'attributesSaved': 'Atributos guardados',
    'attributesReset': 'Restablecido a configuración predeterminada',
    'save': 'Guardar',
    'otherExtensions': 'Más Extensiones del Autor',
    'newtab01Desc': 'Nueva pestaña basada en marcadores. Abre carpetas como grupos de pestañas o en vista dividida. 12 temas integrados + temas personalizados ilimitados.'
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
    'languageSaved': "تم حفظ اللغة",
    'advancedSettings': 'إعدادات متقدمة',
    'lazyAttributes': 'سمات التحميل الكسول',
    'lazyAttributesHelp': 'اكتشاف هذه السمات لتحميل الصور، مفصولة بفاصلة',
    'placeholderPatterns': 'كشف العناصر النائبة',
    'placeholderPatternsHelp': 'سيتم معاملة الصور التي تحتوي على src تحتوي على هذه الكلمات الرئيسية كعناصر نائبة، مفصولة بفاصلة',
    'resetToDefault': 'إعادة تعيين للافتراضي',
    'attributesSaved': 'تم حفظ السمات',
    'attributesReset': 'تمت إعادة التعيين إلى الإعدادات الافتراضية',
    'save': 'حفظ',
    'otherExtensions': 'المزيد من الإضافات من المؤلف',
    'newtab01Desc': 'علامة تبويب جديدة مدفوعة بالإشارات المرجعية. افتح المجلدات كمجموعات علامات تبويب أو في عرض مقسم. 12 سمًا مدمجًا + سمات مخصصة غير محدودة.'
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
    'languageSaved': "भाषा सहेजी गई",
    'advancedSettings': 'उन्नत सेटिंग्स',
    'lazyAttributes': 'लेजी लोड गुण',
    'lazyAttributesHelp': 'छवियों को लोड करने के लिए इन गुणों का पता लगाएं, अल्पविराम से अलग',
    'placeholderPatterns': 'प्लेसहोल्डर का पता लगाना',
    'placeholderPatternsHelp': 'src में इन कीवर्ड वाली छवियों को प्लेसहोल्डर के रूप में माना जाएगा, अल्पविराम से अलग',
    'resetToDefault': 'डिफ़ॉल्ट पर रीसेट करें',
    'attributesSaved': 'गुण सहेजे गए',
    'attributesReset': 'डिफ़ॉल्ट कॉन्फ़िगरेशन पर रीसेट',
    'save': 'सहेजें',
    'otherExtensions': 'लेखक के और एक्सटेंशन',
    'newtab01Desc': 'बुकमार्क-संचालित नया टैब। फ़ोल्डर को टैब समूहों या स्प्लिट व्यू में खोलें। 12 बिल्ट-इन थीम + असीमित कस्टम थीम।'
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
    'languageSaved': "Langue enregistrée",
    'advancedSettings': 'Paramètres Avancés',
    'lazyAttributes': 'Attributs de Chargement Paresseux',
    'lazyAttributesHelp': 'Détecter ces attributs pour charger les images, séparés par des virgules',
    'placeholderPatterns': 'Détection de Placeholders',
    'placeholderPatternsHelp': 'Les images dont le src contient ces mots-clés seront traitées comme des placeholders, séparés par des virgules',
    'resetToDefault': 'Réinitialiser par Défaut',
    'attributesSaved': 'Attributs enregistrés',
    'attributesReset': 'Réinitialisé à la configuration par défaut',
    'save': 'Enregistrer',
    'otherExtensions': 'Plus d\'Extensions de l\'Auteur',
    'newtab01Desc': 'Nouvel onglet basé sur les favoris. Ouvrez les dossiers en groupes d\'onglets ou en vue fractionnée. 12 thèmes intégrés + thèmes personnalisés illimités.'
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
    'languageSaved': "Idioma salvo",
    'advancedSettings': 'Configurações Avançadas',
    'lazyAttributes': 'Atributos de Carregamento Preguiçoso',
    'lazyAttributesHelp': 'Detectar esses atributos para carregar imagens, separados por vírgulas',
    'placeholderPatterns': 'Detecção de Marcadores',
    'placeholderPatternsHelp': 'Imagens com src contendo essas palavras-chave serão tratadas como marcadores, separados por vírgulas',
    'resetToDefault': 'Restaurar Padrão',
    'attributesSaved': 'Atributos salvos',
    'attributesReset': 'Restaurado para configuração padrão',
    'save': 'Salvar',
    'otherExtensions': 'Mais Extensões do Autor',
    'newtab01Desc': 'Nova aba baseada em favoritos. Abra pastas como grupos de abas ou em tela dividida. 12 temas integrados + temas personalizados ilimitados.'
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
    'languageSaved': "Sprache gespeichert",
    'advancedSettings': 'Erweiterte Einstellungen',
    'lazyAttributes': 'Lazy-Load Attribute',
    'lazyAttributesHelp': 'Diese Attribute zum Laden von Bildern erkennen, kommagetrennt',
    'placeholderPatterns': 'Platzhalter-Erkennung',
    'placeholderPatternsHelp': 'Bilder mit src, die diese Schlüsselwörter enthalten, werden als Platzhalter behandelt, kommagetrennt',
    'resetToDefault': 'Auf Standard Zurücksetzen',
    'attributesSaved': 'Attribute gespeichert',
    'attributesReset': 'Auf Standardkonfiguration zurückgesetzt',
    'save': 'Speichern',
    'otherExtensions': 'Weitere Erweiterungen des Autors',
    'newtab01Desc': 'Lesezeichen-gesteuerter neuer Tab. Ordner als Tab-Gruppen oder in geteilter Ansicht öffnen. 12 integrierte Themes + unbegrenzte benutzerdefinierte Themes.'
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
    'languageSaved': "言語を保存しました",
    'advancedSettings': '詳細設定',
    'lazyAttributes': '遅延読み込み属性',
    'lazyAttributesHelp': '画像を読み込むためのこれらの属性を検出、カンマ区切り',
    'placeholderPatterns': 'プレースホルダー検出',
    'placeholderPatternsHelp': 'srcにこれらのキーワードを含む画像はプレースホルダーとして扱われます、カンマ区切り',
    'resetToDefault': 'デフォルトに戻す',
    'attributesSaved': '属性を保存しました',
    'attributesReset': 'デフォルト設定にリセットしました',
    'save': '保存',
    'otherExtensions': '作者のその他の拡張機能',
    'newtab01Desc': 'ブックマーク駆動の新しいタブ。フォルダをタブグループまたは分割ビューで開きます。12の内蔵テーマ + 無制限のカスタムテーマ。'
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
    'languageSaved': "Язык сохранен",
    'advancedSettings': 'Расширенные Настройки',
    'lazyAttributes': 'Атрибуты Отложенной Загрузки',
    'lazyAttributesHelp': 'Обнаруживать эти атрибуты для загрузки изображений, через запятую',
    'placeholderPatterns': 'Обнаружение Заглушек',
    'placeholderPatternsHelp': 'Изображения с src, содержащим эти ключевые слова, будут считаться заглушками, через запятую',
    'resetToDefault': 'Сбросить по Умолчанию',
    'attributesSaved': 'Атрибуты сохранены',
    'attributesReset': 'Сброшено к конфигурации по умолчанию',
    'save': 'Сохранить',
    'otherExtensions': 'Другие Расширения Автора',
    'newtab01Desc': 'Новая вкладка на основе закладок. Открывайте папки как группы вкладок или в разделённом виде. 12 встроенных тем + неограниченные пользовательские темы.'
  },
  'ko': {
    'siteListTitle': '설정된 사이트',
    'emptyState': '설정된 사이트가 없습니다',
    'globalSettings': '사이트 설정 목록',
    'showInterceptionToast': '차단 성공 알림 표시 (우측 상단, 2초)',
    'useAutoScroll': '기술 차단 대신 자동 스크롤 사용 (차단이 실패하는 사이트에 적합)',
    'autoScrollHelp': '활성화 시 기술 차단을 비활성화하고 하단까지 자동 스크롤하여 이미지 로딩을 트리거합니다',
    'scrollParams': '자동 스크롤 매개변수',
    'scrollSpeed': '스크롤 속도 (밀리초)',
    'stayDuration': '하단 체류 시간 (밀리초)',
    'returnToTop': '완료 후 상단으로 돌아가기',
    'saveGlobal': '전체 설정 저장',
    'saved': '저장됨',
    'importExport': '가져오기/내보내기',
    'exportConfig': '설정 내보내기',
    'importConfig': '설정 가져오기',
    'autoScroll': '자동 스크롤',
    'delete': '삭제',
    'deleteConfirm': '{domain}의 설정을 삭제하시겠습니까?',
    'deleted': '삭제됨',
    'scrollEnabled': '자동 스크롤 활성화됨',
    'scrollDisabled': '자동 스크롤 비활성화됨',
    'configImported': '설정을 가져왔습니다',
    'configExported': '설정을 내보냈습니다',
    'importFailed': '가져오기 실패: ',
    'invalidConfig': '잘못된 설정 파일 형식',
    'languageSettings': '언어 설정',
    'saveLanguage': '언어 저장',
    'languageSaved': "언어가 저장되었습니다",
    'advancedSettings': '고급 설정',
    'lazyAttributes': '지연 로딩 속성',
    'lazyAttributesHelp': '이미지를 로드하기 위한 속성을 감지합니다. 쉼표로 구분',
    'placeholderPatterns': '플레이스홀더 감지',
    'placeholderPatternsHelp': 'src에 이러한 키워드가 포함된 이미지는 플레이스홀더로 처리됩니다. 쉼표로 구분',
    'resetToDefault': '기본값으로 재설정',
    'attributesSaved': '속성이 저장되었습니다',
    'attributesReset': '기본 설정으로 재설정되었습니다',
    'save': '저장',
    'otherExtensions': '저자의 다른 확장 프로그램',
    'newtab01Desc': '북마크 기반 새 탭. 폴더를 탭 그룹이나 분할 보기로 엽니다. 12개 내장 테마 + 무제한 커스텀 테마.'
  },
  'bg': {
    'siteListTitle': 'Конфигурирани сайтове',
    'emptyState': 'Няма конфигурирани сайтове',
    'globalSettings': 'Списък с конфигурации на сайтове',
    'showInterceptionToast': 'Показване на известие за успешно прихващане',
    'useAutoScroll': 'Използвай автоматично превъртане вместо техническо блокиране',
    'autoScrollHelp': 'Когато е активирано, деактивира техническото блокиране и задейства зареждането чрез автоматично превъртане до долу',
    'scrollParams': 'Параметри за автоматично превъртане',
    'scrollSpeed': 'Скорост на превъртане (мс)',
    'stayDuration': 'Продължителност на престоя (мс)',
    'returnToTop': 'Връщане нагоре след завършване',
    'saveGlobal': 'Запази глобалните настройки',
    'saved': 'Запазено',
    'importExport': 'Импортиране/Експортиране',
    'exportConfig': 'Експортиране на конфигурацията',
    'importConfig': 'Импортиране на конфигурация',
    'autoScroll': 'Автоматично превъртане',
    'delete': 'Изтриване',
    'deleteConfirm': 'Сигурни ли сте, че искате да изтриете конфигурацията за {domain}?',
    'deleted': 'Изтрито',
    'scrollEnabled': 'Автоматичното превъртане е активирано',
    'scrollDisabled': 'Автоматичното превъртане е деактивирано',
    'configImported': 'Конфигурацията е импортирана',
    'configExported': 'Конфигурацията е експортирана',
    'importFailed': 'Импортирането е неуспешно: ',
    'invalidConfig': 'Невалиден формат на конфигурационния файл',
    'languageSettings': 'Езикови настройки',
    'saveLanguage': 'Запази езика',
    'languageSaved': "Езикът е запазен",
    'advancedSettings': 'Разширени настройки',
    'lazyAttributes': 'Атрибути за мързеливо зареждане',
    'lazyAttributesHelp': 'Засичай тези атрибути за зареждане на изображения, разделени със запетая',
    'placeholderPatterns': 'Откриване на контейнери',
    'placeholderPatternsHelp': 'Изображенията с src, съдържащи тези ключови думи, ще бъдат третирани като контейнери, разделени със запетая',
    'resetToDefault': 'Върни към по подразбиране',
    'attributesSaved': 'Атрибутите са запазени',
    'attributesReset': 'Възстановено е конфигурацията по подразбиране',
    'save': 'Запази',
    'otherExtensions': 'Други разширения от автора',
    'newtab01Desc': 'Нов раздел, задвижван от отметки. Отваряйте папки като групи от раздели или в разделен изглед. 12 вградени теми + неограничени персонализирани теми.',
  },
  'ca': {
    'siteListTitle': 'Llocs configurats',
    'emptyState': 'Cap lloc configurat',
    'globalSettings': 'Llista de configuració de llocs',
    'showInterceptionToast': 'Mostra la notificació d\'interceptació correcta',
    'useAutoScroll': 'Fes servir el desplaçament automàtic en lloc del bloqueig tècnic',
    'autoScrollHelp': 'Quan està activat, desactiva el bloqueig tècnic i activa la càrrega mitjançant el desplaçament automàtic al final',
    'scrollParams': 'Paràmetres de desplaçament automàtic',
    'scrollSpeed': 'Velocitat de desplaçament (ms)',
    'stayDuration': 'Durada de l\'estada (ms)',
    'returnToTop': 'Torna a dalt en acabar',
    'saveGlobal': 'Desa la configuració global',
    'saved': 'Desat',
    'importExport': 'Importar/Exportar',
    'exportConfig': 'Exporta la configuració',
    'importConfig': 'Importa la configuració',
    'autoScroll': 'Desplaçament automàtic',
    'delete': 'Suprimeix',
    'deleteConfirm': 'Esteu segur que voleu suprimir la configuració de {domain}?',
    'deleted': 'Suprimit',
    'scrollEnabled': 'Desplaçament automàtic activat',
    'scrollDisabled': 'Desplaçament automàtic desactivat',
    'configImported': 'Configuració importada',
    'configExported': 'Configuració exportada',
    'importFailed': 'La importació ha fallat: ',
    'invalidConfig': 'Format de fitxer de configuració no vàlid',
    'languageSettings': 'Configuració d\'idioma',
    'saveLanguage': 'Desa l\'idioma',
    'languageSaved': "Idioma desat",
    'advancedSettings': 'Configuració avançada',
    'lazyAttributes': 'Atributs de càrrega mandrosa',
    'lazyAttributesHelp': 'Detecta aquests atributs per carregar imatges, separats per comes',
    'placeholderPatterns': 'Detecció de marcadors',
    'placeholderPatternsHelp': 'Les imatges amb src que contingui aquestes paraules clau seran tractades com a marcadors, separats per comes',
    'resetToDefault': 'Restableix als valors predeterminats',
    'attributesSaved': 'Atributs desats',
    'attributesReset': 'S\'ha restablert la configuració predeterminada',
    'save': 'Desa',
    'otherExtensions': 'Més extensions de l\'autor',
    'newtab01Desc': 'Nova pestanya basada en marcadors. Obre carpetes com a grups de pestanyes o en vista dividida. 12 temes integrats + temes personalitzats il·limitats.',
  },
  'cs': {
    'siteListTitle': 'Nakonfigurované stránky',
    'emptyState': 'Žádné nakonfigurované stránky',
    'globalSettings': 'Seznam konfigurací stránek',
    'showInterceptionToast': 'Zobrazit oznámení o úspěšném zachycení',
    'useAutoScroll': 'Použít automatické posouvání místo technického blokování',
    'autoScrollHelp': 'Když je povoleno, zakáže technické blokování a spustí načítání automatickým posunutím dolů',
    'scrollParams': 'Parametry automatického posouvání',
    'scrollSpeed': 'Rychlost posouvání (ms)',
    'stayDuration': 'Doba setrvání (ms)',
    'returnToTop': 'Po dokončení se vraťte nahoru',
    'saveGlobal': 'Uložit globální nastavení',
    'saved': 'Uloženo',
    'importExport': 'Import/Export',
    'exportConfig': 'Exportovat konfiguraci',
    'importConfig': 'Importovat konfiguraci',
    'autoScroll': 'Automatické posouvání',
    'delete': 'Smazat',
    'deleteConfirm': 'Opravdu chcete smazat konfiguraci pro {domain}?',
    'deleted': 'Smazáno',
    'scrollEnabled': 'Automatické posouvání povoleno',
    'scrollDisabled': 'Automatické posouvání zakázáno',
    'configImported': 'Konfigurace importována',
    'configExported': 'Konfigurace exportována',
    'importFailed': 'Import selhal: ',
    'invalidConfig': 'Neplatný formát konfiguračního souboru',
    'languageSettings': 'Jazyková nastavení',
    'saveLanguage': 'Uložit jazyk',
    'languageSaved': "Jazyk uložen",
    'advancedSettings': 'Pokročilá nastavení',
    'lazyAttributes': 'Atributy líného načítání',
    'lazyAttributesHelp': 'Detekujte tyto atributy pro načítání obrázků, oddělené čárkami',
    'placeholderPatterns': 'Detekce zástupných symbolů',
    'placeholderPatternsHelp': 'Obrázky s src obsahujícím tato klíčová slova budou považovány za zástupné symboly, oddělené čárkami',
    'resetToDefault': 'Obnovit výchozí',
    'attributesSaved': 'Atributy uloženy',
    'attributesReset': 'Obnovena výchozí konfigurace',
    'save': 'Uložit',
    'otherExtensions': 'Další rozšíření autora',
    'newtab01Desc': 'Nová karta řízená záložkami. Otevírejte složky jako skupiny karet nebo v rozděleném zobrazení. 12 vestavěných motivů + neomezené vlastní motivy.',
  },
  'da': {
    'siteListTitle': 'Konfigurerede hjemmesider',
    'emptyState': 'Ingen konfigurerede hjemmesider',
    'globalSettings': 'Liste over hjemmesidekonfigurationer',
    'showInterceptionToast': 'Vis besked om vellykket aflytning',
    'useAutoScroll': 'Brug automatisk rulning i stedet for teknisk blokering',
    'autoScrollHelp': 'Når aktiveret, deaktiverer teknisk blokering og udløser indlæsning ved automatisk rulning til bunden',
    'scrollParams': 'Parametre for automatisk rulning',
    'scrollSpeed': 'Rullehastighed (ms)',
    'stayDuration': 'Opholdstid (ms)',
    'returnToTop': 'Vend tilbage til toppen efter fuldførelse',
    'saveGlobal': 'Gem globale indstillinger',
    'saved': 'Gemt',
    'importExport': 'Import/Eksport',
    'exportConfig': 'Eksportér konfiguration',
    'importConfig': 'Importér konfiguration',
    'autoScroll': 'Automatisk rulning',
    'delete': 'Slet',
    'deleteConfirm': 'Er du sikker på, at du vil slette konfigurationen for {domain}?',
    'deleted': 'Slettet',
    'scrollEnabled': 'Automatisk rulning aktiveret',
    'scrollDisabled': 'Automatisk rulning deaktiveret',
    'configImported': 'Konfiguration importeret',
    'configExported': 'Konfiguration eksporteret',
    'importFailed': 'Import mislykkedes: ',
    'invalidConfig': 'Ugyldigt konfigurationsfilformat',
    'languageSettings': 'Sprogindstillinger',
    'saveLanguage': 'Gem sprog',
    'languageSaved': "Sprog gemt",
    'advancedSettings': 'Avancerede indstillinger',
    'lazyAttributes': 'Doven indlæsning-attributter',
    'lazyAttributesHelp': 'Detekter disse attributter for at indlæse billeder, kommasepareret',
    'placeholderPatterns': 'Pladsholder-detektering',
    'placeholderPatternsHelp': 'Billeder med src der indeholder disse nøgleord vil blive behandlet som pladsholdere, kommasepareret',
    'resetToDefault': 'Nulstil til standard',
    'attributesSaved': 'Attributter gemt',
    'attributesReset': 'Standardkonfiguration gendannet',
    'save': 'Gem',
    'otherExtensions': 'Flere udvidelser fra forfatteren',
    'newtab01Desc': 'Bogmærke-drevet nyt faneblad. Åbn mapper som fanegrupper eller i opdelt visning. 12 indbyggede temaer + ubegrænsede brugerdefinerede temaer.',
  },
  'el': {
    'siteListTitle': 'Ρυθμισμένοι ιστότοποι',
    'emptyState': 'Δεν υπάρχουν ρυθμισμένοι ιστότοποι',
    'globalSettings': 'Λίστα ρυθμίσεων ιστότοπων',
    'showInterceptionToast': 'Εμφάνιση ειδοποίησης επιτυχούς υποκλοπής',
    'useAutoScroll': 'Χρήση αυτόματης κύλισης αντί τεχνικού αποκλεισμού',
    'autoScrollHelp': 'Όταν ενεργοποιηθεί, απενεργοποιεί τον τεχνικό αποκλεισμό και ενεργοποιεί τη φόρτωση με αυτόματη κύλιση προς τα κάτω',
    'scrollParams': 'Παράμετροι αυτόματης κύλισης',
    'scrollSpeed': 'Ταχύτητα κύλισης (ms)',
    'stayDuration': 'Διάρκεια παραμονής (ms)',
    'returnToTop': 'Επιστροφή στην κορυφή μετά την ολοκλήρωση',
    'saveGlobal': 'Αποθήκευση καθολικών ρυθμίσεων',
    'saved': 'Αποθηκεύτηκε',
    'importExport': 'Εισαγωγή/Εξαγωγή',
    'exportConfig': 'Εξαγωγή διαμόρφωσης',
    'importConfig': 'Εισαγωγή διαμόρφωσης',
    'autoScroll': 'Αυτόματη κύλιση',
    'delete': 'Διαγραφή',
    'deleteConfirm': 'Είστε βέβαιοι ότι θέλετε να διαγράψετε τη διαμόρφωση για {domain};',
    'deleted': 'Διαγράφηκε',
    'scrollEnabled': 'Η αυτόματη κύλιση ενεργοποιήθηκε',
    'scrollDisabled': 'Η αυτόματη κύλιση απενεργοποιήθηκε',
    'configImported': 'Η διαμόρφωση εισήχθη',
    'configExported': 'Η διαμόρφωση εξήχθη',
    'importFailed': 'Η εισαγωγή απέτυχε: ',
    'invalidConfig': 'Μη έγκυρη μορφή αρχείου διαμόρφωσης',
    'languageSettings': 'Ρυθμίσεις γλώσσας',
    'saveLanguage': 'Αποθήκευση γλώσσας',
    'languageSaved': "Η γλώσσα αποθηκεύτηκε",
    'advancedSettings': 'Σύνθετες ρυθμίσεις',
    'lazyAttributes': 'Χαρακτηριστικά τεμπέλικης φόρτωσης',
    'lazyAttributesHelp': 'Ανίχνευση αυτών των χαρακτηριστικών για φόρτωση εικόνων, χωρισμένα με κόμμα',
    'placeholderPatterns': 'Ανίχνευση placeholders',
    'placeholderPatternsHelp': 'Εικόνες με src που περιέχουν αυτές τις λέξεις-κλειδιά θα αντιμετωπίζονται ως placeholders, χωρισμένα με κόμμα',
    'resetToDefault': 'Επαναφορά στις προεπιλογές',
    'attributesSaved': 'Τα χαρακτηριστικά αποθηκεύτηκαν',
    'attributesReset': 'Επαναφορά στην προεπιλεγμένη διαμόρφωση',
    'save': 'Αποθήκευση',
    'otherExtensions': 'Περισσότερες επεκτάσεις από τον συγγραφέα',
    'newtab01Desc': 'Νέα καρτέλα με γνώμονα τους σελιδοδείκτες. Ανοίξτε φακέλους ως ομάδες καρτελών ή σε διαχωρισμένη προβολή. 12 ενσωματωμένα θέματα + απεριόριστα προσαρμοσμένα θέματα.',
  },
  'fa': {
    'siteListTitle': 'سایت‌های پیکربندی‌شده',
    'emptyState': 'هیچ سایتی پیکربندی نشده است',
    'globalSettings': 'فهرست پیکربندی سایت‌ها',
    'showInterceptionToast': 'نمایش اعلان رهگیری موفق',
    'useAutoScroll': 'استفاده از پیمایش خودکار به جای مسدودسازی فنی',
    'autoScrollHelp': 'هنگام فعال بودن، مسدودسازی فنی را غیرفعال می‌کند و با پیمایش خودکار به پایین، بارگذاری را فعال می‌کند',
    'scrollParams': 'پارامترهای پیمایش خودکار',
    'scrollSpeed': 'سرعت پیمایش (میلی‌ثانیه)',
    'stayDuration': 'مدت اقامت (میلی‌ثانیه)',
    'returnToTop': 'بازگشت به بالا پس از اتمام',
    'saveGlobal': 'ذخیره تنظیمات سراسری',
    'saved': 'ذخیره شد',
    'importExport': 'واردات/صادرات',
    'exportConfig': 'صادرات پیکربندی',
    'importConfig': 'واردات پیکربندی',
    'autoScroll': 'پیمایش خودکار',
    'delete': 'حذف',
    'deleteConfirm': 'آیا مطمئن هستید که می‌خواهید پیکربندی {domain} را حذف کنید؟',
    'deleted': 'حذف شد',
    'scrollEnabled': 'پیمایش خودکار فعال شد',
    'scrollDisabled': 'پیمایش خودکار غیرفعال شد',
    'configImported': 'پیکربندی وارد شد',
    'configExported': 'پیکربندی صادر شد',
    'importFailed': 'واردات ناموفق بود: ',
    'invalidConfig': 'فرمت فایل پیکربندی نامعتبر است',
    'languageSettings': 'تنظیمات زبان',
    'saveLanguage': 'ذخیره زبان',
    'languageSaved': "زبان ذخیره شد",
    'advancedSettings': 'تنظیمات پیشرفته',
    'lazyAttributes': 'ویژگی‌های بارگذاری تنبل',
    'lazyAttributesHelp': 'این ویژگی‌ها را برای بارگذاری تصاویر شناسایی کن، با کاما جدا شده',
    'placeholderPatterns': 'تشخیص مکان‌نگهدار',
    'placeholderPatternsHelp': 'تصاویری با src که حاوی این کلمات کلیدی باشند به‌عنوان مکان‌نگهدار در نظر گرفته می‌شوند، با کاما جدا شده',
    'resetToDefault': 'بازنشانی به پیش‌فرض',
    'attributesSaved': 'ویژگی‌ها ذخیره شد',
    'attributesReset': 'به پیکربندی پیش‌فرض بازنشانی شد',
    'save': 'ذخیره',
    'otherExtensions': 'سایر افزونه‌های نویسنده',
    'newtab01Desc': 'تب جدید مبتنی بر نشانک. پوشه‌ها را به‌عنوان گروه تب یا در نمای تقسیم‌شده باز کنید. ۱۲ تم داخلی + تم سفارشی نامحدود.',
  },
  'fi': {
    'siteListTitle': 'Määritetyt sivustot',
    'emptyState': 'Ei määritettyjä sivustoja',
    'globalSettings': 'Sivuston määritysluettelo',
    'showInterceptionToast': 'Näytä ilmoitus onnistuneesta sieppauksesta',
    'useAutoScroll': 'Käytä automaattista vieritystä teknisen eston sijaan',
    'autoScrollHelp': 'Kun käytössä, poistaa teknisen eston käytöstä ja käynnistää lataamisen vierittämällä alas',
    'scrollParams': 'Automaattisen vierityksen parametrit',
    'scrollSpeed': 'Vieritysnopeus (ms)',
    'stayDuration': 'Viipymisaika (ms)',
    'returnToTop': 'Palaa ylös valmistumisen jälkeen',
    'saveGlobal': 'Tallenna yleiset asetukset',
    'saved': 'Tallennettu',
    'importExport': 'Tuonti/Vienti',
    'exportConfig': 'Vie kokoonpano',
    'importConfig': 'Tuo kokoonpano',
    'autoScroll': 'Automaattinen vieritys',
    'delete': 'Poista',
    'deleteConfirm': 'Haluatko varmasti poistaa kohteen {domain} kokoonpanon?',
    'deleted': 'Poistettu',
    'scrollEnabled': 'Automaattinen vieritys käytössä',
    'scrollDisabled': 'Automaattinen vieritys pois käytöstä',
    'configImported': 'Kokoonpano tuotu',
    'configExported': 'Kokoonpano viety',
    'importFailed': 'Tuonti epäonnistui: ',
    'invalidConfig': 'Virheellinen kokoonpanotiedostomuoto',
    'languageSettings': 'Kieliasetukset',
    'saveLanguage': 'Tallenna kieli',
    'languageSaved': "Kieli tallennettu",
    'advancedSettings': 'Lisäasetukset',
    'lazyAttributes': 'Laiskan latauksen määritteet',
    'lazyAttributesHelp': 'Tunnista nämä määritteet kuvien lataamiseksi, pilkulla erotettuna',
    'placeholderPatterns': 'Paikkamerkkien tunnistus',
    'placeholderPatternsHelp': 'Kuvat, joiden src sisältää nämä avainsanat, käsitellään paikkamerkkeinä, pilkulla erotettuna',
    'resetToDefault': 'Palauta oletusarvoihin',
    'attributesSaved': 'Määritteet tallennettu',
    'attributesReset': 'Palautettu oletuskokoonpanoon',
    'save': 'Tallenna',
    'otherExtensions': 'Lisää tekijän laajennuksia',
    'newtab01Desc': 'Kirjanmerkeillä toimiva uusi välilehti. Avaa kansioita välilehtiryhminä tai jaetussa näkymässä. 12 sisäänrakennettua teemaa + rajattomasti mukautettuja teemoja.',
  },
  'he': {
    'siteListTitle': 'אתרים מוגדרים',
    'emptyState': 'אין אתרים מוגדרים',
    'globalSettings': 'רשימת תצורות אתרים',
    'showInterceptionToast': 'הצג התראה על חסימה מוצלחת',
    'useAutoScroll': 'השתמש בגלילה אוטומטית במקום חסימה טכנית',
    'autoScrollHelp': 'כאשר מופעל, משבית חסימה טכנית ומפעיל טעינה על ידי גלילה אוטומטית למטה',
    'scrollParams': 'פרמטרים של גלילה אוטומטית',
    'scrollSpeed': 'מהירות גלילה (מ״ש)',
    'stayDuration': 'משך שהייה (מ״ש)',
    'returnToTop': 'חזור לראש לאחר השלמה',
    'saveGlobal': 'שמור הגדרות כלליות',
    'saved': 'נשמר',
    'importExport': 'ייבוא/ייצוא',
    'exportConfig': 'ייצא תצורה',
    'importConfig': 'ייבא תצורה',
    'autoScroll': 'גלילה אוטומטית',
    'delete': 'מחק',
    'deleteConfirm': 'האם אתה בטוח שברצונך למחוק את התצורה של {domain}?',
    'deleted': 'נמחק',
    'scrollEnabled': 'גלילה אוטומטית מופעלת',
    'scrollDisabled': 'גלילה אוטומטית מושבתת',
    'configImported': 'התצורה יובאה',
    'configExported': 'התצורה יוצאה',
    'importFailed': 'הייבוא נכשל: ',
    'invalidConfig': 'פורמט קובץ תצורה לא חוקי',
    'languageSettings': 'הגדרות שפה',
    'saveLanguage': 'שמור שפה',
    'languageSaved': "השפה נשמרה",
    'advancedSettings': 'הגדרות מתקדמות',
    'lazyAttributes': 'מאפייני טעינה עצלה',
    'lazyAttributesHelp': 'זהה מאפיינים אלה לטעינת תמונות, מופרדים בפסיק',
    'placeholderPatterns': 'זיהוי מצייני מיקום',
    'placeholderPatternsHelp': 'תמונות עם src המכיל מילות מפתח אלה יטופלו כמצייני מיקום, מופרדים בפסיק',
    'resetToDefault': 'איפוס לברירת מחדל',
    'attributesSaved': 'המאפיינים נשמרו',
    'attributesReset': 'אופס לתצורת ברירת מחדל',
    'save': 'שמור',
    'otherExtensions': 'תוספים נוספים מהמחבר',
    'newtab01Desc': 'כרטיסייה חדשה מונעת סימניות. פתח תיקיות כקבוצות כרטיסיות או בתצוגה מפוצלת. 12 ערכות נושא מובנות + ערכות נושא מותאמות אישית ללא הגבלה.',
  },
  'hr': {
    'siteListTitle': 'Konfigurirane stranice',
    'emptyState': 'Nema konfiguriranih stranica',
    'globalSettings': 'Popis konfiguracija stranica',
    'showInterceptionToast': 'Prikaži obavijest o uspješnom presretanju',
    'useAutoScroll': 'Koristi automatsko pomicanje umjesto tehničkog blokiranja',
    'autoScrollHelp': 'Kada je omogućeno, onemogućuje tehničko blokiranje i pokreće učitavanje automatskim pomicanjem prema dolje',
    'scrollParams': 'Parametri automatskog pomicanja',
    'scrollSpeed': 'Brzina pomicanja (ms)',
    'stayDuration': 'Trajanje zadržavanja (ms)',
    'returnToTop': 'Vrati se na vrh nakon završetka',
    'saveGlobal': 'Spremi globalne postavke',
    'saved': 'Spremljeno',
    'importExport': 'Uvoz/Izvoz',
    'exportConfig': 'Izvezi konfiguraciju',
    'importConfig': 'Uvezi konfiguraciju',
    'autoScroll': 'Automatsko pomicanje',
    'delete': 'Izbriši',
    'deleteConfirm': 'Jeste li sigurni da želite izbrisati konfiguraciju za {domain}?',
    'deleted': 'Izbrisano',
    'scrollEnabled': 'Automatsko pomicanje omogućeno',
    'scrollDisabled': 'Automatsko pomicanje onemogućeno',
    'configImported': 'Konfiguracija uvezena',
    'configExported': 'Konfiguracija izvezena',
    'importFailed': 'Uvoz neuspješan: ',
    'invalidConfig': 'Neispravan format konfiguracijske datoteke',
    'languageSettings': 'Jezične postavke',
    'saveLanguage': 'Spremi jezik',
    'languageSaved': "Jezik spremljen",
    'advancedSettings': 'Napredne postavke',
    'lazyAttributes': 'Atributi lijevog učitavanja',
    'lazyAttributesHelp': 'Otkrijte ove atribute za učitavanje slika, odvojene zarezom',
    'placeholderPatterns': 'Otkrivanje rezerviranih mjesta',
    'placeholderPatternsHelp': 'Slike s src-om koji sadrži ove ključne riječi tretirat će se kao rezervirana mjesta, odvojeno zarezom',
    'resetToDefault': 'Vrati na zadano',
    'attributesSaved': 'Atributi spremljeni',
    'attributesReset': 'Vraćeno na zadanu konfiguraciju',
    'save': 'Spremi',
    'otherExtensions': 'Više proširenja autora',
    'newtab01Desc': 'Nova kartica vođena oznakama. Otvorite mape kao grupe kartica ili u podijeljenom prikazu. 12 ugrađenih tema + neograničene prilagođene teme.',
  },
  'hu': {
    'siteListTitle': 'Beállított oldalak',
    'emptyState': 'Nincsenek beállított oldalak',
    'globalSettings': 'Webhelykonfigurációs lista',
    'showInterceptionToast': 'Sikerült elfogás értesítésének megjelenítése',
    'useAutoScroll': 'Automatikus görgetés használata technikai blokkolás helyett',
    'autoScrollHelp': 'Bekapcsoláskor letiltja a technikai blokkolást, és automatikus görgetéssel indítja a betöltést',
    'scrollParams': 'Automatikus görgetés paraméterei',
    'scrollSpeed': 'Görgetési sebesség (ms)',
    'stayDuration': 'Várakozási idő (ms)',
    'returnToTop': 'Visszatérés a tetejére a befejezés után',
    'saveGlobal': 'Globális beállítások mentése',
    'saved': 'Mentve',
    'importExport': 'Importálás/Exportálás',
    'exportConfig': 'Konfiguráció exportálása',
    'importConfig': 'Konfiguráció importálása',
    'autoScroll': 'Automatikus görgetés',
    'delete': 'Törlés',
    'deleteConfirm': 'Biztosan törli a(z) {domain} konfigurációját?',
    'deleted': 'Törölve',
    'scrollEnabled': 'Automatikus görgetés engedélyezve',
    'scrollDisabled': 'Automatikus görgetés letiltva',
    'configImported': 'Konfiguráció importálva',
    'configExported': 'Konfiguráció exportálva',
    'importFailed': 'Az importálás sikertelen: ',
    'invalidConfig': 'Érvénytelen konfigurációs fájlformátum',
    'languageSettings': 'Nyelvi beállítások',
    'saveLanguage': 'Nyelv mentése',
    'languageSaved': "Nyelv mentve",
    'advancedSettings': 'Speciális beállítások',
    'lazyAttributes': 'Lusta betöltés attribútumai',
    'lazyAttributesHelp': 'Ezen attribútumok észlelése a képek betöltéséhez, vesszővel elválasztva',
    'placeholderPatterns': 'Helyőrző minták észlelése',
    'placeholderPatternsHelp': 'Az src-ben ilyen kulcsszavakat tartalmazó képek helyőrzőként lesznek kezelve, vesszővel elválasztva',
    'resetToDefault': 'Visszaállítás alapértelmezettre',
    'attributesSaved': 'Attribútumok mentve',
    'attributesReset': 'Visszaállítva az alapértelmezett konfigurációra',
    'save': 'Mentés',
    'otherExtensions': 'További kiegészítők a szerzőtől',
    'newtab01Desc': 'Könyvjelző-vezérelt új lap. Nyisson meg mappákat lapcsoportokként vagy osztott nézetben. 12 beépített téma + korlátlan egyéni téma.',
  },
  'id': {
    'siteListTitle': 'Situs yang Dikonfigurasi',
    'emptyState': 'Tidak ada situs yang dikonfigurasi',
    'globalSettings': 'Daftar Konfigurasi Situs',
    'showInterceptionToast': 'Tampilkan Notifikasi Intersepsi Berhasil',
    'useAutoScroll': 'Gunakan gulir otomatis, bukan pemblokiran teknis',
    'autoScrollHelp': 'Saat diaktifkan, menonaktifkan pemblokiran teknis dan memicu pemuatan dengan menggulir otomatis ke bawah',
    'scrollParams': 'Parameter Gulir Otomatis',
    'scrollSpeed': 'Kecepatan Gulir (ms)',
    'stayDuration': 'Durasi Tinggal (ms)',
    'returnToTop': 'Kembali ke Atas Setelah Selesai',
    'saveGlobal': 'Simpan Pengaturan Global',
    'saved': 'Tersimpan',
    'importExport': 'Impor/Ekspor',
    'exportConfig': 'Ekspor Konfigurasi',
    'importConfig': 'Impor Konfigurasi',
    'autoScroll': 'Gulir Otomatis',
    'delete': 'Hapus',
    'deleteConfirm': 'Apakah Anda yakin ingin menghapus konfigurasi untuk {domain}?',
    'deleted': 'Dihapus',
    'scrollEnabled': 'Gulir otomatis diaktifkan',
    'scrollDisabled': 'Gulir otomatis dinonaktifkan',
    'configImported': 'Konfigurasi diimpor',
    'configExported': 'Konfigurasi diekspor',
    'importFailed': 'Impor gagal: ',
    'invalidConfig': 'Format file konfigurasi tidak valid',
    'languageSettings': 'Pengaturan Bahasa',
    'saveLanguage': 'Simpan Bahasa',
    'languageSaved': "Bahasa disimpan",
    'advancedSettings': 'Pengaturan Lanjutan',
    'lazyAttributes': 'Atribut Pemuatan Malas',
    'lazyAttributesHelp': 'Deteksi atribut ini untuk memuat gambar, dipisahkan koma',
    'placeholderPatterns': 'Deteksi Placeholder',
    'placeholderPatternsHelp': 'Gambar dengan src yang mengandung kata kunci ini akan diperlakukan sebagai placeholder, dipisahkan koma',
    'resetToDefault': 'Reset ke Default',
    'attributesSaved': 'Atribut disimpan',
    'attributesReset': 'Direset ke konfigurasi default',
    'save': 'Simpan',
    'otherExtensions': 'Ekstensi Lain dari Pembuat',
    'newtab01Desc': 'Tab baru berbasis bookmark. Buka folder sebagai grup tab atau dalam tampilan terbagi. 12 tema bawaan + tema kustom tak terbatas.',
  },
  'it': {
    'siteListTitle': 'Siti configurati',
    'emptyState': 'Nessun sito configurato',
    'globalSettings': 'Elenco configurazione siti',
    'showInterceptionToast': 'Mostra notifica di intercettazione riuscita',
    'useAutoScroll': 'Usa scorrimento automatico invece del blocco tecnico',
    'autoScrollHelp': 'Quando attivo, disattiva il blocco tecnico e attiva il caricamento tramite scorrimento automatico in fondo',
    'scrollParams': 'Parametri di scorrimento automatico',
    'scrollSpeed': 'Velocità di scorrimento (ms)',
    'stayDuration': 'Durata permanenza (ms)',
    'returnToTop': 'Torna in cima al completamento',
    'saveGlobal': 'Salva impostazioni globali',
    'saved': 'Salvato',
    'importExport': 'Importa/Esporta',
    'exportConfig': 'Esporta configurazione',
    'importConfig': 'Importa configurazione',
    'autoScroll': 'Scorrimento automatico',
    'delete': 'Elimina',
    'deleteConfirm': 'Sei sicuro di voler eliminare la configurazione per {domain}?',
    'deleted': 'Eliminato',
    'scrollEnabled': 'Scorrimento automatico attivato',
    'scrollDisabled': 'Scorrimento automatico disattivato',
    'configImported': 'Configurazione importata',
    'configExported': 'Configurazione esportata',
    'importFailed': 'Importazione fallita: ',
    'invalidConfig': 'Formato file di configurazione non valido',
    'languageSettings': 'Impostazioni lingua',
    'saveLanguage': 'Salva lingua',
    'languageSaved': "Lingua salvata",
    'advancedSettings': 'Impostazioni avanzate',
    'lazyAttributes': 'Attributi di caricamento lazy',
    'lazyAttributesHelp': 'Rileva questi attributi per caricare le immagini, separati da virgola',
    'placeholderPatterns': 'Rilevamento segnaposto',
    'placeholderPatternsHelp': 'Le immagini con src contenente queste parole chiave saranno trattate come segnaposto, separate da virgola',
    'resetToDefault': 'Ripristina predefiniti',
    'attributesSaved': 'Attributi salvati',
    'attributesReset': 'Ripristinato alla configurazione predefinita',
    'save': 'Salva',
    'otherExtensions': 'Altre estensioni dell\'autore',
    'newtab01Desc': 'Nuova scheda basata sui segnalibri. Apri le cartelle come gruppi di schede o in vista divisa. 12 temi integrati + temi personalizzati illimitati.',
  },
  'nb': {
    'siteListTitle': 'Konfigurerte nettsteder',
    'emptyState': 'Ingen konfigurerte nettsteder',
    'globalSettings': 'Liste over nettstedskonfigurasjoner',
    'showInterceptionToast': 'Vis varsel om vellykket avlytting',
    'useAutoScroll': 'Bruk automatisk rulling i stedet for teknisk blokkering',
    'autoScrollHelp': 'Når aktivert, deaktiverer teknisk blokkering og utløser lasting ved automatisk å rulle til bunnen',
    'scrollParams': 'Parametere for automatisk rulling',
    'scrollSpeed': 'Rullehastighet (ms)',
    'stayDuration': 'Oppholdstid (ms)',
    'returnToTop': 'Tilbake til toppen etter fullføring',
    'saveGlobal': 'Lagre globale innstillinger',
    'saved': 'Lagret',
    'importExport': 'Import/Eksport',
    'exportConfig': 'Eksporter konfigurasjon',
    'importConfig': 'Importer konfigurasjon',
    'autoScroll': 'Automatisk rulling',
    'delete': 'Slett',
    'deleteConfirm': 'Er du sikker på at du vil slette konfigurasjonen for {domain}?',
    'deleted': 'Slettet',
    'scrollEnabled': 'Automatisk rulling aktivert',
    'scrollDisabled': 'Automatisk rulling deaktivert',
    'configImported': 'Konfigurasjon importert',
    'configExported': 'Konfigurasjon eksportert',
    'importFailed': 'Import mislyktes: ',
    'invalidConfig': 'Ugyldig konfigurasjonsfilformat',
    'languageSettings': 'Språkinnstillinger',
    'saveLanguage': 'Lagre språk',
    'languageSaved': "Språk lagret",
    'advancedSettings': 'Avanserte innstillinger',
    'lazyAttributes': 'Late lastingsattributter',
    'lazyAttributesHelp': 'Oppdag disse attributtene for å laste bilder, kommaseparert',
    'placeholderPatterns': 'Plassholder-deteksjon',
    'placeholderPatternsHelp': 'Bilder med src som inneholder disse nøkkelordene vil bli behandlet som plassholdere, kommaseparert',
    'resetToDefault': 'Tilbakestill til standard',
    'attributesSaved': 'Attributter lagret',
    'attributesReset': 'Tilbakestilt til standardkonfigurasjon',
    'save': 'Lagre',
    'otherExtensions': 'Flere utvidelser fra forfatteren',
    'newtab01Desc': 'Bokmerkestyrt ny fane. Åpne mapper som fanegrupper eller i delt visning. 12 innebygde temaer + ubegrensede egendefinerte temaer.',
  },
  'nl': {
    'siteListTitle': 'Geconfigureerde sites',
    'emptyState': 'Geen geconfigureerde sites',
    'globalSettings': 'Lijst met siteconfiguraties',
    'showInterceptionToast': 'Toon melding bij geslaagde onderschepping',
    'useAutoScroll': 'Gebruik automatisch scrollen in plaats van technische blokkering',
    'autoScrollHelp': 'Wanneer ingeschakeld, schakelt het technische blokkering uit en activeert het laden door automatisch naar beneden te scrollen',
    'scrollParams': 'Parameters voor automatisch scrollen',
    'scrollSpeed': 'Scrollsnelheid (ms)',
    'stayDuration': 'Verblijfsduur (ms)',
    'returnToTop': 'Keer na voltooiing naar boven',
    'saveGlobal': 'Sla globale instellingen op',
    'saved': 'Opgeslagen',
    'importExport': 'Importeren/Exporteren',
    'exportConfig': 'Configuratie exporteren',
    'importConfig': 'Configuratie importeren',
    'autoScroll': 'Automatisch scrollen',
    'delete': 'Verwijderen',
    'deleteConfirm': 'Weet u zeker dat u de configuratie voor {domain} wilt verwijderen?',
    'deleted': 'Verwijderd',
    'scrollEnabled': 'Automatisch scrollen ingeschakeld',
    'scrollDisabled': 'Automatisch scrollen uitgeschakeld',
    'configImported': 'Configuratie geïmporteerd',
    'configExported': 'Configuratie geëxporteerd',
    'importFailed': 'Importeren mislukt: ',
    'invalidConfig': 'Ongeldig configuratiebestandsformaat',
    'languageSettings': 'Taalinstellingen',
    'saveLanguage': 'Taal opslaan',
    'languageSaved': "Taal opgeslagen",
    'advancedSettings': 'Geavanceerde instellingen',
    'lazyAttributes': 'Lazy-load attributen',
    'lazyAttributesHelp': 'Detecteer deze attributen om afbeeldingen te laden, kommagescheiden',
    'placeholderPatterns': 'Tijdelijke aanduiding detectie',
    'placeholderPatternsHelp': 'Afbeeldingen met src die deze trefwoorden bevatten worden als tijdelijke aanduiding behandeld, kommagescheiden',
    'resetToDefault': 'Standaardwaarden herstellen',
    'attributesSaved': 'Attributen opgeslagen',
    'attributesReset': 'Hersteld naar standaardconfiguratie',
    'save': 'Opslaan',
    'otherExtensions': 'Meer extensies van de auteur',
    'newtab01Desc': 'Bladwijzer-gestuurde nieuw tabblad. Open mappen als tabgroepen of in gesplitste weergave. 12 ingebouwde thema\'s + onbeperkt aangepaste thema\'s.',
  },
  'pl': {
    'siteListTitle': 'Skonfigurowane strony',
    'emptyState': 'Brak skonfigurowanych stron',
    'globalSettings': 'Lista konfiguracji stron',
    'showInterceptionToast': 'Pokaż powiadomienie o udanej blokadzie',
    'useAutoScroll': 'Użyj automatycznego przewijania zamiast blokady technicznej',
    'autoScrollHelp': 'Po włączeniu wyłącza blokadę techniczną i wyzwala ładowanie przez automatyczne przewijanie do dołu',
    'scrollParams': 'Parametry automatycznego przewijania',
    'scrollSpeed': 'Prędkość przewijania (ms)',
    'stayDuration': 'Czas pozostawania (ms)',
    'returnToTop': 'Powrót do góry po zakończeniu',
    'saveGlobal': 'Zapisz ustawienia globalne',
    'saved': 'Zapisano',
    'importExport': 'Import/Eksport',
    'exportConfig': 'Eksportuj konfigurację',
    'importConfig': 'Importuj konfigurację',
    'autoScroll': 'Autoprzewijanie',
    'delete': 'Usuń',
    'deleteConfirm': 'Czy na pewno chcesz usunąć konfigurację dla {domain}?',
    'deleted': 'Usunięto',
    'scrollEnabled': 'Autoprzewijanie włączone',
    'scrollDisabled': 'Autoprzewijanie wyłączone',
    'configImported': 'Konfiguracja zaimportowana',
    'configExported': 'Konfiguracja wyeksportowana',
    'importFailed': 'Import nie powiódł się: ',
    'invalidConfig': 'Nieprawidłowy format pliku konfiguracji',
    'languageSettings': 'Ustawienia języka',
    'saveLanguage': 'Zapisz język',
    'languageSaved': "Język zapisany",
    'advancedSettings': 'Ustawienia zaawansowane',
    'lazyAttributes': 'Atrybuty leniwego ładowania',
    'lazyAttributesHelp': 'Wykryj te atrybuty do ładowania obrazów, oddzielone przecinkami',
    'placeholderPatterns': 'Wykrywanie placeholderów',
    'placeholderPatternsHelp': 'Obrazy z src zawierającym te słowa kluczowe będą traktowane jako placeholdery, oddzielone przecinkami',
    'resetToDefault': 'Przywróć domyślne',
    'attributesSaved': 'Atrybuty zapisane',
    'attributesReset': 'Przywrócono domyślną konfigurację',
    'save': 'Zapisz',
    'otherExtensions': 'Więcej rozszerzeń autora',
    'newtab01Desc': 'Nowa karta oparta na zakładkach. Otwieraj foldery jako grupy kart lub w widoku dzielonym. 12 wbudowanych motywów + nieograniczone motywy niestandardowe.',
  },
  'ps': {
    'siteListTitle': 'ترتیب شوي سایټونه',
    'emptyState': 'هیڅ ترتیب شوی سایټ نشته',
    'globalSettings': 'د سایټ د تنظیماتو لیست',
    'showInterceptionToast': 'د بریالۍ بندیز خبرتیا وښایئ',
    'useAutoScroll': 'د تخنیکي بندیز پر ځای اتوماتیک سکرول وکاروئ',
    'autoScrollHelp': 'کله چې فعال شي، تخنیکي بندیز نافعالوي او د ښکته اتوماتیک سکرول سره بارول پیلوي',
    'scrollParams': 'د اتوماتیک سکرول پارامترونه',
    'scrollSpeed': 'د سکرول سرعت (ملی ثانیه)',
    'stayDuration': 'د ځایډیروالی موده (ملی ثانیه)',
    'returnToTop': 'د بشپړیدو وروسته پورته ته راستون شئ',
    'saveGlobal': 'نړیوالې تنظیمات خوندي کړئ',
    'saved': 'خوندي شو',
    'importExport': 'درآمد/صادرول',
    'exportConfig': 'صادرول',
    'importConfig': 'درآمد',
    'autoScroll': 'اتوماتیک سکرول',
    'delete': 'ړنګول',
    'deleteConfirm': 'ایا تاسو ډاډه یاست چې غواړئ د {domain} کنفیگریشن ړنګ کړئ؟',
    'deleted': 'ړنګ شو',
    'scrollEnabled': 'اتوماتیک سکرول فعال شو',
    'scrollDisabled': 'اتوماتیک سکرول غیر فعال شو',
    'configImported': 'کنفیگریشن درآمد شو',
    'configExported': 'کنفیگریشن صادره شوه',
    'importFailed': 'درآمد ناکام شو: ',
    'invalidConfig': 'د کنفیگریشن فایل بڼه ناسمه ده',
    'languageSettings': 'د ژبې تنظیمات',
    'saveLanguage': 'ژبه خوندي کړئ',
    'languageSaved': "ژبه خوندي شوه",
    'advancedSettings': 'پرمختللي تنظیمات',
    'lazyAttributes': 'د ستړي بارولو ځانګړتیاوې',
    'lazyAttributesHelp': 'د انځورونو د بارولو لپاره دا ځانګړتیاوې وپیژنئ، په کامه جلا شوي',
    'placeholderPatterns': 'د ځای نښه کوونکو پیژندنه',
    'placeholderPatternsHelp': 'د src سره انځورونه چې دا کلیدي کلمې ولري د ځای نښه کوونکو په توګه به وکارول شي، په کامه جلا شوي',
    'resetToDefault': 'ډیفالټ ته راستنول',
    'attributesSaved': 'ځانګړتیاوې خوندي شوې',
    'attributesReset': 'ډیفالټ کنفیگریشن ته راستون شو',
    'save': 'خوندي کړئ',
    'otherExtensions': 'د لیکونکي نور ملحقات',
    'newtab01Desc': 'د بوکمارک پر بنسټ نوی ټب. فولډرونه د ټب ګروپونو یا ویشل شوي لید په توګه خلاص کړئ. ۱۲ جوړ شوي موضوعات + نامحدود دودیز موضوعات.',
  },
  'ro': {
    'siteListTitle': 'Site-uri configurate',
    'emptyState': 'Niciun site configurat',
    'globalSettings': 'Lista de configurări a site-urilor',
    'showInterceptionToast': 'Arată notificarea de interceptare reușită',
    'useAutoScroll': 'Folosește derularea automată în locul blocării tehnice',
    'autoScrollHelp': 'Când este activat, dezactivează blocarea tehnică și declanșează încărcarea prin derulare automată în jos',
    'scrollParams': 'Parametri de derulare automată',
    'scrollSpeed': 'Viteza de derulare (ms)',
    'stayDuration': 'Durata de staționare (ms)',
    'returnToTop': 'Întoarce-te sus după finalizare',
    'saveGlobal': 'Salvează setările globale',
    'saved': 'Salvat',
    'importExport': 'Import/Export',
    'exportConfig': 'Exportă configurația',
    'importConfig': 'Importă configurația',
    'autoScroll': 'Derulare automată',
    'delete': 'Șterge',
    'deleteConfirm': 'Sigur doriți să ștergeți configurația pentru {domain}?',
    'deleted': 'Șters',
    'scrollEnabled': 'Derulare automată activată',
    'scrollDisabled': 'Derulare automată dezactivată',
    'configImported': 'Configurație importată',
    'configExported': 'Configurație exportată',
    'importFailed': 'Import eșuat: ',
    'invalidConfig': 'Format de fișier de configurare nevalid',
    'languageSettings': 'Setări limbă',
    'saveLanguage': 'Salvează limba',
    'languageSaved': "Limba salvată",
    'advancedSettings': 'Setări avansate',
    'lazyAttributes': 'Atribute de încărcare leneșă',
    'lazyAttributesHelp': 'Detectează aceste atribute pentru a încărca imagini, separate prin virgulă',
    'placeholderPatterns': 'Detectare substituenți',
    'placeholderPatternsHelp': 'Imaginile cu src care conțin aceste cuvinte cheie vor fi tratate ca substituenți, separate prin virgulă',
    'resetToDefault': 'Resetează la implicit',
    'attributesSaved': 'Atribute salvate',
    'attributesReset': 'Resetat la configurația implicită',
    'save': 'Salvează',
    'otherExtensions': 'Mai multe extensii de la autor',
    'newtab01Desc': 'Filă nouă bazată pe marcaje. Deschide folderele ca grupuri de file sau în vizualizare divizată. 12 teme încorporate + teme personalizate nelimitate.',
  },
  'sk': {
    'siteListTitle': 'Nakonfigurované stránky',
    'emptyState': 'Žiadne nakonfigurované stránky',
    'globalSettings': 'Zoznam konfigurácií stránok',
    'showInterceptionToast': 'Zobraziť oznámenie o úspešnom zachytení',
    'useAutoScroll': 'Použiť automatické posúvanie namiesto technického blokovania',
    'autoScrollHelp': 'Keď je povolené, zakáže technické blokovanie a spustí načítavanie automatickým posúvaním nadol',
    'scrollParams': 'Parametre automatického posúvania',
    'scrollSpeed': 'Rýchlosť posúvania (ms)',
    'stayDuration': 'Doba trvania (ms)',
    'returnToTop': 'Návrat hore po dokončení',
    'saveGlobal': 'Uložiť globálne nastavenia',
    'saved': 'Uložené',
    'importExport': 'Import/Export',
    'exportConfig': 'Exportovať konfiguráciu',
    'importConfig': 'Importovať konfiguráciu',
    'autoScroll': 'Automatické posúvanie',
    'delete': 'Vymazať',
    'deleteConfirm': 'Naozaj chcete vymazať konfiguráciu pre {domain}?',
    'deleted': 'Vymazané',
    'scrollEnabled': 'Automatické posúvanie povolené',
    'scrollDisabled': 'Automatické posúvanie zakázané',
    'configImported': 'Konfigurácia importovaná',
    'configExported': 'Konfigurácia exportovaná',
    'importFailed': 'Import zlyhal: ',
    'invalidConfig': 'Neplatný formát konfiguračného súboru',
    'languageSettings': 'Jazykové nastavenia',
    'saveLanguage': 'Uložiť jazyk',
    'languageSaved': "Jazyk uložený",
    'advancedSettings': 'Pokročilé nastavenia',
    'lazyAttributes': 'Atribúty lenivého načítavania',
    'lazyAttributesHelp': 'Rozpoznajte tieto atribúty na načítanie obrázkov, oddelené čiarkami',
    'placeholderPatterns': 'Detekcia zástupných symbolov',
    'placeholderPatternsHelp': 'Obrázky s src obsahujúcim tieto kľúčové slová budú považované za zástupné symboly, oddelené čiarkami',
    'resetToDefault': 'Obnoviť predvolené',
    'attributesSaved': 'Atribúty uložené',
    'attributesReset': 'Obnovená predvolená konfigurácia',
    'save': 'Uložiť',
    'otherExtensions': 'Ďalšie rozšírenia od autora',
    'newtab01Desc': 'Nová karta riadená záložkami. Otvárajte priečinky ako skupiny kariet alebo v rozdelenom zobrazení. 12 vstavaných motívov + neobmedzené vlastné motívy.',
  },
  'sv': {
    'siteListTitle': 'Konfigurerade webbplatser',
    'emptyState': 'Inga konfigurerade webbplatser',
    'globalSettings': 'Lista över webbplatskonfigurationer',
    'showInterceptionToast': 'Visa avisering vid lyckad avlyssning',
    'useAutoScroll': 'Använd automatisk rullning istället för teknisk blockering',
    'autoScrollHelp': 'När aktiverad, inaktiverar teknisk blockering och utlöser inladdning genom automatisk rullning till botten',
    'scrollParams': 'Parametrar för automatisk rullning',
    'scrollSpeed': 'Rullningshastighet (ms)',
    'stayDuration': 'Vistelsetid (ms)',
    'returnToTop': 'Återgå till toppen efter slutförande',
    'saveGlobal': 'Spara globala inställningar',
    'saved': 'Sparad',
    'importExport': 'Importera/Exportera',
    'exportConfig': 'Exportera konfiguration',
    'importConfig': 'Importera konfiguration',
    'autoScroll': 'Automatisk rullning',
    'delete': 'Ta bort',
    'deleteConfirm': 'Är du säker på att du vill ta bort konfigurationen för {domain}?',
    'deleted': 'Borttagen',
    'scrollEnabled': 'Automatisk rullning aktiverad',
    'scrollDisabled': 'Automatisk rullning inaktiverad',
    'configImported': 'Konfiguration importerad',
    'configExported': 'Konfiguration exporterad',
    'importFailed': 'Import misslyckades: ',
    'invalidConfig': 'Ogiltigt konfigurationsfilformat',
    'languageSettings': 'Språkinställningar',
    'saveLanguage': 'Spara språk',
    'languageSaved': "Språk sparat",
    'advancedSettings': 'Avancerade inställningar',
    'lazyAttributes': 'Lat inladdningsattribut',
    'lazyAttributesHelp': 'Identifiera dessa attribut för att ladda bilder, kommaseparerade',
    'placeholderPatterns': 'Platshållaridentifiering',
    'placeholderPatternsHelp': 'Bilder med src som innehåller dessa nyckelord kommer att behandlas som platshållare, kommaseparerade',
    'resetToDefault': 'Återställ till standard',
    'attributesSaved': 'Attribut sparade',
    'attributesReset': 'Återställd till standardkonfiguration',
    'save': 'Spara',
    'otherExtensions': 'Fler tillägg av författaren',
    'newtab01Desc': 'Bokmärkesdriven ny flik. Öppna mappar som flikgrupper eller i delad vy. 12 inbyggda teman + obegränsade anpassade teman.',
  },
  'th': {
    'siteListTitle': 'เว็บไซต์ที่กำหนดค่าแล้ว',
    'emptyState': 'ยังไม่มีเว็บไซต์ที่กำหนดค่า',
    'globalSettings': 'รายการกำหนดค่าเว็บไซต์',
    'showInterceptionToast': 'แสดงการแจ้งเตือนการสกัดกั้นสำเร็จ',
    'useAutoScroll': 'ใช้การเลื่อนอัตโนมัติแทนการบล็อกทางเทคนิค',
    'autoScrollHelp': 'เมื่อเปิดใช้งาน จะปิดการบล็อกแบบเทคนิคและเรียกการโหลดด้วยการเลื่อนอัตโนมัติลงด้านล่าง',
    'scrollParams': 'พารามิเตอร์การเลื่อนอัตโนมัติ',
    'scrollSpeed': 'ความเร็วในการเลื่อน (มิลลิวินาที)',
    'stayDuration': 'ระยะเวลาคงที่ (มิลลิวินาที)',
    'returnToTop': 'กลับไปด้านบนหลังเสร็จสิ้น',
    'saveGlobal': 'บันทึกการตั้งค่าส่วนกลาง',
    'saved': 'บันทึกแล้ว',
    'importExport': 'นำเข้า/ส่งออก',
    'exportConfig': 'ส่งออกการกำหนดค่า',
    'importConfig': 'นำเข้าการกำหนดค่า',
    'autoScroll': 'เลื่อนอัตโนมัติ',
    'delete': 'ลบ',
    'deleteConfirm': 'คุณแน่ใจหรือไม่ว่าต้องการลบการกำหนดค่าสำหรับ {domain}?',
    'deleted': 'ลบแล้ว',
    'scrollEnabled': 'เปิดใช้งานการเลื่อนอัตโนมัติ',
    'scrollDisabled': 'ปิดใช้งานการเลื่อนอัตโนมัติ',
    'configImported': 'นำเข้าการกำหนดค่าแล้ว',
    'configExported': 'ส่งออกการกำหนดค่าแล้ว',
    'importFailed': 'นำเข้าล้มเหลว: ',
    'invalidConfig': 'รูปแบบไฟล์กำหนดค่าไม่ถูกต้อง',
    'languageSettings': 'การตั้งค่าภาษา',
    'saveLanguage': 'บันทึกภาษา',
    'languageSaved': "บันทึกภาษาแล้ว",
    'advancedSettings': 'การตั้งค่าขั้นสูง',
    'lazyAttributes': 'แอตทริบิวต์การโหลดแบบขี้เกียจ',
    'lazyAttributesHelp': 'ตรวจจับแอตทริบิวต์เหล่านี้เพื่อโหลดรูปภาพ คั่นด้วยเครื่องหมายจุลภาค',
    'placeholderPatterns': 'การตรวจจับตัวยึดตำแหน่ง',
    'placeholderPatternsHelp': 'รูปภาพที่มี src ประกอบด้วยคำสำคัญเหล่านี้จะถูกปฏิบัติเป็นตัวยึดตำแหน่ง คั่นด้วยเครื่องหมายจุลภาค',
    'resetToDefault': 'รีเซ็ตเป็นค่าเริ่มต้น',
    'attributesSaved': 'บันทึกแอตทริบิวต์แล้ว',
    'attributesReset': 'รีเซ็ตเป็นการกำหนดค่าเริ่มต้นแล้ว',
    'save': 'บันทึก',
    'otherExtensions': 'ส่วนขยายอื่นๆ จากผู้สร้าง',
    'newtab01Desc': 'แท็บใหม่ที่ขับเคลื่อนด้วยบุ๊กมาร์ก เปิดโฟลเดอร์เป็นกลุ่มแท็บหรือในมุมมองแบบแยก ธีมในตัว 12 ธีม + ธีมที่กำหนดเองไม่จำกัด',
  },
  'tr': {
    'siteListTitle': 'Yapılandırılmış Siteler',
    'emptyState': 'Yapılandırılmış site yok',
    'globalSettings': 'Site Yapılandırma Listesi',
    'showInterceptionToast': 'Engelleme Başarılı Bildirimini Göster',
    'useAutoScroll': 'Teknik engelleme yerine otomatik kaydırmayı kullan',
    'autoScrollHelp': 'Etkinleştirildiğinde, teknik engellemeyi devre dışı bırakır ve otomatik olarak alta kaydırarak yüklemeyi tetikler',
    'scrollParams': 'Otomatik Kaydırma Parametreleri',
    'scrollSpeed': 'Kaydırma Hızı (ms)',
    'stayDuration': 'Bekleme Süresi (ms)',
    'returnToTop': 'Tamamlandığında Başa Dön',
    'saveGlobal': 'Genel Ayarları Kaydet',
    'saved': 'Kaydedildi',
    'importExport': 'İçe/Dışa Aktar',
    'exportConfig': 'Yapılandırmayı Dışa Aktar',
    'importConfig': 'Yapılandırmayı İçe Aktar',
    'autoScroll': 'Otomatik kaydırma',
    'delete': 'Sil',
    'deleteConfirm': '{domain} için yapılandırmayı silmek istediğinizden emin misiniz?',
    'deleted': 'Silindi',
    'scrollEnabled': 'Otomatik kaydırma etkinleştirildi',
    'scrollDisabled': 'Otomatik kaydırma devre dışı bırakıldı',
    'configImported': 'Yapılandırma içe aktarıldı',
    'configExported': 'Yapılandırma dışa aktarıldı',
    'importFailed': 'İçe aktarım başarısız: ',
    'invalidConfig': 'Geçersiz yapılandırma dosyası formatı',
    'languageSettings': 'Dil Ayarları',
    'saveLanguage': 'Dili Kaydet',
    'languageSaved': "Dil kaydedildi",
    'advancedSettings': 'Gelişmiş Ayarlar',
    'lazyAttributes': 'Tembel Yükleme Öznitelikleri',
    'lazyAttributesHelp': 'Görselleri yüklemek için bu öznitelikleri algıla, virgülle ayrılmış',
    'placeholderPatterns': 'Yer Tutucu Algılama',
    'placeholderPatternsHelp': 'Src\'si bu anahtar kelimeleri içeren görseller yer tutucu olarak değerlendirilecektir, virgülle ayrılmış',
    'resetToDefault': 'Varsayılana Sıfırla',
    'attributesSaved': 'Öznitelikler kaydedildi',
    'attributesReset': 'Varsayılan yapılandırmaya sıfırlandı',
    'save': 'Kaydet',
    'otherExtensions': 'Yazarın Diğer Eklentileri',
    'newtab01Desc': 'Yer imleri odaklı yeni sekme. Klasörleri sekme grupları veya bölünmüş görünüm olarak açın. 12 yerleşik tema + sınırsız özel tema.',
  },
  'uk': {
    'siteListTitle': 'Налаштовані сайти',
    'emptyState': 'Немає налаштованих сайтів',
    'globalSettings': 'Список конфігурацій сайтів',
    'showInterceptionToast': 'Показувати сповіщення про успішне перехоплення',
    'useAutoScroll': 'Використовувати автопрокрутку замість технічного блокування',
    'autoScrollHelp': 'Коли увімкнено, вимикає технічне блокування та запускає завантаження автоматичною прокруткою донизу',
    'scrollParams': 'Параметри автопрокрутки',
    'scrollSpeed': 'Швидкість прокрутки (мс)',
    'stayDuration': 'Тривалість перебування (мс)',
    'returnToTop': 'Повернутися догори після завершення',
    'saveGlobal': 'Зберегти глобальні налаштування',
    'saved': 'Збережено',
    'importExport': 'Імпорт/Експорт',
    'exportConfig': 'Експортувати конфігурацію',
    'importConfig': 'Імпортувати конфігурацію',
    'autoScroll': 'Автопрокрутка',
    'delete': 'Видалити',
    'deleteConfirm': 'Ви впевнені, що хочете видалити конфігурацію для {domain}?',
    'deleted': 'Видалено',
    'scrollEnabled': 'Автопрокрутку увімкнено',
    'scrollDisabled': 'Автопрокрутку вимкнено',
    'configImported': 'Конфігурацію імпортовано',
    'configExported': 'Конфігурацію експортовано',
    'importFailed': 'Не вдалося імпортувати: ',
    'invalidConfig': 'Недійсний формат файлу конфігурації',
    'languageSettings': 'Налаштування мови',
    'saveLanguage': 'Зберегти мову',
    'languageSaved': "Мову збережено",
    'advancedSettings': 'Розширені налаштування',
    'lazyAttributes': 'Атрибути лінивого завантаження',
    'lazyAttributesHelp': 'Виявляйте ці атрибути для завантаження зображень, через кому',
    'placeholderPatterns': 'Виявлення заповнювачів',
    'placeholderPatternsHelp': 'Зображення з src, що містять ці ключові слова, вважатимуться заповнювачами, через кому',
    'resetToDefault': 'Скинути до стандартних',
    'attributesSaved': 'Атрибути збережено',
    'attributesReset': 'Скинуто до стандартної конфігурації',
    'save': 'Зберегти',
    'otherExtensions': 'Інші розширення автора',
    'newtab01Desc': 'Нова вкладка на основі закладок. Відкривайте папки як групи вкладок або у розділеному вигляді. 12 вбудованих тем + необмежена кількість власних тем.',
  },
  'ur': {
    'siteListTitle': 'ترتیب دی گئی سائٹس',
    'emptyState': 'کوئی ترتیب دی گئی سائٹ نہیں',
    'globalSettings': 'سائٹ کنفیگریشن فہرست',
    'showInterceptionToast': 'روکنے کی کامیابی کا اطلاع دکھائیں',
    'useAutoScroll': 'تکنیکی بلاک کی بجائے خودکار سکرول استعمال کریں',
    'autoScrollHelp': 'فعال ہونے پر، تکنیکی بلاک کو غیر فعال کرتا ہے اور خودکار نیچے سکرول کرکے لوڈنگ کو متحرک کرتا ہے',
    'scrollParams': 'خودکار سکرول کے پیرامیٹرز',
    'scrollSpeed': 'سکرول اسپیڈ (ملی سیکنڈ)',
    'stayDuration': 'قیام کی مدت (ملی سیکنڈ)',
    'returnToTop': 'مکمل ہونے کے بعد اوپر واپس جائیں',
    'saveGlobal': 'عالمی ترتیبات محفوظ کریں',
    'saved': 'محفوظ ہو گیا',
    'importExport': 'درآمد/برآمد',
    'exportConfig': 'کنفیگریشن برآمد کریں',
    'importConfig': 'کنفیگریشن درآمد کریں',
    'autoScroll': 'خودکار سکرول',
    'delete': 'حذف',
    'deleteConfirm': 'کیا آپ واقعی {domain} کے لیے کنفیگریشن حذف کرنا چاہتے ہیں؟',
    'deleted': 'حذف ہو گیا',
    'scrollEnabled': 'خودکار سکرول فعال',
    'scrollDisabled': 'خودکار سکرول غیر فعال',
    'configImported': 'کنفیگریشن درآمد ہوئی',
    'configExported': 'کنفیگریشن برآمد ہوئی',
    'importFailed': 'درآمد ناکام ہوئی: ',
    'invalidConfig': 'کنفیگریشن فائل کی شکل غلط ہے',
    'languageSettings': 'زبان کی ترتیبات',
    'saveLanguage': 'زبان محفوظ کریں',
    'languageSaved': "زبان محفوظ ہو گئی",
    'advancedSettings': 'اعلیٰ ترتیبات',
    'lazyAttributes': 'سست لوڈنگ کی خصوصیات',
    'lazyAttributesHelp': 'تصاویر لوڈ کرنے کے لیے ان خصوصیات کا پتہ لگائیں، کاما سے الگ',
    'placeholderPatterns': 'پلیس ہولڈر کا پتہ لگانا',
    'placeholderPatternsHelp': 'جن تصاویر کے src میں یہ کلیدی الفاظ ہوں گے انہیں پلیس ہولڈر کے طور پر treat کیا جائے گا، کاما سے الگ',
    'resetToDefault': 'ڈیفالٹ پر ری سیٹ کریں',
    'attributesSaved': 'خصوصیات محفوظ ہوئیں',
    'attributesReset': 'ڈیفالٹ کنفیگریشن پر ری سیٹ',
    'save': 'محفوظ کریں',
    'otherExtensions': 'مصنف کی دیگر ایکسٹینشنز',
    'newtab01Desc': 'بک مارک پر مبنی نئی ٹیب۔ فولڈرز کو ٹیب گروپس یا تقسیم شدہ ویو کے طور پر کھولیں۔ 12 بلٹ ان تھیمز + لامحدود کسٹم تھیمز۔',
  },
  'vi': {
    'siteListTitle': 'Các trang đã cấu hình',
    'emptyState': 'Chưa có trang nào được cấu hình',
    'globalSettings': 'Danh sách cấu hình trang',
    'showInterceptionToast': 'Hiện thông báo chặn thành công',
    'useAutoScroll': 'Dùng tự động cuộn thay cho chặn kỹ thuật',
    'autoScrollHelp': 'Khi bật, tắt chặn kỹ thuật và kích hoạt tải bằng cách tự động cuộn xuống dưới',
    'scrollParams': 'Tham số tự động cuộn',
    'scrollSpeed': 'Tốc độ cuộn (ms)',
    'stayDuration': 'Thời gian lưu lại (ms)',
    'returnToTop': 'Quay lại đầu trang sau khi hoàn tất',
    'saveGlobal': 'Lưu cài đặt chung',
    'saved': 'Đã lưu',
    'importExport': 'Nhập/Xuất',
    'exportConfig': 'Xuất cấu hình',
    'importConfig': 'Nhập cấu hình',
    'autoScroll': 'Tự động cuộn',
    'delete': 'Xóa',
    'deleteConfirm': 'Bạn có chắc muốn xóa cấu hình cho {domain}?',
    'deleted': 'Đã xóa',
    'scrollEnabled': 'Đã bật tự động cuộn',
    'scrollDisabled': 'Đã tắt tự động cuộn',
    'configImported': 'Đã nhập cấu hình',
    'configExported': 'Đã xuất cấu hình',
    'importFailed': 'Nhập thất bại: ',
    'invalidConfig': 'Định dạng tệp cấu hình không hợp lệ',
    'languageSettings': 'Cài đặt ngôn ngữ',
    'saveLanguage': 'Lưu ngôn ngữ',
    'languageSaved': "Đã lưu ngôn ngữ",
    'advancedSettings': 'Cài đặt nâng cao',
    'lazyAttributes': 'Thuộc tính tải lười',
    'lazyAttributesHelp': 'Phát hiện các thuộc tính này để tải hình ảnh, phân tách bằng dấu phẩy',
    'placeholderPatterns': 'Phát hiện placeholder',
    'placeholderPatternsHelp': 'Hình ảnh có src chứa các từ khóa này sẽ được coi là placeholder, phân tách bằng dấu phẩy',
    'resetToDefault': 'Đặt lại mặc định',
    'attributesSaved': 'Đã lưu thuộc tính',
    'attributesReset': 'Đã đặt lại cấu hình mặc định',
    'save': 'Lưu',
    'otherExtensions': 'Tiện ích khác của tác giả',
    'newtab01Desc': 'Tab mới dựa trên bookmark. Mở thư mục dưới dạng nhóm tab hoặc chế độ xem chia đôi. 12 chủ đề tích hợp + chủ đề tùy chỉnh không giới hạn.',
  },
  'zh_HK': {
    'siteListTitle': '已設定的網站',
    'emptyState': '暫無設定的網站',
    'globalSettings': '網站設定清單',
    'showInterceptionToast': '顯示攔截成功提示',
    'useAutoScroll': '使用自動捲動代替技術攔截',
    'autoScrollHelp': '開啟後停用技術攔截，自動捲動到底部觸發載入',
    'scrollParams': '自動捲動參數',
    'scrollSpeed': '捲動速度（毫秒）',
    'stayDuration': '停留時長（毫秒）',
    'returnToTop': '完成後返回頁面頂部',
    'saveGlobal': '儲存全域設定',
    'saved': '已儲存',
    'importExport': '匯入/匯出',
    'exportConfig': '匯出設定',
    'importConfig': '匯入設定',
    'autoScroll': '自動捲動',
    'delete': '刪除',
    'deleteConfirm': '確定要刪除 {domain} 的設定嗎？',
    'deleted': '已刪除',
    'scrollEnabled': '已開啟自動捲動',
    'scrollDisabled': '已關閉自動捲動',
    'configImported': '設定已匯入',
    'configExported': '設定已匯出',
    'importFailed': '匯入失敗：',
    'invalidConfig': '設定檔格式不正確',
    'languageSettings': '語言設定',
    'saveLanguage': '儲存語言',
    'languageSaved': "語言已儲存",
    'advancedSettings': '進階設定',
    'lazyAttributes': '延遲載入屬性',
    'lazyAttributesHelp': '偵測這些屬性以載入圖片，以逗號分隔',
    'placeholderPatterns': '佔位符偵測',
    'placeholderPatternsHelp': 'src 包含這些關鍵字的圖片將被視為佔位符並替換，以逗號分隔',
    'resetToDefault': '重設為預設值',
    'attributesSaved': '屬性已儲存',
    'attributesReset': '已重設為預設設定',
    'save': '儲存',
    'otherExtensions': '作者的其他擴充功能',
    'newtab01Desc': '書籤驅動的新分頁。將資料夾作為分頁群組或分割檢視開啟。12 種內建主題 + 無限自訂主題。',
  },
  'zh_TW': {
    'siteListTitle': '已設定的網站',
    'emptyState': '暫無設定的網站',
    'globalSettings': '網站設定清單',
    'showInterceptionToast': '顯示攔截成功提示',
    'useAutoScroll': '使用自動捲動代替技術攔截',
    'autoScrollHelp': '開啟後停用技術攔截，自動捲動到底部觸發載入',
    'scrollParams': '自動捲動參數',
    'scrollSpeed': '捲動速度（毫秒）',
    'stayDuration': '停留時長（毫秒）',
    'returnToTop': '完成後返回頁面頂部',
    'saveGlobal': '儲存全域設定',
    'saved': '已儲存',
    'importExport': '匯入/匯出',
    'exportConfig': '匯出設定',
    'importConfig': '匯入設定',
    'autoScroll': '自動捲動',
    'delete': '刪除',
    'deleteConfirm': '確定要刪除 {domain} 的設定嗎？',
    'deleted': '已刪除',
    'scrollEnabled': '已開啟自動捲動',
    'scrollDisabled': '已關閉自動捲動',
    'configImported': '設定已匯入',
    'configExported': '設定已匯出',
    'importFailed': '匯入失敗：',
    'invalidConfig': '設定檔格式不正確',
    'languageSettings': '語言設定',
    'saveLanguage': '儲存語言',
    'languageSaved': "語言已儲存",
    'advancedSettings': '進階設定',
    'lazyAttributes': '延遲載入屬性',
    'lazyAttributesHelp': '偵測這些屬性以載入圖片，以逗號分隔',
    'placeholderPatterns': '佔位符偵測',
    'placeholderPatternsHelp': 'src 包含這些關鍵字的圖片將被視為佔位符並替換，以逗號分隔',
    'resetToDefault': '重設為預設值',
    'attributesSaved': '屬性已儲存',
    'attributesReset': '已重設為預設設定',
    'save': '儲存',
    'otherExtensions': '作者的其他擴充功能',
    'newtab01Desc': '書籤驅動的新分頁。將資料夾作為分頁群組或分割檢視開啟。12 種內建主題 + 無限自訂主題。',
  },

};

let currentLanguage = 'zh';

/**
 * 检测浏览器语言并返回最匹配的支持语言
 */
function detectBrowserLanguage() {
  const supportedLangs = Object.keys(TRANSLATIONS);
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
      if (rt.lastError) {
        console.error('[Settings] Message error:', rt.lastError);
        resolve({ success: false, error: rt.lastError.message });
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
  // Firefox 检测：隐藏仅限 Chrome 的扩展项
  const isFirefox = typeof browser !== 'undefined' && typeof chrome === 'undefined';
  if (isFirefox) {
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
