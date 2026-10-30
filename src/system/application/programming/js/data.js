// ═══════════════════════════════════════════════════════════════
//  プログラム学習：データ ★ 自由に書きかえてよい
//  レッスンを読む・「できた」を覚える、などデータのことだけを書くファイル。
//  画面（HTML）は触らない → 画面のことは view.js、ボタンの動きは main.js
//
//  ・ここで export を付けたものが、main.js の import { … } from "./data.js" で使える
//  ・今は「できた」はアプリを閉じると消えます（保存しない）。
//    保存したくなったら、ここの関数の中だけを書きかえる（例：Rust でファイルに書く）
// ═══════════════════════════════════════════════════════════════

/** レッスンの一覧（data/lessons.json から読む） */
let lessons = [];

/** 「できた」を押したレッスンの id（Set：同じものは 1 つしか入らない入れ物） */
const done = new Set();

/** data/lessons.json を読む（パスは main.html から見た場所） */
export async function loadLessons() {
  const res = await fetch("./data/lessons.json");
  if (!res.ok) throw new Error("data/lessons.json を読めませんでした");
  lessons = await res.json();
  return lessons;
}

/** すべてのレッスン */
export const getLessons = () => lessons;

/** id でレッスンを探す */
export const findLesson = (id) => lessons.find((l) => l.id === id);

/** 次のレッスン（最後なら最初にもどる） */
export function nextLesson(id) {
  const i = lessons.findIndex((l) => l.id === id);
  return lessons[(i + 1) % lessons.length];
}

/** 「できた」かどうか */
export const isDone = (id) => done.has(id);

/** 「できた」を付ける・外す（付けたら true） */
export function toggleDone(id) {
  if (done.has(id)) { done.delete(id); return false; }
  done.add(id);
  return true;
}

/** できたレッスンの数 */
export const doneCount = () => done.size;
