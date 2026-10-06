//
//  ViewController.swift
//  ImageLazyLoadBlocker
//
//  Host App 主界面：扩展开关状态 + StoreKit 购买入口 + 权限状态。
//
//  购买流程：
//    扩展 popup 点 Upgrade → 唤起本 App → 用户点 Buy Now
//    → StoreKit 付款面板 → 交易验证 → EntitlementManager 写入 App Group
//    → 用户回到 Safari 重新打开 popup → Extension 读到 Pro
//

import Cocoa
import SafariServices
import WebKit
import os.log

let extensionBundleIdentifier = "com.lingyi01.imagelazyloadblocker.Extension"

class ViewController: NSViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!

    /// 正在购买中，避免重复点击。
    private var isPurchasing = false

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self
        self.webView.configuration.userContentController.add(self, name: "controller")

        // 把系统首选语言注入页面，供 Script.js 选择宿主 App 文案。
        // 不用 navigator.language：WKWebView 只会返回 App 已声明的本地化（这里是 en/Base）。
        let preferredLanguage = Locale.preferredLanguages.first ?? "en"
        let languageScript = WKUserScript(
            source: "window.__HOST_LANG__ = \(Self.jsString(preferredLanguage));",
            injectionTime: .atDocumentStart,
            forMainFrameOnly: true
        )
        self.webView.configuration.userContentController.addUserScript(languageScript)

        let info = Bundle.main.infoDictionary
        let short = (info?["CFBundleShortVersionString"] as? String) ?? "?"
        let build = (info?["CFBundleVersion"] as? String) ?? "?"
        let bundleId = Bundle.main.bundleIdentifier ?? "?"
        os_log(.default, "🐱 Host App viewDidLoad: version=%{public}@ build=%{public}@ bundleId=%{public}@",
               short, build, bundleId)

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!,
                                 allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    override func viewDidAppear() {
        super.viewDidAppear()
        // 扩展 popup 唤起本 App 时，确保窗口到前台，用户能立刻看到购买按钮。
        NSApplication.shared.activate(ignoringOtherApps: true)
        NSApp.windows.first?.makeKeyAndOrderFront(nil)
    }

    // MARK: - WKNavigationDelegate

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        // 兜底：文档起始注入理论上不会被页面 CSP 影响，这里再设一次并刷新文案，
        // 保证任何情况下宿主 App 都按系统语言显示。
        let preferredLanguage = Locale.preferredLanguages.first ?? "en"
        webView.evaluateJavaScript(
            "window.__HOST_LANG__ = \(Self.jsString(preferredLanguage));" +
            "if (typeof applyHostI18n === 'function') { applyHostI18n(); }"
        )

        let info = Bundle.main.infoDictionary
        let short = (info?["CFBundleShortVersionString"] as? String) ?? "?"
        let build = (info?["CFBundleVersion"] as? String) ?? "?"
        let versionStr = "\(short) (\(build))"

        webView.evaluateJavaScript("if (typeof setVersion === 'function') { setVersion(\(Self.jsString(versionStr))); }")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else { return }
            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show(\(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show(\(state.isEnabled), false)")
                }
                self.injectProState()
            }
        }

        // 商品价格从 StoreKit 读，避免硬编码在 HTML 里跟 App Store Connect 不一致。
        // 取不到 = StoreKit 配置文件没生效，必须显式告诉用户，不能静默回退到假价格。
        Task {
            let price = await (NSApplication.shared.delegate as? AppDelegate)?.purchaseProvider.localizedPrice()
            await MainActor.run {
                if let price {
                    webView.evaluateJavaScript("if (typeof setPrice === 'function') { setPrice(\(Self.jsString(price))); }")
                } else {
                    webView.evaluateJavaScript("if (typeof setStoreKitUnavailable === 'function') { setStoreKitUnavailable(); }")
                }
            }
        }
    }

    // MARK: - WKScriptMessageHandler

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let body = message.body as? String else { return }

        switch body {
        case "open-preferences":
            SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { _ in
                DispatchQueue.main.async { NSApplication.shared.terminate(nil) }
            }

        case "purchase":
            startPurchase()

        case "restore":
            startRestore()

        default:
            os_log(.default, "Host App: unknown message %{public}@", body)
        }
    }

    // MARK: - Purchase

    private func startPurchase() {
        guard !isPurchasing else { return }
        isPurchasing = true
        webView.evaluateJavaScript("if (typeof setBusy === 'function') { setBusy(true, 'purchase'); }")

        Task {
            var errorMessage: String?
            do {
                let ok = try await provider().purchase()
                if !ok { errorMessage = nil } // 用户取消，静默
            } catch {
                os_log(.error, "StoreKit purchase failed: %{public}@", String(describing: error))
                errorMessage = error.localizedDescription
            }

            await MainActor.run {
                self.isPurchasing = false
                self.injectProState()
                self.webView.evaluateJavaScript("if (typeof setBusy === 'function') { setBusy(false, 'purchase'); }")
                if let msg = errorMessage {
                    self.webView.evaluateJavaScript("if (typeof showError === 'function') { showError(\(Self.jsString(msg))); }")
                }
            }
        }
    }

    private func startRestore() {
        guard !isPurchasing else { return }
        isPurchasing = true
        webView.evaluateJavaScript("if (typeof setBusy === 'function') { setBusy(true, 'restore'); }")

        Task {
            var errorMessage: String?
            do {
                _ = try await provider().restore()
            } catch {
                os_log(.error, "StoreKit restore failed: %{public}@", String(describing: error))
                errorMessage = error.localizedDescription
            }

            await MainActor.run {
                self.isPurchasing = false
                self.injectProState()
                self.webView.evaluateJavaScript("if (typeof setBusy === 'function') { setBusy(false, 'restore'); }")
                if let msg = errorMessage {
                    self.webView.evaluateJavaScript("if (typeof showError === 'function') { showError(\(Self.jsString(msg))); }")
                }
            }
        }
    }

    private func provider() -> PurchaseProvider {
        (NSApplication.shared.delegate as? AppDelegate)?.purchaseProvider ?? StoreKitPurchaseProvider()
    }

    /// 把当前权限状态注入 webview。
    private func injectProState() {
        EntitlementManager.shared.reload()
        let hasUnlimitedSites = EntitlementManager.shared.has(.unlimitedSites)
        webView.evaluateJavaScript("if (typeof setUnlimitedSitesStatus === 'function') { setUnlimitedSitesStatus(\(hasUnlimitedSites)); }")
    }

    // MARK: - Helpers

    /// 把 Swift 字符串安全地内联进 JS 字面量。
    private static func jsString(_ s: String) -> String {
        let escaped = s
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
            .replacingOccurrences(of: "\n", with: "\\n")
            .replacingOccurrences(of: "\r", with: "")
        return "\"\(escaped)\""
    }
}
