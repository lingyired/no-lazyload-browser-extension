# No LazyLoad - Disable Image Lazy Loading

**Languages:** [English](README.md) · [中文](README.zh.md)

A cross-browser extension (Chrome / Firefox) that disables image lazy loading on websites. Load all images at once — no more endless scrolling to see complete content.

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-green?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install-orange?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/firefox/addon/no-lazyload/)
[![GitHub release](https://img.shields.io/github/v/release/lingyired/no-lazyload-browser-extension?style=for-the-badge&logo=github)](https://github.com/lingyired/no-lazyload-browser-extension/releases/latest)
[![License](https://img.shields.io/github/license/lingyired/no-lazyload-browser-extension?style=for-the-badge)](LICENSE)

Built with Kimi 2.5 + ClaudeCode + Superpowers

## Features

- **Tech Interception** — CSS + JavaScript overrides for common lazy-load mechanisms
  - Hijacks the `IntersectionObserver` API
  - Intercepts the native `loading="lazy"` attribute
  - Supports popular lazy-load libraries (lazysizes, lozad.js, vanilla-lazyload, …)
  - Watches dynamically inserted images via `MutationObserver`

- **Auto-Scroll Fallback** — for sites where tech blocking does not work
  - Configurable scroll speed and stay duration
  - Optional return-to-top after completion
  - Completion notification

- **Per-Site Configuration** — independent strategy for each site
  - Tech interception
  - Auto-scroll
  - Disable the extension

- **Import / Export** — back up or restore configuration data in one click

- **37 Languages** — Bulgarian, Catalan, Czech, Danish, Greek, Persian, Finnish, Hebrew, Croatian, Hungarian, Indonesian, Italian, Norwegian Bokmål, Dutch, Polish, Pashto, Romanian, Slovak, Swedish, Thai, Turkish, Ukrainian, Urdu, Vietnamese, Chinese (HK/TW), English, Chinese (Simplified), Spanish, Arabic, Hindi, French, Portuguese, German, Japanese, Russian, Korean

## Installation

### Chrome Web Store (recommended)

Click the **Chrome Web Store** badge above, or visit:
https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall

### Firefox Add-ons (recommended)

Click the **Firefox Add-ons** badge above, or visit:
https://addons.mozilla.org/firefox/addon/no-lazyload/

### Manual Install (Chrome / Edge / other Chromium browsers)
1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the project folder

### Manual Install (Firefox)
1. Open `about:debugging`
2. Click **This Firefox**
3. Click **Load Temporary Add-on…**
4. Select the `manifest.json` file

> For a permanent Firefox install, please use the [official Firefox Add-ons page](https://addons.mozilla.org/firefox/addon/no-lazyload/).

## Usage

1. Click the extension icon to open the settings page
2. Add the domains you want to handle
3. Choose a strategy (Tech Interception or Auto-Scroll)
4. Visit the site — the extension takes effect automatically

## Technical Implementation

- Manifest V3 (Chrome) / Manifest V2 (Firefox, for AMO compatibility)
- Vanilla JavaScript (ES2020+)
- WebExtension API
- CSS injection override
- `IntersectionObserver` interception
- `MutationObserver` monitoring

## Supported Lazy-Load Methods

- Native HTML `loading="lazy"`
- `data-src` / `data-original` patterns
- `data-srcset` / `data-lazy-srcset` patterns
- lazysizes
- lozad.js
- vanilla-lazyload
- Custom `IntersectionObserver` implementations

## Privacy

- All data is stored locally in your browser
- No data is sent to any server
- Only accesses sites you explicitly configure

## License

[MIT](LICENSE)

## 开发与测试

- 测试指南（自动化 + 真机 + StoreKit + 视觉清单）：[docs/testing.md](docs/testing.md)
- 下一会话执行计划（UI 补齐）：[docs/next-session-plan.md](docs/next-session-plan.md)
- Safari/macOS 兼容性矩阵：[docs/safari-compatibility.md](docs/safari-compatibility.md)
