//
//  Entitlement.swift
//  ImageLazyLoadBlocker (shared between Host App + Extension)
//
//  统一权限模型。业务代码只判断 EntitlementManager.shared.has(.xxx)，
//  永远不要引入 isPro 这类布尔开关。
//
//  新增权限：只需在这里加一个 case（String rawValue 即 JSON 存储值），
//  无需改动数据结构或业务层判断方式。
//

import Foundation

enum Entitlement: String, Codable, CaseIterable {
    case unlimitedSites
    // 以下为预留，v1 不授予、不判断，仅用于证明可扩展性
    case cloudSync
    case importExport
    case advancedRules
    case smartNetworkPolicy
    case aiRules
}
