// ═══════════════════════════════════════════════════════════════
//  フレンド（★ 仮のデータ。見た目のイメージ用）
//  フレンドの機能（登録・オンラインかどうか・最後のログイン・アチーブ）は まだ作っていません。
//  使っているところ：フレンドのページ（pages/friends/main.jsx）と、ホームの広場（application/home/js/plaza.js）
//  機能を作るときは、このファイルのかわりに、本当のフレンドの一覧をわたします。
//    name      … 名前
//    userId    … ログイン ID
//    color     … 広場のキャラクター・アイコンの色
//    online    … 今つないでいるか（true ＝ オンライン）
//    lastLogin … 最後にログインした日時（オンラインでないとき）
//    achieve   … アチーブの取得率（%）
// ═══════════════════════════════════════════════════════════════
const ago = (min) => new Date(Date.now() - min * 60 * 1000);   // 今から min 分前

export const FRIENDS_SAMPLE = [
  { name: "たろう", userId: "taro", color: "#3b82f6", online: true, lastLogin: null, achieve: 42 },
  { name: "はなこ", userId: "hanako", color: "#ec4899", online: false, lastLogin: ago(135), achieve: 67 },
  { name: "じろう", userId: "jiro", color: "#22c55e", online: true, lastLogin: null, achieve: 18 },
  { name: "ゆき", userId: "yuki", color: "#a855f7", online: false, lastLogin: ago(60 * 24 * 3 + 40), achieve: 85 },
];

/** 最後のログインを「〇分前」「〇時間前」「〇日前」にする（withDate なら日時も） */
export function lastLoginText(date, withDate = true) {
  if (!date) return "—";
  const min = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  const rel = min < 1 ? "たった今" : min < 60 ? `${min}分前` : min < 60 * 24 ? `${Math.floor(min / 60)}時間前` : `${Math.floor(min / 60 / 24)}日前`;
  if (!withDate) return rel;
  const pad = (n) => String(n).padStart(2, "0");
  return `${rel}（${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}）`;
}
