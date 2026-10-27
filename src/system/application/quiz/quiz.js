// ═══════════════════════════════════════════════════════════════
//  問題作成：動き（普通の JavaScript）
//  画面を開くと、最初に start(root) が呼ばれます。
//    root … この画面のいちばん外側（quiz.html の中身が入っている）
//
//  ★ 書くときのルール
//    ・document.getElementById / document.querySelector ではなく、
//      root.querySelector を使う（ほかの画面の部品を間違えて触らないように）
//      → このファイルでは $("名前") で quiz.html の data-q="名前" を探せるようにしてある
//    ・イベント（クリックなど）は on(要素, "click", 関数) で付ける
//      → ほかの画面へ移るときに、まとめて外してくれる
// ═══════════════════════════════════════════════════════════════

/** 問題の一覧（あとで DB から読むようにする）
 *  text：問題文　choices：選択肢　answer：正解の番号（0 から数える）　explain：解説 */
const QUESTIONS = [
  {
    text: "Python でリストの長さを調べる関数は？",
    choices: ["size()", "len()", "count()", "length()"],
    answer: 1,
    explain: "len(リスト) で要素の数がわかります。",
  },
  {
    text: "HTML で一番大きな見出しのタグは？",
    choices: ["<h6>", "<head>", "<h1>", "<title>"],
    answer: 2,
    explain: "<h1> が一番大きく、<h6> が一番小さい見出しです。",
  },
  {
    text: "1 バイトは何ビット？",
    choices: ["4 ビット", "8 ビット", "16 ビット", "32 ビット"],
    answer: 1,
    explain: "1 バイト ＝ 8 ビットです。",
  },
];

export function start(root) {
  // ───────── 道具 ─────────
  const $ = (name) => root.querySelector(`[data-q="${name}"]`);
  const offs = [];
  const on = (el, type, fn) => { el.addEventListener(type, fn); offs.push(() => el.removeEventListener(type, fn)); };

  // ───────── 状態 ─────────
  let index = 0;   // 今の問題の番号（0 から）
  let score = 0;   // 正解した数

  // ───────── 問題を表示する ─────────
  function showQuestion() {
    const q = QUESTIONS[index];

    $("count").textContent = `${index + 1} / ${QUESTIONS.length}`;
    $("bar").style.width = `${(index / QUESTIONS.length) * 100}%`;
    $("score").textContent = score;
    $("question").textContent = q.text;
    $("result").textContent = "";
    $("result").className = "quiz-result";
    $("next").hidden = true;

    // 選択肢のボタンを作る
    const box = $("choices");
    box.innerHTML = "";
    q.choices.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quiz-choice";
      btn.textContent = text;          // textContent なので <h1> などもそのまま文字で出る
      btn.dataset.index = i;
      box.appendChild(btn);
    });
  }

  // ───────── 選択肢を押したとき ─────────
  function answer(picked) {
    const q = QUESTIONS[index];
    const ok = picked === q.answer;
    if (ok) score++;

    // ボタンに色を付けて、もう押せないようにする
    $("choices").querySelectorAll(".quiz-choice").forEach((btn, i) => {
      btn.disabled = true;
      if (i === q.answer) btn.classList.add("is-correct");
      else if (i === picked) btn.classList.add("is-wrong");
    });

    const result = $("result");
    result.textContent = ok ? `正解！ ${q.explain}` : `不正解… 正解は「${q.choices[q.answer]}」。${q.explain}`;
    result.classList.add(ok ? "is-correct" : "is-wrong");
    $("score").textContent = score;

    const last = index === QUESTIONS.length - 1;
    $("next").textContent = last ? "結果を見る" : "次の問題へ";
    $("next").hidden = false;
    $("next").focus();
  }

  // ───────── 全部終わったとき ─────────
  function showFinish() {
    $("play").hidden = true;
    $("finish").hidden = false;
    $("final").textContent = `${score} / ${QUESTIONS.length}`;
  }

  // ───────── 最初から ─────────
  function restart() {
    index = 0;
    score = 0;
    $("finish").hidden = true;
    $("play").hidden = false;
    showQuestion();
  }

  // ───────── ボタンのイベント ─────────
  // 選択肢のボタンは作り直すので、外側の枠（choices）でまとめて受け取る
  on($("choices"), "click", (e) => {
    const btn = e.target.closest(".quiz-choice");
    if (!btn || btn.disabled) return;
    answer(Number(btn.dataset.index));
  });

  on($("next"), "click", () => {
    if (index < QUESTIONS.length - 1) {
      index++;
      showQuestion();
    } else {
      showFinish();
    }
  });

  on($("retry"), "click", restart);

  // ───────── はじめ ─────────
  showQuestion();

  // ほかの画面へ移るときに呼ばれる（イベントを外す）
  return () => offs.forEach((off) => off());
}
