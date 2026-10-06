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
//  返回值刻意不是 Bool："购买完成 / 用户取消 / 等待批准（Ask to Buy）"
//  三种结果的 UI 文案完全不同，Bool 会把它们压成同一个静默分支。
//

import Foundation

/// 一次购买尝试的结果。
enum PurchaseOutcome {
    /// 交易已通过验证并完成，权限已写入。
    case purchased
    /// 用户主动取消：不是错误，UI 不应报错。
    case cancelled
    /// 交易处于 pending（例如 Ask to Buy 等待家长批准）。
    case pending
}

/// 一次"恢复购买"尝试的结果。
enum RestoreOutcome {
    /// 找到了历史交易并恢复了权限。
    case restored
    /// 这个 Apple ID 下确实没有可恢复的购买：中性提示，不是错误。
    case nothingToRestore
}

protocol PurchaseProvider: AnyObject {
    /// 发起购买。用户在系统面板取消时返回 .cancelled（不抛错）。
    func purchase() async throws -> PurchaseOutcome

    /// 恢复购买（会触发 App Store 账号验证）。
    func restore() async throws -> RestoreOutcome

    /// 主动同步一次权限（从 StoreKit 交易历史刷新并写入 App Group）。
    func fetchEntitlements() async

    /// 商品的本地化价格文案（如 "$2.99"）。取不到返回 nil。
    func localizedPrice() async -> String?
}
