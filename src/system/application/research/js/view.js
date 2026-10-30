// ═══════════════════════════════════════════════════════════════
//  情報収集：表示 ★ 自由に書きかえてよい
//  データを受け取って、HTML を作って画面に出すことだけを書くファイル。
//  ・文字は textContent で入れる（< などの記号があっても、そのまま文字として出るので安全）
// ═══════════════════════════════════════════════════════════════

const $ = (id) => document.getElementById(id);

/** 要素を作る小さな道具：el("p", "memo-note", "文字") */
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/** メモの一覧を出す */
export function drawMemos(list) {
  $("memo-count").textContent = list.length;
  $("empty").hidden = list.length > 0;
  $("memos").replaceChildren(...list.map((m) => {
    const li = el("li", "memo");

    const top = el("div", "memo-top");
    top.append(el("strong", "memo-topic", m.topic), el("time", "memo-date", m.date));
    li.append(top);

    if (m.note) li.append(el("p", "memo-note", m.note));
    if (m.url) {
      const a = el("a", "memo-site", `🔗 ${m.site || m.url}`);
      a.href = m.url;
      // 押したら、PC のブラウザで開く（アプリの中では開かない）
      a.addEventListener("click", (e) => { e.preventDefault(); app.openUrl(m.url); });
      li.append(a);
    }
    if (m.tags.length) {
      const tags = el("div", "memo-tags");
      tags.append(...m.tags.map((t) => el("span", "", `#${t}`)));
      li.append(tags);
    }
    return li;
  }));
}

/** タグのボタンを出す。押されたら onPick(tag) を呼ぶ（もう一度押すと外す → null） */
export function drawTags(tags, current, onPick) {
  $("tag-filter").replaceChildren(...tags.map((t) => {
    const btn = el("button", `tag${t === current ? " is-on" : ""}`, `#${t}`);
    btn.type = "button";
    btn.addEventListener("click", () => onPick(t === current ? null : t));
    return btn;
  }));
}

/** フォームのエラーを出す（message が空なら消す） */
export function drawFormError(message) {
  $("form-error").textContent = message;
  $("form-error").hidden = !message;
}
