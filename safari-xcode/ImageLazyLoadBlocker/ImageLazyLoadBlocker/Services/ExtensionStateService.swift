//
//  ExtensionStateService.swift
//  ImageLazyLoadBlocker
//
//  Safari 扩展状态的唯一读取入口 + 打开 Safari 设置页。
//  Host App 的 UI 不直接接触 SafariServices。
//

import Cocoa
import SafariServices
import os.log

/// Host App 与 Extension 的 bundle id 关系（Extension = Host + ".Extension"）。
let extensionBundleIdentifier = "com.lingyi01.imagelazyloadblocker.Extension"

enum ExtensionStateService {

    /// 读取扩展是否已在 Safari 中启用。
    /// - Returns: nil 表示状态暂时读不到（不是"未启用"，UI 必须区分这两者）。
    static func isExtensionEnabled() async -> Bool? {
        await withCheckedContinuation { continuation in
            SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { state, error in
                if let error {
                    os_log(.error, "Safari extension state error: %{public}@", String(describing: error))
                }
                continuation.resume(returning: state?.isEnabled)
            }
        }
    }

    /// 打开 Safari 设置 → 扩展页，并激活 Safari。
    /// 完成后 Host App 退出（沿用既有行为：用户是来完成设置的，不该停在后台）。
    @MainActor
    static func openSafariSettings(terminateAfterwards: Bool = true) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            if let error {
                os_log(.error, "showPreferencesForExtension failed: %{public}@", String(describing: error))
            }
            DispatchQueue.main.async {
                if terminateAfterwards { NSApplication.shared.terminate(nil) }
            }
        }
    }
}
