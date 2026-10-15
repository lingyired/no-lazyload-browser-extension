// tests/locales.test.mjs
// 语言包结构完整性：
//   · 每个语言都必须包含英文源的全部 key（缺失会让 UI 显示成 key 名）
//   · 保留 {placeholder} 占位符原样
//   · 未翻译条目数量上限 —— 用来发现"加了文案但没翻译"

import assert from 'node:assert/strict';
import { runInNewContext } from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';

export const name = '_locales';

/** 与英文同形是合理的条目（产品名 / 专有名词 / 德语里就是同一个词） */
const ALLOWED_IDENTICAL = new Set(['proBadge', 'github', 'appName', 'appDescription']);

/**
 * 尚未完成翻译的语言（英文兜底）。
 *
 * 发布前必须为空：plan Phase G 要求"fill all currently supported locale files
 * before App Store release"。新增语言时可以临时把语言代码放进来，
 * 但必须同时在这里留下原因；这个集合是**只允许变短**的清单。
 */
const PENDING_TRANSLATION = new Set([]);

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

  // Test the shared region/script resolver and RTL document metadata.
  const fakeWindow = { __LOCALES__: Object.fromEntries(langs.map(code => [code, {}])) };
  runInNewContext(readFileSync('i18n/language.js', 'utf8'), { window: fakeWindow });
  const resolver = fakeWindow.NoLazyloadLanguage;
  for (const [input, expected] of [
    ['zh-CN', 'zh'], ['zh-SG', 'zh'], ['zh-Hans', 'zh'],
    ['zh-TW', 'zh_TW'], ['zh-Hant', 'zh_TW'], ['zh-Hant-TW', 'zh_TW'],
    ['zh-HK', 'zh_HK'], ['zh-MO', 'zh_HK'], ['zh-Hant-HK', 'zh_HK'],
    ['zh_TW', 'zh_TW'], ['en-GB', 'en'], ['pt-BR', 'pt']
  ]) {
    assert.equal(resolver.resolveLanguage(input, langs), expected, input);
  }
  assert.equal(resolver.resolveLanguage('not-a-language', langs), null);
  assert.equal(resolver.detectBrowserLanguage(
    { i18n: { getUILanguage: () => 'zh-HK' } }, 'en-US', langs), 'zh_HK');
  assert.equal(resolver.detectBrowserLanguage(
    { i18n: { getUILanguage: () => 'xx-YY' } }, 'zh-TW', langs), 'zh_TW');
  const fakeDoc = { documentElement: {} };
  for (const code of ['ar', 'fa', 'he', 'ps', 'ur']) {
    resolver.applyDocumentLanguage(code, fakeDoc);
    assert.equal(fakeDoc.documentElement.dir, 'rtl', code);
  }
  resolver.applyDocumentLanguage('zh_TW', fakeDoc);
  assert.equal(fakeDoc.documentElement.lang, 'zh-TW');
  assert.equal(fakeDoc.documentElement.dir, 'ltr');

  // Host help must quote the same button text that actually appears in the extension.
  const catalog = JSON.parse(readFileSync(
    'safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker/Localizable.xcstrings', 'utf8'
  ));
  for (const [hostLanguage, extensionLanguage] of [
    ['en', 'en'], ['zh-Hans', 'zh'], ['zh-Hant', 'zh_TW'],
    ['ja', 'ja'], ['ko', 'ko'], ['de', 'de'], ['fr', 'fr'],
    ['es', 'es'], ['th', 'th']
  ]) {
    const extension = JSON.parse(readFileSync(
      `_locales/${extensionLanguage}/messages.json`, 'utf8'
    ));
    for (const [hostKey, extensionKey] of [
      ['stepEnableSite', 'addCurrentSite'],
      ['troubleshoot3Body', 'removeCurrentSite'],
      ['troubleshoot1Body', 'refreshPage']
    ]) {
      const native = catalog.strings[hostKey].localizations[hostLanguage].stringUnit.value;
      const label = extension[extensionKey].message;
      assert.ok(native.toLocaleLowerCase().includes(label.toLocaleLowerCase()),
        `${hostLanguage} host ${hostKey} must quote extension button ${extensionKey}: ${label}`);
    }
  }
  for (const code of ['zh', 'zh_CN', 'zh_TW', 'zh_HK']) {
    const messages = JSON.parse(readFileSync(`_locales/${code}/messages.json`, 'utf8'));
    assert.equal(messages.appName.message, 'No Lazyload', `brand name in ${code}`);
  }

  // 4. 待翻译列表必须仍然是一个真实的待办（防止已完成的语言留在列表里蒙混过关）
  for (const lang of PENDING_TRANSLATION) {
    assert.ok(langs.includes(lang), '待翻译列表里的 ' + lang + ' 已不存在');
  }
}
