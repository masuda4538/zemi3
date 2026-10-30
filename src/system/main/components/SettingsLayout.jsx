// ═══════════════════════════════════════════════════════════════
//  左に項目の一覧、右に選んだ項目の中身（GitHub の Settings のような形）
//  アカウント・設定・アチーブの画面で使います。見た目は settings-layout.css
//  右の中身が画面（右側の広い部分）の左右まん中に来るように並べます。
//
//  <SettingsLayout
//    head={左上に出すもの}               … 名前とアイコンなど（なくてもよい）
//    items={[{ id, name, icon, dirty, badge }]} … 左の項目。dirty が true だと「保存していない」青い点、badge は右に小さく出す文字（例："1/3"）
//    current="profile" onSelect={(id) => …}
//    foot={左下に出すもの}               … ログアウトボタンなど（なくてもよい）
//    title="プロフィール" desc="説明"     … 右の見出し
//  >
//    右の中身
//  </SettingsLayout>
// ═══════════════════════════════════════════════════════════════
import Icon from "./Icon";
import "./settings-layout.css";

export default function SettingsLayout({ head, items, current, onSelect, foot, title, desc, children }) {
  return (
    <div className="sl">
      <aside className="sl-side">
        {head && <div className="sl-head">{head}</div>}
        <nav className="sl-nav" aria-label="項目">
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`sl-item${current === it.id ? " active" : ""}`}
              aria-current={current === it.id ? "page" : undefined}
              onClick={() => onSelect(it.id)}
            >
              <Icon name={it.icon} />
              <span className="sl-item-name">{it.name}</span>
              {it.badge && <span className="sl-badge">{it.badge}</span>}
              {it.dirty && <span className="sl-dot" title="保存していない変更があります" aria-label="保存していない変更があります" />}
            </button>
          ))}
        </nav>
        {foot && <div className="sl-foot">{foot}</div>}
      </aside>

      <section className="sl-main">
        <header className="sl-title">
          <h1>{title}</h1>
          {desc && <p>{desc}</p>}
        </header>
        {/* key を付けて、項目を切り替えるたびに中身を作り直す（ふわっと出す） */}
        <div className="sl-body" key={current}>{children}</div>
      </section>
    </div>
  );
}
