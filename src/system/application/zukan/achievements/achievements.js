// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：アチーブ（名前と説明） ★ 自由に書きかえてよい
//  手に入れるときは js/main.js で app.unlock("id") を呼ぶ
//  数をためるものは goal を書いて、app.addProgress("id")（1 増やす）か app.setProgress("id", 数) を呼ぶ
//  icon に使える名前：home programming research zukan quiz trophy check など
// ═══════════════════════════════════════════════════════════════
export default [
  { id: "first-page", name: "図鑑デビュー", desc: "はじめて図鑑にのせた", icon: "zukan" },   // js/main.js の「のせる」で手に入る
  { id: "collector", name: "コレクター", desc: "図鑑に 10 こ のせた", goal: 10 },           // js/main.js の app.addProgress("collector") で 1 ずつ増える
];
