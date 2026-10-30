// ═══════════════════════════════════════════════════════════════
//  アカウント：処理（入力のチェック・送るデータを作る）
//  画面は main.jsx、データを扱う関数は main/common/api.js
// ═══════════════════════════════════════════════════════════════
import {
  checkName, checkMail, checkGender, checkBirth, checkPassword, checkConfirm,
  toDateString, fromDateString,
} from "../../main/common/validate.js";

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

/** アイコンに使える画像か（だめなら理由、よければ ""） */
export function checkAvatarFile(file) {
  if (!file) return "画像を選んでください。";
  if (!file.type.startsWith("image/")) return "画像のファイル（PNG・JPEG など）を選んでください。";
  if (file.size > 10 * 1024 * 1024) return "10 MB までの画像にしてください。";
  return "";
}

/** 画像を、まん中を正方形に切り取って size × size に小さくする → data URL（PNG） */
export function toAvatarDataUrl(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(img.naturalWidth, img.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = size; canvas.height = size;
      canvas.getContext("2d").drawImage(img, (img.naturalWidth - s) / 2, (img.naturalHeight - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject("画像を読み込めませんでした。別の画像を選んでください。"); };
    img.src = url;
  });
}

/** 頭文字（アイコンに出す） */
export const initial = (name) => [...(name ?? "").trim()][0] ?? "?";
