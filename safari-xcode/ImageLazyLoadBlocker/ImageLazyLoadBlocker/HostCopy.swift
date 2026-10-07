//
//  HostCopy.swift
//  ImageLazyLoadBlocker
//
//  Host App 的全部用户可见文案集中在这里，翻译在同目录的
//  Localizable.xcstrings（String Catalog）里维护，不再另建 JS 翻译表。
//
//  规则：
//   1. Release 里绝不出现 Xcode / StoreKit 配置 / 签名等实现细节。
//   2. 新增文案必须同时加进 Localizable.xcstrings，否则只有开发语言有值。
//   3. 目前只提供 en / zh-Hans / zh-Hant；其它语言自动回退到 en
//      （Catalog 里缺哪条，系统就退回 defaultValue）。
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
               defaultValue: "Turn on No Lazyload for that website")
    }

    // MARK: - 套餐

    static var plan: String {
        String(localized: "plan", defaultValue: "Plan")
    }

    static var freePlan: String {
        String(localized: "freePlan", defaultValue: "Free Plan")
    }

    static var freePlanDetail: String {
        String(localized: "freePlanDetail", defaultValue: "Up to 3 enabled websites")
    }

    static var proPlan: String {
        String(localized: "proPlan", defaultValue: "No Lazyload Pro")
    }

    static var proUnlocked: String {
        String(localized: "proUnlocked", defaultValue: "Unlimited websites unlocked.")
    }

    static var proThanks: String {
        String(localized: "proThanks",
               defaultValue: "Thank you for supporting No Lazyload.")
    }

    static var proBadge: String {
        String(localized: "proBadge", defaultValue: "PRO")
    }

    static var upgradeToPro: String {
        String(localized: "upgradeToPro", defaultValue: "Upgrade to Pro")
    }

    static var oneTimePurchase: String {
        String(localized: "oneTimePurchase", defaultValue: "One-time purchase")
    }

    static var noSubscription: String {
        String(localized: "noSubscription", defaultValue: "No subscription")
    }

    static var restorePurchases: String {
        String(localized: "restorePurchases", defaultValue: "Restore Purchases")
    }

    static var storageUnavailable: String {
        String(localized: "entitlementStorageUnavailable",
               defaultValue: "Your purchase status can't be read right now. Please restart the app and try again.")
    }

    // MARK: - 购买结果

    static var purchaseUnlocked: String {
        String(localized: "purchaseUnlocked", defaultValue: "Pro unlocked.")
    }

    static var purchasePending: String {
        String(localized: "purchasePending",
               defaultValue: "Purchase pending. You'll get Pro automatically after the purchase is approved.")
    }

    static var purchaseRestored: String {
        String(localized: "purchaseRestored", defaultValue: "Your purchase has been restored.")
    }

    static var nothingToRestore: String {
        String(localized: "nothingToRestore", defaultValue: "No previous purchase was found.")
    }

    static var purchaseFailed: String {
        String(localized: "purchaseErrorGeneric",
               defaultValue: "Unable to complete the purchase. Please try again.")
    }

    static var storeUnavailable: String {
        String(localized: "purchaseUnavailable",
               defaultValue: "Purchases are temporarily unavailable. Please try again later.")
    }

    // MARK: - 页脚

    static func versionLine(_ version: String) -> String {
        String(format: String(localized: "versionFormat", defaultValue: "Version %@"), version)
    }

    static var github: String { "GitHub" }
}
