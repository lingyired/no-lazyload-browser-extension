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
//  ⚠️ 若 App Group 不可用（例如签名缺少 app-groups entitlement），会回退到
//  UserDefaults.standard 并打 error 日志。回退状态下 Host App 与 Extension
//  各自读自己的容器，权限无法同步 —— 属于明确的错误状态，不要当成正常路径。
//

import Foundation
import os.log

enum EntitlementStore {
    /// 读取当前权限集合。失败或为空时返回空集合（即免费状态）。
    static func load() -> Set<Entitlement> {
        let defaults = suite()
        guard let raw = defaults?.array(forKey: EntitlementsConfig.storeKey) as? [String] else {
            return []
        }
        return Set(raw.compactMap { Entitlement(rawValue: $0) })
    }

    /// 写入权限集合。
    static func save(_ entitlements: Set<Entitlement>) {
        let defaults = suite()
        let raw = entitlements.map { $0.rawValue }
        defaults?.set(raw, forKey: EntitlementsConfig.storeKey)
        os_log(.default, "EntitlementStore saved: %{public}@", raw.joined(separator: ","))
    }

    /// 清空权限（用于测试/重置）。
    static func clear() {
        suite()?.removeObject(forKey: EntitlementsConfig.storeKey)
    }

    /// App Group 的 UserDefaults。
    ///
    /// 用 FileManager.containerURL 判断 App Group 是否真的可用：
    /// UserDefaults(suiteName:) 即使没有 entitlement 也会返回非 nil，
    /// 但写入会静默丢失，所以不能只判断它是否为 nil。
    private static func suite() -> UserDefaults? {
        let hasContainer = FileManager.default
            .containerURL(forSecurityApplicationGroupIdentifier: EntitlementsConfig.appGroup) != nil

        if hasContainer, let defaults = UserDefaults(suiteName: EntitlementsConfig.appGroup) {
            return defaults
        }

        os_log(.error, "EntitlementStore: App Group %{public}@ 不可用，回退 UserDefaults.standard（跨进程同步会失效）",
               EntitlementsConfig.appGroup)
        return UserDefaults.standard
    }
}
