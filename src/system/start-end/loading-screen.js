// ═══════════════════════════════════════════════════════════════
//  スタート画面（青いロード画面）を消す ★ 出しておく時間を変えるときはここ
//  見た目は loading-screen.html。消すのは src/main.jsx（画面の準備ができたとき）から呼ぶ hideLoadingScreen
// ═══════════════════════════════════════════════════════════════

/** スタート画面を出しておく時間（ミリ秒）。起動してからこの時間がたったら、ふわっと消す */
export const LOADING_MS = 2000;

/** スタート画面を消す（読み込みが長くかかったときは、終わってからすぐ消す） */
export function hideLoadingScreen() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  const wait = Math.max(0, LOADING_MS - performance.now());   // 起動してからの時間
  setTimeout(() => {
    boot.classList.add("is-leaving");                          // 0.5 秒かけて消える（loading-screen.html の .boot.is-leaving）
    setTimeout(() => boot.remove(), 550);
  }, wait);
}
