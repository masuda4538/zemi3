// ═══════════════════════════════════════════════════════════════
//  問題作成：動きの中心 ★ 自由に書きかえてよい
//  main.html の <script type="module" src="./js/main.js"> で読まれています。
//  ボタンを押したら「データ（data.js）を変えて → 表示（view.js）を書きかえる」をここに書きます。
//
//    data.js … データ（問題を読む・足す・消す・答え合わせ）
//    view.js … 表示（HTML を作って画面に出す）
//    main.js … つなぐ係（このファイル）
//
//  ・ファイルを増やしたら import でつなぐ（パスはこのファイルから見た場所）
//  ・1 つのファイルにまとめたくなったら、data.js・view.js の中身をここに貼って import を消せば OK
//  ・アプリの機能は app から使う（何も書かなくても使える）
//      app.notify({ … })  お知らせ   app.unlock("id")  アチーブ   await app.invoke("名前", { … })  Rust
// ═══════════════════════════════════════════════════════════════
import { loadQuestions, getQuestions, addQuestion, removeQuestion, isCorrect, play, resetPlay } from "./data.js";
import { drawTab, drawQuestion, drawFeedback, drawResult, drawNoQuestion, drawQuestionList } from "./view.js";

const $ = (id) => document.getElementById(id);

// ───────── 解く ─────────
/** 今の問題を出す（最後まで解いたら結果を出す） */
function showQuestion() {
  const questions = getQuestions();
  if (!questions.length) { drawNoQuestion(); return; }
  if (play.index >= questions.length) { showResult(); return; }
  drawQuestion(questions[play.index], play.index, questions.length, choose);
}

/** 選択肢を押したとき */
function choose(i) {
  const questions = getQuestions();
  const q = questions[play.index];
  const correct = isCorrect(q, i);
  if (correct) {
    play.score++;
    app.unlock("first-correct");          // アチーブ（achievements/achievements.js の id）
    app.addProgress("ten-correct");       // 数をためるアチーブを 1 つ増やす
  }
  drawFeedback(q, i, correct, play.index === questions.length - 1);
}

/** 結果を出す（ひょうかは Rust に聞く：rust/main.rs の grade → rust/logic.rs） */
async function showResult() {
  const total = getQuestions().length;
  let grade = null;
  try {
    grade = await app.invoke("grade", { score: play.score, total });   // { percent, rank, message } が返ってくる
  } catch {
    grade = null;                         // ブラウザで開いたときなど
  }
  drawResult(play.score, total, grade);
  if (play.score === total) app.unlock("perfect");
}

$("next-button").addEventListener("click", () => { play.index++; showQuestion(); });
$("retry-button").addEventListener("click", () => { resetPlay(); showQuestion(); });

// ───────── タブ ─────────
document.querySelectorAll(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    drawTab(tab.dataset.tab);
    if (tab.dataset.tab === "play") { resetPlay(); showQuestion(); }   // 解くに戻ったら、はじめから
  });
});

// ───────── 作る ─────────
function showList() {
  drawQuestionList(getQuestions(), (id) => { removeQuestion(id); showList(); });
}

const form = $("make-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();                     // ページを読み直さないようにする
  const f = new FormData(form);
  const q = addQuestion({
    text: f.get("text").trim(),
    choices: [0, 1, 2, 3].map((i) => f.get(`choice${i}`).trim()),
    answer: Number(f.get("answer")),
    explain: f.get("explain").trim(),
  });
  form.reset();
  showList();
  app.notify({ type: "success", title: "問題を追加しました", message: q.text });
});

// ───────── はじめに：問題を読む ─────────
try {
  await loadQuestions();
} catch (err) {
  $("play-empty").textContent = err.message;
}
showQuestion();
showList();
