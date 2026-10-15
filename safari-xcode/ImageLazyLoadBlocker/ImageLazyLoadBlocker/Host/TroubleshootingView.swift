//
//  TroubleshootingView.swift
//  ImageLazyLoadBlocker
//
//  三条最常见的困惑。顺序按用户实际会遇到的概率排：
//  图片没加载 → 找不到按钮 → 想关掉某个网站。
//
//  ⚠️ 这里只能给静态引导：内购移除后 App 与扩展之间没有运行期通道，
//  App 读不到站点配置，做不了「自动诊断」。所以文案是自查顺序，不是承诺。
//

import SwiftUI

struct TroubleshootingView: View {
    var body: some View {
        HostSection(title: HostCopy.troubleshootingTitle) {
            VStack(alignment: .leading, spacing: HostSpacing.x4) {
                HostQALine(question: HostCopy.troubleshoot1Title,
                           answer: HostCopy.troubleshoot1Body)
                HostQALine(question: HostCopy.troubleshoot2Title,
                           answer: HostCopy.troubleshoot2Body)
                HostQALine(question: HostCopy.troubleshoot3Title,
                           answer: HostCopy.troubleshoot3Body)
            }
        }
    }
}
