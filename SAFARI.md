# Safari Extension 构建指南

## 系统要求

- macOS 11.0+ (Big Sur 或更高版本)
- Safari 16.4+ (支持 Manifest V3)
- Xcode 14.0+

## 构建步骤

### 方法 1：使用 Safari Extension Converter（推荐）

1. 运行构建脚本：
   ```bash
   node build.js safari
   ```

2. 解压生成的 `safari-{version}.zip` 文件

3. 打开 Safari，点击菜单栏 **开发** → **显示扩展转换器**（如果没有看到"开发"菜单，先在 Safari 偏好设置中启用开发者功能）

4. 点击 **扩展转换器** 窗口中的 **+** 按钮

5. 选择解压后的扩展文件夹

6. 转换器会生成一个 Xcode 项目

7. 在 Xcode 中打开生成的项目，编译并运行

8. 在 Safari 的 **偏好设置** → **扩展** 中启用扩展

### 方法 2：手动创建 Xcode 项目

1. 运行构建脚本生成 Safari 扩展文件：
   ```bash
   node build.js safari
   ```

2. 在 Xcode 中创建新的 App 项目：
   - 选择 **File** → **New** → **Project**
   - 选择 **App** 模板
   - 命名项目（如 `NoLazyload`）

3. 添加 App Extension 目标：
   - **File** → **New** → **Target**
   - 选择 **Safari Extension** → **Extension**
   - 选择 **Manifest V3** 格式

4. 将 `dist/safari-temp` 中的文件复制到 Xcode 项目的扩展目录

5. 更新 Bundle Identifier：
   - 格式：`com.yourcompany.extension-name`
   - 示例：`com.lingyired.no-lazyload`

6. 构建并运行：
   - 选择目标设备（Mac）
   - 点击 **Run** 按钮

7. 首次运行时会自动打开 Safari 扩展设置

## 发布到 App Store

### 准备

1. 注册 Apple Developer Program（$99/年）

2. 创建 App ID：
   - 访问 [Apple Developer Portal](https://developer.apple.com)
   - **Certificates, Identifiers & Profiles** → **Identifiers**
   - 创建新的 **App IDs** 和 **App Groups**

3. 在 Xcode 中配置：
   - Team（选择你的开发者账号）
   - Bundle Identifier（与 App ID 匹配）
   - Signing & Capabilities

### 打包

1. 在 Xcode 中选择 **Product** → **Archive**

2. 在 Organizer 中选择归档，点击 **Distribute App**

3. 选择 **App Store Connect** → **Upload**

4. 等待上传完成

### 提交审核

1. 登录 [App Store Connect](https://appstoreconnect.apple.com)

2. 创建新的 App：
   - 平台：macOS
   - Bundle ID：选择你创建的 ID
   - SKU：唯一标识符

3. 填写 App 信息：
   - 名称：No lazyload
   - 副标题：禁用图片懒加载
   - 类别：工具
   - 年龄分级：4+

4. 上传截图：
   - macOS App Store：1280x800 或 1440x900

5. 提交审核

## 注意事项

### 权限限制

Safari 扩展在 macOS 上有一些特殊限制：

1. **内容脚本**：Safari 对 `<all_urls>` 权限的处理可能略有不同
2. **后台脚本**：Safari 使用原生事件页面替代 service worker
3. **存储 API**：完全兼容

### 调试

1. 在 Safari 中启用扩展开发者模式：
   - Safari 偏好设置 → **高级** → 勾选 **在菜单栏中显示"开发"菜单**

2. 使用 Safari 开发者工具调试内容脚本：
   - 右键点击页面 → **检查元素**
   - 在 **Sources** 标签页中找到你的扩展

3. 查看控制台日志：
   - Safari → **开发** → 选择你的扩展 → **显示 JavaScript 控制台**

### 已知问题

1. **图标显示**：Safari 对扩展图标有特殊要求，确保提供所有尺寸的图标
2. **弹出窗口**：Safari 的弹出窗口行为与 Chrome/Firefox 略有不同
3. **跨域请求**：Safari 有更严格的 CORS 策略

## 参考资料

- [Safari Extensions Documentation](https://developer.apple.com/documentation/safariservices/safari_web_extensions)
- [Converting a Web Extension for Safari](https://developer.apple.com/documentation/safariservices/safari_web_extensions/converting_a_web_extension_for_safari)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)

## 支持

如果在构建过程中遇到问题，请查看：
- GitHub Issues: https://github.com/lingyired/no-lazyload-browser-extension/issues
- 或提交新的 Issue
