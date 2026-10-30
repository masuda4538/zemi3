// ═══════════════════════════════════════════════════════════════
//  左のアイコンに出すページの一覧
//  名前・色・アイコンを変えるときは、ここを書きかえます。
//  色は青で統一しています（var(--primary)）。項目ごとに変えたいときは "#0ea5e9" のように書きます。
//  ページを増やすときは、src/system/application に項目のフォルダーを作って入口の main.jsx（画面）と処理（.js）を置き、ここに 1 行足します。
//  （例：src/system/application/programming/main.jsx と programming.js）
//
//  load の行は「押されたときに、その画面のプログラム（application/<項目>/main.jsx）を読み込む」という意味です。
// ═══════════════════════════════════════════════════════════════
export { APP_TITLE } from "./config";

/** 左の上に並ぶページ（上から順に Ctrl + 1, 2, 3 … で開ける） */
export const PAGES = [
  { id: "home",        name: "ホーム",         icon: "home",        color: "var(--primary)", load: () => import("../application/home/main.jsx") },
  { id: "programming", name: "プログラム学習", icon: "programming", color: "var(--primary)", load: () => import("../application/programming/main.jsx") },
  { id: "research",    name: "情報収集",       icon: "research",    color: "var(--primary)", load: () => import("../application/research/main.jsx") },
  { id: "zukan",       name: "デジタル図鑑",   icon: "zukan",       color: "var(--primary)", load: () => import("../application/zukan/main.jsx") },
  { id: "quiz",        name: "問題作成",       icon: "quiz",        color: "var(--primary)", load: () => import("../application/quiz/main.jsx") },
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
