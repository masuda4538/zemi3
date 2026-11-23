import {
    $,
    esc,
    initCommon,
    confirmDlg,
    updateNavCounts
} from "./common.js";

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

// データ保存
function saveData() {
    try {
        localStorage.setItem("zukan_items", JSON.stringify(items));
        localStorage.setItem("zukan_tags", JSON.stringify(tags));
    } catch (e) { }
}

let { items, tags } = loadData();

// ナビゲーション件数更新
updateNavCounts(items.length, tags.length);

// 説明文・タグ
let ex = [""];
let ft = [];

// 説明文表示
function drawE() {
    $("#expls").innerHTML = ex.map((v, i) =>
        `<div class="expl">
      <label>説明${i + 1}</label>
      <textarea data-i="${i}" placeholder="説明を入力（編集の場合は既に入っている）">${esc(v)}</textarea>
      ${i ? `<button class="dng" data-del="${i}" style="margin-top:6px;padding:2px 10px;font-size:13px">この説明を削除</button>` : ""}
    </div>`
    ).join("");
}

// タグ表示
function drawT() {
    $("#tchips").innerHTML = ft.map(t =>
        `<span class="chip">${esc(t)}<button data-t="${esc(t)}" aria-label="外す">✕</button></span>`
    ).join("");

    const v = $("#tagin").value.trim();

    $("#tsug").innerHTML = tags
        .filter(t => !ft.includes(t) && t.includes(v))
        .map(t => `<button data-t="${esc(t)}">${esc(t)}</button>`)
        .join("") || `<span class="note">「${esc(v)}」は新しいタグとして追加されます</span>`;
}

// タグ追加
function addTag(t) {
    t = t.trim();

    if (t && !ft.includes(t)) ft.push(t);

    $("#tagin").value = "";
    drawT();
}

// 共通初期化
initCommon();

// 説明文の入力
$("#expls").addEventListener("input", e => {
    if (e.target.dataset.i) {
        ex[e.target.dataset.i] = e.target.value;
    }
});

// 説明文の削除
$("#expls").addEventListener("click", e => {
    if (e.target.dataset.del) {
        ex.splice(e.target.dataset.del, 1);
        drawE();
    }
});

// 説明文の追加
$("#addExpl").onclick = () => {
    ex.push("");
    drawE();
};

// タグ入力欄
$("#tagin").onfocus = () => {
    drawT();
    $("#tsug").classList.add("on");
};

$("#tagin").oninput = drawT;

$("#tagin").onkeydown = e => {
    if (e.key === "Enter") {
        e.preventDefault();
        addTag($("#tagin").value);
    }
};

// タグ追加ボタン
$("#tadd").onclick = () => addTag($("#tagin").value);

// タグ候補の選択
$("#tsug").onclick = e => {
    if (e.target.dataset.t) {
        addTag(e.target.dataset.t);
    }
};

// 選択済みタグの解除
$("#tchips").onclick = e => {
    const t = e.target.dataset.t;

    if (t) {
        ft = ft.filter(x => x !== t);
        drawT();
    }
};

// タグ候補を閉じる
document.addEventListener("click", e => {
    if (!e.target.closest("#tsug,#tagin")) {
        $("#tsug").classList.remove("on");
    }
});

// 保存
$("#save").onclick = () => {
    const w = $("#word").value.trim();
    const d = ex.map(x => x.trim()).filter(Boolean);

    $("#werr").textContent =
        !w ? "単語名を入力してください。" :
            w.length > 50 ? "単語名は50文字以内で入力してください。" : "";

    $("#eerr").textContent =
        d.length ? "" : "説明を1つ以上入力してください。";

    if ($("#werr").textContent || $("#eerr").textContent) return;

    ft.forEach(t => {
        if (!tags.includes(t)) tags.push(t);
    });

    items.unshift({ w, d, t: [...ft] });

    saveData();

    location.href = "index.html";
};

// キャンセル
$("#cancel").onclick = () => {
    location.href = "index.html";
};

// 単語削除
$("#delWord").onclick = () => {
    confirmDlg(
        `「${$("#word").value || "単語名"}」を削除します。`,
        "説明も一緒に削除されます。よろしいですか？",
        () => location.href = "index.html"
    );
};

// 初期表示
drawE();
drawT();