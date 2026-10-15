# Safari / macOS 兼容性矩阵

> 本文档回答一个问题：**这套扩展支持哪些系统，各自是什么体验。**
> 任何"支持"声明都必须能在这里找到依据；没有实测过的组合不写进来。

## 1. 版本与兼容性

| 组件 | 当前值 | 说明 |
|---|---|---|
| Safari Web Extension 最低版本 | Safari 15.4（`manifest-safari.json` → `browser_specific_settings.safari.strict_min_version`） | MV3 扩展所需的 Safari 版本 |
| Host App 最低 macOS | 见下方"部署目标"一节 | 由 Xcode 工程 `MACOSX_DEPLOYMENT_TARGET` 决定 |
| Host App UI | SwiftUI（AppKit 生命周期 + `NSHostingView`） | 系统控件，自动跟随 macOS 外观 |
| 扩展 UI | WebExtension HTML/CSS/JS（popup + 设置页） | 与 Chrome/Firefox 共用同一套 `ui/` 主题 |

### 矩阵

| macOS | Safari | Host App | 扩展 | UI 表现 |
|---|---|---|---|---|
| 低于 Host App 最低版本 | 15.4+ | — | 可用（扩展本身不依赖 Host App） | 经典材质（`ui/tokens.css` 的浅色/深色语义色） |
| 最低版本 ~ macOS 25 | 15.4+ | 是 | 是 | 标准材质分组卡片 |
| macOS 26+ | Safari 26+ | 是 | 是 | 系统当前外观（Liquid Glass 由系统控件给出） |

> 扩展的 UI 始终是 WebExtension 页面，外观由 CSS 语义令牌决定；
> 只有 Host App 会随 macOS 版本呈现不同材质。

## 2. 部署目标（MACOSX_DEPLOYMENT_TARGET）

**决策：保持 `26.5` 不变，作为明确的、需要复核的技术债记录在这里。**

- 仓库当前值：`MACOSX_DEPLOYMENT_TARGET = 26.5`（App 与 Extension 两个 target）
- 这与扩展声明的 Safari 15.4+ 形成**有意的**不一致：
  - **扩展本身**可以在远低于 26.5 的系统上运行（它是 WebExtension，不受 Xcode 部署目标限制）；
  - **Host App** 只会在 26.5+ 上启动（它的作用只是承载扩展并引导用户启用）。
- 影响：macOS 26.5 之前的用户仍然可以使用扩展的**全部功能** ——
  扩展不依赖 Host App，内购移除后也不再有任何"必须打开 App 才能完成"的操作。
- 发布前仍然建议把部署目标降到产品实际支持的最低 macOS（推荐 macOS 13.0）：
  当前的 SwiftUI 视图与 `SFSafariExtensionManager` 都只用到 macOS 13 起可用的 API，
  改 pbxproj 的 4 处即可。未降低的原因：本仓库无法在低于当前系统版本的 macOS 上做真机验证，
  而不经验证就声明"支持 macOS 13"违反本文档开头的原则。

## 3. 功能在各平台的行为

**三个平台完全一致：免费、无内购、无数量限制。**
Safari 版本曾经是唯一有"免费版 / Pro"之分的平台，该区分已于 2026-10 移除。

| 能力 | Chrome | Firefox | Safari |
|---|---|---|---|
| 懒加载拦截引擎 | 是 | 是 | 是 |
| 已启用网站数量 | 不限 | 不限 | 不限 |
| 高级设置（检测规则自定义） | 可用 | 可用 | 可用 |
| 购买 / 恢复购买 UI | 无 | 无 | 无 |
| 扩展需要的权限 | storage, activeTab | storage, activeTab | storage, activeTab |

## 4. 已实测 / 未实测

| 项目 | 状态 |
|---|---|
| Xcode Debug + Release 构建 | ✅ 已实测（`xcodebuild ... CODE_SIGNING_ALLOWED=NO`） |
| Host App 在 macOS 26 上渲染（深色模式） | ✅ 已实测（截图确认） |
| popup / 设置页在浅色 + 深色下的布局 | ✅ 已实测（headless Chrome + `tests/visual/` 预览壳） |
| 扩展在真实 Safari 中启用 + 站内注入 | ⚠️ 未实测（需要签名与真机 Safari） |
| macOS 26 之前的 Host App 外观 | ⚠️ 未实测 |
| 提高对比度 / 减少透明度 / 减少动画 | ⚠️ 仅代码层面支持，未做真机视觉确认 |
| VoiceOver | ⚠️ 未实测 |

**不要在没有实测的情况下把这些 ⚠️ 改写为 ✅。**

## 5. 权限范围

`manifest-safari.json` 声明 `<all_urls>`。这是为了让内容脚本能在用户
**显式启用**的网站上生效。未启用的网站不做任何改动：内容脚本会先向
background 查询该域名是否已配置，未配置则立即退出。

缩小权限范围（按站点动态申请 + `scripting.registerContentScripts`）
是独立项目，不在本次范围内。
