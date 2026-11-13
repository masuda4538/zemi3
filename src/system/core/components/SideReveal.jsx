// ═══════════════════════════════════════════════════════════════
//  サイドバーを隠したときに、左下に出る「出す」ボタン（App.jsx から使う）
//  隠すボタン（src/system/sidebar の .side-hide）と同じ場所・同じ大きさなので、
//  サイドバーが左へすべって消えても、ボタンだけはその場に残っているように見えます。
//    隠す … 隠すボタンと同じ見た目で出る → すぐに青い「出す」ボタンに変わる
//    出す … 青から元の見た目に戻りながら、サイドバーがすべって戻ってくる → 戻りきったら消える
//  見た目は App.css の .side-reveal
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import Icon from "./Icon";

/** サイドバーがすべる時間（App.css の .sidebar-frame の transition と同じ） */
const SLIDE_MS = 250;

export default function SideReveal({ hidden, onShow }) {
  const [mounted, setMounted] = useState(hidden);   // ボタンを置いているか
  const [on, setOn] = useState(false);              // 青い「出す」ボタンになっているか

  useEffect(() => {
    if (hidden) {
      setMounted(true);
      // 置いた次の描画で青にする（いきなり青だと、隠すボタンから変わる様子が見えないため）
      let id = requestAnimationFrame(() => { id = requestAnimationFrame(() => setOn(true)); });
      return () => cancelAnimationFrame(id);
    }
    setOn(false);                                   // 元の見た目に戻しながら
    const t = setTimeout(() => setMounted(false), SLIDE_MS + 30);   // サイドバーが戻りきったら消す
    return () => clearTimeout(t);
  }, [hidden]);

  if (!mounted) return null;
  return (
    <button
      type="button"
      className={`side-reveal${on ? " is-on" : ""}`}
      onClick={onShow}
      disabled={!hidden}
      title="サイドバーを出す"
      aria-label="サイドバーを出す"
    >
      <Icon name="sideClose" className="icon-close" />
      <Icon name="sideOpen" className="icon-open" />
    </button>
  );
}
