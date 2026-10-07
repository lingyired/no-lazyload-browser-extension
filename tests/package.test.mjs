// tests/package.test.mjs
// 打包完整性：每个发行包里的引用必须都能解析到实际存在的文件。
//
// 为什么需要它：build.js 用「文件清单」决定往包里拷什么，而清单和源码的
// import 图是两处独立维护的东西。清单漏一个文件，浏览器加载扩展时会在
// 顶层 import 处直接失败 —— 而且只在打包产物里才暴露，源码跑测试看不出。
// （真实案例：新增 background/badge.js 与 shared/domain.js 后忘了更新
//   CHROME_FILES，Chrome 的 service worker 会整包加载失败。）

import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve, relative } from 'node:path';

export const name = '发行包完整性';

/** 解压 zip 到临时目录，返回目录路径 */
function unzip(zip) {
  const dir = mkdtempSync(join(tmpdir(), 'nl-pkg-'));
  execFileSync('unzip', ['-qo', zip, '-d', dir]);
  return dir;
}

/** 最新的 chrome/firefox zip */
function latestZip(prefix) {
  return execFileSync('sh', ['-c', `cd dist && ls -t ${prefix}-*.zip | head -1`], { encoding: 'utf8' }).trim();
}

/** 收集包里所有 JS 的顶层 import，以及 HTML 引用的 script/link */
function collectReferences(root) {
  const refs = [];
  const walk = (dir) => {
    for (const entry of execFileSync('sh', ['-c', `cd "${dir}" && find . -type f`], { encoding: 'utf8' }).trim().split('\n')) {
      const rel = entry.replace(/^\.\//, '');
      const abs = join(dir, rel);

      if (rel.endsWith('.js')) {
        const source = readFileSync(abs, 'utf8');
        // ESM 相对 import
        const re = /^\s*import\s+[\s\S]*?from\s+['"](\.[^'"]+)['"]/gm;
        let m;
        while ((m = re.exec(source)) !== null) {
          refs.push({ from: rel, to: resolve(dirname(abs), m[1]), kind: 'import' });
        }
      }

      if (rel.endsWith('.html')) {
        const html = readFileSync(abs, 'utf8');
        for (const m of html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)) {
          if (!/^https?:/.test(m[1])) refs.push({ from: rel, to: resolve(dirname(abs), m[1]), kind: 'script' });
        }
        for (const m of html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)) {
          if (!/^https?:/.test(m[1])) refs.push({ from: rel, to: resolve(dirname(abs), m[1]), kind: 'stylesheet' });
        }
      }
    }
  };
  walk(root);
  return refs;
}

function assertPackageIntact(root, label) {
  // 1. manifest 指向的文件必须存在
  const manifest = JSON.parse(readFileSync(join(root, 'manifest.json'), 'utf8'));
  const entries = [
    manifest.background && (manifest.background.service_worker || manifest.background.scripts?.[0]),
    ...(manifest.content_scripts || []).flatMap((cs) => [...(cs.js || []), ...(cs.css || [])]),
    manifest.action && manifest.action.default_popup,
    manifest.options_page || (manifest.options_ui && manifest.options_ui.page),
    ...Object.values(manifest.icons || {}),
  ].filter(Boolean);

  for (const entry of entries) {
    assert.ok(existsSync(join(root, entry)), `${label}: manifest 指向的 ${entry} 不存在`);
  }

  // 2. 所有相对引用都要能解析
  const broken = [];
  for (const ref of collectReferences(root)) {
    if (!existsSync(ref.to)) {
      broken.push(`${label}: ${ref.from} 通过 ${ref.kind} 引用了 ${relative(root, ref.to)}，但包里没有这个文件`);
    }
  }
  assert.deepEqual(broken, [], broken.join('\n'));
}

/**
 * Safari 的扩展资源不是靠 build.js 的文件清单打包的，而是靠 Xcode 工程里
 * 逐个 PBXFileReference —— 两份清单同样会漂移。
 * 真实案例：新增 locales.js / shared-ui.js / ui/ / privacy-policy.html 后
 * 忘了加进 pbxproj，App 能编译通过，但扩展里 popup.html 引用的 JS 全是 404。
 */
function assertXcodeProjectCoversResources() {
  const sourceDir = 'safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker Extension/Resources';
  const pbxproj = readFileSync(
    'safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj/project.pbxproj', 'utf8');

  const missing = [];
  for (const name of readdirSync(sourceDir)) {
    // pbxproj 里的引用写成 Resources/<name>
    if (!pbxproj.includes('Resources/' + name)) missing.push(name);
  }
  assert.deepEqual(missing, [],
    'Xcode 工程没有引用这些扩展资源，它们不会被打进 App：' + missing.join(', '));
}

export function run() {
  // 三个目标都要重新构建，确保测的是当前源码
  execFileSync('node', ['build.js', 'all'], { stdio: 'pipe' });

  assertXcodeProjectCoversResources();

  const targets = [
    { label: 'Chrome', root: unzip(join('dist', latestZip('chrome'))) },
    { label: 'Firefox', root: unzip(join('dist', latestZip('firefox'))) },
    { label: 'Safari', root: 'dist/safari' },
  ];

  try {
    for (const t of targets) assertPackageIntact(t.root, t.label);
  } finally {
    for (const t of targets) {
      if (t.label !== 'Safari') rmSync(t.root, { recursive: true, force: true });
    }
  }
}
