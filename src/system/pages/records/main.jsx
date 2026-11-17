// ═══════════════════════════════════════════════════════════════
//  記録：画面（見た目）　［このフォルダーの入口：main.jsx］
//  合計の時間や、アプリごとの記録を見るページ（左のサイドバーの「記録」。アチーブの上）
//  ※ アチーブは、ここには出さない（アチーブのページで見る）
//  左に「すべて」と各アプリ、右にその記録
//    すべて   … 合計の数字（勉強した時間・1 日の平均・ログイン日数）
//                ／ アプリごとの時間（円グラフ ＋ 一覧）／ 棒グラフ（時間ごと・曜日ごと・日ごと・月ごと）
//                ／ 学習の内訳（円グラフ）・大事な数 ／ 日ごとの履歴
//    各アプリ … そのアプリの数字 ／ 学習の内訳（円グラフ）・大事な数 ／ 棒グラフ ／ 日ごとの履歴
//  いちばん上で期間を切りかえる（今日／今週／今月／すべて）。今週は月曜日から日曜日まで（ホームと同じ）
//
//  ★ このページでは記録を「読むだけ」です（書きかえない）。読んでいるところ
//    使った時間       … core/storage/usage.js の getUsage（日ごと・アプリごとの秒）
//    学習の内訳・大事な数 … core/storage/stats.js の getAllStats（今までの合計だけ。日付は持っていない）
//    ログイン日数     … core/storage/logins.js の getLoginDays
//  グラフ（円グラフ・棒グラフ）は charts.jsx、見た目は records.css、形は core/components/SettingsLayout.jsx
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import SettingsLayout from "../../core/components/SettingsLayout";
import Icon from "../../core/components/Icon";
import { PAGES } from "../../core/page-list";
import { getUsage, onUsageChange } from "../../core/storage/usage.js";
import { getAllStats, onStatsChange } from "../../core/storage/stats.js";
import { getLoginDays, onLoginsChange, dayKey } from "../../core/storage/logins.js";
import { Donut, BarChart, columnsOf, timeText } from "./charts.jsx";
import "./records.css";

/** 記録を出すアプリ（左のサイドバーの上の段。ホームは時間を計らないのでのぞく） */
const APPS = PAGES.filter((p) => p.id !== "home");

/** アプリごとの色（ホームの「使った時間」と同じ色。application/home/js/main.js の APP_COLORS） */
const APP_COLORS = {
  programming: "#2563eb",  // 青
  research: "#0ea5e9",     // 水色
  zukan: "#14b8a6",        // 青緑
  quiz: "#f59e0b",         // 黄
  timer: "#8b5cf6",        // むらさき
};
const colorOf = (id) => APP_COLORS[id] ?? "#94a3b8";   // ここにないアプリは灰色

/** 期間の切りかえ */
const SPANS = [
  { id: "day", name: "今日" },
  { id: "week", name: "今週" },
  { id: "month", name: "今月" },
  { id: "all", name: "すべて" },
];

/** 日ごとの履歴を、はじめに何日ぶん出すか（「もっと見る」で増やす） */
const HISTORY_STEP = 10;

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-11-18" → 「11月18日（水）」（今年でなければ年も付ける） */
function dateText(key) {
  const [y, m, d] = key.split("-").map(Number);
  const w = WEEK[new Date(y, m - 1, d).getDay()];
  return `${y === new Date().getFullYear() ? "" : `${y}年`}${m}月${d}日（${w}）`;
}

/** 割合（0〜100 の整数）。全体が 0 のときは 0 */
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/** 期間 { from, to, label }（from・to は "2026-11-18" の形。両方ふくむ） */
function periodOf(span) {
  const t = new Date();
  const today = new Date(t.getFullYear(), t.getMonth(), t.getDate());
  if (span === "day") return { from: dayKey(today), to: dayKey(today), label: dateText(dayKey(today)) };
  if (span === "week") {   // 月曜日から日曜日まで
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: dayKey(monday), to: dayKey(sunday), label: `${dateText(dayKey(monday))} 〜 ${dateText(dayKey(sunday))}` };
  }
  if (span === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: dayKey(first), to: dayKey(last), label: `${first.getFullYear()}年${first.getMonth() + 1}月` };
  }
  return { from: "0000-01-01", to: "9999-12-31", label: "今までのすべて" };
}

/** 記録をまとめて読む（ゲストなら null） */
function readRecords(span) {
  const period = periodOf(span);
  const usage = getUsage(period.from, period.to);
  if (!usage) return null;
  const allUsage = getUsage("0000-01-01", "9999-12-31");   // 「最後に使った日」用（期間に関係なく）
  const logins = getLoginDays() ?? { days: [], total: 0, streak: 0, best: 0 };

  /** アプリを最後に使った日（使っていなければ null） */
  const lastUsed = (id) => Object.keys(allUsage.byDay).filter((k) => (allUsage.byDay[k].apps[id] ?? 0) > 0).sort().at(-1) ?? null;
  return {
    period, usage, lastUsed,
    loginDays: logins.days.filter((d) => d >= period.from && d <= period.to).length,
    streak: logins.streak,
    best: logins.best,
    stats: getAllStats(),
  };
}

export default function Records({ onOpenPage }) {
  const [current, setCurrent] = useState("all");   // "all" か アプリの id
  const [span, setSpan] = useState("week");
  const [, setTick] = useState(0);

  // 記録が増えた・変わったら描き直す
  useEffect(() => {
    const redraw = () => setTick((n) => n + 1);
    const offs = [onUsageChange(redraw), onStatsChange(redraw), onLoginsChange(redraw)];
    return () => offs.forEach((off) => off());
  }, []);

  const rec = readRecords(span);
  const app = APPS.find((p) => p.id === current);

  const items = [
    { id: "all", name: "すべて", icon: "records", badge: rec ? timeText(rec.usage.total) : undefined },
    ...APPS.map((p) => ({ id: p.id, name: p.name, icon: p.icon, badge: rec ? timeText(rec.usage.apps[p.id] ?? 0) : undefined })),
  ];

  return (
    <SettingsLayout
      head={
        <div className="rec-head">
          <span className="rec-head-icon"><Icon name="records" /></span>
          <div className="rec-head-text">
            <strong>記録</strong>
            <span>{rec ? `${SPANS.find((s) => s.id === span).name}：${timeText(rec.usage.total)}` : "ゲストのときは記録しません"}</span>
          </div>
        </div>
      }
      items={items}
      current={current}
      onSelect={setCurrent}
      title={app ? `${app.name}の記録` : "すべての記録"}
      desc={app ? `${app.name}を使った時間と、学習の記録です。` : "合計の時間と、各アプリの記録です。"}
    >
      {/* 期間の切りかえ */}
      <div className="panel rec-bar">
        <div className="rec-seg" role="tablist" aria-label="期間">
          {SPANS.map((s) => (
            <button key={s.id} type="button" role="tab" aria-selected={span === s.id} className={span === s.id ? "is-on" : ""} onClick={() => setSpan(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
        <span className="rec-range">{periodOf(span).label}</span>
      </div>

      {!rec ? (
        <div className="panel rec-empty">
          <Icon name="account" />
          <p>ゲストで使っているときは、記録をとっていません。<br />ログインすると、使った時間や学習の記録が見られるようになります。</p>
        </div>
      ) : app ? (
        <AppView app={app} rec={rec} span={span} onOpenPage={onOpenPage} />
      ) : (
        <AllView rec={rec} span={span} onSelect={setCurrent} />
      )}
    </SettingsLayout>
  );
}

// ───────── すべて ─────────
function AllView({ rec, span, onSelect }) {
  const { usage } = rec;
  const apps = APPS.map((p) => ({ ...p, color: colorOf(p.id), sec: usage.apps[p.id] ?? 0 }));

  return (
    <>
      <div className="rec-cards">
        <Card icon="timer" label="勉強した時間" value={timeText(usage.total)} sub={`${usage.days} 日 使った`} main />
        <Card icon="records" label="1 日の平均" value={timeText(usage.days ? usage.total / usage.days : 0)} sub="使った日だけで計算" />
        <Card icon="check" label="ログインした日" value={`${rec.loginDays} 日`} sub={`連続 ${rec.streak} 日・最高 ${rec.best} 日`} />
      </div>

      {/* アプリごとの時間：左に円グラフ、右に一覧（押すとそのアプリの記録へ） */}
      <Section title="アプリごとの時間" note={usage.total ? "押すと、そのアプリの記録を開きます" : ""}>
        <div className="rec-split">
          <Donut
            size={176}
            total={usage.total}
            parts={apps.map((a) => ({ value: a.sec, color: a.color, label: `${a.name}：${timeText(a.sec)}（${percent(a.sec, usage.total)}%）` }))}
            label={`合計 ${timeText(usage.total)}`}
          >
            <small>合計</small>
            <strong>{timeText(usage.total)}</strong>
          </Donut>
          <ul className="rec-apps">
            {apps.map((a) => {
              const last = rec.lastUsed(a.id);
              return (
                <li key={a.id}>
                  <button type="button" className={`rec-app${a.sec ? "" : " is-zero"}`} onClick={() => onSelect(a.id)} style={{ "--app": a.color }}>
                    <i className="rec-dot" />
                    <span className="rec-app-icon"><Icon name={a.icon} /></span>
                    <span className="rec-app-main">
                      <b>{a.name}</b>
                      <small>{last ? `最後に使った日：${dateText(last)}` : "まだ使っていません"}</small>
                    </span>
                    <span className="rec-app-time">{a.sec ? timeText(a.sec) : "—"}<small>{percent(a.sec, usage.total)}%</small></span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </Section>

      {/* 棒グラフ：今日 → 時間ごと／今週 → 曜日ごと／今月 → 日ごと／すべて → 月ごと */}
      <Section title={CHART_TITLE[span]} note={CHART_NOTE[span]}>
        <BarChart cols={columnsOf(span, usage, rec.period)} apps={apps} />
        <ul className="rec-legend">
          {apps.map((a) => <li key={a.id}><i style={{ background: a.color }} />{a.name}</li>)}
        </ul>
      </Section>

      <Section title="学習の内訳・大事な数" note="今までの合計（期間では分けられません）">
        {rec.stats.length === 0 ? (
          <Empty>内訳と大事な数のあるアプリが、まだありません。</Empty>
        ) : (
          <div className="rec-study-grid">
            {rec.stats.map((s) => (
              <div key={s.app.id} className="rec-study" style={{ "--app": colorOf(s.app.id) }}>
                <button type="button" className="rec-study-head" onClick={() => onSelect(s.app.id)}>
                  <span className="rec-app-icon"><Icon name={s.app.icon} /></span>
                  <b>{s.app.name}</b>
                </button>
                <StudyBody stats={s} small />
              </div>
            ))}
          </div>
        )}
      </Section>

      <History byDay={usage.byDay} />
    </>
  );
}

/** 棒グラフの見出し（期間ごと） */
const CHART_TITLE = { day: "時間ごと", week: "曜日ごと", month: "日ごと", all: "月ごと" };
const CHART_NOTE = { day: "今日、何時ごろに使ったか", week: "今週（月〜日）の毎日", month: "今月の毎日", all: "最近の 12 か月" };

// ───────── 各アプリ ─────────
function AppView({ app, rec, span, onOpenPage }) {
  const { usage } = rec;
  const color = colorOf(app.id);
  const sec = usage.apps[app.id] ?? 0;
  const days = Object.values(usage.byDay).filter((d) => (d.apps[app.id] ?? 0) > 0).length;
  const last = rec.lastUsed(app.id);
  const stats = rec.stats.find((s) => s.app.id === app.id);

  // そのアプリの分だけの日ごとの記録
  const byDay = {};
  for (const [key, d] of Object.entries(usage.byDay)) {
    const s = d.apps[app.id] ?? 0;
    if (s > 0) byDay[key] = { total: s, apps: { [app.id]: s } };
  }

  return (
    <>
      <div className="rec-cards is-app" style={{ "--app": color }}>
        <Card icon={app.icon} label="使った時間" value={timeText(sec)} sub={`全体の ${percent(sec, usage.total)}%`} main />
        <Card icon="records" label="1 日の平均" value={timeText(days ? sec / days : 0)} sub={`${days} 日 使った`} />
        <Card icon="check" label="最後に使った日" value={last ? dateText(last) : "—"} sub={last ? "" : "まだ使っていません"} small />
      </div>

      {/* 学習の内訳・大事な数（横いっぱい）：左に内訳の円グラフと一覧、右に大事な数 */}
      <Section title="学習の内訳・大事な数" note="今までの合計（期間では分けられません）">
        {stats ? (
          <div className="rec-study-wide" style={{ "--app": color }}>
            {stats.time.length > 0 && <StudyDonut stats={stats} />}
            {stats.stats.length > 0 && <Nums stats={stats.stats} />}
          </div>
        ) : (
          <Empty>このアプリには、まだ内訳と大事な数がありません。</Empty>
        )}
      </Section>

      <Section title={CHART_TITLE[span]} note={CHART_NOTE[span]}>
        <BarChart cols={columnsOf(span, usage, rec.period)} apps={[{ id: app.id, name: app.name, color }]} />
      </Section>

      <History byDay={byDay} one={app.id} />

      {onOpenPage && (
        <button type="button" className="rec-open" onClick={() => onOpenPage(app.id)}>
          <Icon name={app.icon} />{app.name}を開く
        </button>
      )}
    </>
  );
}

// ───────── 部品 ─────────
/** 数字のカード（main を付けると、色つきで大きく出す） */
function Card({ icon, label, value, sub, main, small }) {
  return (
    <div className={`panel rec-card${main ? " is-main" : ""}`}>
      <span className="rec-card-label"><Icon name={icon} />{label}</span>
      <strong className={small ? "is-small" : ""}>{value}</strong>
      {sub && <small>{sub}</small>}
    </div>
  );
}

/** 見出しつきのまとまり */
function Section({ title, note, children }) {
  return (
    <section className="panel rec-section">
      <header className="rec-section-head">
        <h2>{title}</h2>
        {note && <small>{note}</small>}
      </header>
      {children}
    </section>
  );
}

/** 何もないときの文 */
const Empty = ({ children }) => <p className="rec-none">{children}</p>;

/** 学習の内訳の色（アプリの色を、だんだんうすくする。上から順に使う。ホームと同じ） */
const SHADES = [100, 68, 44, 26, 14];
const shade = (i) => `color-mix(in srgb, var(--app) ${SHADES[i % SHADES.length]}%, var(--surface))`;

/** 学習の内訳：円グラフ ＋ 一覧（色・名前・時間・%） */
function StudyDonut({ stats, small }) {
  const sum = stats.time.reduce((n, t) => n + t.sec, 0);
  return (
    <div className={`rec-split is-study${small ? " is-small" : ""}`}>
      <Donut
        size={small ? 96 : 136}
        thick={small ? 15 : 13}
        total={sum}
        parts={stats.time.map((t, i) => ({ value: t.sec, color: shade(i), label: `${t.name}：${timeText(t.sec)}` }))}
        label={`学習時間 ${timeText(sum)}`}
      >
        {!small && <small>合計</small>}
        <strong>{sum > 0 ? timeText(sum) : "0分"}</strong>
      </Donut>
      <ul className="rec-breakdown">
        {stats.time.map((t, i) => (
          <li key={t.id}>
            <i style={{ background: shade(i) }} />
            <span>{t.name}</span>
            <b>{t.sec > 0 ? timeText(t.sec) : "—"}{sum > 0 && <small>{percent(t.sec, sum)}%</small>}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 大事な数（数字のタイル） */
function Nums({ stats }) {
  return (
    <div className="rec-nums">
      {stats.map((x) => (
        <div key={x.id} className="rec-num">
          <strong>{x.value.toLocaleString()}<small>{x.unit}</small></strong>
          <span>{x.name}</span>
        </div>
      ))}
    </div>
  );
}

/** すべての「学習の内訳・大事な数」の中身：内訳の円グラフと、大事な数 */
function StudyBody({ stats, small }) {
  return (
    <div className={`rec-study-body${small ? " is-small" : ""}`}>
      {stats.time.length > 0 && <StudyDonut stats={stats} small={small} />}
      {stats.stats.length > 0 && <Nums stats={stats.stats} />}
    </div>
  );
}

/** 日ごとの履歴（新しい日が上）。one にアプリの id を渡すと、そのアプリだけの棒にする */
function History({ byDay, one }) {
  const [shown, setShown] = useState(HISTORY_STEP);
  const keys = Object.keys(byDay).filter((k) => byDay[k].total > 0).sort().reverse();
  const top = Math.max(0, ...keys.map((k) => byDay[k].total));
  const rest = keys.length - shown;

  return (
    <Section title="日ごとの履歴" note={keys.length ? `${keys.length} 日` : ""}>
      {keys.length === 0 ? (
        <Empty>この期間は、まだ使っていません。</Empty>
      ) : (
        <>
          <ul className="rec-history">
            {keys.slice(0, shown).map((k) => {
              const d = byDay[k];
              const apps = APPS.filter((p) => (d.apps[p.id] ?? 0) > 0);
              const tip = apps.map((p) => `${p.name} ${timeText(d.apps[p.id])}`).join("\n");
              return (
                <li key={k} className={k === dayKey() ? "is-today" : ""} title={tip}>
                  <span className="rec-h-date">{dateText(k)}{k === dayKey() && <em>今日</em>}</span>
                  <span className="rec-h-bar">
                    <span className="rec-h-stack" style={{ width: `${top ? (d.total / top) * 100 : 0}%` }}>
                      {apps.map((p) => <span key={p.id} style={{ flexGrow: d.apps[p.id], background: colorOf(p.id) }} />)}
                    </span>
                  </span>
                  <b className="rec-h-time">{timeText(d.total)}</b>
                  {!one && (
                    <span className="rec-h-apps">
                      {apps.map((p) => (
                        <span key={p.id} className="rec-h-app" style={{ "--app": colorOf(p.id) }} title={`${p.name} ${timeText(d.apps[p.id])}`}>
                          <Icon name={p.icon} />{timeText(d.apps[p.id])}
                        </span>
                      ))}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
          {rest > 0 && (
            <button type="button" className="rec-more" onClick={() => setShown((n) => n + HISTORY_STEP)}>
              もっと見る（あと {rest} 日）
            </button>
          )}
        </>
      )}
    </Section>
  );
}
