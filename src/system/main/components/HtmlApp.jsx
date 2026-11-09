// ═══════════════════════════════════════════════════════════════
//  HTML・CSS・JS で作るアプリを、画面に出す部品（main/components/HtmlFolder.jsx から使う）
//    main.html … 画面（<html> <body> <script> は書かない）
//    main.css  … 見た目
//    main.js   … 動き。export function start(root, app) { … } を書くと、画面を開いたときに呼ばれる
//
//    main.rs   … Rust。app.invoke("関数の名前", { 引数 }) で呼べる（このアプリの main.rs の関数だけが呼ばれる）
//
//  start(root, app) の app に入っているもの（main.js ですぐ使える）
//    app.$("名前")        … main.html の data-app="名前" の要素を 1 つ探す
//    app.$$("名前")       … 同じ名前の要素をすべて探す（配列）
//    app.on(要素, "click", 関数) … イベントを付ける（ほかの画面へ移るとき自動で外れる）
//    app.page            … このアプリの情報（名前・アイコンなど。main/apps.js）
//    app.user            … ログインしている人（名前・ログイン ID など）
//    app.notify({ … })   … 右上のお知らせ（main/common/notify.js）
//    app.unlock("id") / app.addProgress("id") / app.setProgress("id", 数)
//                        … このアプリのアチーブ（achievements.js に書いた id）
//    app.invoke("hello", { name: "太郎" }) … このアプリの main.rs の hello を呼ぶ（await で答えを受け取る）
//  start が関数を返すと、ほかの画面へ移るときにその関数が呼ばれます（タイマーを止めるときなど）。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { notify } from "../common/notify.js";
import { unlockAchievement, addProgress, setProgress } from "../common/achievements.js";
import { invoke } from "@tauri-apps/api/core";
import { inTauri } from "../common/api.js";

/** このアプリの main.rs の関数を呼ぶ。__app で「どのアプリから呼んだか」を Rust に伝える（src-tauri/src/lib.rs） */
function invokeApp(appId, name, args = {}) {
  if (!inTauri) {
    return Promise.reject(new Error(`Rust の「${name}」は、npm run tauri dev で開いたアプリの中でだけ呼べます（ブラウザでは呼べません）。`));
  }
  return invoke(name, { ...args, __app: appId }).catch((err) => {
    const text = String(err?.message ?? err);
    // 名前のまちがい・commands![ ] への書き忘れのときは、分かりやすく言いかえる
    if (/not found/i.test(text)) {
      throw new Error(`Rust の「${name}」が見つかりません。application/${appId}/main.rs の名前と、いちばん下の crate::commands![ ] に書いたかを確認してください。`);
    }
    throw err;
  });
}

export default function HtmlApp({ html, start, page, user }) {
  const rootRef = useRef(null);
  const userRef = useRef(user);   // 名前を変えたときなどに、アプリを作り直さないように
  userRef.current = user;

  useEffect(() => {
    const root = rootRef.current;
    root.innerHTML = html;                       // main.html を画面に入れる

    const offs = [];
    const app = {
      $: (name) => root.querySelector(`[data-app="${name}"]`),
      $$: (name) => [...root.querySelectorAll(`[data-app="${name}"]`)],
      on: (el, type, fn, opt) => {
        if (!el) { console.warn(`app.on：要素が見つかりません（${type}）。main.html の data-app を確認してください。`); return; }
        el.addEventListener(type, fn, opt);
        offs.push(() => el.removeEventListener(type, fn, opt));
      },
      page,
      get user() { return userRef.current; },
      notify,
      unlock: (id) => unlockAchievement(page.id, id),
      addProgress: (id, n) => addProgress(page.id, id, n),
      setProgress: (id, n) => setProgress(page.id, id, n),
      invoke: (name, args) => invokeApp(page.id, name, args),
    };

    let stop;
    try {
      stop = start?.(root, app);                 // main.js を動かす
    } catch (err) {
      console.error(err);
      const p = document.createElement("p");
      p.className = "page-error";
      p.textContent = `main.js でエラーが起きました：${String(err?.message ?? err)}`;
      root.prepend(p);
    }

    return () => {                               // ほかの画面へ移るとき
      if (typeof stop === "function") stop();
      offs.forEach((off) => off());
      root.innerHTML = "";
    };
  }, [html, start, page]);

  return <div ref={rootRef} className={`html-app html-app-${page?.id ?? ""}`} />;
}
