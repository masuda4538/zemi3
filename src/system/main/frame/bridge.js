// ═══════════════════════════════════════════════════════════════
//  各アプリのページ（窓の中）で使える「app」を作る
//  窓の中の main.html が開くと、いちばん最初に window.parent.__zemiApp(window) が呼ばれ（vite-apps.js が入れる）、
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
//    app.achievements()              … すべてのアチーブと、手に入れたか・今の数
//    app.onAchievementsChange(関数)  … アチーブが変わったら呼ぶ
//
//  ほかに、ここでしていること
//    ・ホワイト／ダークなどを、窓の中にも同じように付ける
//    ・窓の中で押したショートカット（Ctrl + 1 など）を、外の画面に伝える
// ═══════════════════════════════════════════════════════════════
import { invoke as tauriInvoke } from "@tauri-apps/api/core";
import { openUrl } from "@tauri-apps/plugin-opener";
import { PAGES } from "../apps";
import { notify } from "../common/notify.js";
import { inTauri } from "../common/api.js";
import {
  unlockAchievement, addProgress, setProgress, getUnlocked, getProgress, onAchievementsChange,
} from "../common/achievements.js";
import { ALL } from "../../application/achieve/achieve.js";

/** 窓（iframe）→ { page, getUser, open, stop: 前の app の後片付け } */
const frames = new Map();

/** HtmlFolder.jsx から呼ぶ：窓を登録する。やめるときは返ってきた関数を呼ぶ */
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

/** 窓の中の main.html が開いたときに呼ばれる（窓の中の window を受け取って、app を返す） */
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
  };
  copyLook();
  const look = new MutationObserver(copyLook);
  look.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme", "class"] });
  stops.push(() => look.disconnect());

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
    achievements: () => {
      const unlocked = getUnlocked();
      const progress = getProgress();
      return ALL.map((a) => ({
        key: a.key, appId: a.key.split(":")[0], appName: a.appName,
        id: a.id, name: a.name, desc: a.desc ?? "", icon: a.icon, goal: a.goal ?? 0,
        gotAt: unlocked[a.key] ?? null,                     // 手に入れた日時（まだなら null）
        now: unlocked[a.key] ? (a.goal ?? 0) : (progress[a.key] ?? 0),   // 数をためるアチーブの今の数
      }));
    },
    onAchievementsChange: (fn) => watch(onAchievementsChange, fn),
  };
}

// 窓の中から呼べるようにしておく（同じアプリの中の窓だけが使える）
window.__zemiApp = createApp;
