//
//  ViewController.swift
//  ImageLazyLoadBlocker
//
//  Host App 主界面。
//  只做一件事：把 SwiftUI 的 HostRootView 挂进既有的 AppKit 窗口生命周期。
//
//  这里以前是 WKWebView + Resources/Main.html + Script.js 的网页模拟界面，
//  现在全部由原生控件承担 —— 真正的 macOS 控件、原生 Dark Mode、
//  无障碍语义、键盘导航，以及更少的 JS 桥接代码。
//

import Cocoa
import SwiftUI
import os.log

class ViewController: NSViewController {

    private let viewModel = HostViewModel.makeDefault()
    private var hostingView: NSHostingView<HostRootView>?

    override func viewDidLoad() {
        super.viewDidLoad()

        let host = NSHostingView(rootView: HostRootView(viewModel: viewModel))
        host.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(host)
        NSLayoutConstraint.activate([
            host.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            host.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            host.topAnchor.constraint(equalTo: view.topAnchor),
            host.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        hostingView = host

        let info = Bundle.main.infoDictionary
        let short = (info?["CFBundleShortVersionString"] as? String) ?? "?"
        let build = (info?["CFBundleVersion"] as? String) ?? "?"
        os_log(.default, "Host App viewDidLoad: version=%{public}@ build=%{public}@", short, build)
    }

    override func viewWillAppear() {
        super.viewWillAppear()
        Task { await viewModel.refresh() }
    }

    override func viewDidAppear() {
        super.viewDidAppear()

        // 扩展 popup 唤起本 App 时，确保窗口到前台。
        NSApplication.shared.activate(ignoringOtherApps: true)
        if let window = view.window {
            window.makeKeyAndOrderFront(nil)
            // 标准 macOS 窗口：可缩放但不过分，给一个合理的最小尺寸。
            window.minSize = NSSize(width: 420, height: 480)
        }
    }
}
