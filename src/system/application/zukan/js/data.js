// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：データ ★ 自由に書きかえてよい
//  図鑑を読む・足す・探す、などデータのことだけを書くファイル。
//  画面（HTML）は触らない → 画面のことは view.js、ボタンの動きは main.js
//
//  ・今は足したカードはアプリを閉じると消えます（保存しない）。
//    保存したくなったら、ここの関数の中だけを書きかえる（例：Rust でファイルに書く）
// ═══════════════════════════════════════════════════════════════

/** 図鑑のカード [{ id, name, category, image, text }] */
let entries = [];
/** 分類の一覧 ["どうぶつ", …] */
let categories = [];

/** 画像が無いときに出す絵（パスは main.html から見た場所） */
export const NO_IMAGE = "./images/noimage.svg";

/** data/entries.json を読む */
export async function loadEntries() {
  const res = await fetch("./data/entries.json");
  if (!res.ok) throw new Error("data/entries.json を読めませんでした");
  const data = await res.json();
  entries = data.entries;
  categories = data.categories;
}

export const getCategories = () => categories;
export const findEntry = (id) => entries.find((e) => e.id === id);

/** カードを足す */
export function addEntry({ name, category, text }) {
  const entry = { id: Date.now(), name, category, image: "", text };
  entries = [...entries, entry];
  return entry;
}

/** 名前と分類で探す（word が空・category が "" なら、しぼりこまない） */
export function searchEntries(word, category) {
  const w = word.trim();
  return entries.filter((e) => (!w || e.name.includes(w)) && (!category || e.category === category));
}
