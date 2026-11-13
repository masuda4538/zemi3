// ═══════════════════════════════════════════════════════════════
//  終了画面（× や Alt + F4 で閉じるときの「アプリを閉じますか？」）★ 文を変えるときはここ
//
//  ・閉じる前に、使った時間を記録に足す（core/storage/usage.js）
//  ・設定の「閉じる前に確認する」がオンのときだけ、確認の画面を出す（オフならそのまま閉じる）
//  ・確認の画面そのもの（枠・ボタン）は、ほかの確認とも同じ部品です（core/components/ConfirmDialog.jsx）
//  呼んでいるところ：core/App.jsx（watchExit）
// ═══════════════════════════════════════════════════════════════
import { getCurrentWindow } from "@tauri-apps/api/window";
import { inTauri } from "../core/storage/account.js";
import { flushUsage } from "../core/storage/usage.js";

/** 確認の画面に出す文 */
export const EXIT_DIALOG = {
  title: "アプリを閉じますか？",
  message: "保存していない入力は消えます。",
  okLabel: "閉じる",
  cancelLabel: "まだいる",
  danger: true,
};

/** 閉じようとしたときに確認するようにする。やめるときは返ってきた関数を呼ぶ
 *  confirm … core/App.jsx の confirm（はい なら true）
 *  shouldConfirm … 確認するか（設定の「閉じる前に確認する」）を返す関数 */
export function watchExit({ confirm, shouldConfirm }) {
  if (!inTauri) return () => {};   // ブラウザで開いたとき（npm run dev）は何もしない
  const win = getCurrentWindow();
  const unlisten = win.onCloseRequested(async (event) => {
    flushUsage();   // 使った時間を、閉じる前に記録に足す
    if (!shouldConfirm()) return;   // 確認しない設定なら、そのまま閉じる
    event.preventDefault();
    if (await confirm(EXIT_DIALOG)) win.destroy();
  });
  return () => { unlisten.then((off) => off()); };
}
