// ═══════════════════════════════════════════════════════════════
//  フレンドのチャット：やりとりの保存（★ 今はサーバーがないので、その PC の中に覚えておく。相手には届かない）
//  使っているところ：フレンドのページの「チャット」（chat.jsx）
//    loadChats(自分の userId)                 … やりとり { 相手の userId: [メッセージ…] }（まだ何もなければ、下の仮のやりとり）
//    sendMessage(自分の userId, やりとり, 相手の userId, { type, text, quiz }) … 1 つ足して覚えておき、新しい やりとりを返す
//    sentQuizzes(やりとり)                     … 自分が送った問題の一覧 [{ friendId, msg }]（新しい順）
//  見たかどうか（相手からのメッセージを まだ見ていないか。ホームのポストの通知・広場の吹き出し・トークの一覧の数に使う）
//    loadReadMarks(自分の userId)             … { 相手の userId: 最後に そのトークを開いた日時（文字） }
//    markRead(自分の userId, 相手の userId)    … そのトークを開いた ＝ 今までのメッセージを見た。新しい { … } を返す
//    markAllRead(自分の userId)               … ぜんぶ見たことにする
//    unreadChats(自分の userId)               … まだ見ていないメッセージがある人 [{ friendId, count（数）, last（いちばん新しいもの） }]（新しい順）
//    unreadCount(やりとりの 1 人分, 見た日時)  … その人の まだ見ていない数
//  グループ（トークの一覧の タブで しぼる。自分で作る分類。例：クラス・部活）
//    loadGroups(自分の userId)                … [{ id, name, members: [相手の userId…] }]（作った順）
//    saveGroups(自分の userId, [グループ…])   … 覚えておく。同じ配列を返す
//    newGroupId()                             … 新しいグループの id
//  えらんでいる タブ（すべて・お気に入り・未読・オンライン・グループの id）
//    loadChatTab(自分の userId) ／ saveChatTab(自分の userId, タブの id)
//  タブの ならび（ドラッグ＆ドロップで 自分で 並べかえた順。「すべて」は いつも 左はしなので 入らない）
//    loadTabOrder(自分の userId) … [タブの id…]（まだ 並べかえていなければ []）
//    saveTabOrder(自分の userId, [タブの id…])
//  グループトーク（何人かの フレンドと 1 つのトークで話す。やりとりは 上の chats に id「grp:…」で 入る）
//    loadRooms(自分の userId)                 … [{ id: "grp:…", name, color, members: [相手の userId…] }]（作った順）
//    saveRooms(自分の userId, [グループ…])    … 覚えておく。同じ配列を返す
//    newRoomId()                              … 新しいグループトークの id
//    addNotice(自分の userId, やりとり, id, 文) … お知らせ（「〇〇さんを 追加しました」など）を 1 つ足す。新しい やりとりを返す
//    removeTalk(自分の userId, やりとり, id)  … そのトークの やりとりを 消す（グループから ぬけたとき）。新しい やりとりを返す
//    まだ何も保存していないときは、仮のグループ（chat-sample.js の sampleRoom）を 1 つ入れる
//  右の列（ピン止め・やりとりしたもの）を 出すか
//    loadFilesOpen(自分の userId) ／ saveFilesOpen(自分の userId, true か false)
//  会話（メッセージ）のピン止め（トークの いちばん上の帯に出す。いくつでも）
//    loadMsgPins(自分の userId)               … { 相手の userId: [メッセージの id…] }（あとから ピン止めしたものほど 前）
//    toggleMsgPin(自分の userId, 相手の userId, メッセージの id) … ピン止めする・外す。新しい { … } を返す
//
//  メッセージ 1 つの形
//    id   … 見分けるための名前
//    from … "me"（自分） ／ "friend"（相手）
//    type … "text"（文） ／ "quiz"（問題） ／ "code"（プログラムのコード） ／ "stamp"（スタンプ） ／ "system"（お知らせ）
//    text … 文（問題のときは ひとこと。なくてもよい）
//    code … コード（code のときだけ。何行でも）　lang … 言語の名前（"Python" など。code のときだけ）
//    stamp … スタンプの id（stamp のときだけ。一覧と 絵は stamps.js）
//    quiz … 問題（quiz のときだけ）{ title: 題名, questions: [{ q: 問題文, choices: [選択肢 4 つ], answer: 正解の番号（0 から） }] }
//    at   … 送った日時（文字。例 "2026-11-26T04:16:00.000Z"。new Date(at) で日時になる）
//
//  最初の 仮のやりとりは chat-sample.js。中身を変えたら SAMPLE_VERSION を 1 つ上げる
//    （保存してある やりとり・見たかどうか・会話のピン止めが、最初の 1 回だけ 新しい仮のやりとりに 入れかわる）
//  localStorage … アプリを閉じても消えないメモ（その PC の中だけ。ログインしている人ごとに分ける）
//  ★ サーバーを使うようになったら、この 3 つの中身を、サーバーに聞く・送る形に書きかえる（使う側は そのまま）
// ═══════════════════════════════════════════════════════════════

import { sampleChats, sampleRoom, sampleCode, sampleStamps } from "./chat-sample.js";

const key = (me) => `zemi:friends:chat:${me ?? "guest"}`;   // ログインしている人ごとに分けて覚える

/** 見分けるための名前（時刻 ＋ でたらめな文字） */
export const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** 今から min 分前の日時（文字） */
const ago = (min) => new Date(Date.now() - min * 60 * 1000).toISOString();

/** 仮のやりとりの番号（chat-sample.js を変えたら 1 つ上げる） */
const SAMPLE_VERSION = 2;
const verKey = (me) => `zemi:friends:chat-ver:${me ?? "guest"}`;
/** 保存してある仮のやりとりが 古ければ、新しい仮のやりとりに 入れかえる（やりとり・見たかどうか・会話のピン止め） */
function ensureSample(me) {
  try {
    if (Number(localStorage.getItem(verKey(me))) >= SAMPLE_VERSION) return;
    const { chats, marks, pins } = sampleChats();
    localStorage.setItem(key(me), JSON.stringify(chats));
    localStorage.setItem(readKey(me), JSON.stringify(marks));
    localStorage.setItem(msgPinKey(me), JSON.stringify(pins));
    localStorage.setItem(verKey(me), String(SAMPLE_VERSION));
  } catch { /* 保存できなければ、そのつど 仮のやりとりを使う */ }
}

/** やりとり { 相手の userId: [メッセージ…] } */
export function loadChats(me) {
  ensureSample(me);
  ensureRooms(me);
  ensureExtras(me);
  try {
    const raw = localStorage.getItem(key(me));
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data)) return data;
    }
  } catch { /* 読めなければ、はじめの状態 */ }
  return sampleChats().chats;
}

function saveChats(me, chats) {
  try { localStorage.setItem(key(me), JSON.stringify(chats)); } catch { /* 覚えられなくても、今の画面には出る */ }
}

/** 1 つ送る（自分のメッセージを足して覚えておく）。新しい やりとりを返す */
export function sendMessage(me, chats, friendId, { type = "text", text = "", quiz = null, code = "", lang = "", stamp = "" }) {
  const msg = {
    id: newId(), from: "me", type, text,
    ...(type === "quiz" ? { quiz } : {}), ...(type === "code" ? { code, lang } : {}), ...(type === "stamp" ? { stamp } : {}),
    at: new Date().toISOString(),
  };
  const next = { ...chats, [friendId]: [...(chats[friendId] ?? []), msg] };
  saveChats(me, next);
  return next;
}

/** 自分が送った問題の一覧 [{ friendId, msg }]（新しい順） */
export function sentQuizzes(chats) {
  return Object.entries(chats)
    .flatMap(([friendId, list]) => list.filter((x) => x.from === "me" && x.type === "quiz").map((msg) => ({ friendId, msg })))
    .sort((a, b) => new Date(b.msg.at) - new Date(a.msg.at));
}

// ───────── 見たかどうか ─────────
const readKey = (me) => `zemi:friends:chat-read:${me ?? "guest"}`;

/** { 相手の userId: 最後に そのトークを開いた日時 }。まだ何もなければ、1 日前までのメッセージは見たことにしておく（仮のやりとり用） */
export function loadReadMarks(me) {
  ensureSample(me);
  ensureRooms(me);
  ensureExtras(me);
  try {
    const raw = localStorage.getItem(readKey(me));
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data === "object" && !Array.isArray(data)) return data;
    }
  } catch { /* 読めなければ、はじめの状態 */ }
  const dayAgo = ago(60 * 24);
  const marks = Object.fromEntries(Object.keys(loadChats(me)).map((id) => [id, dayAgo]));
  saveMarks(me, marks);
  return marks;
}
function saveMarks(me, marks) {
  try { localStorage.setItem(readKey(me), JSON.stringify(marks)); } catch { /* 覚えられなくても、今の画面では消える */ }
}

/** そのトークを開いた（今までのメッセージを見た） */
export function markRead(me, friendId) {
  const marks = { ...loadReadMarks(me), [friendId]: new Date().toISOString() };
  saveMarks(me, marks);
  return marks;
}

/** ぜんぶ見たことにする */
export function markAllRead(me) {
  const now = new Date().toISOString();
  const marks = Object.fromEntries(Object.keys(loadChats(me)).map((id) => [id, now]));
  saveMarks(me, { ...loadReadMarks(me), ...marks });
}

/** その人の まだ見ていない数（相手からのメッセージで、見た日時より あとのもの。見た日時がなければ ぜんぶ） */
export function unreadCount(list = [], mark) {
  const t = mark ? new Date(mark).getTime() : 0;
  return list.filter((m) => m.from === "friend" && new Date(m.at).getTime() > t).length;
}

/** まだ見ていないメッセージがある人 [{ friendId, count, last }]（いちばん新しいものが新しい順） */
export function unreadChats(me) {
  const chats = loadChats(me), marks = loadReadMarks(me);
  return Object.entries(chats)
    .map(([friendId, list]) => ({ friendId, count: unreadCount(list, marks[friendId]), last: list.filter((m) => m.from === "friend").at(-1) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => new Date(b.last.at) - new Date(a.last.at));
}

// ───────── グループ（自分で作る分類） ─────────
const groupKey = (me) => `zemi:friends:chat-groups:${me ?? "guest"}`;

/** グループの一覧 [{ id, name, members }]（作った順） */
export function loadGroups(me) {
  try {
    const data = JSON.parse(localStorage.getItem(groupKey(me)) ?? "[]");
    if (Array.isArray(data)) {
      return data.filter((g) => g && typeof g.id === "string" && typeof g.name === "string")
        .map((g) => ({ id: g.id, name: g.name, members: Array.isArray(g.members) ? g.members : [] }));
    }
  } catch { /* 読めなければ、なし */ }
  return [];
}
/** グループを覚えておく */
export function saveGroups(me, groups) {
  try { localStorage.setItem(groupKey(me), JSON.stringify(groups)); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
  return groups;
}
/** 新しいグループの id */
export const newGroupId = () => `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

// ───────── えらんでいる タブ ─────────
const tabKey = (me) => `zemi:friends:chat-tab:${me ?? "guest"}`;
export function loadChatTab(me) {
  try { return localStorage.getItem(tabKey(me)) || "all"; } catch { return "all"; }
}
export function saveChatTab(me, id) {
  try { localStorage.setItem(tabKey(me), id); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
}

// ───────── タブの ならび ─────────
const orderKey = (me) => `zemi:friends:chat-tab-order:${me ?? "guest"}`;
export function loadTabOrder(me) {
  try {
    const v = JSON.parse(localStorage.getItem(orderKey(me)) ?? "[]");
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch { return []; }
}
export function saveTabOrder(me, ids) {
  try { localStorage.setItem(orderKey(me), JSON.stringify(ids)); } catch { /* 覚えられなくても、今の画面では ならぶ */ }
  return ids;
}

// ───────── グループトーク ─────────
const roomKey = (me) => `zemi:friends:chat-rooms:${me ?? "guest"}`;

/** グループトークの一覧。まだ何も保存していなければ、仮のグループを 1 つ入れる（やりとり・見たかどうか・ピン止めも） */
export function loadRooms(me) {
  ensureSample(me);
  ensureRooms(me);
  ensureExtras(me);
  try {
    const raw = localStorage.getItem(roomKey(me));
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        return data.filter((r) => r && typeof r.id === "string" && typeof r.name === "string")
          .map((r) => ({ id: r.id, name: r.name, color: r.color || "#0ea5e9", members: Array.isArray(r.members) ? r.members : [] }));
      }
    }
  } catch { /* 読めなければ なし */ }
  return [];
}
/** あとから足した 仮のやりとり（コード）を、保存してある やりとりにも 1 回だけ 入れる（時刻の順に はさむ） */
/** あとから 足した 仮のもの（番号ごと。保存してある番号より 大きいものだけ 1 回 入れる） */
const EXTRAS = [
  { v: 1, list: sampleCode },     // プログラムのコード
  { v: 2, list: sampleStamps },   // スタンプ
];
const EXTRA_VERSION = EXTRAS.at(-1).v;
const extraKey = (me) => `zemi:friends:chat-extra:${me ?? "guest"}`;
function ensureExtras(me) {
  try {
    const done = Number(localStorage.getItem(extraKey(me))) || 0;
    if (done >= EXTRA_VERSION) return;
    const chats = JSON.parse(localStorage.getItem(key(me)) ?? "{}") ?? {};
    for (const { talk, msg } of EXTRAS.filter((x) => x.v > done).flatMap((x) => x.list())) {
      const list = Array.isArray(chats[talk]) ? chats[talk] : null;
      if (!list || list.some((m) => m.id === msg.id)) continue;   // その相手が いない・もう入っている
      chats[talk] = [...list, msg].sort((a, b) => new Date(a.at) - new Date(b.at));
    }
    localStorage.setItem(key(me), JSON.stringify(chats));
    localStorage.setItem(extraKey(me), String(EXTRA_VERSION));
  } catch { /* 入れられなければ そのまま */ }
}
/** はじめて（グループトークを まだ保存していない）なら、仮のグループを 1 つ入れる（今の やりとりは そのまま） */
function ensureRooms(me) {
  try {
    if (localStorage.getItem(roomKey(me)) !== null) return;
    const { room, list, mark, pins } = sampleRoom();
    const read = (k) => { try { const d = JSON.parse(localStorage.getItem(k) ?? "{}"); return d && typeof d === "object" && !Array.isArray(d) ? d : {}; } catch { return {}; } };
    const chats = read(key(me));
    if (!chats[room.id]) localStorage.setItem(key(me), JSON.stringify({ ...chats, [room.id]: list }));
    localStorage.setItem(readKey(me), JSON.stringify({ ...read(readKey(me)), [room.id]: mark }));
    localStorage.setItem(msgPinKey(me), JSON.stringify({ ...read(msgPinKey(me)), [room.id]: pins }));
    localStorage.setItem(roomKey(me), JSON.stringify([room]));
  } catch { /* 保存できなければ、仮のグループは なし */ }
}
/** グループトークを覚えておく */
export function saveRooms(me, rooms) {
  try { localStorage.setItem(roomKey(me), JSON.stringify(rooms)); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
  return rooms;
}
/** 新しいグループトークの id */
export const newRoomId = () => `grp:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/** お知らせを 1 つ足す（「〇〇さんを 追加しました」など） */
export function addNotice(me, chats, id, text) {
  const msg = { id: newId(), from: "system", type: "system", text, at: new Date().toISOString() };
  const next = { ...chats, [id]: [...(chats[id] ?? []), msg] };
  saveChats(me, next);
  return next;
}
/** そのトークの やりとりを 消す */
export function removeTalk(me, chats, id) {
  const next = { ...chats };
  delete next[id];
  saveChats(me, next);
  return next;
}

// ───────── 右の列を 出すか ─────────
const filesKey = (me) => `zemi:friends:chat-files:${me ?? "guest"}`;
export function loadFilesOpen(me) {
  try { return localStorage.getItem(filesKey(me)) !== "0"; } catch { return true; }
}
export function saveFilesOpen(me, open) {
  try { localStorage.setItem(filesKey(me), open ? "1" : "0"); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
}

// ───────── 会話（メッセージ）のピン止め ─────────
const msgPinKey = (me) => `zemi:friends:chat-msgpin:${me ?? "guest"}`;

/** { 相手の userId: [メッセージの id…] }（あとから ピン止めしたものほど 前） */
export function loadMsgPins(me) {
  ensureSample(me);
  ensureRooms(me);
  ensureExtras(me);
  try {
    const data = JSON.parse(localStorage.getItem(msgPinKey(me)) ?? "{}");
    if (data && typeof data === "object" && !Array.isArray(data)) return data;
  } catch { /* 読めなければ、なし */ }
  return {};
}

/** メッセージを ピン止めする・外す */
export function toggleMsgPin(me, friendId, msgId) {
  const all = loadMsgPins(me);
  const list = Array.isArray(all[friendId]) ? all[friendId] : [];
  const next = { ...all, [friendId]: list.includes(msgId) ? list.filter((x) => x !== msgId) : [msgId, ...list] };
  try { localStorage.setItem(msgPinKey(me), JSON.stringify(next)); } catch { /* 覚えられなくても、今の画面では切りかわる */ }
  return next;
}
