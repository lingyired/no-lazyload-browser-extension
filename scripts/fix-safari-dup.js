#!/usr/bin/env node
/**
 * scripts/fix-safari-dup.js
 *
 * 清理 Safari 扩展的重复注册。
 *
 * 为什么需要它：
 *   每次用 Xcode / xcodebuild 构建，macOS 都会把 DerivedData 里那份 .appex
 *   也注册进 Safari，于是「设置 → 扩展」里出现两个同名条目 —— 一个是已安装的
 *   正式副本，一个是刚构建出来的。两个都会被勾选，开发者分不清在测哪一份。
 *   这是 Xcode 的正常行为（它需要注册才能调试扩展），不是 bug。
 *
 * 本脚本只删「DerivedData 下的注册」，保留已安装副本。
 * 空闲位置（~/Applications 或 /Applications）那一份永远不动。
 *
 * 用法：
 *   node scripts/fix-safari-dup.js             # 实际清理
 *   node scripts/fix-safari-dup.js --dry-run   # 只看会删什么
 */

const { execFileSync } = require('child_process');

// 与 build.js 的 SAFARI_CONFIG.BUNDLE_IDENTIFIER 保持一致
const HOST_BUNDLE_ID = 'com.lingyi01.imagelazyloadblocker';
const EXT_BUNDLE_ID = HOST_BUNDLE_ID + '.Extension';

const dryRun = process.argv.includes('--dry-run');

/** 列出该扩展的所有注册（含已禁用）。返回 [{path}] */
function listRegistrations() {
  let out;
  try {
    out = execFileSync('pluginkit', ['-m', '-v', '-D', '-i', EXT_BUNDLE_ID], { encoding: 'utf8' });
  } catch {
    // pluginkit 在「一个都没注册」时返回非零，属正常
    return [];
  }
  // 注意：路径里含空格（"ImageLazyLoadBlocker Extension.appex"），
  // 不能用 \S+ —— 会匹配不到，静默返回空列表。
  return out
    .split('\n')
    .map((line) => line.match(/(\/.+\.appex)\s*$/))
    .filter(Boolean)
    .map((m) => ({ path: m[1] }));
}

function unregister(path) {
  if (dryRun) return true;
  try {
    execFileSync('pluginkit', ['-r', path], { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const all = listRegistrations();
  if (all.length === 0) {
    console.log('ℹ️  没有找到 ' + EXT_BUNDLE_ID + ' 的注册。');
    console.log('   （扩展还没被 Safari 注册过，或宿主 App 尚未运行过一次）');
    return;
  }

  const stale = all.filter((r) => r.path.includes('/DerivedData/'));
  const keep = all.filter((r) => !r.path.includes('/DerivedData/'));

  console.log('当前注册 ' + all.length + ' 条：');
  for (const r of all) {
    const tag = r.path.includes('/DerivedData/') ? '待删' : '保留';
    console.log('  [' + tag + '] ' + r.path);
  }
  console.log('');

  if (keep.length === 0) {
    console.warn('⚠️  没有已安装的副本，只剩 DerivedData —— 不删，否则扩展会彻底消失。');
    console.warn('   先运行一次 npm run build:safari 并在 Xcode 里安装，再回来清理。');
    return;
  }

  if (stale.length === 0) {
    console.log('✅ 没有重复注册，无需清理。');
    return;
  }

  let removed = 0;
  for (const r of stale) {
    if (unregister(r.path)) {
      removed++;
      console.log((dryRun ? '  [dry-run] 会删除: ' : '  🗑️  已删除: ') + r.path);
    } else {
      console.log('  ❌ 删除失败: ' + r.path);
    }
  }

  console.log('');
  if (dryRun) {
    console.log('（dry-run，未做改动。去掉 --dry-run 实际执行）');
  } else {
    console.log('✅ 清理完成，删除 ' + removed + ' 条，保留 ' + keep.length + ' 条。');
    console.log('   若 Safari 设置页没立即刷新，关掉设置窗口重开即可。');
  }
}

main();
