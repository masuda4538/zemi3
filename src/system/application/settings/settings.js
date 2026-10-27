// ═══════════════════════════════════════════════════════════════
//  設定：処理（読み込み・保存・画面への反映）
//  設定はデータベースではなく、その PC の中（localStorage）に保存します。
//  項目を増やすときは DEFAULTS に 1 行足して、main.jsx に画面を足します。
// ═══════════════════════════════════════════════════════════════
import { getCurrentWindow } from "@tauri-apps/api/window";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { inTauri } from "../../main/common/api.js";

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
  confirmClose: false,     // アプリを閉じる前に確認する
  // 起動・ログイン
  rememberId: true,        // ログイン ID を覚えておく
  startMaximized: true,    // 起動したときに最大化する
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

/** 保存してある設定を読む（ないものは最初の値） */
export function loadSettings() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? "{}") ?? {};
    // 前のバージョンで保存した表示モードを引き継ぐ
    if (!saved.theme) saved.theme = localStorage.getItem("theme") ?? undefined;
  } catch { /* 読めなければ最初の値 */ }
  const merged = { ...DEFAULTS };
  for (const k of Object.keys(DEFAULTS)) {
    if (saved[k] !== undefined && typeof saved[k] === typeof DEFAULTS[k]) merged[k] = saved[k];
  }
  return merged;
}

export function saveSettings(settings) {
  try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* 保存できなくても動く */ }
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
export function loadLastUserId(settings) {
  if (!settings.rememberId) return "";
  try { return localStorage.getItem(LAST_ID_KEY) ?? ""; } catch { return ""; }
}
export function saveLastUserId(settings, userId) {
  try {
    if (settings.rememberId) localStorage.setItem(LAST_ID_KEY, userId);
    else localStorage.removeItem(LAST_ID_KEY);
  } catch { /* 保存できなくても動く */ }
}
export function forgetLastUserId() {
  try { localStorage.removeItem(LAST_ID_KEY); } catch { /* 何もしない */ }
}

/** キーボード操作の一覧（設定画面に出す） */
export const SHORTCUTS = [
  { keys: "Ctrl + 1", what: "ホーム" },
  { keys: "Ctrl + 2〜5", what: "プログラム学習・情報収集・デジタル図鑑・問題作成" },
  { keys: "Ctrl + ,", what: "設定" },
  { keys: "Enter", what: "ログイン・保存などのボタンを押す（入力中）" },
];
