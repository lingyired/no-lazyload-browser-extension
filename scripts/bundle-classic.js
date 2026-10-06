#!/usr/bin/env node
/**
 * scripts/bundle-classic.js
 *
 * 把 ES module 源码打包成一个「经典脚本」（无 import/export），
 * 供只能跑经典脚本的场景使用：
 *   · shared-ui.js   —— popup.html / settings/index.html 共用（常量 + 域名 + 升级弹窗）
 *   · background-safari.js —— Safari MV3 的 service worker
 *     （Safari 16.4 之前 "type": "module" 不稳定，沿用经典脚本）
 *
 * 为什么不用 esbuild/rollup：这些模块边界很干净（全是顶层 const/function/class，
 * 没有循环依赖、没有默认导出），一个 60 行的打包器足够，且不引入任何依赖。
 *
 * 生成物禁止手工修改 —— 改源文件，然后重新构建。
 */

const fs = require('fs');
const path = require('path');

/** 解析 import ... from '<相对路径>'，返回被依赖的绝对路径列表 */
function parseImports(source, fromFile) {
  const deps = [];
  const importRe = /^\s*import\s+(?:[\s\S]*?)\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/gm;
  let match;
  while ((match = importRe.exec(source)) !== null) {
    const spec = match[1];
    if (!spec.startsWith('.')) {
      throw new Error(`${fromFile}: 不支持非相对路径的 import（${spec}）`);
    }
    deps.push(path.resolve(path.dirname(fromFile), spec));
  }
  return deps;
}

/** 去掉 import 语句与 export 关键字，只保留声明本身 */
function stripModuleSyntax(source) {
  return source
    // import ... from '...';
    .replace(/^\s*import\s+[\s\S]*?\s+from\s+['"][^'"]+['"]\s*;?\s*$/gm, '')
    // export { a, b };  /  export { a } from '...';
    .replace(/^\s*export\s*\{[^}]*\}\s*(?:from\s+['"][^'"]+['"]\s*)?;?\s*$/gm, '')
    // export default xxx;
    .replace(/^\s*export\s+default\s+/gm, 'const __default_export__ = ')
    // export const/let/function/class/async function
    .replace(/^\s*export\s+(?=(const|let|var|function|async|class)\b)/gm, '')
    // export { a as b }; 形式已在上面处理
    .trim();
}

/** 顶层声明的名字，用于检测重复声明（经典脚本共享全局作用域，重名会直接抛错） */
function topLevelNames(source) {
  const names = [];
  const declRe = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let match;
  while ((match = declRe.exec(source)) !== null) names.push(match[1]);
  return names;
}

/**
 * 把入口及其依赖按依赖顺序拼成一个经典脚本。
 * @param {string[]} entries 绝对路径入口（按给定顺序）
 * @param {{banner?: string}} [options]
 * @returns {string}
 */
function bundleClassic(entries, options = {}) {
  const ordered = [];
  const seen = new Set();

  function visit(file) {
    if (seen.has(file)) return;
    seen.add(file);

    if (!fs.existsSync(file)) {
      throw new Error('缺少模块文件: ' + file);
    }
    const source = fs.readFileSync(file, 'utf8');

    // 先访问依赖，保证声明在被使用之前
    for (const dep of parseImports(source, file)) visit(dep);

    ordered.push({ file, body: stripModuleSyntax(source) });
  }

  entries.forEach(visit);

  // 重复顶层声明检测：经典脚本里 const/let/class 重名会直接 SyntaxError
  const declared = new Map();
  for (const { file, body } of ordered) {
    for (const name of topLevelNames(body)) {
      if (declared.has(name)) {
        throw new Error(
          `重复的顶层声明 "${name}"：${path.relative(process.cwd(), declared.get(name))} 与 ` +
          `${path.relative(process.cwd(), file)}。经典脚本共享全局作用域，必须改名或删除其中一份。`
        );
      }
      declared.set(name, file);
    }
  }

  const banner = options.banner ||
    '// ⚠️ 本文件由 scripts/bundle-classic.js 生成，请勿手工修改。\n' +
    '// 修改源文件后重新运行构建。';

  const parts = [banner, ''];
  for (const { file, body } of ordered) {
    parts.push('// ===== ' + path.relative(process.cwd(), file) + ' =====');
    parts.push(body);
    parts.push('');
  }

  return parts.join('\n');
}

module.exports = { bundleClassic, stripModuleSyntax, topLevelNames, parseImports };
