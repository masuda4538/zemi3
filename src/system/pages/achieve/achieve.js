// ═══════════════════════════════════════════════════════════════
//  アチーブ：処理（各アプリのアチーブを集める）
//  アチーブの名前と説明は、src/system/achieve_setting/<アプリの id>.js に書きます（例：achieve_setting/quiz.js）。
//  achieve_setting の .js は自動で集めます（ファイルが無いアプリは、アチーブが無いだけ）。ファイル名 ＝ アプリの id
//  手に入れたかどうかは main/common/achievements.js（unlockAchievement / getUnlocked）
// ═══════════════════════════════════════════════════════════════
import { PAGES, BOTTOM_PAGES } from "../../main/apps";

/** レア度（3 段階。下ほど手に入れにくい。アチーブのカードの枠の色で分ける）
 *  achieve_setting のファイルに rarity: "silver" のように書く（書かなければ bronze）
 *  色は main/theme.css の .rarity-bronze / .rarity-silver / .rarity-gold */
export const RARITIES = [
  { id: "bronze", name: "ブロンズ" },
  { id: "silver", name: "シルバー" },
  { id: "gold",   name: "ゴールド" },
];
const rarityOf = (id) => RARITIES.find((r) => r.id === id) ?? RARITIES[0];

/** アチーブを持てるページ（左のサイドバーと同じ順：ホーム〜問題作成 → アチーブ・設定・アカウント） */
const ALL_PAGES = [...PAGES, ...BOTTOM_PAGES];

/** アプリの id → そのアプリのアチーブ（achieve_setting/<id>.js の export default） */
const FROM_APPS = Object.fromEntries(
  Object.entries(import.meta.glob("../../achieve_setting/*.js", { eager: true, import: "default" }))
    .map(([file, list]) => [file.split("/").at(-1).replace(/\.js$/, ""), Array.isArray(list) ? list : []]),   // ファイル名（quiz.js → quiz）
);

// 開発中だけ：書きまちがいに気づけるように、コンソールに警告を出す
if (import.meta.env.DEV) {
  for (const [id, list] of Object.entries(FROM_APPS)) {
    if (!ALL_PAGES.some((p) => p.id === id)) console.warn(`achieve_setting/${id}.js：「${id}」というページはありません（ファイル名を main/apps.js の id と同じにしてください）。`);
    const seen = new Set();
    for (const a of list) {
      if (!a?.id || !a?.name) console.warn(`achieve_setting/${id}.js：id と name が無いアチーブがあります。`, a);
      else if (a.rarity && !RARITIES.some((r) => r.id === a.rarity)) console.warn(`achieve_setting/${id}.js：「${a.id}」の rarity「${a.rarity}」はありません（${RARITIES.map((r) => r.id).join(" / ")} のどれか）。`);
      else if (seen.has(a.id)) console.warn(`achieve_setting/${id}.js：id「${a.id}」が 2 回書かれています。`);
      seen.add(a?.id);
    }
  }
}

/** アプリごとのアチーブ [{ app（apps.js のページ）, list: [{ key, id, name, desc, icon }] }]（左のサイドバーと同じ順） */
export const GROUPS = ALL_PAGES
  .filter((p) => FROM_APPS[p.id]?.length)
  .map((p) => ({
    app: p,
    list: FROM_APPS[p.id].map((a) => ({
      ...a,
      key: `${p.id}:${a.id}`,
      icon: a.icon ?? "trophy",
      rarity: rarityOf(a.rarity).id,          // "bronze" / "silver" / "gold"
      rarityName: rarityOf(a.rarity).name,    // 「ブロンズ」など
    })),
  }));

/** すべてのアチーブ（アプリの名前つき） */
export const ALL = GROUPS.flatMap((g) => g.list.map((a) => ({ ...a, appName: g.app.name, appIcon: g.app.icon })));

/** 1 つのアチーブを探す */
export const findAchievement = (appId, achId) => ALL.find((a) => a.key === `${appId}:${achId}`) ?? null;

/** いくつ手に入れたか */
export const countGot = (list, unlocked) => list.filter((a) => unlocked[a.key]).length;

// ───────── あいまい検索（アチーブのページの絞り込み） ─────────
/** くらべやすい形にする：全角・半角をそろえる、大文字→小文字、カタカナ→ひらがな、空白を消す */
const normalize = (text) => String(text ?? "")
  .normalize("NFKC")
  .toLowerCase()
  .replace(/[\u30a1-\u30f6]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
  .replace(/\s+/g, "");

/** word の文字が、text の中に同じ順番で出てくるか（間に別の文字があってもよい。例：「こつ学」→「コツコツ学習」） */
const inOrder = (text, word) => {
  let i = 0;
  for (const c of text) if (c === word[i]) i++;
  return i === word.length;
};

/** アチーブが検索の言葉に合うか（名前・説明・アプリの名前・レア度の名前から探す）
 *  空白で区切ると「どれも合うもの」だけ。1 文字の言葉は、そのままふくまれるときだけ合う */
export function matchSearch(a, query) {
  const words = String(query ?? "").normalize("NFKC").split(/\s+/).map(normalize).filter(Boolean);
  if (!words.length) return true;
  const text = normalize([a.name, a.desc, a.appName, a.rarityName, a.id].join(" "));
  return words.every((w) => text.includes(w) || (w.length >= 2 && inOrder(text, w)));
}
