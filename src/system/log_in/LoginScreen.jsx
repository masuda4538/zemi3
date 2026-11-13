// ═══════════════════════════════════════════════════════════════
//  ログインの画面（スタート画面のあとに出る）★ 見た目は login-screen.css、文はここ
//
//  ・ログインしていないときは、アプリの中に入る前にこの画面を出します（ゲストでは使えません）
//      ログイン … ログイン ID とパスワード
//      新規登録 … 下の「新規登録」で切りかえ（中身は LoginForm.jsx）
//  ・一度ログインしたら、ログアウトするまで覚えています（次の起動からは、すぐホームが開く）
//  ・最後に使ってから 3 か月以上たったときは、もう一度ログインしてもらいます（session.js）
//      → 前の人のログイン ID を入れておき、上にお知らせを出す
//  呼んでいるところ：core/App.jsx（ログインしていないとき、サイドバーと画面のかわりにこれを出す）
// ═══════════════════════════════════════════════════════════════
import WindowControls from "../core/components/WindowControls";
import LoginForm from "./LoginForm";
import { APP_TITLE } from "../core/config";
import { SESSION_MONTHS } from "./session.js";
import "./login-screen.css";

export default function LoginScreen({ onLogin, expiredId = "" }) {
  return (
    <div className="gate">
      {/* 右上の 最小化・最大化・閉じる（ここをドラッグするとウィンドウを動かせる） */}
      <WindowControls />
      <div className="gate-body">
        <div className="gate-brand">
          <h1>{APP_TITLE}</h1>
          <p>Learning Support</p>
        </div>
        <LoginForm
          onLogin={onLogin}
          initialId={expiredId}
          notice={expiredId ? `最後に使ってから ${SESSION_MONTHS} か月以上たったので、もう一度ログインしてください。` : ""}
        />
      </div>
    </div>
  );
}
