// ═══════════════════════════════════════════════════════════════
//  画面全体：左にアプリのアイコン、右に選んだアプリの画面
//  右の一番上は、最小化・最大化・閉じるのボタンがある帯（WindowControls）です。
//  ページの一覧は apps.js、それぞれの項目（画面と処理）は src/system/<項目>/ の中にあります。
//
//  ・起動したときは、必ずホームを開きます。
//  ・アプリを押すと、今の画面がぼやける → その間に新しい画面を読み込む →
//    新しい画面がぼやけた状態からくっきり見える、の順に切り替わります。
//    （アニメーションは画面の外側の枠にかけているので、各画面のプログラムには影響しません）
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import WindowControls from "./components/WindowControls";
import { APP_TITLE, PAGES, SETTINGS, START_PAGE, findPage } from "./apps";
import "./App.css";

/** ぼやけていく時間（ミリ秒）。読み込みがこれより長いときは、終わるまでぼやけたまま待つ */
const BLUR_OUT_MS = 220;

// 表示モードを覚えておく（次に起動したときもそのまま）
const load = (key, fallback) => {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};
const save = (key, value) => {
  try { localStorage.setItem(key, value); } catch { /* 保存できなくても動く */ }
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// 一度読み込んだ画面は覚えておく（2 回目からはすぐ出る）
const loaded = new Map();
const loadPage = (page) => {
  if (!loaded.has(page.id)) {
    loaded.set(page.id, page.load().then((m) => m.default).catch((e) => {
      loaded.delete(page.id); // 失敗したときは、次に押したときにもう一度読み込む
      throw e;
    }));
  }
  return loaded.get(page.id);
};

export default function App() {
  const [current, setCurrent] = useState(START_PAGE);   // 左で選んでいるページ（起動時は必ずホーム）
  const [shown, setShown] = useState(null);             // 右に出しているページ { page, Component, ticket }
  const [blurred, setBlurred] = useState(true);         // true のあいだ、右の画面がぼやける
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(() => (load("theme", "light") === "dark" ? "dark" : "light"));
  const ticket = useRef(0);   // 連続で押されたときに、最後に押したページだけを出すための番号
  const stageRef = useRef(null);

  // 表示モードを画面全体に反映
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    save("theme", theme);
  }, [theme]);

  // ページが選ばれたら：ぼやかす → 読み込む → 入れ替える
  useEffect(() => {
    const page = findPage(current);
    const my = ++ticket.current;
    document.title = `${page.name} - ${APP_TITLE}`;
    setBlurred(true);
    Promise.all([loadPage(page), wait(BLUR_OUT_MS)])
      .then(([Component]) => {
        if (my !== ticket.current) return;
        setError("");
        setShown({ page, Component, ticket: my });
        stageRef.current?.scrollTo(0, 0);
      })
      .catch((e) => {
        if (my !== ticket.current) return;
        setError(`「${page.name}」の画面を読み込めませんでした：${e?.message ?? e}`);
        setShown(null);
        setBlurred(false);
      });
  }, [current]);

  // 入れ替えた画面が出たら、ぼやけた状態からくっきりにする
  useEffect(() => {
    if (!shown) return;
    const id = requestAnimationFrame(() => {
      if (shown.ticket === ticket.current) setBlurred(false);
    });
    return () => cancelAnimationFrame(id);
  }, [shown]);

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

  const Page = shown?.Component;
  const accent = (shown?.page ?? findPage(current)).color;

  return (
    <div className="shell">
      <Sidebar current={current} onSelect={setCurrent} theme={theme} onTheme={setTheme} />
      <div className="main-col">
        <WindowControls />
        <main className="stage" ref={stageRef} style={{ "--accent": accent }}>
          <section className={`page${blurred ? " is-blurred" : ""}`} aria-busy={blurred}>
            {error
              ? <p className="page-error">{error}</p>
              : Page && <Page page={shown.page} theme={theme} onTheme={setTheme} />}
          </section>
        </main>
      </div>
    </div>
  );
}
