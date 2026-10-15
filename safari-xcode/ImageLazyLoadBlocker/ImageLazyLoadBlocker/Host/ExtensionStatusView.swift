//
//  ExtensionStatusView.swift
//  ImageLazyLoadBlocker
//
//  Host App 里最优先的信息：Safari 扩展到底启用了没有，以及没启用时怎么办。
//  三种状态（已启用 / 明确未启用 / 暂时读不到）各有各的说明，绝不混为一谈。
//
//  只有「明确未启用」才展示启用步骤 —— 状态读不到时给步骤是误导，
//  用户照着做也没用（可能早就启用了）。
//

import SwiftUI

struct ExtensionStatusView: View {
    @ObservedObject var viewModel: HostViewModel

    private var badgeText: String {
        switch viewModel.extensionEnabled {
        case .some(true): return HostCopy.extensionEnabled
        case .some(false): return HostCopy.extensionDisabled
        case .none: return HostCopy.extensionStatusUnknown
        }
    }

    private var badgeTone: HostStatusBadge.Tone {
        switch viewModel.extensionEnabled {
        case .some(true): return .ok
        case .some(false): return .idle
        case .none: return .warning
        }
    }

    private var hintText: String {
        switch viewModel.extensionEnabled {
        case .some(true): return HostCopy.readyHint
        case .some(false): return HostCopy.enableHint
        case .none: return HostCopy.extensionStatusUnknownHint
        }
    }

    /// 只有明确未启用时才给步骤。
    private var showsEnableSteps: Bool {
        viewModel.extensionEnabled == false
    }

    var body: some View {
        HostSection(title: HostCopy.safariExtension) {
            HStack(spacing: HostSpacing.x2) {
                HostStatusBadge(text: badgeText, tone: badgeTone)
                Spacer(minLength: 0)
            }

            Text(hintText)
                .font(.body)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            if showsEnableSteps {
                enableSteps
            }

            if viewModel.extensionEnabled != true {
                // 主操作：扩展没启用（或状态未知）时，这是用户唯一需要做的事
                Button {
                    viewModel.openSafariSettings()
                } label: {
                    Text(HostCopy.openSafariSettings)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                .keyboardShortcut(.defaultAction)
            }
        }
    }

    private var enableSteps: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x2) {
            Text(HostCopy.enableStepsTitle)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(HostColor.primaryText)
                .accessibilityAddTraits(.isHeader)

            VStack(alignment: .leading, spacing: HostSpacing.x3) {
                HostStepRow(index: 1, text: HostCopy.enableStep1)
                HostStepRow(index: 2, text: HostCopy.enableStep2)
                HostStepRow(index: 3, text: HostCopy.enableStep3)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, HostSpacing.x1)
    }
}
