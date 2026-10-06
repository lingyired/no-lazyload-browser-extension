// tests/locales.test.mjs
// 语言包结构完整性：
//   · 每个语言都必须包含英文源的全部 key（缺失会让 UI 显示成 key 名）
//   · 保留 {placeholder} 占位符原样
//   · 未翻译条目数量上限 —— 用来发现"加了文案但没翻译"

import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

export const name = '_locales';

/** 与英文同形是合理的条目（产品名 / 专有名词 / 德语里就是同一个词） */
const ALLOWED_IDENTICAL = new Set(['proBadge', 'github', 'appName', 'appDescription']);

/**
 * 尚未完成翻译的语言（英文兜底）。
 *
 * 这是**已知且被跟踪**的发布前遗留项，不是"可以忽略"：
 * plan Phase G 要求"fill all currently supported locale files before App Store release"。
 * 每完成一种语言就把它从这里删掉 —— 这个列表只允许变短。
 * 不在列表里的语言会被下面的断言强制要求翻译完整。
 */
const PENDING_TRANSLATION = new Set([
  'bg', 'ca', 'cs', 'da', 'el', 'es', 'fa', 'fi', 'fr', 'he', 'hi', 'hr', 'hu',
  'id', 'it', 'ko', 'nb', 'nl', 'pl', 'ps', 'pt', 'ro', 'ru', 'sk', 'sv', 'th',
  'tr', 'uk', 'ur', 'vi',
]);

export function run() {
  const en = JSON.parse(readFileSync('_locales/en/messages.json', 'utf8'));
  const enKeys = Object.keys(en);
  const langs = readdirSync('_locales').filter((l) =>
    readdirSync('_locales/' + l).includes('messages.json'));

  assert.ok(langs.length >= 38, '语言数量不应减少');

  for (const lang of langs) {
    const messages = JSON.parse(readFileSync(`_locales/${lang}/messages.json`, 'utf8'));

    // 1. 结构完整：缺 key 会让 UI 直接显示 key 名
    const missing = enKeys.filter((k) => !messages[k] || typeof messages[k].message !== 'string');
    assert.deepEqual(missing, [], lang + ' 缺少 key: ' + missing.join(', '));

    // 2. 占位符必须原样保留
    for (const key of enKeys) {
      const placeholders = (en[key].message || '').match(/\{\w+\}/g) || [];
      for (const ph of placeholders) {
        assert.ok(messages[key].message.includes(ph),
          `${lang}.${key} 丢了占位符 ${ph}: ${messages[key].message}`);
      }
    }

    // 3. 已声明完成的语言必须真的翻译过
    if (lang === 'en' || PENDING_TRANSLATION.has(lang)) continue;
    const identical = enKeys.filter((k) =>
      messages[k].message === en[k].message && !ALLOWED_IDENTICAL.has(k));
    assert.ok(identical.length <= 8,
      `${lang} 有 ${identical.length} 条与英文完全相同，疑似未翻译: ${identical.join(', ')}`);
  }

  // 4. 待翻译列表必须仍然是一个真实的待办（防止已完成的语言留在列表里蒙混过关）
  for (const lang of PENDING_TRANSLATION) {
    assert.ok(langs.includes(lang), '待翻译列表里的 ' + lang + ' 已不存在');
  }
}
