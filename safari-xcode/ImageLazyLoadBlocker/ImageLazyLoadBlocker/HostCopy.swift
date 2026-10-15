//
//  HostCopy.swift
//  ImageLazyLoadBlocker
//
//  Host App 的全部用户可见文案集中在这里，翻译在同目录的
//  Localizable.xcstrings（String Catalog）里维护，不再另建 JS 翻译表。
//
//  规则：
//   1. Release 里绝不出现 Xcode 配置 / 签名等实现细节。
//   2. 新增文案必须同时加进 Localizable.xcstrings，否则只有开发语言有值。
//   3. 目前只提供 en / zh-Hans / zh-Hant；其它语言自动回退到 en
//      （Catalog 里缺哪条，系统就退回 defaultValue）。
//   4. 文案里提到的按钮名（"Add Current Site" / "Remove Current Site"）
//      必须与扩展 _locales 里的实际值一致 —— 用户要在 popup 里对得上同一个按钮。
//
//  加一门语言：在 Localizable.xcstrings 每条 stringUnit 里补一个语言键
//  （BCP-47 码，如 ja / ko / zh-Hant），构建后会自动生成
//  <lang>.lproj/Localizable.strings。
//

import Foundation

enum HostCopy {
    // MARK: - 品牌

    static var appName: String {
        String(localized: "appName", defaultValue: "No Lazyload")
    }

    /// 标题下一行：说清楚这个 App 是干什么的，用户不必猜。
    static var appSubtitle: String {
        String(localized: "appSubtitle",
               defaultValue: "Loads every image on the sites you enable in Safari.")
    }

    // MARK: - Safari 扩展状态

    static var safariExtension: String {
        String(localized: "safariExtension", defaultValue: "Safari Extension")
    }

    static var extensionEnabled: String {
        String(localized: "extensionEnabled", defaultValue: "Enabled")
    }

    static var extensionDisabled: String {
        String(localized: "extensionDisabled", defaultValue: "Not Enabled")
    }

    static var enableHint: String {
        String(localized: "enableExtensionHint",
               defaultValue: "Enable the extension to use No Lazyload in Safari.")
    }

    static var readyHint: String {
        String(localized: "extensionReady",
               defaultValue: "No Lazyload is ready.")
    }

    static var openSafariSettings: String {
        String(localized: "openSafariSettings", defaultValue: "Open Safari Settings")
    }

    static var extensionStatusUnknown: String {
        String(localized: "extensionStatusUnknown",
               defaultValue: "Status unavailable")
    }

    static var extensionStatusUnknownHint: String {
        String(localized: "extensionStatusUnknownHint",
               defaultValue: "Couldn't read the Safari extension status. Open Safari Settings to check it.")
    }

    // MARK: - 启用步骤（仅在扩展未启用时显示）

    static var enableStepsTitle: String {
        String(localized: "enableStepsTitle", defaultValue: "To enable it")
    }

    static var enableStep1: String {
        String(localized: "enableStep1",
               defaultValue: "Click the button below to open Safari extension settings")
    }

    static var enableStep2: String {
        String(localized: "enableStep2",
               defaultValue: "Turn on No Lazyload in the list")
    }

    static var enableStep3: String {
        String(localized: "enableStep3",
               defaultValue: "Back in Safari, the toolbar button appears")
    }

    // MARK: - 使用说明

    static var howToUse: String {
        String(localized: "howToUse", defaultValue: "How to use")
    }

    static var stepOpenWebsite: String {
        String(localized: "stepOpenWebsite", defaultValue: "Open a website in Safari")
    }

    static var stepOpenExtension: String {
        String(localized: "stepOpenExtension",
               defaultValue: "Click the No Lazyload toolbar button")
    }

    static var stepEnableSite: String {
        String(localized: "stepEnableSite",
               defaultValue: "Click “Add Current Site” — images load at once")
    }

    // MARK: - 两种模式

    static var modesTitle: String {
        String(localized: "modesTitle", defaultValue: "Two modes")
    }

    static var modeStandardName: String {
        String(localized: "modeStandardName", defaultValue: "Standard")
    }

    static var modeStandardHelp: String {
        String(localized: "modeStandardHelp",
               defaultValue: "Blocks lazy loading directly. The default, and works on most sites")
    }

    static var modeCompatibilityName: String {
        String(localized: "modeCompatibilityName", defaultValue: "Compatibility")
    }

    static var modeCompatibilityHelp: String {
        String(localized: "modeCompatibilityHelp",
               defaultValue: "Scrolls the page to the bottom to trigger loading. Use it only when Standard mode does not work")
    }

    // MARK: - 遇到问题？

    static var troubleshootingTitle: String {
        String(localized: "troubleshootingTitle", defaultValue: "Troubleshooting")
    }

    static var troubleshoot1Title: String {
        String(localized: "troubleshoot1Title", defaultValue: "Images still not loading?")
    }

    static var troubleshoot1Body: String {
        String(localized: "troubleshoot1Body",
               defaultValue: "Make sure the site is enabled in the popup. If it is, try Compatibility mode. Still nothing? Use Refresh Page")
    }

    static var troubleshoot2Title: String {
        String(localized: "troubleshoot2Title", defaultValue: "No toolbar button?")
    }

    static var troubleshoot2Body: String {
        String(localized: "troubleshoot2Body",
               defaultValue: "Check Safari → Settings → Extensions and make sure No Lazyload is on")
    }

    static var troubleshoot3Title: String {
        String(localized: "troubleshoot3Title", defaultValue: "Want to turn a site off?")
    }

    static var troubleshoot3Body: String {
        String(localized: "troubleshoot3Body",
               defaultValue: "Open the popup and click “Remove Current Site”")
    }

    // MARK: - 隐私与页脚

    static var privacyNote: String {
        String(localized: "privacyNote",
               defaultValue: "No Lazyload only acts on the websites you enable. Other websites are untouched")
    }

    static func versionLine(_ version: String) -> String {
        String(format: String(localized: "versionFormat", defaultValue: "Version %@"), version)
    }

    static var github: String { "GitHub" }
}
