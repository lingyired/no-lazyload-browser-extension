#!/usr/bin/env node
// tests/run.js —— 零依赖测试运行器
// 用法: npm test   （或 node tests/run.js）

const { readdirSync } = await import('node:fs');
const { fileURLToPath, pathToFileURL } = await import('node:url');
const path = await import('node:path');

const here = path.dirname(fileURLToPath(import.meta.url));
const files = readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort();

let passed = 0;
const failures = [];

for (const file of files) {
  const mod = await import(pathToFileURL(path.join(here, file)).href);
  const label = mod.name || file;
  try {
    // 每个测试文件在独立的 storage 上下文里跑：动态 import 有缓存，
    // 所以模块级状态只能靠 stub 重置，不能靠重复 import。
    await mod.run();
    passed++;
    console.log(`  ✓ ${file}  (${label})`);
  } catch (error) {
    failures.push({ file, label, error });
    console.log(`  ✗ ${file}  (${label})`);
    console.log(`      ${error && error.message}`);
  }
}

console.log('');
if (failures.length === 0) {
  console.log(`✅ ${passed} test file(s) passed`);
  process.exit(0);
}
console.log(`❌ ${failures.length} of ${files.length} test file(s) failed`);
for (const f of failures) {
  console.log('\n--- ' + f.file + ' ---');
  console.log(f.error && f.error.stack ? f.error.stack : f.error);
}
process.exit(1);
