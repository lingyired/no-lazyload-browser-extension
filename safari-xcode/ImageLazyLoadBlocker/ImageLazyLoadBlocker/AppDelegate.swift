//
//  AppDelegate.swift
//  ImageLazyLoadBlocker
//
//  Host App。Safari Web Extension 的宿主容器 —— 扩展本身不能独立安装，
//  必须由一个 App 打包分发，这个 App 就是那个容器。
//
//  它不做任何内购：扩展是免费的，功能也没有任何限制。
//  用户界面（HostRootView）只负责说明扩展启用了没有、怎么用。
//

import Cocoa
import os.log

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        let info = Bundle.main.infoDictionary
        let short = (info?["CFBundleShortVersionString"] as? String) ?? "?"
        let build = (info?["CFBundleVersion"] as? String) ?? "?"
        os_log(.default, "Host App launched: version=%{public}@ build=%{public}@", short, build)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }
}
