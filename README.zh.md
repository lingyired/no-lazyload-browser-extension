# 图片懒加载拦截

**语言：** [English](README.md) · [中文](README.zh.md)

一个跨浏览器扩展（Chrome / Firefox），用于禁用网站上的图片懒加载功能。让所有图片一次加载完成 —— 不必再无尽地滚动来查看完整内容。

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-green?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall)
[![Firefox Add-ons](https://img.shields.io/badge/Firefox%20Add--ons-Install-orange?style=for-the-badge&logo=firefox-browser&logoColor=white)](https://addons.mozilla.org/zh-CN/firefox/addon/no-lazyload/)
[![GitHub release](https://img.shields.io/github/v/release/lingyired/no-lazyload-browser-extension?style=for-the-badge&logo=github)](https://github.com/lingyired/no-lazyload-browser-extension/releases/latest)
[![License](https://img.shields.io/github/license/lingyired/no-lazyload-browser-extension?style=for-the-badge)](LICENSE)

Built with Kimi 2.5 + ClaudeCode + Superpowers

## 功能特点

- **技术拦截**：使用 CSS + JavaScript 拦截常见的懒加载机制
  - 覆盖 `IntersectionObserver` API
  - 拦截原生 `loading="lazy"` 属性
  - 支持主流懒加载库（lazysizes、lozad.js、vanilla-lazyload 等）
  - 监控动态添加的图片（`MutationObserver`）

- **自动滚动兜底**：对无法技术拦截的网站，通过自动滚动触发懒加载
  - 可配置滚动速度、停留时间
  - 完成后可选返回顶部
  - 完成通知提示

- **按网站配置**：每个网站可独立选择策略
  - 技术拦截
  - 自动滚动
  - 禁用扩展

- **导入/导出**：配置数据可一键备份或还原

- **37 种语言**：保加利亚语、加泰罗尼亚语、捷克语、丹麦语、希腊语、波斯语、芬兰语、希伯来语、克罗地亚语、匈牙利语、印尼语、意大利语、挪威语（书面）、荷兰语、波兰语、普什图语、罗马尼亚语、斯洛伐克语、瑞典语、泰语、土耳其语、乌克兰语、乌尔都语、越南语、繁體中文（香港/台湾）、英语、简体中文、西班牙语、阿拉伯语、印地语、法语、葡萄牙语、德语、日语、俄语、韩语

## 安装方法

### Chrome Web Store（推荐）

点击上方 **Chrome Web Store** 徽章，或访问：
https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall

### Firefox 附加组件（推荐）

点击上方 **Firefox Add-ons** 徽章，或访问：
https://addons.mozilla.org/zh-CN/firefox/addon/no-lazyload/

### 手动安装（Chrome / Edge / 其他 Chromium 内核）
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目文件夹

### 手动安装（Firefox）
1. 打开 `about:debugging`
2. 点击"此 Firefox"
3. 点击"临时载入附加组件"
4. 选择 `manifest.json` 文件

> 想永久安装 Firefox 扩展，请前往 [Firefox 官方附加组件页面](https://addons.mozilla.org/zh-CN/firefox/addon/no-lazyload/)。

## 使用方法

1. 点击扩展图标打开设置页面
2. 添加需要处理的网站域名
3. 选择策略（技术拦截或自动滚动）
4. 访问网站，扩展自动生效

## 技术实现

- Manifest V3（Chrome）/ Manifest V2（Firefox，兼容 AMO）
- Vanilla JavaScript（ES2020+）
- WebExtension API
- CSS 注入覆盖
- `IntersectionObserver` 拦截
- `MutationObserver` 监控

## 支持的懒加载方式

- 原生 HTML `loading="lazy"`
- `data-src` / `data-original` 模式
- `data-srcset` / `data-lazy-srcset` 模式
- lazysizes 库
- lozad.js 库
- vanilla-lazyload 库
- 自定义 `IntersectionObserver` 实现

## 隐私说明

- 所有数据存储在本地浏览器
- 不向任何服务器发送数据
- 仅访问用户明确配置的网站

## 协议

[MIT](LICENSE)
