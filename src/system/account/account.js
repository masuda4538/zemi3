// ═══════════════════════════════════════════════════════════════
//  アカウント：処理（入力のチェック・送るデータを作る）
//  画面は Account.jsx、Rust を呼ぶ関数は ../common/api.js
// ═══════════════════════════════════════════════════════════════
import {
  checkName, checkMail, checkGender, checkBirth, checkPassword, checkConfirm,
  toDateString, fromDateString,
} from "../common/validate.js";

/** ログインしている人の情報 → フォームの値 */
export const toProfileForm = (user) => ({
  name: user.name,
  mail: user.mail,
  genderId: user.genderId,
  birth: fromDateString(user.birthDate),
  languageIds: user.languages.map((l) => l.languageId),
});

/** 登録情報の入力チェック */
export const checkProfile = (f) => ({
  name: checkName(f.name),
  mail: checkMail(f.mail),
  genderId: checkGender(f.genderId),
  birth: checkBirth(f.birth),
});

/** Rust（update_me）に送る形にする */
export const toProfileInput = (f) => ({
  name: f.name.trim(),
  mail: f.mail.trim(),
  genderId: f.genderId,
  birthDate: toDateString(f.birth),
  languageIds: f.languageIds,
});

/** 登録情報（左の枠）に変更があるか */
export function isBasicChanged(user, f) {
  const a = toProfileInput(toProfileForm(user));
  const b = toProfileInput(f);
  return a.name !== b.name || a.mail !== b.mail || a.genderId !== b.genderId || a.birthDate !== b.birthDate;
}

/** 言語・試験（右の枠）に変更があるか */
export function isLanguagesChanged(user, selected) {
  const a = user.languages.map((l) => l.languageId).sort().join(",");
  return a !== [...selected].sort().join(",");
}

/** パスワード変更の入力チェック */
export const checkPasswordForm = (p) => ({
  current: p.current ? "" : "今のパスワードを入力してください。",
  next: checkPassword(p.next),
  confirm: checkConfirm(p.next, p.confirm),
});

/** 頭文字（アイコンに出す） */
export const initial = (name) => [...(name ?? "").trim()][0] ?? "?";
