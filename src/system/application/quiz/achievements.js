// 問題作成のアチーブ（名前と説明）。手に入れるときは main.js で app.unlock("id") を呼ぶ
//   goal を書くと「数をためるアチーブ」になる → app.addProgress("id") で 1 ずつ増え、goal で手に入る
export default [
  { id: "first-correct", name: "はじめての正解", desc: "問題にはじめて正解した", icon: "quiz" },
  { id: "perfect", name: "パーフェクト", desc: "全問正解した", icon: "trophy" },
  { id: "ten-correct", name: "正解をつみかさね", desc: "問題に 10 回正解した", icon: "check", goal: 10 },
];
