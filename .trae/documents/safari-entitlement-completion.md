# Safari Entitlement System — Completion Plan (Tasks 10 / 11 / 12)

> 本计划聚焦于完成 Entitlement 系统的**剩余工作**。Tasks 1–9 已在磁盘上完成并验证（Swift 层 8 个文件、shared 模块、background-safari.js、background/messageHandler.js、popup.js 均已就位）。本计划只覆盖 Task 10（settings/app.js 接线）、Task 11（i18n 收尾）、Task 12（build.js 修复 + 构建验证）。

---

## Summary

为 `settings/app.js` 接入 Entitlement 系统（5 个辅助函数 + 网站计数 badge + 导入限额），完成 i18n 收尾（`t()` 回退硬化 + `_locales/en/messages.json` 补 6 个 key），修复 `build.js` 的 Chrome 打包缺口（`shared/entitlements.js` 未被复制），最后构建并验证。

**核心原则**：业务层（settings 页面）永远只通过 `sendMessage(GET_ENTITLEMENTS / REQUEST_PURCHASE)` 与 background 通信，绝不直接接触 `JSEntitlementManager`、StoreKit、商品 ID。导入流程在触发限额时**不弹模态框**，只显示 `importPartial` toast（避免打断批量导入；用户可从 popup 的添加流程或 Host App 升级）。

---

## Current State Analysis

### 已完成（不改动）
- `shared/constants.js` — `APP_LIMITS.FREE_SITE_LIMIT=3`、`ENTITLEMENTS`（6 项）、`ENTITLEMENT_MESSAGE_TYPES`
- `shared/entitlements.js` — `JSEntitlementManager` ES 模块（`init/reload/has/isLimitEnforced/canAddSite/requestPurchase/restorePurchases`）
- `shared/upgrade-dialog.js` — `showUpgradeDialog({t})` 返回 `Promise<boolean>`
- `background-safari.js` — 内联 `JSEntitlementManager`（`enforceLimit:true`、`nativeBundleId:'com.lingyi01.imagelazyloadblocker'`），`SET_SITE_CONFIG` 对新域名返回 `{success:false,error:'LIMIT_REACHED'}`，3 个 entitlement handler 已就位
- `background/messageHandler.js` + `background/index.js` — Chrome/Firefox 走 `enforceLimit:false`，3 个 handler 已就位
- `popup.js` — 5 个辅助函数、`t()` 硬化、`toggleCurrentSite` 处理 `LIMIT_REACHED`、`loadSiteList` 用 `formatSiteCount` 全部完成
- Swift 层 8 个文件 + 2 个 `.entitlements`（v1 不含 App Group）+ pbxproj 接线已完成
- `settings/app.js` 顶部常量（`MESSAGE_TYPES` 扩展、`APP_LIMITS`、`ENTITLEMENTS`、`_entitlementState`）+ `zh`/`en` TRANSLATIONS 的 6 个 upgrade key **已就位**

### 待完成
1. **settings/app.js**：`t()` 回退未硬化；5 个辅助函数不存在；`loadSiteList` badge 显示裸数字；`importConfig` 无逐条限额检查
2. **i18n**：`_locales/en/messages.json` 缺 6 个 upgrade key
3. **build.js**：`CHROME_FILES` 缺 `shared/entitlements.js`，导致 Chrome 包 service worker import 失败

---

## Proposed Changes

### Task 10 — settings/app.js 接线

#### 10a. 硬化 `t()` 回退（lines 1595–1605）

**Why**: 当前回退到 `TRANSLATIONS['zh']`，与 popup.js 不一致；当某语言缺少 key 时应优先回退到 `en`。

**Edit**（[settings/app.js](file:///Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension/settings/app.js#L1595-L1605)）：

```js
// 旧
function t(key, replacements = {}) {
  const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS['zh'];
  let text = lang[key] || TRANSLATIONS['zh'][key] || key;

// 新
function t(key, replacements = {}) {
  const lang = TRANSLATIONS[currentLanguage] || TRANSLATIONS['en'] || TRANSLATIONS['zh'];
  let text = lang[key] || TRANSLATIONS['en']?.[key] || TRANSLATIONS['zh']?.[key] || key;
```

#### 10b. 新增 5 个辅助函数（插入到 `sendMessage` 之后、`showToast` 之前，即 line 1760 之后）

**Why**: settings 页面需要与 popup 一致的权限查询/升级能力。从 popup.js（lines 1193–1325）镜像，日志前缀改为 `[Settings]`。

**插入代码**（在 `sendMessage` 函数闭合 `}` 之后、`showToast` 之前）：

```js
// ===== Entitlement 辅助函数 =====

/**
 * 从 background 加载当前权限状态并缓存
 */
async function refreshEntitlementState() {
  try {
    const resp = await sendMessage(MESSAGE_TYPES.GET_ENTITLEMENTS);
    if (resp && resp.success) {
      _entitlementState = {
        entitlements: resp.entitlements || [],
        isLimitEnforced: !!resp.isLimitEnforced,
      };
    }
  } catch (e) {
    console.warn('[Settings] refreshEntitlementState failed', e);
  }
  return _entitlementState;
}

/**
 * 当前是否已解锁无限网站
 */
function hasUnlimitedSites() {
  // 非限额平台（Chrome/Firefox）永远返回 true
  if (!_entitlementState.isLimitEnforced) return true;
  return _entitlementState.entitlements.includes(ENTITLEMENTS.UNLIMITED_SITES);
}

/**
 * 格式化网站计数 badge：Pro 显示 ∞，Free 显示 count/3
 */
function formatSiteCount(count) {
  if (hasUnlimitedSites()) return '∞';
  return `${count}/${APP_LIMITS.FREE_SITE_LIMIT}`;
}

/**
 * 显示升级弹窗（内联自 shared/upgrade-dialog.js）
 * @returns {Promise<boolean>} true=用户点击 Upgrade
 */
function showUpgradeDialog() {
  const tr = (key) => t(key);
  return new Promise((resolve) => {
    const existing = document.getElementById('upgradeDialogOverlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'upgradeDialogOverlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.style.cssText = [
      'position:fixed', 'inset:0', 'background:rgba(0,0,0,0.5)',
      'display:flex', 'align-items:center', 'justify-content:center',
      'z-index:2147483647',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
    ].join(';');

    const dialog = document.createElement('div');
    dialog.style.cssText = [
      'background:#fff', 'color:#1d1d1f', 'border-radius:12px', 'padding:24px',
      'max-width:360px', 'width:calc(100% - 48px)',
      'box-shadow:0 8px 32px rgba(0,0,0,0.2)', 'text-align:center',
    ].join(';');

    const title = document.createElement('h2');
    title.textContent = tr('upgradeTitle');
    title.style.cssText = 'margin:0 0 12px;font-size:20px;font-weight:600';

    const body = document.createElement('p');
    body.textContent = tr('upgradeBody');
    body.style.cssText = 'margin:0 0 20px;font-size:14px;line-height:1.5;color:#424245';

    const buttonRow = document.createElement('div');
    buttonRow.style.cssText = 'display:flex;gap:10px;justify-content:center';

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = tr('cancelUpgrade');
    cancelBtn.style.cssText = [
      'flex:1', 'padding:10px 16px', 'border:1px solid #d2d2d7', 'background:#fff',
      'color:#1d1d1f', 'border-radius:8px', 'font-size:14px', 'font-weight:500', 'cursor:pointer',
    ].join(';');

    const upgradeBtn = document.createElement('button');
    upgradeBtn.textContent = tr('upgradeButton');
    upgradeBtn.style.cssText = [
      'flex:1', 'padding:10px 16px', 'border:none', 'background:#007aff', 'color:#fff',
      'border-radius:8px', 'font-size:14px', 'font-weight:600', 'cursor:pointer',
    ].join(';');

    buttonRow.appendChild(cancelBtn);
    buttonRow.appendChild(upgradeBtn);
    dialog.appendChild(title);
    dialog.appendChild(body);
    dialog.appendChild(buttonRow);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = (result) => {
      overlay.remove();
      cancelBtn.onclick = null;
      upgradeBtn.onclick = null;
      overlay.onclick = null;
      document.removeEventListener('keydown', onKey);
      resolve(result);
    };

    cancelBtn.onclick = () => close(false);
    upgradeBtn.onclick = () => close(true);
    overlay.onclick = (e) => { if (e.target === overlay) close(false); };
    const onKey = (e) => { if (e.key === 'Escape') close(false); };
    document.addEventListener('keydown', onKey);
    upgradeBtn.focus();
  });
}

/**
 * 发起购买并刷新权限状态
 * @returns {Promise<boolean>} 购买是否成功
 */
async function requestUpgrade() {
  try {
    const resp = await sendMessage(MESSAGE_TYPES.REQUEST_PURCHASE);
    if (resp && resp.success) {
      _entitlementState.entitlements = resp.entitlements || _entitlementState.entitlements;
      return true;
    }
    return false;
  } catch (e) {
    console.warn('[Settings] requestUpgrade failed', e);
    return false;
  }
}
```

#### 10c. 接线 `loadSiteList` 的 badge（lines 1814–1818）

**Why**: Safari Free 用户应看到 `count/3`，Pro 看到 `∞`，而不是裸数字。

**Edit**（[settings/app.js](file:///Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension/settings/app.js#L1814-L1818)）：

```js
// 旧
// 更新计数
const count = Object.keys(configs).length;
if (siteCount) {
  siteCount.textContent = count;
}

// 新
// 更新计数（含权限状态：Pro 显示 ∞，Free 显示 count/3）
const count = Object.keys(configs).length;
await refreshEntitlementState();
if (siteCount) {
  siteCount.textContent = formatSiteCount(count);
}
```

> `loadSiteList` 已是 `async function`，`await` 安全。

#### 10d. 接线 `importConfig` 逐条限额检查（lines 2053–2059）

**Why**: Safari Free 用户导入超过 3 个网站时，应在中途停止并提示 `importPartial`，而不是静默丢弃后续站点。**不弹模态框**（避免打断批量导入；用户可从 popup 添加流程升级）。

**Edit**（[settings/app.js](file:///Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension/settings/app.js#L2053-L2072)）：

```js
// 旧
    // 导入网站配置
    for (const [domain, config] of Object.entries(data.siteConfigs)) {
      await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: config.strategy || STRATEGIES.TECH_BLOCK
      });
    }

    // 导入全局配置
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });

    loadSiteList();
    loadGlobalSettings();
    showToast(t('configImported'));
  } catch (error) {
    showToast(t('importFailed') + error.message);
  }

// 新
    // 导入网站配置（逐条检查限额，Safari Free 用户达上限时停止）
    const totalSites = Object.keys(data.siteConfigs).length;
    let added = 0;
    let limitReached = false;
    for (const [domain, config] of Object.entries(data.siteConfigs)) {
      const resp = await sendMessage(MESSAGE_TYPES.SET_SITE_CONFIG, {
        domain,
        strategy: config.strategy || STRATEGIES.TECH_BLOCK
      });
      if (resp && resp.success === false && resp.error === 'LIMIT_REACHED') {
        limitReached = true;
        break;
      }
      added++;
    }

    // 导入全局配置（即使网站导入被截断，全局配置仍可导入）
    await sendMessage(MESSAGE_TYPES.SET_GLOBAL_CONFIG, {
      config: data.globalConfig
    });

    loadSiteList();
    loadGlobalSettings();
    showToast(limitReached
      ? t('importPartial', { added, total: totalSites })
      : t('configImported'));
  } catch (error) {
    showToast(t('importFailed') + error.message);
  }
```

> 注：`added` 仅在 `SET_SITE_CONFIG` 成功时自增。若 background 因限额拒绝某域名，该域名不计入 `added`，循环立即 break。`importPartial` 文案：`已导入 {added}/{total} 个网站，免费版上限为 3 个。`（zh）/ `Imported {added} of {total} sites. Free limit is 3.`（en）。

---

### Task 11 — i18n 收尾

#### 11a. `_locales/en/messages.json` 补 6 个 key

**Why**: 该文件用于 manifest 及非内联文案的 i18n 来源；为完整性补充 upgrade 相关键（使用 Chrome i18n 占位符语法 `$added$`/`$total$`）。

**Edit**（[_locales/en/messages.json](file:///Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension/_locales/en/messages.json#L189-L194)）：在 `"languageSettings"` 块之后、最终 `}` 之前插入：

```json
  "languageSettings": {
    "message": "Language Settings",
    "description": "Language settings section title"
  },
  "upgradeTitle": {
    "message": "Unlock Pro",
    "description": "Upgrade dialog title"
  },
  "upgradeBody": {
    "message": "Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features.",
    "description": "Upgrade dialog body"
  },
  "upgradeButton": {
    "message": "Upgrade",
    "description": "Upgrade dialog confirm button"
  },
  "cancelUpgrade": {
    "message": "Cancel",
    "description": "Upgrade dialog cancel button"
  },
  "siteLimitReached": {
    "message": "Site limit reached",
    "description": "Toast shown when free limit is hit"
  },
  "importPartial": {
    "message": "Imported $added$ of $total$ sites. Free limit is 3.",
    "description": "Toast shown when import is truncated by free limit",
    "placeholders": {
      "added": { "content": "$1", "example": "3" },
      "total": { "content": "$2", "example": "10" }
    }
  }
}
```

> Task 11b/11c（popup.js 与 settings/app.js 的内联 `zh`/`en` TRANSLATIONS）已在之前会话完成，无需改动。Task 11d（settings `t()` 硬化）已并入 Task 10a。

---

### Task 12 — build.js 修复 + 构建验证

#### 12a. 修复 `CHROME_FILES` 缺 `shared/entitlements.js`

**Why**: `background/index.js` 第 5 行 `import { JSEntitlementManager } from '../shared/entitlements.js';`，但 `build.js` 的 `CHROME_FILES` 未复制该文件，导致 Chrome 包 service worker import 失败。

**Edit**（[build.js](file:///Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension/build.js#L166-L172)）：

```js
// 旧
const CHROME_FILES = {
  'manifest.json': 'manifest.json',
  'background/index.js': 'background/index.js',
  'background/messageHandler.js': 'background/messageHandler.js',
  'background/siteConfigManager.js': 'background/siteConfigManager.js',
  'shared/constants.js': 'shared/constants.js',
};

// 新
const CHROME_FILES = {
  'manifest.json': 'manifest.json',
  'background/index.js': 'background/index.js',
  'background/messageHandler.js': 'background/messageHandler.js',
  'background/siteConfigManager.js': 'background/siteConfigManager.js',
  'shared/constants.js': 'shared/constants.js',
  'shared/entitlements.js': 'shared/entitlements.js',
};
```

> Firefox 若复用 `CHROME_FILES` 一并受益；若走 `FIREFOX_FILES` 单独路径则不受影响（Firefox 暂未接 entitlement，沿用旧 background-firefox.js）。`shared/upgrade-dialog.js` **不加入**：popup.js/settings.app.js 已内联该弹窗，无需单独分发。

#### 12b. 构建命令

```bash
cd /Users/lingsmbp/Documents/aiwork/no-lazyload-browser-extension
node build.js safari     # 自动 +1 patch 版本，输出到 dist/safari/ 并同步到 safari-xcode/.../Resources/
node build.js chrome     # 验证 Chrome 包含 shared/entitlements.js（可选，用于回归验证）
```

#### 12c. 验证矩阵

**Safari（需 Xcode 手动步骤）**：
1. 打开 `safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj`
2. 选择签名 Team（Personal Team 即可，v1 无 App Group）
3. **Cmd+Shift+K**（Clean Build，清除 DerivedData 缓存）
4. **Cmd+R** 运行 → Safari 启动 → 在 Safari 设置中启用 ImageLazyLoadBlocker 扩展并授权 `<all_urls>`

**测试用例**：

| # | 场景 | 预期 |
|---|---|---|
| 1 | 空配置时打开 popup | 网站计数显示 `0/3` |
| 2 | 添加第 1–3 个网站 | 成功添加，计数变 `1/3`→`3/3` |
| 3 | 添加第 4 个网站 | 弹出 Upgrade Dialog；点 Cancel → toast `已达网站数量上限`；计数仍 `3/3` |
| 4 | 第 4 次添加 → Dialog → Upgrade | Mock 购买成功，网站被添加，计数变 `∞` |
| 5 | 升级后重启 Safari → 再打开 popup | 计数仍 `∞`（EntitlementStore 持久化生效） |
| 6 | 设置页打开 | 网站计数 badge 与 popup 一致（`3/3` 或 `∞`） |
| 7 | 导入含 5 个网站的配置文件（Free 状态） | toast 显示 `已导入 3/5 个网站，免费版上限为 3 个。`；列表只有 3 个 |
| 8 | 导入含 5 个网站的配置文件（Pro 状态） | toast 显示 `配置已导入`；列表有 5 个 |
| 9 | Chrome 构建运行 | 无限额，网站计数显示 `∞`；导入 5 个全部成功 |
| 10 | `grep -r "isPro" --include="*.js" --include="*.swift" .` | 0 命中 |

**回归验证**：白名单、自动滚动、规则管理、设置界面、暗色模式均应不受影响（本次未触碰这些逻辑）。

---

## Assumptions & Decisions

1. **settings 导入不弹 Upgrade Dialog**：批量导入被限额截断时只显示 `importPartial` toast，不弹模态框。理由：模态框会打断批量导入流程，且用户可从 popup 的单站添加流程或 Host App 升级。若后续产品要求导入时也引导升级，可在 `importConfig` 的 `limitReached` 分支追加 `showUpgradeDialog()` 调用。
2. **`showUpgradeDialog` 在 settings 中定义但不立即接线**：为与 popup 保持 API 一致性并供未来「添加网站」按钮使用。当前 settings 只有导入入口会触发限额。
3. **`shared/upgrade-dialog.js` 不加入 CHROME_FILES**：popup.js 与 settings/app.js 均已内联该弹窗实现，无需作为独立资源分发。
4. **`_locales/en/messages.json` 的 `importPartial` 使用 Chrome i18n 占位符语法**（`$added$`/`$total$` + `placeholders`），而内联 TRANSLATIONS 使用 `{added}`/`{total}` 语法——两者互不影响（内联 `t()` 不读 `_locales`）。
5. **不重构既有 `MESSAGE_TYPES` 4 处重复**：这是既有模式（popup/settings/background-safari/background 各一份），本次只扩展不重构，遵循最小侵入。
6. **v1 仍不接 App Group**：免费 Personal Team 无法 provisioning App Group；`EntitlementStore` 回退到 `UserDefaults.standard`。跨进程同步（Host App 写 → Extension 读）在 v1 Mock 下运行于同一扩展进程，可工作；真正跨进程同步留待 v2 StoreKit + 付费账号。

---

## Verification（执行后自查）

- [ ] `settings/app.js`：`grep -n "function refreshEntitlementState\|function hasUnlimitedSites\|function formatSiteCount\|function showUpgradeDialog\|function requestUpgrade" settings/app.js` 返回 5 行
- [ ] `settings/app.js`：`t()` 函数体含 `TRANSLATIONS['en']`
- [ ] `settings/app.js`：`loadSiteList` 内含 `await refreshEntitlementState()` 与 `formatSiteCount(count)`
- [ ] `settings/app.js`：`importConfig` 内含 `LIMIT_REACHED` 与 `importPartial`
- [ ] `_locales/en/messages.json`：`grep -c "upgradeTitle\|upgradeBody\|upgradeButton\|cancelUpgrade\|siteLimitReached\|importPartial"` 返回 6
- [ ] `build.js`：`CHROME_FILES` 含 `'shared/entitlements.js'`
- [ ] `node build.js safari` 成功，版本号自增，`dist/safari/background-safari.js` 存在
- [ ] `node build.js chrome` 成功，`dist/chrome/shared/entitlements.js` 存在
- [ ] Safari 测试矩阵 1–10 全部通过
