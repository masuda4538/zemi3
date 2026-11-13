// ═══════════════════════════════════════════════════════════════
//  画面全体：左にサイドバー（src/system/sidebar/index.html）、右に選んだアプリの画面
//  右の一番上は、最小化・最大化・閉じるのボタンがある帯（WindowControls）です。
//  ページの一覧は page-list.js、それぞれの項目（画面と処理）は src/system/application/<項目>/ の中にあります。
//
//  ・ログインしていないときは、サイドバーと画面のかわりに、ログインの画面を出します（log_in/LoginScreen.jsx）。
//    ログインか新規登録をすると、ホームが開きます（ゲストでは使えません）。
//    一度ログインしたら、ログアウトするまで覚えています（log_in/session.js の session.json）。
//    ただし、最後に使ってから 3 か月以上たったら、もう一度ログインしてもらいます。
//  ・keepAlive: true のページ（タイマー）は、ほかのページに切りかえても窓を消さずに裏で動かし続けます。
//  ・アプリを押したときに、その画面のプログラムを読み込んで表示します（アニメーションなし）。
//  ・左のサイドバーは、いちばん下のボタンで隠せます（左下の「»」で出す。保存はしない）。
//  ・設定（src/system/pages/settings/settings.js）はここで持ち、画面全体に反映します。
//  ・各画面には次のものを渡します：
//      page / user / onUserChange / onLogin / onLogout / settings / onSettings / onResetSettings / confirm / onOpenPage
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import SidebarFrame from "./components/SidebarFrame";   // 左のサイドバー（中身は src/system/sidebar/index.html）
import SideReveal from "./components/SideReveal";
import WindowControls from "./components/WindowControls";
import ConfirmDialog from "./components/ConfirmDialog";
import Toaster from "./components/Toaster";
import AppFrame from "./components/AppFrame";
import LoginScreen from "../log_in/LoginScreen";   // ログインの画面（ログインしていないとき）
import { notify } from "./utils/notify.js";
import { unlockAchievement, setProgress, getUnlocked, onAchievementUnlocked, onAchievementsChange } from "./storage/achievements.js";
import { findAchievement, ALL } from "../pages/achievements/achievement-list.js";
import { logout, savedUser, expiredUserId, touchSession } from "../log_in/session.js";
import { recordLogin } from "./storage/logins.js";
import { setUsagePage } from "./storage/usage.js";
import {
  DEFAULTS, loadSettings, saveSettings, applySettings, applyStartup, effectiveTheme, watchSystemTheme,
} from "../pages/settings/settings.js";
import { APP_TITLE, START_PAGE, findPage } from "./page-list";
import { comboFromEvent, actionOfCombo } from "./shortcuts.js";
import { watchExit } from "../start-end/exit-confirm.js";   // 終了画面（閉じる前の確認）
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
  const [user, setUser] = useState(savedUser);          // ログインしている人（していないときは null → ログインの画面）。前回のログインを覚えている
  const [expiredId, setExpiredId] = useState(expiredUserId);   // 3 か月たってログインし直す人の ID（ログインの画面に入れておく）
  const [alive, setAlive] = useState([]);               // 裏で動かし続けているページ（keepAlive）の id
  const [current, setCurrent] = useState(START_PAGE);   // 左で選んでいるページ（起動したときはホーム）
  const [sideHidden, setSideHidden] = useState(false);   // 左のサイドバーを隠しているか（アプリを閉じると元にもどる）
  const [shown, setShown] = useState(null);             // 右に出しているページ { page, Component }
  const [error, setError] = useState("");
  const [settings, setSettings] = useState(loadSettings);
  const [dialog, setDialog] = useState(null);           // 確認のダイアログ（null のときは出さない）
  const [, setTick] = useState(0);                      // 「PC に合わせる」で PC の色が変わったとき用
  const ticket = useRef(0);   // 連続で押されたときに、最後に押したページだけを出すための番号
  const stageRef = useRef(null);
  const scrollTimer = useRef(0);

  // スクロールしているあいだは、右の画面の中のマウスの当たり判定を止める（App.css の .is-scrolling）
  //   → スクロール中に、ボタンの色やマウスカーソルを何度も計算しなおさないので、軽くなる
  const onStageScroll = () => {
    const el = stageRef.current;
    if (!el) return;
    el.classList.add("is-scrolling");
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => el.classList.remove("is-scrolling"), 150);
  };
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

  // ───── アプリを閉じる前に確認する（× ボタン・Alt + F4 の両方。文は start-end/exit-confirm.js） ─────
  useEffect(() => watchExit({ confirm, shouldConfirm: () => settingsRef.current.confirmClose }), [confirm]);

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
      type: "achieve", icon: ach.icon, title: ach.name, message: `${ach.rarityName}・${ach.appName}・${ach.desc}`,
      onClick: () => setCurrent("achieve"),
    });
  }), []);

  // ログインした日を記録する（ログインした・ログインしたまま起動した・開いたまま 0 時をこえた）→ ホームのカレンダー
  //   ログアウトしたときも呼ぶ（ホームに「ゲストになった」と知らせるため。記録はしない）
  useEffect(() => {
    recordLogin();
    const timer = setInterval(recordLogin, 60 * 1000);   // 1 分ごとに日付を確かめる（同じ日なら何もしない）
    return () => clearInterval(timer);
  }, [user]);

  // 「今使っている」と記録する（3 か月使わなかったら、もう一度ログイン。log_in/session.js）
  useEffect(() => {
    if (!user) return;
    touchSession();
    const timer = setInterval(touchSession, 60 * 60 * 1000);   // 1 時間ごと
    return () => clearInterval(timer);
  }, [user]);

  // keepAlive のページ（タイマー）を一度開いたら、裏で動かし続ける一覧に入れる
  useEffect(() => {
    const page = findPage(current);
    if (page.keepAlive) setAlive((list) => (list.includes(page.id) ? list : [...list, page.id]));
  }, [current]);

  // 使った時間を計る：右に出しているページ・ログインしている人が変わったら知らせる（storage/usage.js）
  useEffect(() => { setUsagePage(current); }, [current, user]);

  // 設定のアチーブ「夜ふかし」：ログイン中にダークモードになったら（achieve_setting/settings.js）
  const theme0 = effectiveTheme(settings);
  useEffect(() => { if (user && theme0 === "dark") unlockAchievement("settings", "night-mode"); }, [user, theme0]);

  // アチーブのページのアチーブ「コレクター」：手に入れたアチーブの数を数える（achieve_setting/achieve.js）
  useEffect(() => {
    const count = () => { const got = getUnlocked(); setProgress("achieve", "collect-5", ALL.filter((a) => got[a.key]).length); };
    count();
    return onAchievementsChange(count);
  }, [user]);

  // ログインできたとき（アカウントのページから呼ばれる）：アカウントのページのまま、プロフィールが出る
  const handleLogin = (u) => {
    setUser(u);
    setExpiredId("");
    setCurrent(START_PAGE);   // ログインの画面から入ったら、ホームを開く
    notify({ type: "success", title: "ログインしました", message: `ようこそ、${u.name} さん` });
    setTimeout(() => unlockAchievement("account", "first-login"), 600);   // アカウントのアチーブ「はじめまして」（achieve_setting/account.js）
  };

  // ログアウト：（設定によっては確認してから）ログインの画面に戻る。戻ったら true
  const handleLogout = async () => {
    if (settings.confirmLogout) {
      const ok = await confirm({
        title: "ログアウトしますか？", message: "ログインの画面に戻ります。",
        okLabel: "ログアウト", cancelLabel: "まだいる", danger: true,
      });
      if (!ok) return false;
    }
    try { await logout(); } catch { /* つながらなくても画面は戻す */ }
    setUser(null);           // ログインの画面になる（log_in/LoginScreen.jsx）
    setAlive([]);            // 裏で動かしていたページ（タイマー）も止める
    setCurrent(START_PAGE);
    notify({ type: "info", title: "ログアウトしました" });
    return true;
  };

  const theme = effectiveTheme(settings);
  const Page = shown?.Component;
  const accent = (shown?.page ?? findPage(current)).color;

  return (
    <>
      {user ? (
        <div className={`shell${sideHidden ? " is-side-hidden" : ""}`}>
          <SidebarFrame current={current} onSelect={setCurrent} theme={theme} onTheme={(t) => changeSettings({ theme: t })} onHide={() => setSideHidden(true)} user={user} />
          {/* サイドバーを隠しているときは、左下に「出す」ボタン（隠すボタンと同じ場所に残る） */}
          <SideReveal hidden={sideHidden} onShow={() => setSideHidden(false)} />
          <div className="main-col">
            <WindowControls />
            <main className="stage" ref={stageRef} style={{ "--accent": accent }} onScroll={onStageScroll}>
              {/* 裏で動かし続けるページ（タイマー）。見ていないときは隠すだけで、窓は消さない */}
              {alive.map((id) => (
                <section key={id} className="page" hidden={id !== current}>
                  <AppFrame page={findPage(id)} user={user} onOpenPage={setCurrent} />
                </section>
              ))}
              <section className="page" hidden={findPage(current).keepAlive}>
                {error
                  ? <p className="page-error">{error}</p>
                  : Page && !shown.page.keepAlive && (
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
      ) : (
        <LoginScreen onLogin={handleLogin} expiredId={expiredId} />
      )}
      <ConfirmDialog dialog={dialog} onAnswer={answer} />
      <Toaster />
    </>
  );
}
