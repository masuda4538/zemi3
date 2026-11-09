// ホームのアチーブ（名前と説明）。手に入れるときは main.js で app.unlock("id") を呼ぶ
//   ※ first-login と night-mode は、main/App.jsx が手に入れている（ログインしたとき・ダークモードにしたとき）
//   icon は main/components/Icon.jsx にある名前（なければ trophy）
export default [
  { id: "first-login", name: "はじめまして", desc: "はじめてログインした", icon: "home" },
  { id: "night-mode", name: "夜ふかし", desc: "ダークモードに切り替えた", icon: "moon" },
];
