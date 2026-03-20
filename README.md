# Japanese to English Translator

A VS Code extension that translates selected Japanese text to English using a popup tooltip.

## Usage

1. Select any Japanese text in the editor
2. Right-click → **Translate Japanese to English**, or open Command Palette (`Ctrl+Shift+P`) and search for it
3. A popup appears next to the text showing the original Japanese and the English translation
4. Click anywhere to dismiss the popup

## Features

- Translates Japanese → English using the free [MyMemory API](https://mymemory.translated.net/)
- Works in any file type
- Results are cached in memory for faster repeated lookups
- No API key required

## Install from source

```bash
npm install
npm run compile
npx @vscode/vsce package --allow-missing-repository
code --install-extension japanese-to-english-0.0.1.vsix --force
```

## License

MIT
