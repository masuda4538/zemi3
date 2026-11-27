import { $, esc, initCommon, updateNavCounts } from "./common.js";

// ============================================================
// 初期データ
// ============================================================

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


// ============================================================
// データ読み込み
// ============================================================

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


// ============================================================
// 状態
// ============================================================

// 確定済みの絞り込み（モーダルで「適用」した内容）
let flt = { scope: "all", tags: [] };

// モーダルで編集中のタグ（「適用」するまで flt には入らない）
let pend = [];


// ============================================================
// 検索ロジック
// ============================================================

// 検索文字列の解析：先頭が # の語はタグ、それ以外はキーワード
function parseQuery(raw) {
    const words = [];
    const tagQ = [];

    for (const t of raw.trim().split(/\s+/).filter(Boolean)) {
        if (t.startsWith("#") || t.startsWith("＃")) {
            if (t.length > 1) tagQ.push(t.slice(1).toLowerCase());
        } else {
            words.push(t.toLowerCase());
        }
    }

    return { words, tagQ };
}


// ============================================================
// 描画
// ============================================================

// 一覧
function renderGrid(query = $("#q").value) {
    const { words, tagQ } = parseQuery(query);

    const r = items.filter(i => {
        const targets =
            flt.scope === "all" ? [i.w, ...i.d, ...i.t] :
            flt.scope === "word" ? [i.w] :
            flt.scope === "desc" ? i.d : i.t;

        // キーワード：各語がどれかの対象に含まれること（AND・部分一致）
        const m = words.every(w =>
            targets.some(x => x.toLowerCase().includes(w))
        );

        // # で指定したタグ（AND・部分一致）
        const tagHit = tagQ.every(k =>
            i.t.some(t => t.toLowerCase().includes(k))
        );

        // モーダルで適用したタグ（AND・完全一致）
        return m && tagHit && flt.tags.every(t => i.t.includes(t));
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

    $("#grid").querySelectorAll(".card").forEach((card, idx) => {
        card.onclick = () => {
            location.href = `detail.html?w=${encodeURIComponent(r[idx].w)}`;
        };
    });

    $("#empty").style.display = r.length ? "none" : "block";
    $("#pcount").textContent = r.length + " 件";

    updateNavCounts(items.length, tags.length);
    syncControls();
}

// 検索バーの表示状態：✕・フィルターアイコンの印・リセットボタンの有効/無効
function syncControls() {
    const hasText = $("#q").value.trim() !== "";
    const hasFilter = flt.scope !== "all" || flt.tags.length > 0;

    $("#qclear").classList.toggle("on", $("#q").value !== "");
    $("#fbtn").classList.toggle("on", hasFilter);
    $("#rbtn").disabled = !(hasText || hasFilter);
}

// モーダル内：選択中のタグ（チップ）と候補
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


// ============================================================
// モーダルの開閉
// ============================================================

// 開く：現在の絞り込み状態をそのまま表示する
function openModal() {
    pend = [...flt.tags];
    document.querySelector(`[name=scope][value="${flt.scope}"]`).checked = true;
    $("#ftag").value = "";
    drawF();
    $("#fmodal").classList.add("on");
    document.querySelector("[name=scope]:checked").focus();
}

// 閉じる：変更は破棄（確定は「適用」だけ）
function closeModal() {
    $("#fmodal").classList.remove("on");
    $("#fsug").classList.remove("on");
}


// ============================================================
// イベント：検索バー
// ============================================================

$("#sbtn").onclick = () => renderGrid();

$("#q").oninput = syncControls;

$("#q").onkeydown = e => {
    // 日本語入力の変換確定の Enter では検索しない
    if (e.key === "Enter" && !e.isComposing) {
        renderGrid();
    }
};

// ✕：入力だけ消して即再描画
$("#qclear").onclick = () => {
    $("#q").value = "";
    renderGrid();
    $("#q").focus();
};

// 絞り込みをリセット：文字・範囲・タグをすべて初期化
$("#rbtn").onclick = () => {
    flt = { scope: "all", tags: [] };
    $("#q").value = "";
    renderGrid();
};


// ============================================================
// イベント：モーダル
// ============================================================

// --- 開く・閉じる ---

$("#fbtn").onclick = openModal;
$("#fclose").onclick = closeModal;

// 暗い背景そのものをクリックしたときだけ閉じる（中身のクリックでは閉じない）
$("#fmodal").onclick = e => {
    if (e.target === e.currentTarget) closeModal();
};

document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeModal();
});

// --- タグの入力・候補・チップ ---

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

// 候補と入力欄の外をクリックしたら候補を閉じる
document.addEventListener("click", e => {
    if (!e.target.closest("#fsug,#ftag")) {
        $("#fsug").classList.remove("on");
    }
});

// --- クリア・適用 ---

// クリア：モーダル内の入力だけ初期状態へ（反映は「適用」で）
$("#fclr").onclick = () => {
    document.querySelector("[name=scope][value=all]").checked = true;
    pend = [];
    $("#ftag").value = "";
    drawF();
};

$("#fapply").onclick = () => {
    flt.scope = document.querySelector("[name=scope]:checked").value;
    flt.tags = [...pend];
    closeModal();
    renderGrid();
};


// ============================================================
// 初期化
// ============================================================

initCommon();
renderGrid();