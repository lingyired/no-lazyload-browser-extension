// i18n.js - Internationalization utilities

const i18n = {
  // Get message from browser i18n API
  getMessage(key, substitutions) {
    const runtime = typeof browser !== 'undefined' ? browser : chrome;
    if (runtime.i18n) {
      return runtime.i18n.getMessage(key, substitutions);
    }
    // Fallback: return the key if i18n is not available
    return key;
  },

  // Apply translations to all elements with data-i18n attribute
  applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translated = this.getMessage(key);
      if (translated) {
        // Check if element has child elements that shouldn't be overwritten
        if (element.querySelector('span, a, input, button')) {
          // Only replace text nodes, keep child elements
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

    // Apply placeholder translations
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder');
      const translated = this.getMessage(key);
      if (translated) {
        element.placeholder = translated;
      }
    });

    // Apply title translations
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title');
      const translated = this.getMessage(key);
      if (translated) {
        element.title = translated;
      }
    });
  }
};

// Apply translations when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.applyTranslations());
} else {
  i18n.applyTranslations();
}
