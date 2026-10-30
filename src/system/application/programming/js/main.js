// ═══════════════════════════════════════════════════════════════
//  プログラム学習：動きの中心 ★ 自由に書きかえてよい
//  main.html の <script type="module" src="./js/main.js"> で読まれています。
//  ボタンを押したら「データ（data.js）を変えて → 表示（view.js）を書きかえる」をここに書きます。
//
//    data.js … データ（レッスンを読む・できたを覚える）
//    view.js … 表示（HTML を作って画面に出す）
//    main.js … つなぐ係（このファイル）
//
//  ・ファイルを増やしたら import でつなぐ（パスはこのファイルから見た場所。例：import { … } from "./quiz.js";）
//  ・1 つのファイルにまとめたくなったら、data.js・view.js の中身をここに貼って import を消せば OK
//  ・アプリの機能は app から使う（何も書かなくても使える）
//      app.notify({ … })  お知らせ   app.unlock("id")  アチーブ   await app.invoke("名前", { … })  Rust
// ═══════════════════════════════════════════════════════════════
import { loadLessons, getLessons, findLesson, nextLesson, isDone, toggleDone, doneCount } from "./data.js";
import { drawList, drawLesson, drawProgress, drawFizz, drawError } from "./view.js";

const $ = (id) => document.getElementById(id);

/** いま選んでいるレッスンの id */
let selectedId = null;

/** 画面をまとめて書きかえる（データが変わったら、これを呼ぶ） */
function render() {
  const lessons = getLessons();
  drawList(lessons, selectedId, isDone, select);
  drawLesson(findLesson(selectedId), isDone(selectedId));
  drawProgress(doneCount(), lessons.length);
}

/** レッスンを選ぶ */
function select(id) {
  selectedId = id;
  render();
}

// ───────── はじめに：レッスンを読んで、最初のレッスンを出す ─────────
try {
  const lessons = await loadLessons();
  select(lessons[0].id);
} catch (err) {
  $("lesson-title").textContent = err.message;
}

// ───────── 「できた！」 ─────────
$("done-button").addEventListener("click", () => {
  if (!selectedId) return;
  const nowDone = toggleDone(selectedId);
  render();
  if (nowDone) {
    app.notify({ type: "success", title: "できた！", message: `${findLesson(selectedId).title} をクリアしました。` });
    app.unlock("hello-world");                         // アチーブ（achievements/achievements.js の id）
  }
  if (doneCount() === getLessons().length) {
    app.notify({ type: "success", title: "全部できました！", message: "すべてのレッスンをクリアしました。" });
  }
});

// ───────── 次のレッスン ─────────
$("next-button").addEventListener("click", () => {
  if (selectedId) select(nextLesson(selectedId).id);
});

// ───────── Rust で FizzBuzz（rust/main.rs の fizzbuzz → rust/logic.rs） ─────────
$("fizz-button").addEventListener("click", async () => {
  drawError("fizz-error", "");
  try {
    const n = Number($("fizz-n").value);
    const list = await app.invoke("fizzbuzz", { n });   // Rust から ["1", "2", "Fizz", …] が返ってくる
    drawFizz(list);
  } catch (err) {
    drawFizz([]);
    drawError("fizz-error", String(err?.message ?? err));   // Rust の Err の文がここに来る
  }
});
