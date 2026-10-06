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

import Foundation
import Combine
import os.log

final class EntitlementManager: ObservableObject {

    static let shared = EntitlementManager()

    /// 当前持有的权限集合。Host App 可通过 @Published 观察。
    @Published private(set) var entitlements: Set<Entitlement> = []

    private init() {
        reload()
    }

    /// 从 EntitlementStore 重新加载。
    func reload() {
        entitlements = EntitlementStore.load()
        os_log(.default, "EntitlementManager reloaded: %{public}@", entitlements.map { $0.rawValue }.joined(separator: ","))
    }

    /// 唯一的权限判断接口。
    func has(_ entitlement: Entitlement) -> Bool {
        return entitlements.contains(entitlement)
    }

    /// 授予一项权限并持久化。供 PurchaseProvider 调用，业务代码不要直接调。
    func grant(_ entitlement: Entitlement) {
        entitlements.insert(entitlement)
        EntitlementStore.save(entitlements)
    }

    /// 用一组新的权限集合整体替换。
    /// StoreKit 的交易历史是唯一真实来源，同步时用整体替换而不是累加 ——
    /// 否则退款（revocation）后权限无法被收回。
    func replaceAll(_ newValue: Set<Entitlement>) {
        entitlements = newValue
        EntitlementStore.save(newValue)
    }

    /// 撤销全部权限（测试/重置用）。
    func revokeAll() {
        entitlements.removeAll()
        EntitlementStore.clear()
    }
}
