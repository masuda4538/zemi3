// ═══════════════════════════════════════════════════════════════
//  アチーブのページのアチーブ ★ アチーブの担当者だけが書きかえる（ほかのファイルは触らない → コンフリクトしない）
//  ファイル名 ＝ ページの id（main/apps.js）。このフォルダーの .js は自動で読み込まれます（どこにも登録しなくてよい）
//
//  1 行に 1 つ、{ } で書きます
//    id    … 英語の名前（このファイルの中で同じものを使わない）。手に入れるときに使う
//    name  … アチーブの名前（画面に出る）
//    desc  … 説明（どうしたら手に入るか）
//    icon  … 絵（main/components/Icon.jsx にある名前。書かなければトロフィー）
//    goal  … 数をためるアチーブだけ書く（例：goal: 10 → 10 回で手に入る）
//    rarity … レア度（カードの枠の色）。"bronze"（ブロンズ）/ "silver"（シルバー）/ "gold"（ゴールド）。書かなければ bronze
//
//  手に入れ方（src/system/pages/achieve/ などの React で）
//    import { unlockAchievement, addProgress, setProgress } from "../../main/common/achievements.js";
//    ふつうのアチーブ   … unlockAchievement("achieve", "id");
//    数をためるアチーブ … addProgress("achieve", "id"); / setProgress("achieve", "id", 数);（goal に届いたら手に入る）
//    ※ ログインしているときだけ記録されます（ゲストのときは何も起きない）
// ═══════════════════════════════════════════════════════════════

// ↓ first-view は pages/achieve/main.jsx（ページを開いたとき）、collect-5 は main/App.jsx（アチーブが増えたとき）が数えている
export default [
  { id: "first-view", name: "コレクター見習い", desc: "アチーブのページを開いた", icon: "trophy", rarity: "bronze" },
  { id: "collect-5",  name: "コレクター",       desc: "アチーブを 5 こ集めた", icon: "trophy", goal: 5, rarity: "gold" },
];
