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
#if canImport(AppKit)
import AppKit
#endif

final class StoreKitPurchaseProvider: PurchaseProvider {

    private let productID = EntitlementsConfig.unlimitedSitesProductID

    /// App 外交易监听（家庭共享、退款、上次购买未完成就退出等）。
    private var updatesTask: Task<Void, Never>?

    /// 购买确认面板应挂在哪个窗口上（macOS 14+ 支持显式指定）。
    /// 返回 nil 时退回系统默认行为。
    #if canImport(AppKit)
    var presentationWindowProvider: (() -> NSWindow?)?
    #endif

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

    func purchase() async throws -> PurchaseOutcome {
        let products = try await Product.products(for: [productID])
        guard let product = products.first else {
            os_log(.error, "StoreKit: product not found: %{public}@", productID)
            throw PurchaseError.productNotFound(productID)
        }

        let result = try await purchaseResult(for: product)

        switch result {
        case .success(let verification):
            let transaction = try Self.verified(verification)
            await transaction.finish()
            await syncEntitlements()
            return .purchased

        case .userCancelled:
            os_log(.default, "StoreKit: user cancelled")
            return .cancelled

        case .pending:
            os_log(.default, "StoreKit: purchase pending (Ask to Buy?)")
            return .pending

        @unknown default:
            return .cancelled
        }
    }

    /// 在 macOS 14+ 把系统购买确认面板显式挂到 App 自己的窗口上，
    /// 避免用户找不到付款面板。低版本退回默认行为。
    private func purchaseResult(for product: Product) async throws -> Product.PurchaseResult {
        #if canImport(AppKit)
        if #available(macOS 14.0, *), let window = presentationWindowProvider?() {
            return try await product.purchase(confirmIn: window)
        }
        #endif
        return try await product.purchase()
    }

    func restore() async throws -> RestoreOutcome {
        // AppStore.sync() 会要求 App Store 账号验证，然后拉取历史交易。
        // 在 Xcode 的 StoreKit 本地测试环境下是模拟的，不会真的联网。
        try await AppStore.sync()
        await syncEntitlements()
        return EntitlementManager.shared.has(.unlimitedSites) ? .restored : .nothingToRestore
    }

    func fetchEntitlements() async {
        await syncEntitlements()
    }

    func localizedPrice() async -> String? {
        do {
            let products = try await Product.products(for: [productID])
            guard let product = products.first else {
                #if DEBUG
                os_log(.error, "StoreKit: 商品列表为空（请求 %{public}@）。多半是当前运行方式没有启用 StoreKit 配置文件 —— 必须在 Xcode 里 Cmd+R 运行，Finder 双击打开不会注入本地测试环境。",
                       productID)
                #endif
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

        // 写入失败（App Group 不可用）时不改内存状态，UI 会明确显示权限不可用。
        if !EntitlementManager.shared.replaceAll(owned) {
            os_log(.error, "StoreKit: 权限写入失败 —— App Group 不可用")
        }
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
        case .productNotFound:
            // Release 里绝不给用户看 Xcode / StoreKit 配置说明。
            return NSLocalizedString("purchaseErrorGeneric",
                                     value: "Unable to complete the purchase. Please try again.",
                                     comment: "Generic purchase failure shown to users")
        }
    }
}
