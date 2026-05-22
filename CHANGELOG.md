# Changelog

All notable changes to this project will be documented in this file.

## [1.10.0] - 2026-05-22

### Added
- Browser language auto-detection for default language selection
- SVG icons for popup buttons (settings gear, refresh)

### Fixed
- Chrome/Firefox API compatibility issue with `chrome.runtime.lastError`
- Build script zip command path issue on macOS
- Language fallback now uses `en` instead of `zh` for unsupported languages

### Changed
- Version number updated to 1.10.0
- Build script now auto-syncs version to manifest files
