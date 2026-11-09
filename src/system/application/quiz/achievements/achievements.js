// ═══════════════════════════════════════════════════════════════
//  問題作成：アチーブ（名前と説明） ★ 自由に書きかえてよい
//  手に入れるときは js/main.js で app.unlock("id") を呼ぶ
//  数をためるものは goal を書いて、app.addProgress("id")（1 増やす）か app.setProgress("id", 数) を呼ぶ
//  icon に使える名前：home programming research zukan quiz trophy check など
// ═══════════════════════════════════════════════════════════════
export default [
  { id: "first-correct", name: "はじめての正解", desc: "問題にはじめて正解した", icon: "quiz" },          // js/main.js の choose で手に入る
  { id: "perfect", name: "パーフェクト", desc: "全問正解した", icon: "trophy" },                         // js/main.js の showResult で手に入る
  { id: "ten-correct", name: "正解をつみかさね", desc: "問題に 10 回正解した", icon: "check", goal: 10 },   // 正解するたびに 1 増える
];
