// ═══════════════════════════════════════════════════════════════
//  記録：画面（見た目）　［このフォルダーの入口：main.jsx］
//  合計の時間や、アプリごとの記録を見るページ（左のサイドバーの「記録」。アチーブの上）
//  ※ アチーブは、ここには出さない（アチーブのページで見る）
//  いちばん上の段：左に「記録」と期間、右はしに期間の切りかえ（今日／今週／今月／すべて）。今週は月曜日から日曜日まで（ホームと同じ）
//  左：たてに並んだタブ（すべて ＋ 各アプリ）。押すか ↑ ↓（← →）キーで切りかえる。選んだタブはアプリの色でぬる
//  右：選んだタブの中身（せまい画面では、タブは上に横に並ぶ）
//  とても広い画面では、右はしに「がんばりポイント」を出す（RecordsAside。records.css の 1800px 以上。左のタブの幅 ＋ 左のサイドバーの幅。中身がウィンドウのまん中に来る）
//  棒グラフは、見出しの右で 日・週・月・年 を切りかえ、‹ › で前後へ（上の期間とは別に動く。UsageChart）
//  数字のカードには、前の期間とのくらべ（例：先週より ▲ 20分）を出す（Delta。すべて のときは出さない）
//    くらべるのは「同じところまで」… 今週なら 先週の月曜〜同じ曜日、今月なら 先月の 1 日〜同じ日（今日はきのう 1 日分）
//  いちばん上の段に、スタッピー（キャラクター）が記録に合わせてひとこと（Buddy・talkOf）。なでられる（Stappy → src/system/character）
//  円グラフ・棒グラフにマウスを乗せると、ふきだしで くわしい時間が出る（charts.jsx）
//  中身は画面に収まるように並べる（ダッシュボード型。入りきらない一覧だけ、枠の中でスクロール）
//    すべて   … 数字（勉強した時間・1 日の平均・ログイン日数）
//                ／ アプリごとの時間（大きな円グラフ ＋ 内訳）｜ 棒グラフ（日・週・月・年）と 日ごとの履歴
//    各アプリ … そのアプリの数字 ／ 学習の内訳（円グラフ）・大事な数 ｜ 棒グラフ ／ 日ごとの履歴
//  画面が低い・せまいときは、たてに並べて、ページ全体をスクロールする（records.css）
//
//  ★ このページでは記録を「読むだけ」です（書きかえない）。読んでいるところ
//    使った時間       … core/storage/usage.js の getUsage（日ごと・アプリごとの秒）
//    学習の内訳・大事な数 … core/storage/stats.js の getAllStats（今までの合計だけ。日付は持っていない）
//    ログイン日数     … core/storage/logins.js の getLoginDays
//  グラフ（円グラフ・棒グラフ）は charts.jsx、見た目は records.css
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import Icon from "../../core/components/Icon";
import { PAGES } from "../../core/page-list";
import { getUsage, onUsageChange } from "../../core/storage/usage.js";
import { getAllStats, onStatsChange } from "../../core/storage/stats.js";
import { getLoginDays, onLoginsChange, dayKey } from "../../core/storage/logins.js";
import { Donut, BarChart, columnsOf, chartRange, timeText } from "./charts.jsx";
import { mountCharacter } from "../../character/character.js";   // スタッピー（src/system/character）
import { unlockAchievement, addProgress } from "../../core/storage/achievements.js";
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

/** くらべる前の期間 { from, to, word }（今と同じところまで。すべて のときは null）
 *  今日 → きのう／今週 → 先週の月曜〜同じ曜日／今月 → 先月の 1 日〜同じ日（先月が短いときは月末まで） */
function prevOf(span) {
  const t = new Date();
  const back = (d) => dayKey(d);
  if (span === "day") return { from: back(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1)), to: back(new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1)), word: "きのう" };
  if (span === "week") {
    const n = (t.getDay() + 6) % 7;   // 月曜から何日目か（0〜6）
    const mon = new Date(t.getFullYear(), t.getMonth(), t.getDate() - n - 7);
    return { from: back(mon), to: back(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + n)), word: "先週" };
  }
  if (span === "month") {
    const last = new Date(t.getFullYear(), t.getMonth(), 0).getDate();   // 先月の日数
    return { from: back(new Date(t.getFullYear(), t.getMonth() - 1, 1)), to: back(new Date(t.getFullYear(), t.getMonth() - 1, Math.min(t.getDate(), last))), word: "先月" };
  }
  return null;
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
  // 前の期間（くらべる用）
  const p = prevOf(span);
  const prev = p && { ...p, usage: getUsage(p.from, p.to), loginDays: logins.days.filter((d) => d >= p.from && d <= p.to).length };
  return {
    period, usage, allUsage, lastUsed, prev,
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
  const tabsRef = useRef(null);

  // 記録が増えた・変わったら描き直す
  useEffect(() => {
    const redraw = () => setTick((n) => n + 1);
    const offs = [onUsageChange(redraw), onStatsChange(redraw), onLoginsChange(redraw)];
    return () => offs.forEach((off) => off());
  }, []);

  const rec = readRecords(span);
  const app = APPS.find((p) => p.id === current);
  const tabs = [{ id: "all", name: "すべて", icon: "records", color: "var(--primary)" }, ...APPS.map((p) => ({ ...p, color: colorOf(p.id) }))];

  /** ↑ ↓（← →）キーでタブを切りかえる（となりのタブへ。はしまで行ったら反対のはしへ） */
  const onTabKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === current);
    const next = tabs[(i + step + tabs.length) % tabs.length];
    setCurrent(next.id);
    tabsRef.current?.querySelector(`[data-tab="${next.id}"]`)?.focus();
  };

  return (
    <div className={`rec${rec ? " is-fit" : ""}`}>
      {/* いちばん上の段：左に「記録」と期間、右に期間の切りかえ（各アプリのときは「〇〇を開く」も） */}
      <header className="rec-top">
        <span className="rec-head-icon"><Icon name="records" /></span>
        <div className="rec-head-text">
          <h1>{app ? `${app.name}の記録` : "記録"}</h1>
          <span>{periodOf(span).label}</span>
        </div>
        {rec && <Buddy text={talkOf(rec, app, span)} />}
        {app && onOpenPage && (
          <button type="button" className="rec-open" style={{ "--app": colorOf(app.id) }} onClick={() => onOpenPage(app.id)}>
            <Icon name={app.icon} />{app.name}を開く
          </button>
        )}
        <div className="rec-seg" role="group" aria-label="期間">
          {SPANS.map((s) => (
            <button key={s.id} type="button" aria-pressed={span === s.id} className={span === s.id ? "is-on" : ""} onClick={() => setSpan(s.id)}>
              {s.name}
            </button>
          ))}
        </div>
      </header>

      {/* 左にタブ、右に中身 */}
      <div className="rec-main">
        {/* タブ（たてに並べる）：すべて ＋ 各アプリ。右に、その期間の時間 */}
        <nav className="rec-tabs" role="tablist" aria-orientation="vertical" aria-label="記録の種類" ref={tabsRef} onKeyDown={onTabKey}>
          {tabs.map((t) => {
            const on = current === t.id;
            const sec = rec ? (t.id === "all" ? rec.usage.total : rec.usage.apps[t.id] ?? 0) : null;
            return (
              <button
                key={t.id} type="button" role="tab" data-tab={t.id}
                aria-selected={on} tabIndex={on ? 0 : -1}
                className={`rec-tab${on ? " is-on" : ""}`} style={{ "--app": t.color }}
                onClick={() => setCurrent(t.id)}
              >
                <Icon name={t.icon} />
                <span className="rec-tab-name">{t.name}</span>
                {sec != null && <span className="rec-tab-time">{timeText(sec)}</span>}
              </button>
            );
          })}
        </nav>

        {!rec ? (
          <div className="panel rec-empty">
            <Icon name="account" />
            <p>ゲストで使っているときは、記録をとっていません。<br />ログインすると、使った時間や学習の記録が見られるようになります。</p>
          </div>
        ) : (
          /* key … タブ・期間を切りかえるたびに作り直して、ふわっと出す */
          <div className="rec-body" key={`${current}-${span}`}>
            {app ? <AppView app={app} rec={rec} span={span} /> : <AllView rec={rec} span={span} onSelect={setCurrent} />}
          </div>
        )}
        {rec && <RecordsAside key={`aside-${current}-${span}`} rec={rec} app={app} span={span} />}
      </div>
    </div>
  );
}

// ───────── すべて ─────────
//  [数字 3 つ]
//  [アプリごとの時間          ][棒グラフ    ]
//  [（大きな円グラフ ＋ 内訳）][日ごとの履歴]
//  ※ 学習の内訳・大事な数は、各アプリのタブだけに出す
function AllView({ rec, span, onSelect }) {
  const { usage, prev } = rec;
  const apps = APPS.map((p) => ({ ...p, color: colorOf(p.id), sec: usage.apps[p.id] ?? 0 }));

  return (
    <>
      <div className="rec-cards">
        <Card icon="timer" label="勉強した時間" value={timeText(usage.total)} sub={`${usage.days} 日 使った`} main
          delta={prev && <Delta now={usage.total} before={prev.usage.total} word={prev.word} />} />
        <Card icon="records" label="1 日の平均" value={timeText(avg(usage.total, usage.days))} sub="使った日だけで計算"
          delta={prev && <Delta now={avg(usage.total, usage.days)} before={avg(prev.usage.total, prev.usage.days)} word={prev.word} />} />
        <Card icon="check" label="ログインした日" value={`${rec.loginDays} 日`} sub={`連続 ${rec.streak} 日・最高 ${rec.best} 日`}
          delta={prev && <Delta now={rec.loginDays} before={prev.loginDays} word={prev.word} unit="day" />} />
      </div>

      <div className="rec-row is-all">
        {/* アプリごとの時間（左。上下 2 段ぶんの高さ）：上に大きな円グラフ、その下にアプリごとの内訳（押すとそのアプリのタブへ） */}
        <Section title="アプリごとの時間" note={usage.total ? "押すと、そのアプリのタブへ" : ""} className="is-apps">
          <div className="rec-apps-tall">
            <Donut
              size="fluid"
              total={usage.total}
              parts={apps.map((a) => ({ value: a.sec, color: a.color, name: a.name, label: `${a.name}：${timeText(a.sec)}（${percent(a.sec, usage.total)}%）` }))}
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
                    <button type="button" className={`rec-app${a.sec ? "" : " is-zero"}`} onClick={() => onSelect(a.id)} style={{ "--app": a.color }}
                      title={last ? `最後に使った日：${dateText(last)}` : "まだ使っていません"}>
                      <i className="rec-dot" />
                      <span className="rec-app-icon"><Icon name={a.icon} /></span>
                      <b className="rec-app-name">{a.name}</b>
                      <span className="rec-app-time">{a.sec ? timeText(a.sec) : "—"}<small>{percent(a.sec, usage.total)}%</small></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>

        {/* 右の上：棒グラフ（日・週・月・年）、右の下：日ごとの履歴 */}
        <UsageChart start={span} apps={apps} />
        <History byDay={usage.byDay} />
      </div>
    </>
  );
}

// ───────── 棒グラフ（日・週・月・年で切りかえ、‹ › で前後へ。上の期間の切りかえとは別に動く） ─────────
const CHART_SPANS = [
  { id: "day", name: "日", title: "時間ごと", now: "今日" },
  { id: "week", name: "週", title: "曜日ごと", now: "今週" },
  { id: "month", name: "月", title: "日ごと", now: "今月" },
  { id: "year", name: "年", title: "月ごと", now: "今年" },
];
/** はじめに出す長さ（上の期間に合わせる。すべて → 年） */
const START_CHART = { day: "day", week: "week", month: "month", all: "year" };

/** start … 上の期間（day／week／month／all）、apps … 積むアプリ [{ id, name, color }] */
function UsageChart({ start, apps, legend }) {
  const [cspan, setCspan] = useState(START_CHART[start] ?? "week");
  const [shift, setShift] = useState(0);   // 0 ＝ 今、-1 ＝ 1 つ前 …
  const info = CHART_SPANS.find((c) => c.id === cspan);
  const range = chartRange(cspan, shift);
  const usage = getUsage(range.from, range.to) ?? { byDay: {}, byHour: Array.from({ length: 24 }, () => ({ total: 0, apps: {} })) };
  const choose = (id) => { setCspan(id); setShift(0); };

  return (
    <Section
      title={info.title}
      className="is-chart"
      tools={
        <>
          <span className="rec-nav">
            <button type="button" className="rec-nav-btn" onClick={() => setShift((n) => n - 1)} aria-label="前へ" title="前へ">‹</button>
            <span className="rec-nav-label">{range.label}</span>
            <button type="button" className="rec-nav-btn" onClick={() => setShift((n) => Math.min(0, n + 1))} disabled={shift >= 0} aria-label="次へ" title="次へ">›</button>
            {shift < 0 && <button type="button" className="rec-nav-now" onClick={() => setShift(0)}>{info.now}</button>}
          </span>
          <span className="rec-seg is-small" role="group" aria-label="グラフの長さ">
            {CHART_SPANS.map((c) => (
              <button key={c.id} type="button" aria-pressed={cspan === c.id} className={cspan === c.id ? "is-on" : ""} onClick={() => choose(c.id)}>{c.name}</button>
            ))}
          </span>
        </>
      }
    >
      <BarChart cols={columnsOf(cspan, usage, range)} apps={apps} legend={legend} />
    </Section>
  );
}

// ───────── 各アプリ ─────────
//  [数字 3 つ]
//  [総時間（円グラフ）][学習の内訳・大事な数][日ごとの履歴]
//  [棒グラフ（横いっぱい）                              ]
function AppView({ app, rec, span }) {
  const { usage } = rec;
  const color = colorOf(app.id);
  const sec = usage.apps[app.id] ?? 0;
  const days = Object.values(usage.byDay).filter((d) => (d.apps[app.id] ?? 0) > 0).length;
  const last = rec.lastUsed(app.id);
  const stats = rec.stats.find((s) => s.app.id === app.id);

  // 前の期間のこのアプリ（くらべる用）
  const prev = rec.prev;
  const prevSec = prev ? prev.usage.apps[app.id] ?? 0 : 0;
  const prevDays = prev ? Object.values(prev.usage.byDay).filter((d) => (d.apps[app.id] ?? 0) > 0).length : 0;

  // そのアプリの分だけの日ごとの記録
  const byDay = {};
  for (const [key, d] of Object.entries(usage.byDay)) {
    const s = d.apps[app.id] ?? 0;
    if (s > 0) byDay[key] = { total: s, apps: { [app.id]: s } };
  }

  return (
    <>
      <div className="rec-cards is-app" style={{ "--app": color }}>
        <Card icon={app.icon} label="使った時間" value={timeText(sec)} sub={`全体の ${percent(sec, usage.total)}%`} main
          delta={prev && <Delta now={sec} before={prevSec} word={prev.word} />} />
        <Card icon="records" label="1 日の平均" value={timeText(avg(sec, days))} sub={`${days} 日 使った`}
          delta={prev && <Delta now={avg(sec, days)} before={avg(prevSec, prevDays)} word={prev.word} />} />
        <Card icon="check" label="最後に使った日" value={last ? dateText(last) : "—"} sub={last ? "期間に関係なく" : "まだ使っていません"} />
      </div>

      <div className="rec-row is-three" style={{ "--app": color }}>
        <TotalCard app={app} color={color} allUsage={rec.allUsage} />

        {/* 学習の内訳・大事な数：左に内訳の円グラフ、右に一覧と大事な数 */}
        <Section title="学習の内訳・大事な数" note="今までの合計" className="is-scroll is-study-one">
          {stats ? (
            <div className="rec-study-body">
              {stats.time.length > 0 && <StudyDonut stats={stats} />}
              {stats.stats.length > 0 && <Nums stats={stats.stats} />}
            </div>
          ) : (
            <Empty>このアプリには、まだ内訳と大事な数がありません。</Empty>
          )}
        </Section>

        <History byDay={byDay} one={app.id} />
      </div>

      <div className="rec-row is-one" style={{ "--app": color }}>
        <UsageChart start={span} apps={[{ id: app.id, name: app.name, color }]} legend={false} />
      </div>
    </>
  );
}

/** 総時間（期間に関係なく、今までにそのアプリを使った時間の合計）
 *  円グラフ … 全部のアプリの合計のうち、このアプリが何 % か（アプリの色）。まん中に総時間
 *  下に、使った日数と、はじめて使った日 */
function TotalCard({ app, color, allUsage }) {
  const total = allUsage.apps[app.id] ?? 0;
  const days = Object.keys(allUsage.byDay).filter((k) => (allUsage.byDay[k].apps[app.id] ?? 0) > 0).sort();
  return (
    <Section title="総時間" note="今までの合計" className="is-total">
      <div className="rec-total">
        <Donut
          size="fluid"
          thick={12}
          total={allUsage.total}
          parts={[{ value: total, color, name: app.name, label: `${app.name}：${timeText(total)}（全体の ${percent(total, allUsage.total)}%）` }]}
          label={`${app.name}の総時間 ${timeText(total)}`}
        >
          <small>総時間</small>
          <strong>{timeText(total)}</strong>
          <small className="rec-total-pct">全体の {percent(total, allUsage.total)}%</small>
        </Donut>
        <ul className="rec-total-info">
          <li><span>使った日</span><b>{days.length} 日</b></li>
          <li><span>はじめて使った日</span><b>{days.length ? dateText(days[0]) : "—"}</b></li>
        </ul>
      </div>
    </Section>
  );
}

// ───────── 右はしの「がんばりポイント」（とても広い画面のときだけ出る） ─────────
function RecordsAside({ rec, app, span }) {
  const word = SPAN_WORD[span];
  const sec = (d) => (app ? d.apps[app.id] ?? 0 : d.total);
  const days = Object.entries(rec.usage.byDay).filter(([, d]) => sec(d) > 0);
  const best = days.reduce((a, b) => (sec(b[1]) > sec(a[1]) ? b : a), days[0]);
  const total = app ? rec.usage.apps[app.id] ?? 0 : rec.usage.total;
  const top = APPS.reduce((a, p) => ((rec.usage.apps[p.id] ?? 0) > (rec.usage.apps[a.id] ?? 0) ? p : a), APPS[0]);
  const rows = [
    { icon: "records", name: "いちばんがんばった日", value: best ? `${dateText(best[0])} ${timeText(sec(best[1]))}` : "—" },
    app
      ? { icon: app.icon, name: `${word}の全体のうち`, value: `${percent(total, rec.usage.total)}%` }
      : { icon: top.icon, name: "いちばん使ったアプリ", value: rec.usage.total ? top.name : "—" },
    { icon: "timer", name: "使った日", value: `${days.length} 日` },
    { icon: "check", name: "連続ログイン", value: `${rec.streak} 日（最高 ${rec.best} 日）` },
  ];
  return (
    <aside className="rec-aside" aria-label="がんばりポイント" style={{ "--app": app ? colorOf(app.id) : "var(--primary)" }}>
      <section className="panel rec-aside-card">
        <h2 className="rec-aside-title"><Icon name="trophy" />がんばりポイント</h2>
        <ul className="rec-aside-list">
          {rows.map((r) => (
            <li key={r.name}><Icon name={r.icon} /><span><small>{r.name}</small><b>{r.value}</b></span></li>
          ))}
        </ul>
      </section>
      <AsideStappy />
    </aside>
  );
}

// ───────── 部品 ─────────
/** 1 日の平均（秒）。使った日が 0 なら 0 */
const avg = (sec, days) => (days ? sec / days : 0);

/** 数字のカード（main を付けると、色つきで目立たせる）：左にアイコン、まん中に名前・数字・ひとこと、右上に前とのくらべ */
function Card({ icon, label, value, sub, main, delta }) {
  return (
    <div className={`panel rec-card${main ? " is-main" : ""}`}>
      <span className="rec-card-icon"><Icon name={icon} /></span>
      <span className="rec-card-text">
        <span className="rec-card-label">{label}</span>
        <strong>{value}</strong>
        {sub && <small>{sub}</small>}
      </span>
      {delta}
    </div>
  );
}

/** 前の期間とのくらべ（▲ ふえた・▼ へった・＝ 同じ）。unit … "time"（時間）／"day"（日数） */
function Delta({ now, before, word, unit = "time" }) {
  const diff = Math.round(now) - Math.round(before);
  const text = (n) => (unit === "day" ? `${n} 日` : timeText(n));
  const same = unit === "day" ? diff === 0 : Math.abs(diff) < 60;   // 時間は 1 分より小さい差は「同じ」
  const kind = same ? "same" : diff > 0 ? "up" : "down";
  return (
    <span className={`rec-delta is-${kind}`} title={`${word}の同じところまでとくらべています（${word}：${text(Math.max(0, before))}）`}>
      <small>{word}より</small>
      <b>{kind === "same" ? "＝ 同じ" : `${kind === "up" ? "▲" : "▼"} ${text(Math.abs(diff))}`}</b>
    </span>
  );
}

/** スタッピー（キャラクター）のひとこと（いちばん上の段。せまいときは隠す） */
function Buddy({ text }) {
  const [said, setSaid] = useState(null);   // なでたときなどに、スタッピーが言った言葉（null ＝ いつもの言葉）
  const shown = said ?? text;
  return (
    <div className="rec-buddy">
      <Stappy className="rec-buddy-chara" pose="main" motion="sway" onSay={setSaid} onRestore={() => setSaid(null)} />
      <p className="rec-buddy-bubble" title={shown} key={shown}><span>{shown}</span></p>
    </div>
  );
}

/** がんばりポイントの下のスタッピー（跳ねる姿）。なでると上に小さなふきだしが出る */
function AsideStappy() {
  const [said, setSaid] = useState(null);
  return (
    <div className="rec-aside-chara">
      <p className={`rec-aside-say${said ? " is-on" : ""}`} key={said ?? ""}>{said ?? ""}</p>
      <Stappy className="rec-aside-stappy" pose="jump" motion="hop" shadow onSay={setSaid} onRestore={() => setSaid(null)} />
    </div>
  );
}

/** スタッピー（src/system/character/character.js の mountCharacter を React で使う）
 *  なでるとホームのアチーブ（なかよし・大のなかよし）も進む */
function Stappy({ className, pose, motion, shadow = false, onSay, onRestore }) {
  const ref = useRef(null);
  const cb = useRef({});
  cb.current = { onSay, onRestore };   // いつも新しい関数を使う（作り直さずにすむように）
  useEffect(() => {
    const stappy = mountCharacter(ref.current, {
      pose, motion, shadow,
      onSay: (t) => cb.current.onSay?.(t),
      onRestore: () => cb.current.onRestore?.(),
      onPet: () => { unlockAchievement("home", "pet-1"); addProgress("home", "pet-100"); },
    });
    return () => stappy.destroy();
  }, [pose, motion, shadow]);
  return <span ref={ref} className={className} />;
}

/** スタッピーが話すことば（記録に合わせて変わる） */
const SPAN_WORD = { day: "今日", week: "今週", month: "今月", all: "今まで" };
function talkOf(rec, app, span) {
  const word = SPAN_WORD[span];
  const prev = rec.prev;
  if (app) {
    const sec = rec.usage.apps[app.id] ?? 0;
    const before = prev ? prev.usage.apps[app.id] ?? 0 : 0;
    if (sec <= 0) return `${word}はまだ${app.name}を使っていないよ。のぞいてみよう！`;
    if (prev && sec - before >= 60) return `${app.name}を${prev.word}より ${timeText(sec - before)} 多く使ったよ。すごい！`;
    return `${word}は${app.name}を ${timeText(sec)} 使ったね。その調子！`;
  }
  const total = rec.usage.total;
  if (total <= 0) return `${word}はまだ記録がないよ。アプリを開いて、いっしょに学ぼう！`;
  if (prev && total - prev.usage.total >= 60) return `${prev.word}より ${timeText(total - prev.usage.total)} 多く学んだね。すごい！`;
  if (rec.streak >= 3) return `${rec.streak} 日連続でログイン中！ この調子でいこう！`;
  const top = APPS.reduce((a, p) => ((rec.usage.apps[p.id] ?? 0) > (rec.usage.apps[a.id] ?? 0) ? p : a), APPS[0]);
  return `${word}は${top.name}をいちばんがんばったね！`;
}

/** 見出しつきのまとまり（中身は .rec-section-body。画面に収めるときは、この中だけスクロールする）
 *  tools … 見出しの右はしに出すもの（棒グラフの切りかえなど） */
function Section({ title, note, tools, className = "", children }) {
  return (
    <section className={`panel rec-section ${className}`}>
      <header className="rec-section-head">
        <h2>{title}</h2>
        {note && <small>{note}</small>}
        {tools && <div className="rec-section-tools">{tools}</div>}
      </header>
      <div className="rec-section-body">{children}</div>
    </section>
  );
}

/** 何もないときの文 */
const Empty = ({ children }) => <p className="rec-none">{children}</p>;

/** 学習の内訳の色（アプリの色を、だんだんうすくする。上から順に使う。ホームと同じ） */
const SHADES = [100, 68, 44, 26, 14];
const shade = (i) => `color-mix(in srgb, var(--app) ${SHADES[i % SHADES.length]}%, var(--surface))`;

/** 学習の内訳：円グラフ ＋ 一覧（色・名前・時間・%） */
function StudyDonut({ stats }) {
  const sum = stats.time.reduce((n, t) => n + t.sec, 0);
  return (
    <div className="rec-split is-study">
      <Donut
        size={132}
        total={sum}
        parts={stats.time.map((t, i) => ({ value: t.sec, color: shade(i), name: t.name, label: `${t.name}：${timeText(t.sec)}` }))}
        label={`学習時間 ${timeText(sum)}`}
      >
        <small>合計</small>
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

/** 日ごとの履歴（新しい日が上）。one にアプリの id を渡すと、そのアプリだけの棒にする */
function History({ byDay, one }) {
  const [shown, setShown] = useState(HISTORY_STEP);
  const keys = Object.keys(byDay).filter((k) => byDay[k].total > 0).sort().reverse();
  const top = Math.max(0, ...keys.map((k) => byDay[k].total));
  const rest = keys.length - shown;

  return (
    <Section title="日ごとの履歴" note={keys.length ? `${keys.length} 日` : ""} className="is-scroll">
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
