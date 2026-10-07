# No Lazyload Safari — 下一会话执行计划（UI 补齐）

> **本文档是给全新会话的自包含交接说明。** 新会话没有历史上下文，所有必要事实都写在这里。
> 生成时间：2026-10-07 ｜ 对应提交：\`bc6049d\`
> 前置 plan：\`/Users/lingsmbp/Downloads/no-lazyload-safari-appstore-macos26-plan.md\`

---

## 0. 一句话背景

上一轮执行了 2304 行 plan 的 Phase A–J。**功能部分（原生 App、支付链路、构建流水线）是好的；
Web 界面（popup / 设置页）被我反复重做，用户三次反馈"不如原始版本"，已全部回退。**

现在的状态：**Web 界面 = 重构前的原始版本，功能层 = 新版本。**
下一步是「基于原始 UI，只补 plan 要求的功能改动」。

---

## 1. 铁律（违反过三次，务必遵守）

1. **绝不重写 CSS，绝不"照着重做"。**
   原始设置页的全部样式**内联在 \`settings/index.html\` 的 \`<style>\` 里（约 487 行）**，
   原始 popup 的样式**内联在 \`popup.html\` 的 \`<style>\` 里**。
   \`settings/styles.css\` 是历史遗留，**原始页面并不引用它** —— 别被骗了。
   我上次就是没发现这一点，照着重写 CSS，结果弄丢了设置页最显眼的**绿色渐变头部**：
   \`\`\`css
   .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; }
   \`\`\`
   **要还原就 \`git show <commit>:<path>\` 逐字节取回，不要手写。**

2. **改之前先渲染给用户看。** 每完成一项，用 headless 预览壳出图（命令见 §4），
   确认无误再继续。不要攒一堆改动一起交付。

3. **不猜用户想要什么。** 前三次失败都是因为我"觉得应该更好看"。
   用户的决策是：**原始视觉 + 只做 plan 明确要求的功能改动**。

4. **每改一项都 grep 复核，不要凭记忆断言。** 用户明确要求过"帮我查清楚再说"。

---

## 2. 当前仓库状态

| 项 | 值 |
|---|---|
| 分支 | \`safari-support\` |
| HEAD | \`bc6049d revert(ui): restore popup and settings to the pre-refactor version\` |
| 领先 \`origin/safari-support\` | 24 个提交（**未推送、未合并 main**） |
| 安全网 | 标签 + 分支 \`backup/ui-experiments-2026-10-07\` = 我所有 UI 尝试，随时可取回 |
| 测试 | \`npm test\` 5 个文件全绿 |
| 构建 | 三端 + Xcode Debug/Release 均通过 |

### 已回退（= 回到原始）
\`popup.html\`、\`popup.js\`、\`settings/index.html\`、\`settings/app.js\`、\`settings/styles.css\`
已删除：\`ui/tokens.css\`、\`ui/components.css\`、\`ui/safari.css\`、\`lingyired/icon.png\`
已删除：\`tests/contrast.test.mjs\`（令牌层没了，无对象可测）

### 已保留（**不要动，这些是有价值的部分**）

**原生 Host App**（SwiftUI 替换掉 WKWebView + Main.html/Script.js/Style.css）

| 文件 | 行 | 职责 |
|---|---:|---|
| \`ImageLazyLoadBlocker/Host/HostRootView.swift\` | 96 | 根视图：扩展状态 → 怎么用 → 套餐 |
| \`ImageLazyLoadBlocker/Host/HostViewModel.swift\` | 160 | 全部状态与动作，视图不碰 StoreKit |
| \`ImageLazyLoadBlocker/Host/PlanView.swift\` | 133 | 套餐区 + 页脚 |
| \`ImageLazyLoadBlocker/Host/ExtensionStatusView.swift\` | 84 | 扩展三态 + 使用说明 |
| \`ImageLazyLoadBlocker/Host/HostDesignTokens.swift\` | 95 | 间距/圆角/语义色令牌 |
| \`ImageLazyLoadBlocker/HostCopy.swift\` | 166 | 用户可见文案集中处 |
| \`ImageLazyLoadBlocker/Services/ExtensionStateService.swift\` | 44 | 读扩展状态 + 打开 Safari 设置 |
| \`ImageLazyLoadBlocker/ViewController.swift\` | 58 | 只剩 NSHostingView 挂载（原 202 行） |

**支付与权限链路**（解决的都是"用户会真丢钱/丢状态"的问题）

| 机制 | 解决什么 |
|---|---|
| \`EntitlementStoreState\` + 写回探测 | App Group 不可用时**拒绝读写**，不回退 \`UserDefaults.standard\` |
| \`PurchaseOutcome\`(.purchased/.cancelled/.pending) | 取代 \`Bool\`，区分"取消"与"等待家长批准" |
| \`RestoreOutcome\`(.restored/.nothingToRestore) | "没买过"是中性的，不是错误 |
| \`pendingEntitlementAction\`（24h 过期） | **Safari 的 popup 在 Host App 置前后会被系统关掉**，原来"轮询等待"会丢第 4 个网站 → 改后台持久化补做 |
| \`licenseMode\` 三态 | Chrome/Firefox 是"免费不限"，**不是 Pro** |
| \`storageAvailable\` 透传 JS | App Group 坏了要显式提示，不假装免费 |

**其它保留**：\`shared/domain.js\`、\`shared/entitlements.js\`（唯一实现）、
\`background/pendingAction.js\`、\`background/safari.js\`、\`background/badge.js\`、
\`scripts/bundle-classic.js\`（生成 background-safari.js / background-firefox.js）、
\`tests/\`（5 文件）、\`docs/safari-compatibility.md\`、\`docs/testing.md\`、38 个语言包。

---

## 3. 待办：UI 层缺失的 9 项（已逐条 grep 核实）

分两批。**每项独立提交**，做完用 §4 的预览壳出图确认。

### 第 1 批：纯逻辑，零视觉改动（只改 JS，不碰任何 CSS）

| # | 项 | 文件与锚点 | 改动要点 | 验收 |
|---|---|---|---|---|
| 1 | **A1 licenseMode 三态** | \`popup.js:1302 updateLicenseRow / 1321 hasUnlimitedSites / 1330 formatSiteCount\`；\`settings/app.js:1840 / 1859 / 1868\` | 用 \`_entitlementState.isLimitEnforced\` 判断平台：\`false\`=Chrome/Firefox → 隐藏全部付费 UI；\`true\`+\`unlimitedSites\`=Pro；否则 Free。**不要再用 \`hasUnlimitedSites()\` 反推套餐名** | Chrome 下无 PRO/∞/升级入口/套餐卡 |
| 2 | **A3 待办 UI 接线** | \`popup.js\` 的 \`requestUpgrade()\` 附近；\`settings/app.js\` \`updateLicenseStatus()\` 附近 | background 已支持 \`pendingAction\`/\`notice\` 与 \`ACK_ENTITLEMENT_NOTICE\`，UI 需在刷新后读取 notice 并 toast「已解锁 Pro · 已启用 xxx」，然后 ACK | 购买后重开 popup 看到提示，且第 4 个网站已被启用 |
| 3 | **A7 导入保留配置** | \`settings/app.js:2272 importConfig()\` | \`SET_SITE_CONFIG\` 要带 \`scrollFallback: config.scrollFallback === true\` 与 \`addedAt\`，域名走 \`normalizeHostname\`，并带 \`source:'import'\`（避免写入购买待办） | 导出→清空→导入 无损 |
| 4 | **D4 时间用秒** | \`settings/index.html:549-554\`（标签与输入框）；\`settings/app.js:2143 loadGlobalSettings / 2159 saveGlobalSettings\` | 界面用秒、存储仍毫秒。**只改这两处标签文字**，不要动布局 | 显示 0.8 / 2.0，保存后回读一致 |
| 5 | **D6 套餐卡按平台隐藏** | \`settings/index.html:504\` 授权卡（加 \`id="licenseCard"\`）；\`settings/app.js:1840 updateLicenseStatus\` | Chrome/Firefox → \`card.hidden = true\`；Pro → 不显示 Buy CTA | Chrome 下设置页无授权卡 |

> 第 1 批全部结束后：\`npm test\` + 三端构建 + 渲染两张图（popup / 设置页）确认**视觉与原始完全一致**。

### 第 2 批：有视觉影响，**每项先出图给用户确认**

| # | 项 | 文件与锚点 | 改动要点 | 风险 |
|---|---|---|---|---|
| 6 | **C1 开关替代按钮** | \`popup.html:124-152 .toggle-btn\` 样式、\`:546\` \`#toggleBtn\`；\`popup.js:1555 toggleCurrentSite\` | 用 \`role="switch"\` 的按钮替换「添加/移除当前网站」。**新开关的 CSS 要沿用原始药丸形状 + 原始绿 \`#4CAF50\`**，不要自创风格 | 免费额度用完时**不能先切 ON 再回滚** |
| 7 | **C2 术语改名** | 所有 \`_locales/*/messages.json\` 的 \`useAutoScroll\`/\`autoScroll\`/\`autoScrollDesc\`；\`popup.html:541-542\` | 用户可见：技术拦截 → **Standard**，自动滚动 → **Compatibility Mode**。popup 里不要出现 IntersectionObserver / data-src | 38 个语言包都要补/改，注意占位符 |
| 8 | **C3 计数去掉 ∞** | \`popup.js:1331\`；\`settings/app.js:1869\` | Free 显示 \`2/3\`，Pro 只显示数字 \`7\`，Chrome 只显示数字 | 与 A1 同源，建议同批做 |
| 9 | **D5 高级折叠** | \`settings/index.html:626-646\` 高级设置卡 | 用 \`<details>\` 包住「懒加载属性 / 占位符检测」，默认收起，加一句警告文案 | 折叠控件样式要贴合原始内联 CSS |

---

## 4. 命令速查

\`\`\`bash
# 测试（零依赖，5 个文件）
npm test

# 三端构建（生成 locales.js / shared-ui.js / background-*.js 到 dist/）
node build.js all          # 不动版本号
npm run build:safari       # 只构建 Safari
npm run release:patch      # 发版才动 MARKETING_VERSION

# 渲染预览（改 UI 后必须做）
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# popup
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=380,640 --blink-settings=preferredColorScheme=1 \
  --screenshot=/tmp/popup.png "file://$PWD/tests/visual/popup-preview.html?state=free"
# 设置页（state: free|pro|unrestricted|empty|unavailable；?measure=1 打印尺寸/错误）
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=720,1560 --blink-settings=preferredColorScheme=1 \
  --screenshot=/tmp/settings.png "file://$PWD/tests/visual/settings-preview.html?state=free"

# 真机 Safari 测试：签名构建 → 安装 → 注册 → 启动
npm run build:safari
xcodebuild -project safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj \
  -scheme ImageLazyLoadBlocker -configuration Debug -destination 'platform=macOS' \
  -derivedDataPath /tmp/nl-run build
pkill -f 'ImageLazyLoadBlocker.app/Contents/MacOS'; sleep 1
rm -rf ~/Applications/ImageLazyLoadBlocker.app
cp -R /tmp/nl-run/Build/Products/Debug/ImageLazyLoadBlocker.app ~/Applications/
/System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -f -R -trusted ~/Applications/ImageLazyLoadBlocker.app
open ~/Applications/ImageLazyLoadBlocker.app
# 然后在 Safari → 设置 → 扩展 启用，点工具栏按钮测 popup

# 本地测试页
npm run dev:test           # python3 -m http.server 8080
open http://localhost:8080/test-pages/index.html
\`\`\`

### 取回原始文件（**改 UI 前先做这个**）
\`\`\`bash
git show origin/safari-support:popup.html       > /tmp/orig-popup.html
git show origin/safari-support:settings/index.html > /tmp/orig-settings.html
# 逐字节还原：
git checkout origin/safari-support -- popup.html popup.js settings/
\`\`\`

---

## 5. 已知坑（我踩过的，别重复）

| 坑 | 说明 |
|---|---|
| **设置页样式是内联的** | \`settings/styles.css\` 是遗留文件，原始 \`index.html\` **不引用它**。487 行内联样式才是真相 |
| **预览壳路径映射** | \`tests/visual/*-preview.html\` 里 \`locales.js\`/\`shared-ui.js\` 是构建产物，要指到 \`../../dist/safari/\`；\`app.js\` 要指到 \`../../settings/app.js\`（我在这儿错过两次，导致"以为页面没初始化") |
| **打包文件清单会漂移** | \`build.js\` 的 \`CHROME_FILES\` 漏过 \`badge.js\`/\`pendingAction.js\`/\`domain.js\` → **Chrome 整包加载失败**；Xcode pbxproj 漏过 \`locales.js\`/\`shared-ui.js\`/\`ui/\`/\`privacy-policy.html\` → **扩展资源 404**。\`tests/package.test.mjs\` 现在守着这两处 |
| **经典脚本重名** | \`popup.js\` 与 \`shared-ui.js\` 若同时加载且都有 \`STRATEGIES\`/\`MESSAGE_TYPES\` → SyntaxError。回退后页面**不加载** shared-ui.js，所以现在没问题 |
| **StoreKit 测试交易会持久化** | 交易存在 \`~/Library/Group Containers/group.com.apple.storekit/Documents/Persistence/Octane/\`。**Host App 一启动就会用交易历史重新授权 Pro** → 想测免费流程必须"清 App Group + 不启动 Host App" |
| **App Group 有两个位置** | 正式签名读 \`~/Library/Group Containers/group.com.lingyi01.imagelazyloadblocker/...\`；未签名的本地构建会读 \`~/Library/Preferences/group.com.lingyi01.imagelazyloadblocker.plist\`（fail-closed 之前的老行为） |

---

## 6. 未决事项（需要用户决策，别自己拍）

1. **\`MACOSX_DEPLOYMENT_TARGET = 26.5\`** —— 等于只支持 macOS 26.5+，而扩展声明 Safari 15.4+。
   老系统用户装得上但**买不了**。发布前必须二选一：降到 13.0（代码已就绪，
   \`#available(macOS 14.0, *)\` 已包好）或明确写成 macOS 26.5+。
   详见 \`docs/safari-compatibility.md\`。
2. **StoreKit 商品 ID** 仍是 \`com.lingyi01.imagelazyloadblocker.unlimitedsites\`。
   若尚未在 App Store Connect 创建，plan A8 建议改成 \`.pro.lifetime\`。
   判据与改名步骤写在 \`Shared/EntitlementsConfig.swift\` 注释里。
3. **翻译质量** —— 38 语言由并行子代理产出，只做过结构校验（key 完整性、占位符）。
   子代理自报不确定项：fa/ps/ur 用了本地数字、ps 整份为尽力翻译
   （\`loading\`/\`undo\`/\`generalSettings\`）、hu 的 \`planProDetail\` 生硬、
   de 的 \`privacyNote\` 用了 du（页面其它处 du/Sie 混用）。建议母语者过一遍。
4. **\`tests/visual/old/\`（244KB）** 是我保存的"改动前快照"，**含"Built with Kimi..."字样**，
   不参与构建。用户可决定保留（便于新旧对比）或删除。
5. **未实测项**：真机 Safari 扩展注入、macOS 26.5 之前的 Host App 外观、
   App Store 沙盒（非 Xcode 本地）购买/恢复/退款、辅助功能真机视觉、VoiceOver。
   \`docs/safari-compatibility.md\` 里有 table 标了 ⚠️，**不要改成 ✅**。

---

## 7. 建议的第一步

用户已同意"第 1 批（纯逻辑，零视觉改动）"。建议新会话开场：

> 读 \`docs/next-session-plan.md\`（就是本文档），从第 1 批第 1 项开始。
> 每完成一项：\`npm test\` → 渲染 popup 与设置页两张图 → 给用户看 → 再继续下一项。

**第 1 批做完前不要碰任何一项第 2 批的内容。**
