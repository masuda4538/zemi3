// ═══════════════════════════════════════════════════════════════
//  アチーブ：処理（各アプリのアチーブを集める）
//  アチーブの名前と説明は、各アプリのフォルダーの achievements/achievements.js に書きます。
//  achievements/achievements.js は自動で集めます（無いフォルダーは、アチーブが無いだけ）。フォルダー名 ＝ アプリの id
//  手に入れたかどうかは main/common/achievements.js（unlockAchievement / getUnlocked）
// ═══════════════════════════════════════════════════════════════
import { PAGES } from "../../main/apps";

/** アプリの id → そのアプリのアチーブ（application/<id>/achievements/achievements.js の export default） */
const FROM_APPS = Object.fromEntries(
  Object.entries(import.meta.glob("../*/achievements/achievements.js", { eager: true, import: "default" }))
    .map(([file, list]) => [file.split("/")[1], Array.isArray(list) ? list : []]),
);

/** アプリごとのアチーブ [{ app（apps.js のページ）, list: [{ key, id, name, desc, icon }] }]（左のサイドバーと同じ順） */
export const GROUPS = PAGES
  .filter((p) => FROM_APPS[p.id]?.length)
  .map((p) => ({
    app: p,
    list: FROM_APPS[p.id].map((a) => ({ ...a, key: `${p.id}:${a.id}`, icon: a.icon ?? "trophy" })),
  }));

/** すべてのアチーブ（アプリの名前つき） */
export const ALL = GROUPS.flatMap((g) => g.list.map((a) => ({ ...a, appName: g.app.name })));

/** 1 つのアチーブを探す */
export const findAchievement = (appId, achId) => ALL.find((a) => a.key === `${appId}:${achId}`) ?? null;

/** いくつ手に入れたか */
export const countGot = (list, unlocked) => list.filter((a) => unlocked[a.key]).length;
