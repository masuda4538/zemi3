// ═══════════════════════════════════════════════════════════════
//  Rust（src-tauri/src/commands.rs）を呼ぶための関数
//  画面からは、ここの関数を import して使います。
//    例）import { login } from "../common/api.js";
//        const user = await login("taro01", "password");
//  失敗したときは、画面に出せる文（文字列）が throw されます。
// ═══════════════════════════════════════════════════════════════
import { invoke } from "@tauri-apps/api/core";

/** Tauri のアプリとして動いているか（ブラウザで開いたときは false） */
export const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function call(command, args) {
  if (!inTauri) {
    throw "この機能はアプリとして起動したときだけ使えます（npm run tauri dev）。";
  }
  try {
    return await invoke(command, args);
  } catch (e) {
    throw typeof e === "string" ? e : (e?.message ?? String(e));
  }
}

/** データベースにつながるか */
export const checkDb = () => call("db_status");

/** 性別の一覧 [{ genderId, genderName }] */
export const getGenders = () => call("list_genders");

/** 言語・試験の一覧 [{ languageId, languageName }] */
export const getLanguages = () => call("list_languages");

/** 言語・試験を追加する（同じ名前があれば、それが返る） */
export const addLanguage = (name) => call("add_language", { name });

/** 新規登録（登録できたらログインした状態になり、その人の情報が返る） */
export const register = (input) => call("register", { input });

/** ログイン（その人の情報が返る） */
export const login = (userId, password) => call("login", { userId, password });

/** 開発中だけ：入力なしでテスト用アカウント（devuser / devpassword）でログインする */
export const devLogin = () => call("dev_login");

/** 開発中（npm run tauri dev）か。exe にしたときは false */
export const isDev = import.meta.env.DEV;

export const logout = () => call("logout");

/** ログインしている人の最新の情報 */
export const getMe = () => call("get_me");

/** ログインしている人の情報を変更する（変更後の情報が返る） */
export const updateMe = (input) => call("update_me", { input });

/** パスワードを変更する */
export const changePassword = (current, next) => call("change_password", { current, next });
