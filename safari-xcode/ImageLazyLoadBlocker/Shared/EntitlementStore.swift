//
//  EntitlementStore.swift
//  ImageLazyLoadBlocker (shared)
//
//  权限数据的持久化层。唯一真实来源。
//  数据格式：App Group UserDefaults 中存字符串数组 ["unlimitedSites", ...]
//
//  v2 StoreKit：购买发生在 Host App 进程（StoreKit 无法在 Safari Extension 中弹出付款面板），
//  Host App 写入 App Group，Extension 读取同一份数据 —— 跨进程共享必须依赖 App Group。
//
//  ⚠️ Fail closed：App Group 不可用时（例如签名缺少 app-groups entitlement），
//  本层明确进入 unavailable 状态并拒绝一切读写 —— 绝不回退到 UserDefaults.standard。
//  回退会让 Host App 与 Extension 各读各的容器，出现"App 里是 Pro、Safari 里是 Free"
//  这种自相矛盾的状态，比直接报错危险得多。
//

import Foundation
import os.log

/// 权限存储的可用性。
enum EntitlementStoreState {
    /// App Group 容器可用，读写均有效。
    case available
    /// App Group 容器不可用：本进程无法与其它进程共享权限。
    case unavailable
}

enum EntitlementStore {

    /// 当前存储状态。UI / 原生消息都应据此给出明确、可恢复的错误状态。
    static var state: EntitlementStoreState {
        containerURL != nil ? .available : .unavailable
    }

    /// 读取当前权限集合。
    /// 存储不可用时返回空集合（等于免费版），但状态本身必须由 state 暴露出去，
    /// 调用方不能把"读不到"当成"确实是免费版"。
    static func load() -> Set<Entitlement> {
        guard let defaults = suite(),
              let raw = defaults.array(forKey: EntitlementsConfig.storeKey) as? [String] else {
            return []
        }
        return Set(raw.compactMap { Entitlement(rawValue: $0) })
    }

    /// 写入权限集合。
    /// - Returns: 是否真的写入成功。App Group 不可用时返回 false。
    @discardableResult
    static func save(_ entitlements: Set<Entitlement>) -> Bool {
        guard let defaults = suite() else {
            logUnavailableOnce()
            return false
        }
        let raw = entitlements.map { $0.rawValue }
        defaults.set(raw, forKey: EntitlementsConfig.storeKey)
        #if DEBUG
        os_log(.debug, "EntitlementStore saved: %{public}@", raw.joined(separator: ","))
        #endif
        return true
    }

    /// 清空权限（用于测试/重置）。
    static func clear() {
        suite()?.removeObject(forKey: EntitlementsConfig.storeKey)
    }

    // MARK: - Private

    /// App Group 容器 URL。这是判断 App Group 是否真的可用的唯一可靠方式：
    /// UserDefaults(suiteName:) 即使没有 entitlement 也会返回非 nil，
    /// 但写入会静默丢失。
    private static var containerURL: URL? {
        FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: EntitlementsConfig.appGroup
        )
    }

    /// 只在 App Group 可用时返回 UserDefaults；不可用返回 nil。
    private static func suite() -> UserDefaults? {
        guard state == .available else { return nil }
        return UserDefaults(suiteName: EntitlementsConfig.appGroup)
    }

    private static var didLogUnavailable = false

    private static func logUnavailableOnce() {
        guard !didLogUnavailable else { return }
        didLogUnavailable = true
        // 只进日志，不进用户可见文案（Release 里用户看不到任何签名/实现细节）。
        os_log(.error, "EntitlementStore: App Group %{public}@ 不可用，权限存储进入 unavailable 状态",
               EntitlementsConfig.appGroup)
    }
}
