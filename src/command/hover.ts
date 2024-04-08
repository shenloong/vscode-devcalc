import { TextDocument, Position, Hover, MarkdownString, l10n } from 'vscode'
import { config, numericPattern, devcalcPattern } from './configuration'
import { dev2px } from './conversion'

export const dev2pxHover = {
    provideHover(document: TextDocument, position: Position) {
        const devTextRange = document.getWordRangeAtPosition(position, new RegExp(devcalcPattern.dev, 'ig'))
        if (!devTextRange) return
        const devText = document.getText(devTextRange)
        if (!devText) return
        const devUnit = devText.replace(new RegExp(numericPattern, 'g'), '')
        const results = dev2px(devText)
        let label
        switch (devUnit) {
            case 'rem':
                label = l10n.t('DevCalc: {0} → {1} (Current root element font size {2}px)', devText, results.pxText, config.rootFontSize)
                break
            case '%':
                label = l10n.t('DevCalc: {0} = {1} / {2}px', devText, results.pxText, config.screenWidth)
                break
            default:
                label = l10n.t('DevCalc: {0} → {1} (Current screen width {2}px)', devText, results.pxText, config.screenWidth)
        }
        return new Hover(new MarkdownString(label))
    }
}
