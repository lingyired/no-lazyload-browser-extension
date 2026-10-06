//
//  HostCopy.swift
//  ImageLazyLoadBlocker
//
//  Host App 的用户可见文案集中在这里，方便后续接入 Localizable.xcstrings。
//  规则：Release 里绝不出现 Xcode / StoreKit 配置 / 签名等实现细节。
//

import Foundation

enum HostCopy {
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

    static var storageUnavailable: String {
        String(localized: "entitlementStorageUnavailable",
               defaultValue: "Your purchase status can't be read right now. Please restart the app and try again.")
    }
}
