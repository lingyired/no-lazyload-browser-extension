//
//  ExtensionStatusView.swift
//  ImageLazyLoadBlocker
//
//  Host App 里最优先的信息：Safari 扩展到底启用了没有，以及没启用时怎么办。
//  三种状态（已启用 / 明确未启用 / 暂时读不到）各有各的说明，绝不混为一谈。
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

            if viewModel.extensionEnabled != true {
                // 主操作：扩展没启用时，这是用户唯一需要做的事
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
}

struct HowToUseView: View {
    var body: some View {
        HostSection(title: HostCopy.howToUse) {
            VStack(alignment: .leading, spacing: HostSpacing.x3) {
                StepRow(index: 1, text: HostCopy.stepOpenWebsite)
                StepRow(index: 2, text: HostCopy.stepOpenExtension)
                StepRow(index: 3, text: HostCopy.stepEnableSite)
            }
        }
    }
}

private struct StepRow: View {
    let index: Int
    let text: String

    var body: some View {
        HStack(alignment: .center, spacing: HostSpacing.x3) {
            Text("\(index)")
                .font(.caption.weight(.semibold).monospacedDigit())
                .foregroundStyle(HostColor.secondaryText)
                .frame(width: 20, height: 20)
                .background(Circle().fill(HostColor.subtleFill))
                .accessibilityHidden(true)

            Text(text)
                .font(.body)
                .foregroundStyle(HostColor.primaryText)
                .fixedSize(horizontal: false, vertical: true)

            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("\(index). \(text)")
    }
}
