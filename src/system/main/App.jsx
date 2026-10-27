// ═══════════════════════════════════════════════════════════════
//  画面全体
//    ログイン前 … 起動画面（main/login/main.jsx）
//    ログイン後 … 左にアプリのアイコン、右に選んだアプリの画面
//  右の一番上は、最小化・最大化・閉じるのボタンがある帯（WindowControls）です。
//  ページの一覧は apps.js、それぞれの項目（画面と処理）は src/system/application/<項目>/ の中にあります。
//
//  ・起動したときは、必ず起動画面 → ログイン後はホームを開きます。
//  ・アプリを押したときに、その画面のプログラムを読み込んで表示します（アニメーションなし）。
//  ・設定（application/settings/settings.js）はここで持ち、画面全体に反映します。
//  ・各画面には次のものを渡します：
//      page / user / onUserChange / onLogout / settings / onSettings / onResetSettings / confirm
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Sidebar from "./components/Sidebar";
import WindowControls from "./components/WindowControls";
import ConfirmDialog from "./components/ConfirmDialog";
import Start from "./login/main.jsx";
import { logout, inTauri } from "./common/api.js";
import {
  DEFAULTS, loadSettings, saveSettings, applySettings, applyStartup, effectiveTheme, watchSystemTheme,
} from "../application/settings/settings.js";
import { APP_TITLE, PAGES, SETTINGS, START_PAGE, findPage } from "./apps";
import "./App.css";

/** 起動画面からアプリの画面へ切り替わる時間（ミリ秒）。login/login.css のアニメーションと合わせる */
const LEAVE_MS = 750;
/** アプリの画面が組み上がるアニメーションの時間（ミリ秒） */
const ENTER_MS = 1300;

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
  const [user, setUser] = useState(null);               // ログインしている人（ログイン前は null）
  const [phase, setPhase] = useState("start");          // "start"：起動画面 / "leaving"：切り替え中 / "app"：アプリの画面
  const [entering, setEntering] = useState(false);      // アプリの画面が組み上がるアニメーション中
  const [current, setCurrent] = useState(START_PAGE);   // 左で選んでいるページ（ログイン後は必ずホーム）
  const [shown, setShown] = useState(null);             // 右に出しているページ { page, Component }
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(loadSettings);
  const [dialog, setDialog] = useState(null);           // 確認のダイアログ（null のときは出さない）
  const [, setTick] = useState(0);                      // 「PC に合わせる」で PC の色が変わったとき用
  const ticket = useRef(0);   // 連続で押されたときに、最後に押したページだけを出すための番号
  const stageRef = useRef(null);
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  // ───── 設定 ─────
  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    applyStartup(loadSettings());   // 起動したときだけ（最大化するか）
    return watchSystemTheme(() => { applySettings(settingsRef.current); setTick((n) => n + 1); });
  }, []);

  const changeSettings = useCallback((patch) => setSettings((s) => ({ ...s, ...patch })), []);
  const resetSettings = useCallback(() => setSettings({ ...DEFAULTS }), []);

  // ───── 確認のダイアログ：await confirm({...}) で はい/いいえ が返る ─────
  const confirm = useCallback((options) => new Promise((resolve) => setDialog({ ...options, resolve })), []);
  const answer = useCallback((ok) => {
    setDialog((d) => { d?.resolve(ok); return null; });
  }, []);

  // ───── アプリを閉じる前に確認する（× ボタン・Alt + F4 の両方） ─────
  useEffect(() => {
    if (!inTauri) return;
    const win = getCurrentWindow();
    const unlisten = win.onCloseRequested(async (event) => {
      if (!settingsRef.current.confirmClose) return;   // 確認しない設定なら、そのまま閉じる
      event.preventDefault();
      const ok = await confirm({ title: "アプリを閉じますか？", message: "保存していない入力は消えます。", okLabel: "閉じる", danger: true });
      if (ok) win.destroy();
    });
    return () => { unlisten.then((off) => off()); };
  }, [confirm]);

  // ───── ページが選ばれたら：読み込んで入れ替える（起動画面の間にホームを先に読み込んでおく） ─────
  useEffect(() => {
    const page = findPage(current);
    const my = ++ticket.current;
    if (phase !== "start") document.title = `${page.name} - ${APP_TITLE}`;
    loadPage(page)
      .then((Component) => {
        if (my !== ticket.current) return;
        setError("");
        setShown({ page, Component });
        stageRef.current?.scrollTo(0, 0);
      })
      .catch((e) => {
        if (my !== ticket.current) return;
        setError(`「${page.name}」の画面を読み込めませんでした：${e?.message ?? e}`);
        setShown(null);
      });
  }, [current]);

  // キーボード：Ctrl + 1〜5 で各ページ、Ctrl + , で設定（ログイン後だけ）
  useEffect(() => {
    if (phase !== "app") return;
    const onKey = (e) => {
      if (dialog) return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= PAGES.length) { e.preventDefault(); setCurrent(PAGES[n - 1].id); }
      if (e.key === ",") { e.preventDefault(); setCurrent(SETTINGS.id); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, dialog]);

  // ログインできたとき：ホームを開いて、起動画面からアプリの画面へ切り替える
  const handleLoggedIn = (u) => {
    setUser(u);
    setCurrent(START_PAGE);
    setPhase("leaving");
    setEntering(true);
    document.title = `${findPage(START_PAGE).name} - ${APP_TITLE}`;
    setTimeout(() => setPhase("app"), LEAVE_MS);
    setTimeout(() => setEntering(false), ENTER_MS);
  };

  // ログアウト：（設定によっては確認してから）起動画面に戻る。戻ったら true
  const handleLogout = async () => {
    if (settings.confirmLogout) {
      const ok = await confirm({ title: "ログアウトしますか？", message: "起動画面に戻ります。", okLabel: "ログアウト", danger: true });
      if (!ok) return false;
    }
    try { await logout(); } catch { /* つながらなくても画面は戻す */ }
    setUser(null);
    setCurrent(START_PAGE);
    setPhase("start");
    document.title = APP_TITLE;
    return true;
  };

  const theme = effectiveTheme(settings);
  const Page = shown?.Component;
  const accent = (shown?.page ?? findPage(current)).color;

  return (
    <>
      {phase !== "start" && user && (
        <div className={`shell${entering ? " is-entering" : ""}`}>
          <Sidebar current={current} onSelect={setCurrent} theme={theme} onTheme={(t) => changeSettings({ theme: t })} />
          <div className="main-col">
            <WindowControls />
            <main className="stage" ref={stageRef} style={{ "--accent": accent }}>
              <section className="page">
                {error
                  ? <p className="page-error">{error}</p>
                  : Page && (
                    <Page
                      page={shown.page}
                      user={user}
                      onUserChange={setUser}
                      onLogout={handleLogout}
                      settings={settings}
                      onSettings={changeSettings}
                      onResetSettings={resetSettings}
                      confirm={confirm}
                    />
                  )}
              </section>
            </main>
          </div>
        </div>
      )}
      {phase !== "app" && <Start leaving={phase === "leaving"} settings={settings} onLoggedIn={handleLoggedIn} />}
      <ConfirmDialog dialog={dialog} onAnswer={answer} />
    </>
  );
}
