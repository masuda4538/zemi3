// ═══════════════════════════════════════════════════════════════
//  情報収集：データ ★ 自由に書きかえてよい
//  メモを読む・足す・しぼりこむ、などデータのことだけを書くファイル。
//  画面（HTML）は触らない → 画面のことは view.js、ボタンの動きは main.js
//
//  ・今は足したメモはアプリを閉じると消えます（保存しない）。
//    保存したくなったら、ここの関数の中だけを書きかえる（例：Rust でファイルに書く）
// ═══════════════════════════════════════════════════════════════

/** メモの一覧 [{ id, topic, url, site, note, tags: [], date }] */
let memos = [];

/** data/memos.json を読む（パスは main.html から見た場所） */
export async function loadMemos() {
  const res = await fetch("./data/memos.json");
  if (!res.ok) throw new Error("data/memos.json を読めませんでした");
  memos = await res.json();
  return memos;
}

/** メモを足す（新しいものを上に） */
export function addMemo({ topic, url, site, note, tags }) {
  const d = new Date();
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const memo = { id: Date.now(), topic, url, site, note, tags, date };
  memos = [memo, ...memos];
  return memo;
}

/** 「どうぶつ, いろ」のような文字を ["どうぶつ", "いろ"] にする */
export const splitTags = (text) =>
  text.split(/[,、，]/).map((t) => t.trim()).filter((t) => t !== "");

/** 使われているタグの一覧（同じものは 1 つ） */
export const allTags = () => [...new Set(memos.flatMap((m) => m.tags))];

/** ことば・タグでしぼりこむ（word が空・tag が null なら、しぼりこまない） */
export function filterMemos(word, tag) {
  const w = word.trim().toLowerCase();
  return memos.filter((m) => {
    const text = `${m.topic} ${m.note} ${m.site}`.toLowerCase();
    return (!w || text.includes(w)) && (!tag || m.tags.includes(tag));
  });
}
