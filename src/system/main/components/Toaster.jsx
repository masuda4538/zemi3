// ═══════════════════════════════════════════════════════════════
//  右上のお知らせ（トースト通知）を並べて出す。App.jsx に 1 つだけ置いています
//  出すときは main/common/notify.js の notify({ … }) を呼びます
//    ・新しいものが上。マウスを乗せているあいだは消えない。× で消せる
//    ・同じ key のお知らせは 1 つにまとめる（出しなおして、時間も最初から）
//  見た目は App.css の「トースト通知」
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import { onNotify } from "../common/notify.js";

const MAX = 5;                 // 一度に出すのは 5 つまで
const LEAVE_MS = 220;          // 消えるときの動きの時間
/** type ごとの、左のアイコンと読み上げ用の名前 */
const KIND = {
  success: { icon: "check", label: "完了" },
  info:    { icon: "info", label: "お知らせ" },
  warning: { icon: "alert", label: "注意" },
  error:   { icon: "alert", label: "エラー" },
  achieve: { icon: "trophy", label: "アチーブ" },
};

export default function Toaster() {
  const [toasts, setToasts] = useState([]);   // [{ ...toast, leaving }]
  const timers = useRef(new Map());           // id → タイマー

  const remove = (id) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), LEAVE_MS);
  };
  const startTimer = (t) => {
    clearTimeout(timers.current.get(t.id));
    timers.current.set(t.id, setTimeout(() => remove(t.id), t.duration));
  };
  const stopTimer = (id) => { clearTimeout(timers.current.get(id)); timers.current.delete(id); };

  const listRef = useRef(toasts);
  listRef.current = toasts;

  useEffect(() => onNotify((toast) => {
    // 同じ key があれば、それを消して新しいものにする
    if (toast.key) listRef.current.filter((t) => t.key === toast.key).forEach((t) => stopTimer(t.id));
    setToasts((list) => [toast, ...(toast.key ? list.filter((t) => t.key !== toast.key) : list)].slice(0, MAX));
    startTimer(toast);
  }), []);

  useEffect(() => () => timers.current.forEach((id) => clearTimeout(id)), []);

  return (
    <div className="toaster" aria-live="polite">
      {toasts.map((t) => {
        const kind = KIND[t.type] ?? KIND.info;
        const Tag = t.onClick ? "button" : "div";
        return (
          <div
            key={t.id}
            className={`toast is-${t.type}${t.leaving ? " is-leaving" : ""}`}
            role={t.type === "error" ? "alert" : "status"}
            onMouseEnter={() => stopTimer(t.id)}
            onMouseLeave={() => !t.leaving && startTimer(t)}
          >
            <Tag
              type={t.onClick ? "button" : undefined}
              className="toast-main"
              onClick={t.onClick ? () => { t.onClick(); remove(t.id); } : undefined}
            >
              <span className="toast-icon"><Icon name={t.icon ?? kind.icon} /></span>
              <span className="toast-text">
                <span className="sr-only">{kind.label}：</span>
                {t.type === "achieve" && <small>アチーブを手に入れた！</small>}
                <strong>{t.title}</strong>
                {t.message && <span>{t.message}</span>}
              </span>
            </Tag>
            <button type="button" className="toast-close" onClick={() => remove(t.id)} aria-label="お知らせを閉じる">×</button>
          </div>
        );
      })}
    </div>
  );
}
