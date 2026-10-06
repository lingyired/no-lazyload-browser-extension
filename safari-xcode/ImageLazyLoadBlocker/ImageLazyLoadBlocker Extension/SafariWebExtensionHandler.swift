//
//  SafariWebExtensionHandler.swift
//  ImageLazyLoadBlocker Extension
//
//  JS 层与原生权限系统的唯一桥梁。
//
//  ⚠️ 必须同时遵循 NSExtensionRequestHandling 与 SFSafariExtensionHandling：
//     - NSExtensionRequestHandling 提供 beginRequest(with:)，这是扩展点真正调用的入口。
//       SFSafariExtensionHandling 里**没有** beginRequest，只遵循它会编译通过但永远不被调用，
//       表现为 sendNativeMessage 的 Promise 永不 resolve（JS 侧超时）。
//     - SFSafariExtensionHandling 让本类能被 Safari Web Extension 扩展点识别。
//
//  职责只有两件事：
//     1. getEntitlements —— 从 App Group 读出当前权限（Host App 购买后写入）
//     2. openHostApp     —— 唤起 Host App，由用户在那边的 StoreKit 付款面板完成购买
//
//  本进程不做任何 StoreKit 操作：Extension 无法弹出系统付款面板，
//  且 completeRequest 必须在 beginRequest 的同步栈上调用，与异步 purchase() 冲突。
//

import Foundation
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling, SFSafariExtensionHandling {

    private static let hostAppBundleID = "com.lingyi01.imagelazyloadblocker"

    override init() {
        super.init()
        let info = Bundle.main.infoDictionary
        let short = (info?["CFBundleShortVersionString"] as? String) ?? "?"
        let build = (info?["CFBundleVersion"] as? String) ?? "?"
        os_log(.default, "🦊 handler init: version=%{public}@ build=%{public}@", short, build)
    }

    // MARK: - NSExtensionRequestHandling（真正的入口）

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        guard let dict = message as? [String: Any], let action = dict["action"] as? String else {
            os_log(.error, "🦊 beginRequest: 无法解析 action, raw=%{public}@", String(describing: message))
            respond(context: context, payload: ["error": "invalid message"])
            return
        }

        os_log(.default, "🦊 beginRequest action=%{public}@", action)

        switch action {
        case "getEntitlements":
            // App Group 是 Host App 与 Extension 之间唯一的共享通道。
            EntitlementManager.shared.reload()
            let entitlements = EntitlementManager.shared.entitlements.map { $0.rawValue }
            os_log(.default, "🦊 getEntitlements -> %{public}@", entitlements.joined(separator: ","))
            respond(context: context, payload: ["entitlements": entitlements])

        case "openHostApp":
            os_log(.default, "🦊 openHostApp -> %{public}@", Self.hostAppBundleID)
            // NSWorkspace 的调用要离开当前栈，但 respond 必须同步完成。
            if let url = NSWorkspace.shared.urlForApplication(withBundleIdentifier: Self.hostAppBundleID) {
                let config = NSWorkspace.OpenConfiguration()
                config.activates = true
                NSWorkspace.shared.openApplication(at: url, configuration: config) { _, error in
                    if let error {
                        os_log(.error, "🦊 openHostApp 失败: %{public}@", String(describing: error))
                    }
                }
                respond(context: context, payload: ["success": true])
            } else {
                os_log(.error, "🦊 openHostApp 找不到 Host App (%{public}@)", Self.hostAppBundleID)
                respond(context: context, payload: ["success": false, "error": "host app not found"])
            }

        default:
            os_log(.error, "🦊 未知 action: %{public}@", action)
            respond(context: context, payload: ["error": "unknown action: \(action)"])
        }
    }

    // MARK: - 返回

    private func respond(context: NSExtensionContext, payload: [String: Any]) {
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: payload]
        } else {
            response.userInfo = ["message": payload]
        }
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }
}
