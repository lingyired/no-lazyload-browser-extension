//
//  ModesView.swift
//  ImageLazyLoadBlocker
//
//  两种模式的区别与使用时机。
//
//  命名与扩展保持一致：popup 的复选框叫「兼容模式」，设置页也叫「兼容模式」。
//  历史上 popup 说「自动滚动」、设置页说「兼容模式」，是同一概念的两套叫法 ——
//  这里只用统一后的名字。
//

import SwiftUI

struct ModesView: View {
    var body: some View {
        HostSection(title: HostCopy.modesTitle) {
            VStack(alignment: .leading, spacing: HostSpacing.x4) {
                HostModeLine(name: HostCopy.modeStandardName,
                             detail: HostCopy.modeStandardHelp)
                HostModeLine(name: HostCopy.modeCompatibilityName,
                             detail: HostCopy.modeCompatibilityHelp)
            }
        }
    }
}
