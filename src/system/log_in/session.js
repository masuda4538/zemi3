// ═══════════════════════════════════════════════════════════════
//  ログインの処理（ログイン・新規登録・ログアウト・ログインを覚えておく）
//    ・ログインした人は、その PC の中のファイル（AppData の session.json）に覚えておきます
//      （ブラウザで開いたときは localStorage）。ログアウトするまで、次に起動したときもログインしたまま。
//    ・最後に使ってから SESSION_MONTHS か月たっていたら、もう一度ログインしてもらいます
//      （同じ ID でログインし直したら、名前・アイコンなどは元のまま）。
//  画面：LoginScreen.jsx（起動したときの画面）・LoginForm.jsx（ログイン / 新規登録の入力）・register.js（新規登録の入力チェック）
//  プロフィールの変更などは core/storage/account.js にあります。
//
//  ★ 今はデータベースを使っていません。ログインはログイン ID を入れれば入れます（パスワードはまだ確かめません）。
//    あとでデータベースをつなぐときは、login・register の中身を Rust（invoke）を呼ぶ形に書きかえます。
// ═══════════════════════════════════════════════════════════════
import { load } from "@tauri-apps/plugin-store";
import { inTauri, makeUser } from "../core/storage/account.js";

const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms)); // 通信しているように少し待つ
const copy = (u) => JSON.parse(JSON.stringify(u));

let me = null;   // ログインしている人（ログアウト中は null）

/** 最後に使ってから、何か月たったらもう一度ログインしてもらうか */
export const SESSION_MONTHS = 3;
let lastActiveAt = "";   // 最後に使った日時（ISO の文字。ログインしている間、touchSession で更新）
let expiredUser = null;  // 起動したときに期限が切れていた人（同じ ID でログインし直したら、名前・アイコンなどを元にもどす）

// ───────── ログインしている人を覚えておく（ログアウトするまで） ─────────
const SESSION_FILE = "session.json";
const SESSION_KEY = "session";       // ブラウザのとき（localStorage）
let sessionStore = null;

/** 起動したときに 1 回だけ呼ぶ：前にログインしていた人を読む（src/main.jsx） */
export async function initSession() {
  try {
    if (inTauri) {
      sessionStore = await load(SESSION_FILE, { autoSave: false, defaults: {} });
      me = (await sessionStore.get("user")) ?? null;
      lastActiveAt = (await sessionStore.get("lastActiveAt")) ?? "";
    } else {
      me = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
      lastActiveAt = localStorage.getItem(SESSION_KEY + ":lastActiveAt") ?? "";
    }
  } catch (err) {
    console.warn("ログインの記録を読めませんでした。", err);
    me = null;
  }
  // 最後に使ってから SESSION_MONTHS か月以上たっていたら、ログインしていないことにする（ID はログインの画面に入れる）
  if (me && lastActiveAt) {
    const limit = new Date();
    limit.setMonth(limit.getMonth() - SESSION_MONTHS);
    if (new Date(lastActiveAt) < limit) {
      expiredUser = me;   // ファイルの中身は消さない（ログインし直したら、そのまま使う）
      me = null;
    }
  }
}

/** 起動したときに、期限が切れてログインし直してもらう人のログイン ID（なければ ""） */
export const expiredUserId = () => expiredUser?.userId ?? "";

/** 「今使っている」と記録する（ログインしている間、core/App.jsx が起動したときと 1 時間ごとに呼ぶ） */
export async function touchSession() {
  if (!me) return;
  lastActiveAt = new Date().toISOString();
  try {
    if (sessionStore) { await sessionStore.set("lastActiveAt", lastActiveAt); await sessionStore.save(); }
    else if (!inTauri) localStorage.setItem(SESSION_KEY + ":lastActiveAt", lastActiveAt);
  } catch (err) {
    console.warn("最後に使った日時を保存できませんでした。", err);
  }
}

/** 今の me を保存する（null ならログアウト → 消す） */
async function saveSession() {
  try {
    if (sessionStore) {
      if (me) await sessionStore.set("user", me);
      else await sessionStore.delete("user");
      await sessionStore.save();
    } else if (!inTauri) {
      if (me) localStorage.setItem(SESSION_KEY, JSON.stringify(me));
      else localStorage.removeItem(SESSION_KEY);
    }
  } catch (err) {
    console.warn("ログインの記録を保存できませんでした。", err);
  }
}

/** 起動したときにログインしている人（していなければ null）。App.jsx が最初に使う */
export const savedUser = () => (me ? copy(me) : null);

/** 新規登録（入力のチェックは register.js で済んでいる）。登録した人でログインした状態になる */
export async function register(input) {
  await wait();
  me = makeUser(input);
  expiredUser = null;
  await saveSession();
  await touchSession();
  return copy(me);
}

/** ログイン：今はログイン ID を入れれば入れる（パスワードはまだ確かめない） */
export async function login(userId, _password) {
  await wait();
  const id = (userId ?? "").trim();
  if (!id) throw "ログイン ID を入力してください。";
  // 期限が切れていた人が同じ ID でログインし直したときは、前の名前・アイコンなどをそのまま使う
  me = expiredUser?.userId === id ? expiredUser : makeUser({ userId: id, name: id, mail: `${id}@example.com` });
  expiredUser = null;
  await saveSession();
  await touchSession();
  return copy(me);
}

/** ログインしている人の ID（していなければ ""）。アチーブ・使った時間などを人ごとに分けるのに使う */
export const currentUserId = () => me?.userId ?? "";

/** ログアウト（覚えていたログインも消す） */
export async function logout() {
  me = null;
  expiredUser = null;
  await saveSession();
}

// ───────── core/storage/account.js（プロフィールの変更）が使う ─────────
/** ログインしている人（そのままの形。していなければ null） */
export const sessionUser = () => me;

/** ログインしている人の情報を入れかえて保存する（変えたあとの人を返す） */
export async function setSessionUser(user) {
  me = user;
  await saveSession();
  return me;
}
