// ═══════════════════════════════════════════════════════════════
//  ページの上のバー（記録・アチーブ・設定・アカウントで使う）
//    左に「アイコン ページ名 › 今開いている項目」、その横に小さな文字（note）、右に好きなもの（children）
//    右はしには、いつもダーク／ホワイトの切り替えボタン（ThemeButton。月 ↔ 太陽のアイコン）
//
//  <PageBar icon="settings" page="設定" item="表示" note="変えるとすぐ反映されます">
//    右に出すもの（ボタンなど。なくてもよい）
//  </PageBar>
//  見た目は page-bar.css。上にくっついたまま（ページをスクロールしても上に残る）
// ═══════════════════════════════════════════════════════════════
import { useContext } from "react";
import Icon from "./Icon";
import { ThemeContext } from "../theme-context.js";
import "./page-bar.css";

export default function PageBar({ icon, page, item, note, children }) {
  return (
    <header className="page-bar">
      <span className={`page-bar-icon is-${icon}`}><Icon name={icon} /></span>
      <nav className="page-bar-crumbs" aria-label="今開いているところ">
        <strong>{page}</strong>
        {item && <><span className="page-bar-sep" aria-hidden="true">›</span><span className="page-bar-item" key={item}>{item}</span></>}
      </nav>
      {note && <span className="page-bar-note">{note}</span>}
      <div className="page-bar-right">
        {children}
        <ThemeButton />
      </div>
    </header>
  );
}

/** ダーク／ホワイトの切り替えボタン（ホワイトのときは月、ダークのときは太陽のアイコン）
 *  押すと設定の「テーマ」も変わる（core/App.jsx の ThemeContext。Ctrl+Shift+D と同じ） */
function ThemeButton() {
  const box = useContext(ThemeContext);
  if (!box) return null;
  const dark = box.theme === "dark";
  const label = dark ? "ホワイトモードにする" : "ダークモードにする";
  return (
    <button type="button" className="page-bar-theme" onClick={box.toggle} title={label} aria-label={label}>
      <Icon key={dark ? "sun" : "moon"} name={dark ? "sun" : "moon"} />
    </button>
  );
}
