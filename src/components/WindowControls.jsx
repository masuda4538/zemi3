// ═══════════════════════════════════════════════════════════════
//  画面の上の帯：右上に「最小化・最大化・閉じる」のボタン
//  OS のタイトルバー（灰色の帯）を消したので、その代わりです。
//  帯の何もないところをドラッグするとウィンドウを動かせます（ダブルクリックで最大化／元に戻す）。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";

// Tauri のアプリとして動いているか（ブラウザで開いたときはボタンを出さない）
const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export default function WindowControls() {
  const [maximized, setMaximized] = useState(true);

  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    const update = () => win.isMaximized().then(setMaximized).catch(() => {});
    update();
    // 大きさが変わったら、最大化ボタンの絵を切り替える
    const unlisten = win.onResized(update);
    return () => { unlisten.then((off) => off()); };
  }, []);

  if (!inTauri) return <div className="titlebar" />;
  const win = getCurrentWindow();

  return (
    <div className="titlebar" data-tauri-drag-region>
      <div className="win-buttons">
        <button type="button" className="win-btn" title="最小化" aria-label="最小化" onClick={() => win.minimize()}>
          <svg viewBox="0 0 24 24"><path d="M6 12h12" /></svg>
        </button>
        <button type="button" className="win-btn" title={maximized ? "元のサイズに戻す" : "最大化"} aria-label={maximized ? "元のサイズに戻す" : "最大化"} onClick={() => win.toggleMaximize()}>
          {maximized
            ? <svg viewBox="0 0 24 24"><rect x="6" y="9" width="9" height="9" rx="1.5" /><path d="M9 9V7.5A1.5 1.5 0 0 1 10.5 6h6A1.5 1.5 0 0 1 18 7.5v6a1.5 1.5 0 0 1-1.5 1.5H15" /></svg>
            : <svg viewBox="0 0 24 24"><rect x="6.5" y="6.5" width="11" height="11" rx="1.5" /></svg>}
        </button>
        <button type="button" className="win-btn close" title="閉じる" aria-label="閉じる" onClick={() => win.close()}>
          <svg viewBox="0 0 24 24"><path d="M7 7l10 10M17 7 7 17" /></svg>
        </button>
      </div>
    </div>
  );
}
