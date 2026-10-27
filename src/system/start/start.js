// ═══════════════════════════════════════════════════════════════
//  起動画面：処理（入力のチェック・送るデータを作る）
//  画面は main.jsx、Rust を呼ぶ関数は ../common/api.js
// ═══════════════════════════════════════════════════════════════
import {
  checkUserId, checkPassword, checkConfirm, checkName, checkMail, checkGender, checkBirth, toDateString,
} from "../common/validate.js";

/** ログインの入力チェック（問題があればメッセージ） */
export function checkLogin(userId, password) {
  if (!userId.trim() || !password) return "ログイン ID とパスワードを入力してください。";
  return "";
}

/** 開発中に、ID もパスワードも空のままログインを押したか（テスト用アカウントで入る） */
export const isQuickLogin = (isDev, userId, password) => isDev && !userId.trim() && !password;

/** 新規登録フォームの最初の値 */
export const emptyRegister = () => ({
  userId: "",
  name: "",
  password: "",
  confirm: "",
  mail: "",
  genderId: 0,
  birth: { year: "", month: "", day: "" },
  languageIds: [],   // 任意
});

/** 新規登録の入力チェック → 項目ごとのメッセージ（問題なければ ""） */
export const checkRegister = (f) => ({
  userId: checkUserId(f.userId.trim()),
  name: checkName(f.name),
  password: checkPassword(f.password),
  confirm: checkConfirm(f.password, f.confirm),
  mail: checkMail(f.mail),
  genderId: checkGender(f.genderId),
  birth: checkBirth(f.birth),
});

/** Rust（register）に送る形にする */
export const toRegisterInput = (f) => ({
  userId: f.userId.trim(),
  name: f.name.trim(),
  password: f.password,
  mail: f.mail.trim(),
  genderId: f.genderId,
  birthDate: toDateString(f.birth),
  languageIds: f.languageIds,
});
