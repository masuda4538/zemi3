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
//  アプリを開くと、窓の上にロード画面（アプリのアイコン＋「〇〇を開いています…」）を出します。
//    ・早く読み込めても、MIN_SHOW_MS ミリ秒は出しておく（それより時間がかかったら、読み込みが終わったときに消す）
//    ・SLOW_MS ミリ秒たっても開かないときは「時間がかかっています…」に変える
//    見た目は core/App.css の .app-loading
// ═══════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { registerFrame, userChanged } from "../frame/bridge.js";
import Icon from "./Icon";

const MIN_SHOW_MS = 500;     // ロード画面を最低これだけ出す（ミリ秒）。0.5 秒。長くしたいときは 1000（1 秒）などに
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

  // ───── ロード画面を出すか ─────
  //  loadedId  … 窓の中の index.html の読み込みが終わったアプリの id
  //  minDoneId … 開いてから MIN_SHOW_MS たったアプリの id
  //  この 2 つがどちらも今のアプリになったら、ロード画面を消す
  const [loadedId, setLoadedId] = useState(null);
  const [minDoneId, setMinDoneId] = useState(null);
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    setSlow(false);
    const t1 = setTimeout(() => setMinDoneId(id), MIN_SHOW_MS);
    const t2 = setTimeout(() => setSlow(true), SLOW_MS);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [id]);

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
  const showLoading = loadedId !== id || minDoneId !== id;
  return (
    <>
      <iframe key={id} ref={frameRef} className="html-frame" src={urlOf(id)} title={page.name} data-app-id={id} onLoad={() => setLoadedId(id)} />
      {/* ロード画面（読み込みが終わったら、ふわっと消える） */}
      <div className={`app-loading${showLoading ? " is-on" : ""}`} role="status" aria-live="polite" aria-hidden={!showLoading}>
        <div className="app-loading-mark">
          <span className="app-loading-ring" aria-hidden="true" />
          <span className="app-loading-icon"><Icon name={page.icon} /></span>
        </div>
        <p className="app-loading-text">{slow && loadedId !== id ? "時間がかかっています…" : `${page.name}を開いています…`}</p>
        {slow && loadedId !== id && <p className="app-loading-sub">インターネットにつながっているか確認してください</p>}
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
