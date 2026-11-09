// ═══════════════════════════════════════════════════════════════
//  問題作成：表示 ★ 自由に書きかえてよい
//  データを受け取って、HTML を作って画面に出すことだけを書くファイル。
//  ・文字は textContent で入れる（< などの記号があっても、そのまま文字として出るので安全）
// ═══════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

/** 要素を作る小さな道具：el("button", "choice", "文字") */
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/** タブを切りかえる（"play" か "make"） */
export function drawTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("is-on", t.dataset.tab === name));
  $("tab-play").hidden = name !== "play";
  $("tab-make").hidden = name !== "make";
}

/** 問題を出す。選択肢が押されたら onChoose(番号) を呼ぶ */
export function drawQuestion(question, index, total, onChoose) {
  $("play-empty").hidden = true;
  $("play-result").hidden = true;
  $("play-question").hidden = false;
  $("feedback").hidden = true;
  $("q-number").textContent = `第 ${index + 1} 問 / ${total} 問`;
  $("q-text").textContent = question.text;
  $("choices").replaceChildren(...question.choices.map((choice, i) => {
    const btn = el("button", "choice", `${"ABCD"[i]}．${choice}`);
    btn.type = "button";
    btn.addEventListener("click", () => onChoose(i));
    return btn;
  }));
}

/** 答えたあと：正解・不正解の色と、かいせつを出す */
export function drawFeedback(question, chosen, correct, isLast) {
  [...$("choices").children].forEach((btn, i) => {
    btn.disabled = true;                                        // もう押せないようにする
    btn.classList.toggle("is-correct", i === question.answer);
    btn.classList.toggle("is-wrong", i === chosen && !correct);
  });
  const title = $("feedback-title");
  title.textContent = correct ? "⭕ 正解！" : `❌ ざんねん…（正解は ${"ABCD"[question.answer]}）`;
  title.className = `feedback-title ${correct ? "is-correct" : "is-wrong"}`;
  $("feedback-text").textContent = question.explain || "";
  $("next-button").textContent = isLast ? "結果を見る ›" : "次へ ›";
  $("feedback").hidden = false;
}

/** 結果を出す（grade は Rust から返ってきた { percent, rank, message }。無ければ null） */
export function drawResult(score, total, grade) {
  $("play-question").hidden = true;
  $("play-result").hidden = false;
  $("result-score").textContent = score;
  $("result-total").textContent = total;
  $("result-rank").textContent = grade ? `${grade.rank}（${grade.percent}%）` : "";
  $("result-message").textContent = grade ? grade.message : "（ひょうかは、アプリの中で開くと Rust が出します）";
}

/** 問題が 1 つも無いとき */
export function drawNoQuestion() {
  $("play-question").hidden = true;
  $("play-result").hidden = true;
  $("play-empty").hidden = false;
}

/** 作った問題の一覧。「消す」が押されたら onDelete(id) を呼ぶ */
export function drawQuestionList(questions, onDelete) {
  $("q-count").textContent = questions.length;
  $("q-list").replaceChildren(...questions.map((q) => {
    const li = el("li", "q-item");
    const row = el("div", "q-item-row");
    const del = el("button", "btn btn-ghost delete", "消す");
    del.type = "button";
    del.addEventListener("click", () => onDelete(q.id));
    row.append(el("span", "q-item-text", q.text), del);
    li.append(row, el("p", "q-item-answer", `正解：${q.choices[q.answer]}`));
    return li;
  }));
}
