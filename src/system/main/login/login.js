// ═══════════════════════════════════════════════════════════════
//  起動画面：処理（入力のチェック・送るデータを作る）
//  画面は main.jsx、データを扱う関数は ../common/api.js
// ═══════════════════════════════════════════════════════════════
import {
  checkUserId, checkPassword, checkConfirm, checkName, checkMail, checkGender, checkBirth, toDateString,
} from "../common/validate.js";

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

// ───────── 新規登録のステップ ─────────
//  ステップを増やす・入れかえるときは、ここと main.jsx の RegisterForm（ステップごとの中身）を直します。
//  fields … そのステップで入力する項目（「次へ」を押したときに、ここだけチェックする）
export const STEPS = [
  { key: "account",   title: "アカウント",   desc: "ログインに使う ID とパスワードを決めます。",               fields: ["userId", "password", "confirm"] },
  { key: "profile",   title: "プロフィール", desc: "名前・メールアドレス・生年月日・性別を入力します。",       fields: ["name", "mail", "birth", "genderId"] },
  { key: "languages", title: "言語・試験",   desc: "勉強している言語や、受ける・持っている試験を選びます。", fields: [], optional: true },
  { key: "confirm",   title: "確認",         desc: "内容を確かめて「登録してはじめる」を押してください。", fields: [] },
];

/** そのステップの項目だけのエラー */
export function stepErrors(form, index) {
  const all = checkRegister(form);
  return Object.fromEntries(STEPS[index].fields.map((k) => [k, all[k]]));
}

/** before より前で、エラーがある最初のステップ（なければ -1） */
export function firstInvalidStep(form, before = STEPS.length) {
  for (let i = 0; i < before; i++) {
    if (Object.values(stepErrors(form, i)).some(Boolean)) return i;
  }
  return -1;
}

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
