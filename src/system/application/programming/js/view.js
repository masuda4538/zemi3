// ═══════════════════════════════════════════════════════════════
//  プログラム学習：表示 ★ 自由に書きかえてよい
//  データを受け取って、HTML を作って画面に出すことだけを書くファイル。
//  ・ボタンを押したときに何をするかは書かない（main.js から関数を受け取って付けるだけ）
//  ・文字は textContent で入れる（< などの記号があっても、そのまま文字として出るので安全）
// ═══════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

/** 左の一覧を作る。押されたら onSelect(id) を呼ぶ */
export function drawList(lessons, selectedId, isDone, onSelect) {
  const ul = $("lesson-list");
  ul.replaceChildren(...lessons.map((lesson) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "lesson-item";
    btn.classList.toggle("is-active", lesson.id === selectedId);
    btn.classList.toggle("is-done", isDone(lesson.id));

    const mark = document.createElement("span");
    mark.className = "lesson-mark";
    mark.textContent = "✓";
    const name = document.createElement("span");
    name.textContent = `${lesson.level}　${lesson.title}`;

    btn.append(mark, name);
    btn.addEventListener("click", () => onSelect(lesson.id));
    li.append(btn);
    return li;
  }));
}

/** 右のレッスンを出す */
export function drawLesson(lesson, done) {
  $("lesson-level").textContent = lesson.level;
  $("lesson-title").textContent = lesson.title;
  $("lesson-text").textContent = lesson.text;
  $("lesson-code").textContent = lesson.code;
  const btn = $("done-button");
  btn.textContent = done ? "✓ できた（もう一度押すと外す）" : "できた！";
  btn.classList.toggle("is-done", done);
}

/** 上の進み具合（2 / 4 できた） */
export function drawProgress(doneCount, total) {
  $("done-count").textContent = doneCount;
  $("lesson-count").textContent = total;
  $("progress-fill").style.width = total ? `${(doneCount / total) * 100}%` : "0";
}

/** FizzBuzz の結果を出す */
export function drawFizz(list) {
  $("fizz-result").replaceChildren(...list.map((word) => {
    const li = document.createElement("li");
    li.textContent = word;
    li.classList.toggle("is-word", isNaN(Number(word)));   // 数字でないもの（Fizz など）は色を変える
    return li;
  }));
}

/** エラーを出す（message が空なら消す） */
export function drawError(id, message) {
  $(id).textContent = message;
  $(id).hidden = !message;
}
