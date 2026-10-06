// tests/bundle.test.mjs
// 构建产物的完整性：生成的经典脚本必须是合法的、没有残留模块语法，
// 且与调用方脚本之间不能有重复的顶层声明（经典脚本共享全局作用域，重名直接 SyntaxError）。

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

export const name = 'build artifacts';

/** 取出顶层声明名（const/let/var/function/class） */
function topLevelNames(source) {
  const names = new Set();
  const declRe = /^(?:const|let|var|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = declRe.exec(source)) !== null) names.add(m[1]);
  return names;
}

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
  const sharedUi = loadClassic(dir + '/shared-ui.js');

  // 1. 不留模块语法
  assert.equal(/^\s*import\s/m.test(background), false, 'background 不应有 import');
  assert.equal(/^\s*export\s/m.test(background), false, 'background 不应有 export');
  assert.equal(/^\s*import\s/m.test(sharedUi), false, 'shared-ui 不应有 import');
  assert.equal(/^\s*export\s/m.test(sharedUi), false, 'shared-ui 不应有 export');

  // 2. 关键实现只出现一次（这正是 Phase H 的目的）
  const occurrences = (haystack, needle) => haystack.split(needle).length - 1;
  assert.equal(occurrences(background, 'class JSEntitlementManager'), 1,
    'background 里权限管理器只能有一份');
  assert.equal(occurrences(background, 'function getLicenseModeFor'), 1,
    'background 里 licenseMode 推导只能有一份');
  assert.equal(occurrences(sharedUi, 'function showUpgradeDialog'), 1,
    'shared-ui 里升级弹窗只能有一份');
  assert.equal(occurrences(sharedUi, 'function normalizeHostname'), 1,
    'shared-ui 里域名规范化只能有一份');

  // 3. shared-ui.js 与页面脚本之间不能重名（同一页面里会被同时加载）
  const sharedNames = topLevelNames(sharedUi);
  for (const page of ['popup.js', 'settings/app.js']) {
    const pageNames = topLevelNames(readFileSync(page, 'utf8'));
    const clash = [...pageNames].filter((n) => sharedNames.has(n));
    assert.deepEqual(clash, [],
      page + ' 与 shared-ui.js 存在重复的顶层声明: ' + clash.join(', '));
  }

  // 4. manifest 指向的 background 文件确实存在
  const manifest = JSON.parse(readFileSync(dir + '/manifest.json', 'utf8'));
  assert.equal(existsSync(dir + '/' + manifest.background.service_worker), true,
    'manifest 里的 service_worker 文件不存在');

  // 5. popup / settings 都加载了 shared-ui.js
  assert.match(readFileSync(dir + '/popup.html', 'utf8'), /shared-ui\.js/);
  assert.match(readFileSync(dir + '/settings/index.html', 'utf8'), /shared-ui\.js/);

  // 6. Firefox 的 MV2 background 同样是生成的合法经典脚本
  execFileSync('node', ['build.js', 'firefox'], { stdio: 'pipe' });
  const ffZip = execFileSync('sh', ['-c',
    'cd dist && ls -t firefox-*.zip | head -1'], { encoding: 'utf8' }).trim();
  const ff = execFileSync('sh', ['-c',
    'unzip -p dist/' + ffZip + ' background-firefox.js'], { encoding: 'utf8' });
  new vm.Script(ff, { filename: 'background-firefox.js' });
  assert.equal(/^\s*import\s/m.test(ff), false, 'Firefox background 不应有 import');
  assert.equal(occurrences(ff, 'function normalizeHostname'), 1,
    'Firefox background 里域名规范化只能有一份（来自 shared/domain.js）');
}
