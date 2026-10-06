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

    /// 探测 App Group 是否真的可写所用的临时键（写入后立即删除）。
    static let probeKey = "__entitlement_store_probe__"

    /// StoreKit 2 商品 ID。全工程唯一来源（.storekit 配置、App Store Connect 必须一致）。
    ///
    /// ⚠️ 决策记录（plan Task A8）：
    ///   如果该商品**尚未**在 App Store Connect 创建，建议改成产品级 ID
    ///   "com.lingyi01.imagelazyloadblocker.pro.lifetime"，这样以后加新能力
    ///   （例如 Global Mode）不需要再新建商品。
    ///   如果已经在 App Store Connect 建立，必须保持原样 —— 改名会让已购用户失去权益。
    ///   本地 .storekit 配置显示尚未与 App Store Connect 同步过，请以 App Store Connect
    ///   后台实际状态为准再决定是否改名；改名时同步修改：
    ///     1. 这一行
    ///     2. ImageLazyLoadBlocker.storekit 里的 productID
    ///     3. App Store Connect 的商品 ID
    static let unlimitedSitesProductID = "com.lingyi01.imagelazyloadblocker.unlimitedsites"
}
