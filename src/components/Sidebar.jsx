// 左のサイドバー：上にホームと 4 つのアプリ、下に設定・アカウント・ホワイト／ダークの切り替え
import Icon from "./Icon";
import { PAGES, BOTTOM_PAGES } from "../apps";

function SideItem({ page, active, onSelect }) {
  return (
    <button
      type="button"
      className={`side-item${active ? " active" : ""}`}
      style={{ "--accent": page.color }}
      aria-current={active ? "page" : undefined}
      aria-label={page.name}
      onClick={() => onSelect(page.id)}
    >
      <span className="side-ico"><Icon name={page.icon} /></span>
      <span className="side-label">{page.name}</span>
    </button>
  );
}

export default function Sidebar({ current, onSelect, theme, onTheme }) {
  return (
    <nav className="sidebar" aria-label="アプリ">
      <div className="side-group">
        {PAGES.map((p) => (
          <SideItem key={p.id} page={p} active={current === p.id} onSelect={onSelect} />
        ))}
      </div>
      <div className="side-group bottom">
        {BOTTOM_PAGES.map((p) => (
          <SideItem key={p.id} page={p} active={current === p.id} onSelect={onSelect} />
        ))}
        <div className="side-theme" role="radiogroup" aria-label="表示モード">
          <button type="button" role="radio" aria-checked={theme === "light"} className={theme === "light" ? "active" : ""} onClick={() => onTheme("light")}>
            <Icon name="sun" />ホワイト
          </button>
          <button type="button" role="radio" aria-checked={theme === "dark"} className={theme === "dark" ? "active" : ""} onClick={() => onTheme("dark")}>
            <Icon name="moon" />ダーク
          </button>
        </div>
      </div>
    </nav>
  );
}
