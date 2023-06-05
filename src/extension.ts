import { ExtensionContext, workspace, commands, languages, window } from 'vscode';
import { updateConfig, myStatusBarItem, setStatusBarItem, langs, devcalcRegExp, updateConversionData } from './command/configuration';
import { px2dev, dev2px, devcalc } from './command/conversion';
import { px2devCompletion } from './command/completion';
import { dev2pxHover } from './command/hover';
import { updateDecorations } from './command/decoration';

export function activate(context: ExtensionContext) {
    // load configurations
    workspace.onDidChangeConfiguration(updateConfig);

    // setup status bar
    setStatusBarItem();

    context.subscriptions.push(
        myStatusBarItem,

        // update calc data
        commands.registerCommand('devcalc.updateConversionData', updateConversionData),

        // convert px to dev unit. todo: keybinding
        commands.registerTextEditorCommand('devcalc.px2dev', textEditor => {
            devcalc(devcalcRegExp.px, (match, value) => px2dev(value).pxText, textEditor);
        }),

        // convert dev unit to px. todo: keybinding
        commands.registerTextEditorCommand('devcalc.dev2px', textEditor => {
            devcalc(devcalcRegExp.vw, (match, value) => dev2px(value).pxText, textEditor);
        }),

        // convert between px and dev unit
        commands.registerTextEditorCommand('devcalc.px2dev2px', textEditor => {
            devcalc(devcalcRegExp.all, (match, value, unit) => unit === 'px' ? px2dev(value).devText : dev2px(value + unit).pxText, textEditor);
        }),

        // type px autocomplete conversion
        languages.registerCompletionItemProvider(langs, px2devCompletion),

        // hover dev unit to px
        languages.registerHoverProvider(langs, dev2pxHover),

        // decoration - line annotations
        window.onDidChangeActiveTextEditor(updateDecorations),
        window.onDidChangeTextEditorSelection(updateDecorations)
    );
}

// this method is called when your extension is deactivated
export function deactivate() { }
