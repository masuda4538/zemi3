// ═══════════════════════════════════════════════════════════════
//  アチーブ：画面（見た目）　［このフォルダーの入口：main.jsx］
//  左に「すべて」と各アプリ、右にそのアチーブの一覧（手に入れたものは色つき、まだのものは灰色）
//  数をためるアチーブ（goal があるもの）は、カードに「2 / 10」と進み具合のバーを出す
//  一覧の上に、進み具合の円グラフ（Ring.jsx）
//    すべて   … 左に全体の大きな円、右にアプリごとの小さな円（押すとそのアプリへ）
//    各アプリ … そのアプリの大きな円
//  形は main/components/SettingsLayout.jsx、アチーブを集める処理は achieve.js
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import SettingsLayout from "../../main/components/SettingsLayout";
import Icon from "../../main/components/Icon";
import { getUnlocked, getProgress, onAchievementsChange } from "../../main/common/achievements.js";
import { GROUPS, ALL, countGot } from "./achieve.js";
import Ring from "./Ring";
import "./achieve.css";

export default function Achieve() {
  const [current, setCurrent] = useState("all");
  const [unlocked, setUnlocked] = useState(getUnlocked);
  const [progress, setProgress] = useState(getProgress);   // 数をためるアチーブの今の数

  // 開いているあいだに手に入れた・数が増えたら、すぐ反映する
  useEffect(() => onAchievementsChange(() => { setUnlocked(getUnlocked()); setProgress(getProgress()); }), []);

  const group = GROUPS.find((g) => g.app.id === current);
  const list = group ? group.list.map((a) => ({ ...a, appName: group.app.name })) : ALL;
  const got = countGot(list, unlocked);
  const allGot = countGot(ALL, unlocked);

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
      desc={group ? `${group.app.name}で手に入るアチーブです。` : "各アプリで手に入れたアチーブの一覧です。"}
    >
      <div className="panel ach-overview">
        <div className="ach-main-ring">
          <Ring got={got} total={list.length} size={168} big label={group ? group.app.name : "すべて"} />
          <div className="ach-main-text">
            <strong>{group ? group.app.name : "すべてのアプリ"}</strong>
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
                  <Ring got={n} total={g.list.length} size={68} label={g.app.name} />
                  <span className="ach-mini-name">{g.app.name}</span>
                  <span className="ach-mini-count">{n} / {g.list.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="ach-grid">
        {list.map((a) => {
          const when = unlocked[a.key];
          const now = a.goal ? (when ? a.goal : progress[a.key] ?? 0) : 0;   // 数をためるアチーブの今の数
          return (
            <div key={a.key} className={`panel ach-card${when ? " is-got" : ""}`}>
              <span className="ach-badge">
                <Icon name={when ? a.icon : "lock"} />
              </span>
              <div className="ach-text">
                <strong>{a.name}</strong>
                <p>{a.desc}</p>
                {a.goal && (
                  <div className="ach-count" role="img" aria-label={`${now} / ${a.goal}`}>
                    <div className="ach-count-bar"><div className="ach-count-fill" style={{ width: `${(now / a.goal) * 100}%` }} /></div>
                    <span><b>{now}</b> / {a.goal}</span>
                  </div>
                )}
                <small>{!group && <span className="ach-app">{a.appName}</span>}{when ? `取得 ${when}` : "まだ"}</small>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="ach-empty">まだアチーブがありません。</p>}
      </div>
      <p className="ach-note">手に入れたアチーブと進み具合は、この PC の中のファイル（achievements.json）にログイン ID ごとに保存しています。</p>
    </SettingsLayout>
  );
}
