// i18n-manager.js - Internationalization manager with language switching support

const LANGUAGES = {
  'en': { name: 'English', flag: '🇺🇸' },
  'zh': { name: '中文', flag: '🇨🇳' },
  'es': { name: 'Español', flag: '🇪🇸' },
  'ar': { name: 'العربية', flag: '🇸🇦' },
  'hi': { name: 'हिन्दी', flag: '🇮🇳' },
  'fr': { name: 'Français', flag: '🇫🇷' },
  'pt': { name: 'Português', flag: '🇧🇷' },
  'de': { name: 'Deutsch', flag: '🇩🇪' },
  'ja': { name: '日本語', flag: '🇯🇵' },
  'ru': { name: 'Русский', flag: '🇷🇺' }
};

const DEFAULT_LANGUAGE = 'en';
const STORAGE_KEY = 'preferredLanguage';

class I18nManager {
  constructor() {
    this.currentLang = DEFAULT_LANGUAGE;
    this.messages = {};
    this.loaded = false;
  }

  // Initialize and load preferred language
  async init() {
    const stored = await this.getStoredLanguage();
    this.currentLang = stored || this.detectBrowserLanguage();
    await this.loadMessages(this.currentLang);
    this.loaded = true;
    return this.currentLang;
  }

  // Detect browser language
  detectBrowserLanguage() {
    const runtime = typeof browser !== 'undefined' ? browser : chrome;
    if (runtime.i18n) {
      const uiLang = runtime.i18n.getUILanguage();
      const langCode = uiLang.split('-')[0];
      if (LANGUAGES[langCode]) {
        return langCode;
      }
    }
    return DEFAULT_LANGUAGE;
  }

  // Get stored language preference
  async getStoredLanguage() {
    return new Promise((resolve) => {
      const runtime = typeof browser !== 'undefined' ? browser : chrome;
      runtime.storage.local.get([STORAGE_KEY], (result) => {
        resolve(result[STORAGE_KEY] || null);
      });
    });
  }

  // Save language preference
  async setLanguage(lang) {
    if (!LANGUAGES[lang]) {
      console.warn(`[i18n] Unsupported language: ${lang}`);
      return false;
    }

    const runtime = typeof browser !== 'undefined' ? browser : chrome;
    await new Promise((resolve) => {
      runtime.storage.local.set({ [STORAGE_KEY]: lang }, resolve);
    });

    this.currentLang = lang;
    await this.loadMessages(lang);
    return true;
  }

  // Load messages for a language
  async loadMessages(lang) {
    try {
      const runtime = typeof browser !== 'undefined' ? browser : chrome;
      const url = runtime.runtime.getURL(`_locales/${lang}/messages.json`);
      const response = await fetch(url);
      if (response.ok) {
        this.messages = await response.json();
      } else {
        // Fallback to default language
        if (lang !== DEFAULT_LANGUAGE) {
          const fallbackUrl = runtime.runtime.getURL(`_locales/${DEFAULT_LANGUAGE}/messages.json`);
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            this.messages = await fallbackResponse.json();
          }
        }
      }
    } catch (error) {
      console.error('[i18n] Failed to load messages:', error);
      this.messages = {};
    }
  }

  // Get message by key
  getMessage(key, substitutions = []) {
    // First try loaded messages
    const message = this.messages[key];
    if (message && message.message) {
      let text = message.message;
      // Handle placeholders
      if (message.placeholders && substitutions.length > 0) {
        Object.keys(message.placeholders).forEach((placeholder, index) => {
          const value = substitutions[index] || '';
          text = text.replace(new RegExp(`\\$${placeholder}\\$`, 'g'), value);
        });
      }
      // Handle $1, $2 style substitutions
      substitutions.forEach((sub, index) => {
        text = text.replace(new RegExp(`\\$${index + 1}`, 'g'), sub);
      });
      return text;
    }

    // Fallback to browser i18n API
    const runtime = typeof browser !== 'undefined' ? browser : chrome;
    if (runtime.i18n) {
      return runtime.i18n.getMessage(key, substitutions);
    }

    return key;
  }

  // Apply translations to DOM elements
  applyTranslations() {
    // Translate elements with data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translated = this.getMessage(key);
      if (translated) {
        if (element.querySelector('span, a, input, button')) {
          // Only replace text nodes
          for (const node of element.childNodes) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
              node.textContent = translated;
              break;
            }
          }
        } else {
          element.textContent = translated;
        }
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translated = this.getMessage(key);
      if (translated) {
        element.placeholder = translated;
      }
    });

    // Translate titles
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translated = this.getMessage(key);
      if (translated) {
        element.title = translated;
      }
    });

    // Update page title if data-i18n-title on body
    const bodyTitle = document.body.getAttribute('data-i18n-title');
    if (bodyTitle) {
      const translated = this.getMessage(bodyTitle);
      if (translated) {
        document.title = translated;
      }
    }
  }

  // Get current language info
  getCurrentLanguage() {
    return {
      code: this.currentLang,
      ...LANGUAGES[this.currentLang]
    };
  }

  // Get all supported languages
  getSupportedLanguages() {
    return Object.entries(LANGUAGES).map(([code, info]) => ({
      code,
      ...info
    }));
  }
}

// Create singleton instance
const i18nManager = new I18nManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { i18nManager, LANGUAGES };
} else {
  window.i18nManager = i18nManager;
  window.I18nLanguages = LANGUAGES;
}
