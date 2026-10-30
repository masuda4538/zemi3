// ═══════════════════════════════════════════════════════════════
//  HTML・CSS・JS で作るアプリのページを、右側いっぱいの窓（iframe）に出す部品
//  （main/apps.js から読まれる。各アプリのフォルダーには入口のファイルを置かなくてよい）
//
//  左のアイコンを押すと、そのページの id と同じ名前のフォルダーの main.html を、窓の中に開きます
//    application/<id>/main.html … 普通の Web ページと同じ。<link> や <script> で、自分でファイルをつなぐ
//  窓の中では、次のものが自動で使えます（vite-apps.js が main.html に入れる）
//    window.app … お知らせ・アチーブ・Rust など（main/frame/bridge.js）
//    共通の見た目 … 色・ダークモード・btn・panel・input（main/frame/frame.css）
//  Rust（rust/main.rs）は src-tauri/src/lib.rs が読みます。
//
//  ファイルを書きかえて保存すると、窓の中だけが新しくなります（ログインしたまま）。
// ═══════════════════════════════════════════════════════════════
import { useLayoutEffect, useRef } from "react";
import { registerFrame } from "../frame/bridge.js";

// main.html があるフォルダーの一覧（中身は読まない。あるかどうかを調べるだけ）
const HTMLS = import.meta.glob("../../application/*/main.html", { query: "?raw", import: "default" });

/** 窓の中で見せるページの場所 */
const urlOf = (id) => `/src/system/application/${id}/main.html`;

export default function HtmlFolder({ page, user, onOpenPage }) {
  const id = page?.id;
  const frameRef = useRef(null);
  const userRef = useRef(user);
  userRef.current = user;
  const openRef = useRef(onOpenPage);
  openRef.current = onOpenPage;

  // 窓を登録する（窓の中の main.html が開くと、bridge.js が window.app を渡す）
  useLayoutEffect(() => {
    if (!frameRef.current) return;
    return registerFrame(frameRef.current, {
      page,
      getUser: () => userRef.current,
      open: (to) => openRef.current?.(to),
    });
  }, [id]);

  if (!HTMLS[`../../application/${id}/main.html`]) {
    return <p className="page-error">application/{id}/main.html が見つかりません。フォルダー名とファイル名を確認してください。</p>;
  }
  return <iframe key={id} ref={frameRef} className="html-frame" src={urlOf(id)} title={page.name} data-app-id={id} />;
}

// ───────── 保存したとき（npm run tauri dev の間だけ） ─────────
// 各アプリのフォルダーの JS などを保存したら、そのアプリの窓だけを読み直す（vite-apps.js が知らせる）
if (import.meta.hot) {
  import.meta.hot.on("zemi:app-changed", ({ id }) => {
    document.querySelectorAll(`iframe.html-frame[data-app-id="${id}"]`).forEach((f) => f.contentWindow?.location.reload());
  });
}
