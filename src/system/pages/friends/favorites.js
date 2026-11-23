// ═══════════════════════════════════════════════════════════════
//  フレンドの「お気に入り」（★ 今は DB がないので、その PC の中に覚えておく）
//  使っているところ：ホームの広場（お気に入りの人は最初の広場、そうでない人は となりの広場）と、
//                    フレンドのページ（一覧・詳細の ☆）
//    loadFavorites(自分の userId)          … お気に入りの userId の Set（まだ何も覚えていなければ、friends-sample.js の favorite: true の人）
//    saveFavorites(自分の userId, Set)     … 覚えておく
//    toggleFavorite(自分の userId, 相手の userId) … 切りかえて、新しい Set を返す
//  localStorage … アプリを閉じても消えないメモ（その PC の中だけ。ほかの PC には伝わらない）
//  ★ DB を使うようになったら、この 3 つの中身を、サーバーに聞く形に書きかえる（使う側は そのまま）
// ═══════════════════════════════════════════════════════════════
import { FRIENDS_SAMPLE } from "./friends-sample.js";

const key = (me) => `zemi:friends:favorite:${me ?? "guest"}`;   // ログインしている人ごとに分けて覚える

export function loadFavorites(me) {
  try {
    const raw = localStorage.getItem(key(me));
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* 読めなければ、はじめの状態 */ }
  return new Set(FRIENDS_SAMPLE.filter((f) => f.favorite).map((f) => f.userId));
}

export function saveFavorites(me, set) {
  try { localStorage.setItem(key(me), JSON.stringify([...set])); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
}

export function toggleFavorite(me, userId) {
  const set = loadFavorites(me);
  if (set.has(userId)) set.delete(userId); else set.add(userId);
  saveFavorites(me, set);
  return set;
}
