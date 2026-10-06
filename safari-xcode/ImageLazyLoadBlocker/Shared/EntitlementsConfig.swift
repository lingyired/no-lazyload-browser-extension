//
//  EntitlementsConfig.swift
//  ImageLazyLoadBlocker (shared)
//
//  权限系统相关常量：App Group、存储键、StoreKit 商品 ID（v2 预留）。
//

import Foundation

enum EntitlementsConfig {
    /// App Group 标识。Host App 与 Extension 通过它共享权限数据。
    /// 需在两个 target 的 .entitlements 中启用同一 group。
    static let appGroup = "group.com.lingyi01.imagelazyloadblocker"

    /// UserDefaults 中存储权限 JSON 的键。
    static let storeKey = "entitlements"

    /// StoreKit 2 商品 ID（v2 接入真实内购时使用）。v1 Mock 不使用。
    static let unlimitedSitesProductID = "com.lingyi01.imagelazyloadblocker.unlimitedsites"
}
