// ═══════════════════════════════════════════════════════════════
//  入力のチェック（新規登録とアカウント画面で共通）
//  問題があればメッセージ、なければ "" を返します。
//  Rust 側（account.rs）でも同じチェックをしています。
// ═══════════════════════════════════════════════════════════════

export function checkUserId(v) {
  if (!v) return "ログイン ID を入力してください。";
  if (v.length < 4 || v.length > 16) return "4〜16 文字にしてください。";
  if (!/^[A-Za-z0-9_-]+$/.test(v)) return "半角英数字と _ - だけで入力してください。";
  return "";
}

export function checkPassword(v) {
  if (!v) return "パスワードを入力してください。";
  if ([...v].length < 8 || [...v].length > 64) return "8〜64 文字にしてください。";
  return "";
}

export function checkConfirm(password, confirm) {
  if (!confirm) return "確認のため、もう一度入力してください。";
  if (password !== confirm) return "パスワードが一致しません。";
  return "";
}

export function checkName(v) {
  if (!v.trim()) return "名前を入力してください。";
  if ([...v].length > 255) return "255 文字までにしてください。";
  return "";
}

export function checkMail(v) {
  const s = v.trim();
  if (!s) return "メールアドレスを入力してください。";
  if (s.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@.]+$/.test(s)) return "メールアドレスの形が正しくありません。";
  return "";
}

export function checkGender(id) {
  return id ? "" : "性別を選んでください。";
}

/** 生年月日 { year, month, day }（どれも文字列）→ "" か メッセージ */
export function checkBirth({ year, month, day }) {
  if (!year || !month || !day) return "生年月日を選んでください。";
  const d = new Date(Number(year), Number(month) - 1, Number(day));
  if (d.getMonth() !== Number(month) - 1) return "ない日付です。";
  if (d > new Date()) return "未来の日付は選べません。";
  return "";
}

/** { year, month, day } → "YYYY-MM-DD" */
export const toDateString = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

/** "YYYY-MM-DD" → { year, month, day } */
export function fromDateString(s) {
  const [year = "", month = "", day = ""] = (s ?? "").split("-");
  return { year, month: String(Number(month) || ""), day: String(Number(day) || "") };
}

/** エラーが 1 つもないか */
export const noErrors = (errors) => Object.values(errors).every((m) => !m);
