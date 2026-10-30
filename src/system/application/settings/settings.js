// ═══════════════════════════════════════════════════════════════
//  設定：処理（読み込み・保存・画面への反映）
//  設定は PC ごとのものなので、データベースではなく その PC の中のファイルに保存します。
//    保存先（アプリのデータ用フォルダー。Tauri 公式の tauri-plugin-store を使っています）
//      Windows のアプリ … C:\Users\<名前>\AppData\Roaming\com.nkc-user.tauri-app\settings.json
//      WSL で開発中     … ~/.local/share/com.nkc-user.tauri-app/settings.json
//      （設定画面の「情報」に、今使っている場所が出ます）
//    ファイルの中身：{ "version": 1, "settings": { 設定 }, "lastUserId": "前回のログイン ID" }
//  ブラウザで開いたとき（npm run dev）は、ファイルが使えないので localStorage に保存します。
//
//  使い方
//    起動したとき（src/main.jsx）… await initSettings()  … ファイルを読んでおく
//    あとは loadSettings() / saveSettings() でいつでも読み書きできる（読むのは一瞬・書くのは裏で）
//  項目を増やすときは DEFAULTS に 1 行足して、main.jsx に画面を足します。
// ═══════════════════════════════════════════════════════════════
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { appDataDir, join } from "@tauri-apps/api/path";
import { load } from "@tauri-apps/plugin-store";
import { inTauri } from "../../main/common/api.js";
import { DEFAULT_SHORTCUTS } from "../../main/shortcuts.js";
import { notify } from "../../main/common/notify.js";

/** 設定ファイルの名前（AppData の中のアプリのフォルダーに作られる） */
const FILE = "settings.json";
/** ファイルの形のバージョン（形を大きく変えたら 2 にして、古い形を変換する処理を足す） */
const FILE_VERSION = 1;

// ブラウザで開いたとき・前のバージョン（localStorage に保存していたころ）のキー
const KEY = "settings";
const LAST_ID_KEY = "lastUserId";

/** 最初の値（「設定を初期状態に戻す」でこの値になる） */
export const DEFAULTS = {
  // 表示
  theme: "light",          // "light"：ホワイト / "dark"：ダーク / "system"：PC に合わせる
  fontSize: "medium",      // "small" / "medium" / "large"
  reduceMotion: false,     // アニメーションを減らす
  compactSidebar: false,   // サイドバーの文字を隠す（アイコンだけ）
  // 操作
  confirmLogout: true,     // ログアウトの前に確認する
  confirmClose: true,      // アプリを閉じる前に確認する（猫が「もう帰るの…？」と聞く）
  // 起動・ログイン
  rememberId: true,        // ログイン ID を覚えておく
  startMaximized: true,    // 起動したときに最大化する
  // キーボード
  shortcuts: DEFAULT_SHORTCUTS,   // { 操作の id: "Ctrl+1" など }（一覧は main/shortcuts.js）
};

/** 文字の大きさ → 画面の拡大率 */
export const FONT_SIZES = [
  { id: "small", name: "小", zoom: 0.9 },
  { id: "medium", name: "中", zoom: 1 },
  { id: "large", name: "大", zoom: 1.15 },
];

export const THEMES = [
  { id: "light", name: "ホワイト" },
  { id: "dark", name: "ダーク" },
  { id: "system", name: "PC に合わせる" },
];

// ───────── 読み込み・保存 ─────────
let store = null;               // 設定ファイル（Tauri のときだけ）
let cache = null;               // 読み込んだ設定（画面からはこれを使うので、読むのは一瞬）
let lastId = "";                // 前回のログイン ID
let writing = Promise.resolve(); // 書き込みを順番に行うための列

/** 保存してある値と最初の値を合わせる（ないもの・型がちがうものは最初の値） */
function merge(saved) {
  const merged = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) {
    if (saved && saved[k] !== undefined && typeof saved[k] === typeof DEFAULTS[k]) merged[k] = saved[k];
  }
  // ショートカットは 1 つずつ合わせる（あとで操作を増やしても、増えた操作は最初のキーになる）
  merged.shortcuts = { ...DEFAULT_SHORTCUTS };
  const sc = saved?.shortcuts;
  if (sc && typeof sc === "object") {
    for (const id of Object.keys(DEFAULT_SHORTCUTS)) {
      if (typeof sc[id] === "string") merged.shortcuts[id] = sc[id];
    }
  }
  return merged;
}

/** localStorage に入っている設定（ブラウザのとき・前のバージョンから引き継ぐとき） */
function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    const theme = localStorage.getItem("theme");   // もっと前のバージョンの表示モード
    return {
      settings: saved || theme ? merge({ ...(saved ?? {}), theme: saved?.theme ?? theme ?? undefined }) : null,
      lastUserId: localStorage.getItem(LAST_ID_KEY) ?? "",
    };
  } catch {
    return { settings: null, lastUserId: "" };
  }
}

/** 起動したときに 1 回だけ呼ぶ：設定ファイルを読んでおく（src/main.jsx） */
export async function initSettings() {
  if (!inTauri) {               // ブラウザ：localStorage から
    const local = readLocal();
    cache = local.settings ?? { ...DEFAULTS };
    lastId = local.lastUserId;
    return;
  }
  try {
    store = await load(FILE, { autoSave: false, defaults: {} });
    const saved = await store.get("settings");
    if (saved) {
      cache = merge(saved);
      lastId = (await store.get("lastUserId")) ?? "";
    } else {
      // はじめて：前のバージョンで localStorage に保存していた設定があれば、ファイルへ引き継ぐ
      const local = readLocal();
      cache = local.settings ?? { ...DEFAULTS };
      lastId = local.lastUserId;
      await writeFile();
      try { [KEY, "theme", LAST_ID_KEY].forEach((k) => localStorage.removeItem(k)); } catch { /* 消せなくてもよい */ }
    }
  } catch (err) {
    console.warn("設定ファイルを読めませんでした。最初の値で起動します。", err);
    store = null;
    cache = { ...DEFAULTS };
  }
}

/** ファイルへ書く（前の書き込みが終わってから、順番に） */
function writeFile() {
  if (!store) return Promise.resolve();
  writing = writing
    .then(async () => {
      await store.set("version", FILE_VERSION);
      await store.set("settings", cache);
      await store.set("lastUserId", lastId);
      await store.save();
    })
    .catch((err) => {
      console.warn("設定ファイルに保存できませんでした。", err);
      notify({ type: "error", title: "設定ファイルに保存できませんでした", message: String(err), key: "settings-file" });
    });
  return writing;
}

/** 保存先（ブラウザ・まだ読んでいないとき）のとき localStorage に書く */
function writeLocal() {
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
    if (lastId) localStorage.setItem(LAST_ID_KEY, lastId); else localStorage.removeItem(LAST_ID_KEY);
  } catch { /* 保存できなくても動く */ }
}

/** 今の設定（initSettings で読んだもの。読む前なら最初の値） */
export function loadSettings() {
  return { ...(cache ?? DEFAULTS) };
}

/** 設定を保存する（画面にはすぐ反映。ファイルへは裏で書く） */
export function saveSettings(settings) {
  cache = merge(settings);
  if (store) writeFile(); else writeLocal();
}

/** 設定ファイルの場所（Tauri のときだけ。ブラウザなら ""） */
export async function settingsFilePath() {
  if (!inTauri) return "";
  try { return await join(await appDataDir(), FILE); } catch { return ""; }
}

/** PC がダークモードか */
const prefersDark = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

/** 実際に使う表示モード（"light" か "dark"） */
export const effectiveTheme = (settings) =>
  settings.theme === "system" ? (prefersDark() ? "dark" : "light") : settings.theme;

/** 設定を画面に反映する（色・文字の大きさ・アニメーション・サイドバー） */
export function applySettings(settings) {
  const root = document.documentElement;
  root.dataset.theme = effectiveTheme(settings);
  root.classList.toggle("reduce-motion", settings.reduceMotion);
  root.classList.toggle("compact-sidebar", settings.compactSidebar);

  const zoom = FONT_SIZES.find((f) => f.id === settings.fontSize)?.zoom ?? 1;
  if (inTauri) {
    getCurrentWebview().setZoom(zoom).catch(() => {});
  } else {
    root.style.zoom = zoom === 1 ? "" : String(zoom); // ブラウザで開いたとき
  }
}

/** 起動したときだけ：最大化の設定を反映する（tauri.conf.json では最大化で起動している） */
export function applyStartup(settings) {
  if (!inTauri || settings.startMaximized) return;
  getCurrentWindow().unmaximize().catch(() => {});
}

/** PC のダークモードが切り替わったら fn を呼ぶ（「PC に合わせる」のとき用） */
export function watchSystemTheme(fn) {
  const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
  if (!mq) return () => {};
  mq.addEventListener("change", fn);
  return () => mq.removeEventListener("change", fn);
}

// ───────── ログイン ID を覚えておく ─────────
//  設定ファイルの "lastUserId" に保存します
export function loadLastUserId(settings) {
  return settings.rememberId ? lastId : "";
}
export function saveLastUserId(settings, userId) {
  lastId = settings.rememberId ? userId : "";
  if (store) writeFile(); else writeLocal();
}
export function forgetLastUserId() {
  lastId = "";
  if (store) writeFile(); else writeLocal();
}
