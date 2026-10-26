// ═══════════════════════════════════════════════════════════════
//  左のアイコンに出すページの一覧
//  名前・色・アイコンを変えるときは、ここを書きかえます。
//  ページを増やすときは、src/system に項目のフォルダーを作って画面（.jsx）と処理（.js）を置き、ここに 1 行足します。
//  （例：src/system/programming/Programming.jsx と programming.js）
//
//  load の行は「押されたときに、その画面のプログラムを読み込む」という意味です。
//  読み込んでいる間は、画面がぼやけてからくっきり見えるアニメーションになります。
// ═══════════════════════════════════════════════════════════════
export { APP_TITLE } from "./config";

/** 左の上に並ぶページ（上から順に Ctrl + 1, 2, 3 … で開ける） */
export const PAGES = [
  { id: "home",        name: "ホーム",         icon: "home",        color: "#2563eb", load: () => import("./system/home/Home.jsx") },
  { id: "programming", name: "プログラム学習", icon: "programming", color: "#2563eb", load: () => import("./system/programming/Programming.jsx") },
  { id: "research",    name: "情報収集",       icon: "research",    color: "#0891b2", load: () => import("./system/research/Research.jsx") },
  { id: "zukan",       name: "デジタル図鑑",   icon: "zukan",       color: "#16a34a", load: () => import("./system/zukan/Zukan.jsx") },
  { id: "quiz",        name: "問題作成",       icon: "quiz",        color: "#ea580c", load: () => import("./system/quiz/Quiz.jsx") },
];

/** 左の下に並ぶページ（上から 設定 → アカウント。その下にホワイト／ダークの切り替え） */
export const SETTINGS = { id: "settings", name: "設定",       icon: "settings", color: "#64748b", load: () => import("./system/settings/Settings.jsx") };
export const ACCOUNT  = { id: "account",  name: "アカウント", icon: "account",  color: "#7c3aed", load: () => import("./system/account/Account.jsx") };
export const BOTTOM_PAGES = [SETTINGS, ACCOUNT];

/** 起動したときに開くページ */
export const START_PAGE = "home";

/** id からページを探す */
export const findPage = (id) => [...PAGES, ...BOTTOM_PAGES].find((p) => p.id === id) ?? PAGES[0];
