//
//  HostViewModel.swift
//  ImageLazyLoadBlocker
//
//  Host App 的全部状态与动作。视图只读这里的 @Published，不自己碰 StoreKit / SafariServices。
//
//  信息优先级（plan Task B2）：
//     1. Safari 扩展是否已启用
//     2. 怎么用
//     3. 我是什么套餐
//     4. 需要更多网站时再升级
//  Host App 不是付费墙。
//

import Cocoa
import Combine
import os.log

/// Host App 只区分免费 / Pro 两态（Chrome/Firefox 不会运行这个 App）。
enum HostPlan {
    case free
    case pro
}

@MainActor
final class HostViewModel: ObservableObject {

    enum Busy {
        case none
        case purchase
        case restore
    }

    struct Banner: Identifiable, Equatable {
        let id = UUID()
        let text: String
        let isError: Bool
    }

    // MARK: - 扩展状态

    /// nil = 暂时读不到（与"未启用"是两回事）
    @Published private(set) var extensionEnabled: Bool?

    // MARK: - 权限 / 存储

    @Published private(set) var plan: HostPlan = .free
    /// App Group 是否可用。false 时权限状态不可信，不能用"免费版"冒充。
    @Published private(set) var storageAvailable = true

    // MARK: - 商店

    @Published private(set) var price: String?
    /// 商品加载失败 = StoreKit 暂不可用（不在 UI 上暴露原因）
    @Published private(set) var storeAvailable = true

    // MARK: - 交互

    @Published private(set) var busy: Busy = .none
    @Published var banner: Banner?

    private let purchaseProvider: PurchaseProvider?

    init(purchaseProvider: PurchaseProvider?) {
        self.purchaseProvider = purchaseProvider
    }

    /// 默认实例：从 AppDelegate 取唯一的 PurchaseProvider。
    /// 放在 @MainActor 工厂里，避免在 nonisolated 的初始化器里碰 NSApplication。
    static func makeDefault() -> HostViewModel {
        HostViewModel(purchaseProvider: (NSApplication.shared.delegate as? AppDelegate)?.purchaseProvider)
    }

    // MARK: - 派生状态

    var isBusy: Bool { busy != .none }

    /// 只有免费版才展示升级入口；Pro 用户不再看到 Buy CTA。
    var showsUpgrade: Bool { plan == .free && storeAvailable && storageAvailable }

    /// 价格文案：取不到真实价格时绝不用假价格，只显示"一次性购买"。
    var priceLine: String {
        if let price { return "\(price) · \(HostCopy.oneTimePurchase)" }
        return HostCopy.oneTimePurchase
    }

    // MARK: - 刷新

    func refresh() async {
        reloadEntitlements()
        extensionEnabled = await ExtensionStateService.isExtensionEnabled()

        guard let purchaseProvider else {
            storeAvailable = false
            return
        }
        let loaded = await purchaseProvider.localizedPrice()
        price = loaded
        storeAvailable = loaded != nil
    }

    /// 从 App Group 重新读取权限（购买完成后由 StoreKit 写入）。
    func reloadEntitlements() {
        EntitlementManager.shared.reload()
        storageAvailable = EntitlementManager.shared.storageState == .available
        plan = EntitlementManager.shared.has(.unlimitedSites) ? .pro : .free
    }

    // MARK: - 动作

    func openSafariSettings() {
        ExtensionStateService.openSafariSettings()
    }

    func purchase() async {
        guard busy == .none, let purchaseProvider else { return }
        busy = .purchase
        defer { busy = .none }

        do {
            switch try await purchaseProvider.purchase() {
            case .purchased:
                reloadEntitlements()
                banner = Banner(text: HostCopy.purchaseUnlocked, isError: false)
            case .cancelled:
                break // 用户主动取消，不提示、不报错
            case .pending:
                banner = Banner(text: HostCopy.purchasePending, isError: false)
            }
        } catch {
            os_log(.error, "purchase failed: %{public}@", String(describing: error))
            banner = Banner(text: HostCopy.purchaseFailed, isError: true)
        }
    }

    func restore() async {
        guard busy == .none, let purchaseProvider else { return }
        busy = .restore
        defer { busy = .none }

        do {
            switch try await purchaseProvider.restore() {
            case .restored:
                reloadEntitlements()
                banner = Banner(text: HostCopy.purchaseRestored, isError: false)
            case .nothingToRestore:
                // 中性提示：这个 Apple ID 下确实没有可恢复的购买
                banner = Banner(text: HostCopy.nothingToRestore, isError: false)
            }
        } catch {
            os_log(.error, "restore failed: %{public}@", String(describing: error))
            banner = Banner(text: HostCopy.purchaseFailed, isError: true)
        }
    }

    /// 应用版本号（CFBundleShortVersionString），页脚显示用。
    var versionString: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
}
