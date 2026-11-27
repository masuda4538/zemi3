// ═══════════════════════════════════════════════════════════════
//  ホーム：ポスト（チャットの通知と、フレンド申請を受け取る。★ フレンドは まだ仮の人たち）
//  使い方（js/main.js）
//    const mailbox = mountMailbox({ post: ポストのボタン, badge: 数の札, box: 受け取り箱, mails: [届いたもの],
//                                   isFriend: (userId) => フレンドか, onFriend: (userId) => フレンド詳細を開く,
//                                   onChat: (userId) => その人とのチャットを開く, onAllRead: () => チャットを ぜんぶ見たことにする });
//    mailbox.setMails([届いたもの]) … 中身を入れなおす（ログインしている人が変わったとき）
//    mailbox.receive(届いたもの)   … あとから届いたものをポストに入れる（★ 本当の機能を作ったら、ここを呼ぶ）
//    mailbox.list()               … 今ポストに入っているもの（新しい順）
//    onChange: (items) => {}      … 見た・届いたで中身が変わったとき（広場の吹き出しを出しなおす）
//  届いたものは 2 種類
//    チャット … { id, type: "chat", from: { userId, name, color }, at, count（まだ見ていない数）, text（いちばん新しい文）, quiz（問題なら true） }
//               人ごとに 1 つ（js/main.js が pages/friends/chat-store.js の unreadChats から作る）
//    フレンド申請 … { id, type: "request", from, at, read }（形は pages/friends/mail-sample.js）
//
//  することと見た目
//    ・まだ見ていないものがあると … 手紙がポストの入れ口から顔を出す。右上に数の札
//    ・ポストを押すと … ポストの上に「受け取り箱」が開く。新しい順に並ぶ（すべて／チャット／申請 で しぼれる）
//    ・チャットを押すと … フレンドのページの、その人とのチャットが開く（開いたら 見たことになり、ポストから消える）
//    ・申請を押すと … 中身が開く（見たことになる）。承認・ことわるは、今は押すと「準備中」のお知らせ
//    ・中身の「〇〇 さんから」（送った人）を押すと … フレンドのページの「フレンド詳細」を開く（フレンドの人だけ）
//    ・箱の外を押すか、× か Esc キーで閉じる
//    ・申請を見たかどうかは sessionStorage にメモする（ほかのページへ行って もどってきても そのまま。アプリを閉じると消える）
//      チャットを見たかどうかは chat-store.js（その PC の中。ログインしている人ごと）
//      ★ 本当の機能を作るときは、データベースなどに入れる
//  ポストの絵は index.html、見た目は css/style.css の「ポスト」
// ═══════════════════════════════════════════════════════════════

import { lastLoginText } from "../../../pages/friends/friends-sample.js";   // 「〇分前」の書き方（フレンドのページと同じ）

/** しぼりこみ（all ＝ すべて） */
const FILTERS = [
  { id: "all", name: "すべて" },
  { id: "chat", name: "チャット" },
  { id: "request", name: "申請" },
];
/** 種類の名前 */
const TYPE_NAMES = { chat: "チャット", request: "フレンド申請" };

/** 見たものの id のメモ（sessionStorage。使えないときは、メモしないだけ） */
const READ_KEY = "zemi:mail:read";
const loadRead = () => { try { return new Set(JSON.parse(sessionStorage.getItem(READ_KEY) ?? "[]")); } catch { return new Set(); } };
const saveRead = (items) => { try { sessionStorage.setItem(READ_KEY, JSON.stringify(items.filter((m) => m.read).map((m) => m.id))); } catch { /* なにもしない */ } };

/** 小さなアイコン（線でかく。種類のしるしに使う） */
const ICON = {
  chat: '<path d="M4 5.5h16v10.5H10l-4.5 3.5V16H4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  letter: '<path d="M3 6.5h18v11H3z"/><path d="m3.5 7 8.5 6.5L20.5 7"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  request: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6"/><path d="M19 8v6M16 11h6"/>',
};
const icon = (name) => `<svg class="mb-icon" viewBox="0 0 24 24" aria-hidden="true">${ICON[name] ?? ""}</svg>`;

/** HTML に入れても こわれないように、< > & " を置きかえる（本文はフレンドが書いたものなので） */
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** 一覧に出す 1 行目（だれから・何が） */
const titleOf = (m) => (m.type === "chat" ? `チャット${m.count > 1 ? `（${m.count}件）` : ""}` : TYPE_NAMES[m.type] ?? "");
/** 一覧に出す 2 行目（中身の はじめのほう） */
const previewOf = (m) => (m.type === "request" ? "フレンドになってください" : (m.text ?? "").replace(/\n/g, " "));

export function mountMailbox({ post, badge, box, mails = [], onReceive, onChange, isFriend = () => false, onFriend, onChat, onAllRead }) {
  const seen = loadRead();
  let items = [...mails].map((m) => ({ ...m, read: m.read || seen.has(m.id) })).sort((a, b) => b.at - a.at);   // 新しい順
  let filter = "all";
  let openId = null;   // 中身を開いているもの（null ＝ 一覧）

  /** 「準備中」のお知らせ（右上） */
  const soon = (title) => window.app?.notify?.({ type: "info", title: `${title}は準備中です`, message: "今は見た目のイメージだけで、まだ送れません。" });

  // ── ポスト：顔を出す手紙・数の札 ──
  const drawPost = () => {
    const unread = items.filter((m) => !m.read).length;
    post.classList.toggle("has-mail", unread > 0);
    badge.hidden = unread === 0;
    badge.textContent = unread > 9 ? "9+" : String(unread);
    post.setAttribute("aria-label", `ポスト（届いたもの ${items.length}件・まだ見ていないもの ${unread}件）`);
    onChange?.([...items]);
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
          <li><button type="button" class="mb-item${m.read ? "" : " is-unread"}" ${m.type === "chat" ? `data-chat="${esc(m.from.userId)}"` : `data-id="${esc(m.id)}"`} style="--c:${esc(m.from.color)}">
            <span class="mb-avatar">${esc(m.from.name.slice(0, 1))}<i class="mb-kind is-${m.type}">${icon(m.type)}</i></span>
            <span class="mb-main">
              <span class="mb-title"><b>${esc(m.from.name)}</b> さんから${titleOf(m)}</span>
              <span class="mb-preview">${esc(previewOf(m))}</span>
            </span>
            <span class="mb-time"><span>${lastLoginText(m.at, false)}</span>${m.type === "chat" ? `<em>チャットを開く${icon("chevron")}</em>` : ""}</span>
          </button></li>`).join("")}
      </ul>`}`;
  };

  // ── 受け取り箱：中身（フレンド申請。チャットは 押すと フレンドのページへ行くので、中身はない） ──
  const detailHTML = (m) => {
    // 送った人：フレンドなら押せる（フレンド詳細へ）
    const friend = isFriend(m.from.userId);
    const fromInner = `
        <span class="mb-avatar is-big">${esc(m.from.name.slice(0, 1))}</span>
        <span class="mb-from-text"><span><b>${esc(m.from.name)}</b> さんから${TYPE_NAMES[m.type] ?? ""}</span><small>ID：${esc(m.from.userId)} ・ ${lastLoginText(m.at)}</small></span>`;
    const head = friend
      ? `<button type="button" class="mb-from is-link" data-friend="${esc(m.from.userId)}" title="${esc(m.from.name)} さんのフレンド詳細を見る">${fromInner}<span class="mb-from-go">詳細${icon("chevron")}</span></button>`
      : `<div class="mb-from">${fromInner}</div>`;
    if (m.type === "request") return `${head}
      <div class="mb-request">
        <p><b>${esc(m.from.name)}</b> さんから、フレンドの申請が届きました。</p>
        <div class="mb-actions">
          <button type="button" class="mb-btn is-primary" data-soon="フレンドの承認">${icon("request")}承認する</button>
          <button type="button" class="mb-btn" data-soon="申請をことわる機能">ことわる</button>
        </div>
      </div>`;
    return head;
  };

  const drawBox = () => {
    const unread = items.filter((m) => !m.read).length;
    const m = openId && items.find((x) => x.id === openId);
    box.innerHTML = `
      <header class="mb-head">
        <span class="mb-head-icon">${icon("letter")}</span>
        <b>ポスト</b>
        <span class="mb-count">${unread ? `まだ見ていない ${unread}件` : `${items.length}件`}</span>
        <span class="home-plaza-tag" title="フレンドは まだ仮の人たちです">イメージ</span>
        <button type="button" class="mb-close" aria-label="閉じる">×</button>
      </header>
      <div class="mb-body">
        ${m ? `<button type="button" class="mb-back">‹ 一覧にもどる</button><div class="mb-detail" style="--c:${esc(m.from.color)}">${detailHTML(m)}</div>` : listHTML()}
      </div>
      ${m ? "" : `<footer class="mb-foot"><button type="button" class="mb-allread"${unread ? "" : " disabled"}>すべて見たことにする</button></footer>`}`;
  };

  const BOX_H = 520;   // 箱の たての長さ（いつも同じ。横は css/style.css の .mailbox で 420px）
  /** 箱を、ポストの上に置く（上に入らなければ、ポストの右に） */
  const placeBox = () => {
    if (box.hidden) return;
    const r = post.getBoundingClientRect();
    const TOP = 150;   // いちばん上の帯と広場の札の分
    let room = r.top - 10 - TOP;
    if (room >= BOX_H) {   // 上に 箱が入る高さがあれば、ポストの上
      box.style.left = `${Math.max(12, r.left)}px`;
      box.style.bottom = `${window.innerHeight - r.top + 10}px`;
    } else {             // なければ、ポストの右に（下はしにそろえる）
      room = window.innerHeight - 14 - TOP;
      box.style.left = `${r.right + 10}px`;
      box.style.bottom = "14px";
    }
    box.style.height = `${Math.max(220, Math.min(BOX_H, room))}px`;   // たては いつも同じ（入らない画面では 入る長さに）
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
    if (t.dataset.chat) { close(); onChat?.(t.dataset.chat); return; }   // チャット → その人とのチャットへ
    if (t.dataset.id) {   // 1 つ開く ＝ 見たことになる
      const m = items.find((x) => x.id === t.dataset.id);
      if (m) { m.read = true; openId = m.id; drawBox(); drawPost(); saveRead(items); }
      return;
    }
    if (t.classList.contains("mb-back")) { openId = null; drawBox(); return; }
    if (t.dataset.friend) { close(); onFriend?.(t.dataset.friend); return; }   // フレンド詳細へ
    if (t.classList.contains("mb-allread")) {   // すべて見たことにする（チャットは chat-store.js にも）
      items.forEach((m) => { m.read = true; });
      onAllRead?.();
      drawBox(); drawPost(); saveRead(items); return;
    }
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
    /** あとから届いたものを入れる（同じ id のものは入れない）。手紙が顔を出して、ポストが ぴょこっと ゆれる */
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
    /** 中身を入れなおす（ログインしている人が変わったとき） */
    setMails(list) {
      const read = loadRead();
      items = [...list].map((m) => ({ ...m, read: m.read || read.has(m.id) })).sort((a, b) => b.at - a.at);
      openId = null;
      drawPost();
      if (!box.hidden) drawBox();
    },
    /** 受け取り箱を開いて、id のものの中身を出す（見たことになる） */
    openMail(id) {
      const m = items.find((x) => x.id === id);
      if (!m) return;
      open();
      m.read = true; openId = m.id; drawBox(); drawPost(); saveRead(items);
    },
  };
}
