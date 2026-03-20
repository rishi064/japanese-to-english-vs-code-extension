import * as vscode from "vscode";
import * as https from "https";

function translateText(text: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(text);
    const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=ja|en`;

    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (
              json.responseStatus === 200 &&
              json.responseData?.translatedText
            ) {
              resolve(json.responseData.translatedText);
            } else {
              reject(new Error(json.responseDetails || "Translation failed"));
            }
          } catch {
            reject(new Error("Failed to parse translation response"));
          }
        });
      })
      .on("error", (err) => reject(err));
  });
}

export function activate(context: vscode.ExtensionContext) {
  const translationCache = new Map<string, string>();

  const command = vscode.commands.registerCommand(
    "japanese-to-english.translate",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection).trim();

      if (!text) {
        vscode.window.showWarningMessage("No text selected.");
        return;
      }

      // Capture the range before selection changes
      const range = new vscode.Range(selection.start, selection.end);

      try {
        let translated: string;
        if (translationCache.has(text)) {
          translated = translationCache.get(text)!;
        } else {
          translated = await vscode.window.withProgress(
            {
              location: vscode.ProgressLocation.Notification,
              title: "Translating...",
              cancellable: false,
            },
            () => translateText(text),
          );
          translationCache.set(text, translated);
        }

        // Show popup next to the text
        showTranslationPopup(editor, range, text, translated);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        vscode.window.showErrorMessage(`Translation failed: ${message}`);
      }
    },
  );

  context.subscriptions.push(command);
}

async function showTranslationPopup(
  editor: vscode.TextEditor,
  range: vscode.Range,
  original: string,
  translated: string,
) {
  // Register a temporary hover provider that shows the translation
  const provider = vscode.languages.registerHoverProvider("*", {
    provideHover(document, position) {
      if (document !== editor.document || !range.contains(position)) {
        return null;
      }

      const content = new vscode.MarkdownString();
      content.appendMarkdown(`**Japanese**\n\n${original}\n\n---\n\n`);
      content.appendMarkdown(`**English**\n\n${translated}`);
      content.isTrusted = true;

      return new vscode.Hover(content, range);
    },
  });

  // Move cursor into the range so the hover appears at the right spot
  editor.selection = new vscode.Selection(range.start, range.start);

  // Trigger the hover popup programmatically
  await vscode.commands.executeCommand("editor.action.showHover");

  // Remove the hover provider when user clicks away (selection changes)
  const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
    provider.dispose();
    disposable.dispose();
  });
}

export function deactivate() {}
