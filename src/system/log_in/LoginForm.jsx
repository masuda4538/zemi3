// ═══════════════════════════════════════════════════════════════
//  アカウント：ログインしていないときの画面
//    ログイン … ログイン ID とパスワード
//    新規登録 … ステップごとに進む：① アカウント → ② プロフィール → ③ 言語・試験（任意）→ ④ 確認して登録
//               （ステップの名前と項目は register.js の STEPS）
//    いちばん下の「新規登録」「ログイン」で切りかえる（横にすべって入れかわり、枠の高さもなめらかに変わる）
//    ログイン・登録できたら onLogin(ログインした人) を呼ぶ → core/App.jsx が覚える（ログアウトするまで）
//    使っているところ：起動したときのログインの画面（LoginScreen.jsx）
//      initialId … ログイン ID の欄に、はじめから入れておく文字（3 か月使わずにログインし直すとき）
//      notice    … カードの上に出すお知らせ（3 か月たったので、もう一度ログインしてください など）
//  ログイン・新規登録の関数は session.js、入力のチェックは register.js と core/utils/validate.js
// ═══════════════════════════════════════════════════════════════
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Icon from "../core/components/Icon";
import LanguagePicker from "../core/components/LanguagePicker";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, MessageSlot, Spinner } from "../core/components/Form";
import { getGenders, getLanguages } from "../core/storage/account.js";
import { login, register } from "./session.js";
import { emptyRegister, toRegisterInput, STEPS, stepErrors, firstInvalidStep } from "./register.js";
import "./login-form.css";

export default function LoginForm({ onLogin, initialId = "", notice = "" }) {
  const [mode, setMode] = useState("login");   // "login" か "register"
  const [height, setHeight] = useState(null);  // 中身の高さ（切りかえたときに、なめらかに変えるため）
  const loginRef = useRef(null);
  const registerRef = useRef(null);

  // 見えているほうの高さに合わせる（中身の高さが変わったときも追いかける）
  useLayoutEffect(() => {
    const el = (mode === "login" ? loginRef : registerRef).current;
    const fit = () => setHeight(el.offsetHeight);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [mode]);

  // 切りかえたら、見えたほうの最初の入力欄にカーソルを置く
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const el = (mode === "login" ? loginRef : registerRef).current;
    setTimeout(() => el?.querySelector("input.input")?.focus({ preventScroll: true }), 200);
  }, [mode]);

  return (
    <div className="acc-login">
      <div className="panel acc-login-card">
        <div className="acc-login-head">
          <span className="acc-login-icon"><Icon name="account" /></span>
          <p>{notice || "一度ログインしたら、ログアウトするまで覚えています（3 か月使わなかったときは、もう一度ログインします）。"}</p>
        </div>

        {/* 2 つとも置いておき、見えていないほうは隠す（inert：押せない・Tab で入れない）。入力した内容は残る */}
        <div className="acc-login-body" style={{ height: height ?? undefined }}>
          <div ref={loginRef} className={`acc-pane is-login${mode === "login" ? " on" : ""}`} inert={mode !== "login"}>
            <LoginTab onLogin={onLogin} onRegister={() => setMode("register")} initialId={initialId} />
          </div>
          <div ref={registerRef} className={`acc-pane is-register${mode === "register" ? " on" : ""}`} inert={mode !== "register"}>
            <RegisterForm onLogin={onLogin} onSwitch={() => setMode("login")} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ───────── ログイン ─────────
function LoginTab({ onLogin, onRegister, initialId = "" }) {
  const [userId, setUserId] = useState(initialId);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!userId.trim()) { setError("ログイン ID を入力してください。"); return; }
    setBusy(true);
    setError("");
    try {
      onLogin(await login(userId, password));
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="form acc-form" onSubmit={submit} noValidate>
      <div className="acc-head">
        <h2>おかえりなさい</h2>
        <p>ログイン ID とパスワードを入力してください。</p>
      </div>
      <Field label="ログイン ID">
        <input className="input" value={userId} onChange={(e) => { setUserId(e.target.value); setError(""); }} autoComplete="username" spellCheck={false} autoFocus />
      </Field>
      <Field label="パスワード">
        <PasswordInput value={password} onChange={setPassword} />
      </Field>
      {/* エラーの場所（空でも高さを取っておく） */}
      <MessageSlot message={error} />
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
        {busy ? <Spinner /> : "ログイン"}
      </button>
      <p className="acc-switch">アカウントをお持ちでない方は <button type="button" onClick={onRegister}>新規登録</button></p>
    </form>
  );
}

// ───────── 新規登録（ステップごとに進む） ─────────
//  ① アカウント → ② プロフィール → ③ 言語・試験（任意）→ ④ 確認して登録
//  ステップの名前と項目は register.js の STEPS。ここは各ステップの中身（見た目）
function RegisterForm({ onLogin, onSwitch }) {
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
  const mounted = useRef(false);
  const last = STEPS.length - 1;

  useEffect(() => {
    getGenders().then(setGenders).catch((e) => setError(String(e)));
    getLanguages().then(setLanguages).catch((e) => setError(String(e)));
  }, []);

  // ステップが変わったら、最初の入力欄（エラーがあればその欄）にカーソルを置く
  // 入力欄のないステップ（言語・試験、確認）は「次へ」ボタンに置く（Enter で進める）
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }   // 最初はログインのタブが見えているので何もしない
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
      onLogin(await register(toRegisterInput(form)));
    } catch (err) {
      setError(String(err));
      setBusy(false);
    }
  };

  const nextLabel = step === last
    ? (busy ? <><Spinner />登録しています…</> : "登録してはじめる")
    : STEPS[step].optional && form.languageIds.length === 0 ? "スキップして次へ" : "次へ";

  return (
    <form className="form acc-form reg-form" onSubmit={submit} noValidate>
      <Stepper step={step} reached={reached} onJump={jump} />

      <div className="reg-viewport">
        <div key={step} ref={stepRef} className={`reg-step slide-${dir}`}>
          <div className="acc-head">
            <h2>{STEPS[step].title}{STEPS[step].optional && <span className="badge badge-opt">任意</span>}</h2>
            <p>{STEPS[step].desc}</p>
          </div>

          {step === 0 && (
            <div className="reg-fields">
              <Field label="ログイン ID" help="半角英数字と _ - で 4〜16 文字" error={errors.userId}>
                <input className="input" value={form.userId} onChange={(e) => set("userId")(e.target.value)} autoComplete="username" spellCheck={false} maxLength={16} />
              </Field>
              <Field label="パスワード" help="8〜64 文字" error={errors.password}>
                <PasswordInput value={form.password} onChange={set("password")} autoComplete="new-password" />
              </Field>
              <Field label="パスワード（確認）" reserve error={errors.confirm}>
                <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
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
      <p className="acc-switch">アカウントをお持ちの方は <button type="button" onClick={onSwitch}>ログイン</button></p>
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
