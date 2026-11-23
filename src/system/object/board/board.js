// ═══════════════════════════════════════════════════════════════
//  もの：掲示板（木のわく ＋ コルクボード。押しピン・マスキングテープ・紙のカード・ノート・付箋も ここにある）
//    import { drawBoard, boardIcon } from "<ここまでの道>/object/board/board.js";
//    const { head, body } = drawBoard(入れる場所の要素, { label: "STUDY LOG BOARD", title: "勉強時間ランキング", legs: true });
//      head … 見出しの板の右どなりの、自由に入れる場所（ホームでは 今日／今週／累計の切りかえ）。入れなければ見出しは まん中
//             label も title も なし のときは、見出しの板は かかずに、head を まん中に置く（見出しを掲示板の外に出すとき）
//      body … コルクの上の、自由に中身を入れる場所（ホームでは js/ranking.js が 表彰台と一覧を入れる）
//      legs … 下に 2 本の足を付けるか（広場に立てるとき true）
//    入れる場所の大きさいっぱいに かく。文字の大きさは 入れる場所の高さ（cqh）に合わせる
//
//  部品（クラス名。drawBoard を使わなくても、どこでも使える。見た目は board.css）
//    cb-frame   … 木のわく                   cb-cork   … コルクの面
//    cb-pin     … 押しピン（is-gold・is-silver・is-bronze・is-red・is-teal で色）
//    cb-tape    … マスキングテープ（is-mint でミント色の水玉）
//    cb-craft   … クラフト紙の見出しの板      cb-paper  … 白い紙のカード（押すと少し持ち上がる）
//    cb-note    … ノート（線の入った紙）      cb-sticky … 黄色い付箋        cb-memo … 小さなメモ
//    cb-screw   … わくの すみの ねじ（4 つ置く：is-tl・is-tr・is-bl・is-br）
//  boardIcon("book") … 線でかいた小さなアイコン（book・crown・flame・heart・note・target・clock）。サイドバーと同じ線の太さ
//  ・時間帯：外がわに data-time="night" があると少し暗くなる
// ═══════════════════════════════════════════════════════════════
import "./board.css";

/** HTML に入れても こわれないように */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 線でかいた小さなアイコン（core/components/Icon.jsx と同じ線の太さ・形の感じ） */
const ICONS = {
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5M8.5 7.5h7M8.5 11h5"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/><path d="M5 19h14"/>',
  flame: '<path d="M12 21c-3.9 0-7-2.8-7-6.6 0-3.3 2.3-5.4 3.8-7.4.4 2 1.4 3.2 2.6 3.8C11.4 7.5 12.7 4.6 15 3c-.3 2.8 1 4.8 2.4 6.6 1 1.3 1.6 2.8 1.6 4.8 0 3.8-3.1 6.6-7 6.6z"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
  note: '<path d="M6 3h9l4 4v14H6z"/><path d="M14.5 3v4.5H19M9 12h7M9 15.5h7M9 19h4"/>',
  target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
};
export const boardIcon = (name) => `<svg class="cb-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;

/** 掲示板をかく。{ head, body } を返す */
export function drawBoard(host, { label = "", title = "", legs = true } = {}) {
  host.classList.add("obj-board");
  host.innerHTML = `
    <span class="cb-frame bd-frame">
      <span class="cb-screw is-tl"></span><span class="cb-screw is-tr"></span><span class="cb-screw is-bl"></span><span class="cb-screw is-br"></span>
      <span class="cb-cork bd-cork">
        <span class="bd-head">
          ${label || title ? `<span class="cb-craft bd-plate">
            <span class="cb-tape bd-tape is-l"></span><span class="cb-tape bd-tape is-r"></span>
            ${label ? `<small>${esc(label)}</small>` : ""}
            <b>${esc(title)}</b>
          </span>` : ""}
          <span class="bd-head-slot"></span>
        </span>
        <span class="bd-body"></span>
      </span>
    </span>
    ${legs ? `<span class="bd-legs" aria-hidden="true"></span>` : ""}`;
  return { head: host.querySelector(".bd-head-slot"), body: host.querySelector(".bd-body") };
}
