// shared/constants.js

export const STRATEGIES = {
  TECH_BLOCK: 'tech-block',
  SCROLL_FALLBACK: 'scroll-fallback',
  DISABLED: 'disabled'
};

export const DEFAULT_STRATEGY = STRATEGIES.DISABLED;

export const DEFAULT_SCROLL_CONFIG = {
  scrollSpeed: 800,
  stayDuration: 2000,
  returnToTop: true,
  showNotification: true
};

export const STORAGE_KEYS = {
  SITE_CONFIGS: 'siteConfigs',
  GLOBAL_CONFIG: 'globalConfig',
  CUSTOM_ATTRIBUTES: 'customAttributes'
};

// 默认的懒加载属性列表（用户可在设置中修改）
export const DEFAULT_LAZY_ATTRIBUTES = [
  'data-src',
  'data-original',
  'data-lazy-src',
  'data-srcset',
  'data-lazy-srcset',
  'data-custom-src',
  'data-lazy',
  'data-defer-src',
  'data-async',
  'data-img-url',
  'data-url',
  'data-image',
  'data-image-src',
  'data-href'
];

// 默认的占位符检测关键词（用户可在设置中修改）
export const DEFAULT_PLACEHOLDER_PATTERNS = [
  'thumb',
  'placeholder',
  'loading',
  'spinner',
  'blank',
  'empty',
  'lazy',
  'preview',
  'temp',
  'default'
];

// 默认的懒加载 CSS 选择器
export const LAZY_LOAD_SELECTORS = [
  'img[data-src]',
  'img[data-original]',
  'img[data-lazy-src]',
  'img[data-srcset]',
  'img[data-lazy-srcset]',
  'img[loading="lazy"]',
  '.lazy',
  '.lazyload',
  '.lazyloading',
  '.lozad',
  '[data-lazy]',
  '[data-lazy-src]'
];
