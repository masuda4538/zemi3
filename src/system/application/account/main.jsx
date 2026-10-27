// ═══════════════════════════════════════════════════════════════
//  アカウント：画面（見た目）　［このフォルダーの入口：main.jsx］
//  左右に別の枠を並べています（なるべく 1 画面に収まるように）。
//    左の列 … 名前とログアウト / 登録情報（保存ボタンつき） / パスワードの変更
//    右の列 … 言語・試験（保存ボタンつき）
//  それぞれの枠の「保存」は、その枠の内容だけを保存します。
//  エラーや「保存しました」はボタンの横に出すので、画面がずれません。
//  main/App.jsx から user（ログインしている人）、onUserChange、onLogout を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import LanguagePicker from "../../main/components/LanguagePicker";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, Spinner } from "../../main/components/Form";
import { getGenders, getLanguages, updateMe, changePassword } from "../../main/common/api.js";
import { noErrors } from "../../main/common/validate.js";
import {
  toProfileForm, checkProfile, toProfileInput, isBasicChanged, isLanguagesChanged, checkPasswordForm, initial,
} from "./account.js";
import "./account.css";

export default function Account({ user, onUserChange, onLogout }) {
  const [genders, setGenders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getGenders().then(setGenders).catch((e) => setLoadError(String(e)));
    getLanguages().then(setLanguages).catch((e) => setLoadError(String(e)));
  }, []);

  if (!user) return null;
  return (
    <div className="account">
      <div className="acc-col-left">
        <ProfileHeader user={user} onLogout={onLogout} />
        <BasicCard user={user} genders={genders} loadError={loadError} onUserChange={onUserChange} />
        <PasswordCard />
      </div>
      <div className="acc-col-right">
        <LanguageCard user={user} languages={languages} setLanguages={setLanguages} loadError={loadError} onUserChange={onUserChange} />
      </div>
    </div>
  );
}

/** ボタンの横に出すお知らせ（エラー・保存しました） */
function Status({ error, ok }) {
  if (error) return <span className="acc-status is-error" role="alert">{error}</span>;
  if (ok) return <span className="acc-status is-ok" role="status">{ok}</span>;
  return <span className="acc-status" />;
}

/** 枠の保存の流れ（共通）：送る → 画面全体の user を新しくする → 「保存しました」 */
function useSave(onUserChange) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const save = async (input) => {
    setBusy(true); setError(""); setSaved("");
    try {
      const next = await updateMe(input);
      onUserChange(next);
      setSaved("保存しました。");
      return next;
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setBusy(false);
    }
  };
  const clear = () => { setError(""); setSaved(""); };
  return { busy, error, saved, save, clear, setError };
}

// ───────── 左上：名前とログアウト ─────────
function ProfileHeader({ user, onLogout }) {
  const [busy, setBusy] = useState(false);
  return (
    <section className="panel acc-head">
      <span className="acc-avatar" aria-hidden="true">{initial(user.name)}</span>
      <div className="acc-who">
        <h1>{user.name}</h1>
        <span>ログイン ID：{user.userId}</span>
        <small>登録 {user.createdAt} ・ 更新 {user.updatedAt}</small>
      </div>
      <button
        type="button"
        className="btn btn-danger"
        disabled={busy}
        onClick={async () => { setBusy(true); const done = await onLogout(); if (!done) setBusy(false); }}
      >
        {busy ? <Spinner /> : "ログアウト"}
      </button>
    </section>
  );
}

// ───────── 左：登録情報 ─────────
function BasicCard({ user, genders, loadError, onUserChange }) {
  const [form, setForm] = useState(() => toProfileForm(user));
  const [touched, setTouched] = useState(false);
  const s = useSave(onUserChange);

  const set = (key) => (value) => { s.clear(); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched ? checkProfile(form) : {};
  const changed = isBasicChanged(user, form);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!noErrors(checkProfile(form))) { s.setError("赤い項目を確認してください。"); return; }
    // 言語・試験は今の登録のまま（右の枠で別に保存する）
    const next = await s.save(toProfileInput({ ...form, languageIds: user.languages.map((l) => l.languageId) }));
    if (next) { setForm(toProfileForm(next)); setTouched(false); }
  };

  return (
    <form className="panel acc-card" onSubmit={submit} noValidate>
      <div className="acc-card-head"><h2>登録情報</h2></div>
      <div className="acc-card-body form-grid">
        <Field label="ログイン ID" help="変更できません">
          <input className="input" value={user.userId} disabled />
        </Field>
        <Field label="名前" required reserve error={errors.name}>
          <input className="input" value={form.name} onChange={(e) => set("name")(e.target.value)} />
        </Field>
        <Field label="メールアドレス" required reserve error={errors.mail} className="span-2">
          <input className="input" type="email" value={form.mail} onChange={(e) => set("mail")(e.target.value)} spellCheck={false} />
        </Field>
        <Field label="生年月日" required reserve error={errors.birth}>
          <BirthDateSelect value={form.birth} onChange={set("birth")} />
        </Field>
        <Field label="性別" required reserve error={errors.genderId}>
          <GenderPicker genders={genders} value={form.genderId} onChange={set("genderId")} />
        </Field>
      </div>
      <div className="acc-bar">
        <Status error={s.error || loadError} ok={s.saved} />
        <button type="button" className="btn btn-ghost" disabled={!changed || s.busy} onClick={() => { setForm(toProfileForm(user)); setTouched(false); s.clear(); }}>元に戻す</button>
        <button type="submit" className="btn btn-primary" disabled={!changed || s.busy}>
          {s.busy ? <><Spinner />保存中…</> : "保存"}
        </button>
      </div>
    </form>
  );
}

// ───────── 右：言語・試験 ─────────
function LanguageCard({ user, languages, setLanguages, loadError, onUserChange }) {
  const [selected, setSelected] = useState(() => user.languages.map((l) => l.languageId));
  const s = useSave(onUserChange);
  const changed = isLanguagesChanged(user, selected);

  const submit = async (e) => {
    e.preventDefault();
    // 登録情報は今の登録のまま（左の枠で別に保存する）
    const next = await s.save(toProfileInput({ ...toProfileForm(user), languageIds: selected }));
    if (next) setSelected(next.languages.map((l) => l.languageId));
  };

  return (
    <form className="panel acc-card acc-card-fill" onSubmit={submit} noValidate>
      <div className="acc-card-head">
        <h2>言語・試験</h2>
        <span className="badge badge-opt">任意</span>
        <p>勉強している言語や、受ける・持っている試験を選びます。</p>
      </div>
      <div className="acc-card-body acc-lang-body">
        <LanguagePicker
          languages={languages}
          selected={selected}
          onChange={(v) => { s.clear(); setSelected(v); }}
          onAdded={(lang) => setLanguages((list) => (list.some((l) => l.languageId === lang.languageId) ? list : [...list, lang]))}
        />
      </div>
      <div className="acc-bar">
        <Status error={s.error || loadError} ok={s.saved} />
        <button type="button" className="btn btn-ghost" disabled={!changed || s.busy} onClick={() => { setSelected(user.languages.map((l) => l.languageId)); s.clear(); }}>元に戻す</button>
        <button type="submit" className="btn btn-primary" disabled={!changed || s.busy}>
          {s.busy ? <><Spinner />保存中…</> : "保存"}
        </button>
      </div>
    </form>
  );
}

// ───────── 左下：パスワードの変更 ─────────
const emptyPassword = { current: "", next: "", confirm: "" };

function PasswordCard() {
  const [form, setForm] = useState(emptyPassword);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const set = (key) => (value) => { setDone(""); setError(""); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched ? checkPasswordForm(form) : {};

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!noErrors(checkPasswordForm(form))) return;
    setBusy(true); setError("");
    try {
      await changePassword(form.current, form.next);
      setForm(emptyPassword); setTouched(false);
      setDone("変更しました（今はデータベースがないので保存はされません）。");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel acc-card" onSubmit={submit} noValidate>
      <div className="acc-card-head"><h2>パスワードの変更</h2></div>
      <div className="acc-card-body acc-pw-grid">
        <Field label="今のパスワード" required reserve error={errors.current}>
          <PasswordInput value={form.current} onChange={set("current")} autoComplete="current-password" />
        </Field>
        <Field label="新しいパスワード" required help="8〜64 文字" error={errors.next}>
          <PasswordInput value={form.next} onChange={set("next")} autoComplete="new-password" />
        </Field>
        <Field label="新しいパスワード（確認）" required reserve error={errors.confirm}>
          <PasswordInput value={form.confirm} onChange={set("confirm")} autoComplete="new-password" />
        </Field>
      </div>
      <div className="acc-bar">
        <Status error={error} ok={done} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <><Spinner />変更中…</> : "パスワードを変更"}
        </button>
      </div>
    </form>
  );
}
