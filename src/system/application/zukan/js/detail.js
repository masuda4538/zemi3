import { $, esc, initCommon, updateNavCounts } from "./common.js";

// index.js と同一の初期データ（localStorage未保存時のフォールバック用）
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

const { items, tags } = loadData();

// クエリパラメータ (?w=単語名) から対象単語を取得（未指定時は先頭を表示）
const params = new URLSearchParams(location.search);
const targetWord = params.get("w");
const item = targetWord
    ? items.find(i => i.w === targetWord)
    : items[0];

function renderDetail() {
    updateNavCounts(items.length, tags.length);

    if (!item) {
        $("#detail").style.display = "none";
        $("#notFound").style.display = "block";
        return;
    }

    document.title = `${item.w} - デジタル図鑑アプリ 画面モック`;
    $("#wordTitle").textContent = item.w;

    $("#wordTags").innerHTML = item.t
        .map(t => `<span class="chip">${esc(t)}</span>`)
        .join("");

    $("#descList").innerHTML = item.d
        .map((text, idx) => `
            <div class="desc-item">
                ${item.d.length > 1 ? `<div class="desc-idx">説明 ${idx + 1}</div>` : ""}
                <p class="desc-text">${esc(text)}</p>
            </div>
        `)
        .join("");

    $("#editBtn").onclick = () => {
        location.href = `register.html?w=${encodeURIComponent(item.w)}`;
    };
}

// 共通初期化
initCommon();

// 戻るボタン
$("#back").onclick = () => {
    location.href = "index.html";
};

// 初回表示
renderDetail();