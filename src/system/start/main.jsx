// ═══════════════════════════════════════════════════════════════
//  起動画面：画面（見た目）　［このフォルダーの入口：main.jsx］
//  アプリを起動すると最初にこの画面が出ます（「ログイン」と「新規登録」だけ）。
//    ログイン … 左にロゴとまんなかの猫（config.js の BRAND）、右にログイン ID とパスワード
//               今はデータベースがないので、何を入力しても（空でも）入れる（../common/api.js）
//    新規登録 … 左に必須の情報、右に任意の情報（言語・試験）
//  エラーが出ても画面がずれないように、エラーの場所は最初から取っておきます。
//  ログイン（または登録）できたら「ようこそ」を出してから onLoggedIn(user) を呼びます。
//  黒猫たちの動きは friends.js（study-notes の起動画面の猫と同じ動き）。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import WindowControls from "../../components/WindowControls";
import LanguagePicker from "../../components/LanguagePicker";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, MessageSlot, Spinner } from "../../components/Form";
import { getGenders, getLanguages, login, register } from "../common/api.js";
import { noErrors } from "../common/validate.js";
import { emptyRegister, checkRegister, toRegisterInput } from "./start.js";
import { loadLastUserId, saveLastUserId } from "../settings/settings.js";
import { APP_TITLE, BRAND } from "../../config";
import { createFriends } from "./friends.js";
import "./start.css";
import "./friends.css";

/** 「ようこそ」を出しておく時間（ミリ秒） */
const WELCOME_MS = 900;

export default function Start({ leaving, settings, onLoggedIn }) {
  const [mode, setMode] = useState("login");     // "login" か "register"
  const [welcome, setWelcome] = useState(null);  // ログインできた人
  const rootRef = useRef(null);
  const friendsRef = useRef(null);               // 黒猫たち（friends.js）

  // 黒猫たちを出す（起動画面を閉じたら消す）
  useEffect(() => {
    const friends = createFriends(rootRef.current);
    friendsRef.current = friends;
    return () => { friends.destroy(); friendsRef.current = null; };
  }, []);

  // ログイン／新規登録を切りかえたら、猫の置き場所を選びなおす
  useEffect(() => { friendsRef.current?.refresh(); }, [mode]);

  const done = (user) => {
    setWelcome(user);
    friendsRef.current?.celebrate();   // 猫たちが一斉にぴょこん
    setTimeout(() => onLoggedIn(user), WELCOME_MS);
  };

  // 左のロゴとまんなかの猫はログインのときだけ（新規登録は入力欄が多いので画面全体を使う）
  const showBrand = mode === "login";

  return (
    <div ref={rootRef} className={`start${leaving ? " is-leaving" : ""}${showBrand ? " has-brand" : ""}`}>
      {showBrand && <Brand />}

      <div className="start-main">
      <div className="start-titlebar"><WindowControls /></div>

      <section className="start-panel">
        <div className={`start-card${mode === "register" && !welcome ? " is-wide" : ""}`}>
          {welcome ? (
            <Welcome user={welcome} />
          ) : (
            <>
              <div className="start-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>ログイン</button>
                <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>新規登録</button>
              </div>
              {mode === "login"
                ? <LoginForm key="login" settings={settings} onDone={done} onRegister={() => setMode("register")} />
                : <RegisterForm key="register" settings={settings} onDone={done} onLogin={() => setMode("login")} />}
            </>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

// ───────── 左：ロゴとまんなかの猫 ─────────
// まんなかの猫は friends.js が .brand-ledge（段）の上に座らせる
// 開発中は画像の URL に起動した時刻を付けて、アプリが前の画像を覚えたまま（キャッシュ）にならないようにする
// （public/images の画像を差し替えたら、アプリを開き直すか Ctrl + R で新しい画像になる）
const IMAGE_VERSION = import.meta.env.DEV ? `?v=${Date.now()}` : "";

function Brand() {
  // 画像が見つからないときは、その画像だけ出さない
  const [hide, setHide] = useState({});
  const img = (key, className, alt) =>
    BRAND[key] && !hide[key] && (
      <img className={className} src={BRAND[key] + IMAGE_VERSION} alt={alt} draggable={false} onError={() => setHide((h) => ({ ...h, [key]: true }))} />
    );
  return (
    <aside className="start-brand" data-tauri-drag-region>
      <div className="start-brand-logo">
        {img("logo", "brand-logo", "ロゴ")}
        <span>{APP_TITLE}</span>
      </div>
      <div className="start-brand-center">
        <div className="brand-ledge" aria-hidden="true" />
        {BRAND.catchphrase && <p className="brand-catch">{BRAND.catchphrase}</p>}
      </div>
      <div className="start-brand-foot" aria-hidden="true" />
    </aside>
  );
}

// ───────── ログイン ─────────
function LoginForm({ settings, onDone, onRegister }) {
  const [userId, setUserId] = useState(() => loadLastUserId(settings));   // 設定で「覚えておく」なら前回の ID
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 入力し直したら、エラーを消す
  const edit = (setter) => (value) => { setter(value); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      // 今はデータベースがないので、何を入力しても（空でも）入れる
      const user = await login(userId.trim(), password);
      if (userId.trim()) saveLastUserId(settings, user.userId);
      onDone(user);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  };

  return (
    <form className="form start-form" onSubmit={submit} noValidate>
      <div className="start-head">
        <h2>ログイン</h2>
        <p>ログイン ID とパスワードを入力してください。</p>
      </div>
      <Field label="ログイン ID">
        <input className="input" value={userId} onChange={(e) => edit(setUserId)(e.target.value)} autoComplete="username" autoFocus={!userId} spellCheck={false} />
      </Field>
      <Field label="パスワード">
        <PasswordInput value={password} onChange={edit(setPassword)} autoFocus={!!userId} />
      </Field>
      {/* エラーの場所（空でも高さを取っておく） */}
      <MessageSlot message={error} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? <><Spinner />確認しています…</> : "ログイン"}
      </button>
      <p className="start-dev">今はデータベースがないので、何を入力しても（空のままでも）ログインできます</p>
      <p className="start-switch">はじめての方は <button type="button" onClick={onRegister}>新規登録</button></p>
    </form>
  );
}

// ───────── 新規登録（左：必須の情報　右：任意の情報） ─────────
function RegisterForm({ settings, onDone, onLogin }) {
  const [form, setForm] = useState(emptyRegister);
  const [touched, setTouched] = useState(false);   // 一度「登録」を押したら、エラーを出し始める
  const [genders, setGenders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    getGenders().then(setGenders).catch((e) => setError(String(e)));
    getLanguages().then(setLanguages).catch((e) => setError(String(e)));
  }, []);

  const set = (key) => (value) => { setError(""); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched ? checkRegister(form) : {};

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!noErrors(checkRegister(form))) {
      // 最初のエラーの場所まで動かす
      requestAnimationFrame(() => formRef.current?.querySelector(".has-error")?.scrollIntoView({ behavior: "smooth", block: "center" }));
      return;
    }
    setBusy(true); setError("");
    try {
      const user = await register(toRegisterInput(form));
      saveLastUserId(settings, user.userId);
      onDone(user);
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  };

  return (
    <form className="form start-form" onSubmit={submit} noValidate ref={formRef}>
      <div className="start-head">
        <h2>新規登録</h2>
        <p>左の項目はすべて入力してください。右の「言語・試験」は任意です。（今はデータベースがないので、登録した内容はアプリを閉じると消えます）</p>
      </div>

      <div className="reg-columns">
        {/* 左：必須の情報 */}
        <div className="reg-col">
          <div className="reg-col-head"><span className="badge badge-req">必須</span>基本の情報</div>
          <div className="form-grid">
            <Field label="ログイン ID" help="半角英数字と _ - で 4〜16 文字" error={errors.userId}>
              <input className="input" value={form.userId} onChange={(e) => set("userId")(e.target.value)} autoComplete="username" spellCheck={false} maxLength={16} />
            </Field>
            <Field label="名前" reserve error={errors.name}>
              <input className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" />
            </Field>
            <Field label="パスワード" help="8〜64 文字" error={errors.password}>
              <PasswordInput value={form.password} onChange={set("password")} autoComplete="new-password" />
            </Field>
            <Field label="パスワード（確認）" reserve error={errors.confirm}>
              <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
            </Field>
            <Field label="メールアドレス" reserve error={errors.mail} className="span-2">
              <input className="input" type="email" value={form.mail} onChange={(e) => set("mail")(e.target.value)} autoComplete="email" spellCheck={false} />
            </Field>
            <Field label="生年月日" reserve error={errors.birth} className="span-2">
              <BirthDateSelect value={form.birth} onChange={set("birth")} />
            </Field>
            <Field label="性別" reserve error={errors.genderId} className="span-2">
              <GenderPicker genders={genders} value={form.genderId} onChange={set("genderId")} />
            </Field>
          </div>
        </div>

        {/* 右：任意の情報 */}
        <div className="reg-col reg-col-optional">
          <div className="reg-col-head"><span className="badge badge-opt">任意</span>言語・試験</div>
          <p className="field-help">勉強している言語や、受ける・持っている試験を選びます。一覧にないものは下から追加できます。</p>
          <LanguagePicker
            languages={languages}
            selected={form.languageIds}
            onChange={set("languageIds")}
            onAdded={(lang) => setLanguages((list) => (list.some((l) => l.languageId === lang.languageId) ? list : [...list, lang]))}
          />
        </div>
      </div>

      {/* エラーの場所（空でも高さを取っておく） */}
      <MessageSlot message={error} />
      <div className="reg-actions">
        <p className="start-switch">アカウントをお持ちの方は <button type="button" onClick={onLogin}>ログイン</button></p>
        <button type="submit" className="btn btn-primary reg-submit" disabled={busy}>
          {busy ? <><Spinner />登録しています…</> : "登録してはじめる"}
        </button>
      </div>
    </form>
  );
}

// ───────── ようこそ ─────────
function Welcome({ user }) {
  return (
    <div className="start-welcome" role="status">
      <svg className="start-check" viewBox="0 0 52 52" aria-hidden="true">
        <circle cx="26" cy="26" r="24" />
        <path d="m15 27 7.5 7.5L38 19" />
      </svg>
      <h2>ようこそ、{user.name} さん</h2>
      <p>ホームを開いています…</p>
    </div>
  );
}
