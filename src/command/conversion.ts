import { CompletionItemLabel, TextEditor, Selection, Range } from 'vscode'
import { config } from './configuration'
import { updateDecorations } from './decoration'

// convert px to dev units
export function px2dev(text: string) {
    const pxValue = parseFloat(text)
    const pxText = leadingZeroHandler(`${pxValue}px`)
    const isIgnoredValue = pxValue >= -config.ignoreSmallerValues && pxValue <= config.ignoreSmallerValues
    if (isIgnoredValue) {
        return {
            pxValue,
            pxText,
            devValue: pxValue,
            devText: pxText,
            label: ''
        }
    }
    const calcValue = config.conversionType === 'rem' ? pxValue / config.rootElementFontSize : config.conversionType === 'rpx' ? pxValue * (750 / config.screenWidth) : pxValue / config.screenWidth * 100
    const labelHead = config.conversionType === 'rem' ? config.rootElementFontSize : config.screenWidth
    const devValue = parseFloat(calcValue.toFixed(config.keepDecimalPlaces))
    const devText = leadingZeroHandler(devValue + config.conversionType)
    const label: string | CompletionItemLabel = `${labelHead}: ${pxText} → ${devText}`
    return {
        pxValue,
        pxText,
        devValue,
        devText,
        label
    }
}

// convert dev units to px
export function dev2px(text: string) {
    const devUnit = config.conversionType
    const devValue = parseFloat(text)
    const devText = leadingZeroHandler(devValue + devUnit)
    const calcValue = devUnit === 'rem' ? devValue * config.rootElementFontSize : devUnit === 'rpx' ? devValue / (750 / config.screenWidth) : devValue * config.screenWidth / 100
    const labelHead = devUnit === 'rem' ? config.rootElementFontSize : config.screenWidth
    const pxValue = parseFloat(calcValue.toFixed(config.keepDecimalPlaces))
    const pxValueInt = Math.round(pxValue)
    const pxValueFix = Math.abs(pxValueInt - pxValue) > Math.pow(10, -(config.keepDecimalPlaces - 1)) ? pxValue : pxValueInt
    const pxText = leadingZeroHandler(`${pxValueFix}px`)
    const label: string | CompletionItemLabel = `${labelHead}: ${devText} → ${pxText}`
    return {
        pxValue: pxValueFix,
        pxText,
        devValue,
        devText,
        label
    }
}

function leadingZeroHandler(result: string) {
    if (config.removeLeadingZero) {
        return result.startsWith('0.') ? result.substring(1) : result.startsWith('-0.') ? '-' + result.substring(2) : result
    }
    return result
}

// convert matched values by selected lines
export function devcalc(strRegExp: string, converter: (match: string, value: string, unit?: string) => string, textEditor: TextEditor) {
    const selections = textEditor.selections
    const regExp = new RegExp(strRegExp, 'ig')
    textEditor.edit(builder => {
        selections.forEach(selection => {
            // convert by line
            for (let line = selection.start.line; line <= selection.end.line; line++) {
                // get the first and last selected characters of the line
                const { start, end } = getSelectionCharacters(selection, line, strRegExp, textEditor)
                // get the text of the line
                const text = textEditor.document.lineAt(line).text.slice(start, end)
                // test the value that matches the line
                if (!text.match(regExp)) continue
                // convert matched values
                const results = text.replace(regExp, converter)
                const lineSelection = new Selection(line, start, line, end)
                builder.replace(lineSelection, results)
            }
            return
        })
    }).then(success => {
        // show annotations after conversion
        if (success) updateDecorations()
    })
}

// get selection characters
function getSelectionCharacters(selection: Selection, line: number, strRegExp: string, textEditor: TextEditor) {
    let start = 0
    let end = textEditor.document.lineAt(line).range.end.character
    if (line === selection.start.line) {
        const selectionLine = selection.with({
            end: selection.start
        })
        const range = getSelectionRange(selectionLine, strRegExp, textEditor)
        start = range ? range.start.character : selection.start.character
    }
    if (line === selection.end.line) {
        const selectionLine = selection.with({
            start: selection.end
        })
        const range = getSelectionRange(selectionLine, strRegExp, textEditor)
        end = range ? range.end.character : selection.end.character
    }
    return { start, end }
}

// get selection range
function getSelectionRange(selection: Range, strRegExp: string, textEditor: TextEditor) {
    const line = selection.start.line
    const startCharacter = selection.start.character
    const textLine = textEditor.document.lineAt(line)
    const text = textLine.text
    const regExp = new RegExp(strRegExp, 'ig')
    let result
    while ((result = regExp.exec(text))) {
        const startResult = result.index
        if (config.conversionRange === 'word') { // get range by focused/selected value(s)
            const endResult = startResult + result[0].length
            if (startCharacter >= startResult && startCharacter <= endResult) {
                return new Range(line, startResult, line, endResult)
            }
        } else { // get range by focused/selected line(s)
            const endResult = textLine.range.end.character
            return new Range(line, startResult, line, endResult)
        }
    }
    return
}
