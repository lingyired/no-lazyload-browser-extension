//
//  HowToUseView.swift
//  ImageLazyLoadBlocker
//
//  三步上手：打开网站 → 点工具栏按钮 → 在 popup 里添加当前网站。
//  第三步的文案直接引用 popup 里的按钮名，用户能对上同一个控件。
//

import SwiftUI

struct HowToUseView: View {
    var body: some View {
        HostSection(title: HostCopy.howToUse) {
            VStack(alignment: .leading, spacing: HostSpacing.x3) {
                HostStepRow(index: 1, text: HostCopy.stepOpenWebsite)
                HostStepRow(index: 2, text: HostCopy.stepOpenExtension)
                HostStepRow(index: 3, text: HostCopy.stepEnableSite)
            }
        }
    }
}
