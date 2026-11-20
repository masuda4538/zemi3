// ═══════════════════════════════════════════════════════════════
//  左に項目の一覧、右に選んだ項目の中身（記録のページと同じ形）
//  アカウント・設定・アチーブの画面で使います。見た目は settings-layout.css
//  左の項目は左はしに丸いボタンで並べ、右の中身が画面（右側の広い部分）の左右まん中に来るように置きます。
//  左の項目は ↑ ↓（← →）キーでも切りかえられる（となりの項目へ。はしまで行ったら反対のはしへ。記録のページと同じ）
//
//  <SettingsLayout
//    bar={{ icon: "settings", page: "設定", note: "小さな文字" }} … いちばん上のバー（PageBar.jsx）。「設定 › 表示」のように、今の項目も出す
//    head={項目の下に出すもの}           … 名前とアイコンなど（なくてもよい。項目の位置がページごとにずれないように、項目の下に出す）
//    items={[{ id, name, icon, dirty, badge }]} … 左の項目。dirty が true だと「保存していない」青い点、badge は右に小さく出す文字（例："1/3"）
//    current="profile" onSelect={(id) => …}
//    foot={左下に出すもの}               … ログアウトボタンなど（なくてもよい）
//    title="プロフィール" desc="説明"     … 右の見出し
//    aside={右はしに出すもの}            … 「おまけ」の列（なくてもよい）。とても広い画面のときだけ出す
//  >                                       （中に <AsideCard icon="trophy" title="見出し">中身</AsideCard> を並べる）
//    右の中身
//  </SettingsLayout>
// ═══════════════════════════════════════════════════════════════
import { useRef } from "react";
import Icon from "./Icon";
import PageBar from "./PageBar";
import "./settings-layout.css";

export default function SettingsLayout({ bar, head, items, current, onSelect, foot, title, desc, aside, children }) {
  const navRef = useRef(null);

  /** ↑ ↓（← →）キーで項目を切りかえる（となりの項目へ。はしまで行ったら反対のはしへ） */
  const onNavKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = items.findIndex((it) => it.id === current);
    const next = items[(i + step + items.length) % items.length];
    onSelect(next.id);
    navRef.current?.querySelector(`[data-item="${next.id}"]`)?.focus();
  };

  const layout = (
    <div className="sl">
      <aside className="sl-side">
        <nav className="sl-nav" aria-label="項目" ref={navRef} onKeyDown={onNavKey}>
          {items.map((it) => (
            <button
              key={it.id}
              type="button"
              className={`sl-item${current === it.id ? " active" : ""}`}
              aria-current={current === it.id ? "page" : undefined}
              data-item={it.id}
              tabIndex={current === it.id ? 0 : -1}   // Tab キーでは選んでいる項目にだけ止まる（ほかへは ↑ ↓ で動く）
              onClick={() => onSelect(it.id)}
            >
              <Icon name={it.icon} />
              <span className="sl-item-name">{it.name}</span>
              {it.badge && <span className="sl-badge">{it.badge}</span>}
              {it.dirty && <span className="sl-dot" title="保存していない変更があります" aria-label="保存していない変更があります" />}
            </button>
          ))}
        </nav>
        {head && <div className="sl-head">{head}</div>}
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

      {/* 右はしの「おまけ」の列（とても広い画面のときだけ出す。settings-layout.css） */}
      {aside && <aside className="sl-aside" aria-label="おまけ">{aside}</aside>}
    </div>
  );
  if (!bar) return layout;
  // いちばん上のバー：「アイコン ページ名 › 今の項目」と小さな文字
  return (
    <div className="sl-wrap">
      <PageBar icon={bar.icon} page={bar.page} item={items.find((it) => it.id === current)?.name} note={bar.note} />
      {layout}
    </div>
  );
}

/** 「おまけ」の列に並べる小さな枠（見出しのアイコン・見出し・中身） */
export function AsideCard({ icon, title, children }) {
  return (
    <section className="panel sl-aside-card">
      <h2 className="sl-aside-title"><Icon name={icon} />{title}</h2>
      {children}
    </section>
  );
}
