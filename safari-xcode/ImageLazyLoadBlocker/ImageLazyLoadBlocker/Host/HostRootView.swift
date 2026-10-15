//
//  HostRootView.swift
//  ImageLazyLoadBlocker
//
//  Host App 根视图。信息顺序刻意是：
//     扩展状态 → 怎么用
//  这个 App 不是付费墙，也不是仪表盘，只负责让用户把扩展用起来。
//
//  视觉：系统字体 + 系统语义色 + 4pt 网格，不自己做 Liquid Glass。
//  macOS 26 的观感由系统材质/控件自然给出，老系统自动退化为标准外观。
//

import SwiftUI

struct HostRootView: View {
    @ObservedObject var viewModel: HostViewModel
    @Environment(\.accessibilityReduceMotion) private var reduceMotion

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: HostSpacing.sectionGap) {
                    HeaderView()

                    ExtensionStatusView(viewModel: viewModel)
                    HowToUseView()
                    ModesView()
                    TroubleshootingView()
                }
                .padding(HostSpacing.contentPadding)
                // 窗口被拉宽时限制正文宽度并居中，避免出现 900pt 宽的一行文字
                .frame(maxWidth: HostLayout.contentMaxWidth, alignment: .leading)
                .frame(maxWidth: .infinity, alignment: .center)
            }

            HostFooterView(viewModel: viewModel)
        }
        .frame(minWidth: HostLayout.minWidth, minHeight: HostLayout.minHeight)
        .background(HostColor.windowSurface)
        .task { await viewModel.refresh() }
        // 用户可能刚在系统设置里改过扩展状态，回到前台时重新读一次。
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            Task { await viewModel.refresh() }
        }
    }
}

private struct HeaderView: View {
    var body: some View {
        HStack(alignment: .top, spacing: HostSpacing.x3) {
            Image(nsImage: NSApplication.shared.applicationIconImage)
                .resizable()
                .frame(width: HostLayout.appIcon, height: HostLayout.appIcon)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                Text(HostCopy.appName)
                    .font(.title2.weight(.semibold))
                    .foregroundStyle(HostColor.primaryText)
                // 先说清楚这个 App 是干什么的，再谈状态
                Text(HostCopy.appSubtitle)
                    .font(.callout)
                    .foregroundStyle(HostColor.secondaryText)
                    .fixedSize(horizontal: false, vertical: true)
            }

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }
}
