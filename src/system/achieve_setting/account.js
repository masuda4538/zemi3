// ═══════════════════════════════════════════════════════════════
//  アカウントのアチーブ ★ アカウントの担当者だけが書きかえる（ほかのファイルは触らない → コンフリクトしない）
//  ファイル名 ＝ ページの id（core/page-list.js）。このフォルダーの .js は自動で読み込まれます（どこにも登録しなくてよい）
//
//  1 行に 1 つ、{ } で書きます
//    id    … 英語の名前（このファイルの中で同じものを使わない）。手に入れるときに使う
//    name  … アチーブの名前（画面に出る）
//    desc  … 説明（どうしたら手に入るか）
//    goal  … 数をためるアチーブだけ書く（例：goal: 10 → 10 回で手に入る）
//    rarity … レア度（カードの枠の色）。"bronze"（ブロンズ）/ "silver"（シルバー）/ "gold"（ゴールド）。書かなければ bronze
//  ※ アチーブの絵は、そのアプリのアイコン（core/page-list.js の icon）が自動で使われます（書かなくてよい）
//
//  手に入れ方（src/system/pages/account/ などの React で）
//    import { unlockAchievement, addProgress, setProgress } from "../../core/storage/achievements.js";
//    ふつうのアチーブ   … unlockAchievement("account", "id");
//    数をためるアチーブ … addProgress("account", "id"); / setProgress("account", "id", 数);（goal に届いたら手に入る）
//    ※ ログインしているときだけ記録されます（ゲストのときは何も起きない）
// ═══════════════════════════════════════════════════════════════

// ↓ first-login は core/App.jsx（ログインしたとき）、change-avatar は pages/account/main.jsx（アイコンを変えたとき）が手に入れている
export default [
  { id: "first-login",   name: "はじめまして",   desc: "はじめてログインした", rarity: "bronze" },
  { id: "change-avatar", name: "イメチェン",     desc: "アイコンの画像を変えた", rarity: "bronze" },
];
