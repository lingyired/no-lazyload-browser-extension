//
//  HostViewModel.swift
//  ImageLazyLoadBlocker
//
//  Host App 的全部状态与动作。视图只读这里的 @Published，不自己碰 SafariServices。
//
//  Host App 不是付费墙，也没有套餐概念：它只做两件事 ——
//     1. 告诉用户 Safari 扩展启用了没有，没启用就一键去设置
//     2. 说明怎么用
//

import Cocoa
import Combine
import os.log

@MainActor
final class HostViewModel: ObservableObject {

    // MARK: - 扩展状态

    /// nil = 暂时读不到（与"未启用"是两回事）
    @Published private(set) var extensionEnabled: Bool?

    init() {}

    // MARK: - 刷新

    func refresh() async {
        extensionEnabled = await ExtensionStateService.isExtensionEnabled()
    }

    // MARK: - 动作

    func openSafariSettings() {
        ExtensionStateService.openSafariSettings()
    }

    /// 应用版本号（CFBundleShortVersionString），页脚显示用。
    var versionString: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
    }
}
