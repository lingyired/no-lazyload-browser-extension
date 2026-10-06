//
//  StoreKitPurchaseProvider.swift
//  ImageLazyLoadBlocker (shared, App target only)
//
//  StoreKit 2 真实内购实现。
//
//  ⚠️ 只能在 Host App 进程使用：Safari Web Extension 是 NSExtension，
//  无法弹出系统付款面板，也无法满足 NSExtensionContext 同步 completeRequest 的要求。
//  因此购买流程是：
//      扩展 popup 点 Upgrade → sendNativeMessage('openHostApp') → 唤起 Host App
//      → 用户在 Host App 内完成 StoreKit 购买 → 授权写入 App Group
//      → 用户回到 Safari 重新打开 popup → 读到 Pro
//
//  交易历史（Transaction.currentEntitlements）是唯一真实来源，
//  每次购买/恢复/启动都会用它重算权限，因此退款、家庭共享、跨设备恢复都能自动生效。
//

import Foundation
import StoreKit
import os.log

final class StoreKitPurchaseProvider: PurchaseProvider {

    private let productID = EntitlementsConfig.unlimitedSitesProductID

    /// App 外交易监听（家庭共享、退款、上次购买未完成就退出等）。
    private var updatesTask: Task<Void, Never>?

    init() {
        updatesTask = Task { [weak self] in
            for await update in Transaction.updates {
                guard let self else { return }
                await self.handle(update)
            }
        }
    }

    deinit {
        updatesTask?.cancel()
    }

    // MARK: - PurchaseProvider

    func purchase() async throws -> Bool {
        let products = try await Product.products(for: [productID])
        guard let product = products.first else {
            os_log(.error, "StoreKit: product not found: %{public}@", productID)
            throw PurchaseError.productNotFound(productID)
        }

        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try Self.verified(verification)
            await transaction.finish()
            await syncEntitlements()
            return EntitlementManager.shared.has(.unlimitedSites)

        case .userCancelled:
            os_log(.default, "StoreKit: user cancelled")
            return false

        case .pending:
            os_log(.default, "StoreKit: purchase pending (Ask to Buy?)")
            return false

        @unknown default:
            return false
        }
    }

    func restore() async throws -> Bool {
        // AppStore.sync() 会要求 App Store 账号验证，然后拉取历史交易。
        // 在 Xcode 的 StoreKit 本地测试环境下是模拟的，不会真的联网。
        try await AppStore.sync()
        await syncEntitlements()
        return EntitlementManager.shared.has(.unlimitedSites)
    }

    func fetchEntitlements() async {
        await syncEntitlements()
    }

    func localizedPrice() async -> String? {
        do {
            let products = try await Product.products(for: [productID])
            guard let product = products.first else {
                os_log(.error, "StoreKit: 商品列表为空（请求 %{public}@）。多半是当前运行方式没有启用 StoreKit 配置文件 —— 必须在 Xcode 里 Cmd+R 运行，Finder 双击打开不会注入本地测试环境。",
                       productID)
                return nil
            }
            os_log(.default, "StoreKit: 商品已加载 %{public}@ = %{public}@", product.id, product.displayPrice)
            return product.displayPrice
        } catch {
            os_log(.error, "StoreKit: 加载商品失败 %{public}@ — %{public}@", productID, String(describing: error))
            return nil
        }
    }

    // MARK: - Private

    /// 以 StoreKit 交易历史重算权限集合并写入 EntitlementStore。
    private func syncEntitlements() async {
        var owned: Set<Entitlement> = []

        for await result in Transaction.currentEntitlements {
            guard let transaction = try? Self.verified(result) else { continue }
            // 已退款/撤销的交易不算数
            guard transaction.revocationDate == nil else { continue }
            guard transaction.productID == productID else { continue }
            owned.insert(.unlimitedSites)
        }

        EntitlementManager.shared.replaceAll(owned)
        os_log(.default, "StoreKit: synced entitlements = %{public}@",
               owned.map { $0.rawValue }.joined(separator: ","))
    }

    private func handle(_ result: VerificationResult<Transaction>) async {
        guard let transaction = try? Self.verified(result) else { return }
        await transaction.finish()
        await syncEntitlements()
    }

    private static func verified<T>(_ result: VerificationResult<T>) throws -> T {
        switch result {
        case .verified(let safe):
            return safe
        case .unverified(_, let error):
            throw error
        }
    }
}

enum PurchaseError: LocalizedError {
    case productNotFound(String)

    var errorDescription: String? {
        switch self {
        case .productNotFound(let id):
            return "找不到商品 \(id)。请确认 StoreKit 配置文件已挂到当前 Scheme（Product → Scheme → Edit Scheme → Options → StoreKit Configuration）。"
        }
    }
}
