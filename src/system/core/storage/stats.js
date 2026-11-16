// ═══════════════════════════════════════════════════════════════
//  アプリごとの学習時間の内訳と大事な数（ホームのいちばん下のカード）
//
//  内訳の名前は time、大事な数の名前と単位は stats に書きます（src/system/home_setting/<アプリの id>.js）。
//  大事な数は、各アプリの JS から入れます
//    app.addStat("solved") … 1 つ増やす / app.setStat("streak", 3) … 今の数を決める / app.stat("solved") … 今の数
//  時間は、各アプリの JS から計ります（core/frame/bridge.js が app に付ける）
//    app.startStudy("solve") … 計りはじめる / app.stopStudy() … やめる（ページを閉じても止まる）
//    app.addStudyTime("solve", 秒) … 自分で計った時間を足す
//  ホームは app.stats() で全部のアプリの時間を読み、app.onStatsChange で変わったら描き直します。
//  home_setting にない id の時間は入りません。開発中はコンソールに警告が出ます（書きまちがいに気づけるように）。
//
//  ★ 保存先：PC の中のファイル（設定の settings.json と同じフォルダーの stats.json）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\stats.json
//    ファイルの中身：{ "version": 1, "users": { "ログイン ID": { "quiz:answered": 30, "quiz:time:make": 600 } } }
//                     （time: の付いたものは学習時間の秒。ほかは大事な数）
//    ブラウザで開いたとき（npm run dev）は localStorage に保存します。
//    あとで DB に保存するときは、この中の initStats（読む）と writeAll（書く）だけを書きかえます。
//  使い方：起動したとき（src/main.jsx）に await initStats() で読んでおく
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { inTauri } from "./account.js";
import { currentUserId } from "../../log_in/session.js";
import { PAGES } from "../page-list";

const FILE = "stats.json";
const FILE_VERSION = 1;
const LOCAL_KEY = "stats";   // ブラウザのとき

/** アプリの id → { stats: [{ id, name, unit }], time: [{ id, name }] }（home_setting/<id>.js の export default） */
const SETTINGS = Object.fromEntries(
  Object.entries(import.meta.glob("../../home_setting/*.js", { eager: true, import: "default" }))
    .map(([path, def]) => [path.match(/([^/]+)\.js$/)[1], def ?? { stats: [], time: [] }]),
);

let users = {};     // { ログイン ID: { "quiz:answered": 30, "quiz:time:make": 600 } }
let store = null;
let writing = Promise.resolve();
const listeners = new Set();

// ───────── 読み込み・保存 ─────────
export async function initStats() {
  if (!inTauri) {
    try { users = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "{}").users ?? {}; } catch { users = {}; }
    return;
  }
  try {
    store = await load(FILE, { autoSave: false, defaults: {} });
    users = (await store.get("users")) ?? {};
  } catch (err) {
    console.warn("学習時間のファイルを読めませんでした。", err);
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
    .then(async () => { await store.set("version", FILE_VERSION); await store.set("users", users); await store.save(); })
    .catch((err) => console.warn("学習時間を保存できませんでした。", err));
}

// ───────── 学習時間を足す・調べる ─────────
/** 学習時間の内訳の id か（home_setting の time にあるか） */
function knownTime(appId, timeId) {
  const ok = SETTINGS[appId]?.time?.some((t) => t.id === timeId);
  if (!ok && import.meta.env.DEV) console.warn(`学習時間「${appId}:${timeId}」は home_setting/${appId}.js の time にありません。{ id: "${timeId}", name: "…" } を足してください。`);
  return ok;
}

/** 学習時間（秒）を足す。足したあとの秒が返る */
export function addStudyTime(appId, timeId, seconds) {
  const userId = currentUserId();
  const sec = Number(seconds);
  if (!userId || !(sec > 0) || !knownTime(appId, timeId)) return 0;
  const key = `${appId}:time:${timeId}`;
  const mine = users[userId] ?? {};
  const total = Math.round(((mine[key] ?? 0) + sec) * 10) / 10;
  users = { ...users, [userId]: { ...mine, [key]: total } };
  writeAll();
  listeners.forEach((fn) => fn());
  return total;
}

/** home_setting の stats にある id か（なければ開発中だけ警告） */
function known(appId, statId) {
  const ok = SETTINGS[appId]?.stats?.some((x) => x.id === statId);
  if (!ok && import.meta.env.DEV) console.warn(`「${appId}:${statId}」は home_setting/${appId}.js の stats にありません。{ id: "${statId}", name: "…", unit: "…" } を足してください。`);
  return ok;
}

/** 大事な数の今の数（ログインしていない・まだ入れていないときは 0） */
export const getStat = (appId, statId) => users[currentUserId()]?.[`${appId}:${statId}`] ?? 0;

/** 大事な数を value にする。決めた数が返る */
export function setStat(appId, statId, value) {
  const userId = currentUserId();
  if (!userId || !known(appId, statId)) return 0;
  const n = Math.max(0, Math.floor(Number(value) || 0));
  const key = `${appId}:${statId}`;
  const mine = users[userId] ?? {};
  if (mine[key] === n) return n;
  users = { ...users, [userId]: { ...mine, [key]: n } };
  writeAll();
  listeners.forEach((fn) => fn());
  return n;
}

/** 大事な数を amount だけ増やす。増えたあとの数が返る */
export const addStat = (appId, statId, amount = 1) => setStat(appId, statId, getStat(appId, statId) + amount);

/** ホームのカード用：アプリごとの学習時間の内訳と大事な数（左のサイドバーと同じ順。home_setting があるアプリだけ）
 *  [{ app: { id, name, icon }, time: [{ id, name, sec }], stats: [{ id, name, unit, value }] }] */
export function getAllStats() {
  const mine = users[currentUserId()] ?? {};
  return PAGES.filter((p) => SETTINGS[p.id]?.time?.length || SETTINGS[p.id]?.stats?.length).map((p) => ({
    app: { id: p.id, name: p.name, icon: p.icon },
    time: (SETTINGS[p.id].time ?? []).map((t) => ({ id: t.id, name: t.name, sec: mine[`${p.id}:time:${t.id}`] ?? 0 })),
    stats: (SETTINGS[p.id].stats ?? []).map((x) => ({ id: x.id, name: x.name, unit: x.unit ?? "", value: mine[`${p.id}:${x.id}`] ?? 0 })),
  }));
}

/** 学習時間・大事な数が変わったときに fn() を呼ぶ。やめるときは返ってきた関数を呼ぶ */
export function onStatsChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
