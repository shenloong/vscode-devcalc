import { CompletionItem, CompletionItemKind, CompletionItemProvider, TextDocument, Position } from 'vscode'
import { config } from './configuration'
import { px2dev } from './conversion'

const pxPattern = /(-?[0-9]*.?[0-9]+)p(x)?/

export class Completion implements CompletionItemProvider {
    provideCompletionItems(document: TextDocument, position: Position) {
        if (!config.enableAutocompleteConversion) return []
        const result = convert(document.getText(document.getWordRangeAtPosition(position, pxPattern)))
        if (!result) return []
        const item = new CompletionItem(result.label, CompletionItemKind.Event)
        // item.kind = CompletionItemKind.Value
        item.insertText = result.devText
        return [item]
    }
}

function convert(text: string) {
    const match = text.match(pxPattern)
    return match ? px2dev(match[1]) : null
}
