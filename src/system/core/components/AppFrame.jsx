// ═══════════════════════════════════════════════════════════════
//  HTML・CSS・JS で作るアプリのページを、右側いっぱいの窓（iframe）に出す部品
//  （core/page-list.js から読まれる。各アプリのフォルダーには入口のファイルを置かなくてよい）
//
//  左のアイコンを押すと、そのページの id と同じ名前のフォルダーの index.html を、窓の中に開きます
//    application/<id>/index.html … 普通の Web ページと同じ。<link> や <script> で、自分でファイルをつなぐ
//  窓の中では、次のものが自動で使えます（vite-apps.js が index.html に入れる）
//    window.app … お知らせ・アチーブ・Rust など（core/frame/bridge.js）
//    共通の見た目 … 色・ダークモード・btn・panel・input（core/frame/frame.css）
//  Rust（rust/main.rs）は src-tauri/src/lib.rs が読みます。
//
//  ファイルを書きかえて保存すると、窓の中だけが新しくなります（ログインしたまま）。
//
//  読み込み中は、窓の上にロード画面（アプリのアイコン＋「〇〇を開いています…」）を出します。
//    ・LOADING_DELAY ミリ秒より早く開いたときは出さない（チラつかないように）
//    ・SLOW_MS ミリ秒たっても開かないときは「時間がかかっています…」に変える
//    見た目は core/App.css の .app-loading
// ═══════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { registerFrame, userChanged } from "../frame/bridge.js";
import Icon from "./Icon";

const LOADING_DELAY = 200;   // これより早く開いたら、ロード画面は出さない（ミリ秒）
const SLOW_MS = 10000;       // これより時間がかかったら、文を「時間がかかっています…」に変える（ミリ秒）

// index.html があるフォルダーの一覧（中身は読まない。あるかどうかを調べるだけ）
const HTMLS = import.meta.glob("../../application/*/index.html", { query: "?raw", import: "default" });

/** 窓の中で見せるページの場所 */
const urlOf = (id) => `/src/system/application/${id}/index.html`;

export default function AppFrame({ page, user, onOpenPage }) {
  const id = page?.id;
  const frameRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const openRef = useRef(onOpenPage);
  openRef.current = onOpenPage;

  // ───── 読み込み中か（窓の中の index.html の読み込みが終わったら loadedId にその id を入れる） ─────
  const [loadedId, setLoadedId] = useState(null);
  const [step, setStep] = useState("wait");   // "wait"（まだ出さない）→ "show"（出す）→ "slow"（時間がかかっている）
  const loading = loadedId !== id;
  useEffect(() => {
    if (!loading) return;
    setStep("wait");
    const t1 = setTimeout(() => setStep("show"), LOADING_DELAY);
    const t2 = setTimeout(() => setStep("slow"), SLOW_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id, loading]);

  // 窓を登録する（窓の中の index.html が開くと、bridge.js が window.app を渡す）
  useLayoutEffect(() => {
    if (!frameRef.current) return;
    return registerFrame(frameRef.current, {
      page,
      getUser: () => userRef.current,
      open: (to) => openRef.current?.(to),
    });
  }, [id]);

  // ログインしている人（名前・アイコン）が変わったら、窓の中に知らせる（app.onUserChange）
  useEffect(() => { userChanged(); }, [user]);

  if (!HTMLS[`../../application/${id}/index.html`]) {
    return <p className="page-error">application/{id}/index.html が見つかりません。フォルダー名とファイル名を確認してください。</p>;
  }
  const showLoading = loading && step !== "wait";
  return (
    <>
      <iframe key={id} ref={frameRef} className="html-frame" src={urlOf(id)} title={page.name} data-app-id={id} onLoad={() => setLoadedId(id)} />
      {/* ロード画面（読み込みが終わったら、ふわっと消える） */}
      <div className={`app-loading${showLoading ? " is-on" : ""}`} role="status" aria-live="polite" aria-hidden={!showLoading}>
        <div className="app-loading-mark">
          <span className="app-loading-ring" aria-hidden="true" />
          <span className="app-loading-icon"><Icon name={page.icon} /></span>
        </div>
        <p className="app-loading-text">{step === "slow" ? "時間がかかっています…" : `${page.name}を開いています…`}</p>
        {step === "slow" && <p className="app-loading-sub">インターネットにつながっているか確認してください</p>}
      </div>
    </>
  );
}

// ───────── 保存したとき（npm run tauri dev の間だけ） ─────────
// 窓のフォルダー（各アプリ・サイドバー）の JS などを保存したら、その窓だけを読み直す（vite-apps.js が知らせる）
if (import.meta.hot) {
  import.meta.hot.on("zemi:app-changed", ({ id }) => {
    document.querySelectorAll(`iframe[data-app-id="${id}"]`).forEach((f) => f.contentWindow?.location.reload());
  });
}
