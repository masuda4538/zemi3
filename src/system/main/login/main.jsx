// ═══════════════════════════════════════════════════════════════
//  起動画面：画面（見た目）　［このフォルダーの入口：main.jsx］
//  アプリを起動すると最初にこの画面が出ます（「ログイン」と「新規登録」だけ）。
//    左       … 猫が上に座っている枠。中にロゴ・システム名・サブタイトル（config.js の APP_TITLE・BRAND）
//    ログイン … 右にログイン ID とパスワード
//               今はデータベースがないので、何を入力しても（空でも）入れる（../common/api.js）
//    新規登録 … 左はログインと同じまま、右の枠の中でステップごとに進む
//               ① アカウント → ② プロフィール → ③ 言語・試験（任意）→ ④ 確認して登録
//  エラーが出ても画面がずれないように、エラーの場所は最初から取っておきます。
//  ログイン（または登録）できたら「ようこそ」を出してから onLoggedIn(user) を呼びます。
//  黒猫たちの動きは friends.js（study-notes の起動画面の猫と同じ動き）。
//  パスワードを「表示」にしているあいだは、まんなかの猫が両手で目を隠す（ときどき指のすきまからのぞく）。
// ═══════════════════════════════════════════════════════════════
import { useCallback, useEffect, useRef, useState } from "react";
import WindowControls from "../components/WindowControls";
import LanguagePicker from "../components/LanguagePicker";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, MessageSlot, Spinner } from "../components/Form";
import { getGenders, getLanguages, login, register } from "../common/api.js";
import { emptyRegister, toRegisterInput, STEPS, stepErrors, firstInvalidStep } from "./login.js";
import { loadLastUserId, saveLastUserId } from "../../application/settings/settings.js";
import { APP_TITLE, BRAND } from "../config";
import { createFriends } from "./friends.js";
import "./login.css";
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

  // パスワードを「表示」にしている欄の数。1 つ以上あるあいだは、まんなかの猫が両手で目を隠す
  const shownRef = useRef(0);
  const onPasswordShow = useCallback((show) => {
    shownRef.current = Math.max(0, shownRef.current + (show ? 1 : -1));
    friendsRef.current?.setShy(shownRef.current > 0);
  }, []);

  const done = (user) => {
    setWelcome(user);
    friendsRef.current?.celebrate();   // 猫たちが一斉にぴょこん
    setTimeout(() => onLoggedIn(user), WELCOME_MS);
  };

  return (
    <div ref={rootRef} className={`start${leaving ? " is-leaving" : ""}`}>
      <Brand />

      <div className="start-main">
      <div className="start-titlebar"><WindowControls /></div>

      <section className="start-panel">
        <div className="start-card">
          {welcome ? (
            <Welcome user={welcome} />
          ) : (
            <>
              <div className="start-tabs" role="tablist">
                <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>ログイン</button>
                <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>新規登録</button>
              </div>
              {mode === "login"
                ? <LoginForm key="login" settings={settings} onDone={done} onRegister={() => setMode("register")} onPasswordShow={onPasswordShow} />
                : <RegisterForm key="register" settings={settings} onDone={done} onLogin={() => setMode("login")} onPasswordShow={onPasswordShow} />}
            </>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

// ───────── 左：ロゴ・システム名・サブタイトルの枠（猫が上に座っている） ─────────
// まんなかの猫は friends.js が .brand-ledge（この枠）の上のふちに座らせる
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
      {/* まんなか：ロゴ・システム名・サブタイトルの枠（上のふちに猫が座る） */}
      <div className="start-brand-center">
        <section className="brand-ledge brand-card">
          {img("logo", "brand-card-logo", "ロゴ")}
          {BRAND.tagline && <p className="brand-card-tagline">{BRAND.tagline}</p>}
          <h1 className="brand-card-title">{APP_TITLE}</h1>
          {BRAND.catchphrase && <p className="brand-card-sub">{BRAND.catchphrase}</p>}
        </section>
      </div>
      <div className="start-brand-foot" aria-hidden="true" />
    </aside>
  );
}

// ───────── ログイン ─────────
function LoginForm({ settings, onDone, onRegister, onPasswordShow }) {
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
        <PasswordInput value={password} onChange={edit(setPassword)} autoFocus={!!userId} onShowChange={onPasswordShow} />
      </Field>
      {/* エラーの場所（空でも高さを取っておく） */}
      <MessageSlot message={error} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? <><Spinner />確認しています…</> : "ログイン"}
      </button>
      <p className="start-dev">今はデータベースがないので、何を入れても（空でも）ログインできます</p>
      <p className="start-switch">はじめての方は <button type="button" onClick={onRegister}>新規登録</button></p>
    </form>
  );
}

// ───────── 新規登録（右の枠の中で、ステップごとに進む） ─────────
//  ① アカウント → ② プロフィール → ③ 言語・試験（任意）→ ④ 確認して登録
//  ステップの名前と項目は login.js の STEPS。ここは各ステップの中身（見た目）
function RegisterForm({ settings, onDone, onLogin, onPasswordShow }) {
  const [form, setForm] = useState(emptyRegister);
  const [step, setStep] = useState(0);          // 今のステップ（0 から）
  const [reached, setReached] = useState(0);    // ここまで進んだことがある（上の丸から戻れる）
  const [dir, setDir] = useState("next");       // スライドの向き（"next"：左へ　"prev"：右へ）
  const [touched, setTouched] = useState([]);   // 「次へ」を押したステップ（エラーを出し始める）
  const [genders, setGenders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const stepRef = useRef(null);
  const last = STEPS.length - 1;

  useEffect(() => {
    getGenders().then(setGenders).catch((e) => setError(String(e)));
    getLanguages().then(setLanguages).catch((e) => setError(String(e)));
  }, []);

  // ステップが変わったら、最初の入力欄（エラーがあればその欄）にカーソルを置く
  // 入力欄のないステップ（言語・試験、確認）は「次へ」ボタンに置く（Enter で進める）
  useEffect(() => {
    const el = stepRef.current;
    if (!el) return;
    const target = el.querySelector(".has-error input, .has-error select")
      ?? (STEPS[step].fields.length ? el.querySelector("input.input, select") : null);
    (target ?? el.closest("form")?.querySelector(".reg-next"))?.focus({ preventScroll: true });
  }, [step, last]);

  const set = (key) => (value) => { setError(""); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched.includes(step) ? stepErrors(form, step) : {};

  const go = (next) => {
    setError("");
    setDir(next > step ? "next" : "prev");
    setStep(next);
    setReached((r) => Math.max(r, next));
  };

  // 先へ進む：そこまでのステップに入力の足りないところがあれば、そのステップでエラーを出す
  const goForward = (target) => {
    const bad = firstInvalidStep(form, target);
    if (bad === -1) { go(target); return; }
    setTouched((t) => (t.includes(bad) ? t : [...t, bad]));
    if (bad !== step) go(bad);
  };

  // 上の丸を押したとき
  const jump = (i) => (i < step ? go(i) : goForward(i));

  // 「次へ」（入力中に Enter でも）／最後のステップでは「登録してはじめる」
  const submit = async (e) => {
    e.preventDefault();
    if (step < last) { goForward(step + 1); return; }
    const bad = firstInvalidStep(form);
    if (bad !== -1) { goForward(bad + 1); return; }
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

  const nextLabel = step === last
    ? (busy ? <><Spinner />登録しています…</> : "登録してはじめる")
    : STEPS[step].optional && form.languageIds.length === 0 ? "スキップして次へ" : "次へ";

  return (
    <form className="form start-form reg-form" onSubmit={submit} noValidate>
      <Stepper step={step} reached={reached} onJump={jump} />

      <div className="reg-viewport">
        <div key={step} ref={stepRef} className={`reg-step slide-${dir}`}>
          <div className="start-head">
            <h2>{STEPS[step].title}{STEPS[step].optional && <span className="badge badge-opt">任意</span>}</h2>
            <p>{STEPS[step].desc}</p>
          </div>

          {step === 0 && (
            <div className="reg-fields">
              <Field label="ログイン ID" help="半角英数字と _ - で 4〜16 文字" error={errors.userId}>
                <input className="input" value={form.userId} onChange={(e) => set("userId")(e.target.value)} autoComplete="username" spellCheck={false} maxLength={16} />
              </Field>
              <Field label="パスワード" help="8〜64 文字" error={errors.password}>
                <PasswordInput value={form.password} onChange={set("password")} autoComplete="new-password" onShowChange={onPasswordShow} />
              </Field>
              <Field label="パスワード（確認）" reserve error={errors.confirm}>
                <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" onShowChange={onPasswordShow} />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="reg-fields">
              <Field label="名前" reserve error={errors.name}>
                <input className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" />
              </Field>
              <Field label="メールアドレス" reserve error={errors.mail}>
                <input className="input" type="email" value={form.mail} onChange={(e) => set("mail")(e.target.value)} autoComplete="email" spellCheck={false} />
              </Field>
              <Field label="生年月日" reserve error={errors.birth}>
                <BirthDateSelect value={form.birth} onChange={set("birth")} />
              </Field>
              <Field label="性別" reserve error={errors.genderId}>
                <GenderPicker genders={genders} value={form.genderId} onChange={set("genderId")} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <LanguagePicker
              languages={languages}
              selected={form.languageIds}
              onChange={set("languageIds")}
              onAdded={(lang) => setLanguages((list) => (list.some((l) => l.languageId === lang.languageId) ? list : [...list, lang]))}
            />
          )}

          {step === 3 && <Review form={form} genders={genders} languages={languages} onEdit={go} />}
        </div>
      </div>

      {/* エラーの場所（空でも高さを取っておく） */}
      <MessageSlot message={error} />
      <div className="reg-actions">
        {step > 0
          ? <button type="button" className="btn btn-ghost" onClick={() => go(step - 1)} disabled={busy}>戻る</button>
          : <span />}
        <button type="submit" className="btn btn-primary reg-next" disabled={busy}>{nextLabel}</button>
      </div>
      {step === last
        ? <p className="start-dev">今はデータベースがないので、登録した内容はアプリを閉じると消えます</p>
        : <p className="start-switch">アカウントをお持ちの方は <button type="button" onClick={onLogin}>ログイン</button></p>}
    </form>
  );
}

/** 進み具合（①─②─③─④）。進んだことのあるステップは押して戻れる */
function Stepper({ step, reached, onJump }) {
  return (
    <ol className="stepper">
      {STEPS.map((s, i) => {
        const state = i === step ? "current" : i < step ? "done" : i <= reached ? "visited" : "todo";
        return (
          <li key={s.key} className={`step is-${state}${i < step ? " line-on" : ""}`}>
            <button type="button" onClick={() => onJump(i)} disabled={i === step || i > reached} aria-current={i === step ? "step" : undefined}>
              <span className="step-dot">
                {state === "done"
                  ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>
                  : i + 1}
              </span>
              <span className="step-label">{s.title}</span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** ④ 確認：入力した内容の一覧（「変更」でそのステップへ戻る） */
function Review({ form, genders, languages, onEdit }) {
  const gender = genders.find((g) => g.genderId === form.genderId)?.genderName ?? "";
  const langs = languages.filter((l) => form.languageIds.includes(l.languageId));
  const { year, month, day } = form.birth;
  const groups = [
    { step: 0, rows: [["ログイン ID", form.userId.trim()], ["パスワード", "●".repeat(Math.min([...form.password].length, 16))]] },
    { step: 1, rows: [["名前", form.name.trim()], ["メールアドレス", form.mail.trim()], ["生年月日", `${year}年 ${month}月 ${day}日`], ["性別", gender]] },
  ];
  return (
    <div className="reg-review">
      {groups.map((g) => (
        <section key={g.step} className="review-group">
          <div className="review-head">
            <span>{STEPS[g.step].title}</span>
            <button type="button" className="review-edit" onClick={() => onEdit(g.step)}>変更</button>
          </div>
          <dl>
            {g.rows.map(([k, v]) => (<div key={k}><dt>{k}</dt><dd>{v}</dd></div>))}
          </dl>
        </section>
      ))}
      <section className="review-group">
        <div className="review-head">
          <span>{STEPS[2].title}</span>
          <button type="button" className="review-edit" onClick={() => onEdit(2)}>変更</button>
        </div>
        {langs.length
          ? <div className="chips">{langs.map((l) => <span key={l.languageId} className="chip chip-sm on">{l.languageName}</span>)}</div>
          : <p className="review-none">選んでいません（あとでアカウント画面から選べます）</p>}
      </section>
    </div>
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
