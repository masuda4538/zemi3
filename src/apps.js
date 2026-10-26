// ═══════════════════════════════════════════════════════════════
//  左のアイコンに出すページの一覧
//  名前・色・アイコンを変えるときは、ここを書きかえます。
//  色は青で統一しています（var(--primary)）。項目ごとに変えたいときは "#0ea5e9" のように書きます。
//  ページを増やすときは、src/system に項目のフォルダーを作って画面（.jsx）と処理（.js）を置き、ここに 1 行足します。
//  （例：src/system/programming/Programming.jsx と programming.js）
//
//  load の行は「押されたときに、その画面のプログラムを読み込む」という意味です。
//  読み込んでいる間は、画面がぼやけてからくっきり見えるアニメーションになります。
// ═══════════════════════════════════════════════════════════════
export { APP_TITLE } from "./config";

/** 左の上に並ぶページ（上から順に Ctrl + 1, 2, 3 … で開ける） */
export const PAGES = [
  { id: "home",        name: "ホーム",         icon: "home",        color: "var(--primary)", load: () => import("./system/home/Home.jsx") },
  { id: "programming", name: "プログラム学習", icon: "programming", color: "var(--primary)", load: () => import("./system/programming/Programming.jsx") },
  { id: "research",    name: "情報収集",       icon: "research",    color: "var(--primary)", load: () => import("./system/research/Research.jsx") },
  { id: "zukan",       name: "デジタル図鑑",   icon: "zukan",       color: "var(--primary)", load: () => import("./system/zukan/Zukan.jsx") },
  { id: "quiz",        name: "問題作成",       icon: "quiz",        color: "var(--primary)", load: () => import("./system/quiz/Quiz.jsx") },
];

/** 左の下に並ぶページ（上から 設定 → アカウント。その下にホワイト／ダークの切り替え） */
export const SETTINGS = { id: "settings", name: "設定",       icon: "settings", color: "var(--primary)", load: () => import("./system/settings/Settings.jsx") };
export const ACCOUNT  = { id: "account",  name: "アカウント", icon: "account",  color: "var(--primary)", load: () => import("./system/account/Account.jsx") };
export const BOTTOM_PAGES = [SETTINGS, ACCOUNT];

/** 起動したときに開くページ */
export const START_PAGE = "home";

/** id からページを探す */
export const findPage = (id) => [...PAGES, ...BOTTOM_PAGES].find((p) => p.id === id) ?? PAGES[0];
