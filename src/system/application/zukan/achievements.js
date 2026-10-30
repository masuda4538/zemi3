// デジタル図鑑のアチーブ（名前と説明）。手に入れるときは main.js で app.unlock("id") を呼ぶ
//   ★ 今は例です。デジタル図鑑を作るときに、好きなように書きかえてください
export default [
  { id: "first-page", name: "図鑑デビュー", desc: "はじめて図鑑にのせた", icon: "zukan" },
  { id: "collector", name: "コレクター", desc: "図鑑に 10 こ のせた", goal: 10 },   // main.js で app.addProgress("collector") を呼ぶと 1 ずつ増える
];
