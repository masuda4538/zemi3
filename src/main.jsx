// 起動の入口（ふだんは触らなくて大丈夫です）
//   1. 設定（settings.json）・アチーブ（achievements.json）・ログインしている人（session.json）・ログインした日（logins.json）・使った時間（usage.json）のファイルを読む
//   2. 画面（system/main/App.jsx）を出す
//   3. ロード画面（index.html の #boot）を、起動して BOOT_MS たったら消す
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./system/main/App";
import { initSettings } from "./system/pages/settings/settings.js";
import { initAchievements } from "./system/main/common/achievements.js";
import { initSession } from "./system/main/common/api.js";
import { initLogins } from "./system/main/common/logins.js";
import { initUsage } from "./system/main/common/usage.js";

/** ロード画面を出しておく時間（ミリ秒）。起動してからこの時間がたったら、ふわっと消す */
const BOOT_MS = 2000;

/** ロード画面を消す（読み込みが長くかかったときは、終わってからすぐ消す） */
function hideBoot() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  const wait = Math.max(0, BOOT_MS - performance.now());   // 起動してからの時間
  setTimeout(() => {
    boot.classList.add("is-leaving");                       // 0.5 秒かけて消える（index.html の .boot.is-leaving）
    setTimeout(() => boot.remove(), 550);
  }, wait);
}

// ファイルを画面に落としたときに、アプリの画面がそのファイルに切りかわってしまわないようにする
// （落とした画像を受け取る場所は、それぞれの画面で決める。例：アカウントのアイコン）
for (const type of ["dragover", "drop"]) window.addEventListener(type, (e) => e.preventDefault());

Promise.allSettled([initSettings(), initAchievements(), initSession(), initLogins(), initUsage()]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  hideBoot();
});
