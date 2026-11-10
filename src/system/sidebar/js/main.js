// ═══════════════════════════════════════════════════════════════
//  左のサイドバー：動き ★ 書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//  1. ページのボタンを作る（ページの一覧は app.sidebar.state() の top・bottom）
//  2. 押したら app.open(id) でそのページを開く
//  3. 開いているページ・アカウントの画像が変わったら、見た目を書きかえる（app.sidebar.onChange）
//  （ホワイト／ダークの切りかえは、設定の画面にあります）
// ═══════════════════════════════════════════════════════════════
import { icon } from "./icons.js";

const $ = (id) => document.getElementById(id);

// このページだけをブラウザで開いたとき（お試し）は app.sidebar が無いので、見本の状態を使う
const sidebar = app.sidebar ?? {
  state: () => ({
    current: "home", theme: "light", user: { name: "テスト" },
    top: [{ id: "home", name: "ホーム", icon: "home" }],
    bottom: [{ id: "account", name: "アカウント", icon: "account" }],
  }),
  onChange: () => () => {},
  setTheme: (t) => { document.documentElement.dataset.theme = t; },
  hide: () => {},
};

/** id → そのページのボタン */
const buttons = new Map();

/** ページのボタンを 1 つ作る */
function makeButton(page, i) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "side-item";
  btn.title = page.name;
  btn.setAttribute("aria-label", page.name);
  btn.style.setProperty("--i", i);                     // 出てくる順番（css の animation-delay）
  btn.innerHTML = `<span class="side-ico">${icon(page.icon)}</span><span class="side-label"></span>`;
  btn.querySelector(".side-label").textContent = page.name;
  btn.addEventListener("click", () => app.open(page.id));
  buttons.set(page.id, btn);
  return btn;
}

/** アカウントのボタンの絵：画像があれば画像、なければ名前の 1 文字 */
function drawAvatar(user) {
  const ico = buttons.get("account")?.querySelector(".side-ico");
  if (!ico) return;
  if (!user) { ico.innerHTML = icon("account"); return; }
  const avatar = document.createElement("span");
  avatar.className = "avatar";
  if (user.avatar) {
    const img = document.createElement("img");
    img.src = user.avatar;
    img.alt = "";
    img.draggable = false;
    avatar.append(img);
  } else {
    avatar.textContent = [...(user.name ?? "").trim()][0] ?? "?";
  }
  ico.replaceChildren(avatar);
}

/** 状態に合わせて見た目を書きかえる */
function update(state) {
  for (const [id, btn] of buttons) {
    const on = id === state.current;
    btn.classList.toggle("active", on);
    if (on) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }
  drawAvatar(state.user);
}

// ───────── はじめに：ボタンを作る ─────────
const first = sidebar.state();
$("top").replaceChildren(...first.top.map((p, i) => makeButton(p, i)));
$("bottom").replaceChildren(...first.bottom.map((p, i) => makeButton(p, first.top.length + i)));
document.querySelectorAll("[data-icon]").forEach((el) => { el.outerHTML = icon(el.dataset.icon); });
update(first);

// 開いているページなどが変わったら、書きかえる
sidebar.onChange(update);

// ───────── 隠す ─────────
$("hide-button").addEventListener("click", () => sidebar.hide());
