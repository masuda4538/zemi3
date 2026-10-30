// ═══════════════════════════════════════════════════════════════
//  HTML・CSS・JS で作るアプリを、画面に出す部品（各アプリの main.jsx から使う）
//    main.html … 画面（<html> <body> <script> は書かない）
//    main.css  … 見た目
//    main.js   … 動き。export function start(root, app) { … } を書くと、画面を開いたときに呼ばれる
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
//  start が関数を返すと、ほかの画面へ移るときにその関数が呼ばれます（タイマーを止めるときなど）。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import { notify } from "../common/notify.js";
import { unlockAchievement, addProgress, setProgress } from "../common/achievements.js";

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
