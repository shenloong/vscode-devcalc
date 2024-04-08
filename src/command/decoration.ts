import { window, DecorationRangeBehavior, DecorationOptions, Range } from 'vscode'
import { config, langs, devcalcPattern } from './configuration'
import { dev2px } from './conversion'

export function updateDecorations() {
    if (!config.enableLineAnnotations) return
    const editor = window.activeTextEditor
    if (!editor) return
    const lang = editor.document.languageId
    if (!langs.includes(lang)) return
    const decorations: DecorationOptions[] = []
    if (config.enableLineAnnotationsAlwaysOnDisplay) {
        for (let line = 0; line < editor.document.lineCount; line++) {
            decorations.push(decoration(line))
        }
    } else {
        editor.selections.forEach(selection => {
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                decorations.push(decoration(line))
            }
        })
    }
    editor.setDecorations(decorationType, decorations)
}

const maxLength = 80
function decoration(line: number) {
    return {
        range: new Range(line, maxLength, line, maxLength),
        renderOptions: {
            after: {
                contentText: setAnnotations(line),
                color: config.lineAnnotationsColor
            }
        }
    }
}

const decorationType = window.createTextEditorDecorationType({
    after: { margin: '0 0 0 1.5em' },
    rangeBehavior: DecorationRangeBehavior.ClosedOpen
})

function setAnnotations(line: number) {
    const editor = window.activeTextEditor
    if (!editor) return
    const lineText = editor.document.lineAt(line).text
    // no text in the line or the text is too long will return
    if (lineText.length < 2 || lineText.length > maxLength) return
    // check if there are any dev values in the line
    const devValues = lineText.match(new RegExp(devcalcPattern.dev, 'ig'))
    if (!devValues) return
    // check if there are any px and dev values in the line
    const lineValues = lineText.match(new RegExp(devcalcPattern.decoration, 'ig'))
    if (!lineValues) return
    return lineValues.map(annotation).join(' ')
}

function annotation(value: string) {
    return new RegExp(devcalcPattern.dev, 'ig').test(value) ? dev2px(value).pxText : value.trim().replace(':', '').replace(';', '')
}
