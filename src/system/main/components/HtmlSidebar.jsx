// ═══════════════════════════════════════════════════════════════
//  左のサイドバーを、窓（iframe）に出す部品（App.jsx から使う）
//  サイドバーの中身は、普通の HTML で作っています → src/system/sidebar/index.html
//
//  窓の中の JS では、app にいつもの機能（main/frame/bridge.js）に加えて、app.sidebar が使えます
//    app.sidebar.state()           … { current, theme, user, top: [ページ], bottom: [ページ] }
//    app.sidebar.onChange(関数)    … 開いているページ・テーマ・アカウントが変わったら呼ぶ
//    app.sidebar.setTheme("dark")  … ホワイト／ダークを切りかえる
//    app.sidebar.hide()            … サイドバーを隠す
//    app.open("quiz")              … そのページを開く
// ═══════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef } from "react";
import { registerFrame } from "../frame/bridge.js";
import { PAGES, BOTTOM_PAGES } from "../apps";

const URL = "/src/system/sidebar/index.html";
const pageInfo = (p) => ({ id: p.id, name: p.name, icon: p.icon });

export default function HtmlSidebar({ current, theme, user, onSelect, onTheme, onHide }) {
  const frameRef = useRef(null);
  const listeners = useRef(new Set());       // app.sidebar.onChange で登録された関数

  // いちばん新しい値を入れておく（窓の中から呼ばれたときに使う）
  const now = useRef({});
  now.current = { current, theme, user, onSelect, onTheme, onHide };

  /** 窓の中に渡す「今の状態」 */
  const snapshot = () => ({
    current: now.current.current,
    theme: now.current.theme,
    user: now.current.user ? { name: now.current.user.name, avatar: now.current.user.avatar ?? null } : null,
    top: PAGES.map(pageInfo),
    bottom: BOTTOM_PAGES.map(pageInfo),
  });

  // 窓を登録する（窓の中の index.html が開くと、bridge.js が window.app を渡す）
  useLayoutEffect(() => registerFrame(frameRef.current, {
    page: { id: "sidebar", name: "サイドバー" },
    getUser: () => now.current.user,
    open: (id) => now.current.onSelect(id),
    extra: ({ watch }) => ({
      sidebar: {
        state: snapshot,
        onChange: (fn) => watch((cb) => { listeners.current.add(cb); return () => listeners.current.delete(cb); }, fn),
        setTheme: (t) => now.current.onTheme(t === "dark" ? "dark" : "light"),
        hide: () => now.current.onHide(),
      },
    }),
  }), []);

  // 開いているページ・テーマ・アカウントが変わったら、窓の中に知らせる
  useEffect(() => {
    const state = snapshot();
    listeners.current.forEach((fn) => fn(state));
  }, [current, theme, user]);

  return <iframe ref={frameRef} className="sidebar-frame" src={URL} title="サイドバー" data-app-id="sidebar" />;
}
