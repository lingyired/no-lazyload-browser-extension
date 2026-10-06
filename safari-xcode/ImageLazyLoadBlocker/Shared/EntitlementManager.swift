//
//  EntitlementManager.swift
//  ImageLazyLoadBlocker (shared)
//
//  统一权限查询入口。业务/UI 代码只调用：
//      EntitlementManager.shared.has(.unlimitedSites)
//  不要判断 isPro，不要直接读 StoreKit / App Group。
//
//  Host App 与 Extension 各自有自己的 singleton（不同进程），
//  但都通过 EntitlementStore 读写同一份 App Group 数据。
//
//  storageState 用来区分"确实是免费版"和"读不到权限"这两种情况：
//  后者必须显式暴露给 UI / 原生消息，不能让用户看到自相矛盾的 Pro/Free。
//

import Foundation
import Combine
import os.log

final class EntitlementManager: ObservableObject {

    static let shared = EntitlementManager()

    /// 当前持有的权限集合。Host App 可通过 @Published 观察。
    @Published private(set) var entitlements: Set<Entitlement> = []

    /// 权限存储（App Group）的可用性。unavailable 时 entitlements 不可信。
    @Published private(set) var storageState: EntitlementStoreState = .unavailable

    private init() {
        reload()
    }

    /// 从 EntitlementStore 重新加载。
    func reload() {
        storageState = EntitlementStore.state
        entitlements = EntitlementStore.load()
        #if DEBUG
        os_log(.debug, "EntitlementManager reloaded: %{public}@ (storage=%{public}@)",
               entitlements.map { $0.rawValue }.joined(separator: ","),
               storageState == .available ? "available" : "unavailable")
        #endif
    }

    /// 唯一的权限判断接口。存储不可用时一律按未授权处理（fail closed）。
    func has(_ entitlement: Entitlement) -> Bool {
        guard storageState == .available else { return false }
        return entitlements.contains(entitlement)
    }

    /// 授予一项权限并持久化。供 PurchaseProvider 调用，业务代码不要直接调。
    @discardableResult
    func grant(_ entitlement: Entitlement) -> Bool {
        guard storageState == .available else { return false }
        entitlements.insert(entitlement)
        return EntitlementStore.save(entitlements)
    }

    /// 用一组新的权限集合整体替换。
    /// StoreKit 的交易历史是唯一真实来源，同步时用整体替换而不是累加 ——
    /// 否则退款（revocation）后权限无法被收回。
    @discardableResult
    func replaceAll(_ newValue: Set<Entitlement>) -> Bool {
        guard storageState == .available else {
            // 写不进去就不要在内存里假装成功，否则 UI 会显示 Pro 而扩展读到 Free。
            entitlements = []
            return false
        }
        entitlements = newValue
        return EntitlementStore.save(newValue)
    }

    /// 撤销全部权限（测试/重置用）。
    func revokeAll() {
        entitlements.removeAll()
        EntitlementStore.clear()
    }
}
