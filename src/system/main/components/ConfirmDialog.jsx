// ═══════════════════════════════════════════════════════════════
//  確認のダイアログ（「ログアウトしますか？」など）
//  App.jsx の confirm で開きます：
//    confirm({ title, message, okLabel, cancelLabel, danger, cat }) → はい なら true、いいえ なら false
//  Esc キー・外側のクリックで「いいえ」、Enter で「はい」
//
//  cat を付けると、ダイアログの上のふちに黒猫が座ります（DialogCat.jsx）
//    cat: { says: "もう帰るの…？", bye: "またね！" }
//    ・ふだんは さみしそう。「いいえ」にマウスを乗せると うれしそう、「はい」に乗せると なみだ目
//    ・「はい」を押すと、手をふって bye の言葉を出してから閉じる（約 1 秒）
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import DialogCat from "./DialogCat";
import "./form.css";

/** 猫が手をふっている時間（ミリ秒）。この時間がたってから「はい」を返す */
const BYE_MS = 1000;

/** 「アニメーションを減らす」になっているか（そのときは手をふらずに、すぐ閉じる） */
const reduceMotion = () =>
  document.documentElement.classList.contains("reduce-motion")
  || !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export default function ConfirmDialog({ dialog, onAnswer }) {
  const okRef = useRef(null);
  const [mood, setMood] = useState("sad");   // 猫の気持ち（DialogCat.jsx）
  const [bye, setBye] = useState(false);     // 「はい」を押して、猫が手をふっている

  // ダイアログが開くたびに、猫の気持ちを元にもどす
  useEffect(() => { setMood("sad"); setBye(false); }, [dialog]);

  useEffect(() => {
    if (!dialog) return;
    okRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && !bye) { e.preventDefault(); onAnswer(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, onAnswer, bye]);

  if (!dialog) return null;
  const cat = dialog.cat;

  const yes = () => {
    if (bye) return;
    if (!cat || reduceMotion()) { onAnswer(true); return; }
    setBye(true);                               // 手をふって「またね！」
    setTimeout(() => onAnswer(true), BYE_MS);
  };
  const no = () => { if (!bye) onAnswer(false); };
  // マウスを乗せたボタンで、猫の気持ちが変わる（手をふっているあいだは変えない）
  const hover = (m) => () => { if (!bye) setMood(m); };

  const catMood = bye ? "bye" : mood;
  const says = bye ? (cat?.bye ?? "またね！") : mood === "happy" ? "やったー！" : mood === "cry" ? "さみしい…" : cat?.says;

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) no(); }}>
      <div className={`dialog${cat ? " has-cat" : ""}`} role="alertdialog" aria-modal="true" aria-labelledby="dialog-title">
        {cat && <DialogCat mood={catMood} says={says} />}
        <h2 id="dialog-title">{dialog.title}</h2>
        {dialog.message && <p>{dialog.message}</p>}
        <div className="dialog-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={no}
            disabled={bye}
            onMouseEnter={hover("happy")}
            onMouseLeave={hover("sad")}
          >
            {dialog.cancelLabel ?? "キャンセル"}
          </button>
          <button
            type="button"
            ref={okRef}
            className={`btn ${dialog.danger ? "btn-danger-fill" : "btn-primary"}`}
            onClick={yes}
            onMouseEnter={hover("cry")}
            onMouseLeave={hover("sad")}
          >
            {dialog.okLabel ?? "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
