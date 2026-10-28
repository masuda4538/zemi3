// ═══════════════════════════════════════════════════════════════
//  アチーブ（実績）を手に入れる・調べる（どのアプリからでも使える）
//    import { unlockAchievement } from "../../main/common/achievements.js";
//    unlockAchievement("quiz", "first-correct");   // アプリの id と、アチーブの id
//  アチーブの名前と説明は、各アプリのフォルダーの achievements.js に書きます
//    （例：application/quiz/achievements.js）。一覧の画面は application/achieve/
//  手に入れると、右上に「アチーブを手に入れた！」のお知らせが出ます（main/App.jsx → common/notify.js）。
//
//  ★ 今は保存していません（アプリを閉じると消えます）。ログインしている人ごとに分けて覚えています。
//    あとで保存するときは、この中の got を、ファイルか DB から読み書きするように変えます。
// ═══════════════════════════════════════════════════════════════
import { currentUserId } from "./api.js";

const got = new Map();          // ログイン ID → Map("quiz:first-correct" → 手に入れた日時)
const listeners = new Set();

const mine = () => {
  const id = currentUserId();
  if (!got.has(id)) got.set(id, new Map());
  return got.get(id);
};
const pad = (n) => String(n).padStart(2, "0");
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

/** アチーブを手に入れる（はじめてなら true。もう持っていれば何もしないで false） */
export function unlockAchievement(appId, achId) {
  if (!currentUserId()) return false;      // ログインしていないときは数えない
  const key = `${appId}:${achId}`;
  const list = mine();
  if (list.has(key)) return false;
  list.set(key, now());
  listeners.forEach((fn) => fn({ appId, achId }));
  return true;
}

/** 手に入れたアチーブ { "quiz:first-correct": "2026-10-28 16:10", … } */
export const getUnlocked = () => Object.fromEntries(mine());

/** 手に入れたときに fn({ appId, achId }) を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onAchievementUnlocked(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
