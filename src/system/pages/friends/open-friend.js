// ═══════════════════════════════════════════════════════════════
//  ほかの画面から「フレンド詳細」を開く（ホームの広場・ポスト → フレンドのページ）
//  ホームは窓（iframe）の中、フレンドのページは外の画面なので、だれを開くかを sessionStorage にメモしてわたす
//    ホーム：   requestFriend("taro"); app.open("friends");
//    フレンド： peekFriend() で読み、clearFriend() で消す（pages/friends/main.jsx）
//  チャットも同じ：ホーム（ポストのチャットの通知・広場の吹き出し）→ フレンドのページの その人とのチャット
//    ホーム：   requestChat("taro"); app.open("friends");
//    フレンド： peekChat() で読み、clearFriend() で消す（詳細のメモといっしょに消す）
//  sessionStorage … アプリを閉じると消えるメモ（データベースには入れない）
// ═══════════════════════════════════════════════════════════════
const KEY = "zemi:friends:open";
const CHAT_KEY = "zemi:friends:open-chat";

/** 次にフレンドのページを開いたとき、この人の詳細を出してもらう */
export function requestFriend(userId) {
  try { sessionStorage.setItem(KEY, userId); } catch { /* メモできなくても、フレンドのページは開く */ }
}
/** メモを読む（なければ null） */
export function peekFriend() {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
/** 次にフレンドのページを開いたとき、この人とのチャットを出してもらう */
export function requestChat(userId) {
  try { sessionStorage.setItem(CHAT_KEY, userId); } catch { /* メモできなくても、フレンドのページは開く */ }
}
/** チャットのメモを読む（なければ null） */
export function peekChat() {
  try { return sessionStorage.getItem(CHAT_KEY); } catch { return null; }
}
/** メモを消す（1 回使ったら消す。詳細・チャットの両方） */
export function clearFriend() {
  try { sessionStorage.removeItem(KEY); sessionStorage.removeItem(CHAT_KEY); } catch { /* なにもしない */ }
}
