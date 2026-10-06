#!/usr/bin/env node

/**
 * Build script for Image Lazy Load Blocker
 * Supports Chrome (MV3), Firefox (MV2) and Safari (MV3)
 * Generates versioned zip packages
 *
 * 注意：Safari 的最终分发产物不是 zip，而是 Xcode 工程编译出的 .app。
 * 这里的 build:safari 只生成可被 `xcrun safari-web-extension-converter`
 * 转换的"Web Extension 源目录"（含 manifest-safari.json 改名为 manifest.json）。
 * 后续步骤：
 *   1. xcrun safari-web-extension-converter dist/safari
 *   2. 在生成的 Xcode 工程中编译运行（自动启动 Safari 并加载扩展）
 *   3. Safari 设置 → 扩展 中启用
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { bundleClassic } = require('./scripts/bundle-classic.js');

const BUILD_DIR = 'dist';
const SRC_DIR = '.';

// 版本号文件
const VERSION_FILE = 'version.json';

// Safari 构建配置
// Xcode 工程已"冻结"在仓库根目录 safari-xcode/（被 git 跟踪），
// 这样工程里的 Swift 代码（EntitlementManager 等）不会被重建覆盖。
// build:safari 只构建 dist/safari/（JS/HTML 等扩展源）并同步进工程的 Resources 目录。
// 首次生成工程用 `node build.js safari-init`。
const SAFARI_CONFIG = {
  APP_NAME: 'ImageLazyLoadBlocker',
  // 主 app 和 Extension 的 bundle ID 必须是前缀关系
  BUNDLE_IDENTIFIER: 'com.lingyi01.imagelazyloadblocker',
  // 冻结的 Xcode 工程目录（仓库根，被 git 跟踪）
  XCODE_PROJECT_DIR: 'safari-xcode',
};

// 读取 version.json（marketing version + build number）
function readVersionFile() {
  if (fs.existsSync(VERSION_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    } catch {
      // 损坏时按下面重建
    }
  }
  return {};
}

// 获取 marketing version（CFBundleShortVersionString / MARKETING_VERSION）
function getVersion() {
  const data = readVersionFile();
  if (data.version) return data.version;
  // 从 manifest.json 读取初始版本
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  return manifest.version || '1.0.0';
}

// 获取 build number（CFBundleVersion / CURRENT_PROJECT_VERSION）
// 独立于 marketing version 单调递增；App Store 只要求它比上次大。
function getBuildNumber() {
  const data = readVersionFile();
  const n = Number(data.buildNumber);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

// 递增 build number，不碰 marketing version
function bumpBuildNumber() {
  const n = getBuildNumber() + 1;
  saveVersion(getVersion(), n);
  console.log(`🔢 Build number: ${n - 1} → ${n}`);
  return n;
}

// 保存版本号（保留 build number）
function saveVersion(version, buildNumber = getBuildNumber()) {
  fs.writeFileSync(
    VERSION_FILE,
    JSON.stringify({ version, buildNumber, updatedAt: new Date().toISOString() }, null, 2) + '\n'
  );
  // 同时更新 manifest.json
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.version = version;
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2));
  // 更新 Firefox manifest
  if (fs.existsSync('manifest-firefox.json')) {
    const firefoxManifest = JSON.parse(fs.readFileSync('manifest-firefox.json', 'utf8'));
    firefoxManifest.version = version;
    fs.writeFileSync('manifest-firefox.json', JSON.stringify(firefoxManifest, null, 2));
  }
  // 更新 Safari manifest
  if (fs.existsSync('manifest-safari.json')) {
    const safariManifest = JSON.parse(fs.readFileSync('manifest-safari.json', 'utf8'));
    safariManifest.version = version;
    fs.writeFileSync('manifest-safari.json', JSON.stringify(safariManifest, null, 2));
  }
}

// 递增版本号
function bumpVersion(type = 'patch') {
  const currentVersion = getVersion();
  const [major, minor, patch] = currentVersion.split('.').map(Number);

  let newVersion;
  switch (type) {
    case 'major':
      newVersion = `${major + 1}.0.0`;
      console.log(`🔥 Major version bump: ${currentVersion} → ${newVersion}`);
      break;
    case 'minor':
      newVersion = `${major}.${minor + 1}.0`;
      console.log(`⭐ Minor version bump: ${currentVersion} → ${newVersion}`);
      break;
    case 'patch':
    default:
      newVersion = `${major}.${minor}.${patch + 1}`;
      console.log(`🔧 Patch version bump: ${currentVersion} → ${newVersion}`);
      break;
  }

  saveVersion(newVersion);
  return newVersion;
}

// 显示当前版本
function printVersion() {
  console.log(`Current version: v${getVersion()} (build ${getBuildNumber()})`);
}

// 在 HTML 文件中注入版本号
function injectVersionIntoHtml(filePath, version) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 检查是否已有版本号元素，如果有则替换
  if (content.includes('id="extensionVersion"')) {
    content = content.replace(/id="extensionVersion"[^>]*>[^<]*</, `id="extensionVersion">v${version}<`);
  } else if (content.includes('</body>')) {
    // 在 </body> 前添加版本号元素（如果不存在）
    // 先检查是否在 author div 中
    if (content.includes('class="author"')) {
      // 在 author div 中添加版本号
      content = content.replace(
        '(<div class="author">)',
        `$1\n    <span id="extensionVersion" class="version">v${version}</span> | `
      );
    }
  }

  fs.writeFileSync(filePath, content);
}

// 确保 HTML 文件中有版本号容器
function ensureVersionPlaceholder(filePath) {
  if (!fs.existsSync(filePath)) return;

  let content = fs.readFileSync(filePath, 'utf8');

  // 如果已经有版本号容器，跳过
  if (content.includes('id="extensionVersion"')) return;

  // 在 author div 中添加版本号（如果存在）
  if (content.includes('class="author"')) {
    // 查找 author div 并在开头添加版本号
    content = content.replace(
      /(<div class="author">)/,
      `$1\n      <span class="version">v<span id="extensionVersion">1.0.0</span></span> | `
    );
  }

  fs.writeFileSync(filePath, content);
}

// Files to copy for both browsers
const COMMON_FILES = [
  'popup.html',
  'popup.js',
  // 注意：shared-ui.js 是生成的，不在这里复制（见 writeSharedUiBundle）
  'i18n.js',
  'i18n-manager.js',
  'content/index.js',
  'content/styles.css',
  'settings/index.html',
  'settings/app.js',
  'settings/styles.css',
  // 共用 UI 主题（popup 与 settings 都消费同一套语义令牌）
  'ui/tokens.css',
  'ui/components.css',
  'ui/safari.css',
  'icons/icon16.png',
  'icons/icon48.png',
  'icons/icon128.png',
];

// Directories to copy
const COMMON_DIRS = [
  '_locales',
  'lingyired'
];

// Chrome specific files
const CHROME_FILES = {
  'manifest.json': 'manifest.json',
  'background/index.js': 'background/index.js',
  'background/messageHandler.js': 'background/messageHandler.js',
  'background/siteConfigManager.js': 'background/siteConfigManager.js',
  'shared/constants.js': 'shared/constants.js',
  'shared/entitlements.js': 'shared/entitlements.js',
};

// Firefox specific files
// Firefox 的 background 也是生成的经典脚本（MV2），见 writeFirefoxBackgroundBundle。
const FIREFOX_FILES = {
  'manifest-firefox.json': 'manifest.json',
};

// Safari specific files
// Safari 使用 MV3，结构与 Chrome 接近，但：
// - background 改用单文件经典脚本（避免 ES module 在 Safari 16.4 前的不稳定）
// - manifest 中 browser_specific_settings 指向 safari
// Safari 的 background 是生成的经典脚本（见 writeSafariBackgroundBundle），
// 不从这里复制。
const SAFARI_FILES = {
  'manifest-safari.json': 'manifest.json',
};

/**
 * 生成 locales.js：把 _locales/<lang>/messages.json 打包成一个经典脚本。
 *
 * 为什么不运行时 fetch _locales：扩展里 fetch 自己包内的 JSON 依赖
 * web_accessible_resources / 页面来源等条件，一旦失败，整个 UI 会退化成显示 key 名。
 * 构建期打包没有这些不确定性，且 _locales 仍是唯一文案来源。
 */
function writeLocalesBundle(targetDir) {
  const localesDir = path.join(SRC_DIR, '_locales');
  const bundle = {};

  for (const lang of fs.readdirSync(localesDir)) {
    const file = path.join(localesDir, lang, 'messages.json');
    if (!fs.existsSync(file)) continue;
    const messages = JSON.parse(fs.readFileSync(file, 'utf8'));
    const flat = {};
    for (const [key, value] of Object.entries(messages)) {
      if (value && typeof value.message === 'string') flat[key] = value.message;
    }
    bundle[lang] = flat;
  }

  const out = [
    '// ⚠️ 本文件由 build.js 从 _locales 目录生成，请勿手工修改。',
    '// 改文案请改 _locales，然后重新构建。',
    'window.__LOCALES__ = ' + JSON.stringify(bundle, null, 2) + ';',
    '',
  ].join('\n');

  fs.writeFileSync(path.join(targetDir, 'locales.js'), out);
  console.log('  🌐 Generated locales.js (' + Object.keys(bundle).length + ' languages)');
}

/**
 * 生成 Firefox 的 MV2 经典脚本 background。
 * 同样从 background/firefox.js 打包 —— 域名规范化等逻辑与其它端共用一份。
 */
function writeFirefoxBackgroundBundle(targetDir) {
  const out = bundleClassic(['background/firefox.js'], {
    banner: [
      '// ⚠️ 本文件由 build.js / scripts/bundle-classic.js 生成，请勿手工修改。',
      '// 源文件：background/firefox.js（及其依赖 shared/*.js）',
      '// 修改后重新运行: npm run build:firefox',
    ].join('\n'),
  });

  fs.writeFileSync(path.join(targetDir, 'background-firefox.js'), out);
  console.log('  🧩 Generated background-firefox.js (' + out.split('\n').length + ' lines)');
}

/**
 * 生成 Safari 的经典脚本 background。
 *
 * 源文件是 background/safari.js（ES module，和 Chrome 共用 messageHandler /
 * siteConfigManager / shared/*），构建时打包成单个经典脚本 ——
 * Safari 16.4 之前 "type": "module" 的 service worker 不稳定。
 *
 * 这样权限逻辑只写一次：改 shared/entitlements.js 或 messageHandler.js，
 * Safari 与 Chrome 同时生效，不再需要"记得同步那边"。
 */
function writeSafariBackgroundBundle(targetDir) {
  const out = bundleClassic(['background/safari.js'], {
    banner: [
      '// ⚠️ 本文件由 build.js / scripts/bundle-classic.js 生成，请勿手工修改。',
      '// 源文件：background/safari.js（及其依赖 background/*.js、shared/*.js）',
      '// 修改后重新运行: npm run build:safari',
    ].join('\n'),
  });

  fs.writeFileSync(path.join(targetDir, 'background-safari.js'), out);
  console.log('  🧩 Generated background-safari.js (' + out.split('\n').length + ' lines)');
}

/**
 * 生成 popup / settings 共用的经典脚本包。
 *
 * shared/*.js 是 ES module（background 用 import 消费），
 * 但 popup.html / settings/index.html 是经典脚本页面，无法 import，
 * 所以构建时打包成一份 shared-ui.js。
 *
 * 好处：常量与升级弹窗只有一份实现，改一次到处生效。
 */
function writeSharedUiBundle(targetDir) {
  const out = bundleClassic([
    'shared/upgrade-dialog.js',
    'shared/domain.js',
    'shared/constants.js',
  ], {
    banner: [
      '// ⚠️ 本文件由 build.js / scripts/bundle-classic.js 生成，请勿手工修改。',
      '// 源文件：shared/{upgrade-dialog,domain,constants}.js',
      '// 修改后重新运行: npm run build:safari（或 build:chrome / build:firefox）',
    ].join('\n'),
  });

  fs.writeFileSync(path.join(targetDir, 'shared-ui.js'), out);
  console.log('  🧩 Generated shared-ui.js (' + out.split('\n').length + ' lines)');
}

// 确保目录存在（不删除内容）
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir}`);
  }
}

// 删除旧版本 zip 包
function removeOldZipFiles(browser, newVersion) {
  if (!fs.existsSync(BUILD_DIR)) return;

  const files = fs.readdirSync(BUILD_DIR);
  const pattern = new RegExp(`^${browser}-\\d+\\.\\d+\\.\\d+\\.zip$`);

  for (const file of files) {
    if (pattern.test(file)) {
      const filePath = path.join(BUILD_DIR, file);
      // 提取版本号
      const match = file.match(/-(\d+\.\d+\.\d+)\.zip$/);
      if (match && match[1] !== newVersion) {
        fs.unlinkSync(filePath);
        console.log(`  🗑️ Removed old version: ${file}`);
      }
    }
  }
}

// 创建 zip 包
function createZip(sourceDir, zipPath) {
  // 删除已有的 zip 文件，防止追加模式导致旧文件残留
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // 使用系统命令创建 zip（支持 Windows 和 Unix）
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // Windows: 使用 PowerShell
    const command = `powershell -command "Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${zipPath}' -Force"`;
    execSync(command, { stdio: 'ignore' });
  } else {
    // Unix/Mac: 使用 zip 命令
    // cd 到 sourceDir 内部，打包当前目录内容（不带外层文件夹）
    const absoluteZipPath = path.resolve(zipPath);
    const command = `cd "${sourceDir}" && zip -r "${absoluteZipPath}" . -x "*.DS_Store" -q`;
    execSync(command, { stdio: 'ignore' });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`⚠️ Source directory not found: ${src}`);
    return;
  }
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 清空临时构建目录
function cleanTempDir(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function buildChrome(version) {
  console.log('\n📦 Building for Chrome...');
  const chromeDir = path.join(BUILD_DIR, 'chrome-temp');
  const zipFileName = `chrome-${version}.zip`;
  const zipPath = path.join(BUILD_DIR, zipFileName);

  // 清空临时目录
  cleanTempDir(chromeDir);

  // Copy common files
  COMMON_FILES.forEach(file => {
    copyFile(path.join(SRC_DIR, file), path.join(chromeDir, file));
  });

  // Copy common directories
  COMMON_DIRS.forEach(dir => {
    copyDir(path.join(SRC_DIR, dir), path.join(chromeDir, dir));
  });

  // Copy Chrome specific files
  Object.entries(CHROME_FILES).forEach(([src, dest]) => {
    copyFile(path.join(SRC_DIR, src), path.join(chromeDir, dest));
  });

  // 移除 Chrome 不支持的 browser_specific_settings 字段
  const manifestPath = path.join(chromeDir, 'manifest.json');
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    delete manifest.browser_specific_settings;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('  📝 Removed browser_specific_settings from Chrome manifest');
  }

  writeLocalesBundle(chromeDir);
  writeSharedUiBundle(chromeDir);

  // 更新版本号到 HTML
  // Update settings/index.html
  const settingsPath = path.join(chromeDir, 'settings/index.html');
  if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(settingsPath, content);
  }

  // Update popup.html
  const popupPath = path.join(chromeDir, 'popup.html');
  if (fs.existsSync(popupPath)) {
    let content = fs.readFileSync(popupPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(popupPath, content);
  }

  // 创建 zip 包
  console.log(`  📦 Creating ${zipFileName}...`);
  createZip(chromeDir, zipPath);

  // 删除临时目录
  fs.rmSync(chromeDir, { recursive: true });

  console.log('✅ Chrome build complete:', zipPath);
}

function buildFirefox(version) {
  console.log('\n📦 Building for Firefox...');
  const firefoxDir = path.join(BUILD_DIR, 'firefox-temp');
  const zipFileName = `firefox-${version}.zip`;
  const zipPath = path.join(BUILD_DIR, zipFileName);

  // 清空临时目录
  cleanTempDir(firefoxDir);

  // Copy common files
  COMMON_FILES.forEach(file => {
    copyFile(path.join(SRC_DIR, file), path.join(firefoxDir, file));
  });

  // Copy common directories
  COMMON_DIRS.forEach(dir => {
    copyDir(path.join(SRC_DIR, dir), path.join(firefoxDir, dir));
  });

  // Copy Firefox specific files
  Object.entries(FIREFOX_FILES).forEach(([src, dest]) => {
    copyFile(path.join(SRC_DIR, src), path.join(firefoxDir, dest));
  });

  writeFirefoxBackgroundBundle(firefoxDir);
  writeLocalesBundle(firefoxDir);
  writeSharedUiBundle(firefoxDir);

  // 更新版本号到 HTML
  // Update settings/index.html
  const settingsPath = path.join(firefoxDir, 'settings/index.html');
  if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(settingsPath, content);
  }

  // Update popup.html
  const popupPath = path.join(firefoxDir, 'popup.html');
  if (fs.existsSync(popupPath)) {
    let content = fs.readFileSync(popupPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(popupPath, content);
  }

  // 创建 zip 包
  console.log(`  📦 Creating ${zipFileName}...`);
  createZip(firefoxDir, zipPath);

  // 删除临时目录
  fs.rmSync(firefoxDir, { recursive: true });

  console.log('✅ Firefox build complete:', zipPath);
}

function buildSafari(version, buildNumber = getBuildNumber()) {
  console.log('\n📦 Building for Safari...');
  const safariDir = path.join(BUILD_DIR, 'safari-temp');
  // Safari 产物是一个目录（供 xcrun safari-web-extension-converter 消费），
  // 同时也打一个 zip 方便归档/传输
  const zipFileName = `safari-${version}.zip`;
  const zipPath = path.join(BUILD_DIR, zipFileName);

  // 清空临时目录
  cleanTempDir(safariDir);

  // Copy common files
  COMMON_FILES.forEach(file => {
    copyFile(path.join(SRC_DIR, file), path.join(safariDir, file));
  });

  // Copy common directories
  COMMON_DIRS.forEach(dir => {
    copyDir(path.join(SRC_DIR, dir), path.join(safariDir, dir));
  });

  // Copy Safari specific files
  Object.entries(SAFARI_FILES).forEach(([src, dest]) => {
    copyFile(path.join(SRC_DIR, src), path.join(safariDir, dest));
  });

  writeSafariBackgroundBundle(safariDir);
  writeLocalesBundle(safariDir);
  writeSharedUiBundle(safariDir);

  // 更新版本号到 HTML
  // Update settings/index.html
  const settingsPath = path.join(safariDir, 'settings/index.html');
  if (fs.existsSync(settingsPath)) {
    let content = fs.readFileSync(settingsPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(settingsPath, content);
  }

  // Update popup.html
  const popupPath = path.join(safariDir, 'popup.html');
  if (fs.existsSync(popupPath)) {
    let content = fs.readFileSync(popupPath, 'utf8');
    content = content.replace(/<span id="extensionVersion">[^<]*<\/span>/, `<span id="extensionVersion">${version}</span>`);
    fs.writeFileSync(popupPath, content);
  }

  // 创建 zip 包（归档用）
  console.log(`  📦 Creating ${zipFileName}...`);
  createZip(safariDir, zipPath);

  // 同时保留解压后的目录，方便直接传给 safari-web-extension-converter
  const finalDir = path.join(BUILD_DIR, 'safari');
  if (fs.existsSync(finalDir)) {
    fs.rmSync(finalDir, { recursive: true });
  }
  fs.renameSync(safariDir, finalDir);

  console.log('✅ Safari extension source built:', zipPath);
  console.log(`   Extension source dir: ${finalDir}`);

  // 同步扩展源进冻结的 Xcode 工程（覆盖 Resources，不删除工程/Swift 代码）
  syncSafariResources(finalDir, buildNumber);
}

/**
 * 将构建好的扩展源目录同步进冻结的 Xcode 工程的 Extension Resources 目录。
 * 仅覆盖 JS/HTML/CSS/locales 等资源文件，绝不删除工程或 Swift 文件。
 */
function syncSafariResources(extensionSourceDir, buildNumber = getBuildNumber()) {
  const projectName = SAFARI_CONFIG.APP_NAME;
  const resourcesDir = path.join(
    SAFARI_CONFIG.XCODE_PROJECT_DIR,
    projectName,
    `${projectName} Extension`,
    'Resources'
  );

  if (!fs.existsSync(resourcesDir)) {
    console.warn(`  ⚠️  未找到冻结工程的 Resources 目录: ${resourcesDir}`);
    console.warn('     若是首次构建，请先运行: node build.js safari-init');
    return;
  }

  console.log('\n🔄 Syncing extension resources into frozen Xcode project...');
  // 递归覆盖拷贝（copyDir 已跳过 .DS_Store 且 copyFileSync 会覆盖）
  copyDir(extensionSourceDir, resourcesDir);
  console.log(`  ✅ Synced → ${resourcesDir}`);

  // 同步扩展版本号到 Xcode 工程的 MARKETING_VERSION / CURRENT_PROJECT_VERSION
  syncXcodeVersion(extensionSourceDir, buildNumber);
  console.log('   在 Xcode 里 Cmd+Shift+K (Clean) 后 Cmd+R 重新运行');
}

/**
 * 把版本号同步到 Xcode pbxproj。
 *
 * MARKETING_VERSION        = CFBundleShortVersionString（用户可见的 1.13.0）
 * CURRENT_PROJECT_VERSION  = CFBundleVersion（独立递增的整数 build 号）
 *
 * 两者语义不同，绝不共用同一个值 —— 以前把完整版本号塞进 build 号，
 * 结果是"每次本地 Safari 构建都改一次营销版本"。
 * 两个 target（App + Extension）× 两个 config（Debug + Release）= 8 处替换。
 */
function syncXcodeVersion(extensionSourceDir, buildNumber = getBuildNumber()) {
  const projectName = SAFARI_CONFIG.APP_NAME;
  const pbxprojPath = path.join(
    SAFARI_CONFIG.XCODE_PROJECT_DIR,
    projectName,
    `${projectName}.xcodeproj`,
    'project.pbxproj'
  );

  if (!fs.existsSync(pbxprojPath)) {
    console.warn(`  ⚠️  未找到 pbxproj: ${pbxprojPath}，跳过版本号同步`);
    return;
  }

  // 从 manifest.json 读取版本号（与扩展版本一致）
  const manifestPath = path.join(extensionSourceDir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.warn('  ⚠️  未找到 manifest.json，跳过版本号同步');
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const version = manifest.version;
  if (!version) {
    console.warn('  ⚠️  manifest.json 无 version 字段，跳过版本号同步');
    return;
  }

  let content = fs.readFileSync(pbxprojPath, 'utf8');
  const before = content;

  // MARKETING_VERSION = X.X.X;  (App Store 显示的版本号)
  content = content.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${version};`
  );
  // CURRENT_PROJECT_VERSION = N;  (build 号，单调递增，与 marketing version 无关)
  content = content.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${buildNumber};`
  );

  if (content !== before) {
    fs.writeFileSync(pbxprojPath, content);
    console.log(`  🔧 Synced Xcode version → MARKETING_VERSION=${version}, CURRENT_PROJECT_VERSION=${buildNumber}`);
  } else {
    console.log(`  ℹ️  Xcode 版本号已为 ${version} (build ${buildNumber})，无需更新`);
  }
}

/**
 * 首次生成 Safari Xcode 工程（一次性）。
 * 之后工程被冻结在 safari-xcode/，build:safari 只同步资源。
 * 用法: node build.js safari-init
 */
function initSafariXcodeProject() {
  console.log('🍎 首次生成 Safari Xcode 工程（一次性）...');

  const extensionSourceDir = path.join(BUILD_DIR, 'safari');
  if (!fs.existsSync(extensionSourceDir)) {
    console.error(`❌ 未找到扩展源目录 ${extensionSourceDir}，请先运行: node build.js safari`);
    process.exit(1);
  }

  const projectName = SAFARI_CONFIG.APP_NAME;
  const projectRoot = SAFARI_CONFIG.XCODE_PROJECT_DIR;
  const projectDir = path.join(projectRoot, projectName);
  const pbxprojPath = path.join(projectDir, `${projectName}.xcodeproj`, 'project.pbxproj');

  try {
    execSync('xcrun --version', { stdio: 'ignore' });
  } catch (e) {
    console.error('❌ xcrun 不可用，请在 macOS 上执行');
    process.exit(1);
  }

  if (fs.existsSync(projectRoot)) {
    console.warn(`⚠️  ${projectRoot} 已存在。继续将覆盖该目录。`);
    fs.rmSync(projectRoot, { recursive: true });
  }
  fs.mkdirSync(projectRoot, { recursive: true });

  const cmd = [
    'xcrun safari-web-extension-converter',
    `"${extensionSourceDir}"`,
    '--macos-only',
    '--no-open',
    '--copy-resources',
    `--project-location "${projectRoot}"`,
    `--app-name "${projectName}"`,
  ].join(' ');

  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error('❌ safari-web-extension-converter 失败:', e.message);
    process.exit(1);
  }

  if (fs.existsSync(pbxprojPath)) {
    injectBundleId(pbxprojPath);
  }

  console.log('\n✅ Xcode project generated:');
  console.log(`   ${projectDir}/${projectName}.xcodeproj`);
  console.log('   接下来在 Xcode 里:');
  console.log('     1. open "' + path.join(projectDir, `${projectName}.xcodeproj`) + '"');
  console.log('     2. 两个 target 都选 Signing → Team');
  console.log('     3. 按 plan 文档添加 Shared/ Swift 文件与 App Group 能力');
  console.log('     4. Cmd+R 运行');
}

/**
 * 将 pbxproj 中的 com.yourCompany.xxx 替换为配置的 bundle ID
 * 主 app 用 BUNDLE_IDENTIFIER，Extension 用 BUNDLE_IDENTIFIER + '.Extension'
 */
function injectBundleId(pbxprojPath) {
  const baseId = SAFARI_CONFIG.BUNDLE_IDENTIFIER;
  const extensionId = baseId + '.Extension';

  let content = fs.readFileSync(pbxprojPath, 'utf8');
  const before = content;

  const appPattern = /com\.yourCompany\.[A-Za-z0-9_]+(?!\.)/g;
  const extPattern = /com\.yourCompany\.[A-Za-z0-9_]+\.Extension/g;

  content = content.replace(extPattern, extensionId);
  content = content.replace(appPattern, baseId);

  if (content !== before) {
    fs.writeFileSync(pbxprojPath, content);
    console.log(`  🔧 Bundle ID injected:`);
    console.log(`     App: ${baseId}`);
    console.log(`     Extension: ${extensionId}`);
  } else {
    console.log('  ℹ️  Bundle ID 未变化（可能已注入过）');
  }
}

function buildAll(version, buildNumber = getBuildNumber()) {
  console.log('🔨 Building Image Lazy Load Blocker...');
  console.log(`📌 Version: v${version} (build ${buildNumber})`);

  // 同步版本号到 manifest 文件（不改 build number）
  saveVersion(version, buildNumber);

  // 确保 dist 目录存在（不清空）
  ensureDir(BUILD_DIR);

  buildChrome(version);
  buildFirefox(version);
  buildSafari(version, buildNumber);

  console.log('\n🎉 Build complete!');
  console.log(`   Version: v${version} (build ${buildNumber})`);
  console.log(`   Output: ${BUILD_DIR}/`);
}

// CLI
const args = process.argv.slice(2);
const target = args[0];
const bumpType = args[1] || 'patch'; // 默认 patch 级别

// 确保源 HTML 文件中有版本号占位符
ensureVersionPlaceholder('settings/index.html');
ensureVersionPlaceholder('popup.html');

// 根据参数执行不同操作
if (target === 'bump') {
  // 仅递增版本号，不构建
  bumpVersion(bumpType);
} else if (target === 'version') {
  // 显示当前版本号
  printVersion();
} else if (!target || target === 'all') {
  // 构建全部（不递增版本）
  buildAll(getVersion());
} else if (target === 'build-number') {
  // 只递增 CFBundleVersion，不碰 marketing version，也不构建
  bumpBuildNumber();
} else if (target === 'chrome') {
  const version = getVersion();
  buildChrome(version);
} else if (target === 'firefox') {
  const version = getVersion();
  buildFirefox(version);
} else if (target === 'safari') {
  // 只构建，绝不改 marketing version —— 发版是显式动作（release:patch/minor）。
  buildSafari(getVersion());
} else if (target === 'safari-init') {
  // 首次生成（或重建）冻结的 Xcode 工程。日常迭代不要用，会覆盖工程。
  initSafariXcodeProject();
} else if (['patch', 'minor', 'major'].includes(target)) {
  // 递增 marketing version 并构建全部（发布动作）
  const newVersion = bumpVersion(target);
  buildAll(newVersion);
} else {
  console.log('Usage: node build.js [command] [options]');
  console.log('');
  console.log('Commands:');
  console.log('  (empty)         Build all (no version change)');
  console.log('  all             Build all (no version change)');
  console.log('  chrome          Build Chrome only (no version change)');
  console.log('  firefox         Build Firefox only (no version change)');
  console.log('  safari          Build Safari only (NO marketing version change)');
  console.log('  safari-init     Generate the frozen Xcode project ONCE (do NOT use for daily builds)');
  console.log('  build-number    Increment CFBundleVersion (build number) only');
  console.log('  patch           Build all with patch version bump (1.0.0 → 1.0.1)');
  console.log('  minor           Build all with minor version bump (1.0.0 → 1.1.0)');
  console.log('  major           Build all with major version bump (1.0.0 → 2.0.0)');
  console.log('  bump [type]     Only bump marketing version without build');
  console.log('  version         Show current version + build number');
  console.log('');
  console.log('Examples:');
  console.log('  node build.js              # Build all');
  console.log('  node build.js patch        # Build all, increment patch');
  console.log('  node build.js minor        # Build all, increment minor');
  console.log('  node build.js bump major   # Only bump major version');
  process.exit(1);
}
