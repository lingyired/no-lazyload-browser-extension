//
//  AppDelegate.swift
//  ImageLazyLoadBlocker
//
//  Host App。持有唯一的 PurchaseProvider（StoreKit）。
//  购买只能在这里发生：Safari Extension 无法弹出系统付款面板。
//
//  流程：
//    扩展 popup 点 Upgrade → background 发 native message 'openHostApp'
//    → 本 App 被唤起并置前 → 用户点 Buy Now → StoreKit 付款面板
//    → 验证交易 → EntitlementManager 写入 App Group
//    → 用户回到 Safari 重新打开 popup → Extension 从 App Group 读到 Pro
//

import Cocoa
import os.log

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    /// StoreKit 实现。交易历史是唯一真实来源，启动时同步一次。
    let purchaseProvider: PurchaseProvider = StoreKitPurchaseProvider()

    func applicationDidFinishLaunching(_ notification: Notification) {
        Task {
            // 启动即从 StoreKit 交易历史重算权限并写入 App Group。
            await purchaseProvider.fetchEntitlements()
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

    /// 处理 URL Scheme: imagelazyloadblocker://upgrade
    func application(_ application: NSApplication, open urls: [URL]) {
        NSApplication.shared.activate(ignoringOtherApps: true)
        for url in urls {
            os_log(.default, "Host App opened via URL scheme: %{public}@", url.absoluteString)
        }
    }

}
