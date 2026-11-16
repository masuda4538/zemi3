// 起動の入口（ふだんは触らなくて大丈夫です）
//   1. 設定（settings.json）・アチーブ（achievements.json）・ログインしている人（session.json）・ログインした日（logins.json）・使った時間（usage.json）・アプリごとの学習時間（stats.json）のファイルを読む
//   2. 画面（system/core/App.jsx）を出す
//   3. スタート画面（青いロード画面。src/system/start-end/）を、起動して少したったら消す
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./system/core/App";
import { initSettings } from "./system/pages/settings/settings.js";
import { initAchievements } from "./system/core/storage/achievements.js";
import { initSession } from "./system/log_in/session.js";
import { initLogins } from "./system/core/storage/logins.js";
import { initUsage } from "./system/core/storage/usage.js";
import { initStats } from "./system/core/storage/stats.js";
import { installScrollbars } from "./system/core/effects/scrollbar.js";
import { hideLoadingScreen } from "./system/start-end/loading-screen.js";

// ファイルを画面に落としたときに、アプリの画面がそのファイルに切りかわってしまわないようにする
// （落とした画像を受け取る場所は、それぞれの画面で決める。例：アカウントのアイコン）
for (const type of ["dragover", "drop"]) window.addEventListener(type, (e) => e.preventDefault());

// スクロールバーを、中身の上に重ねる細いバーにする（出たときに中身が「ガクッ」とずれないように）
installScrollbars(document);

Promise.allSettled([initSettings(), initAchievements(), initSession(), initLogins(), initUsage(), initStats()]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  hideLoadingScreen();
});
