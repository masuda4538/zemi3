// 起動の入口（ふだんは触らなくて大丈夫です）
//   1. 設定（settings.json）とアチーブ（achievements.json）のファイルを読む
//   2. 画面（system/main/App.jsx）を出す
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./system/main/App";
import { initSettings } from "./system/application/settings/settings.js";
import { initAchievements } from "./system/main/common/achievements.js";

Promise.allSettled([initSettings(), initAchievements()]).finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
