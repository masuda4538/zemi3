// ═══════════════════════════════════════════════════════════════
//  入力フォームの部品（新規登録・アカウント画面で共通）
//    <Field>           … 項目名＋必須/任意＋入力欄＋エラー
//    <PasswordInput>   … 表示／非表示を切り替えられるパスワード欄
//    <GenderPicker>    … 性別をボタンで選ぶ
//    <BirthDateSelect> … 生年月日を 年・月・日 で選ぶ
//    <Switch>          … オン／オフのスイッチ
//    <MessageSlot>     … お知らせ欄（空でも高さを取っておく）
//  見た目は form.css
// ═══════════════════════════════════════════════════════════════
import { useEffect, useId, useRef, useState } from "react";
import "./form.css";

/**
 * reserve を付けると、エラーが出ていないときも 1 行ぶんの場所を取っておく
 * （エラーが出たときに、下の項目がずれないようにするため）
 */
export function Field({ label, required, optional, help, error, reserve, className = "", children }) {
  return (
    <div className={`field${error ? " has-error" : ""} ${className}`}>
      <span className="field-label">
        {label}
        {required && <span className="badge badge-req">必須</span>}
        {optional && <span className="badge badge-opt">任意</span>}
      </span>
      {children}
      {error
        ? <span className="field-error" role="alert">{error}</span>
        : help
          ? <span className="field-help">{help}</span>
          : reserve && <span className="field-help" aria-hidden="true">&nbsp;</span>}
    </div>
  );
}

/**
 * お知らせ欄（エラーなど）。message が空でも同じ高さの場所を取っておくので、画面がずれない
 * type : "error" か "ok"
 */
export function MessageSlot({ message, type = "error" }) {
  return (
    <div className="msg-slot" aria-live="polite">
      {message && <div className={`msg msg-${type}`} role={type === "error" ? "alert" : "status"}>{message}</div>}
    </div>
  );
}

/**
 * パスワード欄（「表示」で文字を見せる／隠す）
 * onShowChange : (見せているか) => void … 表示を切り替えたときに呼ばれる（なくてもよい）
 *                ログイン画面では、これで猫が目を隠す
 */
export function PasswordInput({ value, onChange, autoComplete = "current-password", onShowChange, ...rest }) {
  const [show, setShow] = useState(false);
  const notify = useRef(onShowChange);
  notify.current = onShowChange;
  const showRef = useRef(show);
  showRef.current = show;

  const toggle = () => {
    const next = !show;
    setShow(next);
    notify.current?.(next);
  };
  // 見せたまま画面から消えたとき（タブやステップを切り替えたとき）は、隠したことにする
  useEffect(() => () => { if (showRef.current) notify.current?.(false); }, []);

  return (
    <div className="pw-wrap">
      <input
        className="input"
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        spellCheck={false}
        {...rest}
      />
      <button type="button" className="pw-toggle" onClick={toggle} aria-pressed={show} aria-label={show ? "パスワードを隠す" : "パスワードを表示"}>
        {show ? "隠す" : "表示"}
      </button>
    </div>
  );
}

export function GenderPicker({ genders, value, onChange }) {
  return (
    <div className="chips" role="radiogroup" aria-label="性別">
      {genders.map((g) => (
        <button
          key={g.genderId}
          type="button"
          role="radio"
          aria-checked={value === g.genderId}
          className={`chip chip-sm${value === g.genderId ? " on" : ""}`}
          onClick={() => onChange(g.genderId)}
        >
          {g.genderName}
        </button>
      ))}
      {genders.length === 0 && <span className="field-help">読み込み中…</span>}
    </div>
  );
}

const THIS_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: THIS_YEAR - 1900 + 1 }, (_, i) => String(THIS_YEAR - i));
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1));

/** value = { year, month, day }（文字列） */
export function BirthDateSelect({ value, onChange }) {
  const id = useId();
  const days = value.year && value.month ? new Date(Number(value.year), Number(value.month), 0).getDate() : 31;
  const set = (key, v) => {
    const next = { ...value, [key]: v };
    // 月を変えて日がなくなったとき（例：2/31）は、日を選び直してもらう
    const max = next.year && next.month ? new Date(Number(next.year), Number(next.month), 0).getDate() : 31;
    if (Number(next.day) > max) next.day = "";
    onChange(next);
  };
  return (
    <div className="birth">
      <select className="input" aria-label="年" id={`${id}-y`} value={value.year} onChange={(e) => set("year", e.target.value)}>
        <option value="">年</option>
        {YEARS.map((y) => <option key={y} value={y}>{y} 年</option>)}
      </select>
      <select className="input" aria-label="月" value={value.month} onChange={(e) => set("month", e.target.value)}>
        <option value="">月</option>
        {MONTHS.map((m) => <option key={m} value={m}>{m} 月</option>)}
      </select>
      <select className="input" aria-label="日" value={value.day} onChange={(e) => set("day", e.target.value)}>
        <option value="">日</option>
        {Array.from({ length: days }, (_, i) => String(i + 1)).map((d) => <option key={d} value={d}>{d} 日</option>)}
      </select>
    </div>
  );
}

/** オン／オフのスイッチ */
export function Switch({ checked, onChange, label }) {
  return (
    <label className="switch">
      <input type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} aria-label={label} />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}

/** 送信中にくるくる回るマーク */
export const Spinner = () => <span className="spinner" aria-hidden="true" />;
