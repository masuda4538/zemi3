// ═══════════════════════════════════════════════════════════════
//  左のアイコンに出すページの一覧
//  名前・色・アイコンを変えるときは、ここを書きかえます。
//  ページを増やすときは、src/system に項目のフォルダーを作って画面（.jsx）と処理（.js）を置き、ここに 1 行足します。
//  （例：src/system/programming/Programming.jsx と programming.js）
// ═══════════════════════════════════════════════════════════════
import Home from "./system/home/Home.jsx";
import Programming from "./system/programming/Programming.jsx";
import Research from "./system/research/Research.jsx";
import Zukan from "./system/zukan/Zukan.jsx";
import Quiz from "./system/quiz/Quiz.jsx";
import Settings from "./system/settings/Settings.jsx";

export { APP_TITLE } from "./config";

/** 左の上に並ぶページ（上から順に Ctrl + 1, 2, 3 … で開ける） */
export const PAGES = [
  { id: "home",        name: "ホーム",         icon: "home",        color: "#2563eb", component: Home },
  { id: "programming", name: "プログラム学習", icon: "programming", color: "#2563eb", component: Programming },
  { id: "research",    name: "情報収集",       icon: "research",    color: "#0891b2", component: Research },
  { id: "zukan",       name: "デジタル図鑑",   icon: "zukan",       color: "#16a34a", component: Zukan },
  { id: "quiz",        name: "問題作成",       icon: "quiz",        color: "#ea580c", component: Quiz },
];

/** 左の下にある設定（Ctrl + , で開ける） */
export const SETTINGS = { id: "settings", name: "設定", icon: "settings", color: "#64748b", component: Settings };

/** id からページを探す */
export const findPage = (id) => [...PAGES, SETTINGS].find((p) => p.id === id) ?? PAGES[0];
