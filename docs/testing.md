# 测试指南

> 面向本仓库的两种测试：**自动化测试**（毫秒级、每次改完都跑）和
> **手工测试**（涉及真机 Safari / 宿主 App / 视觉，无法自动化）。

---

## 0. 一分钟上手

```bash
npm test                 # 自动化测试，5 个测试文件
npm run build:safari     # 生成扩展源 + 同步进 Xcode 工程
open safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj
# 在 Xcode 里 Cmd+R 运行 → Safari 设置 → 扩展 → 启用 No Lazyload
```

---

## 1. 自动化测试

```bash
npm test          # 等价于 node tests/run.js
```

零依赖，不需要安装任何东西。五个文件各自守一块：

| 文件 | 守什么 |
|---|---|
| `tests/domain.test.mjs` | 域名规范化：`www.`/`WWW`/结尾点/端口/合并遗留键/幂等迁移 |
| `tests/messageHandler.test.mjs` | 免费额度拦截、购买待办写入与补做、notice 生命周期、Chrome 不产生待办 |
| `tests/bundle.test.mjs` | 构建产物是合法经典脚本、无残留 `import/export`、关键实现只出现一次、页面脚本与 `shared-ui.js` 无重复顶层声明、manifest 指向的文件存在 |
| `tests/locales.test.mjs` | 38 个语言包 key 齐全、占位符 `{domain}` 等原样保留、未翻译条目有上限 |
| `tests/contrast.test.mjs` | 解析 `ui/tokens.css` 按 WCAG 2.1 算两套主题的对比度，并断言 `:focus-visible` 有可见 outline |

**改完任何东西都先跑它。** 这五个文件在本轮开发里抓出过 4 个真实缺陷
（重复声明导致设置页报错、`$domain$` 占位符没被替换、两处对比度不达标）。

---

## 2. 构建与加载

### Chrome / Firefox

```bash
npm run build:chrome     # 产出 dist/chrome-<版本>.zip
npm run build:firefox    # 产出 dist/firefox-<版本>.zip
unzip -o dist/chrome-1.12.30.zip -d /tmp/nl-chrome
unzip -o dist/firefox-1.12.30.zip -d /tmp/nl-firefox
```

- **Chrome**：`chrome://extensions` → 打开「开发者模式」→「加载已解压的扩展程序」→ 选 `/tmp/nl-chrome`
- **Firefox**：`about:debugging#/runtime/this-firefox` →「临时载入附加组件」→ 选 `/tmp/nl-firefox/manifest.json`

> 构建脚本只保留 zip，所以必须解压后再加载，不能直接指 `dist/chrome-*`。

### Safari

```bash
npm run build:safari
open safari-xcode/ImageLazyLoadBlocker/ImageLazyLoadBlocker.xcodeproj
```

Xcode 里：

1. 选 `ImageLazyLoadBlocker` scheme
2. **两个 target 都要设置 Signing → Team**
3. Cmd+R 运行（会启动 Host App）
4. Safari → 设置 → 扩展 → 勾选 **No Lazyload**
5. 若列表里没出现，回到 Host App 点「Open Safari Settings」

> `build:safari` 只生成资源并同步进冻结工程，**不会改版本号**。
> 发版是显式动作：`npm run release:patch`；只递增 build 号用 `npm run build-number`。

---

## 3. 宿主 App 行为检查

宿主 App 是扩展的打包容器 + 首次使用引导。五个区块：
**扩展状态 → 使用方法 → 两种模式 → 遇到问题 → 页脚**。

**它不包含任何内购 / 授权 / 套餐界面**（2026-10 起与 Chrome/Firefox 版本对齐为完全免费）。
它和扩展之间**没有运行期数据通道**，所以除「扩展是否已启用」外的一切内容都是静态文案 ——
不要期望它显示站点配置。

| 场景 | 做法 | 期望 |
|---|---|---|
| 扩展已启用 | Safari 设置里勾选扩展后重开 App | 状态徽标 = 已启用（绿），不再显示主按钮，**不显示启用步骤** |
| 扩展未启用 | Safari 设置里取消勾选后回到 App | 徽标 = 未启用（橙）+ 主按钮，且**显示「启用步骤」三行** |
| 扩展状态读不到 | 在非签名构建下运行 | 徽标 = 状态不可用 + 明确说明，**不冒充"未启用"，也不显示启用步骤** |
| 点「打开 Safari 设置」 | 点击按钮 | Safari 打开并跳到扩展设置页，随后 App 退出 |
| 术语一致性 | 读「两种模式」区块 | 只出现「标准模式 / 兼容模式」，不得出现「技术拦截 / 自动滚动」 |
| 窗口最小尺寸 | 缩到 420×560 | 不破版、无横向滚动 |
| 三语 | 系统语言切 en / zh-Hans / zh-Hant | 无文案溢出、无未翻译回落 |

> 「未启用」和「状态不可用」两种状态没法在签名构建下稳定复现：
> 前者需要真的去 Safari 取消勾选，后者需要未签名构建。
> 临时验证可以在 `ExtensionStateService.isExtensionEnabled()` 里加环境变量开关，
> 但**验证完必须移除**（本次开发就是这么做的）。

### 日志

```bash
log stream --predicate 'process == "ImageLazyLoadBlocker"' --level debug
```

Debug 构建会打出版本号与扩展状态读取结果；
**Release 构建不会向用户展示任何 Xcode / 签名细节**。

---

## 4. 视觉自查（不需要真机 Safari）

仓库里有三套 headless 预览壳，用 Chrome 的命令行就能渲染真实页面：

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm run build:safari     # 预览壳读的是 dist/safari 下的构建产物

# popup：默认 + 深色
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=380,520 --blink-settings=preferredColorScheme=2 \
  --screenshot=/tmp/popup.png \
  "file://$PWD/tests/visual/popup-preview.html?state=default"

# 设置页：5 个已启用网站 + 浅色
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=760,1180 --blink-settings=preferredColorScheme=1 \
  --screenshot=/tmp/settings.png \
  "file://$PWD/tests/visual/settings-preview.html?state=many"
```

参数：

- `state`：`default`（默认，2 个站点） / `empty` / `many`（5 个站点，超过旧免费版上限）
- `measure=1`：页面顶部打印关键元素的实际尺寸与计算样式，用于排查布局
- `preferredColorScheme=1` 浅色 / `2` 深色

> 预览壳会真的加载 `popup.html` / `settings/index.html`、`dist/safari` 下的
> `locales.js`、`shared-ui.js`，并用 `chrome.*` 替身喂数据 —— 渲染的是真实页面，不是手写样例。

### 4.1 无内购回归（三个平台）

内购移除后，下面这些**必须全部为空**：

```bash
# 源码里不得再有内购相关标识
grep -rn "entitlement\|Entitlement\|requestPurchase\|openHostApp\|unlimitedSites" \
  popup.js settings/app.js background shared content || echo "✅ 源码干净"

# 构建产物里同样不得有
grep -c "Entitlement\|upgradeDialog\|LIMIT_REACHED" dist/safari/background-safari.js \
  dist/safari/shared-ui.js
```

> `tests/bundle.test.mjs` 已经把这组断言固化成自动化测试，不需要每次手跑上面的命令。

---

## 5. 功能测试清单

### 5.1 无限制（三个平台一致）

- [ ] 全新安装 → 计数显示 `0`，**没有任何升级入口 / 价格 / PRO 徽章**
- [ ] 连续添加 5 个以上网站 → 全部成功，**不出现任何上限提示**
- [ ] 计数 badge 只显示数字（不显示 `0/3` 或 `∞`）
- [ ] 设置页**没有「授权」卡片**
- [ ] 设置页「高级设置」**直接可用**：改检测规则 → 保存 → 提示已保存
- [ ] 「重置为默认」能恢复默认列表
- [ ] popup / 设置页都不出现「升级」「购买」「恢复购买」字样
- [ ] 宿主 App 只有扩展状态与用法，**没有套餐区、没有价格、没有恢复购买**

### 5.3 域名规范化（plan §15 Domain）

四个都要落到同一个键，添加后刷新仍然生效：

- [ ] `example.com`
- [ ] `www.example.com`
- [ ] `EXAMPLE.COM`
- [ ] `example.com.`

验证方法：添加后看 `siteConfigs` 里只有一个键；在 popup 打开该站应显示 ON。

### 5.4 导入 / 导出

- [ ] 空配置导入 5 个站 → **5 个全部导入**（不再有截断）
- [ ] 已有 2 个站再导入 5 个 → 共 7 个
- [ ] 导出 → 清空 → 导入：`domain` / `strategy` / `scrollFallback` / 全局配置 **无损**
- [ ] 导入的域名里带 `www.` 时，规范化后不会产生重复条目

### 5.5 拦截引擎（回归，不应该被本次改动影响）

用仓库自带的 `test-pages/` 页面：

```bash
npm run dev:test          # python -m http.server 8080
open http://localhost:8080/test-pages/index.html
```

- [ ] `test1-native-lazy`（原生 `loading="lazy"`）
- [ ] `test2-data-src`（`data-src` / `data-original` 等）
- [ ] `test3-lazysizes`（lazysizes）
- [ ] `test4-background`（CSS 背景图）
- [ ] 兼容模式（自动滚动）单独验证一遍
- [ ] 未启用的网站**不做任何改动**（对照组）

### 5.6 平台一致性

三个平台的功能与界面应当完全一致，逐项对照：

- [ ] Chrome / Firefox / Safari 都**没有任何付费 UI**（无 PRO、无 ∞、无升级按钮、设置页无「授权」卡）
- [ ] 三者的网站数量上限都**不存在**
- [ ] 三者的「高级设置」都可直接编辑保存

---

## 6. 视觉 / 无障碍清单（plan §14）

每个界面（Host App / popup / 设置页）都过一遍：

- [ ] 浅色模式
- [ ] 深色模式
- [ ] 提高对比度（系统设置 → 辅助功能 → 显示器）
- [ ] 减少透明度
- [ ] 减少动态效果
- [ ] 键盘：Tab 能到所有控件；Space/Enter 能激活；开关可键盘切换；模式下拉可键盘操作
- [ ] 焦点环始终可见（不允许无替代地去掉 outline）
- [ ] VoiceOver 基本走查
- [ ] 窗口缩放：最小 420×480 不破版

自动化能覆盖的部分已经进 `tests/contrast.test.mjs`；上面这些是它覆盖不到的。

---

## 7. 语言清单

至少人工目视这几种，检查截断 / 按钮被裁 / 行布局错乱 / RTL 顺序 / 横向滚动：

- [ ] English
- [ ] zh_CN（简体）
- [ ] zh_TW（繁體，台灣）
- [ ] zh_HK（繁體，香港——用「私隱」而非「隱私」）
- [ ] German（`Standard` 与英文同形，属正常）
- [ ] Japanese
- [ ] Arabic / RTL
- [ ] 最长的两种：Hindi、Thai（看有没有溢出）

切换语言：设置页 → 语言 → 保存。文案来源只有 `_locales/<lang>/messages.json`，
构建时打进 `locales.js`，**改文案要改 _locales 再重新构建**。

---

## 8. 已知未实测（不要当成已验证）

- [ ] 真机 Safari 里扩展的启用与内容脚本注入
- [ ] macOS 26.5 之前的 Host App 外观（当前部署目标是 26.5）
- [ ] 提高对比度 / 减少透明度 / 减少动画的真机视觉
- [ ] VoiceOver

详见 [safari-compatibility.md](safari-compatibility.md) 的「已实测 / 未实测」表。
