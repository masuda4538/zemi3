// ═══════════════════════════════════════════════════════════════
//  アチーブ（実績）を手に入れる・調べる（どのアプリからでも使える）
//    import { unlockAchievement } from "../../main/common/achievements.js";
//    unlockAchievement("quiz", "first-correct");   // アプリの id と、アチーブの id
//  アチーブの名前と説明は、各アプリのフォルダーの achievements.js に書きます
//    （例：application/quiz/achievements.js）。一覧の画面は application/achieve/
//  手に入れると、右上に「アチーブを手に入れた！」のお知らせが出ます（main/App.jsx → common/notify.js）。
//  一度手に入れたアチーブは、もう一度 unlockAchievement を呼んでも何も起きません（お知らせも出ない）。
//
//  ★ 保存先：PC の中のファイル（設定の settings.json と同じフォルダーの achievements.json）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\achievements.json
//      WSL で開発中     … ~/.local/share/com.nkc-user.tauri-app/achievements.json
//    ファイルの中身：{ "version": 1, "users": { "ログイン ID": { "quiz:first-correct": "手に入れた日時" } } }
//    ブラウザで開いたとき（npm run dev）は localStorage に保存します。
//    あとで DB に保存するときは、この中の initAchievements（読む）と writeAll（書く）だけを書きかえます。
//
//  使い方：起動したとき（src/main.jsx）に await initAchievements() で読んでおく
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { currentUserId, inTauri } from "./api.js";
import { notify } from "./notify.js";

const FILE = "achievements.json";
const FILE_VERSION = 1;
const LOCAL_KEY = "achievements";   // ブラウザのとき

let users = {};                      // { ログイン ID: { "quiz:first-correct": "手に入れた日時" } }
let store = null;                    // 保存するファイル（Tauri のときだけ）
let writing = Promise.resolve();     // 書き込みを順番に行うための列
const listeners = new Set();

const pad = (n) => String(n).padStart(2, "0");
const now = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };

// ───────── 読み込み・保存 ─────────
/** 起動したときに 1 回だけ呼ぶ：保存してあるアチーブを読んでおく（src/main.jsx） */
export async function initAchievements() {
  if (!inTauri) {
    try { users = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}") ?? {}; } catch { users = {}; }
    return;
  }
  try {
    store = await load(FILE, { autoSave: false, defaults: {} });
    users = (await store.get("users")) ?? {};
  } catch (err) {
    console.warn("アチーブのファイルを読めませんでした。", err);
    store = null;
    users = {};
  }
}

/** 今のアチーブをすべて保存する（ファイルか localStorage） */
function writeAll() {
  if (!store) {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(users)); } catch { /* 保存できなくても動く */ }
    return;
  }
  writing = writing
    .then(async () => {
      await store.set("version", FILE_VERSION);
      await store.set("users", users);
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
  const key = `${appId}:${achId}`;
  const mine = users[userId] ?? {};
  if (mine[key]) return false;    // もう持っている → お知らせも出さない
  users = { ...users, [userId]: { ...mine, [key]: now() } };
  writeAll();
  listeners.forEach((fn) => fn({ appId, achId }));
  return true;
}

/** ログインしている人が手に入れたアチーブ { "quiz:first-correct": "2026-10-28 16:10", … } */
export const getUnlocked = () => ({ ...(users[currentUserId()] ?? {}) });

/** 手に入れたときに fn({ appId, achId }) を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onAchievementUnlocked(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
