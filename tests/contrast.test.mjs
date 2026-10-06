// tests/contrast.test.mjs
// Phase F3：对比度必须在两个主题下都达标。
//
// 解析 ui/tokens.css 里的语义令牌，按 WCAG 2.1 计算对比度：
//   普通文字 ≥ 4.5:1，大号文字/非文字 UI 控件 ≥ 3:1
// 半透明色先按 alpha 合成到对应底色上再计算 —— 直接用 rgba 的 RGB 会算错。

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const name = 'ui/tokens.css 对比度';

/** 从 tokens.css 里取出某个 mediablock 下的变量表 */
function parseTokens(css) {
  const themes = {};

  const collect = (blockName, selectorRegex) => {
    const match = css.match(selectorRegex);
    if (!match) return {};
    const body = match[1];
    const vars = {};
    const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
    let m;
    while ((m = re.exec(body)) !== null) vars[m[1]] = m[2].trim();
    return vars;
  };

  themes.light = collect('light', /:root\s*\{([\s\S]*?)\}/);
  const darkMatch = css.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([\s\S]*?)\}\s*\}/);
  themes.dark = Object.assign({}, themes.light, darkMatch ? parseVars(darkMatch[1]) : {});

  const rtMatch = css.match(/@media \(prefers-reduced-transparency: reduce\)\s*\{\s*:root\s*\{([\s\S]*?)\}\s*\}/);
  themes.reducedTransparency = Object.assign({}, themes.light, rtMatch ? parseVars(rtMatch[1]) : {});

  return themes;
}

function parseVars(body) {
  const vars = {};
  const re = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let m;
  while ((m = re.exec(body)) !== null) vars[m[1]] = m[2].trim();
  return vars;
}

/** #rgb / #rrggbb / rgb() / rgba() → [r, g, b, a] */
function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const fn = value.match(/rgba?\(([^)]+)\)/i);
  if (fn) {
    const parts = fn[1].split(',').map((s) => parseFloat(s.trim()));
    return [parts[0], parts[1], parts[2], parts.length > 3 ? parts[3] : 1];
  }
  throw new Error('无法解析颜色: ' + value);
}

/** 把带 alpha 的前景色合成到底色上 */
function composite(fg, bg) {
  const a = fg[3];
  return [
    fg[0] * a + bg[0] * (1 - a),
    fg[1] * a + bg[1] * (1 - a),
    fg[2] * a + bg[2] * (1 - a),
    1,
  ];
}

function luminance([r, g, b]) {
  const channel = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

export function run() {
  const css = readFileSync('ui/tokens.css', 'utf8');
  const themes = parseTokens(css);

  // 画布：浅色主题下所有半透明色最终叠在白底上，深色主题叠在黑底上
  const canvas = { light: [255, 255, 255, 1], dark: [0, 0, 0, 1] };

  const checks = [
    // [前景令牌, 背景令牌, 最低要求, 说明]
    ['--nl-text', '--nl-bg', 4.5, '正文 / 页面底色'],
    ['--nl-text', '--nl-surface', 4.5, '正文 / 分组表面'],
    ['--nl-text-secondary', '--nl-surface', 4.5, '次要文字 / 分组表面'],
    ['--nl-on-accent', '--nl-accent', 4.5, '主按钮文字 / 强调色'],
    ['--nl-danger', '--nl-surface', 3.0, '错误状态（非文字 UI）'],
    ['--nl-success', '--nl-surface', 3.0, '成功状态（非文字 UI）'],
  ];

  const failures = [];

  for (const themeName of ['light', 'dark']) {
    const theme = themes[themeName];
    const base = canvas[themeName];

    for (const [fgToken, bgToken, min, label] of checks) {
      const bg = composite(parseColor(theme[bgToken]), base);
      const fg = composite(parseColor(theme[fgToken]), bg);
      const ratio = contrast(fg, bg);

      if (ratio < min) {
        failures.push(
          `${themeName}: ${label} (${fgToken} on ${bgToken}) = ${ratio.toFixed(2)}:1 < ${min}:1`
        );
      }
    }
  }

  // 减少透明度模式也必须达标（这一模式会把半透明表面变成不透明）
  {
    const theme = themes.reducedTransparency;
    const base = canvas.light;
    const bg = composite(parseColor(theme['--nl-surface']), base);
    const fg = composite(parseColor(theme['--nl-text']), bg);
    const ratio = contrast(fg, bg);
    if (ratio < 4.5) {
      failures.push(`reduced-transparency: 正文 / 分组表面 = ${ratio.toFixed(2)}:1 < 4.5:1`);
    }
  }

  assert.deepEqual(failures, [], '对比度不达标:\n' + failures.join('\n'));

  // 焦点环必须基于强调色（plan Task F2：不允许去掉 outline 而不给替代）
  assert.match(css, /--nl-accent:/, 'tokens.css 必须定义强调色');
  const components = readFileSync('ui/components.css', 'utf8');
  assert.match(components, /:focus-visible\s*\{[^}]*outline:/s,
    'components.css 必须为 :focus-visible 提供可见的 outline');
}
