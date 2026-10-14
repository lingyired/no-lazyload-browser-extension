//
//  HostRootView.swift
//  ImageLazyLoadBlocker
//
//  Host App 根视图。信息顺序刻意是：
//     扩展状态 → 怎么用 → 套餐 → （需要时才）升级
//  购买不是首要信息，Host App 也不是付费墙。
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
                    HeaderView(plan: viewModel.plan)

                    if let banner = viewModel.banner {
                        BannerView(banner: banner)
                            .transition(reduceMotion ? .opacity : .move(edge: .top).combined(with: .opacity))
                    }

                    ExtensionStatusView(viewModel: viewModel)
                    HowToUseView()
                    PlanView(viewModel: viewModel)
                }
                .padding(HostSpacing.contentPadding)
                // 窗口被拉宽时限制正文宽度并居中，避免出现 900pt 宽的一行文字
                .frame(maxWidth: HostLayout.contentMaxWidth, alignment: .leading)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .animation(reduceMotion ? nil : .easeOut(duration: 0.18), value: viewModel.banner)

            HostFooterView(viewModel: viewModel)
        }
        .frame(minWidth: HostLayout.minWidth, minHeight: HostLayout.minHeight)
        .background(HostColor.windowSurface)
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
        HStack(alignment: .top, spacing: HostSpacing.x3) {
            Image(nsImage: NSApplication.shared.applicationIconImage)
                .resizable()
                .frame(width: HostLayout.appIcon, height: HostLayout.appIcon)
                .accessibilityHidden(true)

            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: HostSpacing.x2) {
                    Text(HostCopy.appName)
                        .font(.title2.weight(.semibold))
                        .foregroundStyle(HostColor.primaryText)
                    if plan == .pro {
                        HostChip(text: HostCopy.proBadge)
                    }
                }
                // 先说清楚这个 App 是干什么的，再谈状态和套餐
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

private struct BannerView: View {
    let banner: HostViewModel.Banner

    private var tint: Color {
        switch banner.tone {
        case .success: return HostColor.success
        case .info: return HostColor.accent
        case .error: return HostColor.danger
        }
    }

    private var symbol: String {
        switch banner.tone {
        case .success: return "checkmark.circle.fill"
        case .info: return "info.circle.fill"
        case .error: return "exclamationmark.triangle.fill"
        }
    }

    var body: some View {
        HStack(alignment: .top, spacing: HostSpacing.x3) {
            Image(systemName: symbol)
                .foregroundStyle(tint)
                .accessibilityHidden(true)
            Text(banner.text)
                .font(.callout)
                .foregroundStyle(HostColor.primaryText)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .padding(HostSpacing.x3)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: HostRadius.control, style: .continuous)
                .fill(tint.opacity(0.12))
        )
        // 状态变化不该只靠颜色表达，图标 + 文案已经说明结果
        .accessibilityElement(children: .combine)
    }
}
