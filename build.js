#!/usr/bin/env node

/**
 * Build script for Image Lazy Load Blocker
 * Supports Chrome (MV3) and Firefox (MV2)
 * Generates versioned zip packages
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const BUILD_DIR = 'dist';
const SRC_DIR = '.';

// 版本号文件
const VERSION_FILE = 'version.json';

// 获取或初始化版本号
function getVersion() {
  if (fs.existsSync(VERSION_FILE)) {
    const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    return data.version;
  }
  // 从 manifest.json 读取初始版本
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  return manifest.version || '1.0.0';
}

// 保存版本号
function saveVersion(version) {
  fs.writeFileSync(VERSION_FILE, JSON.stringify({ version, updatedAt: new Date().toISOString() }, null, 2));
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
  'i18n.js',
  'i18n-manager.js',
  'content/index.js',
  'content/styles.css',
  'settings/index.html',
  'settings/app.js',
  'settings/styles.css',
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
};

// Firefox specific files
const FIREFOX_FILES = {
  'manifest-firefox.json': 'manifest.json',
  'background-firefox.js': 'background-firefox.js',
};

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
  // 使用系统命令创建 zip（支持 Windows 和 Unix）
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // Windows: 使用 PowerShell
    const command = `powershell -command "Compress-Archive -Path '${sourceDir}/*' -DestinationPath '${zipPath}' -Force"`;
    execSync(command, { stdio: 'ignore' });
  } else {
    // Unix/Mac: 使用 zip 命令
    // cd 到 sourceDir 的父目录后，使用相对路径
    const relativeZipPath = path.relative(path.dirname(sourceDir), zipPath);
    const command = `cd "${path.dirname(sourceDir)}" && zip -r "${relativeZipPath}" "${path.basename(sourceDir)}" -q`;
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

function buildAll(version) {
  console.log('🔨 Building Image Lazy Load Blocker...');
  console.log(`📌 Version: v${version}`);

  // 同步版本号到 manifest 文件
  saveVersion(version);

  // 确保 dist 目录存在（不清空）
  ensureDir(BUILD_DIR);

  buildChrome(version);
  buildFirefox(version);

  console.log('\n🎉 Build complete!');
  console.log(`   Version: v${version}`);
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
  console.log(`Current version: v${getVersion()}`);
} else if (!target || target === 'all') {
  // 构建全部（不递增版本）
  const version = getVersion();
  buildAll(version);
} else if (target === 'chrome') {
  const version = getVersion();
  buildChrome(version);
} else if (target === 'firefox') {
  const version = getVersion();
  buildFirefox(version);
} else if (['patch', 'minor', 'major'].includes(target)) {
  // 递增版本并构建全部
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
  console.log('  patch           Build all with patch version bump (1.0.0 → 1.0.1)');
  console.log('  minor           Build all with minor version bump (1.0.0 → 1.1.0)');
  console.log('  major           Build all with major version bump (1.0.0 → 2.0.0)');
  console.log('  bump [type]     Only bump version without build');
  console.log('  version         Show current version');
  console.log('');
  console.log('Examples:');
  console.log('  node build.js              # Build all');
  console.log('  node build.js patch        # Build all, increment patch');
  console.log('  node build.js minor        # Build all, increment minor');
  console.log('  node build.js bump major   # Only bump major version');
  process.exit(1);
}
