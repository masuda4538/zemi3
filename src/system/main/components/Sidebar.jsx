// 左のサイドバー：上にホームと 4 つのアプリ、下に設定・アカウント・ホワイト／ダークの切り替え・サイドバーを隠すボタン
// 隠したあとに出すボタン（左下の「»」）は App.jsx にあります
import Icon from "./Icon";
import Avatar from "./Avatar";
import { PAGES, BOTTOM_PAGES } from "../apps";

function SideItem({ page, active, onSelect, user }) {
  // 「アカウント」は、アイコンの画像を設定していればその画像を出す
  const showAvatar = page.id === "account" && user?.avatar;
  return (
    <button
      type="button"
      className={`side-item${active ? " active" : ""}`}
      style={{ "--accent": page.color }}
      aria-current={active ? "page" : undefined}
      aria-label={page.name}
      title={page.name}
      onClick={() => onSelect(page.id)}
    >
      <span className="side-ico">{showAvatar ? <Avatar user={user} size={34} /> : <Icon name={page.icon} />}</span>
      <span className="side-label">{page.name}</span>
    </button>
  );
}

export default function Sidebar({ current, onSelect, theme, onTheme, onHide, user }) {
  return (
    <nav className="sidebar" aria-label="アプリ">
      <div className="side-group">
        {PAGES.map((p) => (
          <SideItem key={p.id} page={p} active={current === p.id} onSelect={onSelect} />
        ))}
      </div>
      <div className="side-group bottom">
        {BOTTOM_PAGES.map((p) => (
          <SideItem key={p.id} page={p} active={current === p.id} onSelect={onSelect} user={user} />
        ))}
        <div className="side-theme" role="radiogroup" aria-label="表示モード">
          <button type="button" role="radio" title="ホワイト" aria-checked={theme === "light"} className={theme === "light" ? "active" : ""} onClick={() => onTheme("light")}>
            <Icon name="sun" />ホワイト
          </button>
          <button type="button" role="radio" title="ダーク" aria-checked={theme === "dark"} className={theme === "dark" ? "active" : ""} onClick={() => onTheme("dark")}>
            <Icon name="moon" />ダーク
          </button>
        </div>
        {/* いちばん下：サイドバーを隠す（画面を広く使う） */}
        <button type="button" className="side-hide" onClick={onHide} title="サイドバーを隠す" aria-label="サイドバーを隠す">
          <Icon name="sideClose" />
        </button>
      </div>
    </nav>
  );
}
