// ═══════════════════════════════════════════════════════════════
//  ほかの画面から「フレンド詳細」を開く（ホームの広場・ポスト → フレンドのページ）
//  ホームは窓（iframe）の中、フレンドのページは外の画面なので、だれを開くかを sessionStorage にメモしてわたす
//    ホーム：   requestFriend("taro"); app.open("friends");
//    フレンド： peekFriend() で読み、clearFriend() で消す（pages/friends/main.jsx）
//  sessionStorage … アプリを閉じると消えるメモ（データベースには入れない）
// ═══════════════════════════════════════════════════════════════
const KEY = "zemi:friends:open";

/** 次にフレンドのページを開いたとき、この人の詳細を出してもらう */
export function requestFriend(userId) {
  try { sessionStorage.setItem(KEY, userId); } catch { /* メモできなくても、フレンドのページは開く */ }
}
/** メモを読む（なければ null） */
export function peekFriend() {
  try { return sessionStorage.getItem(KEY); } catch { return null; }
}
/** メモを消す（1 回使ったら消す） */
export function clearFriend() {
  try { sessionStorage.removeItem(KEY); } catch { /* なにもしない */ }
}
