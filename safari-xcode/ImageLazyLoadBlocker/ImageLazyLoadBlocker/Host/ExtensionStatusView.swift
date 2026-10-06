//
//  ExtensionStatusView.swift
//  ImageLazyLoadBlocker
//
//  Host App 里最优先的信息：Safari 扩展到底启用了没有，以及没启用时怎么办。
//

import SwiftUI

struct ExtensionStatusView: View {
    @ObservedObject var viewModel: HostViewModel

    private var hintText: String {
        switch viewModel.extensionEnabled {
        case .some(true): return HostCopy.readyHint
        case .some(false): return HostCopy.enableHint
        case .none: return HostCopy.extensionStatusUnknownHint
        }
    }

    var body: some View {
        HostGroup(title: HostCopy.safariExtension) {
            HStack(spacing: HostSpacing.x2) {
                HostStatusDot(
                    isOn: viewModel.extensionEnabled == true,
                    onText: HostCopy.extensionEnabled,
                    offText: viewModel.extensionEnabled == nil
                        ? HostCopy.extensionStatusUnknown
                        : HostCopy.extensionDisabled,
                    isUnknown: viewModel.extensionEnabled == nil
                )
                Spacer(minLength: 0)
            }

            // 三种状态给三种说明：已启用 / 明确未启用 / 暂时读不到（不是"未启用"）
            Text(hintText)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            if viewModel.extensionEnabled != true {
                Button {
                    viewModel.openSafariSettings()
                } label: {
                    Text(HostCopy.openSafariSettings)
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)
                // 主操作：扩展没启用时，这是用户唯一需要做的事
                .keyboardShortcut(.defaultAction)
            }
        }
    }
}

struct HowToUseView: View {
    var body: some View {
        HostGroup(title: HostCopy.howToUse) {
            VStack(alignment: .leading, spacing: HostSpacing.x2) {
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
        HStack(alignment: .firstTextBaseline, spacing: HostSpacing.x3) {
            Text("\(index).")
                .font(.body.monospacedDigit())
                .foregroundStyle(HostColor.secondaryText)
                .frame(width: 16, alignment: .trailing)
            Text(text)
                .font(.body)
                .fixedSize(horizontal: false, vertical: true)
        }
    }
}
