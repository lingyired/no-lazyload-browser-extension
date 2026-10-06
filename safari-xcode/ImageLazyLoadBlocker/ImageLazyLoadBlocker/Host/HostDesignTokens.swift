//
//  HostDesignTokens.swift
//  ImageLazyLoadBlocker
//
//  Host App 的设计令牌。原则（plan Task B3）：
//   · 只用系统字体与语义色，不引入自定义字体，不硬编码大量十六进制色
//   · 4pt 基础网格；内容内边距 20–24pt
//   · 克制的圆角：小控件 8–10，分组面 12–14（不要 24–32 的 SaaS 大卡片）
//   · Liquid Glass 交给系统组件，不自己叠半透明卡片
//

import SwiftUI

enum HostSpacing {
    static let x1: CGFloat = 4
    static let x2: CGFloat = 8
    static let x3: CGFloat = 12
    static let x4: CGFloat = 16
    static let x5: CGFloat = 20
    static let x6: CGFloat = 24
    static let x8: CGFloat = 32

    /// 内容区标准内边距
    static let contentPadding: CGFloat = 20
    /// 分组之间的间距
    static let sectionGap: CGFloat = 20
}

enum HostRadius {
    /// 按钮 / 输入类小控件
    static let control: CGFloat = 8
    /// 分组卡片
    static let group: CGFloat = 12
}

enum HostColor {
    /// 成功状态一律用系统语义色，自动适配深浅色与提高对比度设置。
    static let success = Color(nsColor: .systemGreen)
    static let warning = Color(nsColor: .systemOrange)
    static let danger = Color(nsColor: .systemRed)
    static let secondaryText = Color(nsColor: .secondaryLabelColor)
    static let groupSurface = Color(nsColor: .controlBackgroundColor)
    static let separator = Color(nsColor: .separatorColor)
}

/// 分组卡片容器：一个浅表面 + 细边框，绝不嵌套半透明层。
struct HostGroup<Content: View>: View {
    var title: String?
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x3) {
            if let title {
                Text(title)
                    .font(.headline)
            }
            content
        }
        .padding(HostSpacing.x4)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: HostRadius.group, style: .continuous)
                .fill(HostColor.groupSurface)
        )
        .overlay(
            RoundedRectangle(cornerRadius: HostRadius.group, style: .continuous)
                .stroke(HostColor.separator, lineWidth: 1)
        )
    }
}

/// 状态点：颜色之外还有文字，不依赖颜色单独表达状态。
struct HostStatusDot: View {
    let isOn: Bool
    let onText: String
    let offText: String
    let isUnknown: Bool

    init(isOn: Bool, onText: String, offText: String, isUnknown: Bool = false) {
        self.isOn = isOn
        self.onText = onText
        self.offText = offText
        self.isUnknown = isUnknown
    }

    var body: some View {
        HStack(spacing: HostSpacing.x2) {
            Circle()
                .fill(isUnknown ? HostColor.warning : (isOn ? HostColor.success : Color(nsColor: .tertiaryLabelColor)))
                .frame(width: 8, height: 8)
            Text(isUnknown ? offText : (isOn ? onText : offText))
                .font(.headline)
        }
    }
}
