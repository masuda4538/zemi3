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

// 編集状態
let editing = -1;
let terr = "";

// タグの使用件数
function cnt(t) {
    return items.filter(it => it.t.includes(t)).length;
}

// タグ一覧表示
function renderTags() {
    $("#tbody").innerHTML = tags.map((t, i) =>
        `<tr>
      <td>
        ${i === editing
            ? `<input type="text" id="tedit" value="${esc(t)}" aria-label="変更後のタグ名">
             ${terr ? `<p class="err">${esc(terr)}</p>` : ""}`
            : esc(t)}
      </td>
      <td>${cnt(t)}</td>
      <td>
        <div class="btns">
          ${i === editing
            ? `<button class="pri" data-ok="${i}"><i data-lucide="check"></i>確定</button>`
            : `<button data-ed="${i}"><i data-lucide="pencil"></i>編集</button>`}
          <button class="out-dng" data-rm="${i}"><i data-lucide="trash-2"></i>削除</button>
        </div>
      </td>
    </tr>`
    ).join("");

    $("#pcount").textContent = tags.length + " 件";

    updateNavCounts(items.length, tags.length);

    if (editing >= 0) $("#tedit").focus();
}

// 共通初期化
initCommon();

// タグ一覧の操作
$("#tbody").addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;

    // 編集開始
    if (b.dataset.ed !== undefined) {
        editing = +b.dataset.ed;
        terr = "";
        renderTags();
    }

    // 編集確定
    if (b.dataset.ok !== undefined) {
        const v = $("#tedit").value.trim();
        const i = +b.dataset.ok;

        terr =
            !v ? "タグ名を入力してください" :
                v.length > 30 ? "タグ名は30文字以内で入力してください。" :
                    tags.some((t, j) => j !== i && t === v)
                        ? "同じ名前のタグが既にあります。"
                        : "";

        if (!terr) {
            items.forEach(it => {
                it.t = it.t.map(t => t === tags[i] ? v : t);
            });

            tags[i] = v;
            editing = -1;
            saveData();
        }

        renderTags();
    }

    // タグ削除
    if (b.dataset.rm !== undefined) {
        const i = +b.dataset.rm;

        confirmDlg(
            `タグ「${tags[i]}」を削除します。`,
            "全ての単語から外されます（単語は残ります）。よろしいですか？",
            () => {
                items.forEach(it => {
                    it.t = it.t.filter(t => t !== tags[i]);
                });

                tags.splice(i, 1);
                editing = -1;
                saveData();
                renderTags();
            }
        );
    }
});

// 初回表示
renderTags();