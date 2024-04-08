import { window, workspace, ConfigurationTarget, StatusBarAlignment, StatusBarItem, l10n } from 'vscode'
import { updateDecorations } from './decoration'

// supported languages
export const langs = ['css', 'scss', 'sass', 'less', 'postcss', 'stylus', 'html', 'tpl', 'wxss', 'vue', 'vue-html', 'javascriptreact', 'typescriptreact']
// get configurations
export const configs = workspace.getConfiguration('devcalc')
export let config = getConfig()

function getConfig() {
    const configs = workspace.getConfiguration('devcalc')
    const config: any = {}
    for (const key in configs) {
        if (configs.has(key)) {
            config[key] = configs.get(key)
        }
    }
    return config
}

let myConversionType = config.conversionType
export const numericPattern = '(-?[0-9]*\\.?[0-9]+)'
export const devcalcPattern = {
    px: `${numericPattern}px`,
    vw: `${numericPattern}vw`,
    rem: `${numericPattern}rem`,
    rpx: `${numericPattern}rpx`,
    percentage: `${numericPattern}%`,
    dev: `${numericPattern}(${myConversionType})`,
    all: `${numericPattern}(px|${myConversionType})`,
    decoration: `(:0| +0|0 *;|auto|(${numericPattern}(px|${myConversionType})))`
}

// create status bar item
let myStatusBarItemAppearance = config.statusBarItemAppearance
let alignment = config.statusBarItemAlignment
let myStatusBarItemAlignment = alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right
let myStatusBarItemPriority = config.statusBarItemPriority
let myStatusBarItemStyle: string
export let myStatusBarItem: StatusBarItem = window.createStatusBarItem(myStatusBarItemAlignment, myStatusBarItemPriority)

// update configurations
export function updateConfig() {
    const suggest = workspace.getConfiguration('editor.suggest')
    config = getConfig()
    suggest.update('showUnits', config.enableAutocompleteConversion ? false : true, ConfigurationTarget.Global)

    if (myConversionType !== config.conversionType) {
        myConversionType = config.conversionType
        devcalcPattern.dev = `${numericPattern}(${myConversionType})`
        devcalcPattern.all = `${numericPattern}(px|${myConversionType})`
        devcalcPattern.decoration = `(:0| +0|0 *;|auto|(${numericPattern}(px|${myConversionType})))`
    }

    if (config.screenWidth <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Screen width must be greater than zero, {0}px cannot be used', config.screenWidth))
        configs.update('screenWidth', 1920, ConfigurationTarget.Global)
        config.screenWidth = 1920
    }

    if (config.rootElementFontSize <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Root element font size must be greater than zero, {0}px cannot be used', config.rootElementFontSize))
        configs.update('rootElementFontSize', 16, ConfigurationTarget.Global)
        config.rootElementFontSize = 16
    }

    if (config.keepDecimalPlaces < 0) {
        window.showErrorMessage(l10n.t('DevCalc: Reserved decimal places must be greater than or equal to zero, {0} cannot be used', config.keepDecimalPlaces))
        configs.update('keepDecimalPlaces', 6, ConfigurationTarget.Global)
        config.keepDecimalPlaces = 6
    }

    if (config.ignoreSmallerValues < 0) {
        window.showErrorMessage(l10n.t('DevCalc: Ignored value must be greater than or equal to zero, {0} cannot be used', config.ignoreSmallerValues))
        configs.update('ignoreSmallerValues', 1, ConfigurationTarget.Global)
        config.ignoreSmallerValues = 1
    }

    if (!config.lineAnnotationsColor) {
        configs.update('lineAnnotationsColor', '#6272a4', ConfigurationTarget.Global)
        config.lineAnnotationsColor = '#6272a4'
    }

    if (myStatusBarItemAppearance !== config.statusBarItemAppearance) {
        myStatusBarItemAppearance = config.statusBarItemAppearance
    }

    if (alignment !== config.statusBarItemAlignment || myStatusBarItemPriority !== config.statusBarItemPriority) {
        alignment = config.statusBarItemAlignment
        myStatusBarItemAlignment = alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right
        myStatusBarItemPriority = config.statusBarItemPriority
        myStatusBarItem.dispose()
        setStatusBarItem()
    }

    updateStatusBarItem()
}

// setup status bar item
export function setStatusBarItem() {
    myStatusBarItem = window.createStatusBarItem(myStatusBarItemAlignment, myStatusBarItemPriority)
    myStatusBarItem.command = 'devcalc.updateConversionData'
    updateStatusBarItem()
    myStatusBarItem.show()
}

// update status bar item text
function updateStatusBarItem() {
    switch (config.statusBarItemAppearance) {
        case 'text':
            myStatusBarItemStyle = 'DevCalc'
            break
        case 'rocket':
            myStatusBarItemStyle = '$(rocket)'
            break
        case 'zap':
            myStatusBarItemStyle = '$(zap)'
            break
        case 'ruby':
            myStatusBarItemStyle = '$(ruby)'
            break
        case 'heart':
            myStatusBarItemStyle = '$(heart)'
            break
        case 'star':
            myStatusBarItemStyle = '$(star)'
            break
        case 'star-full':
            myStatusBarItemStyle = '$(star-full)'
            break
        case 'desktop':
            myStatusBarItemStyle = '$(device-desktop)'
            break
        case 'mobile':
            myStatusBarItemStyle = '$(device-mobile)'
            break
        case 'settings':
            myStatusBarItemStyle = '$(settings)'
            break
        case 'settings-gear':
            myStatusBarItemStyle = '$(settings-gear)'
            break
    }

    myStatusBarItem.text = `${myStatusBarItemStyle} ${config.conversionType === 'rem' ? config.rootElementFontSize : config.screenWidth}px`
    myStatusBarItem.tooltip = config.conversionType === 'rem' ? l10n.t('DevCalc: Click to update root element font size') : l10n.t('DevCalc: Click to update screen width')
}

// update calculation data
let screenCount = config.commonScreenWidths.indexOf(config.screenWidth)
export async function updateConversionData() {
    if (config.conversionType === 'rem') {
        updateStatusBarItemConfig('rootElementFontSize', await getRootElementFontSize())
    } else {
        const options = config.commonScreenWidths
        const optionsLength = options.length
        if (config.enableCommonScreenWidths && optionsLength > 1) {
            screenCount = (screenCount + 1) % optionsLength
            updateStatusBarItemConfig('screenWidth', options[screenCount])
        } else {
            updateStatusBarItemConfig('screenWidth', await getScreenWidth())
        }
    }
    updateDecorations()
}

async function getUserInput(title: string, configValue: number, defaultValue: string, errorMessage: string) {
    const inputValue = await window.showInputBox({
        title: title,
        value: configValue.toString(),
        placeHolder: l10n.t(`default ${defaultValue}`)
    })
    if (!inputValue) return
    const value = parseInt(inputValue.trim() || defaultValue.toString())
    if (value <= 0) {
        window.showErrorMessage(l10n.t(errorMessage, value))
        return
    }
    return value
}

// get root font size from input box
async function getRootElementFontSize() {
    return await getUserInput('DevCalc: Update root element font size', config.rootElementFontSize, '16', 'DevCalc: Root element font size must be greater than zero, {0}px cannot be used')
}

// get screen width from input box
async function getScreenWidth() {
    return await getUserInput('DevCalc: Update screen width', config.screenWidth, '1920', 'DevCalc: Screen width must be greater than zero, {0}px cannot be used')
}

// update status bar
function updateStatusBarItemConfig(key: string, value?: number) {
    if (!value) return
    myStatusBarItem.text = `${myStatusBarItemStyle} ${value}px`
    configs.update(key, value, ConfigurationTarget.Global)
    config[key] = value
}
