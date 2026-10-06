# Safari Entitlement & Purchase System — Implementation Plan

> Continuation plan. Swift layer (Tasks 1–3) is already complete on disk; this plan covers the remaining wiring (Tasks 4–12) needed to make the system actually compile and function end-to-end.

## Summary

Add a long-term-extensible Entitlement system to the No Lazy Load Safari Web Extension + Host App. Free tier limited to 3 websites; Pro unlocks unlimited. Architecture: `EntitlementManager.has(.unlimitedSites)` is the only business-layer check — never `isPro`. Purchase flows through a `PurchaseProvider` protocol with a Mock implementation (v1) and a StoreKit stub (v2). Safari enforces the limit; Chrome/Firefox remain unlimited.

## Current State Analysis

**Done (verified on disk):**
- `safari-xcode/.../Shared/` — all 8 Swift files exist and are fully implemented: `Entitlement.swift`, `AppLimits.swift` (freeSiteLimit=3), `EntitlementsConfig.swift` (appGroup + storeKey + productID), `EntitlementStore.swift` (App Group + UserDefaults.standard fallback), `EntitlementManager.swift` (singleton, `has()`/`grant()`/`revokeAll()`), `PurchaseProvider.swift` (protocol), `MockPurchaseProvider.swift` (0.4s delay, grants `.unlimitedSites`), `StoreKitPurchaseProvider.swift` (v2 stub).
- `SafariWebExtensionHandler.swift` — rewritten as action dispatcher (`getEntitlements`/`purchase`/`restore`), holds its own `MockPurchaseProvider`.
- `AppDelegate.swift` — has `purchaseProvider = MockPurchaseProvider()`, calls `EntitlementManager.shared.reload()` on launch.
- `ViewController.swift` — bundle ID fixed, handles `"restore"` message from Host App HTML, `injectProState()` calls `setPro(isPro)`.
- `Script.js` + `Main.html` — Pro status text + Restore button wired.
- `build.js` — frozen Xcode project (`safari-xcode/`), `syncSafariResources()`, `safari-init` command.
- `.gitignore` — ignores xcuserstate/xcuserdata.
- pbxproj Extension target has `CODE_SIGN_ENTITLEMENTS` set in both Debug (line 464) and Release (line 500).

**NOT done (the gaps this plan closes):**
1. **pbxproj** — 0 of 8 `Shared/*.swift` files are registered in any pbxproj section. They will not compile.
2. **pbxproj** — App target has no `CODE_SIGN_ENTITLEMENTS` in Debug (line 540) or Release (line 582).
3. **.entitlements files** — neither exists on disk; Extension target references a non-existent file → code-sign failure.
4. **JS constants** — `shared/constants.js` has no `APP_LIMITS`, `ENTITLEMENTS`, `ENTITLEMENT_MESSAGE_TYPES`.
5. **JS entitlement module** — `shared/entitlements.js` does not exist.
6. **JS upgrade dialog** — `shared/upgrade-dialog.js` does not exist.
7. **background-safari.js** — no entitlement init, no limit check in `SET_SITE_CONFIG` (line 221-224), no new message handlers.
8. **background/messageHandler.js + index.js** (Chrome/Firefox) — no entitlement handlers, no JSEntitlementManager init.
9. **popup.js** — MESSAGE_TYPES (line 18-23) missing entitlement types; `toggleCurrentSite` (1262-1287) doesn't handle `LIMIT_REACHED`; `loadSiteList` (1292-1302) shows plain count, no `/3` or `∞` badge.
10. **settings/app.js** — MESSAGE_TYPES (18-27) missing types; `renderSiteList` (1784-1787) plain count; `importConfig` (2012-2041) no per-addition limit check.
11. **i18n** — no upgrade-related keys in inline `TRANSLATIONS` dicts (popup.js + settings/app.js) nor in `_locales/en/messages.json`.

## Architecture (message-based, no JSEntitlementManager in UI layer)

```
popup.js / settings/app.js
    │  (browser.runtime.sendMessage)
    ▼
background-safari.js  ──► JSEntitlementManager  ──► browser.runtime.sendNativeMessage  ──► SafariWebExtensionHandler.swift
background/index.js   ──► JSEntitlementManager  ──► (no-op stub, Chrome/Firefox unlimited)
    │
    ▼
SET_SITE_CONFIG with limit check → returns {success:false, error:'LIMIT_REACHED'} when blocked
```

UI layer (popup.js, settings/app.js) never touches `JSEntitlementManager` directly. It only:
- Sends `GET_ENTITLEMENTS` on load → receives `{entitlements: [...]}` → shows `∞` or `3/3` badge.
- Sends `SET_SITE_CONFIG` → if response is `{success:false, error:'LIMIT_REACHED'}`, shows Upgrade Dialog.
- Upgrade Dialog → sends `REQUEST_PURCHASE` → on success retries `SET_SITE_CONFIG`.

This keeps the UI layer identical across browsers; only the background script differs.

## Proposed Changes

### Task 4 — pbxproj wiring + .entitlements files

**4a. Create two `.entitlements` files (minimal, no App Group for v1):**

`ImageLazyLoadBlocker/ImageLazyLoadBlocker.entitlements` (App):
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
</dict>
</plist>
```

`ImageLazyLoadBlocker Extension/ImageLazyLoadBlocker Extension.entitlements` (Extension): same content.

**Why no App Group in v1:** Free Apple Developer team (Personal Team) cannot provision App Groups. `EntitlementStore` already falls back to `UserDefaults.standard` when `UserDefaults(suiteName:)` returns nil, so v1 Mock purchase works entirely in the extension handler process. v2 StoreKit migration = add `com.apple.security.application-groups` array entry to both files + register the group in Apple Developer portal.

**4b. Add `CODE_SIGN_ENTITLEMENTS` for App target (Debug + Release):**

In `project.pbxproj`, before each App-target `INFOPLIST_FILE = ImageLazyLoadBlocker/Info.plist;` line (Debug ~line 540, Release ~line 582), insert:
```
CODE_SIGN_ENTITLEMENTS = "ImageLazyLoadBlocker/ImageLazyLoadBlocker.entitlements";
```
The App target's `INFOPLIST_FILE` has no quotes (distinguishes it from Extension target which has quotes), so the Edit can target `INFOPLIST_FILE = ImageLazyLoadBlocker/Info.plist;` with `replace_all: true`.

**4c. Register 8 Shared/*.swift files in pbxproj:**

Use 24-hex-char IDs with prefix `E1` (file refs), `E2` (build files), `E3` (group). Add to four sections:

**PBXFileReference section** (after line 81, before `/* End PBXFileReference section */`):
```
E1000001000000000000000A /* Entitlement.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = Entitlement.swift; sourceTree = "<group>"; };
E1000002000000000000000A /* AppLimits.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppLimits.swift; sourceTree = "<group>"; };
E1000003000000000000000A /* EntitlementsConfig.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EntitlementsConfig.swift; sourceTree = "<group>"; };
E1000004000000000000000A /* EntitlementStore.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EntitlementStore.swift; sourceTree = "<group>"; };
E1000005000000000000000A /* EntitlementManager.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = EntitlementManager.swift; sourceTree = "<group>"; };
E1000006000000000000000A /* PurchaseProvider.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = PurchaseProvider.swift; sourceTree = "<group>"; };
E1000007000000000000000A /* MockPurchaseProvider.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = MockPurchaseProvider.swift; sourceTree = "<group>"; };
E1000008000000000000000A /* StoreKitPurchaseProvider.swift */ = {isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = StoreKitPurchaseProvider.swift; sourceTree = "<group>"; };
```

**PBXBuildFile section** (after line 30, before `/* End PBXBuildFile section */`) — 16 entries (8 files × 2 targets):
```
E2000001000000000000000A /* Entitlement.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000001000000000000000A /* Entitlement.swift */; };
E2000002000000000000000A /* AppLimits.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000002000000000000000A /* AppLimits.swift */; };
E2000003000000000000000A /* EntitlementsConfig.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000003000000000000000A /* EntitlementsConfig.swift */; };
E2000004000000000000000A /* EntitlementStore.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000004000000000000000A /* EntitlementStore.swift */; };
E2000005000000000000000A /* EntitlementManager.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000005000000000000000A /* EntitlementManager.swift */; };
E2000006000000000000000A /* PurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000006000000000000000A /* PurchaseProvider.swift */; };
E2000007000000000000000A /* MockPurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000007000000000000000A /* MockPurchaseProvider.swift */; };
E2000008000000000000000A /* StoreKitPurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000008000000000000000A /* StoreKitPurchaseProvider.swift */; };
E2000009000000000000000A /* Entitlement.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000001000000000000000A /* Entitlement.swift */; };
E200000A0000000000000000A /* AppLimits.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000002000000000000000A /* AppLimits.swift */; };
E200000B0000000000000000A /* EntitlementsConfig.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000003000000000000000A /* EntitlementsConfig.swift */; };
E200000C0000000000000000A /* EntitlementStore.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000004000000000000000A /* EntitlementStore.swift */; };
E200000D0000000000000000A /* EntitlementManager.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000005000000000000000A /* EntitlementManager.swift */; };
E200000E0000000000000000A /* PurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000006000000000000000A /* PurchaseProvider.swift */; };
E200000F0000000000000000A /* MockPurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000007000000000000000A /* MockPurchaseProvider.swift */; };
E2000010000000000000000A /* StoreKitPurchaseProvider.swift in Sources */ = {isa = PBXBuildFile; fileRef = E1000008000000000000000A /* StoreKitPurchaseProvider.swift */; };
```

**PBXGroup section** — create new Shared group + add to root group's children:

New group entry (after line 110, before `3C7BD5CF3009E02000F4D44D /* Products */`):
```
E3000001000000000000000A /* Shared */ = {
    isa = PBXGroup;
    children = (
        E1000001000000000000000A /* Entitlement.swift */,
        E1000002000000000000000A /* AppLimits.swift */,
        E1000003000000000000000A /* EntitlementsConfig.swift */,
        E1000004000000000000000A /* EntitlementStore.swift */,
        E1000005000000000000000A /* EntitlementManager.swift */,
        E1000006000000000000000A /* PurchaseProvider.swift */,
        E1000007000000000000000A /* MockPurchaseProvider.swift */,
        E1000008000000000000000A /* StoreKitPurchaseProvider.swift */,
    );
    path = Shared;
    sourceTree = "<group>";
};
```

Add `E3000001000000000000000A /* Shared */,` to root group `3C7BD5C53009E02000F4D44D` children (after line 104, before `3C7BD5D03009E02000F4D44D /* ImageLazyLoadBlocker */`).

**PBXSourcesBuildPhase section** — add 8 build file IDs to each target's Sources phase:
- App target Sources (`3C7BD5CA3009E02000F4D44D`, line 292-295): add `E2000001000000000000000A` through `E2000008000000000000000A`.
- Extension target Sources (`3C7BD5E53009E02100F4D44D`, line 301-303): add `E2000009000000000000000A` through `E2000010000000000000000A`.

### Task 5 — JS entitlement constants + module

**5a. Update `shared/constants.js`** — append new exports:
```js
export const APP_LIMITS = {
  FREE_SITE_LIMIT: 3,
};

export const ENTITLEMENTS = {
  UNLIMITED_SITES: 'unlimitedSites',
  CLOUD_SYNC: 'cloudSync',
  IMPORT_EXPORT: 'importExport',
  ADVANCED_RULES: 'advancedRules',
  SMART_NETWORK_POLICY: 'smartNetworkPolicy',
  AI_RULES: 'aiRules',
};

export const ENTITLEMENT_MESSAGE_TYPES = {
  GET_ENTITLEMENTS: 'getEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
};
```

**5b. Create `shared/entitlements.js`** — canonical ES module:
```js
import { ENTITLEMENTS, APP_LIMITS } from './constants.js';

class JSEntitlementManager {
  constructor(options = {}) {
    this.entitlements = new Set();
    this.enforceLimit = options.enforceLimit ?? false;
    this.nativeBundleId = options.nativeBundleId ?? null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    await this.reload();
    this._initialized = true;
  }

  async reload() {
    if (!this.nativeBundleId) return; // Chrome/Firefox: no native bridge
    try {
      const resp = await browser.runtime.sendNativeMessage(this.nativeBundleId, { action: 'getEntitlements' });
      if (resp && Array.isArray(resp.entitlements)) {
        this.entitlements = new Set(resp.entitlements);
      }
    } catch (e) {
      console.warn('[Entitlement] reload failed', e);
    }
  }

  has(entitlement) {
    if (!this.enforceLimit) return true; // Chrome/Firefox: all granted
    return this.entitlements.has(entitlement);
  }

  isLimitEnforced() {
    return this.enforceLimit;
  }

  canAddSite(currentCount) {
    if (this.has(ENTITLEMENTS.UNLIMITED_SITES)) return true;
    return currentCount < APP_LIMITS.FREE_SITE_LIMIT;
  }

  async requestPurchase(entitlement) {
    if (!this.nativeBundleId) return true; // Chrome/Firefox: no-op success
    try {
      const resp = await browser.runtime.sendNativeMessage(this.nativeBundleId, { action: 'purchase' });
      if (resp && Array.isArray(resp.entitlements)) {
        this.entitlements = new Set(resp.entitlements);
      }
      return this.has(entitlement);
    } catch (e) {
      console.warn('[Entitlement] purchase failed', e);
      return false;
    }
  }

  async restorePurchases() {
    if (!this.nativeBundleId) return;
    try {
      const resp = await browser.runtime.sendNativeMessage(this.nativeBundleId, { action: 'restore' });
      if (resp && Array.isArray(resp.entitlements)) {
        this.entitlements = new Set(resp.entitlements);
      }
    } catch (e) {
      console.warn('[Entitlement] restore failed', e);
    }
  }
}

export { JSEntitlementManager, ENTITLEMENTS, APP_LIMITS };
```

### Task 6 — Wire `background-safari.js`

Since `background-safari.js` is a single-file classic script (no ES modules), inline the `JSEntitlementManager` class and constants directly.

**6a. Add constants** (after existing `MESSAGE_TYPES` at line 64):
```js
const APP_LIMITS = { FREE_SITE_LIMIT: 3 };
const ENTITLEMENTS = { UNLIMITED_SITES: 'unlimitedSites', /* ...future */ };
const ENTITLEMENT_MESSAGE_TYPES = {
  GET_ENTITLEMENTS: 'getEntitlements',
  REQUEST_PURCHASE: 'requestPurchase',
  RESTORE_PURCHASES: 'restorePurchases',
};
```
Extend `MESSAGE_TYPES` with the three entitlement types.

**6b. Inline `JSEntitlementManager` class** (before `setupMessageHandler()`):
- Same class as `shared/entitlements.js` but with `enforceLimit = true` and `nativeBundleId = 'com.lingyi01.imagelazyloadblocker'` hardcoded in instantiation.

**6c. Instantiate + init** before `setupMessageHandler()` (line ~357):
```js
const jsEntitlementManager = new JSEntitlementManager({
  enforceLimit: true,
  nativeBundleId: 'com.lingyi01.imagelazyloadblocker',
});
await jsEntitlementManager.init();
```
Note: the init wrapper at lines 357-361 must become `async` if not already.

**6d. Limit check in `SET_SITE_CONFIG` case** (lines 221-224):
Before writing config, count existing sites. If `!jsEntitlementManager.canAddSite(count)` AND the domain is new (not an update of existing), respond `{success: false, error: 'LIMIT_REACHED'}`. Updates to existing domains always allowed.

**6e. New message handlers** in `setupMessageHandler()`:
- `GET_ENTITLEMENTS`: respond `{entitlements: Array.from(jsEntitlementManager.entitlements)}`
- `REQUEST_PURCHASE`: `await jsEntitlementManager.requestPurchase(ENTITLEMENTS.UNLIMITED_SITES)`, respond with updated entitlements
- `RESTORE_PURCHASES`: `await jsEntitlementManager.restorePurchases()`, respond with updated entitlements

### Task 7 — Wire Chrome/Firefox `background/`

**7a. `background/messageHandler.js`** — extend `MESSAGE_TYPES` (line 15-25) with the three entitlement types. Add no limit check to `SET_SITE_CONFIG` (Chrome/Firefox unlimited). Add three new cases that delegate to a passed-in `jsEntitlementManager`:
- `GET_ENTITLEMENTS` → `{entitlements: Array.from(mgr.entitlements)}`
- `REQUEST_PURCHASE` → `{entitlements: [...], success: true}` (no-op)
- `RESTORE_PURCHASES` → `{entitlements: [...]}` (no-op)

`setupMessageHandler` signature unchanged; it receives `jsEntitlementManager` via closure in `background/index.js`.

**7b. `background/index.js`** — import + instantiate:
```js
import { JSEntitlementManager } from '../shared/entitlements.js';
const jsEntitlementManager = new JSEntitlementManager({ enforceLimit: false });
await jsEntitlementManager.init();
```
Pass `jsEntitlementManager` into `setupMessageHandler` (adjust signature).

### Task 8 — Create `shared/upgrade-dialog.js`

Reusable module exporting `showUpgradeDialog({ onUpgrade, onCancel, t })`. Returns a Promise<boolean> (true = user clicked Upgrade). Pure DOM, no browser APIs. Styles inlined for popup/settings portability. Will be inlined into popup.js and settings/app.js (same pattern as MESSAGE_TYPES duplication) since they're classic scripts.

Dialog content:
- Title: `t('upgradeTitle')` → "Unlock Pro"
- Body: `t('upgradeBody')` → "Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features."
- Buttons: `t('cancelUpgrade')` → "Cancel", `t('upgradeButton')` → "Upgrade"

### Task 9 — Wire `popup.js` + `popup.html`

**9a. Extend `MESSAGE_TYPES`** (line 18-23) with three entitlement types.

**9b. `loadSiteList` (line 1292-1302)** — after getting count, send `GET_ENTITLEMENTS` message to background. If response includes `unlimitedSites`, show `∞`; else show `${count}/3`. Update `siteCount.textContent`.

**9c. `toggleCurrentSite` (line 1262-1287)** — after sending `SET_SITE_CONFIG`, check response. If `{success: false, error: 'LIMIT_REACHED'}`, call `showUpgradeDialog()`. If user clicks Upgrade, send `REQUEST_PURCHASE`, on success retry `SET_SITE_CONFIG`.

**9d. Inline `showUpgradeDialog`** into popup.js (from Task 8 module).

**9e. `popup.html`** — add hidden dialog container `<div id="upgradeDialog" class="upgrade-dialog" hidden>...</div>` before `</body>`.

### Task 10 — Wire `settings/app.js` + `settings/index.html`

**10a. Extend `MESSAGE_TYPES`** (line 18-27) with three entitlement types.

**10b. `renderSiteList` (line 1784-1787)** — show `${count}/3` or `∞` badge (same as popup).

**10c. `importConfig` (line 2012-2041)** — for each domain being added, check `canAddSite` via background message. If limit reached mid-import, stop and show toast `t('importPartial', { added, total })`. Never delete existing data.

**10d. Inline `showUpgradeDialog`** + add upgrade trigger on "Add" button if limit reached.

**10e. `settings/index.html`** — add hidden dialog container before `</body>`.

### Task 11 — i18n

**11a. Add keys to inline `TRANSLATIONS` in `popup.js`** (all ~36 languages, English fallback first):
- `upgradeTitle`: "Unlock Pro"
- `upgradeBody`: "Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features."
- `upgradeButton`: "Upgrade"
- `cancelUpgrade`: "Cancel"
- `siteLimitReached`: "Site limit reached"
- `importPartial`: "Imported {added} of {total} sites. Free limit is 3."

**11b. Add same keys to inline `TRANSLATIONS` in `settings/app.js`.**

**11c. Add to `_locales/en/messages.json`** for completeness (used by i18n.js for manifest surfaces):
```json
"upgradeTitle": { "message": "Unlock Pro" },
"upgradeBody": { "message": "Free version supports up to 3 websites. Upgrade to unlock unlimited websites and future premium features." },
"upgradeButton": { "message": "Upgrade" },
"cancelUpgrade": { "message": "Cancel" },
"siteLimitReached": { "message": "Site limit reached" },
"importPartial": { "message": "Imported $added$ of $total$ sites. Free limit is 3.", "placeholders": { "added": {"content":"$1"}, "total": {"content":"$2"} } }
```

**11d. Harden `t()` fallback** in popup.js + settings/app.js: if key missing for current lang, fall back to `'en'`, then to the key itself.

### Task 12 — Build & verify

**12a. Build:** `node build.js safari` — confirm version bumps, resources sync to `safari-xcode/.../Resources/`.

**12b. Xcode manual steps (document in final summary to user):**
1. Open `safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj`
2. Select signing Team (HCB7JKMQ2F) for both targets
3. **Cmd+Shift+K** (Clean Build Folder) — clears DerivedData cache
4. **Cmd+R** to run — launches Safari with extension loaded
5. Safari → Settings → Extensions → enable ImageLazyLoadBlocker

**12c. Test matrix:**
- Add 3 sites → all succeed (badge shows `3/3`)
- Add 4th site → Upgrade Dialog appears
- Click Cancel → site not added, badge stays `3/3`
- Click Upgrade → Mock purchase (0.4s) → badge shows `∞` → 4th site added
- Restart Safari → entitlements persist (UserDefaults.standard in extension process)
- Settings page: same badge behavior; import a 5-site config → only 3 added, partial toast shown
- Host App: Restore button works (in-process; cross-process sync deferred to v2)

## Assumptions & Decisions

1. **Safari-only limit.** Chrome/Firefox remain unlimited (no `LIMIT_REACHED` ever returned). Confirmed in prior session.
2. **v1 .entitlements files omit App Group.** Free Personal Team cannot provision App Groups. `EntitlementStore` falls back to `UserDefaults.standard`. v1 Mock purchase runs entirely in the extension handler process (popup → background-safari.js → sendNativeMessage → SafariWebExtensionHandler → MockPurchaseProvider → EntitlementManager → EntitlementStore). Cross-process Host App Restore ↔ Extension sync deferred to v2 StoreKit.
3. **Host App Restore button works in-process for v1.** It calls `appDelegate.purchaseProvider.restore()` which updates Host App's own `UserDefaults.standard`. This is acceptable for v1 since the primary purchase path is the popup Upgrade Dialog (which runs in the extension process). v2 will wire App Group for true sync.
4. **Xcode project frozen at `safari-xcode/`.** Already done in Task 1. `build.js` only syncs Resources, never regenerates the project.
5. **Inline `TRANSLATIONS` in popup.js/settings.app.js bypass `_locales/`.** Upgrade keys must go into both inline dicts (the actual i18n source for those surfaces) AND `_locales/en/messages.json` (for manifest/other surfaces).
6. **`MESSAGE_TYPES` duplication across 4 files is the existing pattern.** We extend it rather than refactor — out of scope for this task.
7. **`shared/entitlements.js` is inlined into `background-safari.js`** (manual duplication) because background-safari.js is a classic script, not an ES module. Same pattern as existing constants. Future refactor: build-time inlining via build.js.
8. **Native messaging bundle ID = `com.lingyi01.imagelazyloadblocker`** (the containing App bundle ID, not the Extension's). This is how Safari routes `sendNativeMessage` to `SafariWebExtensionHandler.swift`. To verify during implementation.
9. **`ENTITLEMENT_MESSAGE_TYPES` values match Swift action strings** (`getEntitlements`/`purchase`/`restore`) exactly — case-sensitive.

## Verification Steps

- [ ] `node build.js safari` succeeds, version bumps, resources sync
- [ ] Xcode Clean Build (Cmd+Shift+K) succeeds — confirms 8 Shared Swift files compile + .entitlements files sign
- [ ] Safari extension loads without "interference" warning
- [ ] Add 3 sites → badge shows `3/3`
- [ ] Add 4th site → Upgrade Dialog → Cancel → no add
- [ ] Add 4th site → Upgrade Dialog → Upgrade → Mock success → badge `∞` → site added
- [ ] Restart Safari → Pro status persists
- [ ] Settings page badge matches popup badge
- [ ] Settings import 5 sites when Free → only 3 added, partial toast
- [ ] Chrome build (`node build.js chrome`) still works, no limit enforced
- [ ] `grep -r "isPro" shared/ popup.js settings/ background-safari.js background/` returns 0 hits (only `setPro` in Host App Script.js, which is the legacy Host App UI label, not a business-layer check)

## Future Compatibility (no business-layer changes needed for)

- Cloud Sync / Import-Export / AI Rules / Smart Network Policy / Custom Selector / Advanced Matching → add new `Entitlement` cases + new `ENTITLEMENTS` constants + check `has(.newThing)`. No changes to `EntitlementManager.has()` callers.
- Multiple License Types / Family Sharing / Intro Offer → handled inside `StoreKitPurchaseProvider` (v2). `EntitlementManager` API unchanged.
- Restore Purchase → already in protocol; UI already has Restore button in Host App.
- Real StoreKit → implement `StoreKitPurchaseProvider.purchase()/restore()`, swap `MockPurchaseProvider` for `StoreKitPurchaseProvider` in `SafariWebExtensionHandler` + `AppDelegate`. Add App Group entry to .entitlements files. No business-layer changes.
