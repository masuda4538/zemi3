// ═══════════════════════════════════════════════════════════════
//  アカウント：画面（見た目）　［このフォルダーの入口：main.jsx］
//  GitHub の Settings のように、左に項目、右に選んだ項目の中身を出します（main/components/SettingsLayout.jsx）。
//    左上   … 名前・ログイン ID
//    左の項目 … プロフィール / 言語・試験 / パスワード（下の SECTIONS）
//    左下   … ログアウト
//  それぞれの「保存」は、その項目の内容だけを保存します。
//  保存していない変更があるまま別の項目を押すと、猫が「まだ保存してないよ…？」と聞きます。
//  「保存しました」などは右上のお知らせ（main/common/notify.js）、入力のエラーはボタンの横に出します（画面はずれません）。
//  main/App.jsx から user（ログインしている人）、onUserChange、onLogout、confirm を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useRef, useState } from "react";
import SettingsLayout from "../../main/components/SettingsLayout";
import LanguagePicker from "../../main/components/LanguagePicker";
import Icon from "../../main/components/Icon";
import Avatar from "../../main/components/Avatar";
import { Field, PasswordInput, GenderPicker, BirthDateSelect, Spinner } from "../../main/components/Form";
import { getGenders, getLanguages, updateMe, updateAvatar, changePassword } from "../../main/common/api.js";
import { noErrors } from "../../main/common/validate.js";
import { notify } from "../../main/common/notify.js";
import {
  toProfileForm, checkProfile, toProfileInput, isBasicChanged, isLanguagesChanged, checkPasswordForm, checkAvatarFile, toAvatarDataUrl,
} from "./account.js";
import "./account.css";

/** 左の項目（上から順に並ぶ） */
const SECTIONS = [
  { id: "profile",   name: "プロフィール", icon: "account",     desc: "アイコンの画像・名前・メールアドレス・生年月日・性別を変更します。" },
  { id: "languages", name: "言語・試験",   icon: "programming", desc: "勉強している言語や、受ける・持っている試験を選びます（任意）。" },
  { id: "password",  name: "パスワード",   icon: "lock",        desc: "ログインに使うパスワードを変更します。" },
];

export default function Account({ user, onUserChange, onLogout, confirm }) {
  const [current, setCurrent] = useState("profile");
  const [dirty, setDirty] = useState({});          // { profile: true, … } 保存していない変更がある項目
  const [genders, setGenders] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    getGenders().then(setGenders).catch((e) => setLoadError(String(e)));
    getLanguages().then(setLanguages).catch((e) => setLoadError(String(e)));
  }, []);

  // 各項目の中身から「保存していない変更があるか」を受け取る（項目ごとに 1 回だけ作る関数）
  const markDirty = useMemo(() => Object.fromEntries(SECTIONS.map((x) => [
    x.id, (value) => setDirty((d) => (d[x.id] === value ? d : { ...d, [x.id]: value })),
  ])), []);

  // 左の項目を押したとき：保存していない変更があれば、猫に聞いてもらう
  const select = async (id) => {
    if (id === current) return;
    if (dirty[current]) {
      const ok = await confirm({
        title: "保存していない変更があります",
        message: "移動すると、入力した内容は元に戻ります。",
        okLabel: "移動する", cancelLabel: "もどる",
        cat: { says: "まだ保存してないよ…？", bye: "わかった！" },
      });
      if (!ok) return;
      setDirty((d) => ({ ...d, [current]: false }));
    }
    setCurrent(id);
  };

  if (!user) return null;
  const section = SECTIONS.find((x) => x.id === current);

  return (
    <SettingsLayout
      head={<WhoAmI user={user} />}
      items={SECTIONS.map((x) => ({ ...x, dirty: !!dirty[x.id] }))}
      current={current}
      onSelect={select}
      foot={<LogoutButton onLogout={onLogout} />}
      title={section.name}
      desc={section.desc}
    >
      {current === "profile" && <AvatarCard user={user} onUserChange={onUserChange} />}
      {current === "profile" && <BasicCard user={user} genders={genders} loadError={loadError} onUserChange={onUserChange} onDirty={markDirty.profile} />}
      {current === "languages" && <LanguageCard user={user} languages={languages} setLanguages={setLanguages} loadError={loadError} onUserChange={onUserChange} onDirty={markDirty.languages} />}
      {current === "password" && <PasswordCard onDirty={markDirty.password} />}
    </SettingsLayout>
  );
}

/** ボタンの横に出すエラー（「保存しました」は右上のお知らせ。ok はほかで使いたいとき用） */
function Status({ error, ok }) {
  if (error) return <span className="acc-status is-error" role="alert">{error}</span>;
  if (ok) return <span className="acc-status is-ok" role="status">{ok}</span>;
  return <span className="acc-status" />;
}

/** 枠の保存の流れ（共通）：送る → 画面全体の user を新しくする → 「保存しました」 */
function useSave(onUserChange) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  // what：お知らせに出す「何を保存したか」
  const save = async (input, what) => {
    setBusy(true); setError("");
    try {
      const next = await updateMe(input);
      onUserChange(next);
      notify({ type: "success", title: "保存しました", message: what, key: "account-save" });
      return next;
    } catch (err) {
      setError(String(err));
      return null;
    } finally {
      setBusy(false);
    }
  };
  const clear = () => setError("");
  return { busy, error, save, clear, setError };
}

// ───────── 左上：名前・ログイン ID ─────────
function WhoAmI({ user }) {
  return (
    <div className="acc-who-box">
      <Avatar user={user} size={48} />
      <div className="acc-who">
        <strong>{user.name}</strong>
        <span>{user.userId}</span>
      </div>
      <small className="acc-dates">登録 {user.createdAt}<br />更新 {user.updatedAt}</small>
    </div>
  );
}

// ───────── プロフィール：アイコンの画像（選んだらすぐ変わる） ─────────
function AvatarCard({ user, onUserChange }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const change = async (dataUrl, doneText) => {
    setBusy(true); setError("");
    try {
      onUserChange(await updateAvatar(dataUrl));
      notify({ type: "success", title: doneText, key: "account-avatar" });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";            // 同じ画像をもう一度選んでも動くように
    if (!file) return;
    const problem = checkAvatarFile(file);
    if (problem) { setError(problem); return; }
    try {
      await change(await toAvatarDataUrl(file), "アイコンを変えました");
    } catch (err) {
      setError(String(err));
    }
  };

  return (
    <section className="panel acc-avatar-card">
      <Avatar user={user} size={84} />
      <div className="acc-avatar-text">
        <strong>アイコンの画像</strong>
        <p>正方形に切り取って使います（PNG・JPEG など、10 MB まで）。今はデータベースがないので、アプリを閉じると元に戻ります。</p>
        <Status error={error} />
      </div>
      <div className="acc-avatar-actions">
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => inputRef.current?.click()}>
          {busy ? <Spinner /> : "画像を選ぶ"}
        </button>
        <button type="button" className="btn btn-ghost" disabled={busy || !user.avatar} onClick={() => change("", "アイコンの画像を外しました")}>外す</button>
      </div>
    </section>
  );
}

// ───────── 左下：ログアウト ─────────
function LogoutButton({ onLogout }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-danger acc-logout"
      disabled={busy}
      onClick={async () => { setBusy(true); const done = await onLogout(); if (!done) setBusy(false); }}
    >
      {busy ? <Spinner /> : <><Icon name="logout" />ログアウト</>}
    </button>
  );
}

// ───────── 保存していない変更があるかを、親（Account）に知らせる ─────────
function useReportDirty(onDirty, changed) {
  useEffect(() => { onDirty?.(changed); }, [onDirty, changed]);
  useEffect(() => () => onDirty?.(false), [onDirty]);   // 別の項目へ移ったら「変更なし」に戻す
}

// ───────── プロフィール ─────────
function BasicCard({ user, genders, loadError, onUserChange, onDirty }) {
  const [form, setForm] = useState(() => toProfileForm(user));
  const [touched, setTouched] = useState(false);
  const s = useSave(onUserChange);

  const set = (key) => (value) => { s.clear(); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched ? checkProfile(form) : {};
  const changed = isBasicChanged(user, form);
  useReportDirty(onDirty, changed);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!noErrors(checkProfile(form))) { s.setError("赤い項目を確認してください。"); return; }
    // 言語・試験は今の登録のまま（「言語・試験」の項目で別に保存する）
    const next = await s.save(toProfileInput({ ...form, languageIds: user.languages.map((l) => l.languageId) }), "プロフィールを更新しました。");
    if (next) { setForm(toProfileForm(next)); setTouched(false); }
  };

  return (
    <form className="panel acc-card" onSubmit={submit} noValidate>
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
        <Status error={s.error || loadError} />
        <button type="button" className="btn btn-ghost" disabled={!changed || s.busy} onClick={() => { setForm(toProfileForm(user)); setTouched(false); s.clear(); }}>元に戻す</button>
        <button type="submit" className="btn btn-primary" disabled={!changed || s.busy}>
          {s.busy ? <><Spinner />保存中…</> : "保存"}
        </button>
      </div>
    </form>
  );
}

// ───────── 言語・試験 ─────────
function LanguageCard({ user, languages, setLanguages, loadError, onUserChange, onDirty }) {
  const [selected, setSelected] = useState(() => user.languages.map((l) => l.languageId));
  const s = useSave(onUserChange);
  const changed = isLanguagesChanged(user, selected);
  useReportDirty(onDirty, changed);

  const submit = async (e) => {
    e.preventDefault();
    // プロフィールは今の登録のまま（「プロフィール」の項目で別に保存する）
    const next = await s.save(toProfileInput({ ...toProfileForm(user), languageIds: selected }), "言語・試験を更新しました。");
    if (next) setSelected(next.languages.map((l) => l.languageId));
  };

  return (
    <form className="panel acc-card" onSubmit={submit} noValidate>
      <div className="acc-card-body acc-lang-body">
        <LanguagePicker
          languages={languages}
          selected={selected}
          onChange={(v) => { s.clear(); setSelected(v); }}
          onAdded={(lang) => setLanguages((list) => (list.some((l) => l.languageId === lang.languageId) ? list : [...list, lang]))}
        />
      </div>
      <div className="acc-bar">
        <Status error={s.error || loadError} />
        <button type="button" className="btn btn-ghost" disabled={!changed || s.busy} onClick={() => { setSelected(user.languages.map((l) => l.languageId)); s.clear(); }}>元に戻す</button>
        <button type="submit" className="btn btn-primary" disabled={!changed || s.busy}>
          {s.busy ? <><Spinner />保存中…</> : "保存"}
        </button>
      </div>
    </form>
  );
}

// ───────── パスワード ─────────
const emptyPassword = { current: "", next: "", confirm: "" };

function PasswordCard({ onDirty }) {
  const [form, setForm] = useState(emptyPassword);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (key) => (value) => { setError(""); setForm((f) => ({ ...f, [key]: value })); };
  const errors = touched ? checkPasswordForm(form) : {};
  useReportDirty(onDirty, !!(form.current || form.next || form.confirm));

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!noErrors(checkPasswordForm(form))) return;
    setBusy(true); setError("");
    try {
      await changePassword(form.current, form.next);
      setForm(emptyPassword); setTouched(false);
      notify({ type: "success", title: "パスワードを変更しました", message: "今はデータベースがないので、保存はされません。" });
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="panel acc-card" onSubmit={submit} noValidate>
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
        <Status error={error} />
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? <><Spinner />変更中…</> : "パスワードを変更"}
        </button>
      </div>
    </form>
  );
}
