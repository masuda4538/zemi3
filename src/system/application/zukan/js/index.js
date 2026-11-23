
import { $, esc, initCommon, updateNavCounts } from "./common.js";

// 初期データ
const DEFAULT_ITEMS = [
    { w: "IPアドレス", d: ["インターネットやイントラネットなどのネットワークに接続されたすべての機器を識別するための番号。"], t: ["ネットワーク", "応用情報技術者試験", "基礎知識"] },
    { w: "サブネットマスク", d: ["IPアドレスのネットワーク部とホスト部を区別するための値。"], t: ["ネットワーク", "基礎知識"] },
    { w: "正規化", d: ["データの重複や矛盾を避けるため、表を分割して整理すること。"], t: ["データベース", "応用情報技術者試験"] },
    { w: "HSRP", d: ["ルータの冗長化を行うシスコ独自のプロトコル。"], t: ["ネットワーク", "プロトコル"] },
    { w: "主キー", d: ["表の中で行を一意に識別するための列。"], t: ["データベース", "基礎知識"] },
    { w: "TCP", d: ["信頼性のある通信を実現するトランスポート層のプロトコル。"], t: ["ネットワーク", "プロトコル"] }
];

const DEFAULT_TAGS = [
    "ネットワーク",
    "プロトコル",
    "応用情報技術者試験",
    "基礎知識",
    "データベース"
];

// データ読み込み
function loadData() {
    try {
        const savedItems = localStorage.getItem("zukan_items");
        const savedTags = localStorage.getItem("zukan_tags");

        return {
            items: savedItems ? JSON.parse(savedItems) : structuredClone(DEFAULT_ITEMS),
            tags: savedTags ? JSON.parse(savedTags) : [...DEFAULT_TAGS]
        };
    } catch (e) {
        return {
            items: structuredClone(DEFAULT_ITEMS),
            tags: [...DEFAULT_TAGS]
        };
    }
}

let { items, tags } = loadData();

// 検索・絞り込み状態
let flt = { scope: "all", tags: [] };
let pend = [];

// 一覧表示
function renderGrid() {
    const q = $("#q").value.trim().toLowerCase();

    const r = items.filter(i => {
        const m = !q || (
            flt.scope === "all" ? [i.w, ...i.d, ...i.t] :
                flt.scope === "word" ? [i.w] :
                    flt.scope === "desc" ? i.d : i.t
        ).some(x => x.toLowerCase().includes(q));

        return m && flt.tags.every(t => i.t.includes(t));
    });

    $("#grid").innerHTML = r.map(i =>
        `<button class="card">
      <h2>${esc(i.w)}</h2>
      <p>${esc(i.d[0])}</p>
      <div class="chips" style="margin:0">
        ${i.t.map(t => `<span class="chip">${esc(t)}</span>`).join("")}
      </div>
    </button>`
    ).join("");

    $("#empty").style.display = r.length ? "none" : "block";
    $("#pcount").textContent = r.length + " 件";

    updateNavCounts(items.length, tags.length);
}

// フィルター表示
function drawF() {
    $("#fchips").innerHTML = pend.map(t =>
        `<span class="chip">${esc(t)}<button data-t="${esc(t)}" aria-label="外す">✕</button></span>`
    ).join("");

    const v = $("#ftag").value.trim();

    $("#fsug").innerHTML = tags
        .filter(t => !pend.includes(t) && t.includes(v))
        .map(t => `<button data-t="${esc(t)}">${esc(t)}</button>`)
        .join("");
}

// 共通初期化
initCommon();

// イベント設定
$("#sbtn").onclick = renderGrid;
$("#q").addEventListener("input", renderGrid);

$("#fbtn").onclick = () => {
    pend = [...flt.tags];
    drawF();
    $("#fmodal").classList.toggle("on");
};

$("#fcancel").onclick = () => {
    $("#fmodal").classList.remove("on");
};

$("#fapply").onclick = () => {
    flt.scope = document.querySelector("[name=scope]:checked").value;
    flt.tags = [...pend];
    $("#fmodal").classList.remove("on");
    renderGrid();
};

$("#ftag").onfocus = () => {
    drawF();
    $("#fsug").classList.add("on");
};

$("#ftag").oninput = drawF;

$("#fsug").onclick = e => {
    const t = e.target.dataset.t;

    if (t) {
        pend.push(t);
        $("#ftag").value = "";
        drawF();
    }
};

$("#fchips").onclick = e => {
    const t = e.target.dataset.t;

    if (t) {
        pend = pend.filter(x => x !== t);
        drawF();
    }
};

document.addEventListener("click", e => {
    if (!e.target.closest("#fsug,#ftag")) {
        $("#fsug").classList.remove("on");
    }
});

// 初回表示
renderGrid();