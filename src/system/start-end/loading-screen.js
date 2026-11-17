// ═══════════════════════════════════════════════════════════════
//  スタート画面（青いロード画面）★ 出しておく時間・始め方を変えるときはここ
//  見た目は loading-screen.html。src/main.jsx が、画面の準備ができたときに hideLoadingScreen を呼ぶ
//
//  流れ
//    1. 起動すると、スタビーがぴょんぴょん跳ねる青い画面が出る（下で白い点がくるくる回る＝読み込み中）
//    2. 準備ができて LOADING_MS ミリ秒たったら、点のかわりに「Enter キーを押してはじめる」が出る
//    3. Enter キーを押す（または画面をクリックする）と、ふわっと消えて、アプリ（ログインの画面かホーム）に入る
// ═══════════════════════════════════════════════════════════════

/** 「Enter キーを押してはじめる」を出すまでの、いちばん短い時間（ミリ秒。起動してから数える） */
export const LOADING_MS = 2000;

/** 準備ができたら「Enter キーを押してはじめる」を出し、Enter キー（またはクリック）で消す */
export function hideLoadingScreen() {
  const boot = document.getElementById("boot");
  if (!boot) return;
  const wait = Math.max(0, LOADING_MS - performance.now());   // 起動してからの時間
  setTimeout(() => {
    boot.classList.add("is-ready");                             // 点が消えて「Enter キーを押してはじめる」が出る（loading-screen.html の .boot.is-ready）
    boot.setAttribute("aria-label", "Enter キーを押すと、はじまります");
    const start = (e) => {
      if (e.type === "keydown" && e.key !== "Enter") return;     // Enter キー以外は何もしない
      e.preventDefault();
      e.stopPropagation();                                      // この Enter で、うしろの画面（ログインのボタンなど）が押されないように
      window.removeEventListener("keydown", start, true);
      boot.removeEventListener("click", start);
      boot.classList.add("is-leaving");                         // 0.5 秒かけて消える（loading-screen.html の .boot.is-leaving）
      setTimeout(() => boot.remove(), 550);
    };
    window.addEventListener("keydown", start, true);
    boot.addEventListener("click", start);
  }, wait);
}
