# IT情報収集アプリ（APIキー安全管理・サーバープロキシ構成）

## 安全設計のポイント
- APIキーはブラウザ側（`public/`）に一切置かず、サーバー側の `.env` にのみ記述します。
- `.gitignore` に `.env` を登録し、Gitリポジトリへの誤コミットを防止しています。
- ブラウザからは自前のプロキシAPI（`/api/news`, `/api/ai/summary`）のみを呼び出し、`server.js` がサーバー側でAPIキーを付与して外部APIへ通信します。

## 起動方法
1. `.env` ファイルを開き、`GNEWS_API_KEY=APIキーを入力` をご自身のキーに書き換えてください。
2. ターミナルで `node server.js`（または `npm start`）を実行します（追加パッケージ不要）。
3. ブラウザで `http://localhost:3000` を開きます。

## ファイル構成
- `.env` / `.env.example`: APIキー・ポート設定（`"APIキーを入力"`）
- `.gitignore`: `.env` などの機密・不要ファイルの除外設定
- `server.js`: 静的ファイル配信＆GNews/AI APIプロキシサーバー
- `package.json`: 起動スクリプト定義
- `index.html`: 画面レイアウト（ルート直下）
- `public/css/styles.css`: スタイル定義
- `public/js/config.js`: クライアント用エンドポイント・カテゴリ・辞書定義（APIキーなし）
- `public/js/articles.js`: `/api/news` 経由での記事取得・言語振り分け・フィルタリング
- `public/js/ai_summary.js`: `/api/ai/summary` 経由のAI要約・翻訳
- `public/js/state.js` / `glossary.js` / `ui.js` / `analytics.js` / `main.js`: 各UI・状態・チャート・初期化モジュール
