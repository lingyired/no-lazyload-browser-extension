import SwiftUI

/// 窗口底部页脚：隐私说明、次要动作与版本信息。
struct HostFooterView: View {
    @ObservedObject var viewModel: HostViewModel

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x2) {
            // 隐私口径放在页脚而不是正文：它是"补充承诺"，
            // 不是用户上手需要读的内容。
            Text(HostCopy.privacyNote)
                .font(.caption)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)

            HStack(spacing: HostSpacing.x3) {
                Link(HostCopy.github, destination: URL(string: "https://github.com/lingyired/no-lazyload-browser-extension")!)
                    .buttonStyle(.link)

                Spacer(minLength: 0)

                Text(HostCopy.versionLine(viewModel.versionString))
                    .font(.caption)
                    .foregroundStyle(HostColor.tertiaryText)
            }
        }
        .font(.callout)
        .frame(maxWidth: .infinity, alignment: .leading)
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
