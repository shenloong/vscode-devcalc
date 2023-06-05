import { CompletionItem, CompletionItemKind, CompletionItemProvider, TextDocument, Position } from 'vscode';
import { config } from './configuration';
import { px2dev } from './conversion';

export const px2devCompletion: CompletionItemProvider<CompletionItem> = {
    provideCompletionItems(document: TextDocument, position: Position) {
        if (!config.enableAutocompleteConversion) return;
        return new Promise((resolve) => {
            const wordRange = document.getWordRangeAtPosition(position, /([-]?[\d.]+)p(x)?/);
            const results = convert(document.getText(wordRange));
            if (results.length === 0) return resolve([]);
            const result = results.map(item => {
                // const completionItem = new CompletionItem(item.label, CompletionItemKind.Value);
                const completionItem = new CompletionItem(item.label, CompletionItemKind.Event);
                completionItem.insertText = item.devText;
                completionItem.preselect = true;
                return completionItem;
            });
            return resolve(result);
        });
    }
};

interface ConvertResult {
    pxValue: number;
    pxText: string;
    devValue: number;
    devText: string;
    label: string;
}

function convert(text: string) {
    const result: ConvertResult[] = [];
    const match = text.match(/([-]?[\d.]+)p(x)?/);
    if (!match) return result;
    result.push(px2dev(match[1]));
    return result;
}
