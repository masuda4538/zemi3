// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：表示 ★ 自由に書きかえてよい
//  データを受け取って、HTML を作って画面に出すことだけを書くファイル。
//  ・文字は textContent で入れる（< などの記号があっても、そのまま文字として出るので安全）
// ═══════════════════════════════════════════════════════════════
import { NO_IMAGE } from "./data.js";

const $ = (id) => document.getElementById(id);

/** 要素を作る小さな道具：el("span", "entry-name", "文字") */
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/** 分類の <select> を作る（first：いちばん上に出す選択肢。null なら出さない） */
export function drawCategories(selectId, categories, first) {
  const options = categories.map((c) => new Option(c, c));
  if (first) options.unshift(new Option(first, ""));
  $(selectId).replaceChildren(...options);
}

/** カードの一覧を出す。押されたら onOpen(id) を呼ぶ */
export function drawCards(list, selectedId, onOpen) {
  $("entry-count").textContent = list.length;
  $("empty").hidden = list.length > 0;
  $("cards").replaceChildren(...list.map((entry) => {
    const li = el("li");
    const btn = el("button", `entry${entry.id === selectedId ? " is-active" : ""}`);
    btn.type = "button";
    const img = el("img", "entry-img");
    img.src = entry.image || NO_IMAGE;
    img.alt = "";
    btn.append(img, el("span", "entry-name", entry.name), el("span", "entry-category", entry.category));
    btn.addEventListener("click", () => onOpen(entry.id));
    li.append(btn);
    return li;
  }));
}

/** くわしくを出す（entry が null なら隠す） */
export function drawDetail(entry) {
  $("detail").hidden = !entry;
  if (!entry) return;
  $("detail-img").src = entry.image || NO_IMAGE;
  $("detail-category").textContent = entry.category;
  $("detail-name").textContent = entry.name;
  $("detail-text").textContent = entry.text || "（せつめいはまだありません）";
  $("detail-rarity").textContent = "…";
}

/** レア度を ★ で出す（stars が null なら「—」） */
export function drawRarity(stars) {
  $("detail-rarity").textContent = stars == null ? "—" : "★".repeat(stars) + "☆".repeat(5 - stars);
}
