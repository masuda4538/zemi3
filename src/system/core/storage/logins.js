// ═══════════════════════════════════════════════════════════════
//  ログインした日を記録する（ホームの「ログイン日数」とカレンダーで使う）
//
//  「ログインした日」＝ ログインしたまま、アプリを開いた日（1 日に何回開いても 1 日）
//    ・ログインしたとき、ログインしたままアプリを起動したとき、開いたまま夜中の 0 時をこえたとき に記録する
//      （呼んでいるのは core/App.jsx の recordLogin）
//    ・ゲスト（ログインしていない）のときは記録しない
//
//  ★ 保存先：PC の中のファイル（設定の settings.json と同じフォルダーの logins.json）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\logins.json
//      WSL で開発中     … ~/.local/share/com.nkc-user.tauri-app/logins.json
//    ファイルの中身：{ "version": 1, "users": { "ログイン ID": ["2026-11-09", "2026-11-10"] } }
//    ブラウザで開いたとき（npm run dev）は localStorage に保存します。
//    あとで DB に保存するときは、この中の initLogins（読む）と writeAll（書く）だけを書きかえます。
//
//  窓の中（各アプリの js）からは app.loginDays() で読めます（core/frame/bridge.js）
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { inTauri } from "./account.js";
import { currentUserId } from "../../log_in/session.js";

const FILE = "logins.json";
const FILE_VERSION = 1;
const LOCAL_KEY = "logins";          // ブラウザのとき

let users = {};                      // { ログイン ID: ["2026-11-10", …]（古い順） }
let store = null;
let writing = Promise.resolve();
let lastKey = null;                  // 最後に記録した「人＋日付」（同じなら何もしない）
const listeners = new Set();

const pad = (n) => String(n).padStart(2, "0");
/** 日付を "2026-11-10" の形にする */
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// ───────── 読み込み・保存 ─────────
/** 起動したときに 1 回だけ呼ぶ（src/main.jsx） */
export async function initLogins() {
  if (!inTauri) {
    try { users = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}").users ?? {}; } catch { users = {}; }
    return;
  }
  try {
    store = await load(FILE, { autoSave: false, defaults: {} });
    users = (await store.get("users")) ?? {};
  } catch (err) {
    console.warn("ログインの記録のファイルを読めませんでした。", err);
    store = null;
    users = {};
  }
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
    .catch((err) => console.warn("ログインの記録を保存できませんでした。", err));
}

// ───────── 記録する・調べる ─────────
/** 今ログインしている人の「今日」を記録する（ゲストなら記録しない）。
 *  人か日付が変わったときは、ホームなどに「変わった」と知らせる */
export function recordLogin() {
  const userId = currentUserId();
  const today = dayKey();
  const key = `${userId}|${today}`;
  if (key === lastKey) return;       // さっきと同じ人・同じ日 → 何もしない
  lastKey = key;
  if (userId) {
    const days = users[userId] ?? [];
    if (!days.includes(today)) {
      users = { ...users, [userId]: [...days, today].sort() };
      writeAll();
    }
  }
  listeners.forEach((fn) => fn());
}

/** 前の日・次の日の "YYYY-MM-DD" */
const shift = (key, n) => {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
};

/** 今ログインしている人のログイン日数（ゲストなら null）
 *  { days: ["2026-11-09", …], total: 合計の日数, streak: 今の連続日数, best: いちばん長く続いた日数 } */
export function getLoginDays() {
  const userId = currentUserId();
  if (!userId) return null;
  const days = [...(users[userId] ?? [])];
  const set = new Set(days);

  // 今の連続：今日（今日がまだなら昨日）から、さかのぼって続いている日数
  let streak = 0;
  let d = set.has(dayKey()) ? dayKey() : shift(dayKey(), -1);
  while (set.has(d)) { streak++; d = shift(d, -1); }

  // 最高記録：いちばん長く続いた日数
  let best = 0, run = 0, prev = null;
  for (const day of days) {
    run = prev && shift(prev, 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
    prev = day;
  }
  return { days, total: days.length, streak, best };
}

/** 記録が変わった・ログインした人が変わったときに fn() を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onLoginsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
