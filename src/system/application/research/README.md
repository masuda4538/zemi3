# IT情報収集アプリ（GNews API版・機能別ファイル構成）

## セットアップ
`js/config.js` の `GNEWS_API_KEY` に取得した GNews API キーを設定してください（初期値は `"APIキーを入力"`）。
AI要約・翻訳で外部LLMを利用する場合は `js/config.js` および `js/ai_summary.js` の `"APIキーを入力"` も設定してください。

## ファイル構成
- `index.html`: 画面レイアウト・UIコンポーネント定義
- `css/styles.css`: カスタムスクロールバー・ガラスモーフィズム等のスタイル
- `js/config.js`: GNews API設定（`GNEWS_API_KEY: "APIキーを入力"`）、カテゴリ定義、用語辞書データ
- `js/state.js`: アプリケーション状態管理、LocalStorage永続化、テーマ・サイドバー切替、トースト通知
- `js/articles.js`: GNews APIからの記事取得（JP=日本語 / Global=英語）、言語判定、フィルタリング
- `js/glossary.js`: インライン用語リンク挿入と辞書モーダル制御
- `js/ai_summary.js`: AI要約・翻訳推論処理（`LLM_API_KEY = "APIキーを入力"`）
- `js/ui.js`: フィード・ヒーローカード・中央モーダル・コンテキストメニュー描画
- `js/analytics.js`: Chart.jsによるトレンド分析チャート描画
- `js/main.js`: キーボードショートカット登録と初期化処理
