# DevCalc

[English](https://github.com/shenloong/vscode-devcalc/blob/main/README.md) | [中文](https://github.com/shenloong/vscode-devcalc/blob/main/README.zh.md)

Convert between `px` and `vw/rem/rpx/%` in VS Code.

## Features

- **Smart Conversion**: IntelliSense and real-time conversion of `px` values in the input.
- **Unit Calculation**: Freely convert between `px` and `vw/rem/rpx/%`.
- **Conversion Range**: Supports the option to convert only the selected values or all values ​​in the line.
- **Decimal Retention**: Customize the maximum number of decimal places to retain.
- **Precision Control**: Set a small value range `n`, automatically ignoring values where `-n ≤ px ≤ n`.
- **Annotations Assist**: Displays the original `px` value as a line annotation during conversion.
- **Hover Tip**: Shows the conversion formula when the mouse hovers over.
- **Quick Adjustment**: Easily adjust the screen width and root element font size.
- **Preset Management**: Save common screen widths for rapid switch.
- **Column Customization**: Customize the icon and position of the status bar item.

## Usage

- Type `px` to autocomplete the `vw/rem/rpx/%` conversion.
- Press `Alt` + `Z` to convert.
- Press `Alt` + `Q` or click status bar item to update screen width or root element font size.

## Language Modes

The default configuration covers the following language modes. You can add or delete corresponding language identifiers as needed.

| Language       | Identifier        |
| :------------- | :---------------- |
| HTML           | `html`            |
| CSS            | `css`             |
| SCSS           | `scss`            |
| Less           | `less`            |
| Vue            | `vue`             |
| JavaScript JSX | `javascriptreact` |
| TypeScript JSX | `typescriptreact` |
