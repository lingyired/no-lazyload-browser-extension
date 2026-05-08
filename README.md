# Image Lazy Load Blocker

一个跨浏览器扩展（Chrome/Firefox），用于禁用网站上的图片懒加载功能。

Built with Kimi 2.5 + ClaudeCode + Superpowers

## 功能特点

- **技术拦截**：使用 CSS + JavaScript 拦截常见的懒加载机制
  - 覆盖 `IntersectionObserver` API
  - 拦截原生 `loading="lazy"` 属性
  - 支持主流懒加载库（lazysizes、lozad.js 等）
  - 监控动态添加的图片（MutationObserver）

- **自动滚动兜底**：对无法技术拦截的网站，通过自动滚动触发懒加载
  - 可配置滚动速度、停留时间
  - 完成后可选返回顶部
  - 完成通知提示

- **按网站配置**：每个网站可独立选择策略
  - 技术拦截
  - 自动滚动
  - 禁用扩展

- **导入/导出**：配置数据可导出备份或导入恢复

## 安装方法

### Chrome Web Store（推荐）

[![Chrome Web Store](https://img.shields.io/badge/Chrome%20Web%20Store-Install-green?style=for-the-badge&logo=google-chrome&logoColor=white)](https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall)

直接点击上方按钮或访问 [Chrome Web Store](https://chromewebstore.google.com/detail/no-lazyload-disable-image/gdaoomgmekonglmdeaoengblkjeopall) 安装。

### 手动安装（Chrome）
1. 打开 `chrome://extensions/`
2. 开启"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目文件夹

### Firefox
1. 打开 `about:debugging`
2. 点击"此 Firefox"
3. 点击"临时载入附加组件"
4. 选择 `manifest.json` 文件

## 使用方法

1. 点击扩展图标打开设置页面
2. 添加需要处理的网站域名
3. 选择策略（技术拦截或自动滚动）
4. 访问网站，扩展自动生效

## 技术实现

- Manifest V3
- Vanilla JavaScript (ES2020+)
- WebExtension API
- CSS 注入覆盖
- IntersectionObserver 拦截
- MutationObserver 监控

## 支持的懒加载方式

- 原生 HTML `loading="lazy"`
- `data-src` / `data-original` 模式
- `data-srcset` / `data-lazy-srcset` 模式
- lazysizes 库
- lozad.js 库
- vanilla-lazyload 库
- 自定义 IntersectionObserver 实现

## 隐私说明

- 所有数据存储在本地浏览器
- 不向任何服务器发送数据
- 仅访问用户明确配置的网站

## License

MIT
