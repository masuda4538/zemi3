// ═══════════════════════════════════════════════════════════════
//  各アプリのページ（窓の中）で使える「app」を作る
//  窓の中の index.html が開くと、いちばん最初に window.parent.__zemiApp(window) が呼ばれ（vite-apps.js が入れる）、
//  ここで作った app が、窓の中の window.app になります。
//
//  窓の中で使えるもの（各アプリの main.js から）
//    app.page                        … このページ { id, name }
//    app.user                        … ログインしている人（app.user.name で名前）
//    app.notify({ type, title, message })   … 右上のお知らせ（type：success / info / warning / error）
//    app.unlock("id") / app.addProgress("id", 数) / app.setProgress("id", 数)   … このアプリのアチーブ
//    await app.invoke("関数の名前", { 引数 })   … このアプリの rust/main.rs の関数を呼ぶ
//    app.open("quiz")                … ほかのページを開く（id は main/apps.js）
//    app.openUrl("https://…")        … PC のブラウザで Web ページを開く
//    app.pages                       … 左に並ぶページの一覧 [{ id, name }]
//    app.rarities                    … レア度の一覧 [{ id: "bronze", name: "ブロンズ" }, …]（手に入れにくいものほど後ろ）
//    app.achievements()              … すべてのアチーブと、手に入れたか・今の数・レア度（rarity / rarityName）
//    app.onAchievementsChange(関数)  … アチーブが変わったら呼ぶ
//    app.loginDays()                 … ログインした日 { days: ["2026-11-10", …], total, streak, best }（ゲストなら null）
//    app.onLoginDaysChange(関数)     … ログインした日・ログインしている人が変わったら呼ぶ
//    app.usage("2026-11-01", "2026-11-30") … その間にアプリを開いていた時間（ゲストなら null）
//                                      { total: 秒, apps: { quiz: 秒, … }, days, byDay: { 日付: { total, apps } }, byHour: [0〜23 時の { total, apps }] }
//    app.onUsageChange(関数)         … 使った時間の記録が増えたら呼ぶ（30 秒ごとなど）
//
//  左のサイドバー（src/system/sidebar/index.html）だけで使えるもの（main/components/HtmlSidebar.jsx が足す）
//    app.sidebar.state()             … { current（開いているページの id）, theme, user, top: [ページ], bottom: [ページ] }
//    app.sidebar.onChange(関数)      … 上の state が変わったら呼ぶ
//    app.sidebar.setTheme("dark")    … ホワイト／ダークを切りかえる
//    app.sidebar.hide()              … サイドバーを隠す
//
//  ほかに、ここでしていること
//    ・ホワイト／ダーク・アニメーションを減らす・サイドバーを小さく・細いスクロールバー を、窓の中にも同じように付ける
//    ・窓の中で押したショートカット（Ctrl + 1 など）を、外の画面に伝える
// ═══════════════════════════════════════════════════════════════
import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { PAGES } from "../apps";
import { notify } from "../common/notify.js";
import { inTauri } from "../common/api.js";
import { cursorMoved, cursorClicked } from "../common/cursor.js";
import { installScrollbars } from "../common/scrollbar.js";
import {
  unlockAchievement, addProgress, setProgress, getUnlocked, getProgress, onAchievementsChange,
} from "../common/achievements.js";
import { getLoginDays, onLoginsChange } from "../common/logins.js";
import { getUsage, onUsageChange } from "../common/usage.js";
import { ALL, RARITIES } from "../../pages/achieve/achieve.js";

/** 窓（iframe）→ { page, getUser, open, extra, stop: 前の app の後片付け } */
const frames = new Map();

/** HtmlFolder.jsx・HtmlSidebar.jsx から呼ぶ：窓を登録する。やめるときは返ってきた関数を呼ぶ
 *  info.extra({ watch }) を渡すと、その窓の app に機能を足せる（サイドバーの app.sidebar など） */
export function registerFrame(iframe, info) {
  frames.set(iframe, { ...info, stop: null });
  return () => {
    frames.get(iframe)?.stop?.();
    frames.delete(iframe);
  };
}

/** このアプリの main.rs の関数を呼ぶ。__app で「どのアプリから呼んだか」を Rust に伝える（src-tauri/src/lib.rs） */
function invokeApp(appId, name, args = {}) {
  if (!inTauri) {
    return Promise.reject(new Error(`Rust の「${name}」は、npm run tauri dev で開いたアプリの中でだけ呼べます（ブラウザでは呼べません）。`));
  }
  return tauriInvoke(name, { ...args, __app: appId }).catch((err) => {
    const text = String(err?.message ?? err);
    if (/not found/i.test(text)) {
      throw new Error(`Rust の「${name}」が見つかりません。application/${appId}/rust/main.rs の名前と、いちばん下の crate::commands![ ] に書いたかを確認してください。`);
    }
    throw err;
  });
}

/** 窓の中の index.html が開いたときに呼ばれる（窓の中の window を受け取って、app を返す） */
function createApp(win) {
  const frame = [...frames.entries()].find(([el]) => el.contentWindow === win);
  if (!frame) return null;
  const [, info] = frame;
  info.stop?.();                         // 窓の中を読み直したとき：前の後片付け

  const stops = [];
  const { page } = info;

  // ───────── ホワイト／ダーク・アニメーションを減らす を、窓の中にも付ける ─────────
  const copyLook = () => {
    const to = win.document?.documentElement;
    if (!to) return;
    const from = document.documentElement;
    to.dataset.theme = from.dataset.theme ?? "light";
    to.classList.toggle("reduce-motion", from.classList.contains("reduce-motion"));
    to.classList.toggle("compact-sidebar", from.classList.contains("compact-sidebar"));
  };
  copyLook();
  installScrollbars(win.document);   // 細いスクロールバー（main/common/scrollbar.js）
  const look = new MutationObserver(copyLook);
  look.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class", "style"] });
  stops.push(() => look.disconnect());

  // ───────── 窓の中のマウスの動き・クリックを、外の画面のカーソルの効果に伝える（main/common/cursor.js） ─────────
  const iframe = frame[0];
  const toOuter = (e) => { const r = iframe.getBoundingClientRect(); return [r.left + e.clientX, r.top + e.clientY]; };
  const onMove = (e) => cursorMoved(...toOuter(e));
  const onDown = (e) => cursorClicked(...toOuter(e));
  win.addEventListener("pointermove", onMove, { passive: true });
  win.addEventListener("pointerdown", onDown, { passive: true });
  stops.push(() => { try { win.removeEventListener("pointermove", onMove); win.removeEventListener("pointerdown", onDown); } catch { /* 窓がもうない */ } });

  // ───────── 窓の中で押したショートカットを、外の画面に伝える ─────────
  const onKey = (e) => {
    if (!(e.ctrlKey || e.metaKey || e.altKey) && !/^F\d+$/.test(e.key)) return;   // 普通の文字入力は伝えない
    const copy = new KeyboardEvent("keydown", {
      key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey,
      repeat: e.repeat, bubbles: true, cancelable: true,
    });
    window.dispatchEvent(copy);
    if (copy.defaultPrevented) e.preventDefault();
  };
  win.addEventListener("keydown", onKey);
  stops.push(() => { try { win.removeEventListener("keydown", onKey); } catch { /* 窓がもうない */ } });

  // ───────── ファイルを窓に落としたときに、窓の中がそのファイルに切りかわらないようにする ─────────
  //   （窓の中で受け取りたいときは、その要素で drop を受け取れば使える）
  const stopFileDrop = (e) => e.preventDefault();
  for (const type of ["dragover", "drop"]) win.addEventListener(type, stopFileDrop);
  stops.push(() => { try { for (const type of ["dragover", "drop"]) win.removeEventListener(type, stopFileDrop); } catch { /* 窓がもうない */ } });

  // ───────── 窓の中の関数を、外から安全に呼ぶ（窓が閉じたあとは呼ばない） ─────────
  const watch = (subscribe, fn) => {
    const off = subscribe((...a) => { try { fn(...a); } catch (err) { console.error(err); } });
    stops.push(off);
    return off;
  };

  info.stop = () => stops.splice(0).forEach((off) => off());

  return {
    page: { id: page.id, name: page.name },
    get user() { const u = info.getUser(); return u ? { ...u } : null; },
    pages: PAGES.map((p) => ({ id: p.id, name: p.name })),
    notify: (opts) => notify(opts),
    unlock: (id) => unlockAchievement(page.id, id),
    addProgress: (id, n) => addProgress(page.id, id, n),
    setProgress: (id, n) => setProgress(page.id, id, n),
    invoke: (name, args) => invokeApp(page.id, name, args),
    open: (id) => info.open(id),
    openUrl: (url) => {
      if (!/^https?:\/\//i.test(String(url))) return Promise.reject(new Error("http:// か https:// の URL だけ開けます"));
      return inTauri ? openUrl(url) : Promise.resolve(window.open(url, "_blank", "noopener"));
    },
    rarities: RARITIES.map((r) => ({ id: r.id, name: r.name })),   // レア度の一覧（ブロンズ → シルバー → ゴールド の順）
    achievements: () => {
      const unlocked = getUnlocked();
      const progress = getProgress();
      return ALL.map((a) => ({
        key: a.key, appId: a.key.split(":")[0], appName: a.appName,
        id: a.id, name: a.name, desc: a.desc ?? "", icon: a.icon, goal: a.goal ?? 0,
        rarity: a.rarity, rarityName: a.rarityName,          // レア度（"bronze" / "silver" / "gold"）と、その名前（「ゴールド」など）
        gotAt: unlocked[a.key] ?? null,                     // 手に入れた日時（まだなら null）
        now: unlocked[a.key] ? (a.goal ?? 0) : (progress[a.key] ?? 0),   // 数をためるアチーブの今の数
      }));
    },
    onAchievementsChange: (fn) => watch(onAchievementsChange, fn),
    loginDays: () => getLoginDays(),
    onLoginDaysChange: (fn) => watch(onLoginsChange, fn),
    usage: (from, to) => getUsage(from, to),
    onUsageChange: (fn) => watch(onUsageChange, fn),
    ...(info.extra?.({ watch }) ?? {}),
  };
}

// 窓の中から呼べるようにしておく（同じアプリの中の窓だけが使える）
window.__zemiApp = createApp;
