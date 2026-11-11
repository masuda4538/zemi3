// ═══════════════════════════════════════════════════════════════
//  アプリを開いている時間を計る（ホームの「使った時間」の円グラフで使う）
//
//  計るもの：左のプログラム学習〜問題作成（main/apps.js の PAGES。ホームはのぞく）を、右に出しているあいだの時間
//    ・ホーム・アチーブ・設定・アカウントを出しているときは計らない
//    ・ウィンドウを最小化しているあいだ（画面に見えていないとき）は計らない
//    ・ログインしているときだけ、ログイン ID ごとに記録する（ゲストのときは計らない）
//    ・30 秒ごと、ページを切りかえたとき、最小化したときに、ためた時間を記録に足す
//  呼んでいるところ：main/App.jsx の setUsagePage（開いているページが変わったら）
//
//  ★ 保存先：PC の中のファイル（設定の settings.json と同じフォルダーの usage.json）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\usage.json
//      WSL で開発中     … ~/.local/share/com.nkc-user.tauri-app/usage.json
//    ファイルの中身：{ "version": 2, "users": { "ログイン ID": { "2026-11-10": { "14": { "quiz": 300 }, "15": { … } } } } }
//                     ↑ 日付ごと・時（0〜23 時）ごと・アプリごとの秒数（ホームの棒グラフで「何時に使ったか」を出すため）
//                     （前の形 { "2026-11-10": { "quiz": 300 } } も、そのまま読める。何時かは分からないので棒グラフには出ない）
//    ブラウザで開いたとき（npm run dev）は localStorage に保存します。
//    あとで DB に保存するときは、この中の initUsage（読む）と writeAll（書く）だけを書きかえます。
//
//  窓の中（各アプリの js）からは app.usage("2026-11-01", "2026-11-30") で読めます（main/frame/bridge.js）
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { currentUserId, inTauri } from "./api.js";
import { PAGES } from "../apps";

const FILE = "usage.json";
const FILE_VERSION = 2;
const LOCAL_KEY = "usage";           // ブラウザのとき
const FLUSH_MS = 30 * 1000;          // 30 秒ごとに記録に足す

const SKIP = ["home"];               // 計らないアプリ（ホーム）
const APP_IDS = new Set(PAGES.map((p) => p.id).filter((id) => !SKIP.includes(id)));   // 計るページ（プログラム学習〜問題作成）
let users = {};                      // { ログイン ID: { "2026-11-10": { home: 秒, … } } }
let store = null;
let writing = Promise.resolve();
const listeners = new Set();

/** 今計っているところ { who（ログイン ID）, page, since（はじめた時刻 ms） }（計っていなければ null） */
let running = null;
let page = null;                     // 右に出しているページの id

const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ───────── 読み込み・保存 ─────────
/** 起動したときに 1 回だけ呼ぶ（src/main.jsx） */
export async function initUsage() {
  if (!inTauri) {
    try { users = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}").users ?? {}; } catch { users = {}; }
  } else {
    try {
      store = await load(FILE, { autoSave: false, defaults: {} });
      users = (await store.get("users")) ?? {};
    } catch (err) {
      console.warn("使った時間のファイルを読めませんでした。", err);
      store = null;
      users = {};
    }
  }
  // 最小化したら止める・もどったら再開する。30 秒ごとに記録に足す
  document.addEventListener("visibilitychange", restart);
  setInterval(() => { if (running) restart(); }, FLUSH_MS);
}

function writeAll() {
  if (!store) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ version: FILE_VERSION, users })); } catch { /* 保存できなくても動く */ }
    return;
  }
  writing = writing
    .then(async () => {
      await store.set("version", FILE_VERSION);
      await store.set("users", users);
      await store.save();
    })
    .catch((err) => console.warn("使った時間を保存できませんでした。", err));
}

// ───────── 計る ─────────
/** from〜to（ms）を「日付・時」ごとに分けて fn(日付, 時, 秒) を呼ぶ（0 時・ちょうどの時刻をまたいでも、それぞれに分ける） */
function eachHour(from, to, fn) {
  let t = from;
  while (t < to) {
    const d = new Date(t);
    const nextHour = new Date(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours() + 1).getTime();
    const end = Math.min(to, nextHour);
    fn(dayKey(d), d.getHours(), (end - t) / 1000);
    t = end;
  }
}

/** from〜to（ms）の時間を記録に足す */
function addTime(who, id, from, to) {
  const mine = { ...(users[who] ?? {}) };
  eachHour(from, to, (key, hour, sec) => {
    const day = { ...(mine[key] ?? {}) };
    const h = { ...(day[hour] ?? {}) };
    h[id] = Math.round(((h[id] ?? 0) + sec) * 10) / 10;   // 秒（小数 1 けた）
    day[hour] = h;
    mine[key] = day;
  });
  users = { ...users, [who]: mine };
}

/** 今までの分を記録に足して、条件が合えば計りなおす（ページ・ログイン・最小化が変わったときにも呼ぶ） */
function restart() {
  const now = Date.now();
  if (running && now > running.since) {
    addTime(running.who, running.page, running.since, now);
    writeAll();
    listeners.forEach((fn) => fn());
  }
  const who = currentUserId();
  running = who && page && APP_IDS.has(page) && document.visibilityState !== "hidden"
    ? { who, page, since: now }
    : null;
}

/** 右に出しているページが変わったとき・ログインした人が変わったときに呼ぶ（main/App.jsx） */
export function setUsagePage(id) {
  page = id;
  restart();
}

/** アプリを閉じる前に呼ぶ：今までの分を記録に足す */
export function flushUsage() {
  restart();
}

// ───────── 調べる ─────────
/** ログインしている人の、from〜to（"2026-11-01"〜"2026-11-30"、両方ふくむ）の時間（ゲストなら null）
 *  {
 *    total:  合計の秒,
 *    apps:   { programming: 秒, quiz: 秒, … },                  … アプリごと
 *    days:   その中で使った日の数,
 *    byDay:  { "2026-11-10": { total: 秒, apps: { … } }, … },     … 日ごと（週・月・年の棒グラフ・カレンダー用）
 *    byHour: [{ total: 秒, apps: { … } } × 24]（0 時〜23 時）     … 時ごと（1 日の棒グラフ用。期間の中を足したもの）
 *  } */
export function getUsage(from, to) {
  const who = currentUserId();
  if (!who) return null;
  const empty = () => ({ total: 0, apps: {} });
  const out = { total: 0, apps: {}, days: 0, byDay: {}, byHour: Array.from({ length: 24 }, empty) };
  const add = (key, hour, id, sec) => {
    if (!APP_IDS.has(id) || !sec) return;   // 前に記録したホームの時間などは数えない
    out.total += sec;
    out.apps[id] = (out.apps[id] ?? 0) + sec;
    const day = (out.byDay[key] ??= empty());
    day.total += sec;
    day.apps[id] = (day.apps[id] ?? 0) + sec;
    if (hour != null) {
      out.byHour[hour].total += sec;
      out.byHour[hour].apps[id] = (out.byHour[hour].apps[id] ?? 0) + sec;
    }
  };
  for (const [key, day] of Object.entries(users[who] ?? {})) {
    if (key < from || key > to) continue;
    for (const [k, v] of Object.entries(day)) {
      if (typeof v === "number") add(key, null, k, v);                         // 前の形（何時かは分からない）
      else for (const [id, sec] of Object.entries(v)) add(key, Number(k), id, sec);   // 時ごとの形
    }
  }
  // まだ記録に足していない、今計っている分も入れる
  if (running && running.who === who) {
    eachHour(running.since, Date.now(), (key, hour, sec) => { if (key >= from && key <= to) add(key, hour, running.page, sec); });
  }
  out.days = Object.keys(out.byDay).length;
  return out;
}

/** 記録が増えたときに fn() を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onUsageChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
