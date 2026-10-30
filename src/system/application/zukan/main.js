// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：動き（普通の JavaScript） ★ このファイルを書きかえていきます
//  画面を開くと、最初に start(root, app) が呼ばれます。
//    root … この画面のいちばん外側（main.html の中身が入っている）
//    app  … 便利な道具
//      app.$("名前")              main.html の data-app="名前" の要素を探す（document.getElementById の代わり）
//      app.$$("名前")             同じ名前の要素をすべて探す（配列）
//      app.on(要素, "click", 関数) イベントを付ける（ほかの画面へ移るとき、自動で外れる）
//      app.user                   ログインしている人（app.user.name で名前）
//      app.notify({ type: "success", title: "保存しました" })   右上のお知らせ
//      app.unlock("id")           アチーブを手に入れる（achievements.js に書いた id）
//      app.addProgress("id")      数をためるアチーブを 1 つ増やす
//
//  ★ document.getElementById / document.querySelector は使わない
//    （ほかの画面の部品を間違えて触らないように。app.$ か root.querySelector を使う）
//  ★ 長くなったら、このフォルダーにファイルを増やして import で分けられます
//      例）data.js に export const LIST = [ … ];  →  ここで import { LIST } from "./data.js";
// ═══════════════════════════════════════════════════════════════

export function start(root, app) {
  // ───────── はじめの例：消して、自分の動きを書いていってください ─────────
  let count = 0;

  app.on(app.$("count-button"), "click", () => {
    count++;
    app.$("count").textContent = count;
    if (count === 1) {
      app.notify({ type: "info", title: `こんにちは、${app.user?.name ?? ""} さん`, message: "デジタル図鑑の main.js から出したお知らせです。" });
    }
  });

  // ほかの画面へ移るときにすること（タイマーを止めるなど。なければこのままでよい）
  return () => {};
}
