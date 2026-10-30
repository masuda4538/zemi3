// ═══════════════════════════════════════════════════════════════
//  アチーブ（実績）を手に入れる・調べる（どのアプリからでも使える）
//    import { unlockAchievement } from "../../main/common/achievements.js";
//    unlockAchievement("quiz", "first-correct");   // アプリの id と、アチーブの id
//  アチーブの名前と説明は、各アプリのフォルダーの achievements.js に書きます
//    （例：application/quiz/achievements.js）。一覧の画面は application/achieve/
//  手に入れると、右上に「アチーブを手に入れた！」のお知らせが出ます（main/App.jsx → common/notify.js）。
//  一度手に入れたアチーブは、もう一度 unlockAchievement を呼んでも何も起きません（お知らせも出ない）。
//
//  数をためるアチーブ（「10 問正解」など）
//    achievements.js に goal: 10 と書いて、数えたいところで
//      addProgress("quiz", "ten-correct");        // 1 つ増える（2 つ目に数を入れると、その数だけ増える）
//      setProgress("programming", "streak-7", 3); // 今の数を直接決める（「〇日つづけた」など、数を別で数えているとき）
//    goal に届いたら自動で手に入ります。アチーブの画面には「2 / 10」と進み具合が出ます。
//  achievements.js にない ID は手に入りません。開発中はコンソールに警告が出ます（書きまちがいに気づけるように）。
//
//  ★ 保存先：PC の中のファイル（設定の settings.json と同じフォルダーの achievements.json）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\achievements.json
//      WSL で開発中     … ~/.local/share/com.nkc-user.tauri-app/achievements.json
//    ファイルの中身：{ "version": 1,
//                      "users":    { "ログイン ID": { "quiz:first-correct": "手に入れた日時" } },
//                      "progress": { "ログイン ID": { "quiz:ten-correct": 2 } } }   ← 数をためるアチーブの今の数
//    ブラウザで開いたとき（npm run dev）は localStorage に保存します。
//    あとで DB に保存するときは、この中の initAchievements（読む）と writeAll（書く）だけを書きかえます。
//
//  使い方：起動したとき（src/main.jsx）に await initAchievements() で読んでおく
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { currentUserId, inTauri } from "./api.js";
import { notify } from "./notify.js";
import { findAchievement } from "../../application/achieve/achieve.js";

const FILE = "achievements.json";
const FILE_VERSION = 1;
const LOCAL_KEY = "achievements";   // ブラウザのとき

let users = {};                      // { ログイン ID: { "quiz:first-correct": "手に入れた日時" } }
let progress = {};                   // { ログイン ID: { "quiz:ten-correct": 2 } }（数をためるアチーブ）
let store = null;                    // 保存するファイル（Tauri のときだけ）
let writing = Promise.resolve();     // 書き込みを順番に行うための列
const listeners = new Set();         // 手に入れたとき（お知らせを出すため）
const changeListeners = new Set();   // 手に入れた・数が増えたとき（アチーブの画面を更新するため）

const pad = (n) => String(n).padStart(2, "0");
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ───────── 読み込み・保存 ─────────
/** 起動したときに 1 回だけ呼ぶ：保存してあるアチーブを読んでおく（src/main.jsx） */
export async function initAchievements() {
  if (!inTauri) {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") ?? {};
      users = saved.users ?? (saved.version ? {} : saved);   // 前の形（users だけ）も読める
      progress = saved.progress ?? {};
    } catch { users = {}; progress = {}; }
    return;
  }
  try {
    store = await load(FILE, { autoSave: false, defaults: {} });
    users = (await store.get("users")) ?? {};
    progress = (await store.get("progress")) ?? {};
  } catch (err) {
    console.warn("アチーブのファイルを読めませんでした。", err);
    store = null;
    users = {};
  }
}

/** 今のアチーブをすべて保存する（ファイルか localStorage） */
function writeAll() {
  if (!store) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ version: FILE_VERSION, users, progress })); } catch { /* 保存できなくても動く */ }
    return;
  }
  writing = writing
    .then(async () => {
      await store.set("version", FILE_VERSION);
      await store.set("users", users);
      await store.set("progress", progress);
      await store.save();
    })
    .catch((err) => {
      console.warn("アチーブを保存できませんでした。", err);
      notify({ type: "error", title: "アチーブを保存できませんでした", message: String(err), key: "achieve-file" });
    });
}

// ───────── 手に入れる・調べる ─────────
/** アチーブを手に入れる（はじめてなら true。もう持っていれば何もしないで false） */
export function unlockAchievement(appId, achId) {
  const userId = currentUserId();
  if (!userId) return false;      // ログインしていないときは数えない
  if (!checkId(appId, achId)) return false;   // achievements.js にない ID は手に入らない（書きまちがい）
  const key = `${appId}:${achId}`;
  const mine = users[userId] ?? {};
  if (mine[key]) return false;    // もう持っている → お知らせも出さない
  users = { ...users, [userId]: { ...mine, [key]: now() } };
  writeAll();
  listeners.forEach((fn) => fn({ appId, achId }));
  changeListeners.forEach((fn) => fn());
  return true;
}

/** 数をためるアチーブの数を amount だけ増やす（goal に届いたら手に入る）。増えたあとの数が返る */
export function addProgress(appId, achId, amount = 1) {
  return setProgress(appId, achId, (getProgress()[`${appId}:${achId}`] ?? 0) + amount);
}

/** 数をためるアチーブの今の数を value にする（goal に届いたら手に入る）。決めた数が返る */
export function setProgress(appId, achId, value) {
  const userId = currentUserId();
  if (!userId) return 0;
  const def = checkId(appId, achId);
  if (!def) return 0;                          // achievements.js にない ID は数えない（書きまちがい）
  if (!def.goal) {
    if (import.meta.env.DEV) console.warn(`アチーブ「${appId}:${achId}」には goal がありません。achievements.js に goal: 10 のように書いてください。`);
    return 0;
  }
  const key = `${appId}:${achId}`;
  if (users[userId]?.[key]) return def.goal;   // もう手に入れている
  const n = Math.max(0, Math.min(def.goal, Math.floor(value)));
  const mine = progress[userId] ?? {};
  if (mine[key] === n) return n;
  progress = { ...progress, [userId]: { ...mine, [key]: n } };
  writeAll();
  changeListeners.forEach((fn) => fn());
  if (n >= def.goal) unlockAchievement(appId, achId);   // goal に届いた！
  return n;
}

/** 開発中だけ：achievements.js にない ID なら警告を出す（書きまちがいに気づけるように）。定義が返る */
function checkId(appId, achId) {
  const def = findAchievement(appId, achId);
  if (!def && import.meta.env.DEV) {
    console.warn(`アチーブ「${appId}:${achId}」は application/${appId}/achievements.js にありません。ID の書きまちがいかもしれません。`);
  }
  return def;
}

/** ログインしている人が手に入れたアチーブ { "quiz:first-correct": "2026-10-28 16:10", … } */
export const getUnlocked = () => ({ ...(users[currentUserId()] ?? {}) });

/** ログインしている人の、数をためるアチーブの今の数 { "quiz:ten-correct": 2, … } */
export const getProgress = () => ({ ...(progress[currentUserId()] ?? {}) });

/** 手に入れたときに fn({ appId, achId }) を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onAchievementUnlocked(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** 手に入れた・数が増えたときに fn() を呼ぶ（アチーブの画面の更新用）。やめるときは返ってきた関数を呼ぶ */
export function onAchievementsChange(fn) {
  changeListeners.add(fn);
  return () => changeListeners.delete(fn);
}
