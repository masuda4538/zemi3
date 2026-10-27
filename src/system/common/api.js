// ═══════════════════════════════════════════════════════════════
//  アカウントのデータを扱う関数（今はデータベースなしの「仮」）
//  画面からは、ここの関数を import して使います。
//    例）import { login } from "../common/api.js";
//        const user = await login("taro01", "password");
//
//  ★ 今はデータベースを使っていません。
//    ・ログインは、何を入力しても（空でも）入れます
//    ・新規登録・アカウントの変更・パスワードの変更は、アプリを閉じるまでのあいだだけ覚えています（保存しません）
//    ・性別・言語と試験の一覧は、下の GENDERS・LANGUAGES に書いてあります
//    あとでデータベースをつなぐときは、この中身を Rust（invoke）を呼ぶ形に書きかえます。
//    画面（main.jsx など）は書きかえなくて大丈夫なように、関数の名前と返す形はそのままにしています。
//
//  失敗したときは、画面に出せる文（文字列）が throw されます。
// ═══════════════════════════════════════════════════════════════

/** Tauri のアプリとして動いているか（ブラウザで開いたときは false） */
export const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

/** 開発中（npm run tauri dev）か。exe にしたときは false */
export const isDev = import.meta.env.DEV;

// ───────── 仮のデータ（アプリを閉じると元に戻る） ─────────

/** 性別の一覧 */
const GENDERS = [
  { genderId: 1, genderName: "男性" },
  { genderId: 2, genderName: "女性" },
  { genderId: 3, genderName: "その他" },
  { genderId: 9, genderName: "回答しない" },
];

/** プログラム言語・試験の一覧 */
const LANGUAGES = [
  "C", "C++", "C#", "Java", "Python", "JavaScript", "TypeScript", "PHP", "Ruby", "Go", "Rust", "Kotlin", "Swift", "SQL", "HTML / CSS",
  "ITパスポート試験", "情報セキュリティマネジメント試験", "基本情報技術者試験", "応用情報技術者試験",
  "データベーススペシャリスト試験", "ネットワークスペシャリスト試験",
].map((name, i) => ({ languageId: `lang${i + 1}`, languageName: name }));

let me = null;   // ログインしている人（ログアウト中は null）

const pad = (n) => String(n).padStart(2, "0");
const nowText = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const wait = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms)); // 通信しているように少し待つ
const copy = (u) => JSON.parse(JSON.stringify(u));

/** 入力から、画面に返す「ログインしている人」の形を作る */
function makeUser({ userId, name, mail = "", genderId = 9, birthDate = "2000-01-01", languageIds = [] }) {
  const now = nowText();
  return {
    userId,
    name,
    mail,
    genderId,
    genderName: GENDERS.find((g) => g.genderId === genderId)?.genderName ?? "",
    birthDate,
    languages: LANGUAGES.filter((l) => languageIds.includes(l.languageId)),
    createdAt: now,
    updatedAt: now,
  };
}

// ───────── 画面から呼ぶ関数 ─────────

/** 性別の一覧 [{ genderId, genderName }] */
export const getGenders = async () => copy(GENDERS);

/** 言語・試験の一覧 [{ languageId, languageName }] */
export const getLanguages = async () => copy(LANGUAGES);

/** 言語・試験を追加する（同じ名前があれば、それが返る）。アプリを閉じると消える */
export async function addLanguage(name) {
  const n = name.trim();
  if (!n) throw "言語・試験の名前を入力してください。";
  let lang = LANGUAGES.find((l) => l.languageName === n);
  if (!lang) {
    lang = { languageId: `new${Date.now()}`, languageName: n };
    LANGUAGES.push(lang);
  }
  return copy(lang);
}

/** 新規登録（入力のチェックは画面側で済んでいる）。登録した人でログインした状態になる */
export async function register(input) {
  await wait();
  me = makeUser(input);
  return copy(me);
}

/** ログイン：今は何を入力しても入れる（空のときは「ゲスト」） */
export async function login(userId, _password) {
  await wait();
  const id = (userId ?? "").trim() || "guest";
  me = makeUser({ userId: id, name: id === "guest" ? "ゲスト" : id, mail: `${id}@example.com` });
  return copy(me);
}

export async function logout() {
  me = null;
}

/** ログインしている人の最新の情報 */
export async function getMe() {
  if (!me) throw "ログインしていません。もう一度ログインしてください。";
  return copy(me);
}

/** ログインしている人の情報を変更する（変更後の情報が返る）。アプリを閉じると元に戻る */
export async function updateMe(input) {
  await wait();
  if (!me) throw "ログインしていません。もう一度ログインしてください。";
  me = { ...makeUser({ ...input, userId: me.userId }), createdAt: me.createdAt, updatedAt: nowText() };
  return copy(me);
}

/** パスワードを変更する（今は保存しないので、いつも成功する） */
export async function changePassword(_current, _next) {
  await wait();
  if (!me) throw "ログインしていません。もう一度ログインしてください。";
}
