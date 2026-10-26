// ═══════════════════════════════════════════════════════════════
//  画面全体：左にアプリのアイコン、右に選んだアプリの画面
//  ページの一覧は apps.js、それぞれの画面は src/pages/*.jsx にあります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import { APP_TITLE, PAGES, SETTINGS, findPage } from "./apps";
import "./App.css";

// 最後に開いていたページと、表示モードを覚えておく（次に起動したときもそのまま）
const load = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* 保存できなくても動く */ }
};

export default function App() {
  const [current, setCurrent] = useState(() => findPage(load("page", "home")).id);
  const [theme, setTheme] = useState(() => (load("theme", "light") === "dark" ? "dark" : "light"));

  // 表示モードを画面全体に反映
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("theme", theme);
  }, [theme]);

  // ページを開いたら覚えておく・タイトルを変える
  useEffect(() => {
    save("page", current);
    document.title = `${findPage(current).name} - ${APP_TITLE}`;
  }, [current]);

  // キーボード：Ctrl + 1〜5 で各ページ、Ctrl + , で設定
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= PAGES.length) { e.preventDefault(); setCurrent(PAGES[n - 1].id); }
      if (e.key === ",") { e.preventDefault(); setCurrent(SETTINGS.id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const page = findPage(current);
  const Page = page.component;

  return (
    <div className="shell">
      <Sidebar current={current} onSelect={setCurrent} theme={theme} onTheme={setTheme} />
      <main className="stage" style={{ "--accent": page.color }}>
        {/* key を付けると、ページを切り替えたときにアニメーションし直す */}
        <section className="page" key={page.id}>
          <Page page={page} theme={theme} onTheme={setTheme} />
        </section>
      </main>
    </div>
  );
}
