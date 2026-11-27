// ═══════════════════════════════════════════════════════════════
//  フレンド（★ 仮のデータ。見た目のイメージ用）
//  フレンドの機能（登録・オンラインかどうか・最後のログイン・アチーブ）は まだ作っていません。
//  使っているところ：フレンドのページ（pages/friends/main.jsx）と、ホームの広場（application/home/js/main.js・plaza.js）
//  機能を作るときは、このファイルのかわりに、本当のフレンドの一覧をわたします。
//    name      … 名前
//    userId    … ログイン ID
//    color     … 広場のキャラクター・アイコンの色
//    online    … 今つないでいるか（true ＝ オンライン）
//    lastLogin … 最後にログインした日時（オンラインでないとき）
//    achieve   … アチーブの取得率（%）
//    todaySec・weekSec・totalSec … 今日・今週・これまでの勉強時間（秒。ホームの掲示板のランキングに使う。★ 仮の数）
//    lastWeekSec … 先週の勉強時間（秒）　streak … 連続日数（どちらも ★ 仮。ホームの掲示板のランキングに出す）
//    favorite  … はじめから お気に入りにしておくか（★ 仮。お気に入りは favorites.js で、その PC の中に覚えておく）
// ═══════════════════════════════════════════════════════════════
const ago = (min) => new Date(Date.now() - min * 60 * 1000);   // 今から min 分前

export const FRIENDS_SAMPLE = [
  { name: "たろう", userId: "taro", color: "#3b82f6", online: true, lastLogin: null, achieve: 42, todaySec: 70 * 60, weekSec: 5 * 3600 + 20 * 60, totalSec: 86 * 3600 + 15 * 60, lastWeekSec: 6 * 3600, streak: 12, favorite: true },
  { name: "はなこ", userId: "hanako", color: "#ec4899", online: false, lastLogin: ago(135), achieve: 67, todaySec: 40 * 60, weekSec: 7 * 3600 + 45 * 60, totalSec: 120 * 3600 + 30 * 60, lastWeekSec: 8 * 3600 + 30 * 60, streak: 21, favorite: true },
  { name: "じろう", userId: "jiro", color: "#22c55e", online: true, lastLogin: null, achieve: 18, todaySec: 125 * 60, weekSec: 2 * 3600 + 10 * 60, totalSec: 35 * 3600, lastWeekSec: 1 * 3600 + 20 * 60, streak: 3 },
  { name: "ゆき", userId: "yuki", color: "#a855f7", online: false, lastLogin: ago(60 * 24 * 3 + 40), achieve: 85, todaySec: 30 * 60, weekSec: 9 * 3600 + 5 * 60, totalSec: 150 * 3600 + 40 * 60, lastWeekSec: 3 * 3600 + 50 * 60, streak: 9 },
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

/** ランキングの見た目を たしかめるための 仮のメンバー 20 人（★ デザイン確認用。ホームの掲示板のランキングと、看板を押して開く順位のモーダルだけに出す。
 *  広場やフレンドのページには出さない）
 *  使わなくなったら、この配列を からにする（[]）か、ホームの js/main.js の getRows から外す */
export const RANKING_SAMPLE = [   // 20 人
  { userId: "sample-sakura", name: "さくら", color: "#f97316", weekSec: 6 * 3600 + 30 * 60, streak: 14 },
  { userId: "sample-kenta", name: "けんた", color: "#0ea5e9", weekSec: 4 * 3600 + 50 * 60, streak: 6 },
  { userId: "sample-mio", name: "みお", color: "#14b8a6", weekSec: 3 * 3600 + 40 * 60, streak: 8 },
  { userId: "sample-sota", name: "そうた", color: "#6366f1", weekSec: 3 * 3600 + 5 * 60, streak: 4 },
  { userId: "sample-rina", name: "りな", color: "#f43f5e", weekSec: 2 * 3600 + 30 * 60, streak: 2 },
  { userId: "sample-haruto", name: "はると", color: "#84cc16", weekSec: 1 * 3600 + 45 * 60, streak: 5 },
  { userId: "sample-aoi", name: "あおい", color: "#06b6d4", weekSec: 8 * 3600 + 10 * 60, streak: 18 },
  { userId: "sample-yuto", name: "ゆうと", color: "#8b5cf6", weekSec: 5 * 3600 + 55 * 60, streak: 10 },
  { userId: "sample-hinata", name: "ひなた", color: "#f59e0b", weekSec: 5 * 3600 + 5 * 60, streak: 7 },
  { userId: "sample-ren", name: "れん", color: "#10b981", weekSec: 4 * 3600 + 20 * 60, streak: 9 },
  { userId: "sample-mei", name: "めい", color: "#ec4899", weekSec: 4 * 3600, streak: 3 },
  { userId: "sample-sora", name: "そら", color: "#3b82f6", weekSec: 3 * 3600 + 25 * 60, streak: 11 },
  { userId: "sample-kotone", name: "ことね", color: "#d946ef", weekSec: 2 * 3600 + 50 * 60, streak: 1 },
  { userId: "sample-daiki", name: "だいき", color: "#ef4444", weekSec: 2 * 3600 + 15 * 60, streak: 4 },
  { userId: "sample-yuna", name: "ゆな", color: "#22c55e", weekSec: 1 * 3600 + 55 * 60, streak: 6 },
  { userId: "sample-kaito", name: "かいと", color: "#0284c7", weekSec: 1 * 3600 + 20 * 60, streak: 2 },
  { userId: "sample-iroha", name: "いろは", color: "#e879f9", weekSec: 55 * 60, streak: 3 },
  { userId: "sample-sho", name: "しょう", color: "#65a30d", weekSec: 40 * 60, streak: 1 },
  { userId: "sample-mana", name: "まな", color: "#fb7185", weekSec: 25 * 60, streak: 1 },
  { userId: "sample-riku", name: "りく", color: "#475569", weekSec: 10 * 60, streak: 0 },
];
