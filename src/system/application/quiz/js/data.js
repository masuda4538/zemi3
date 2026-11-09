// ═══════════════════════════════════════════════════════════════
//  問題作成：データ ★ 自由に書きかえてよい
//  問題を読む・足す・消す・答え合わせ、などデータのことだけを書くファイル。
//  画面（HTML）は触らない → 画面のことは view.js、ボタンの動きは main.js
//
//  ・今は作った問題はアプリを閉じると消えます（保存しない）。
//    保存したくなったら、ここの関数の中だけを書きかえる（例：Rust でファイルに書く）
// ═══════════════════════════════════════════════════════════════

/** 問題の一覧 [{ id, text, choices: [4 つ], answer: 正解の番号（0〜3）, explain }] */
let questions = [];

/** data/questions.json を読む（パスは main.html から見た場所） */
export async function loadQuestions() {
  const res = await fetch("./data/questions.json");
  if (!res.ok) throw new Error("data/questions.json を読めませんでした");
  questions = await res.json();
}

export const getQuestions = () => questions;

/** 問題を足す */
export function addQuestion({ text, choices, answer, explain }) {
  const q = { id: Date.now(), text, choices, answer, explain };
  questions = [...questions, q];
  return q;
}

/** 問題を消す */
export function removeQuestion(id) {
  questions = questions.filter((q) => q.id !== id);
}

/** 答え合わせ（正解なら true） */
export const isCorrect = (question, choiceIndex) => question.answer === choiceIndex;

// ───────── 解いている途中の状態 ─────────
/** 今が何問目か（0 から数える）と、正解した数 */
export const play = { index: 0, score: 0 };

/** はじめから解き直す */
export function resetPlay() {
  play.index = 0;
  play.score = 0;
}
