// ═══════════════════════════════════════════════════════════════
//  フレンド：チャット（LINE のような やりとり）　★ 今はサーバーがないので、相手には届かない（その PC の中に保存）
//  フレンドのページ（main.jsx）の「チャット」で出す。見た目は chat.css
//    <Chat user={ログインしている人} friends={フレンドの一覧} start={{ userId, compose }} favorites={お気に入りの Set} onFav={(userId) => 切りかえ}
//          onDetail={(userId) => フレンド詳細を開く} />
//  ページの左右いっぱい・下までを使う（外の枠なし。列のさかいは線だけ。見た目は chat.css）
//      start … 最初に開くトーク（フレンド詳細の「チャットする」「問題を送る」から来たとき）。compose: true なら 問題を作る画面も開く
//
//  形：3 列
//    左       … トークの一覧：フレンドごと ・ グループトークごとの いちばん新しいメッセージと時刻（新しい順）。押すと まん中に やりとり
//               見出しの右の「＋」で グループトーク（何人かの フレンドと 1 つのトークで話す）を作る（RoomEditor。名前と メンバー）
//               グループトークの上の「設定」で、名前を変える・メンバーを足す／外す・グループから ぬける
//               いちばん上の けんさく欄：名前か 会話の文で さがす。会話で見つかったら その文を出し、押すと その会話へ 飛ぶ
//               まだ見ていないメッセージがあれば、緑の丸に数。トークを開くと 見たことになる（chat-store.js の markRead）
//               上のタブで しぼれる：すべて ／ ★ お気に入り ／ 未読 ／ オンライン ／ グループトーク ／ 自分で作った分類（例：クラス・部活）
//                 タブは フレンドの画面の タブ（チャット ／ フレンド一覧 ／ フレンドを追加）の すぐ下に、横いっぱいの 1 行で出す
//                 入りきらない分は 横にスクロール（ホイールでも動く。続きがある はしは うすく消える）
//                 分類は「＋」で作る。分類のタブを えらぶと、名前を変える・消すボタン（chat-store.js の loadGroups・saveGroups）
//                 だれを どの分類に入れるかは、まん中の上（相手の名前の右）の「分類」ボタン（タグのしるし）で えらぶ
//               お気に入り：フレンドのお気に入り（favorites.js。ホームの最初の広場・掲示板と同じ）。名前の横に ★
//                 行にマウスをのせると（キーボードで えらんでも）右に ☆ のボタン。まん中の上にも「お気に入り」ボタン
//    まん中   … やりとり：自分は右がわの青い吹き出し、相手は左がわの白い吹き出し。日付の区切りと時刻
//               上の右はしの 丸いボタン：分類 ・ お気に入り ・ 詳細（フレンド詳細へ。グループトークなら 設定） ・ 右の列を 出す／かくす（その PC に覚える）
//               グループトークでは、相手の吹き出しの上に 送った人の名前。お知らせ（「〇〇さんを 追加しました」など）は まん中に 小さく
//               下の入力欄：Enter で送信・Shift + Enter で改行。左の ＋ →「問題を送る」で 問題を作る画面（QuizComposer）
//               問題は カードで出る。押すと中身（自分が送った問題なら 正解も）
//               プログラムのコード：＋ →「コードを送る」（CodeComposer。言語・コード・ひとこと。Tab で字下げ・Ctrl + Enter で送る）
//                 ふつうの入力欄でも ``` と ``` で かこむと コードになる（```python のように 言語名も書ける。かこみの外の文は ひとこと）
//                 コードの吹き出し（CodeBlock）：行番号つき。上の「すべてコピー」、行に マウスをのせると 右に「コピー」、行番号を押しても その行をコピー
//               会話のピン止め：吹き出しにマウスをのせると 横に ピンのボタン（ピン止めしたものは いつも青いピン）
//                 ピン止めしたものは 右の列の上に 一覧で出る（chat-store.js の toggleMsgPin）
//    右       … 上下 2 つ（それぞれ 多いときは 中だけスクロール）
//               上：ピン止め … ピン止めした会話（あとから ピン止めしたものほど 上。何日の会話か・だれ・文）。押すと その会話へ 飛ぶ。× で外す
//               下：やりとりしたもの … タブで切りかえ「すべて ／ 送ったもの ／ 届いたもの」
//                 今のトークの人と 送り合ったもの（今は問題だけ。新しい順。題名・何日・問題数）
//                 押すと中身（送った問題は正解つき。届いた問題は正解を出さない）と「トークで見る」（やりとりの その問題のところへ）
//  飛んだとき（ピン止め・「トークで見る」）は、その会話を光らせて、やりとりの上に「〇月〇日（〇）の会話」と出す
//  やりとりの 日付の区切りは、スクロールしても 上に のこる（今 何日の会話を見ているか わかるように）
//               ★ あとで ファイルなどを送れるようになったら、ここに いっしょに ならべる
//  やりとりの保存は chat-store.js（localStorage。ログインしている人ごと）。相手からの返事は まだない
// ═══════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "../../core/components/Icon";
import { lastLoginText } from "./friends-sample.js";
import { notify } from "../../core/utils/notify.js";
import { CHOICE_MARKS } from "./mail-sample.js";
import { loadChats, sendMessage, loadReadMarks, markRead, unreadCount, loadMsgPins, toggleMsgPin, loadGroups, saveGroups, newGroupId, loadChatTab, saveChatTab, loadFilesOpen, saveFilesOpen, loadRooms, saveRooms, newRoomId, addNotice, removeTalk } from "./chat-store.js";
import QuizView from "./quiz-view.jsx";
import "./chat.css";

const MAX_TEXT = 2000;      // 1 つのメッセージの いちばん長い文字数（``` で かこんだ コードも 入るように 長め）
const MAX_CODE = 6000;      // 1 つのコードの いちばん長い文字数
/** コードの 言語（えらべるもの） */
const LANGS = ["Python", "JavaScript", "HTML", "CSS", "Java", "C", "その他"];
/** ``` の あとに書いた 言語名 → 表示する名前 */
const LANG_ALIAS = { py: "Python", python: "Python", js: "JavaScript", javascript: "JavaScript", html: "HTML", css: "CSS", java: "Java", c: "C" };
const MAX_QUESTIONS = 5;    // 1 回で送れる問題の数
const WEEK = "日月火水木金土";
const MAX_GROUPS = 10;      // 作れる分類の数
const MAX_GROUP_NAME = 12;  // 分類の名前の いちばん長い文字数
const MAX_ROOM_NAME = 20;   // グループトークの名前の いちばん長い文字数
/** グループトークの色（作った順に つかう） */
const ROOM_COLORS = ["#0ea5e9", "#8b5cf6", "#f97316", "#14b8a6", "#ec4899", "#84cc16"];
/** トークの一覧の 決まったタブ（このあとに 自分で作ったグループが ならぶ） */
const BASE_TABS = [
  { id: "all", name: "すべて" },
  { id: "fav", name: "お気に入り", mark: "★" },
  { id: "unread", name: "未読" },
  { id: "online", name: "オンライン" },
  { id: "rooms", name: "グループ", icon: "friends" },
];
/** 右の「やりとりしたもの」の タブ（me ＝ 送ったもの、friend ＝ 届いたもの） */
const FILE_TABS = [
  { id: "all", name: "すべて", none: "まだ 送り合ったものは ありません。入力欄の左の ＋ から 問題を送れます。" },
  { id: "me", name: "送ったもの", none: "まだ送ったものはありません。入力欄の左の ＋ から 問題を送れます。" },
  { id: "friend", name: "届いたもの", none: "まだ届いたものはありません。" },
];

// ───────── 日時の書き方 ─────────
const pad = (n) => String(n).padStart(2, "0");
const hm = (d) => `${d.getHours()}:${pad(d.getMinutes())}`;
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
/** 今日から何日前か（0 ＝ 今日、1 ＝ 昨日） */
const daysAgo = (d) => {
  const a = new Date(d); a.setHours(0, 0, 0, 0);
  const b = new Date(); b.setHours(0, 0, 0, 0);
  return Math.round((b - a) / 86400000);
};
/** 日付の区切り：「今日」「昨日」「11月24日（火）」 */
function dayLabel(d) {
  const n = daysAgo(d);
  if (n === 0) return "今日";
  if (n === 1) return "昨日";
  const y = d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}年` : "";
  return `${y}${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`;
}
/** 一覧の時刻：今日なら「13:16」、昨日なら「昨日」、それより前は「11/24」 */
function shortTime(d) {
  const n = daysAgo(d);
  if (n === 0) return hm(d);
  if (n === 1) return "昨日";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
/** 何日の会話か：「11月24日（火）9:03」（去年より前なら 年も） */
const dateLabel = (d) => {
  const y = d.getFullYear() !== new Date().getFullYear() ? `${d.getFullYear()}年` : "";
  return `${y}${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）${hm(d)}`;
};
/** くわしい日時：「2026/11/26（木）9:42」 */
const fullTime = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}（${WEEK[d.getDay()]}）${hm(d)}`;
/** 一覧に出す 1 行の文 */
const preview = (msg, nameOf = () => "") => {
  if (msg.from === "system") return msg.text ?? "";
  const head = msg.from === "me" ? "あなた：" : msg.by ? `${nameOf(msg.by)}：` : "";   // グループトークでは 送った人の名前も
  if (msg.type === "quiz") return `${head}問題「${msg.quiz?.title ?? ""}」を送りました`;
  if (msg.type === "code") return `${head}コード（${msg.lang || "その他"}）を送りました`;
  return `${head}${(msg.text ?? "").replace(/\n/g, " ")}`;
};
/** 1 行で あらわす 中身（ピン止めの一覧など） */
const summary = (msg) => (msg.type === "quiz" ? `問題「${msg.quiz?.title ?? ""}」`
  : msg.type === "code" ? `コード（${msg.lang || "その他"}・${lineCount(msg.code)}行）${msg.text ? ` ${msg.text}` : ""}` : msg.text);
const lineCount = (code = "") => code.replace(/\n+$/, "").split("\n").length;

/** ``` で かこんだ コードを 見つける（なければ null）。かこみの外の文は ひとこと */
function parseFence(text) {
  const m = text.match(/```([^\n`]*)\n([\s\S]*?)\n?```/);
  if (!m) return null;
  const code = m[2].replace(/\s+$/, "");
  if (!code.trim()) return null;
  const tag = m[1].trim().toLowerCase();
  const note = (text.slice(0, m.index) + " " + text.slice(m.index + m[0].length)).replace(/\s+/g, " ").trim();
  return { type: "code", code, lang: LANG_ALIAS[tag] ?? (tag ? m[1].trim() : "その他"), text: note };
}

/** 文字を クリップボードに コピーする（できなければ 古いやり方で） */
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch { /* 下の やり方で */ }
  try {
    const t = document.createElement("textarea");
    t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
    document.body.append(t); t.select();
    const ok = document.execCommand("copy");
    t.remove();
    return ok;
  } catch { return false; }
}

/** 頭文字の丸（グループトークは 人のしるし） */
function Avatar({ t, small = false }) {
  return (
    <span className={`fr-avatar${small ? " is-small" : ""}${t.room ? " is-room" : ""}`} style={{ "--c": t.color }}>
      {t.room ? <Icon name="friends" /> : t.name.slice(0, 1)}
      {!t.room && t.online && <i aria-label="オンライン" />}
    </span>
  );
}

export default function Chat({ user, friends, start, favorites = new Set(), onFav, onDetail }) {
  const me = user?.userId;
  const [chats, setChats] = useState(() => loadChats(me));   // { 相手の userId: [メッセージ…] }
  const [compose, setCompose] = useState(() => (start?.compose ? "quiz" : null));   // 開いている 作る画面："quiz"（問題） ／ "code"（コード） ／ null
  const [view, setView] = useState(null);                     // 中身を見ている問題（メッセージ）
  const [jump, setJump] = useState(null);                     // { id, n } … やりとりの そのメッセージのところへ スクロール（n は 同じものでも動くように）

  // グループトーク（chat-store.js の loadRooms）
  const [rooms, setRoomsState] = useState(() => loadRooms(me));
  const setRooms = (next) => setRoomsState(saveRooms(me, next));
  const [roomEdit, setRoomEdit] = useState(null);   // 作る・設定の画面：{ room: null（作る） か グループ }
  // トークの相手：フレンド と グループトーク（同じ形にそろえる。call は「〇〇 さん」「「〇〇」」の よび方）
  const nameOf = (userId) => friends.find((f) => f.userId === userId)?.name ?? userId;
  const targets = [
    ...friends.map((f) => ({ ...f, call: `${f.name} さん` })),
    ...rooms.map((r) => ({
      userId: r.id, name: r.name, color: r.color, room: r, call: `「${r.name}」`,
      online: r.members.some((id) => friends.find((f) => f.userId === id)?.online),
    })),
  ];
  const friendOf = (id) => targets.find((f) => f.userId === id);
  // 会話（メッセージ）のピン止め { 相手の userId: [メッセージの id…] }
  const [msgPins, setMsgPins] = useState(() => loadMsgPins(me));
  const flipMsgPin = (msgId) => setMsgPins(toggleMsgPin(me, currentId, msgId));
  // トークの一覧：いちばん新しいメッセージが新しい順
  const time = (msg) => (msg ? new Date(msg.at).getTime() : 0);
  const talks = targets
    .map((f) => ({ f, last: (chats[f.userId] ?? []).at(-1) }))
    .sort((a, b) => time(b.last) - time(a.last));
  const [currentId, setCurrentId] = useState(() => start?.userId ?? talks[0]?.f.userId ?? null);
  const current = friendOf(currentId);
  // グループ（自分で作る分類）と、えらんでいる タブ
  const [groups, setGroupsState] = useState(() => loadGroups(me));
  const setGroups = (next) => setGroupsState(saveGroups(me, next));
  const [tab, setTabState] = useState(() => loadChatTab(me));
  const setTab = (id) => { setTabState(id); saveChatTab(me, id); };
  const group = groups.find((g) => g.id === tab);
  const tabId = BASE_TABS.some((t) => t.id === tab) || group ? tab : "all";   // 消したグループを えらんでいたら「すべて」
  // 右：今のトークの人と やりとりしたもの（送った・届いた。今は問題だけ。新しい順）
  const files = (chats[currentId] ?? []).filter((x) => x.type === "quiz" || x.type === "code").reverse();   // 問題と コード
  const [fileTab, setFileTab] = useState("all");   // 右のタブ："all" ／ "me" ／ "friend"
  // ピン止めした会話（あとから ピン止めしたものほど 前）
  const pinnedMsgs = (msgPins[currentId] ?? []).map((id) => (chats[currentId] ?? []).find((m) => m.id === id)).filter(Boolean);
  const fileCount = (id) => (id === "all" ? files.length : files.filter((m) => m.from === id).length);
  // 見たかどうか：トークを開いたら（切りかえたら）見たことにする
  const [marks, setMarks] = useState(() => loadReadMarks(me));
  useEffect(() => { if (currentId) setMarks(markRead(me, currentId)); }, [me, currentId]);
  const unreadOf = (f) => (f.userId === currentId ? 0 : unreadCount(chats[f.userId], marks[f.userId]));

  // タブで しぼる
  const inTab = (id, f) => {
    if (id === "fav") return favorites.has(f.userId);
    if (id === "unread") return unreadOf(f) > 0;
    if (id === "online") return !f.room && !!f.online;
    if (id === "rooms") return !!f.room;
    const g = groups.find((x) => x.id === id);
    return g ? g.members.includes(f.userId) : true;
  };
  // けんさく：名前か 会話の文で さがす（会話で見つかったら、いちばん新しいものを hit に）
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const textOf = (m) => (m.type === "quiz" ? `${m.quiz?.title ?? ""} ${m.text ?? ""}` : m.type === "code" ? `${m.code ?? ""} ${m.text ?? ""}` : m.text ?? "").toLowerCase();
  const shownTalks = talks.filter(({ f }) => inTab(tabId, f)).map((t) => {
    if (!query) return t;
    if (t.f.name.toLowerCase().includes(query)) return t;
    const hit = (chats[t.f.userId] ?? []).filter((m) => textOf(m).includes(query)).at(-1);
    return hit ? { ...t, hit } : null;
  }).filter(Boolean);
  // 右の列を 出すか（その PC に覚える）
  const [filesOpen, setFilesOpenState] = useState(() => loadFilesOpen(me));
  const toggleFiles = () => setFilesOpenState((v) => { saveFilesOpen(me, !v); return !v; });
  const tabs = [...BASE_TABS, ...groups.map((g) => ({ id: g.id, name: g.name, group: true }))];

  // ── グループを作る・名前を変える・消す・人を入れる ──
  /** 名前のチェック（だめなら理由。よければ ""） */
  const nameError = (name, exceptId = null) => {
    const n = name.trim();
    if (!n) return "名前を入れてください。";
    if (BASE_TABS.some((t) => t.name === n) || groups.some((g) => g.id !== exceptId && g.name === n)) return "同じ名前の 分類が あります。";
    return "";
  };
  /** グループを作る（withCurrent … 今のトークの人を はじめから入れる） */
  const addGroup = (name, withCurrent = false) => {
    const g = { id: newGroupId(), name: name.trim(), members: withCurrent && currentId ? [currentId] : [] };
    setGroups([...groups, g]);
    return g;
  };
  const renameGroup = (id, name) => setGroups(groups.map((g) => (g.id === id ? { ...g, name: name.trim() } : g)));
  const removeGroup = (id) => { setGroups(groups.filter((g) => g.id !== id)); if (tab === id) setTab("all"); };
  const toggleMember = (id, userId) => setGroups(groups.map((g) => (g.id !== id ? g
    : { ...g, members: g.members.includes(userId) ? g.members.filter((x) => x !== userId) : [...g.members, userId] })));

  /** 今のトークの相手に 1 つ送る */
  const send = (payload) => { setChats(sendMessage(me, chats, currentId, payload)); setJump(null); };   // 送ったら いちばん下へ
  /** トークを切りかえる */
  const openTalk = (userId) => { setCurrentId(userId); setJump(null); };
  /** やりとりの そのメッセージのところへ */
  const jumpTo = (id) => setJump({ id, n: Date.now() });

  // ── グループトークを作る・変える・ぬける ──
  const myName = user?.name || me || "あなた";
  const names = (ids) => ids.map(nameOf).join("・");
  /** 作る：名前と メンバー → そのトークを開く */
  const createRoom = ({ name, members }) => {
    const room = { id: newRoomId(), name, members, color: ROOM_COLORS[rooms.length % ROOM_COLORS.length] };
    setRooms([...rooms, room]);
    setChats(addNotice(me, chats, room.id, `${myName} さんが グループ「${name}」を作りました（メンバー：${names(members)}）`));
    openTalk(room.id);
  };
  /** 変える：名前・メンバー（変わったことは お知らせにする） */
  const updateRoom = (room, { name, members }) => {
    let next = chats;
    if (name !== room.name) next = addNotice(me, next, room.id, `グループの名前を「${name}」に 変えました`);
    const added = members.filter((id) => !room.members.includes(id));
    const removed = room.members.filter((id) => !members.includes(id));
    if (added.length) next = addNotice(me, next, room.id, `${names(added)} さんを 追加しました`);
    if (removed.length) next = addNotice(me, next, room.id, `${names(removed)} さんを グループから 外しました`);
    setChats(next);
    setRooms(rooms.map((r) => (r.id === room.id ? { ...r, name, members } : r)));
  };
  /** ぬける：グループと そのやりとりを 消す（この PC の中から） */
  const leaveRoom = (room) => {
    setRooms(rooms.filter((r) => r.id !== room.id));
    setChats(removeTalk(me, chats, room.id));
    setGroups(groups.map((g) => ({ ...g, members: g.members.filter((x) => x !== room.id) })));
    setCurrentId(talks.find((t) => t.f.userId !== room.id)?.f.userId ?? null);
  };

  return (
    <>
    {/* ── いちばん上（フレンドの画面の タブの すぐ下）：分類のタブを 横いっぱいの 1 行で。分類を えらんでいるときは 右に 名前を変える・消す ── */}
    <div className="ch-catbar">
      <TalkTabs tabs={tabs} current={tabId} onSelect={setTab}
        count={(id) => talks.filter(({ f }) => inTab(id, f)).length}
        canAdd={groups.length < MAX_GROUPS} nameError={nameError}
        onAdd={(name) => setTab(addGroup(name).id)} />
      {group && <GroupBar key={group.id} group={group} nameError={nameError} onRename={(name) => renameGroup(group.id, name)} onRemove={() => removeGroup(group.id)} />}
    </div>
    <section className={`ch${filesOpen ? "" : " is-files-hidden"}`}>
      {/* ── 左：トークの一覧 ── */}
      <aside className="ch-side">
        <h2 className="ch-col-title"><Icon name="chat" />トーク<span className="ch-count">{talks.length}</span>
          <button type="button" className="ch-new-room" onClick={() => setRoomEdit({ room: null })} title="グループトークを作る（何人かの フレンドと 話す）">
            <Icon name="plus" />グループ
          </button>
        </h2>
        <div className="ch-search">
          <Icon name="search" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="名前・会話を さがす" aria-label="トークを さがす（名前・会話）"
            onKeyDown={(e) => { if (e.key === "Escape" && q) { e.preventDefault(); e.stopPropagation(); setQ(""); } }} />
          {q && <button type="button" className="ch-search-x" onClick={() => setQ("")} aria-label="けんさくを消す" title="けんさくを消す"><Icon name="close" /></button>}
        </div>
        {shownTalks.length === 0 ? (
          query ? <p className="ch-none">「{q.trim()}」は 見つかりませんでした。</p> :
          <p className="ch-none">{{
            fav: "お気に入りの人は いません。行の ☆ や、トークの上の「お気に入り」で 入れられます。",
            unread: "まだ見ていない トークは ありません。",
            online: "今 オンラインの人は いません。",
            rooms: "グループトークは ありません。上の「＋ グループ」で 作れます。",
          }[tabId] ?? "この分類には まだ だれもいません。トークの上の「分類」ボタン（タグのしるし）で 入れられます。"}</p>
        ) : (
        <ul className="ch-list" aria-label="トークの一覧">
          {shownTalks.map(({ f, last, hit }) => {
            const fav = favorites.has(f.userId);
            return (
            <li key={f.userId} className="ch-talk">
              <button type="button" className={`ch-row${f.userId === currentId ? " is-active" : ""}`} style={{ "--c": f.color }}
                aria-current={f.userId === currentId ? "true" : undefined} onClick={() => { openTalk(f.userId); if (hit) jumpTo(hit.id); }}>
                <Avatar t={f} />
                <span className="ch-row-main">
                  <span className="ch-row-top">
                    <b>{f.name}</b>
                    {f.room && <span className="ch-room-n" title={`メンバー：あなた・${names(f.room.members)}`}>{f.room.members.length + 1}</span>}
                    {fav && <span className="ch-mark is-fav" title="お気に入り" aria-label="お気に入り">★</span>}
                    {(hit ?? last) && <time>{shortTime(new Date((hit ?? last).at))}</time>}
                  </span>
                  <span className="ch-row-bottom">
                    {hit
                      ? <small className="ch-hit"><Highlight text={hit.type === "code" ? (hit.code.split("\n").find((l) => l.toLowerCase().includes(query)) ?? summary(hit)) : summary(hit)} q={q.trim()} /></small>
                      : <small>{last ? preview(last, nameOf) : "まだ やりとりはありません"}</small>}
                    {unreadOf(f) > 0 && <span className="ch-unread" aria-label="まだ見ていないメッセージ">{unreadOf(f)}</span>}
                  </span>
                </span>
              </button>
              {/* マウスをのせると出る ボタン（お気に入り） */}
              {!f.room && (
                <span className="ch-talk-btns">
                  <FavButton on={fav} name={f.name} onClick={() => onFav?.(f.userId)} />
                </span>
              )}
            </li>
            );
          })}
        </ul>
        )}
      </aside>

      {/* ── まん中：やりとり ── */}
      <div className="ch-main">
        {current
          ? <Thread key={current.userId} friend={current} nameOf={nameOf} people={friends} list={chats[current.userId] ?? []} jumpId={jump?.id} jumpKey={jump?.n}
              onSend={send} onCompose={(kind) => setCompose(kind)} onView={setView}
              pinnedIds={msgPins[current.userId] ?? []} onPinMsg={flipMsgPin}
              tools={<>
                <GroupMenu friend={current} groups={groups} canAdd={groups.length < MAX_GROUPS} nameError={nameError}
                  onToggle={(id) => toggleMember(id, current.userId)} onAdd={(name) => addGroup(name, true)} />
                {!current.room && <FavButton round on={favorites.has(current.userId)} name={current.name} onClick={() => onFav?.(current.userId)} />}
                {current.room && (
                  <button type="button" className="ch-tool is-round" onClick={() => setRoomEdit({ room: current.room })}
                    title={`グループ${current.call}の 設定（名前・メンバー・ぬける）`} aria-label={`グループ${current.call}の 設定`}><Icon name="settings" /></button>
                )}
                {!current.room && onDetail && (
                  <button type="button" className="ch-tool is-round" onClick={() => onDetail(current.userId)}
                    title={`${current.name} さんの くわしい様子（フレンド詳細）`} aria-label={`${current.name} さんの フレンド詳細を見る`}><Icon name="info" /></button>
                )}
                <span className="ch-tool-sep" aria-hidden="true" />
                <button type="button" className={`ch-tool is-round${filesOpen ? " is-on" : ""}`} onClick={toggleFiles} aria-pressed={filesOpen}
                  title={filesOpen ? "右の列（ピン止め・やりとりしたもの）を かくす" : "右の列（ピン止め・やりとりしたもの）を 出す"}
                  aria-label="右の列（ピン止め・やりとりしたもの）を 出す・かくす"><Icon name="panelRight" /></button>
              </>} />
          : <p className="ch-empty"><Icon name="chat" />左のトークを えらんでください。</p>}
      </div>

      {/* ── 右：上 ＝ ピン止めした会話 ・ 下 ＝ 今の人と やりとりしたもの（タブ：すべて ・ 送ったもの ・ 届いたもの） ── */}
      <aside className="ch-files" aria-label="ピン止めと やりとりしたもの" hidden={!filesOpen}>
        <section className={`ch-files-part is-pins${pinnedMsgs.length ? "" : " is-empty"}`} aria-label="ピン止めした会話">
          <h2 className="ch-col-title"><Icon name="pin" />ピン止め<span className="ch-count">{pinnedMsgs.length}</span></h2>
          {pinnedMsgs.length === 0 ? <p className="ch-none">ピン止めした会話は ありません。吹き出しに マウスをのせると出る ピンで ピン止めできます。</p> : (
            <ul className="ch-list ch-file-list">
              {pinnedMsgs.map((msg) => (
                <li key={msg.id} className="ch-pin-card">
                  <button type="button" className="ch-file is-pin" onClick={() => jumpTo(msg.id)} title="この会話へ 飛ぶ">
                    <span className="ch-file-pin"><Icon name="pin" /></span>
                    <small className="ch-file-date">{dateLabel(new Date(msg.at))}</small>
                    <b className="ch-file-who">{msg.from === "me" ? "あなた" : msg.by ? nameOf(msg.by) : current?.name}</b>
                    <span className="ch-file-text">{summary(msg)}</span>
                    <span className="ch-file-go">この会話へ ›</span>
                  </button>
                  <button type="button" className="ch-pin-x" onClick={() => flipMsgPin(msg.id)} aria-label="ピン止めを外す" title="ピン止めを外す"><Icon name="close" /></button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="ch-files-part is-shared" aria-label="やりとりしたもの">
          <h3 className="ch-part-title"><Icon name="list" />やりとりしたもの<span className="ch-count">{files.length}</span></h3>
          <div className="ch-file-tabs" role="tablist" aria-label="やりとりしたものの切りかえ">
            {FILE_TABS.map((t) => (
              <button key={t.id} type="button" role="tab" aria-selected={fileTab === t.id}
                className={`ch-tab${fileTab === t.id ? " is-active" : ""}`} onClick={() => setFileTab(t.id)}>
                {t.name}<span className="ch-tab-n">{fileCount(t.id)}</span>
              </button>
            ))}
          </div>
          {(() => {
            const list = fileTab === "all" ? files : files.filter((m) => m.from === fileTab);
            const tabInfo = FILE_TABS.find((t) => t.id === fileTab);
            return list.length === 0 ? <p className="ch-none">{tabInfo.none}</p> : (
              <ul className="ch-list ch-file-list" aria-label={`${tabInfo.name}の一覧`}>
                {list.map((msg) => (
                  <li key={msg.id}>
                    <button type="button" className={`ch-file${view?.id === msg.id ? " is-active" : ""}`} onClick={() => setView(msg)}>
                      <span className={`fr-kind is-${msg.type}`}><Icon name={msg.type === "code" ? "programming" : "quiz"} /></span>
                      <b>{msg.type === "code" ? `${msg.lang || "その他"} の コード` : msg.quiz.title}</b>
                      <small>
                        {fileTab === "all" && <span className={`ch-dir is-${msg.from}`}>{msg.from === "me" ? "送った" : "届いた"}</span>}
                        {msg.type === "code" ? `コード ・ ${lineCount(msg.code)}行` : `問題 ・ ${msg.quiz.questions.length}問`} ・ {dateLabel(new Date(msg.at))}
                      </small>
                    </button>
                  </li>
                ))}
              </ul>
            );
          })()}
        </section>
      </aside>

      {compose === "quiz" && current && (
        <QuizComposer friend={current} onClose={() => setCompose(null)} onSend={(payload) => { send(payload); setJump(null); }} />
      )}
      {compose === "code" && current && (
        <CodeComposer friend={current} onClose={() => setCompose(null)} onSend={(payload) => { send(payload); setJump(null); }} />
      )}
      {roomEdit && (
        <RoomEditor room={roomEdit.room} friends={friends} nameOf={nameOf} onClose={() => setRoomEdit(null)}
          onSave={(data) => { if (roomEdit.room) updateRoom(roomEdit.room, data); else createRoom(data); setRoomEdit(null); }}
          onLeave={roomEdit.room ? () => { leaveRoom(roomEdit.room); setRoomEdit(null); } : null} />
      )}
      {view && (
        <Modal icon={view.type === "code" ? "programming" : "quiz"} wide={view.type === "code"}
          title={`${view.from === "me" ? `${current?.call ?? ""}へ 送った` : `${view.by ? `${nameOf(view.by)} さん` : current?.call ?? ""}からの`}${view.type === "code" ? "コード" : "問題"}`}
          onClose={() => setView(null)} closeOnBackdrop
          foot={<>
            <span className="ch-modal-when">{fullTime(new Date(view.at))} に{view.from === "me" ? "送信" : "受信"}</span>
            <button type="button" className="btn" onClick={() => { jumpTo(view.id); setView(null); }}><Icon name="chat" />トークで見る</button>
            <button type="button" className="btn btn-primary" onClick={() => setView(null)}>とじる</button>
          </>}>
          {view.type === "code"
            ? <>{view.text && <p className="ch-code-note">{view.text}</p>}<CodeBlock msg={view} big /></>
            : <QuizView quiz={view.quiz} note={view.text} showAnswer={view.from === "me"} canSolve={view.from === "friend"} />}
        </Modal>
      )}
    </section>
    </>
  );
}

// ───────── トーク（やりとりと入力欄） ─────────
function Thread({ friend: f, nameOf = () => "", people = [], list, jumpId, jumpKey, onSend, onCompose, onView, tools, pinnedIds = [], onPinMsg }) {
  const bodyRef = useRef(null);
  const inputRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [menu, setMenu] = useState(false);   // ＋ のメニュー
  const menuRef = useRef(null);

  // 開いたとき・送ったとき：いちばん下へ（jumpId があれば、そのメッセージのところへ）
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    const target = jumpId && el.querySelector(`[data-id="${jumpId}"]`);
    if (target) el.scrollTop += target.getBoundingClientRect().top - el.getBoundingClientRect().top - (el.clientHeight - target.offsetHeight) / 2;   // やりとりの まん中へ（ページは うごかさない）
    else el.scrollTop = el.scrollHeight;
  }, [list.length, jumpId, jumpKey]);
  // 飛んだときは、やりとりの上に「〇月〇日（〇）の会話」と 少しのあいだ出す
  const [jumpLabel, setJumpLabel] = useState(null);
  useEffect(() => {
    const m = jumpId && list.find((x) => x.id === jumpId);
    if (!m) { setJumpLabel(null); return; }
    const d = new Date(m.at);
    setJumpLabel({ text: `${dayLabel(d) === "今日" || dayLabel(d) === "昨日" ? `${dayLabel(d)}・` : ""}${dateLabel(d)} の会話`, key: jumpKey });
    const t = setTimeout(() => setJumpLabel(null), 3000);
    return () => clearTimeout(t);
  }, [jumpId, jumpKey]);

  // ＋ のメニューの外を押したら とじる
  useEffect(() => {
    if (!menu) return;
    const off = (e) => { if (!menuRef.current?.contains(e.target)) setMenu(false); };
    document.addEventListener("mousedown", off);
    return () => document.removeEventListener("mousedown", off);
  }, [menu]);

  /** 入力欄の高さを 文の長さに合わせる（5 行くらいまで） */
  const fit = () => {
    const t = inputRef.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${Math.min(t.scrollHeight, 128)}px`;
  };
  useEffect(fit, [draft]);

  const submit = (e) => {
    e?.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(parseFence(draft) ?? { type: "text", text });   // ``` で かこんでいたら コード
    setDraft("");
    inputRef.current?.focus();
  };
  /** Enter で送信・Shift + Enter で改行（日本語を変換している あいだの Enter は 送らない） */
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && e.keyCode !== 229) submit(e);
  };

  // 日付の区切りを入れながら ならべる。相手のメッセージは、続いているときは 頭文字の丸を 1 回だけ
  // 日ごとに まとめる（日付の区切りは その日の中だけ 上に のこる。次の日が来たら 押し出される）
  //   相手のメッセージは、続いているときは 頭文字の丸を 1 回だけ
  const days = [];
  let lastFrom = null;
  for (const msg of list) {
    const d = new Date(msg.at);
    const k = dayKey(d);
    let day = days.at(-1);
    if (!day || day.key !== k) { day = { key: k, date: d, items: [] }; days.push(day); lastFrom = null; }
    // お知らせ（グループを作った・メンバーを足した など）：まん中に 小さく
    if (msg.from === "system") {
      day.items.push(<li key={msg.id} className="ch-notice" data-id={msg.id}><span>{msg.text}</span><time dateTime={msg.at}>{hm(d)}</time></li>);
      lastFrom = null;
      continue;
    }
    // 送った人（グループトークでは by。続いているときは 頭文字の丸と名前を 1 回だけ）
    const sender = msg.by ? (people.find((p) => p.userId === msg.by) ?? { name: nameOf(msg.by), color: "#94a3b8" }) : f;
    const fromKey = msg.from === "friend" ? `f:${msg.by ?? ""}` : msg.from;
    const showAvatar = msg.from === "friend" && lastFrom !== fromKey;
    lastFrom = fromKey;
    day.items.push(
      <li key={msg.id === jumpId ? `${msg.id}-${jumpKey}` : msg.id}  /* 移ったときは 作りなおして 光らせなおす */
        className={`ch-msg is-${msg.from}${msg.id === jumpId ? " is-jump" : ""}${pinnedIds.includes(msg.id) ? " is-pinned" : ""}`} data-id={msg.id}>
        {msg.from === "friend" && (showAvatar
          ? <span className="fr-avatar is-small" style={{ "--c": sender.color }} aria-hidden="true">{sender.name.slice(0, 1)}</span>
          : <span className="ch-avatar-space" />)}
        <div className="ch-msg-col">
        {f.room && msg.from === "friend" && showAvatar && <span className="ch-sender">{sender.name}</span>}
        <div className="ch-bubble-line">
          {msg.type === "quiz"
            ? <QuizBubble msg={msg} onOpen={() => onView(msg)} />
            : msg.type === "code"
            ? <div className="ch-code-bubble">{msg.text && <p className="ch-code-note">{msg.text}</p>}<CodeBlock msg={msg} /></div>
            : <p className="ch-bubble">{msg.text}</p>}
          <time dateTime={msg.at}>{hm(d)}</time>
          <MsgPinButton on={pinnedIds.includes(msg.id)} onClick={() => onPinMsg?.(msg.id)} />
        </div>
        </div>
      </li>,
    );
  }
  const rows = days.map((day) => (
    <li key={day.key} className="ch-day-group">
      <div className="ch-day"><span>{dayLabel(day.date)}</span></div>
      <ol className="ch-day-list">{day.items}</ol>
    </li>
  ));

  return (
    <div className="ch-thread" style={{ "--c": f.color }}>
      <header className="ch-head">
        <Avatar t={f} />
        <span className="ch-head-who">
          <b>{f.name}</b>
          <small>{f.room
            ? `グループ ・ ${f.room.members.length + 1}人（あなた・${f.room.members.map(nameOf).join("・")}）`
            : f.online ? "オンライン" : `最後のログイン ${lastLoginText(f.lastLogin, false)}`}</small>
        </span>
        {tools && <span className="ch-head-tools">{tools}</span>}
      </header>

      <div className="ch-body-wrap">
      {jumpLabel && <p className="ch-jump-date" key={jumpLabel.key} role="status"><Icon name="pin" />{jumpLabel.text}</p>}
      <ol className="ch-body" ref={bodyRef} aria-label={`${f.call}との やりとり`}>
        {rows.length ? rows : <li className="ch-start">{f.call}との トークです。メッセージを送ってみましょう。</li>}
      </ol>
      </div>

      <form className="ch-input" onSubmit={submit}>
        <div className="ch-plus-wrap" ref={menuRef}>
          <button type="button" className={`ch-plus${menu ? " is-open" : ""}`} aria-label="ほかのものを送る" aria-haspopup="menu" aria-expanded={menu} onClick={() => setMenu((v) => !v)}>
            <Icon name="plus" />
          </button>
          {menu && (
            <div className="ch-menu" role="menu">
              <button type="button" role="menuitem" onClick={() => { setMenu(false); onCompose("quiz"); }}>
                <span className="fr-kind is-quiz"><Icon name="quiz" /></span>
                <span><b>問題を送る</b><small>題名・問題文・選択肢を作って送る</small></span>
              </button>
              <button type="button" role="menuitem" onClick={() => { setMenu(false); onCompose("code"); }}>
                <span className="fr-kind is-code"><Icon name="programming" /></span>
                <span><b>コードを送る</b><small>プログラムを そのまま送る（1 行ずつ コピーできる）</small></span>
              </button>
            </div>
          )}
        </div>
        <textarea ref={inputRef} className="ch-text" rows={1} value={draft} maxLength={MAX_TEXT}
          placeholder="メッセージを入力（Enter で送信）" title="Enter で送信・Shift + Enter で改行・``` で かこむと コード" aria-label={`${f.call}へのメッセージ`}
          onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} />
        <button type="submit" className="ch-send" disabled={!draft.trim()} aria-label="送信"><Icon name="send" /></button>
      </form>
    </div>
  );
}

// ───────── 会話のピン止め ─────────
/** 吹き出しの横の ピンのボタン（マウスをのせると出る。ピン止めしたものは いつも出す） */
function MsgPinButton({ on, onClick }) {
  const label = on ? "このメッセージの ピン止めを外す" : "このメッセージを ピン止めする";
  return (
    <button type="button" className={`ch-msg-pin${on ? " is-on" : ""}`} aria-pressed={on} aria-label={label} title={label} onClick={onClick}>
      <Icon name="pin" />
    </button>
  );
}
// ───────── トークの一覧の タブ・グループ ─────────
/** タブ（すべて・お気に入り・未読・オンライン・グループ…）と、グループを作る「＋」 */
function TalkTabs({ tabs, current, onSelect, count, canAdd, nameError, onAdd }) {
  const [adding, setAdding] = useState(false);
  // 1 行に ならべて、入りきらない分は 横にスクロール（マウスの ホイールでも 横に動く）
  const ref = useRef(null);
  const [edge, setEdge] = useState({ left: false, right: false });   // 左・右に まだ続きが あるか（はしを うすく消す）
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    setEdge({ left: el.scrollLeft > 1, right: el.scrollLeft + el.clientWidth < el.scrollWidth - 1 });
  };
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onWheel = (e) => {   // たてのホイール → 横に動かす（横に動かせるときだけ）
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX) || el.scrollWidth <= el.clientWidth) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => { el.removeEventListener("wheel", onWheel); ro.disconnect(); };
  }, []);
  useEffect(measure, [tabs.length, adding]);
  // えらんだタブ・作っている欄が 見えるところへ
  useEffect(() => {
    const el = ref.current;
    const target = el?.querySelector(adding ? ".ch-name-input" : ".ch-tab.is-active");
    if (!target) return;
    const l = target.offsetLeft - el.offsetLeft, r = l + target.offsetWidth;
    if (l < el.scrollLeft) el.scrollLeft = l - 12;
    else if (r > el.scrollLeft + el.clientWidth) el.scrollLeft = r - el.clientWidth + 12;
  }, [current, adding]);
  return (
    <div className={`ch-tabs${edge.left ? " has-left" : ""}${edge.right ? " has-right" : ""}`} role="tablist" aria-label="トークの分類" ref={ref} onScroll={measure}>
      {tabs.map((t) => (
        <button key={t.id} type="button" role="tab" aria-selected={current === t.id}
          className={`ch-tab${current === t.id ? " is-active" : ""}${t.group ? " is-group" : ""}`} onClick={() => onSelect(t.id)}>
          {t.mark && <span className="ch-tab-mark" aria-hidden="true">{t.mark}</span>}
          {t.icon && <Icon name={t.icon} />}
          {t.group && <Icon name="tag" />}
          {t.name}<span className="ch-tab-n">{count(t.id)}</span>
        </button>
      ))}
      {adding
        ? <NameInput placeholder="分類の名前" nameError={nameError} onDone={(name) => { setAdding(false); if (name) onAdd(name); }} />
        : canAdd && <button type="button" className="ch-tab is-add" onClick={() => setAdding(true)} title="分類を作る（例：クラス・部活）" aria-label="分類を作る"><Icon name="plus" /></button>}
    </div>
  );
}

/** 名前を入れる 小さな欄（Enter で決定・Esc か 外を押すと やめる）。onDone(名前) ／ やめたら onDone("") */
function NameInput({ initial = "", placeholder, nameError, exceptId = null, onDone }) {
  const [v, setV] = useState(initial);
  const [err, setErr] = useState("");
  const done = useRef(false);
  const finish = (name) => { if (done.current) return; done.current = true; onDone(name); };
  const submit = () => {
    const e = nameError(v, exceptId);
    if (e) { setErr(e); return; }
    finish(v.trim());
  };
  return (
    <span className="ch-name-input">
      <input className="input" autoFocus value={v} maxLength={MAX_GROUP_NAME} placeholder={placeholder} aria-label={placeholder}
        aria-invalid={err ? "true" : undefined}
        onChange={(e) => { setV(e.target.value); setErr(""); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing && e.keyCode !== 229) { e.preventDefault(); submit(); }
          if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); finish(""); }
        }}
        onBlur={() => (v.trim() && !nameError(v, exceptId) ? submit() : finish(""))} />
      {err && <small className="ch-name-err" role="alert">{err}</small>}
    </span>
  );
}

/** グループのタブを えらんでいるときの帯：人数・名前を変える・消す */
function GroupBar({ group, nameError, onRename, onRemove }) {
  const [editing, setEditing] = useState(false);
  const [sure, setSure] = useState(false);   // 「消す」を 1 回押した（もう 1 回で 消す）
  return (
    <div className="ch-group-bar">
      {editing
        ? <NameInput initial={group.name} placeholder="分類の名前" nameError={nameError} exceptId={group.id}
            onDone={(name) => { setEditing(false); if (name) onRename(name); }} />
        : <>
            <span className="ch-group-info"><Icon name="tag" /><b>{group.name}</b><small>{group.members.length}人</small></span>
            <button type="button" className="ch-mini" onClick={() => setEditing(true)}>名前を変える</button>
            <button type="button" className={`ch-mini is-danger${sure ? " is-sure" : ""}`} onClick={() => (sure ? onRemove() : setSure(true))} onBlur={() => setSure(false)}>
              {sure ? "本当に消す" : "消す"}
            </button>
          </>}
    </div>
  );
}

/** トークの上の「グループ」ボタン：押すと、この人を入れる グループを えらぶ メニュー（＋ 新しいグループ） */
function GroupMenu({ friend: f, groups, canAdd, nameError, onToggle, onAdd }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const off = (e) => { if (!ref.current?.contains(e.target)) { setOpen(false); setAdding(false); } };
    const esc = (e) => { if (e.key === "Escape") { setOpen(false); setAdding(false); } };
    document.addEventListener("mousedown", off);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", off); document.removeEventListener("keydown", esc); };
  }, [open]);
  const mine = groups.filter((g) => g.members.includes(f.userId));
  return (
    <span className="ch-group-menu-wrap" ref={ref}>
      <button type="button" className={`ch-tool is-round is-group${mine.length ? " is-on" : ""}`} aria-haspopup="menu" aria-expanded={open}
        title={mine.length ? `分類：${mine.map((g) => g.name).join("・")}（押すと えらびなおせます）` : `${f.call}を入れる 分類を えらぶ`}
        aria-label={`${f.call}を入れる 分類を えらぶ`} onClick={() => setOpen((v) => !v)}>
        <Icon name="tag" />{mine.length > 0 && <span className="ch-tool-badge">{mine.length}</span>}
      </button>
      {open && (
        <div className="ch-group-menu" role="menu" aria-label={`${f.call}を入れる 分類`}>
          <p className="ch-group-menu-title">{f.call}を入れる 分類</p>
          {groups.length === 0 && !adding && <p className="ch-group-menu-none">まだ 分類は ありません。</p>}
          {groups.map((g) => (
            <label key={g.id} className="ch-group-item" role="menuitemcheckbox" aria-checked={g.members.includes(f.userId)}>
              <input type="checkbox" checked={g.members.includes(f.userId)} onChange={() => onToggle(g.id)} />
              <span>{g.name}</span><small>{g.members.length}人</small>
            </label>
          ))}
          {adding
            ? <NameInput placeholder="新しい分類の名前" nameError={nameError} onDone={(name) => { setAdding(false); if (name) onAdd(name); }} />
            : canAdd && <button type="button" className="ch-group-new" onClick={() => setAdding(true)}><Icon name="plus" />新しい分類を作って入れる</button>}
        </div>
      )}
    </span>
  );
}

// ───────── お気に入りの ボタン（round … 丸いボタン。トークの上で使う） ─────────
function FavButton({ on, name, onClick, round = false }) {
  const label = on ? `${name} さんを お気に入りから外す` : `${name} さんを お気に入りにする`;
  return (
    <button type="button" className={`ch-tool is-fav${on ? " is-on" : ""}${round ? " is-round" : ""}`} aria-pressed={on} aria-label={label} title={label} onClick={onClick}>
      <span aria-hidden="true">{on ? "★" : "☆"}</span>
    </button>
  );
}

/** けんさくで 見つかった文字に 色をつける */
function Highlight({ text = "", q }) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  const from = Math.max(0, i - 8);   // 見つかったところが 見えるように、少し前から
  return <>{from > 0 && "…"}{text.slice(from, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

// ───────── プログラムのコード ─────────
/** コードの表示：行番号つき。上の「すべてコピー」、行に マウスをのせると 右に「コピー」、行番号を押しても その行をコピー
 *  big … 大きく出す（中身を見る画面） */
function CodeBlock({ msg, big = false }) {
  const lines = (msg.code ?? "").replace(/\n+$/, "").split("\n");
  const [copied, setCopied] = useState(null);   // コピーした ところ（"all" か 行の番号）。少しのあいだ「コピーしました」
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async (text, which) => {
    const ok = await copyText(text);
    clearTimeout(timer.current);
    setCopied(ok ? which : null);
    timer.current = setTimeout(() => setCopied(null), 1600);
    notify(ok
      ? { type: "success", title: which === "all" ? `コードを ぜんぶ（${lines.length}行）コピーしました` : `${which + 1} 行目を コピーしました`, message: which === "all" ? "" : lines[which].trim().slice(0, 60), key: "chat-copy" }
      : { type: "error", title: "コピーできませんでした", message: "文字を えらんで Ctrl + C で コピーしてください。", key: "chat-copy" });
  };
  return (
    <div className={`ch-code${big ? " is-big" : ""}`}>
      <div className="ch-code-head">
        <span className="ch-code-lang"><Icon name="programming" />{msg.lang || "その他"}</span>
        <small>{lines.length}行</small>
        <button type="button" className={`ch-code-all${copied === "all" ? " is-done" : ""}`} onClick={() => copy(lines.join("\n"), "all")} title="コードを ぜんぶ コピーする">
          <Icon name={copied === "all" ? "check" : "copy"} />{copied === "all" ? "コピーしました" : "すべてコピー"}
        </button>
      </div>
      <ol className="ch-code-lines" aria-label={`${msg.lang || ""} の コード（${lines.length}行）`}>
        {lines.map((line, i) => (
          <li key={i} className={copied === i ? "is-done" : ""}>
            <button type="button" className="ch-code-no" onClick={() => copy(line, i)} title={`${i + 1} 行目を コピー`} aria-label={`${i + 1} 行目を コピー`}>{i + 1}</button>
            <code>{line || " "}</code>
            <button type="button" className="ch-code-copy" onClick={() => copy(line, i)} title={`${i + 1} 行目を コピー`} aria-label={`${i + 1} 行目を コピー`} tabIndex={-1}>
              <Icon name={copied === i ? "check" : "copy"} />{copied === i ? "コピー済み" : "コピー"}
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** コードを送る画面：言語 ・ コード（Tab で字下げ・Shift + Tab で もどす） ・ ひとこと。Ctrl + Enter でも送れる */
function CodeComposer({ friend: f, onClose, onSend }) {
  const [lang, setLang] = useState("Python");
  const [code, setCode] = useState("");
  const [note, setNote] = useState("");
  const [tried, setTried] = useState(false);
  const ref = useRef(null);
  const caret = useRef(null);   // Tab のあと カーソルを 置く場所（画面が 変わった すぐあとに 置く）
  useLayoutEffect(() => {
    if (!caret.current || !ref.current) return;
    [ref.current.selectionStart, ref.current.selectionEnd] = caret.current;
    caret.current = null;
  }, [code]);
  const empty = !code.trim();
  const submit = (e) => {
    e?.preventDefault();
    setTried(true);
    if (empty) return;
    onSend({ type: "code", lang, code: code.replace(/\s+$/, ""), text: note.trim() });
    onClose();
  };
  /** Ctrl + Enter：送る（コードの欄でも ひとことの欄でも） */
  const onFormKey = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(e);
  };
  /** Tab：字下げ（4 つの空白）。Shift + Tab：行の はじめの空白を 4 つまで消す */
  const onKey = (e) => {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const t = ref.current, { selectionStart: a, selectionEnd: b, value } = t;
    const lineStart = value.lastIndexOf("\n", a - 1) + 1;
    let next, ca, cb;
    if (e.shiftKey) {
      const head = value.slice(lineStart).match(/^ {1,4}/)?.[0].length ?? 0;
      next = value.slice(0, lineStart) + value.slice(lineStart + head);
      ca = Math.max(lineStart, a - head); cb = Math.max(lineStart, b - head);
    } else {
      next = value.slice(0, a) + "    " + value.slice(b);
      ca = cb = a + 4;
    }
    caret.current = [ca, cb];
    setCode(next);
  };
  return (
    <Modal icon="programming" title={`${f.call}に コードを送る`} onClose={onClose} wide
      foot={<>
        {tried && empty && <span className="ch-form-error"><Icon name="alert" />コードを 入れてください。</span>}
        <small className="ch-code-hint">Tab で字下げ ・ Ctrl + Enter で送る</small>
        <button type="button" className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button type="submit" form="ch-code" className="btn btn-primary"><Icon name="send" />送る</button>
      </>}>
      <form id="ch-code" className="ch-form" onSubmit={submit} onKeyDown={onFormKey} noValidate>
        <div className="ch-field">
          <span>言語</span>
          <div className="ch-langs" role="radiogroup" aria-label="言語">
            {LANGS.map((l) => (
              <button key={l} type="button" role="radio" aria-checked={lang === l} className={`ch-tab${lang === l ? " is-active" : ""}`} onClick={() => setLang(l)}>{l}</button>
            ))}
          </div>
        </div>
        <label className="ch-field">
          <span>コード</span>
          <textarea ref={ref} className="input ch-code-input" value={code} maxLength={MAX_CODE} spellCheck={false} autoFocus rows={12}
            onChange={(e) => setCode(e.target.value)} onKeyDown={onKey} aria-invalid={tried && empty ? "true" : undefined}
            placeholder={"例：\nfor i in range(3):\n    print(i)"} />
        </label>
        <label className="ch-field">
          <span>ひとこと <small>（なくてもよい）</small></span>
          <input className="input" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="例：for 文の 見本だよ" />
        </label>
      </form>
    </Modal>
  );
}

/** 吹き出しの中の 問題のカード（押すと中身） */
function QuizBubble({ msg, onOpen }) {
  return (
    <button type="button" className="ch-quiz" onClick={onOpen}>
      <span className="ch-quiz-top">
        <span className="fr-kind is-quiz"><Icon name="quiz" /></span>
        <span><small>問題</small><b>{msg.quiz.title}</b></span>
      </span>
      <span className="ch-quiz-meta">{msg.quiz.questions.length}問 ・ 選択肢から えらぶ</span>
      {msg.text && <span className="ch-quiz-note">{msg.text}</span>}
      <span className="ch-quiz-go">問題を見る ›</span>
    </button>
  );
}

// ───────── 問題を作る画面 ─────────
const blankQuestion = () => ({ q: "", choices: ["", "", "", ""], answer: 0 });

function QuizComposer({ friend: f, onClose, onSend }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [qs, setQs] = useState([blankQuestion()]);
  const [tried, setTried] = useState(false);   // 一度「送る」を押したか（押したあとから、たりないところを赤く）

  const setQ = (i, patch) => setQs((list) => list.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const setChoice = (i, c, value) => setQs((list) => list.map((x, j) => (j === i ? { ...x, choices: x.choices.map((y, k) => (k === c ? value : y)) } : x)));
  const empty = (s) => !s.trim();
  const missing = empty(title) || qs.some((x) => empty(x.q) || x.choices.some(empty));

  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (missing) return;
    onSend({
      type: "quiz", text: note.trim(),
      quiz: { title: title.trim(), questions: qs.map((x) => ({ q: x.q.trim(), choices: x.choices.map((c) => c.trim()), answer: x.answer })) },
    });
    onClose();
  };
  const bad = (s) => (tried && empty(s) ? "true" : undefined);

  return (
    <Modal icon="quiz" title={`${f.call}に 問題を送る`} onClose={onClose} wide
      foot={<>
        {tried && missing && <span className="ch-form-error"><Icon name="alert" />赤いところを入れてください。</span>}
        <button type="button" className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button type="submit" form="ch-compose" className="btn btn-primary"><Icon name="send" />送る</button>
      </>}>
      <form id="ch-compose" className="ch-form" onSubmit={submit} noValidate>
        <label className="ch-field">
          <span>題名</span>
          <input className="input" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} placeholder="例：Python のきほん クイズ" aria-invalid={bad(title)} autoFocus />
        </label>
        <label className="ch-field">
          <span>ひとこと <small>（なくてもよい）</small></span>
          <input className="input" value={note} maxLength={80} onChange={(e) => setNote(e.target.value)} placeholder="例：作ってみたよ！ 解けるかな？" />
        </label>

        <ol className="ch-qs">
          {qs.map((x, i) => (
            <li key={i} className="ch-q">
              <div className="ch-q-head">
                <span className="fr-q-no">Q{i + 1}</span>
                {qs.length > 1 && (
                  <button type="button" className="ch-q-del" onClick={() => setQs((list) => list.filter((_, j) => j !== i))} aria-label={`Q${i + 1} を消す`}>
                    <Icon name="close" />消す
                  </button>
                )}
              </div>
              <textarea className="input ch-q-text" rows={2} value={x.q} maxLength={200} onChange={(e) => setQ(i, { q: e.target.value })}
                placeholder="問題文" aria-label={`Q${i + 1} の問題文`} aria-invalid={bad(x.q)} />
              <div className="ch-choices" role="radiogroup" aria-label={`Q${i + 1} の選択肢（正解を えらぶ）`}>
                {x.choices.map((c, k) => (
                  <div key={k} className={`ch-choice${x.answer === k ? " is-answer" : ""}`}>
                    <label className="ch-choice-ok" title="これを正解にする">
                      <input type="radio" name={`ch-ans-${i}`} checked={x.answer === k} onChange={() => setQ(i, { answer: k })} />
                      <span>{x.answer === k ? "正解" : "正解にする"}</span>
                    </label>
                    <i>{CHOICE_MARKS[k]}</i>
                    <input className="input" value={c} maxLength={60} onChange={(e) => setChoice(i, k, e.target.value)}
                      placeholder={`選択肢 ${CHOICE_MARKS[k]}`} aria-label={`Q${i + 1} の選択肢 ${CHOICE_MARKS[k]}`} aria-invalid={bad(c)} />
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {qs.length < MAX_QUESTIONS && (
          <button type="button" className="btn ch-add-q" onClick={() => setQs((list) => [...list, blankQuestion()])}>
            <Icon name="plus" />問題を たす（あと {MAX_QUESTIONS - qs.length} 問）
          </button>
        )}
      </form>
    </Modal>
  );
}

// ───────── グループトークを作る・設定する画面 ─────────
/** room が null なら 作る。あれば 設定（名前・メンバー・ぬける） */
function RoomEditor({ room, friends, nameOf, onClose, onSave, onLeave }) {
  const [name, setName] = useState(room?.name ?? "");
  const [members, setMembers] = useState(() => room?.members ?? []);
  const [tried, setTried] = useState(false);
  const [sure, setSure] = useState(false);   // 「ぬける」を 1 回押した
  const flip = (id) => setMembers((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
  const nameErr = !name.trim() ? "名前を入れてください。" : "";
  const memErr = members.length === 0 ? "メンバーを 1 人以上 えらんでください。" : "";
  const submit = (e) => {
    e.preventDefault();
    setTried(true);
    if (nameErr || memErr) return;
    onSave({ name: name.trim(), members });
  };
  return (
    <Modal icon="friends" title={room ? `グループ「${room.name}」の 設定` : "グループトークを作る"} onClose={onClose}
      foot={<>
        {onLeave && (
          <button type="button" className={`btn ch-leave${sure ? " is-sure" : ""}`} onClick={() => (sure ? onLeave() : setSure(true))} onBlur={() => setSure(false)}>
            {sure ? "本当に ぬける（やりとりも 消えます）" : "グループから ぬける"}
          </button>
        )}
        {tried && (nameErr || memErr) && <span className="ch-form-error"><Icon name="alert" />{nameErr || memErr}</span>}
        <button type="button" className="btn btn-ghost" onClick={onClose}>やめる</button>
        <button type="submit" form="ch-room" className="btn btn-primary"><Icon name={room ? "check" : "plus"} />{room ? "保存する" : "作る"}</button>
      </>}>
      <form id="ch-room" className="ch-form" onSubmit={submit} noValidate>
        <label className="ch-field">
          <span>グループの名前</span>
          <input className="input" value={name} maxLength={MAX_ROOM_NAME} onChange={(e) => setName(e.target.value)} placeholder="例：勉強会" autoFocus aria-invalid={tried && nameErr ? "true" : undefined} />
        </label>
        <div className="ch-field">
          <span>メンバー <small>（あなた ＋ {members.length}人）</small></span>
          <div className="ch-member-list" role="group" aria-label="メンバーを えらぶ" aria-invalid={tried && memErr ? "true" : undefined}>
            {friends.map((f) => (
              <label key={f.userId} className={`ch-member${members.includes(f.userId) ? " is-on" : ""}`} style={{ "--c": f.color }}>
                <input type="checkbox" checked={members.includes(f.userId)} onChange={() => flip(f.userId)} />
                <span className="fr-avatar is-small">{f.name.slice(0, 1)}{f.online && <i />}</span>
                <b>{f.name}</b>
                <small>{f.online ? "オンライン" : `ID：${f.userId}`}</small>
              </label>
            ))}
          </div>
          {room && <small className="ch-member-note">外した人・足した人は、トークに お知らせが出ます。{members.length ? `（今：${members.map(nameOf).join("・")}）` : ""}</small>}
        </div>
      </form>
    </Modal>
  );
}

// ───────── まん中に出す箱（<dialog>。Esc で とじる。closeOnBackdrop なら まわりを押しても とじる） ─────────
function Modal({ icon, title, onClose, closeOnBackdrop = false, wide = false, foot, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => { if (d.open) d.close(); };
  }, []);
  return (
    <dialog ref={ref} className={`ch-modal${wide ? " is-wide" : ""}`} aria-label={title}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
      onMouseDown={(e) => { if (closeOnBackdrop && e.target === ref.current) onClose(); }}>
      <header className="ch-modal-head">
        <span className={`fr-kind is-${icon === "programming" ? "code" : "quiz"}`}><Icon name={icon} /></span>
        <h2>{title}</h2>
        <button type="button" className="ch-modal-close" onClick={onClose} aria-label="とじる"><Icon name="close" /></button>
      </header>
      <div className="ch-modal-body">{children}</div>
      {foot && <footer className="ch-modal-foot">{foot}</footer>}
    </dialog>
  );
}
