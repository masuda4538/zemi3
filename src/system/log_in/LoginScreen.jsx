// ═══════════════════════════════════════════════════════════════
//  ログインの画面（スタート画面のあとに出る）★ 見た目は login-screen.css、文はここ
//
//  ・ログインしていないときは、アプリの中に入る前にこの画面を出します（ゲストでは使えません）
//      ログイン … ログイン ID とパスワード
//      新規登録 … 下の「新規登録」で切りかえ（中身は LoginForm.jsx）
//  ・一度ログインしたら、ログアウトするまで覚えています（次の起動からは、すぐホームが開く）
//  ・最後に使ってから 3 か月以上たったときは、もう一度ログインしてもらいます（session.js）
//      → 前の人のログイン ID を入れておき、上にお知らせを出す
//  ・ログイン・新規登録ができたら「ようこそ画面」（スタッピーと「ようこそ、〇〇さん！」）を出し、
//    Enter キー（またはボタン）を押したら、アプリ（ホーム）に入る → 下の Welcome
//  呼んでいるところ：core/App.jsx（ログインしていないとき、サイドバーと画面のかわりにこれを出す）
// ═══════════════════════════════════════════════════════════════
import { useLayoutEffect, useState } from "react";
import WindowControls from "../core/components/WindowControls";
import LoginForm from "./LoginForm";
import NatureBackground from "./NatureBackground";   // うしろの背景（青空と草原）
import { IMAGES } from "../character/images.js";   // スタッピーの絵（src/system/character/images）
import { APP_TITLE } from "../core/config";
import { SESSION_MONTHS } from "./session.js";
import "./login-screen.css";

/** ようこそ画面の Enter を受け付けるまでの時間（ミリ秒）。ログインの Enter を押しっぱなしにしても、すぐ進まないように */
const ENTER_GUARD_MS = 400;

export default function LoginScreen({ onLogin, expiredId = "" }) {
  // ログイン・新規登録ができた人（{ user, how: "login" | "register" }）。入っていたら、ようこそ画面を出す
  const [welcome, setWelcome] = useState(null);
  return (
    <div className="gate">
      {/* いちばんうしろ：青空と草原（スタート画面と同じ景色） */}
      <NatureBackground />
      {/* 右上の 最小化・最大化・閉じる（ここをドラッグするとウィンドウを動かせる） */}
      <WindowControls />
      {welcome ? (
        <Welcome user={welcome.user} how={welcome.how} onEnter={() => onLogin(welcome.user)} />
      ) : (
      <div className="gate-body">
        <div className="gate-brand">
          <h1>{APP_TITLE}</h1>
          <p>Learning Support</p>
        </div>
        <LoginForm
          onLogin={(user, how = "login") => setWelcome({ user, how })}
          initialId={expiredId}
          notice={expiredId ? `最後に使ってから ${SESSION_MONTHS} か月以上たったので、もう一度ログインしてください。` : ""}
        />
      </div>
      )}
    </div>
  );
}

// ───────── ようこそ画面（スタッピーが出て、Enter キーでアプリに入る） ─────────
function Welcome({ user, how, onEnter }) {
  // 画面が出たのと同時に Enter キーを待ちはじめる（useLayoutEffect：画面に出る前に用意する）
  useLayoutEffect(() => {
    const shownAt = performance.now();
    const onKey = (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();                                                       // ボタンが Enter で二重に押されないように
      if (e.repeat || performance.now() - shownAt < ENTER_GUARD_MS) return;    // 押しっぱなし・出てすぐの Enter は無視
      e.stopPropagation();
      onEnter();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onEnter]);

  return (
    <div className="gate-body gate-welcome" role="dialog" aria-label="ようこそ">
      <img className="gate-owl" src={IMAGES.main} alt="" draggable="false" />
      <h2>ようこそ、{user.name} さん！</h2>
      <p>{how === "register" ? "はじめまして！ これからいっしょに学んでいこうね。" : "今日もいっしょに学ぼう！"}</p>
      <button type="button" className="gate-enter" onClick={onEnter}>
        <kbd>Enter</kbd> キーを押してはじめる
      </button>
    </div>
  );
}
