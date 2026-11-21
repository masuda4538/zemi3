// ═══════════════════════════════════════════════════════════════
//  ホーム：ポスト（フレンドから届いたものを受け取る。★ 今は見た目のイメージだけ）
//  使い方（js/main.js）
//    const mailbox = mountMailbox({ post: ポストのボタン, badge: 数の札, box: 受け取り箱, mails: [届いたもの],
//                                   isFriend: (userId) => フレンドか, onFriend: (userId) => フレンド詳細を開く });
//    mailbox.receive(届いたもの)   … あとから届いたものをポストに入れる（★ 本当の機能を作ったら、ここを呼ぶ）
//    mailbox.list()               … 今ポストに入っているもの（新しい順）
//  届いたものの形は pages/friends/mail-sample.js に書いてあります（手紙・問題・フレンド申請・応援のスタンプ）
//
//  することと見た目
//    ・まだ見ていないものがあると … ポストの赤い旗が上がり、手紙が入れ口から顔を出す。右上に数の札
//    ・ポストを押すと … ポストの上に「受け取り箱」が開く。届いたものが新しい順に並ぶ（すべて／手紙／問題／申請／応援 で しぼれる）
//    ・1 つ押すと … 中身が開く（見たことになる）。問題は、問題文と選択肢まで見られる（正解は出さない）
//                   返事・解く・承認などのボタンは、今は押すと「準備中」のお知らせ
//    ・中身の「〇〇 さんから」（送った人）を押すと … フレンドのページの「フレンド詳細」を開く（フレンドの人だけ）
//    ・箱の外を押すか、× か Esc キーで閉じる
//    ・見たかどうかは sessionStorage にメモする（ほかのページへ行って もどってきても そのまま。アプリを閉じると消える）
//      ★ 本当の機能を作るときは、データベースなどに入れる
//  ポストの絵は index.html、見た目は css/style.css の「ポスト」
// ═══════════════════════════════════════════════════════════════

import { lastLoginText } from "../../../pages/friends/friends-sample.js";   // 「〇分前」の書き方（フレンドのページと同じ）
import { MAIL_TYPES, STAMPS, CHOICE_MARKS } from "../../../pages/friends/mail-sample.js";

/** しぼりこみ（all ＝ すべて） */
const FILTERS = [
  { id: "all", name: "すべて" },
  { id: "letter", name: "手紙" },
  { id: "quiz", name: "問題" },
  { id: "request", name: "申請" },
  { id: "gift", name: "応援" },
];

/** 見たものの id のメモ（sessionStorage。使えないときは、メモしないだけ） */
const READ_KEY = "zemi:mail:read";
const loadRead = () => { try { return new Set(JSON.parse(sessionStorage.getItem(READ_KEY) ?? "[]")); } catch { return new Set(); } };
const saveRead = (items) => { try { sessionStorage.setItem(READ_KEY, JSON.stringify(items.filter((m) => m.read).map((m) => m.id))); } catch { /* なにもしない */ } };

/** 小さなアイコン（線でかく。種類のしるし・スタンプに使う） */
const ICON = {
  letter: '<path d="M3 6.5h18v11H3z"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
  quiz: '<rect x="4" y="3.5" width="16" height="17" rx="2.5"/><path d="M9.6 9.3a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><path d="M12 17h.01"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  request: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6"/><path d="M19 8v6M16 11h6"/>',
  gift: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
  cheer: '<path d="M6 21V4"/><path d="M6 4.5c4-2 7 2 12 0v8.5c-5 2-8-2-12 0"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
  heart: '<path d="M12 20.5s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 10-7.5 10z"/>',
};
const icon = (name) => `<svg class="mb-icon" viewBox="0 0 24 24" aria-hidden="true">${ICON[name] ?? ""}</svg>`;

/** HTML に入れても こわれないように、< > & " を置きかえる（本文はフレンドが書いたものなので） */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 一覧に出す 1 行目（だれから・何が） */
const titleOf = (m) => MAIL_TYPES[m.type]?.name ?? "";
/** 一覧に出す 2 行目（中身の はじめのほう） */
const previewOf = (m) => m.type === "request" ? "フレンドになってください"
  : m.type === "gift" ? `「${STAMPS[m.stamp] ?? ""}」${m.text ?? ""}`
  : m.type === "quiz" ? `「${m.quiz?.title ?? ""}」${m.quiz?.questions?.length ?? 0}問`
  : (m.text ?? "");

export function mountMailbox({ post, badge, box, mails = [], onReceive, isFriend = () => false, onFriend }) {
  const seen = loadRead();
  let items = [...mails].map((m) => ({ ...m, read: m.read || seen.has(m.id) })).sort((a, b) => b.at - a.at);   // 新しい順
  let filter = "all";
  let openId = null;   // 中身を開いているもの（null ＝ 一覧）

  /** 「準備中」のお知らせ（右上） */
  const soon = (title) => window.app?.notify?.({ type: "info", title: `${title}は準備中です`, message: "今は見た目のイメージだけで、まだ送れません。" });

  // ── ポスト：旗・顔を出す手紙・数の札 ──
  const drawPost = () => {
    const unread = items.filter((m) => !m.read).length;
    post.classList.toggle("has-mail", unread > 0);
    badge.hidden = unread === 0;
    badge.textContent = unread > 9 ? "9+" : String(unread);
    post.setAttribute("aria-label", `ポスト（届いたもの ${items.length}件・まだ見ていないもの ${unread}件）`);
  };

  // ── 受け取り箱：一覧 ──
  const listHTML = () => {
    const shown = filter === "all" ? items : items.filter((m) => m.type === filter);
    const count = (id) => (id === "all" ? items : items.filter((m) => m.type === id)).filter((m) => !m.read).length;
    return `
      <div class="mb-filter" role="radiogroup" aria-label="しぼりこみ">
        ${FILTERS.map((f) => `<button type="button" role="radio" aria-checked="${filter === f.id}" class="${filter === f.id ? "active" : ""}" data-filter="${f.id}">${f.name}${count(f.id) ? `<i>${count(f.id)}</i>` : ""}</button>`).join("")}
      </div>
      ${shown.length === 0 ? `<p class="mb-none">届いたものはありません。</p>` : `
      <ul class="mb-list">
        ${shown.map((m) => `
          <li><button type="button" class="mb-item${m.read ? "" : " is-unread"}" data-id="${esc(m.id)}" style="--c:${esc(m.from.color)}">
            <span class="mb-avatar">${esc(m.from.name.slice(0, 1))}<i class="mb-kind is-${m.type}">${icon(m.type)}</i></span>
            <span class="mb-main">
              <span class="mb-title"><b>${esc(m.from.name)}</b> さんから${titleOf(m)}</span>
              <span class="mb-preview">${esc(previewOf(m))}</span>
            </span>
            <span class="mb-time">${lastLoginText(m.at, false)}</span>
          </button></li>`).join("")}
      </ul>`}`;
  };

  // ── 受け取り箱：中身（手紙・申請・応援） ──
  const detailHTML = (m) => {
    // 送った人：フレンドなら押せる（フレンド詳細へ）
    const friend = isFriend(m.from.userId);
    const fromInner = `
        <span class="mb-avatar is-big">${esc(m.from.name.slice(0, 1))}</span>
        <span class="mb-from-text"><span><b>${esc(m.from.name)}</b> さんから${MAIL_TYPES[m.type]?.name ?? ""}</span><small>ID：${esc(m.from.userId)} ・ ${lastLoginText(m.at)}</small></span>`;
    const head = friend
      ? `<button type="button" class="mb-from is-link" data-friend="${esc(m.from.userId)}" title="${esc(m.from.name)} さんのフレンド詳細を見る">${fromInner}<span class="mb-from-go">詳細${icon("chevron")}</span></button>`
      : `<div class="mb-from">${fromInner}</div>`;
    if (m.type === "quiz") return `${head}
      <div class="mb-quiz">
        <div class="mb-quiz-head">
          <span class="mb-quiz-icon">${icon("quiz")}</span>
          <span><b>${esc(m.quiz?.title)}</b><small>${m.quiz?.questions?.length ?? 0}問</small></span>
        </div>
        ${m.text ? `<p class="mb-quiz-note">${esc(m.text)}</p>` : ""}
        <ol class="mb-quiz-list">
          ${(m.quiz?.questions ?? []).map((x, i) => `
            <li>
              <span class="mb-q-no">Q${i + 1}</span>
              <div>
                <p>${esc(x.q)}</p>
                <ul class="mb-choices">${x.choices.map((c, j) => `<li><i>${CHOICE_MARKS[j] ?? j + 1}</i>${esc(c)}</li>`).join("")}</ul>
              </div>
            </li>`).join("")}
        </ol>
      </div>
      <div class="mb-actions"><button type="button" class="mb-btn is-primary" data-soon="問題を解く機能">${icon("quiz")}問題作成で解く</button></div>`;
    if (m.type === "request") return `${head}
      <div class="mb-request">
        <p><b>${esc(m.from.name)}</b> さんから、フレンドの申請が届きました。</p>
        <div class="mb-actions">
          <button type="button" class="mb-btn is-primary" data-soon="フレンドの承認">${icon("request")}承認する</button>
          <button type="button" class="mb-btn" data-soon="申請をことわる機能">ことわる</button>
        </div>
      </div>`;
    if (m.type === "gift") return `${head}
      <div class="mb-gift">
        <span class="mb-stamp is-${esc(m.stamp)}">${icon(m.stamp)}<b>${esc(STAMPS[m.stamp] ?? "")}</b></span>
        ${m.text ? `<p>${esc(m.text)}</p>` : ""}
        <div class="mb-actions"><button type="button" class="mb-btn is-primary" data-soon="応援を送る機能">${icon("heart")}ありがとうを送る</button></div>
      </div>`;
    return `${head}
      <div class="mb-letter"><p>${esc(m.text)}</p></div>
      <div class="mb-actions"><button type="button" class="mb-btn is-primary" data-soon="手紙の返事">${icon("letter")}返事を書く</button></div>`;
  };

  const drawBox = () => {
    const unread = items.filter((m) => !m.read).length;
    const m = openId && items.find((x) => x.id === openId);
    box.innerHTML = `
      <header class="mb-head">
        <span class="mb-head-icon">${icon("letter")}</span>
        <b>ポスト</b>
        <span class="mb-count">${unread ? `まだ見ていない ${unread}件` : `${items.length}件`}</span>
        <span class="home-plaza-tag" title="フレンドから送る機能はまだありません。今は仮のデータです">イメージ</span>
        <button type="button" class="mb-close" aria-label="閉じる">×</button>
      </header>
      <div class="mb-body">
        ${m ? `<button type="button" class="mb-back">‹ 一覧にもどる</button><div class="mb-detail" style="--c:${esc(m.from.color)}">${detailHTML(m)}</div>` : listHTML()}
      </div>
      ${m ? "" : `<footer class="mb-foot"><button type="button" class="mb-allread"${unread ? "" : " disabled"}>すべて見たことにする</button></footer>`}`;
  };

  /** 箱を、ポストの上に置く（上に入らなければ、ポストの右に） */
  const placeBox = () => {
    if (box.hidden) return;
    const r = post.getBoundingClientRect();
    const TOP = 150;   // いちばん上の帯と広場の札の分
    let room = r.top - 10 - TOP;
    if (room >= 360) {   // 上に じゅうぶんな高さがあれば、ポストの上
      box.style.left = `${Math.max(12, r.left)}px`;
      box.style.bottom = `${window.innerHeight - r.top + 10}px`;
    } else {             // なければ、ポストの右に（下はしにそろえる）
      room = window.innerHeight - 14 - TOP;
      box.style.left = `${r.right + 10}px`;
      box.style.bottom = "14px";
    }
    box.style.maxHeight = `${Math.max(220, Math.min(520, room))}px`;
  };

  const open = () => { openId = null; drawBox(); box.hidden = false; post.setAttribute("aria-expanded", "true"); placeBox(); };
  const close = () => { box.hidden = true; openId = null; post.setAttribute("aria-expanded", "false"); };

  // ── 押したとき ──
  post.addEventListener("click", () => (box.hidden ? open() : close()));
  box.addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.classList.contains("mb-close")) { close(); post.focus(); return; }
    if (t.dataset.filter) { filter = t.dataset.filter; drawBox(); return; }
    if (t.dataset.id) {   // 1 つ開く ＝ 見たことになる
      const m = items.find((x) => x.id === t.dataset.id);
      if (m) { m.read = true; openId = m.id; drawBox(); drawPost(); saveRead(items); }
      return;
    }
    if (t.classList.contains("mb-back")) { openId = null; drawBox(); return; }
    if (t.dataset.friend) { close(); onFriend?.(t.dataset.friend); return; }   // フレンド詳細へ
    if (t.classList.contains("mb-allread")) { items.forEach((m) => { m.read = true; }); drawBox(); drawPost(); saveRead(items); return; }
    if (t.dataset.soon) soon(t.dataset.soon);
  });
  // 箱の外を押したら閉じる（ポストを押したときは、上の click で開け閉めする）
  document.addEventListener("pointerdown", (e) => {
    if (!box.hidden && !box.contains(e.target) && !post.contains(e.target)) close();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) { close(); post.focus(); } });
  window.addEventListener("resize", placeBox);

  post.setAttribute("aria-haspopup", "dialog");
  post.setAttribute("aria-expanded", "false");
  drawPost();

  return {
    /** あとから届いたものを入れる（同じ id のものは入れない）。旗が上がって、ポストが ぴょこっと ゆれる */
    receive(mail) {
      if (!mail || items.some((m) => m.id === mail.id)) return;
      items = [{ ...mail, read: !!mail.read }, ...items].sort((a, b) => b.at - a.at);
      drawPost();
      post.classList.remove("is-new");
      void post.offsetWidth;   // アニメーションを最初から やりなおすため
      post.classList.add("is-new");
      if (!box.hidden) drawBox();
      onReceive?.(mail);
    },
    list: () => [...items],
  };
}
