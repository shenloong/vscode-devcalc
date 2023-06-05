import { window, workspace, ConfigurationTarget, StatusBarAlignment, StatusBarItem, l10n } from 'vscode';
import { updateDecorations } from './decoration';

// supported languages
export const langs = ['css', 'scss', 'sass', 'less', 'postcss', 'stylus', 'html', 'tpl', 'wxss', 'vue', 'vue-html', 'javascriptreact', 'typescriptreact'];
// get configurations
export const configs = workspace.getConfiguration('devcalc');
export let config = getConfig();

function getConfig() {
    const configs = workspace.getConfiguration('devcalc');
    const config: any = {};
    for (const key in configs) {
        if (configs.has(key)) {
            config[key] = configs.get(key);
        }
    }
    return config;
}

export const numericRegExp = '(-?[0-9]*\\.?[0-9]+)';
export const devcalcRegExp = {
    px: `${numericRegExp}px`,
    vw: `${numericRegExp}vw`,
    rem: `${numericRegExp}rem`,
    rpx: `${numericRegExp}rpx`,
    percentage: `${numericRegExp}%`,
    dev: `${numericRegExp}(vw|rem|rpx|%)`,
    all: `${numericRegExp}(px|vw|rem|rpx|%)`,
    decoration: `(:0| +0|0 *;|auto|(${numericRegExp}(px|vw|rem|rpx|%)))`,
};

// create status bar item
let myStatusBarItemAppearance = config.statusBarItemAppearance;
let alignment = config.statusBarItemAlignment;
let myStatusBarItemAlignment = alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right;
let myStatusBarItemPriority = config.statusBarItemPriority;
let myStatusBarItemStyle: string;
export let myStatusBarItem: StatusBarItem = window.createStatusBarItem(myStatusBarItemAlignment, myStatusBarItemPriority);

// update configurations
export function updateConfig() {
    const suggest = workspace.getConfiguration('editor.suggest');
    config = getConfig();

    if (config.screenWidth <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Screen width must be greater than zero, {0}px cannot be used', config.screenWidth));
        configs.update('screenWidth', 1920, ConfigurationTarget.Global);
        config.screenWidth = 1920;
    }
    if (config.rootElementFontSize <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Root element font size must be greater than zero, {0}px cannot be used', config.rootElementFontSize));
        configs.update('rootElementFontSize', 16, ConfigurationTarget.Global);
        config.rootElementFontSize = 16;
    }
    if (config.keepDecimalPlaces < 0) {
        window.showErrorMessage(l10n.t('DevCalc: Reserved decimal places must be greater than or equal to zero, {0} cannot be used', config.keepDecimalPlaces));
        configs.update('keepDecimalPlaces', 6, ConfigurationTarget.Global);
        config.keepDecimalPlaces = 6;
    }
    if (config.ignoreSmallerValues < 0) {
        window.showErrorMessage(l10n.t('DevCalc: Ignored value must be greater than or equal to zero, {0} cannot be used', config.ignoreSmallerValues));
        configs.update('ignoreSmallerValues', 1, ConfigurationTarget.Global);
        config.ignoreSmallerValues = 1;
    }
    if (!config.lineAnnotationsColor) {
        configs.update('lineAnnotationsColor', '#6272a4', ConfigurationTarget.Global);
        config.lineAnnotationsColor = '#6272a4';
    }
    if (config.enableAutocompleteConversion) {
        suggest.update('showUnits', false, ConfigurationTarget.Global);
    } else {
        suggest.update('showUnits', true, ConfigurationTarget.Global);
    }

    if (myStatusBarItemAppearance !== config.statusBarItemAppearance) {
        myStatusBarItemAppearance = config.statusBarItemAppearance;
    }

    updateStatusBarItem();

    if (alignment !== config.statusBarItemAlignment || myStatusBarItemPriority !== config.statusBarItemPriority) {
        alignment = config.statusBarItemAlignment;
        myStatusBarItemAlignment = alignment === 'left' ? StatusBarAlignment.Left : StatusBarAlignment.Right;
        myStatusBarItemPriority = config.statusBarItemPriority;
        myStatusBarItem.dispose();
        setStatusBarItem();
    }
}

// setup status bar item
export function setStatusBarItem() {
    myStatusBarItem = window.createStatusBarItem(myStatusBarItemAlignment, myStatusBarItemPriority);
    myStatusBarItem.command = 'devcalc.updateConversionData';
    updateStatusBarItem();
    myStatusBarItem.show();
}

// update status bar item text
function updateStatusBarItem() {
    switch (config.statusBarItemAppearance) {
        case 'text':
            myStatusBarItemStyle = 'DevCalc';
            break;
        case 'rocket':
            myStatusBarItemStyle = '$(rocket)';
            break;
        case 'zap':
            myStatusBarItemStyle = '$(zap)';
            break;
        case 'ruby':
            myStatusBarItemStyle = '$(ruby)';
            break;
        case 'heart':
            myStatusBarItemStyle = '$(heart)';
            break;
        case 'star':
            myStatusBarItemStyle = '$(star)';
            break;
        case 'star-full':
            myStatusBarItemStyle = '$(star-full)';
            break;
        case 'desktop':
            myStatusBarItemStyle = '$(device-desktop)';
            break;
        case 'mobile':
            myStatusBarItemStyle = '$(device-mobile)';
            break;
        case 'layers':
            myStatusBarItemStyle = '$(layers)';
            break;
        case 'settings':
            myStatusBarItemStyle = '$(settings)';
            break;
        case 'settings-gear':
            myStatusBarItemStyle = '$(settings-gear)';
            break;
    }

    if (config.conversionType === 'rem') {
        myStatusBarItem.text = `${myStatusBarItemStyle} ${config.rootElementFontSize}px`;
        myStatusBarItem.tooltip = l10n.t('DevCalc: Click to update root element font size');
        return;
    }

    myStatusBarItem.text = `${myStatusBarItemStyle} ${config.screenWidth}px`;
    myStatusBarItem.tooltip = l10n.t('DevCalc: Click to update screen width');
}

// update calculation data
export async function updateConversionData() {
    if (config.conversionType === 'rem') {
        const rootElementFontSize = await getRootElementFontSize();
        updateStatusBarItemConfig('rootElementFontSize', rootElementFontSize);
    } else {
        const options = config.commonScreenWidths;
        const optionsLength = options.length;
        if (config.enableCommonScreenWidths && optionsLength > 1) {
            toggleScreenWidth(options);
        } else {
            const screenWidth = await getScreenWidth();
            updateStatusBarItemConfig('screenWidth', screenWidth);
        }
    }
    updateDecorations();
}

// get root font size from input box
async function getRootElementFontSize() {
    let inputValue = await window.showInputBox({
        title: l10n.t('DevCalc: Update root element font size'),
        value: config.rootElementFontSize.toString(),
        placeHolder: l10n.t('default 16'),
        // prompt: l10n.t('Update root element font size: default 16 '),
    });
    // blur to close input box
    if (!inputValue) return;
    const rootElementFontSize = parseFloat(inputValue.trim() || '16');
    if (rootElementFontSize <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Root element font size must be greater than zero, {0}px cannot be used', rootElementFontSize));
        return;
    }
    return rootElementFontSize;
}

// get screen width from input box
async function getScreenWidth() {
    let inputValue = await window.showInputBox({
        title: l10n.t('DevCalc: Update screen width'),
        value: config.screenWidth.toString(),
        placeHolder: l10n.t('default 1920'),
        // prompt: l10n.t('Update screen width: integer, default 1920 '),
    });
    if (!inputValue) return;
    const screenWidth = parseInt(inputValue.trim() || '1920');
    if (screenWidth <= 0) {
        window.showErrorMessage(l10n.t('DevCalc: Screen width must be greater than zero, {0}px cannot be used', screenWidth));
        return;
    }
    return screenWidth;
}

// toggle value from common screen widths
let screenCount = 0;
function toggleScreenWidth(options: number[]) {
    screenCount++;
    for (const option of options) {
        if (screenCount < options.length) {
            if (option === options[screenCount]) {
                updateStatusBarItemConfig('screenWidth', option);
            }
        } else {
            screenCount = 0;
            updateStatusBarItemConfig('screenWidth', option);
        }
    }
}

// update status bar
function updateStatusBarItemConfig(key: string, value?: number) {
    if (!value) return;
    myStatusBarItem.text = `${myStatusBarItemStyle} ${value}px`;
    configs.update(key, value, ConfigurationTarget.Global);
    config[key] = value;
}
