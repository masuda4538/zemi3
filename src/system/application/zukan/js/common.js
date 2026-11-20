const $ = s => document.querySelector(s);

const DEFAULT_ITEMS = [
  {w:"IPアドレス",d:["インターネットやイントラネットなどのネットワークに接続されたすべての機器を識別するための番号。"],t:["ネットワーク","応用情報技術者試験","基礎知識"]},
  {w:"サブネットマスク",d:["IPアドレスのネットワーク部とホスト部を区別するための値。"],t:["ネットワーク","基礎知識"]},
  {w:"正規化",d:["データの重複や矛盾を避けるため、表を分割して整理すること。"],t:["データベース","応用情報技術者試験"]},
  {w:"HSRP",d:["ルータの冗長化を行うシスコ独自のプロトコル。"],t:["ネットワーク","プロトコル"]},
  {w:"主キー",d:["表の中で行を一意に識別するための列。"],t:["データベース","基礎知識"]},
  {w:"TCP",d:["信頼性のある通信を実現するトランスポート層のプロトコル。"],t:["ネットワーク","プロトコル"]}
];
const DEFAULT_TAGS = ["ネットワーク","プロトコル","応用情報技術者試験","基礎知識","データベース"];

function loadData() {
  try {
    const savedItems = localStorage.getItem("zukan_items");
    const savedTags = localStorage.getItem("zukan_tags");
    return {
      items: savedItems ? JSON.parse(savedItems) : structuredClone(DEFAULT_ITEMS),
      tags: savedTags ? JSON.parse(savedTags) : [...DEFAULT_TAGS]
    };
  } catch (e) {
    return { items: structuredClone(DEFAULT_ITEMS), tags: [...DEFAULT_TAGS] };
  }
}

function saveData() {
  try {
    localStorage.setItem("zukan_items", JSON.stringify(items));
    localStorage.setItem("zukan_tags", JSON.stringify(tags));
  } catch (e) {}
}

let { items, tags } = loadData();
const cnt = t => items.filter(i => i.t.includes(t)).length;
const esc = s => String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function updateNavCounts() {
  const nHome = $("#n-home");
  const nTags = $("#n-tags");
  if (nHome) nHome.textContent = items.length;
  if (nTags) nTags.textContent = tags.length;
}

/* 確認ダイアログ */
let onYes = null;
function confirmDlg(m, s, fn) {
  $("#dmsg").textContent = m;
  $("#dsub").textContent = s;
  onYes = fn;
  $("#dbg").classList.add("on");
  $("#dno").focus();
}

function initCommon() {
  updateNavCounts();
  if (innerWidth <= 720) $("#nav").classList.add("closed");

  $("#burger").onclick = () => $("#nav").classList.toggle("closed");
  addEventListener("keydown", e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      $("#nav").classList.toggle("closed");
    }
  });

  const savedTheme = localStorage.getItem("zukan_theme");
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  $("#theme").onclick = () => {
    const d = document.documentElement;
    const dark = d.dataset.theme ? d.dataset.theme === "dark" : matchMedia("(prefers-color-scheme:dark)").matches;
    const next = dark ? "light" : "dark";
    d.dataset.theme = next;
    localStorage.setItem("zukan_theme", next);
  };

  if ($("#dno")) $("#dno").onclick = () => $("#dbg").classList.remove("on");
  if ($("#dyes")) $("#dyes").onclick = () => {
    $("#dbg").classList.remove("on");
    onYes && onYes();
  };

  let tm;
  new MutationObserver(() => {
    clearTimeout(tm);
    tm = setTimeout(() => window.lucide && lucide.createIcons(), 0);
  }).observe(document.body, { childList: true, subtree: true });
  if (window.lucide) lucide.createIcons();
}
