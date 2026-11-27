// ═══════════════════════════════════════════════════════════════
//  ホーム：掲示板のランキング（お気に入りの広場の奥のコルクボード。今週の勉強時間。
//          ★ フレンドの時間・連続日数と、仮のメンバー（RANKING_SAMPLE）は 今は仮のデータ）
//  掲示板の絵（木のわく ＋ コルクボード ＋ 足）は object/board。ここは、そのコルクボードの上に入れる中身
//  使い方（js/main.js）
//    const ranking = mountRanking({ board: 掲示板を入れる場所, getRows: () => [人], format: (秒) => "1時間20分", guestNote: () => "" });
//    ranking.draw()   … 中身を書き直す（勉強時間・お気に入り・ログインしている人が変わったとき）
//    人 … { userId, name, color, sec（今週の勉強時間・秒）, streak（連続日数）, me（自分なら true） }
//  コルクボードの上に出すもの（押して開く画面は なし。ぜんぶ掲示板の中）
//    ・いちばん上の まん中に「今週の勉強時間」の小さな札
//    ・表彰台：上位 3 人の白いカード（2 位・1 位・3 位）。上に押しピン（1 位 金・2 位 銀・3 位 銅）でとめて、「TOP 〇」と書く
//              頭文字の丸と順位・名前・時間・連続日数。1 位は王冠と黄色いカード
//    ・一覧：ノートの紙（上に マスキングテープと押しピン 2 つ）。見出し「4位〜 メンバー学習記録」
//            4 位から下を 4 人（4〜7 位）。順位・頭文字の丸・名前・時間・オレンジの棒（1 位をいっぱいに）
//            自分が 4〜7 位なら、その行を青く目立たせる。自分が 8 位より下なら、4 人目を自分にして（青く目立たせて）順位が分かるように
//            ゲストのときは、4 人目に「ログインすると…」。4 人に たりないときは「―」の あき行
//  見た目は css/style.css の「ランキング」（大きさは 掲示板の高さ・はばに合わせる）
// ═══════════════════════════════════════════════════════════════

import { drawBoard, boardIcon as icon } from "../../../object/board/board.js";   // 掲示板の絵と部品（src/system/object/board）

const LIST_FROM = 4, LIST_COUNT = 4;   // 一覧は 4 位から 4 人

/** HTML に入れても こわれないように */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function mountRanking({ board, getRows, format, guestNote = () => "" }) {
  const { head, body } = drawBoard(board, { legs: true });   // 見出しの板は かかない
  head.innerHTML = `<span class="rb-period">${icon("clock")}今週の勉強時間</span>`;

  /** 時間の長い順にならべて、順位をつける（同じ時間なら同じ順位） */
  const ranked = () => {
    const rows = [...getRows()].sort((a, b) => b.sec - a.sec);
    rows.forEach((r, i) => { r.rank = i > 0 && r.sec === rows[i - 1].sec ? rows[i - 1].rank : i + 1; });
    return rows;
  };
  const meTag = (r) => (r.me ? `<small class="rb-me-tag">あなた</small>` : "");
  const flame = (r) => `${icon("flame")}${r.streak ?? 0}日連続`;

  const draw = () => {
    const rows = ranked();
    const max = Math.max(1, rows[0]?.sec ?? 1);
    const me = rows.find((r) => r.me);
    const guest = !me && guestNote();

    // 表彰台（上位 3 人。2 位・1 位・3 位）
    const top = rows.slice(0, 3);
    const podium = [top[1], top[0], top[2]].filter(Boolean).map((r) => `
      <span class="rb-card is-${r.rank}${r.me ? " is-me" : ""}">
        <span class="cb-pin rb-card-pin is-${["gold", "silver", "bronze"][r.rank - 1] ?? "red"}"></span>
        <span class="rb-top">${r.rank === 1 ? `<span class="rb-crown">${icon("crown")}</span>` : ""}TOP ${r.rank}</span>
        <span class="rb-card-avatar">
          <span class="rb-avatar is-rank-${r.rank}">${esc(r.name.slice(0, 1))}</span>
          <span class="rb-badge is-rank-${r.rank}">${r.rank}</span>
        </span>
        <span class="rb-name">${esc(r.name)}${meTag(r)}</span>
        <span class="rb-time">${format(r.sec)}</span>
        <span class="rb-streak">${flame(r)}</span>
      </span>`).join("");

    // 一覧（4 位から 4 人）。自分が その中にいなければ（8 位より下）、4 人目を自分にする。ゲストなら 4 人目は「ログインすると…」
    let list = rows.slice(LIST_FROM - 1, LIST_FROM - 1 + LIST_COUNT);
    if (me && me.rank >= LIST_FROM && !list.includes(me)) list = [...list.slice(0, LIST_COUNT - 1), me];
    if (guest) list = list.slice(0, LIST_COUNT - 1);
    const lines = list.map((r) => `
      <span class="rb-row${r.me ? " is-me" : ""}">
        <span class="rb-row-rank">${r.rank}</span>
        <span class="rb-avatar" style="--c:${esc(r.color)}">${esc(r.name.slice(0, 1))}</span>
        <span class="rb-row-main">
          <span class="rb-row-top">
            <span class="rb-row-name">${esc(r.name)}${meTag(r)}</span>
            <span class="rb-row-time">${format(r.sec)}</span>
          </span>
          <span class="rb-bar"><i style="width:${Math.max(2, (r.sec / max) * 100).toFixed(1)}%"></i></span>
        </span>
      </span>`);
    while (lines.length < LIST_COUNT - (guest ? 1 : 0)) lines.push(`<span class="rb-row is-empty"><span class="rb-row-rank">―</span></span>`);   // あき行
    if (guest) lines.push(`<span class="rb-row is-guest">${esc(guest)}</span>`);

    body.innerHTML = `
      <span class="rb-podium">${podium || `<span class="rb-none">まだ だれもいません</span>`}</span>
      <span class="rb-sheet">
        <span class="cb-tape rb-sheet-tape"></span>
        <span class="cb-pin is-red rb-sheet-pin is-l"></span><span class="cb-pin is-teal rb-sheet-pin is-r"></span>
        <span class="cb-note rb-list">
          <span class="rb-list-head">
            <b>${icon("note")}4位〜 メンバー学習記録</b>
          </span>
          ${lines.join("")}
        </span>
      </span>`;
    board.setAttribute("aria-label", `今週の勉強時間ランキング（${rows.length}人${me ? `・あなたは ${me.rank} 位` : ""}）`);
  };

  draw();
  return { draw };
}
