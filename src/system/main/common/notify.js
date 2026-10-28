// ═══════════════════════════════════════════════════════════════
//  右上に出すお知らせ（トースト通知）。どの画面・どのファイルからでも使えます
//    import { notify } from "../../main/common/notify.js";
//    notify({ type: "success", title: "保存しました", message: "プロフィールを更新しました。" });
//
//  type     … "success"（できた）/ "info"（お知らせ）/ "warning"（注意）/ "error"（失敗）/ "achieve"（アチーブ）
//  title    … 太字の 1 行目　　message … 2 行目（なくてもよい）
//  duration … 出しておく時間（ミリ秒）。なければ type ごとの長さ（error は少し長め）
//  key      … 同じ key のお知らせは 1 つにまとめる（スイッチを続けて押したときなど）
//  icon     … 左に出すアイコンの名前（main/components/Icon.jsx）。なければ type ごとのもの
//  onClick  … お知らせを押したときにすること（なくてもよい）
//
//  ★ 入力のまちがい（赤い項目など）は、どこを直せばいいか分かるように、トーストではなくその場に出します。
//  見た目は main/components/Toaster.jsx（App.jsx に置いてある）
// ═══════════════════════════════════════════════════════════════
const DURATION = { success: 3000, info: 3500, warning: 5000, error: 6000, achieve: 4500 };
const listeners = new Set();
let nextId = 1;

/** お知らせを出す（出したお知らせの id が返る） */
export function notify({ type = "info", title, message = "", duration, key, icon, onClick } = {}) {
  const toast = { id: nextId++, type, title, message, duration: duration ?? DURATION[type] ?? 3500, key, icon, onClick };
  listeners.forEach((fn) => fn(toast));
  return toast.id;
}

/** お知らせが出たときに fn(toast) を呼ぶ（Toaster.jsx が使う）。やめるときは返ってきた関数を呼ぶ */
export function onNotify(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
