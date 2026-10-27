// ═══════════════════════════════════════════════════════════════
//  起動画面：画面（見た目）
//  アプリを起動すると最初にこの画面が出ます（「ログイン」と「新規登録」だけ）。
//    ログイン … 左にロゴ・マスコット（config.js の BRAND）、右にログイン ID とパスワード
//               開発中（npm run tauri dev）は、空のままログインを押すとテスト用アカウントで入れる
//    新規登録 … 左に必須の情報、右に任意の情報（言語・試験）
//  エラーが出ても画面がずれないように、エラーの場所は最初から取っておきます。
//  ログイン（または登録）できたら「ようこそ」を出してから onLoggedIn(user) を呼びます。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import WindowControls from "../../components/WindowControls";
import LanguagePicker from "../../components/LanguagePicker";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, MessageSlot, Spinner } from "../../components/Form";
import { checkDb, getGenders, getLanguages, login, devLogin, isDev, register } from "../common/api.js";
import { noErrors } from "../common/validate.js";
import { checkLogin, isQuickLogin, emptyRegister, checkRegister, toRegisterInput } from "./start.js";
import { loadLastUserId, saveLastUserId } from "../settings/settings.js";
import { APP_TITLE, BRAND } from "../../config";
import "./start.css";

/** 「ようこそ」を出しておく時間（ミリ秒） */
const WELCOME_MS = 900;

export default function Start({ leaving, settings, onLoggedIn }) {
  const [mode, setMode] = useState("login");     // "login" か "register"
  const [dbError, setDbError] = useState("");
  const [welcome, setWelcome] = useState(null);  // ログインできた人

  useEffect(() => {
    checkDb().then(() => setDbError("")).catch((e) => setDbError(String(e)));
  }, []);

  const done = (user) => {
    setWelcome(user);
    setTimeout(() => onLoggedIn(user), WELCOME_MS);
  };

  // 左のロゴ・マスコットはログインのときだけ（新規登録は入力欄が多いので画面全体を使う）
  const showBrand = mode === "login";

  return (
    <div className={`start${leaving ? " is-leaving" : ""}${showBrand ? " has-brand" : ""}`}>
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
                ? <LoginForm key="login" settings={settings} dbError={dbError} onDone={done} onRegister={() => setMode("register")} />
                : <RegisterForm key="register" settings={settings} dbError={dbError} onDone={done} onLogin={() => setMode("login")} />}
            </>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

// ───────── 左：ロゴ・マスコット ─────────
function Brand() {
  // 画像が見つからないときは、その画像だけ出さない
  const [hide, setHide] = useState({});
  const img = (key, className, alt) =>
    BRAND[key] && !hide[key] && (
      <img className={className} src={BRAND[key]} alt={alt} draggable={false} onError={() => setHide((h) => ({ ...h, [key]: true }))} />
    );
  return (
    <aside className="start-brand" data-tauri-drag-region>
      <div className="start-brand-logo">
        {img("logo", "brand-logo", "ロゴ")}
        <span>{APP_TITLE}</span>
      </div>
      <div className="start-brand-center">
        {img("mascot", "brand-mascot", "マスコット")}
        {BRAND.catchphrase && <p className="brand-catch">{BRAND.catchphrase}</p>}
      </div>
      <div className="start-brand-foot" aria-hidden="true" />
    </aside>
  );
}

// ───────── ログイン ─────────
function LoginForm({ settings, dbError, onDone, onRegister }) {
  const [userId, setUserId] = useState(() => loadLastUserId(settings));   // 設定で「覚えておく」なら前回の ID
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 入力し直したら、エラーを消す
  const edit = (setter) => (value) => { setter(value); setError(""); };

  const submit = async (e) => {
    e.preventDefault();
    const quick = isQuickLogin(isDev, userId, password);
    if (!quick) {
      const msg = checkLogin(userId, password);
      if (msg) { setError(msg); return; }
    }
    setBusy(true); setError("");
    try {
      if (quick) {
        onDone(await devLogin());
      } else {
        const user = await login(userId.trim(), password);
        saveLastUserId(settings, user.userId);
        onDone(user);
      }
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
      <MessageSlot message={error || dbError} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? <><Spinner />確認しています…</> : "ログイン"}
      </button>
      {isDev && <p className="start-dev">開発中：空のままログインで、テスト用アカウントに入れます</p>}
      <p className="start-switch">はじめての方は <button type="button" onClick={onRegister}>新規登録</button></p>
    </form>
  );
}

// ───────── 新規登録（左：必須の情報　右：任意の情報） ─────────
function RegisterForm({ settings, dbError, onDone, onLogin }) {
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
        <p>左の項目はすべて入力してください。右の「言語・試験」は任意です。あとからアカウント画面で変更できます。</p>
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
      <MessageSlot message={error || dbError} />
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
