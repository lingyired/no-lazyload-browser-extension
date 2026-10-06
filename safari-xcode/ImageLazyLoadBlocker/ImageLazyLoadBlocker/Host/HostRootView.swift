//
//  HostRootView.swift
//  ImageLazyLoadBlocker
//
//  Host App 根视图。信息顺序刻意是：
//     扩展状态 → 怎么用 → 套餐 → （需要时才）升级
//  购买不是首要信息，Host App 也不是付费墙。
//
//  视觉：系统组件 + 系统语义色 + 4pt 网格，不自己做 Liquid Glass。
//  macOS 26 的观感由系统材质/控件自然给出，老系统自动退化为标准外观。
//

import SwiftUI

struct HostRootView: View {
    @ObservedObject var viewModel: HostViewModel

    var body: some View {
        VStack(spacing: 0) {
            ScrollView {
                VStack(alignment: .leading, spacing: HostSpacing.sectionGap) {
                    HeaderView(plan: viewModel.plan)

                    if let banner = viewModel.banner {
                        BannerView(banner: banner)
                    }

                    ExtensionStatusView(viewModel: viewModel)
                    HowToUseView()
                    PlanView(viewModel: viewModel)
                }
                .padding(HostSpacing.contentPadding)
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            HostFooterView(viewModel: viewModel)
        }
        .frame(minWidth: 420, minHeight: 480)
        .background(Color(nsColor: .windowBackgroundColor))
        .task { await viewModel.refresh() }
        // 扩展 popup 唤起本 App 后，用户在别处（Safari）完成购买，
        // 回到前台时重新读一次 App Group，避免显示过期状态。
        .onReceive(NotificationCenter.default.publisher(for: NSApplication.didBecomeActiveNotification)) { _ in
            Task { await viewModel.refresh() }
        }
    }
}

private struct HeaderView: View {
    let plan: HostPlan

    var body: some View {
        HStack(spacing: HostSpacing.x3) {
            Image(nsImage: NSApplication.shared.applicationIconImage)
                .resizable()
                .frame(width: 40, height: 40)
                .accessibilityHidden(true)

            Text(HostCopy.appName)
                .font(.title2.weight(.semibold))

            if plan == .pro {
                Text(HostCopy.proBadge)
                    .font(.caption.bold())
                    .padding(.horizontal, HostSpacing.x2)
                    .padding(.vertical, 2)
                    .background(Capsule().fill(HostColor.success.opacity(0.15)))
                    .foregroundStyle(HostColor.success)
            }

            Spacer(minLength: 0)
        }
    }
}

private struct BannerView: View {
    let banner: HostViewModel.Banner

    var body: some View {
        HStack(alignment: .top, spacing: HostSpacing.x2) {
            Image(systemName: banner.isError ? "exclamationmark.triangle.fill" : "info.circle.fill")
                .foregroundStyle(banner.isError ? HostColor.danger : HostColor.success)
            Text(banner.text)
                .font(.callout)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(HostSpacing.x3)
        .background(
            RoundedRectangle(cornerRadius: HostRadius.control, style: .continuous)
                .fill((banner.isError ? HostColor.danger : HostColor.success).opacity(0.10))
        )
        // 状态变化不该只靠颜色表达，图标 + 文案已经说明结果
        .accessibilityElement(children: .combine)
    }
}
