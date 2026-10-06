//
//  AppLimits.swift
//  ImageLazyLoadBlocker (shared)
//
//  免费版站点数量上限。JS 侧 shared/constants.js 的 APP_LIMITS.freeSiteLimit
//  必须与此处保持一致。
//

import Foundation

enum AppLimits {
    /// 免费版最多可配置的网站数量。Pro（拥有 .unlimitedSites）不受此限制。
    static let freeSiteLimit = 3
}
