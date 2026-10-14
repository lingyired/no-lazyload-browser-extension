//
//  PlanView.swift
//  ImageLazyLoadBlocker
//
//  套餐区域。购买是次要信息：
//   · Free  → 说明免费额度 + 升级入口（价格只在真取到时显示）
//   · Pro   → 只说明已解锁，绝不再出现 Buy CTA / 价格 / 重复的恢复入口
//   · 商店不可用 / App Group 不可用 → 给明确、可恢复的说明，不暴露实现细节
//

import SwiftUI

struct PlanView: View {
    @ObservedObject var viewModel: HostViewModel

    var body: some View {
        HostSection(title: HostCopy.plan) {
            if !viewModel.storageAvailable {
                // App Group 不可用：权限状态不可信，明确告知而不是假装免费版
                HostNoticeText(text: HostCopy.storageUnavailable)
            } else if viewModel.plan == .pro {
                proContent
            } else {
                freeContent
            }
        }
    }

    // MARK: - Pro

    private var proContent: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x2) {
            // PRO 徽章只在标题区出现一次，这里不再重复
            HStack(spacing: HostSpacing.x2) {
                Image(systemName: "checkmark.seal.fill")
                    .foregroundStyle(HostColor.success)
                    .accessibilityHidden(true)
                Text(HostCopy.proPlan)
                    .font(.headline)
                    .foregroundStyle(HostColor.primaryText)
                Spacer(minLength: 0)
            }

            Text(HostCopy.proUnlocked)
                .font(.body)
                .foregroundStyle(HostColor.primaryText)
                .fixedSize(horizontal: false, vertical: true)

            Text(HostCopy.proThanks)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .accessibilityElement(children: .combine)
    }

    // MARK: - Free

    private var freeContent: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x3) {
            VStack(alignment: .leading, spacing: 2) {
                Text(HostCopy.freePlan)
                    .font(.headline)
                    .foregroundStyle(HostColor.primaryText)
                Text(HostCopy.freePlanDetail)
                    .font(.callout)
                    .foregroundStyle(HostColor.secondaryText)
            }

            if viewModel.storeAvailable {
                Button {
                    Task { await viewModel.purchase() }
                } label: {
                    Text(HostCopy.upgradeToPro)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .disabled(viewModel.isBusy)

                priceRow
            } else {
                // 取不到商品 = 商店暂不可用。绝不显示假价格。
                HostNoticeText(text: HostCopy.storeUnavailable)
            }
        }
    }

    /// 价格与购买方式：价格单独取自 StoreKit，取不到就只显示购买方式。
    private var priceRow: some View {
        HStack(spacing: HostSpacing.x1) {
            if let price = viewModel.price {
                Text(price)
                    .font(.callout.weight(.semibold))
                    .foregroundStyle(HostColor.primaryText)
                Text("·")
                    .foregroundStyle(HostColor.tertiaryText)
                    .accessibilityHidden(true)
            }
            Text(HostCopy.oneTimePurchase)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }
}

/// 窗口底部页脚：次要动作与版本信息。
struct HostFooterView: View {
    @ObservedObject var viewModel: HostViewModel

    var body: some View {
        HStack(spacing: HostSpacing.x3) {
            Button {
                Task { await viewModel.restore() }
            } label: {
                Text(HostCopy.restorePurchases)
            }
            .buttonStyle(.link)
            .disabled(viewModel.isBusy)

            Text("·")
                .foregroundStyle(HostColor.tertiaryText)
                .accessibilityHidden(true)

            Link(HostCopy.github, destination: URL(string: "https://github.com/lingyired/no-lazyload-browser-extension")!)
                .buttonStyle(.link)

            Spacer(minLength: 0)

            // 购买 / 恢复期间给出明确的进行中反馈，而不是让按钮无声地失效
            if viewModel.isBusy {
                ProgressView()
                    .controlSize(.small)
                    .accessibilityLabel(HostCopy.working)
            }

            Text(HostCopy.versionLine(viewModel.versionString))
                .font(.caption)
                .foregroundStyle(HostColor.tertiaryText)
        }
        .font(.callout)
        .padding(.horizontal, HostSpacing.contentPadding)
        .padding(.vertical, HostSpacing.x3)
        // 与正文列同宽同位置，窗口拉宽时不会脱节
        .frame(maxWidth: HostLayout.contentMaxWidth, alignment: .leading)
        .frame(maxWidth: .infinity, alignment: .center)
        .background(HostColor.windowSurface)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HostColor.separator)
                .frame(height: 1)
        }
    }
}
