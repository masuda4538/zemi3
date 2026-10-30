// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：動きの中心 ★ 自由に書きかえてよい
//  main.html の <script type="module" src="./js/main.js"> で読まれています。
//  ボタンを押したら「データ（data.js）を変えて → 表示（view.js）を書きかえる」をここに書きます。
//
//    data.js … データ（図鑑を読む・足す・探す）
//    view.js … 表示（HTML を作って画面に出す）
//    main.js … つなぐ係（このファイル）
//
//  ・ファイルを増やしたら import でつなぐ（パスはこのファイルから見た場所）
//  ・1 つのファイルにまとめたくなったら、data.js・view.js の中身をここに貼って import を消せば OK
//  ・アプリの機能は app から使う（何も書かなくても使える）
//      app.notify({ … })  お知らせ   app.unlock("id")  アチーブ   await app.invoke("名前", { … })  Rust
// ═══════════════════════════════════════════════════════════════
import { loadEntries, getCategories, findEntry, addEntry, searchEntries } from "./data.js";
import { drawCategories, drawCards, drawDetail, drawRarity } from "./view.js";

const $ = (id) => document.getElementById(id);

/** 探す条件と、いま開いているカード */
let word = "";
let category = "";
let selectedId = null;

/** カードの一覧を書きかえる */
function render() {
  drawCards(searchEntries(word, category), selectedId, open);
}

/** カードを開く（くわしくを出して、Rust にレア度を聞く） */
async function open(id) {
  selectedId = id;
  const entry = findEntry(id);
  drawDetail(entry);
  render();
  try {
    const stars = await app.invoke("rarity", { name: entry.name });   // rust/main.rs の rarity → rust/logic.rs
    if (selectedId === id) drawRarity(stars);                          // 待っている間に別のカードを開いていたら出さない
  } catch {
    drawRarity(null);                                                  // ブラウザで開いたときなど
  }
}

// ───────── はじめに：図鑑を読む ─────────
try {
  await loadEntries();
} catch (err) {
  $("empty").textContent = err.message;
}
drawCategories("category-filter", getCategories(), "すべての分類");
drawCategories("category-input", getCategories(), null);
render();

// ───────── 探す ─────────
$("search").addEventListener("input", (e) => { word = e.target.value; render(); });
$("category-filter").addEventListener("change", (e) => { category = e.target.value; render(); });

// ───────── くわしくをとじる ─────────
$("close-detail").addEventListener("click", () => {
  selectedId = null;
  drawDetail(null);
  render();
});

// ───────── 図鑑にのせる ─────────
const form = $("add-form");
$("open-form").addEventListener("click", () => { form.hidden = false; form.querySelector("[name=name]").focus(); });
$("close-form").addEventListener("click", () => { form.hidden = true; form.reset(); });

form.addEventListener("submit", (e) => {
  e.preventDefault();                       // ページを読み直さないようにする
  const f = new FormData(form);
  const entry = addEntry({
    name: f.get("name").trim(),
    category: f.get("category"),
    text: f.get("text").trim(),
  });
  form.reset();
  form.hidden = true;
  word = ""; category = "";
  $("search").value = ""; $("category-filter").value = "";
  open(entry.id);
  app.notify({ type: "success", title: "図鑑にのせました", message: entry.name });
  app.unlock("first-page");                 // アチーブ（achievements/achievements.js の id）
  app.addProgress("collector");             // 数をためるアチーブを 1 つ増やす
});
