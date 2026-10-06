---
name: browser-extension-builder
description: Build, debug, and ship browser extensions for Chrome/Edge (MV3), Firefox (MV2/MV3), and Safari Web Extensions. Covers manifest design and permissions, service worker lifecycle, content script isolation and injection, messaging between popup/background/content, storage limits, i18n via _locales, cross-browser build targets, native messaging bridges, in-app purchase and entitlements, and store review/publishing. Use when: browser extension, chrome extension, firefox addon, safari web extension, manifest v3, content script, service worker, native messaging, chrome web store review, extension permissions, extension monetization.
source: vibeship-spawner-skills (Apache 2.0), extended for MV3, Safari, and modern store policy
---

# Browser Extension Builder

**Role**: Browser Extension Architect

You extend the browser to give users superpowers. You understand the unique
constraints of extension development — permissions, isolation, lifecycle, and
store policy. You build extensions people install and keep using, not toys.

## Capabilities

- Extension architecture and manifest design
- Manifest V3 service worker lifecycle
- Content scripts and isolated worlds
- Messaging (popup <-> background <-> content)
- Storage, sync, and state that survives worker termination
- Cross-browser support (Chrome / Firefox / Safari)
- Native messaging bridges (Safari Web Extensions, desktop apps)
- In-app purchase, entitlements, and free limits
- i18n across many locales
- Chrome Web Store / AMO / App Store review

## Core model

```
 popup.html/js --+
                 +-- runtime.sendMessage --> background (service worker)
 content script -+                               |
   (per page)                                    +-- storage.local / sync
                                                 +-- sendNativeMessage --> host app
```

Four execution contexts, four rules:

| Context | Runs | Can do | Cannot do |
|---|---|---|---|
| Popup / options page | On demand, dies when closed | DOM UI, messaging | Long jobs, survive close |
| Background (MV3 SW) | Event-driven, terminates ~30s idle | APIs, storage, coordination | Keep state in globals |
| Content script | Per matched page, isolated world | DOM, messaging | Touch page JS vars |
| Native host | Separate process | OS APIs, StoreKit | Assume it is always running |

## Manifest V3

Start from the smallest manifest that works, then add permissions one at a time.

```json
{
  "manifest_version": 3,
  "name": "My Extension",
  "version": "1.0.0",
  "permissions": ["storage"],
  "optional_permissions": ["tabs"],
  "host_permissions": ["https://example.com/*"],
  "action": { "default_popup": "popup.html" },
  "background": { "service_worker": "background.js", "type": "module" },
  "content_scripts": [
    { "matches": ["https://example.com/*"], "js": ["content.js"], "run_at": "document_start" }
  ]
}
```

Notes that matter:

- `<all_urls>` and broad `host_permissions` are the single biggest review and
  conversion risk. Prefer concrete hosts + `optional_host_permissions`.
- MV3 background is a module worker: `import` works with `"type": "module"`,
  but classic scripts (Firefox MV2) and Safari appex builds may need a
  single-file bundle instead. Keep the entry thin and importable.
- `content_scripts` `run_at: document_start` is required if you must beat the
  page's own scripts (for example, installing an early API shim).

## Service worker lifecycle (the #1 source of bugs)

MV3 workers terminate when idle. Global state is not state.

```javascript
// BAD — lost when the worker is terminated
let cachedConfig = {};

// GOOD — read from storage, keep memory as a short-lived cache only
async function getConfig() {
  const { config } = await chrome.storage.local.get('config');
  return config ?? DEFAULT_CONFIG;
}
```

- Use `chrome.alarms` for periodic work, never `setInterval`.
- A long-lived `port` keeps the worker alive while a UI is open; treat it as an
  optimization, not a correctness mechanism.
- Register every listener at top level, synchronously — an `addListener` behind
  an `await` may never run after a cold start.
- Cache-first UI: render from the local snapshot immediately, then refresh from
  the slow source asynchronously and re-render only if it changed. Never block
  first paint on a native call.

## Content scripts and isolated worlds

```javascript
// content.js — isolated world: DOM is shared, page JS is not
const el = document.querySelector('.target');
el?.classList.add('patched');

// Need page variables? Inject into the MAIN world and talk back over postMessage
function inject(fn) {
  const s = document.createElement('script');
  s.textContent = `(${fn.toString()})()`;
  document.documentElement.appendChild(s);
  s.remove();
}
inject(() => window.postMessage({ type: 'FROM_PAGE', value: window.pageVar }, '*'));
window.addEventListener('message', (e) => { /* e.data.type === 'FROM_PAGE' */ });
```

- MV3 also allows `"world": "MAIN"` in `content_scripts` — simpler than script
  injection, but it exposes you to page CSP and page tampering.
- Patch page APIs defensively: keep the original, guard with try/catch, and be
  ready for the site to redefine it. Prefer observers and feature detection
  over monkey-patching when you can.

## Messaging

```javascript
// Async responder: return true to keep the channel open
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    const data = await handle(msg);
    sendResponse(data);
  })();
  return true;
});
```

- `browser.*` returns promises; `chrome.*` does too in modern Chrome, but
  bridge-style APIs and Firefox MV2 differ. Normalize with one small wrapper
  instead of sprinkling `browser ?? chrome` checks.
- Always wrap native/bridge calls in a timeout. A hung native host presents as a
  frozen popup, which users read as a crash.
- Keep fast paths free of native round-trips; pay that cost only on the rare
  branch that needs it, so one slow handler cannot block unrelated messages.

## Storage

| Area | Limit | Notes |
|---|---|---|
| `storage.local` | ~5 MB (unlimited with permission) | Default for app data |
| `storage.sync` | ~100 KB total, 8 KB/item | Quota failures are common |
| IndexedDB | Large | Avoid from MV3 workers |

- Store a schema version and migrate on read.
- Treat `storage.set` failures (quota) as real errors and surface them.
- Entitlement and flag snapshots belong in `storage.local` as a cache, with the
  authoritative source being the server or a native host.

## Cross-browser builds

| | Chrome / Edge | Firefox | Safari |
|---|---|---|---|
| Manifest | MV3 | MV2 (MV3 partial) | MV3 |
| Namespace | `chrome.*` | `browser.*` (promises) | both |
| Background | service worker | scripts / SW | SW or single classic file |
| Install | Web Store | AMO | App Store (Xcode app) |

- Keep one source, generate per-browser manifests, and assert at build time that
  every referenced file actually exists in the bundle — a missing module in a
  service worker fails silently at runtime, not at build time.
- Feature-detect APIs instead of branching on user agent where possible.

## Safari Web Extensions

- Distribution is a real macOS app: the extension ships inside an `.appex`
  inside the host app, built from a frozen Xcode project.
- Host app and extension are **separate processes**: share state via App Group
  (`UserDefaults(suiteName:)`) or the extension's own storage — plain
  `UserDefaults.standard` does not cross the boundary.
- `sendNativeMessage` reaches `SFSafariExtensionHandler.beginRequest(with:)`.
  The class must implement `NSExtensionRequestHandling` — conforming only to
  `SFSafariExtensionHandling` compiles but is never called, and the JS promise
  simply never settles (it looks like a hang, not an error).
- Purchase sheets (StoreKit) can only run in the host app. The extension opens
  the app and reads the result later from shared storage; design the UX around
  that async gap — refresh on next open, never assume the result is ready.
- A WKWebView host UI cannot rely on `navigator.language` for localization when
  the app declares only `en`/`Base`: inject `Locale.preferredLanguages` from
  Swift at document start.
- Safari requires the extension to be enabled and granted site access in Safari
  Settings before anything runs; "not working" is often "not enabled".

## Localization

- `_locales/<lang>/messages.json` with `__MSG_key__` in the manifest. Browser
  i18n has no fallback chain, so ship every key in every locale or handle the
  raw key gracefully.
- For extension-owned UI, an inline translation table plus a resolver
  (region -> script -> language -> English fallback) is often better than
  browser i18n: it is testable in Node and resolves `zh-Hant-TW` correctly.
- Right-to-left languages need `dir="rtl"` set from the resolved language.

## Entitlements and monetization

| Model | Fit |
|---|---|
| One-time purchase | Safari/App Store non-consumable, small tools |
| Subscription | Server-backed SaaS extensions |
| Donations | Hobby projects |

- Chrome Web Store payments were discontinued — use your own backend and link
  out, or go through the platform store where available.
- The extension process usually cannot show a payment sheet. Gate features in
  the extension, complete the purchase where it is possible (web page, host
  app), then sync the entitlement back into extension storage.
- Make the source of truth explicit: a transaction/entitlement record, not a
  boolean set once. Recompute on launch so refunds and restores work.
- Enforce free limits where data is written (background), not only in the UI — a
  stale UI cache otherwise produces false "limit reached" states right after a
  purchase.

## Sharp edges

### Service worker terminates unexpectedly
**Symptom**: background logic stops, state resets, timers never fire.
**Why**: MV3 workers are short-lived by design.
**Fix**: storage for state, `alarms` for time, top-level listeners, expect a cold
start on every event.

### Content script cannot see page variables
**Symptom**: `window.X` is undefined inside the content script.
**Why**: isolated world — DOM shared, JS not.
**Fix**: `world: "MAIN"` or script injection plus `postMessage`; otherwise design
around the DOM only.

### Works in Chrome, breaks in Firefox
**Symptom**: `browser is not defined`, different promise/callback behavior.
**Why**: different namespaces, manifest versions, and MV3 support levels.
**Fix**: a namespace wrapper, per-browser manifests, and a build step that
verifies every referenced asset.

### Store rejection
**Symptom**: "policy violation" with little detail.
**Why**: over-broad permissions, misleading description, single-purpose
violations, missing privacy policy.
**Fix**: minimal permissions, a description that matches behavior exactly,
explain each permission, a real privacy policy URL, and a fast reply to review
mail.

### Native bridge silently hangs
**Symptom**: popup spins forever, no error anywhere.
**Why**: the native handler is not wired to the extension point, or JS has no
timeout.
**Fix**: implement the correct protocol class natively, always race the call
against a timeout in JS, and log both ends.

## Anti-patterns

- **Requesting everything up front** — kills install conversion and invites
  review rejection. Request the minimum, add optional permissions at time of use.
- **Heavy background work** — worker termination and battery cost. Offload to
  content scripts, use alarms, cache aggressively.
- **Depending on page internals** — selectors and APIs change. Use stable
  anchors, feature detection, try/catch, and ship fixes fast.
- **Trusting the UI cache for entitlements** — re-verify against the source of
  truth before rejecting a user action, and let the background have the last word.
- **Failing silently** — a swallowed error in a worker is invisible. Keep a ring
  buffer of recent errors in storage and expose a diagnostics path.

## Verification checklist

- [ ] Fresh profile install: does it work with zero pre-existing state?
- [ ] Reload the extension mid-session: is any listener lost?
- [ ] Popup opened cold: does first paint avoid slow native calls?
- [ ] Every `import`/`src` path exists in the packaged bundle (inspect the zip).
- [ ] Permissions requested = permissions used; optional where possible.
- [ ] i18n: switch language, no raw `__MSG_` or key names visible.
- [ ] Quota and error paths surface a message instead of a silent no-op.
- [ ] Store metadata, screenshots, and privacy policy are current.

## Related skills

Works well with: `frontend-design`, `micro-saas-launcher`, `personal-tool-builder`
