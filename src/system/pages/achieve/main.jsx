// ═══════════════════════════════════════════════════════════════
//  アチーブ：画面（見た目）　［このフォルダーの入口：main.jsx］
//  左に「すべて」と各アプリ、右にそのアチーブの一覧（手に入れたものは色つき、まだのものは灰色）
//  数をためるアチーブ（goal があるもの）は、カードに「2 / 10」と進み具合のバーを出す
//  一覧の上に、進み具合の円グラフ（Ring.jsx）
//    すべて   … 左に全体の大きな円、右にアプリごとの小さな円（押すとそのアプリへ）
//    各アプリ … そのアプリの大きな円
//  一覧の上の絞り込み
//    さがす（あいまい検索：名前・説明・アプリ名）／ レア度（ブロンズ・シルバー・ゴールド）／ 未取得・取得済み
//    並べ方（1 行に 1 つ ／ 横に 3 つ）… 設定ファイルの achieveView に保存（次に開いたときもそのまま）
//  カード：名前の左にレア度、枠がレア度の色（色は main/theme.css）。どのアプリのアチーブかは右下のアイコンで出す
//  形は main/components/SettingsLayout.jsx、アチーブを集める処理は achieve.js
// ═══════════════════════════════════════════════════════════════
import { useEffect, useMemo, useState } from "react";
import SettingsLayout from "../../main/components/SettingsLayout";
import Icon from "../../main/components/Icon";
import { getUnlocked, getProgress, onAchievementsChange, unlockAchievement } from "../../main/common/achievements.js";
import { GROUPS, ALL, RARITIES, countGot, matchSearch } from "./achieve.js";
import Ring from "./Ring";
import "./achieve.css";

/** 並べ方（設定ファイルの achieveView） */
const VIEWS = [
  { id: "list", name: "1 列", icon: "list" },
  { id: "grid", name: "横に 3 つ", icon: "columns" },
];
/** 手に入れたかどうかの絞り込み */
const STATES = [
  { id: "all", name: "すべて" },
  { id: "todo", name: "未取得" },
  { id: "got", name: "取得済み" },
];

export default function Achieve({ settings, onSettings }) {
  const [current, setCurrent] = useState("all");
  const [query, setQuery] = useState("");          // さがす言葉
  const [rarity, setRarity] = useState("all");     // レア度（"all" か RARITIES の id）
  const [state, setState] = useState("all");       // "all" / "todo"（未取得）/ "got"（取得済み）
  const view = settings?.achieveView === "grid" ? "grid" : "list";
  const [unlocked, setUnlocked] = useState(getUnlocked);
  const [progress, setProgress] = useState(getProgress);   // 数をためるアチーブの今の数

  // 開いているあいだに手に入れた・数が増えたら、すぐ反映する
  useEffect(() => onAchievementsChange(() => { setUnlocked(getUnlocked()); setProgress(getProgress()); }), []);

  // アチーブ「コレクター見習い」：このページを開いたら（achieve_setting/achieve.js）
  useEffect(() => { unlockAchievement("achieve", "first-view"); }, []);

  const group = GROUPS.find((g) => g.app.id === current);
  const list = group ? group.list.map((a) => ({ ...a, appName: group.app.name })) : ALL;
  const got = countGot(list, unlocked);
  const allGot = countGot(ALL, unlocked);

  // 絞り込んだあとの一覧（言葉・レア度・取得したか）
  const shown = useMemo(() => list.filter((a) =>
    (rarity === "all" || a.rarity === rarity) &&
    (state === "all" || (state === "got") === !!unlocked[a.key]) &&
    matchSearch(a, query),
  ), [list, rarity, state, query, unlocked]);
  const filtering = query.trim() !== "" || rarity !== "all" || state !== "all";
  const clearFilters = () => { setQuery(""); setRarity("all"); setState("all"); };

  const items = [
    { id: "all", name: "すべて", icon: "trophy", badge: `${allGot}/${ALL.length}` },
    ...GROUPS.map((g) => ({ id: g.app.id, name: g.app.name, icon: g.app.icon, badge: `${countGot(g.list, unlocked)}/${g.list.length}` })),
  ];

  return (
    <SettingsLayout
      head={
        <div className="ach-head">
          <span className="ach-head-icon"><Icon name="trophy" /></span>
          <div className="ach-head-text"><strong>アチーブ</strong><span>{allGot} / {ALL.length} こ 手に入れた</span></div>
        </div>
      }
      items={items}
      current={current}
      onSelect={setCurrent}
      title={group ? group.app.name : "すべてのアチーブ"}
      desc={group ? `${group.app.name}で手に入るアチーブです。` : "各アプリ・ページで手に入れたアチーブの一覧です。"}
    >
      <div className="panel ach-overview">
        <div className="ach-main-ring">
          <Ring got={got} total={list.length} size={168} big label={group ? group.app.name : "すべて"} />
          <div className="ach-main-text">
            <strong>{group ? group.app.name : "すべて"}</strong>
            <span>{got} / {list.length} こ 手に入れた</span>
            <span>{list.length - got > 0 ? `あと ${list.length - got} こ` : "ぜんぶ手に入れました！"}</span>
          </div>
        </div>
        {!group && (
          <div className="ach-mini-rings">
            {GROUPS.map((g) => {
              const n = countGot(g.list, unlocked);
              return (
                <button key={g.app.id} type="button" className="ach-mini" onClick={() => setCurrent(g.app.id)} title={`${g.app.name}：${n} / ${g.list.length} こ（押すと開く）`}>
                  <Ring got={n} total={g.list.length} size={60} label={g.app.name} />
                  <span className="ach-mini-name">{g.app.name}</span>
                  <span className="ach-mini-count">{n} / {g.list.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 絞り込み・並べ方 */}
      <div className="panel ach-filter">
        <label className="ach-search">
          <Icon name="search" />
          <input
            type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="さがす（名前・説明・アプリ名。あいまいでも OK）" aria-label="アチーブをさがす"
          />
        </label>
        <div className="ach-filter-row">
          <div className="ach-seg" role="group" aria-label="レア度">
            {[{ id: "all", name: "すべて" }, ...RARITIES].map((r) => (
              <button
                key={r.id} type="button" aria-pressed={rarity === r.id}
                className={`${rarity === r.id ? "is-on" : ""}${r.id !== "all" ? ` rarity-${r.id} is-rarity` : ""}`}
                onClick={() => setRarity(r.id)}
              >{r.name}</button>
            ))}
          </div>
          <div className="ach-seg" role="group" aria-label="手に入れたか">
            {STATES.map((st) => (
              <button key={st.id} type="button" aria-pressed={state === st.id} className={state === st.id ? "is-on" : ""} onClick={() => setState(st.id)}>{st.name}</button>
            ))}
          </div>
          <div className="ach-seg ach-view" role="group" aria-label="並べ方">
            {VIEWS.map((v) => (
              <button
                key={v.id} type="button" title={v.name} aria-pressed={view === v.id}
                className={view === v.id ? "is-on" : ""}
                onClick={() => onSettings?.({ achieveView: v.id })}
              ><Icon name={v.icon} />{v.name}</button>
            ))}
          </div>
        </div>
      </div>
      <div className="ach-result">
        <span>{filtering ? `${list.length} こ中 ${shown.length} こ` : `${list.length} こ`}</span>
        {filtering && <button type="button" className="ach-clear" onClick={clearFilters}>絞り込みをやめる</button>}
      </div>

      <div className={`ach-grid is-${view}`}>
        {shown.map((a) => {
          const when = unlocked[a.key];
          const now = a.goal ? (when ? a.goal : progress[a.key] ?? 0) : 0;   // 数をためるアチーブの今の数
          return (
            <div key={a.key} className={`panel ach-card rarity-${a.rarity}${when ? " is-got" : ""}`}>
              <span className="ach-badge">
                <Icon name={when ? a.icon : "lock"} />
              </span>
              <div className="ach-text">
                <div className="ach-title">
                  <span className="rarity-label">{a.rarityName}</span>
                  <strong>{a.name}</strong>
                </div>
                <p>{a.desc}</p>
                {a.goal && (
                  <div className="ach-count" role="img" aria-label={`${now} / ${a.goal}`}>
                    <div className="ach-count-bar"><div className="ach-count-fill" style={{ width: `${(now / a.goal) * 100}%` }} /></div>
                    <span><b>{now}</b> / {a.goal}</span>
                  </div>
                )}
                <small>
                  {/* どのアプリのアチーブか（アイコン。名前はマウスをのせると出る） */}
                  {!group && <span className="ach-app" title={a.appName} aria-label={a.appName} role="img"><Icon name={a.appIcon} /></span>}
                  {when ? `取得 ${when}` : "まだ"}
                </small>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="ach-empty">まだアチーブがありません。</p>}
        {list.length > 0 && shown.length === 0 && (
          <p className="ach-empty">条件に合うアチーブはありません。<button type="button" className="ach-clear" onClick={clearFilters}>絞り込みをやめる</button></p>
        )}
      </div>
      <p className="ach-note">手に入れたアチーブと進み具合は、この PC の中のファイル（achievements.json）にログイン ID ごとに保存しています。</p>
    </SettingsLayout>
  );
}
