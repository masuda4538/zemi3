// ═══════════════════════════════════════════════════════════════
//  確認のダイアログ（「ログアウトしますか？」など）
//  App.jsx の confirm で開きます：
//    confirm({ title, message, okLabel, danger }) → はい なら true、いいえ なら false
//  Esc キー・外側のクリックで「いいえ」、Enter で「はい」
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import "./form.css";

export default function ConfirmDialog({ dialog, onAnswer }) {
  const okRef = useRef(null);

  useEffect(() => {
    if (!dialog) return;
    okRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") { e.preventDefault(); onAnswer(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onAnswer]);

  if (!dialog) return null;
  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onAnswer(false); }}>
      <div className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title">{dialog.title}</h2>
        {dialog.message && <p>{dialog.message}</p>}
        <div className="dialog-actions">
          <button type="button" className="btn btn-ghost" onClick={() => onAnswer(false)}>{dialog.cancelLabel ?? "キャンセル"}</button>
          <button type="button" ref={okRef} className={`btn ${dialog.danger ? "btn-danger-fill" : "btn-primary"}`} onClick={() => onAnswer(true)}>
            {dialog.okLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
