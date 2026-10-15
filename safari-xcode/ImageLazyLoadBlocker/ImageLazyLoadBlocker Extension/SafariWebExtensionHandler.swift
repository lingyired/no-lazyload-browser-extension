//
//  SafariWebExtensionHandler.swift
//  ImageLazyLoadBlocker Extension
//
//  Safari Web Extension 的原生消息入口。
//
//  ⚠️ 必须同时遵循 NSExtensionRequestHandling 与 SFSafariExtensionHandling：
//     - NSExtensionRequestHandling 提供 beginRequest(with:)，这是扩展点真正调用的入口。
//     - SFSafariExtensionHandling 让本类能被 Safari Web Extension 扩展点识别。
//
//  本扩展是纯前端的：没有内购、没有授权查询，也不需要和宿主 App 交换数据。
//  这里只保留一个空的入口，任何消息都明确回错误，绝不静默假装成功。
//

import Foundation
import SafariServices
import os.log

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling, SFSafariExtensionHandling {

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

        let action = (message as? [String: Any])?["action"] as? String
        os_log(.error, "🦊 本扩展不支持原生消息（action=%{public}@）",
               action ?? String(describing: message))

        respond(context: context, payload: ["error": "native messaging is not supported"])
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
