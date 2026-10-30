// ═══════════════════════════════════════════════════════════════
//  情報収集：動きの中心 ★ 自由に書きかえてよい
//  main.html の <script type="module" src="./js/main.js"> で読まれています。
//  ボタンを押したら「データ（data.js）を変えて → 表示（view.js）を書きかえる」をここに書きます。
//
//    data.js … データ（メモを読む・足す・しぼりこむ）
//    view.js … 表示（HTML を作って画面に出す）
//    main.js … つなぐ係（このファイル）
//
//  ・ファイルを増やしたら import でつなぐ（パスはこのファイルから見た場所）
//  ・1 つのファイルにまとめたくなったら、data.js・view.js の中身をここに貼って import を消せば OK
//  ・アプリの機能は app から使う（何も書かなくても使える）
//      app.notify({ … })  お知らせ   app.unlock("id")  アチーブ   await app.invoke("名前", { … })  Rust
// ═══════════════════════════════════════════════════════════════
import { loadMemos, addMemo, splitTags, allTags, filterMemos } from "./data.js";
import { drawMemos, drawTags, drawFormError } from "./view.js";

const $ = (id) => document.getElementById(id);

/** しぼりこみの条件 */
let word = "";
let tag = null;

/** 画面をまとめて書きかえる（データや条件が変わったら、これを呼ぶ） */
function render() {
  drawTags(allTags(), tag, (t) => { tag = t; render(); });
  drawMemos(filterMemos(word, tag));
}

// ───────── はじめに：メモを読む ─────────
try {
  await loadMemos();
} catch (err) {
  drawFormError(err.message);
}
render();

// ───────── ことばで探す（1 文字打つたびに） ─────────
$("search").addEventListener("input", (e) => {
  word = e.target.value;
  render();
});

// ───────── メモを追加 ─────────
const form = $("memo-form");
form.addEventListener("submit", async (e) => {
  e.preventDefault();                       // ページを読み直さないようにする（form のふつうの動きを止める）
  drawFormError("");
  const f = new FormData(form);             // name="topic" などの入力をまとめて受け取る
  const url = f.get("url").trim();

  // URL があれば、Rust でチェックしてサイト名を取り出す（rust/main.rs の site_of → rust/logic.rs）
  let site = "";
  if (url) {
    try {
      site = await app.invoke("site_of", { url });
    } catch (err) {
      drawFormError(String(err?.message ?? err));   // 「http:// か https:// で始めてください」など
      return;
    }
  }

  const memo = addMemo({
    topic: f.get("topic").trim(),
    url,
    site,
    note: f.get("note").trim(),
    tags: splitTags(f.get("tags")),
  });
  form.reset();
  render();
  app.notify({ type: "success", title: "メモを追加しました", message: memo.topic });
  app.unlock("first-search");               // アチーブ（achievements/achievements.js の id）
});
