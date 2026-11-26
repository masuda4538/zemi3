// ═══════════════════════════════════════════════════════════════
//  ホーム：掲示板のランキング（お気に入りの広場の奥のコルクボード。今週の勉強時間。
//          ★ フレンドの時間・連続日数と、仮のメンバー（RANKING_SAMPLE）は 今は仮のデータ）
//  掲示板の絵（木のわく ＋ コルクボード ＋ 足）は object/board。ここは、そのコルクボードの上に入れる中身
//  使い方（js/main.js）
//    const ranking = mountRanking({ board: 掲示板を入れる場所, getRows: () => [人], format: (秒) => "1時間20分", guestNote: () => "" });
//    ranking.draw()   … 中身を書き直す（勉強時間・お気に入り・ログインしている人が変わったとき）
//    人 … { userId, name, color, sec（今週の勉強時間・秒）, streak（連続日数）, me（自分なら true） }
//  コルクボードの上に出すもの
//    ・木のわくの上に「今週の勉強時間」の アーチの木の看板（object/board の sign）
//    ・表彰台：上位 3 人の白いカード（2 位・1 位・3 位）。上に押しピン（1 位 金・2 位 銀・3 位 銅）でとめて、「TOP 〇」と書く
//              頭文字の丸と順位・名前・時間・連続日数。1 位は王冠と黄色いカード
//    ・自分の順位：表彰台の下の まん中に、白い紙（はばは 表彰台の 6 割）（上に マスキングテープと押しピン 2 つ）を 1 まい。青い帯で
//            「あなたは 〇位（〇人中）」と今週の時間、その下に「〇位まで あと 〇分」（1 つ上の人まで、あと どれだけ勉強すればよいか）
//            1 位なら「1位です！ このまま がんばろう」。3 位以内のときも出す（表彰台のカードも青くふちどる）
//            ゲストのときは「ログインすると…」
//  看板か掲示板を押す（または キーボードで えらんで Enter）と、全員の順位のモーダル（<dialog>）が開く
//    上に「あなたは 〇位（〇人中）」と「〇位まで あと 〇分」。下に 全員の一覧（順位・頭文字の丸・名前・時間・オレンジの棒・連続日数）
//    1 人ずつ カードで囲う。1〜3 位は 金・銀・銅の丸と カードのふち。自分のカードは青く。開いたら 自分の行が見えるところまで スクロール
//    とじる：右上の × ・ まわりの暗いところを押す ・ Esc キー
//  見た目は css/style.css の「ランキング」（大きさは 掲示板の高さ・はばに合わせる）と「ランキングのモーダル」
// ═══════════════════════════════════════════════════════════════

import { drawBoard, boardIcon as icon } from "../../../object/board/board.js";   // 掲示板の絵と部品（src/system/object/board）

/** HTML に入れても こわれないように */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export function mountRanking({ board, getRows, format, guestNote = () => "" }) {
  const { body } = drawBoard(board, { legs: true, sign: "今週の勉強時間" });   // 見出しの板は かかない。わくの上に アーチの看板を立てる

  /** 時間の長い順にならべて、順位をつける（同じ時間なら同じ順位） */
  const ranked = () => {
    const rows = [...getRows()].sort((a, b) => b.sec - a.sec);
    rows.forEach((r, i) => { r.rank = i > 0 && r.sec === rows[i - 1].sec ? rows[i - 1].rank : i + 1; });
    return rows;
  };
  const meTag = (r) => (r.me ? `<small class="rb-me-tag">あなた</small>` : "");
  const flame = (r) => `${icon("flame")}${r.streak ?? 0}日連続`;
  /** 1 つ上の人（自分より時間が長い人の中で いちばん下）まで、あと どれだけか */
  const nextText = (rows, me) => {
    const above = rows.filter((r) => r.sec > me.sec).at(-1);
    return above
      ? `${icon("target")}<b>${above.rank}位</b>まで あと <b>${format(above.sec - me.sec)}</b>`
      : `${icon("crown")}<b>1位</b>です！ このまま がんばろう`;
  };

  const draw = () => {
    const rows = ranked();
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

    // 自分の順位（青い帯）。1 つ上の人（自分より時間が長い人の中で いちばん下）まで、あと どれだけか
    let mine;
    if (me) {
      const next = nextText(rows, me);
      mine = `
          <span class="rb-mine">
            <span class="rb-avatar" style="--c:${esc(me.color)}">${esc(me.name.slice(0, 1))}</span>
            <span class="rb-mine-main">
              <span class="rb-mine-top">
                <span class="rb-mine-rank">あなたは <b>${me.rank}</b>位<small>（${rows.length}人中）</small></span>
                <span class="rb-mine-time">${format(me.sec)}</span>
              </span>
              <span class="rb-mine-next">${next}</span>
            </span>
          </span>`;
    } else {
      mine = `<span class="rb-mine is-guest">${esc(guest || "ログインすると、あなたの順位が出ます。")}</span>`;
    }

    body.innerHTML = `
      <span class="rb-podium">${podium || `<span class="rb-none">まだ だれもいません</span>`}</span>
      <span class="rb-sheet">
        <span class="cb-tape rb-sheet-tape"></span>
        <span class="cb-pin is-red rb-sheet-pin is-l"></span><span class="cb-pin is-teal rb-sheet-pin is-r"></span>
        <span class="cb-note rb-note">${mine}
        </span>
      </span>`;
    board.setAttribute("aria-label", `今週の勉強時間ランキング（${rows.length}人${me ? `・あなたは ${me.rank} 位` : ""}）。押すと 全員の順位が見られます`);
  };

  // ───────── 全員の順位のモーダル（<dialog>。showModal で開くと、うしろは押せなくなり、Esc で とじる） ─────────
  const dialog = document.createElement("dialog");
  dialog.className = "rk-modal";
  dialog.setAttribute("aria-labelledby", "rk-modal-title");
  document.body.append(dialog);
  const CLOSE = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>`;

  /** モーダルの中身をかいて開く */
  const open = () => {
    const rows = ranked();
    const max = Math.max(1, rows[0]?.sec ?? 1);
    const me = rows.find((r) => r.me);
    const guest = !me && guestNote();
    const summary = me
      ? `<span class="rk-mine">
           <span class="rk-mine-rank">あなたは <b>${me.rank}</b>位<small>（${rows.length}人中）</small></span>
           <span class="rk-mine-next">${nextText(rows, me)}</span>
         </span>`
      : `<span class="rk-mine is-guest">${esc(guest || "ログインすると、あなたの順位が出ます。")}</span>`;
    const lines = rows.map((r) => `
      <li class="rk-row${r.rank <= 3 ? ` is-rank-${r.rank}` : ""}${r.me ? " is-me" : ""}">
        <span class="rk-rank${r.rank <= 3 ? ` is-rank-${r.rank}` : ""}">${r.rank}</span>
        <span class="rb-avatar" style="--c:${esc(r.color)}">${esc(r.name.slice(0, 1))}</span>
        <span class="rk-main">
          <span class="rk-top">
            <span class="rk-name">${esc(r.name)}${meTag(r)}</span>
            <span class="rk-streak">${flame(r)}</span>
            <span class="rk-time">${format(r.sec)}</span>
          </span>
          <span class="rk-bar"><i style="width:${Math.max(1.5, (r.sec / max) * 100).toFixed(1)}%"></i></span>
        </span>
      </li>`).join("");
    dialog.innerHTML = `
      <div class="rk-box">
        <header class="rk-head">
          <span class="rk-head-icon">${icon("crown")}</span>
          <h2 id="rk-modal-title">今週の勉強時間ランキング</h2>
          <button type="button" class="rk-close" aria-label="とじる">${CLOSE}</button>
        </header>
        ${summary}
        <ol class="rk-list" aria-label="順位の一覧（${rows.length}人）">${lines || `<li class="rk-none">まだ だれもいません</li>`}</ol>
      </div>`;
    dialog.showModal();
    dialog.querySelector(".rk-close").focus();
    // 自分の行が見えるところ（まん中あたり）まで スクロール
    dialog.querySelector(".rk-row.is-me")?.scrollIntoView({ block: "center" });
  };
  const close = () => { dialog.close(); board.focus(); };
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest(".rk-close")) close();   // まわりの暗いところ（dialog そのもの）か × を押した
  });
  dialog.addEventListener("cancel", (e) => { e.preventDefault(); close(); });   // Esc キー

  // 掲示板（看板もふくむ）を押すと開く。キーボードでも えらべるように（Tab で えらんで Enter かスペース）
  board.tabIndex = 0;
  board.setAttribute("role", "button");
  board.setAttribute("aria-haspopup", "dialog");
  board.addEventListener("click", open);
  board.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
  });

  draw();
  return { draw, open };
}
