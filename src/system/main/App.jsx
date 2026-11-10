// ═══════════════════════════════════════════════════════════════
//  画面全体：左にサイドバー（src/system/sidebar/index.html）、右に選んだアプリの画面
//  右の一番上は、最小化・最大化・閉じるのボタンがある帯（WindowControls）です。
//  ページの一覧は apps.js、それぞれの項目（画面と処理）は src/system/application/<項目>/ の中にあります。
//
//  ・起動したら、すぐにホームを開きます（ログインしていなくても、ゲストとして全部使える）。
//  ・ログインは、左の「アカウント」を押して行います（src/system/pages/account/）。
//    一度ログインしたら、ログアウトするまで覚えています（main/common/api.js の session.json）。
//    アチーブは、ログインしているときだけ記録します。
//  ・アプリを押したときに、その画面のプログラムを読み込んで表示します（アニメーションなし）。
//  ・左のサイドバーは、いちばん下のボタンで隠せます（左下の「»」で出す。保存はしない）。
//  ・設定（src/system/pages/settings/settings.js）はここで持ち、画面全体に反映します。
//  ・各画面には次のものを渡します：
//      page / user / onUserChange / onLogin / onLogout / settings / onSettings / onResetSettings / confirm / onOpenPage
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import HtmlSidebar from "./components/HtmlSidebar";   // 左のサイドバー（中身は src/system/sidebar/index.html）
import SideReveal from "./components/SideReveal";
import WindowControls from "./components/WindowControls";
import ConfirmDialog from "./components/ConfirmDialog";
import Toaster from "./components/Toaster";
import { notify } from "./common/notify.js";
import { unlockAchievement, onAchievementUnlocked } from "./common/achievements.js";
import { findAchievement } from "../pages/achieve/achieve.js";
import { logout, inTauri, savedUser } from "./common/api.js";
import {
  DEFAULTS, loadSettings, saveSettings, applySettings, applyStartup, effectiveTheme, watchSystemTheme,
} from "../pages/settings/settings.js";
import { APP_TITLE, START_PAGE, findPage } from "./apps";
import { comboFromEvent, actionOfCombo } from "./shortcuts.js";
import "./App.css";

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
  const [user, setUser] = useState(savedUser);          // ログインしている人（ゲストのときは null）。前回のログインを覚えている
  const [current, setCurrent] = useState(START_PAGE);   // 左で選んでいるページ（起動したときはホーム）
  const [sideHidden, setSideHidden] = useState(false);   // 左のサイドバーを隠しているか（アプリを閉じると元にもどる）
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
      const ok = await confirm({
        title: "アプリを閉じますか？", message: "保存していない入力は消えます。",
        okLabel: "閉じる", cancelLabel: "まだいる", danger: true,
        cat: { says: "もう帰るの…？", bye: "またね！" },   // 上に猫が座る（ConfirmDialog.jsx）
      });
      if (ok) win.destroy();
    });
    return () => { unlisten.then((off) => off()); };
  }, [confirm]);

  // ───── ページが選ばれたら：読み込んで入れ替える ─────
  useEffect(() => {
    const page = findPage(current);
    const my = ++ticket.current;
    document.title = `${page.name} - ${APP_TITLE}`;
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

  // ───── キーボードのショートカット ─────
  //  どのキーで何をするかは、設定の settings.shortcuts（設定 → キーボード で登録できる）
  //  操作の一覧は shortcuts.js。操作を増やしたら、ここに動きを足す
  const runShortcut = (id) => {
    if (id.startsWith("page:")) { setCurrent(id.slice(5)); return; }
    if (id === "sidebar") { setSideHidden((v) => !v); return; }
    if (id === "theme") { changeSettings({ theme: effectiveTheme(settingsRef.current) === "dark" ? "light" : "dark" }); return; }
    if (id === "logout" && user) { handleLogout(); }
  };
  const runShortcutRef = useRef(runShortcut);
  runShortcutRef.current = runShortcut;

  useEffect(() => {
    const onKey = (e) => {
      if (dialog || e.repeat) return;
      const combo = comboFromEvent(e);
      const action = actionOfCombo(settingsRef.current.shortcuts, combo);
      if (!action) return;
      e.preventDefault();
      runShortcutRef.current(action.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  // アチーブを手に入れたら、右上にお知らせ（押すとアチーブのページを開く）
  useEffect(() => onAchievementUnlocked(({ appId, achId }) => {
    const ach = findAchievement(appId, achId);
    if (!ach) return;
    notify({
      type: "achieve", icon: ach.icon, title: ach.name, message: `${ach.appName}・${ach.desc}`,
      onClick: () => setCurrent("achieve"),
    });
  }), []);

  // ホームのアチーブ「夜ふかし」：ログイン中にダークモードになったら
  const theme0 = effectiveTheme(settings);
  useEffect(() => { if (user && theme0 === "dark") unlockAchievement("home", "night-mode"); }, [user, theme0]);

  // ログインできたとき（アカウントのページから呼ばれる）：アカウントのページのまま、プロフィールが出る
  const handleLogin = (u) => {
    setUser(u);
    notify({ type: "success", title: "ログインしました", message: `ようこそ、${u.name} さん` });
    setTimeout(() => unlockAchievement("home", "first-login"), 600);   // ホームのアチーブ「はじめまして」
  };

  // ログアウト：（設定によっては確認してから）ゲストに戻る。戻ったら true
  const handleLogout = async () => {
    if (settings.confirmLogout) {
      const ok = await confirm({
        title: "ログアウトしますか？", message: "ゲストに戻ります。もう一度ログインするまで、アチーブは記録されません。",
        okLabel: "ログアウト", cancelLabel: "まだいる", danger: true,
        cat: { says: "ログアウトするの…？", bye: "またね！" },
      });
      if (!ok) return false;
    }
    try { await logout(); } catch { /* つながらなくても画面は戻す */ }
    setUser(null);
    setCurrent("account");   // ログインのフォームを出す
    notify({ type: "info", title: "ログアウトしました" });
    return true;
  };

  const theme = effectiveTheme(settings);
  const Page = shown?.Component;
  const accent = (shown?.page ?? findPage(current)).color;

  return (
    <>
      <div className={`shell${sideHidden ? " is-side-hidden" : ""}`}>
        <HtmlSidebar current={current} onSelect={setCurrent} theme={theme} onTheme={(t) => changeSettings({ theme: t })} onHide={() => setSideHidden(true)} user={user} />
        {/* サイドバーを隠しているときは、左下に「出す」ボタン（隠すボタンと同じ場所に残る） */}
        <SideReveal hidden={sideHidden} onShow={() => setSideHidden(false)} />
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
                    onLogin={handleLogin}
                    onLogout={handleLogout}
                    settings={settings}
                    onSettings={changeSettings}
                    onResetSettings={resetSettings}
                    confirm={confirm}
                    onOpenPage={setCurrent}
                  />
                )}
            </section>
          </main>
        </div>
      </div>
      <ConfirmDialog dialog={dialog} onAnswer={answer} />
      <Toaster />
    </>
  );
}
