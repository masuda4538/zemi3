// ═══════════════════════════════════════════════════════════════
//  プログラム学習：アチーブ（名前と説明） ★ 自由に書きかえてよい
//  手に入れるときは js/main.js で app.unlock("id") を呼ぶ
//  数をためるものは goal を書いて、app.addProgress("id")（1 増やす）か app.setProgress("id", 数) を呼ぶ
//  icon に使える名前：home programming research zukan quiz trophy check など
// ═══════════════════════════════════════════════════════════════
export default [
  { id: "hello-world", name: "Hello, World!", desc: "はじめてレッスンをクリアした", icon: "programming" },   // js/main.js の「できた！」で手に入る
  { id: "streak-7", name: "7 日つづけた", desc: "7 日つづけて学習した", goal: 7 },   // 例：app.setProgress("streak-7", 日数) を呼ぶと、今の日数になる
];
