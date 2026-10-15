//
//  HostDesignTokens.swift
//  ImageLazyLoadBlocker
//
//  Host App 的设计令牌。
//  原则（plan Task B3 + 2026-10 UI 复核）：
//   · 只用系统字体与系统语义色，不引入自定义字体，不硬编码色值
//   · 4pt 基础网格；内容内边距 20，区块间距 24
//   · 克制的圆角：小控件 8，分组面 12（不要 24–32 的 SaaS 大卡片）
//   · 表面靠"窗口底色 + 卡片底色"两个语义色拉开，不自己叠半透明材质
//   · 文字一律用 label 级语义色，颜色只做辅助，不单独承载状态
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
    /// 区块（扩展状态 / 用法 / 套餐）之间的距离
    static let sectionGap: CGFloat = 24
    /// 区块小标题与卡片之间的距离
    static let titleGap: CGFloat = 8
}

enum HostLayout {
    static let minWidth: CGFloat = 420
    static let minHeight: CGFloat = 560
    /// 窗口被拉宽时正文的最大宽度，避免长行难以阅读
    static let contentMaxWidth: CGFloat = 640
    static let appIcon: CGFloat = 44
}

enum HostRadius {
    /// 按钮 / 输入类小控件
    static let control: CGFloat = 8
    /// 分组卡片
    static let group: CGFloat = 12
}

enum HostColor {
    /// 状态色一律用系统语义色，自动适配深浅色、提高对比度与「减弱透明度」设置。
    static let success = Color(nsColor: .systemGreen)
    static let warning = Color(nsColor: .systemOrange)
    static let danger = Color(nsColor: .systemRed)
    /// 跟随用户在「系统设置 → 外观」里选的强调色，不要写死蓝色。
    static let accent = Color(nsColor: .controlAccentColor)

    static let primaryText = Color(nsColor: .labelColor)
    static let secondaryText = Color(nsColor: .secondaryLabelColor)
    static let tertiaryText = Color(nsColor: .tertiaryLabelColor)

    /// 窗口底色 / 卡片底色：两个不同的语义色，浅色与深色下都有可测量的层次差。
    /// （浅色 #FFFFFF vs #F6F6F6；深色 #1E1E1E vs #282828。）
    static let windowSurface = Color(nsColor: .windowBackgroundColor)
    static let groupSurface = Color(nsColor: .underPageBackgroundColor)
    static let separator = Color(nsColor: .separatorColor)
    /// 极轻的填充：进度、编号圆点这类装饰性底色。
    static let subtleFill = Color(nsColor: .quaternaryLabelColor)
}

/// 区块容器：小标题在卡片外，阅读顺序是「标题 → 内容」，
/// 卡片里只放内容，标题不再和内容抢层级。
struct HostSection<Content: View>: View {
    let title: String
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.titleGap) {
            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(HostColor.secondaryText)
                .accessibilityAddTraits(.isHeader)

            HostCard { content }
        }
    }
}

/// 卡片：一个浅表面 + 一条细边框，绝不嵌套半透明层。
struct HostCard<Content: View>: View {
    @ViewBuilder var content: Content

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x3) {
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
                .strokeBorder(HostColor.separator, lineWidth: 1)
        )
    }
}

/// 状态徽标：圆点给颜色，文字用 label 色保证 4.5:1 对比度。
/// 颜色只是辅助线索，文案本身已经把状态说清楚了。
struct HostStatusBadge: View {
    enum Tone {
        case ok
        case warning
        case idle

        var color: Color {
            switch self {
            case .ok: return HostColor.success
            case .warning: return HostColor.warning
            case .idle: return HostColor.tertiaryText
            }
        }
    }

    let text: String
    let tone: Tone

    var body: some View {
        HStack(spacing: HostSpacing.x2) {
            Circle()
                .fill(tone.color)
                .frame(width: 8, height: 8)
            Text(text)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(HostColor.primaryText)
        }
        .padding(.horizontal, HostSpacing.x3)
        .padding(.vertical, HostSpacing.x1 + 1)
        .background(Capsule().fill(HostColor.subtleFill))
        .accessibilityElement(children: .combine)
    }
}

/// 小徽章（PRO 之类）：底色给强调色，文字仍是 label 色，避免小字低对比。
struct HostChip: View {
    let text: String

    var body: some View {
        Text(text)
            .font(.caption2.weight(.bold))
            .foregroundStyle(HostColor.primaryText)
            .padding(.horizontal, HostSpacing.x2)
            .padding(.vertical, 2)
            .background(Capsule().fill(HostColor.accent.opacity(0.18)))
            .accessibilityLabel(text)
    }
}

/// 需要用户注意、但不是错误的说明文字。
struct HostNoticeText: View {
    let text: String
    var tone: Color = HostColor.warning

    var body: some View {
        HStack(alignment: .top, spacing: HostSpacing.x2) {
            Image(systemName: "exclamationmark.circle.fill")
                .foregroundStyle(tone)
                .accessibilityHidden(true)
            Text(text)
                .font(.callout)
                .foregroundStyle(HostColor.primaryText)
                .fixedSize(horizontal: false, vertical: true)
            Spacer(minLength: 0)
        }
        .accessibilityElement(children: .combine)
    }
}

/// 带序号的步骤行。
///
/// 编号圆点只是装饰（accessibilityHidden），真正传达顺序的是
/// 无障碍标签里的 "1." 前缀 —— 屏幕阅读器不会把视觉顺序读出来。
struct HostStepRow: View {
    let index: Int
    let text: String

    private var accessibilityText: String {
        String(index) + ". " + text
    }

    var body: some View {
        HStack(alignment: .center, spacing: HostSpacing.x3) {
            Text(String(index))
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
        .accessibilityLabel(accessibilityText)
    }
}

/// 一条「问题 → 说明」的排查条目。
struct HostQALine: View {
    let question: String
    let answer: String

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x1) {
            Text(question)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(HostColor.primaryText)
                .fixedSize(horizontal: false, vertical: true)
            Text(answer)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}

/// 一条「模式名 → 说明」的并列说明。
struct HostModeLine: View {
    let name: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: HostSpacing.x1) {
            Text(name)
                .font(.headline)
                .foregroundStyle(HostColor.primaryText)
            Text(detail)
                .font(.callout)
                .foregroundStyle(HostColor.secondaryText)
                .fixedSize(horizontal: false, vertical: true)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .accessibilityElement(children: .combine)
    }
}
