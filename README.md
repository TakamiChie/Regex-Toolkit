# Clipboard Regex Processor

Chrome Manifest V3向けの小規模拡張機能です。

## 機能

- ツールバーの拡張機能ボタン、またはショートカットキーから `popup.html` を開く
- クリップボードに `text/html` と `text/plain` が両方存在する場合はHTMLを優先
- 保存済み正規表現をチェックリストで表示
- チェックされた正規表現を登録順に適用
- HTMLをMarkdownに変換してから正規表現を適用するオプション
- popupのチェック状態とHTML→Markdown設定を `chrome.storage.local` に保存
- 設定画面から名前・正規表現・置換文字列・フラグを追加、編集、削除、並べ替え
- popup上で項目にマウスを合わせると正規表現と置換文字列をツールチップ表示

## HTML→Markdown変換

HTML→Markdown変換は拡張機能内の `turndown.js` に実装した簡易コンバーターで行います。見出し、段落、強調、リンク、画像、リスト、引用、コード、表などの一般的なHTMLをMarkdownへ変換します。

## インストール

1. `chrome://extensions/` を開く
2. 「デベロッパーモード」を有効にする
3. 「パッケージ化されていない拡張機能を読み込む」を選択
4. このフォルダを指定する

## ショートカット

初期設定は次の通りです。

- Windows/Linux: `Ctrl+Shift+Y`
- macOS: `Command+Shift+Y`

`chrome://extensions/shortcuts` から変更できます。

## 正規表現の例

### 連続空行を1つにする

- 名前: `連続空行を1つにする`
- 正規表現: `\\n{3,}`
- 置換文字列: `\\n\\n`
- フラグ: `g`

### 行末スペースを削除

- 名前: `行末スペースを削除`
- 正規表現: `[ \\t]+$`
- 置換文字列: 空欄
- フラグ: `gm`

## データ構造

登録した正規表現は `chrome.storage.local` の `regexItems` に次の形式で保存されます。

```json
[
  {
    "id": "UUID",
    "name": "正規表現名",
    "pattern": "正規表現本体",
    "replacement": "置換文字列",
    "flags": "g"
  }
]
```

popupの状態は以下に保存されます。

- `checkedRegexIds`: チェック済み正規表現ID配列
- `htmlToMarkdown`: HTML→Markdown変換の有効/無効
