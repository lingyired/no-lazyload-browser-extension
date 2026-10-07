# 测试指南

> 面向本仓库的两种测试：**自动化测试**（毫秒级、每次改完都跑）和
> **手工测试**（涉及真机 Safari / StoreKit / 视觉，无法自动化）。

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
2. **两个 target 都要设置 Signing → Team**（App 与 Extension，缺 App Group 会 fail closed）
3. Cmd+R 运行（会启动 Host App）
4. Safari → 设置 → 扩展 → 勾选 **No Lazyload**
5. 若列表里没出现，回到 Host App 点「Open Safari Settings」

> `build:safari` 只生成资源并同步进冻结工程，**不会改版本号**。
> 发版是显式动作：`npm run release:patch`；只递增 build 号用 `npm run build-number`。

---

## 3. StoreKit 本地测试

scheme 已经挂好 `ImageLazyLoadBlocker.storekit`（`Product.purchase` 走本地测试环境，不联网、不扣款）。

**必须用 Xcode Cmd+R 运行。** 在 Finder 里双击 `.app` 不会注入 StoreKit 配置，
商品列表会为空，UI 会显示「Purchases are temporarily unavailable.」——
这是刻意设计（绝不显示假价格），不是 bug。

### 想测的场景与做法

| 场景 | 做法 | 期望 |
|---|---|---|
| 购买成功 | 点 Upgrade to Pro → 系统面板确认 | 「Pro unlocked.」，Plan 区变成 Pro，**不再出现价格与 Buy 按钮** |
| 用户取消 | 系统面板点取消 | 静默，无错误提示 |
| 待批准（Ask to Buy） | Xcode → Debug → StoreKit → Manage Transactions 里把购买设为 Ask to Buy / 或 `.storekit` 里开 `_failTransactionsEnabled` 相关开关 | 「Purchase pending. You'll get Pro automatically after the purchase is approved.」 |
| 无购买可恢复 | 先 Reset Transactions，再点 Restore Purchases | 「No previous purchase was found.」（中性提示，不是错误） |
| 退款/撤销 | StoreKit Transaction Manager 里 Refund | 重新打开 App/扩展应回到免费态（权限按交易历史整体重算） |
| 商品加载失败 | 用 Finder 双击 app 运行 | 「Purchases are temporarily unavailable. Please try again later.」 |

### 直接看权限存储（排查 Free/Pro 不一致）

```bash
# 正式签名（App Group 生效）
plutil -p ~/Library/Group\ Containers/group.com.lingyi01.imagelazyloadblocker/Library/Preferences/group.com.lingyi01.imagelazyloadblocker.plist

# 未签名 / 缺 App Group entitlement 的本地运行（此时扩展读不到，会 fail closed）
plutil -p ~/Library/Preferences/group.com.lingyi01.imagelazyloadblocker.plist
```

写成免费态（用于验证限额）：

```bash
plutil -replace entitlements -json '[]' <上面的路径>
killall cfprefsd
```

### Host App 日志

```bash
log stream --predicate 'process == "ImageLazyLoadBlocker"' --level debug
```

Debug 构建会打出版本号、StoreKit 商品加载、权限同步结果；
**Release 构建不会向用户展示任何 Xcode/签名细节**。

---

## 4. 视觉自查（不需要真机 Safari）

仓库里有三套 headless 预览壳，用 Chrome 的命令行就能渲染真实页面：

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
npm run build:safari     # 预览壳读的是 dist/safari 下的构建产物

# popup：免费版 + 深色
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=380,520 --blink-settings=preferredColorScheme=2 \
  --screenshot=/tmp/popup.png \
  "file://$PWD/tests/visual/popup-preview.html?state=free"

# 设置页：Pro + 浅色
"$CHROME" --headless=new --allow-file-access-from-files --hide-scrollbars \
  --window-size=760,1180 --blink-settings=preferredColorScheme=1 \
  --screenshot=/tmp/settings.png \
  "file://$PWD/tests/visual/settings-preview.html?state=pro"
```

参数：

- `state`：`free`（默认，2/3 站点） / `pro` / `unrestricted`（Chrome/Firefox） / `empty` / `limit` / `unavailable`
- `dialog=1`（popup）：直接打开升级弹窗
- `measure=1`：页面顶部打印关键元素的实际尺寸与计算样式，用于排查布局
- `preferredColorScheme=1` 浅色 / `2` 深色

> 预览壳会真的加载 `popup.html` / `settings/index.html`、`dist/safari` 下的
> `locales.js`、`shared-ui.js`，并用 `chrome.*` 替身喂数据 —— 渲染的是真实页面，不是手写样例。

### 4.1 购买回来自查（popup）

`tests/visual/popup-purchase-preview.html` 复刻"Safari 里刚买完 Pro 回到 popup"这一刻：
background 手里还是购买前的旧快照（free），只有走一次原生刷新才知道已经是 pro，
而这个原生刷新要 0.5~1s。用户往往在这之前就已经在看 popup 了。

```bash
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
# slow  = 原生刷新 700ms 后才返回 pro；click=1 = 首屏 250ms 时用户点了"添加当前网站"
"$CHROME" --headless=new --allow-file-access-from-files --disable-gpu \
  --virtual-time-budget=12000 --dump-dom \
  "file://$PWD/tests/visual/popup-purchase-preview.html?mode=slow&click=1" \
  | python3 -c "import re,sys; d=sys.stdin.read(); print(re.search(r'<pre id=\"result\">(.*?)</pre>', d, re.S).group(1))"
```

预期（每一次都要满足）：

| 时刻 | license | 站点列表 | 升级弹窗 | toast |
|---|---|---|---|---|
| 首屏 | `…` | 0 | 无 | — |
| 刷新落地前 | 免费版 | 3 | **无**（不拿旧快照拦人） | — |
| 刷新落地后 | Pro · 无限网站 | 4（第 4 个已补做） | 无 | 已解锁 Pro · 已启用 xxx |

`mode=fail`（原生始终无响应）时允许弹升级框 —— 那是唯一诚实的做法，
但**不允许**出现"已购用户被拦下且弹窗一直挂着"的组合。
```bash
"$CHROME" --headless=new --allow-file-access-from-files --disable-gpu \
  --virtual-time-budget=12000 --dump-dom \
  "file://$PWD/tests/visual/popup-purchase-preview.html?mode=fail&click=1" \
  | python3 -c "import re,sys; d=sys.stdin.read(); print(re.search(r'<pre id=\"result\">(.*?)</pre>', d, re.S).group(1))"
```

---

## 5. 功能测试清单

### 5.1 授权与限额（Safari）

- [ ] 全新安装 → 免费版，计数显示 `0/3`，有「Upgrade to Pro」
- [ ] 添加第 1、2、3 个网站都成功
- [ ] 第 4 个网站 → 弹出升级弹窗，**开关不会先变 ON**
- [ ] 弹窗点「Not Now」→ 没有添加、没有报错
- [ ] 弹窗点「Upgrade to Pro」→ Host App 被唤起
- [ ] **购买过程中直接关掉 popup** → 回到 Safari 打开 popup → 第 4 个网站已被自动启用，并提示「已解锁 Pro · 已启用 xxx」
- [ ] 买完 Pro 回 popup，**趁原生刷新还没回来立刻点"添加当前网站"** → 不得弹出升级框，第 4 个网站要加进去（§4.1 的 `mode=slow&click=1` 就是这一条）
- [ ] 同一句「已解锁 Pro · 已启用 xxx」只在买完之后出现一次（ACK 掉，重开 popup 不再弹）
- [ ] Pro 状态下计数不再显示 `∞`，只显示数量；不出现任何价格与 Buy 按钮
- [ ] 重启 Safari → 仍是 Pro
- [ ] 重启 Host App → 仍是 Pro
- [ ] 恢复购买（同 Apple ID）→ 恢复 Pro
- [ ] 无可恢复购买 → 「No previous purchase was found.」
- [ ] 退款/撤销后 → 回到免费行为

### 5.2 免费限额放宽后的行为

- [ ] Pro 用户已有 >3 个网站，失去 Pro 后：**配置不被删除**
- [ ] 免费态且已有 ≥3 个 → 不能新增，但**可以删除**
- [ ] 删到 <3 后又能新增
- [ ] 「删除 → 撤销」能把网站还原（含原模式）

### 5.3 域名规范化（plan §15 Domain）

四个都要落到同一个键，添加后刷新仍然生效：

- [ ] `example.com`
- [ ] `www.example.com`
- [ ] `EXAMPLE.COM`
- [ ] `example.com.`

验证方法：添加后看 `siteConfigs` 里只有一个键；在 popup 打开该站应显示 ON。

### 5.4 导入 / 导出

- [ ] 免费版空配置导入 5 个站 → 只导入 3 个，提示说明实际发生了什么
- [ ] 已有 2 个站再导入 5 个 → 只再进 1 个
- [ ] Pro 导入 5 个 → 全部导入
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

### 5.6 平台差异

- [ ] Chrome：没有任何付费 UI（无 PRO、无 ∞、无升级按钮、设置页无「套餐」卡）
- [ ] Firefox：同上
- [ ] Safari 免费版：有升级入口
- [ ] Safari Pro：只有 PRO 徽章，无购买 CTA

---

## 6. 视觉 / 无障碍清单（plan §14）

每个界面（Host App / popup / 设置页）都过一遍：

- [ ] 浅色模式
- [ ] 深色模式
- [ ] 提高对比度（系统设置 → 辅助功能 → 显示器）
- [ ] 减少透明度
- [ ] 减少动态效果
- [ ] 键盘：Tab 能到所有控件；Space/Enter 能激活；开关可键盘切换；模式下拉可键盘操作
- [ ] Esc 能关掉升级弹窗；关闭后焦点回到触发它的控件
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
- [ ] German（`Upgrade`、`Standard` 与英文同形，属正常）
- [ ] Japanese
- [ ] Arabic / RTL
- [ ] 最长的两种：Hindi、Thai（看有没有溢出）

切换语言：设置页 → 语言 → 保存。文案来源只有 `_locales/<lang>/messages.json`，
构建时打进 `locales.js`，**改文案要改 _locales 再重新构建**。

---

## 8. 已知未实测（不要当成已验证）

- [ ] 真机 Safari 里扩展的启用与内容脚本注入
- [ ] macOS 26.5 之前的 Host App 外观（当前部署目标是 26.5）
- [ ] App Store 沙盒（非 Xcode 本地 StoreKit）购买 / 恢复 / 退款
- [ ] 提高对比度 / 减少透明度 / 减少动画的真机视觉
- [ ] VoiceOver
- [ ] 沙盒购买在**完全退出 Safari 再重开**后的持久性

详见 [safari-compatibility.md](safari-compatibility.md) 的「已实测 / 未实测」表。
