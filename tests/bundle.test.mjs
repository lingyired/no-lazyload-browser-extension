// tests/bundle.test.mjs
// 构建产物的完整性：生成的经典脚本必须是合法的、没有残留模块语法，
// 且产物必须真的被页面引用 —— "生成了却没人加载" 是本仓库踩过的真实坑。

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

export const name = 'build artifacts';

function loadClassic(file) {
  const code = readFileSync(file, 'utf8');
  // classic script: 解析即可（不执行，避免依赖浏览器 API）
  new vm.Script(code, { filename: file });
  return code;
}

export function run() {
  // 先生成一次构建产物（幂等，不改变版本号）
  execFileSync('node', ['build.js', 'safari'], { stdio: 'pipe' });

  const dir = 'dist/safari';
  const background = loadClassic(dir + '/background-safari.js');
  const locales = loadClassic(dir + '/locales.js');

  // 1. 不留模块语法
  assert.equal(/^\s*import\s/m.test(background), false, 'background 不应有 import');
  assert.equal(/^\s*export\s/m.test(background), false, 'background 不应有 export');
  assert.equal(/^\s*import\s/m.test(locales), false, 'locales 不应有 import');
  assert.equal(/^\s*export\s/m.test(locales), false, 'locales 不应有 export');

  // 2. 关键实现只出现一次
  const occurrences = (haystack, needle) => haystack.split(needle).length - 1;
  assert.equal(occurrences(background, 'function normalizeHostname'), 1,
    'background 里域名规范化只能有一份');
  assert.equal(occurrences(background, 'function setupMessageHandler'), 1,
    'background 里消息处理只能有一份');

  // 3. locales.js 必须真的被页面加载
  //    历史教训：locales.js 被生成并打包了很久，但没有任何 HTML 引用它，
  //    翻译实际来自 popup.js / settings/app.js 里各自内联的 37 语言表 —— 术语因此漂移。
  assert.equal(occurrences(locales, 'window.__LOCALES__'), 1,
    'locales.js 必须定义 window.__LOCALES__');
  for (const page of ['popup.html', 'settings/index.html']) {
    const html = readFileSync(dir + '/' + page, 'utf8');
    assert.ok(/<script[^>]+src=["'][^"']*locales\.js["']/.test(html),
      page + ' 必须加载 locales.js（否则翻译会退化成显示 key 名）');
  }
  // 页面脚本必须在 locales.js 之后加载
  const popupHtml = readFileSync(dir + '/popup.html', 'utf8');
  assert.ok(popupHtml.indexOf('locales.js') < popupHtml.indexOf('popup.js'),
    'popup.js 必须在 locales.js 之后加载');

  // 3b. 同一页面加载的多个经典脚本不得重复声明同名顶层变量
  //     经典脚本共享全局作用域，重名直接 SyntaxError，整个页面初始化失败。
  //     真实案例：popup.js 与 shared-ui.js 同时加载时撞 'STRATEGIES'。
  //     现在页面是 locales.js + 页面脚本，仍然值得守住这条线。
  const topLevelNames = (src) => {
    const names = new Set();
    const re = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
    let m;
    while ((m = re.exec(src)) !== null) names.add(m[1]);
    return names;
  };
  for (const page of ['popup.html', 'settings/index.html']) {
    const html = readFileSync(dir + '/' + page, 'utf8');
    const scripts = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)].map((m) => m[1]);
    assert.ok(scripts.length >= 2, page + ' 应至少加载 locales.js 与页面脚本');
    const seen = new Map();
    for (const rel of scripts) {
      const abs = resolve(dirname(dir + '/' + page), rel);
      assert.ok(existsSync(abs), page + ' 引用的 ' + rel + ' 不存在');
      for (const name of topLevelNames(readFileSync(abs, 'utf8'))) {
        assert.equal(seen.has(name), false,
          page + ': "' + name + '" 在 ' + seen.get(name) + ' 与 ' + rel + ' 中重复声明（SyntaxError）');
        seen.set(name, rel);
      }
    }
  }

  // 4. 已删除的死机制不得复活
  for (const dead of ['i18n-manager.js', 'shared-ui.js']) {
    assert.equal(existsSync(dir + '/' + dead), false,
      dead + ' 是已删除的死产物，不应再被生成');
    for (const page of ['popup.html', 'settings/index.html']) {
      assert.ok(!readFileSync(dir + '/' + page, 'utf8').includes(dead),
        page + ' 不应再引用已删除的 ' + dead);
    }
  }

  // 5. 三个平台都是免费版：产物里不得残留任何内购 / 授权 / 限额代码
  const purchaseMarkers = [
    'JSEntitlementManager', 'entitlement', 'Entitlement',
    'getEntitlements', 'refreshEntitlements', 'requestPurchase',
    'restorePurchases', 'openHostApp', 'ackEntitlementNotice',
    'unlimitedSites', 'LIMIT_REACHED', 'PRO_REQUIRED',
    'freeSiteLimit', 'showUpgradeDialog', 'upgrade-dialog',
    'pendingEntitlementAction', 'entitlementNotice',
  ];
  for (const marker of purchaseMarkers) {
    assert.equal(occurrences(background, marker), 0,
      'background-safari.js 不应再出现内购相关标识: ' + marker);
  }

  // 6. manifest 指向的 background 文件确实存在
  const manifest = JSON.parse(readFileSync(dir + '/manifest.json', 'utf8'));
  assert.equal(existsSync(dir + '/' + manifest.background.service_worker), true,
    'manifest 里的 service_worker 文件不存在');

  // 7. Firefox 的 MV2 background 同样是生成的合法经典脚本
  execFileSync('node', ['build.js', 'firefox'], { stdio: 'pipe' });
  const ffZip = execFileSync('sh', ['-c',
    'cd dist && ls -t firefox-*.zip | head -1'], { encoding: 'utf8' }).trim();
  const ff = execFileSync('sh', ['-c',
    'unzip -p dist/' + ffZip + ' background-firefox.js'], { encoding: 'utf8' });
  new vm.Script(ff, { filename: 'background-firefox.js' });
  assert.equal(/^\s*import\s/m.test(ff), false, 'Firefox background 不应有 import');
  assert.equal(occurrences(ff, 'function normalizeHostname'), 1,
    'Firefox background 里域名规范化只能有一份（来自 shared/domain.js）');
  assert.equal(occurrences(ff, 'getEntitlements'), 0,
    'Firefox background 不应再出现内购相关标识');
}
