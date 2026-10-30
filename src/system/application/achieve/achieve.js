// ═══════════════════════════════════════════════════════════════
//  アチーブ：処理（各アプリのアチーブを集める）
//  アチーブの名前と説明は、各アプリのフォルダーの achievements.js に書きます。
//  アプリを増やしたら、下の import と FROM_APPS に 1 行足します。
//  手に入れたかどうかは main/common/achievements.js（unlockAchievement / getUnlocked）
// ═══════════════════════════════════════════════════════════════
import { PAGES } from "../../main/apps";
import home from "../home/achievements.js";
import programming from "../programming/achievements.js";
import research from "../research/achievements.js";
import zukan from "../zukan/achievements.js";
import quiz from "../quiz/achievements.js";

/** アプリの id → そのアプリのアチーブ */
const FROM_APPS = { home, programming, research, zukan, quiz };

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
