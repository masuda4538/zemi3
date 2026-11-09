// ═══════════════════════════════════════════════════════════════
//  左のアイコンに出すページの一覧
//  名前・色・アイコンを変えるときは、ここを書きかえます。
//  色は青で統一しています（var(--primary)）。項目ごとに変えたいときは "#0ea5e9" のように書きます。
//
//  load の行は「押されたときに、その画面を読み込む」という意味です。
//    HTML_FOLDER … HTML・CSS・JS で作るページ。id と同じ名前のフォルダーの main.html を、
//                  右側の窓の中に普通の Web ページとして開く（main/components/HtmlFolder.jsx）
//    それ以外   … React で作るページ（アチーブ・設定・アカウント）。application/<id>/main.jsx を読む
//
//  ★ HTML・CSS・JS のページを増やすとき
//    1. src/system/application に、英語の名前でフォルダーを作る（例：memo）
//    2. その中に main.html を置く（CSS・JS は main.html から自分でつなぐ。achievements/achievements.js は必要になったら）
//    3. 下の PAGES に 1 行足す（id をフォルダー名と同じにして、load: HTML_FOLDER）
//    4. Rust を使うときは src-tauri/src/lib.rs にも足す（rust/main.rs を読み込む 2 か所）
// ═══════════════════════════════════════════════════════════════
export { APP_TITLE } from "./config";

/** HTML・CSS・JS で作るページの読み込み（フォルダー名 ＝ id） */
const HTML_FOLDER = () => import("./components/HtmlFolder.jsx");

/** 左の上に並ぶページ（上から順に Ctrl + 1, 2, 3 … で開ける） */
export const PAGES = [
  { id: "home",        name: "ホーム",         icon: "home",        color: "var(--primary)", load: HTML_FOLDER },
  { id: "programming", name: "プログラム学習", icon: "programming", color: "var(--primary)", load: HTML_FOLDER },
  { id: "research",    name: "情報収集",       icon: "research",    color: "var(--primary)", load: HTML_FOLDER },
  { id: "zukan",       name: "デジタル図鑑",   icon: "zukan",       color: "var(--primary)", load: HTML_FOLDER },
  { id: "quiz",        name: "問題作成",       icon: "quiz",        color: "var(--primary)", load: HTML_FOLDER },
];

/** 左の下に並ぶページ（上から アチーブ → 設定 → アカウント。その下にホワイト／ダークの切り替え） */
export const ACHIEVE  = { id: "achieve",  name: "アチーブ",   icon: "trophy",   color: "var(--primary)", load: () => import("../application/achieve/main.jsx") };
export const SETTINGS = { id: "settings", name: "設定",       icon: "settings", color: "var(--primary)", load: () => import("../application/settings/main.jsx") };
export const ACCOUNT  = { id: "account",  name: "アカウント", icon: "account",  color: "var(--primary)", load: () => import("../application/account/main.jsx") };
export const BOTTOM_PAGES = [ACHIEVE, SETTINGS, ACCOUNT];

/** 起動したときに開くページ */
export const START_PAGE = "home";

/** id からページを探す */
export const findPage = (id) => [...PAGES, ...BOTTOM_PAGES].find((p) => p.id === id) ?? PAGES[0];
