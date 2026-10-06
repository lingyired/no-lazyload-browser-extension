//
//  PurchaseProvider.swift
//  ImageLazyLoadBlocker (shared)
//
//  购买/恢复的抽象接口。
//  业务层（JS / Host App UI）永远不直接知道 StoreKit 或商品 ID，
//  只通过 PurchaseProvider 触发购买，通过 EntitlementManager 查询结果。
//
//  唯一的实现是 StoreKitPurchaseProvider（Host App 进程内）。
//  Safari Extension 不实现也不使用本协议 —— 购买必须发生在 Host App。
//

import Foundation

protocol PurchaseProvider: AnyObject {
    /// 发起购买。成功返回 true（用户取消返回 false）。
    func purchase() async throws -> Bool

    /// 恢复购买（会触发 App Store 账号验证）。
    func restore() async throws -> Bool

    /// 主动同步一次权限（从 StoreKit 交易历史刷新并写入 App Group）。
    func fetchEntitlements() async

    /// 商品的本地化价格文案（如 "$2.99"）。取不到返回 nil。
    func localizedPrice() async -> String?
}
