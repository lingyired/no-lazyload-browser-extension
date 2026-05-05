No lazyload - 禁用图片懒加载

一次性加载所有图片，告别等待！

还在为网页图片懒加载而烦恼吗？每次需要查看完整内容都要不停滚动页面？No lazyload 扩展帮你彻底解决这个烦恼！

🛡️ 双重拦截策略

技术拦截模式：通过劫持 IntersectionObserver、拦截 HTMLImageElement.loading 属性，从根本上禁用懒加载机制。支持拦截 lazysizes、lozad.js、vanilla-lazyload 等主流懒加载库。

自动滚动兜底：当技术拦截不生效时，自动平滑滚动到页面底部触发图片加载，并可选择完成后返回顶部。

📷 全面的懒加载支持

支持检测并加载以下属性的图片：
• data-src、data-original、data-lazy-src
• data-srcset、data-lazy-srcset
• data-bg、data-background（背景图片）
• 以及 15 种以上常见懒加载属性

同时支持检测占位符图片（thumb、placeholder、loading 等），自动替换为真实图片。

🔧 灵活的配置管理

网站管理：按需添加需要拦截的网站，每个网站可独立配置是否使用自动滚动

全局设置：设置默认拦截策略、自动滚动参数（速度、停留时间）

高级自定义：支持自定义懒加载属性和占位符检测关键词，适配各种特殊场景

配置导入导出：一键备份和恢复配置

🌍 多语言支持

支持多种语言界面：中文、English、Español、العربية、हिन्दी、Français、Português、Deutsch、日本語、Русский

安装后即可使用，默认不启用任何网站，需要手动添加目标网站，安全可靠。
