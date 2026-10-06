//
//  PlanView.swift
//  ImageLazyLoadBlocker
//
//  套餐区域。购买是次要信息：
//   · Free  → 说明免费额度 + 升级入口（价格只在真取到时显示）
//   · Pro   → 只说明已解锁，绝不再出现 Buy CTA / 价格
//   · 商店不可用 / App Group 不可用 → 给明确、可恢复的说明，不暴露实现细节
//

import SwiftUI

struct PlanView: View {
    @ObservedObject var viewModel: HostViewModel

    var body: some View {
        HostGroup(title: HostCopy.plan) {
            if !viewModel.storageAvailable {
                // App Group 不可用：权限状态不可信，明确告知而不是假装免费版
                Text(HostCopy.storageUnavailable)
                    .font(.callout)
                    .foregroundStyle(HostColor.warning)
                    .fixedSize(horizontal: false, vertical: true)
            } else if viewModel.plan == .pro {
                proContent
            } else {
                freeContent
            }
        }
    }

    // MARK: - Pro

    private var proContent: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x3) {
            // PRO 徽章只在标题区出现一次，这里不再重复
            Label(HostCopy.proPlan, systemImage: "checkmark.seal.fill")
                .font(.headline)
                .foregroundStyle(HostColor.success)

            Text(HostCopy.proUnlocked)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)

            Text(HostCopy.proThanks)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            // 恢复购买留在次要位置（footer 里也有一个），绝不做主 CTA
            Button {
                Task { await viewModel.restore() }
            } label: {
                Text(HostCopy.restorePurchases)
            }
            .buttonStyle(.link)
            .disabled(viewModel.isBusy)
        }
    }

    // MARK: - Free

    private var freeContent: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x3) {
            VStack(alignment: .leading, spacing: 2) {
                Text(HostCopy.freePlan)
                    .font(.headline)
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

                // macOS 26 起 Text 的 "+" 拼接已废弃，用插值
                Text("(viewModel.priceLine) · (HostCopy.noSubscription)")
                    .font(.caption)
                    .foregroundStyle(HostColor.secondaryText)
            } else {
                // 取不到商品 = 商店暂不可用。绝不显示假价格。
                Text(HostCopy.storeUnavailable)
                    .font(.callout)
                    .foregroundStyle(HostColor.warning)
                    .fixedSize(horizontal: false, vertical: true)
            }
        }
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

            Text("·").foregroundStyle(HostColor.secondaryText)

            Link(HostCopy.github, destination: URL(string: "https://github.com/lingyired/no-lazyload-browser-extension")!)
                .buttonStyle(.link)

            Spacer(minLength: 0)

            Text(HostCopy.versionLine(viewModel.versionString))
                .font(.caption)
                .foregroundStyle(HostColor.secondaryText)
        }
        .font(.callout)
        .padding(.horizontal, HostSpacing.contentPadding)
        .padding(.vertical, HostSpacing.x3)
        .overlay(alignment: .top) {
            Rectangle()
                .fill(HostColor.separator)
                .frame(height: 1)
        }
    }
}
