// ═══════════════════════════════════════════════════════════════
//  記録：画面（見た目）　［このフォルダーの入口：main.jsx］
//  合計の時間や、アプリごとの記録を見るページ（左のサイドバーの「記録」。アチーブの上）
//  ※ アチーブは、ここには出さない（アチーブのページで見る）
//  いちばん上のバー（PageBar）：「記録 › 今のタブ」、右はしにダーク／ホワイトの切り替え
//  見出しの右に、期間の切りかえ（今日／今週／今月／すべて）。今週は月曜日から日曜日まで（ホームと同じ）
//    切りかえても画面は作り直さない … 数字はカウントするように（Tween）、円グラフ・棒グラフはのび縮みして変わる
//  左：たてに並んだタブ（すべて ＋ 各アプリ）。押すか ↑ ↓（← →）キーで切りかえる。選んだタブはアプリの色でぬる
//  右：選んだタブの中身（せまい画面では、タブは上に横に並ぶ）
//  とても広い画面では、右はしに「がんばりポイント」を出す（RecordsAside。records.css の 1760px 以上。左のタブの幅 ＋ 左のサイドバーの幅。中身がウィンドウのまん中に来る）
//    その下に「最近手に入れたアチーブ」（期間に関係なく新しい順に 4 つ。各アプリのタブでは、そのアプリのアチーブだけ）
//  各アプリのタブでは「〇〇を開く」ボタン（押すとそのアプリへ。OpenButton）
//    おまけが出る広い画面 … おまけの列のいちばん下（画面の右下）／ それより せまい画面 … 左のタブの下（画面の左下）
//  棒グラフは、上の期間に合わせる（今日 → 時間ごと／今週 → 曜日ごと／今月 → 日ごと／すべて → 月ごと）。‹ › で前後へ（UsageChart）
//  数字のカードには、前の期間とのくらべ（例：先週より ▲ 20分）を出す（Delta。すべて のときは出さない）
//    くらべるのは「同じところまで」… 今週なら 先週の月曜〜同じ曜日、今月なら 先月の 1 日〜同じ日（今日はきのう 1 日分）
//  ※ キャラクター（スタッピー）は、あとで追加する予定（今は出していない）
//  円グラフ・棒グラフにマウスを乗せると、ふきだしで くわしい時間が出る（charts.jsx）
//  中身のいちばん上に、アチーブ・設定と同じ形の見出し（「すべての記録」「プログラム学習の記録」＋ 説明。Title）
//  中身は画面に収まるように並べる（ダッシュボード型。入りきらない一覧だけ、枠の中でスクロール）
//    すべて   … 左：数字のまとめ（勉強した時間・1 日の平均・ログイン日数）／ アプリごとの時間（大きな円グラフ ＋ 内訳）
//                右：棒グラフ（日・週・月・年）／ 日ごとの履歴
//    各アプリ … 左：そのアプリの数字のまとめ ／ 総時間（棒グラフに出ている期間の合計）　　右：棒グラフ ／ 日ごとの履歴（すべて と同じ並び）
//  画面が低い・せまいときは、たてに並べて、ページ全体をスクロールする（records.css）
//
//  ★ このページでは記録を「読むだけ」です（書きかえない）。読んでいるところ
//    使った時間       … core/storage/usage.js の getUsage（日ごと・アプリごとの秒）
//    ログイン日数     … core/storage/logins.js の getLoginDays
//  グラフ（円グラフ・棒グラフ）は charts.jsx、見た目は records.css
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from "react";
import Icon from "../../core/components/Icon";
import PageBar from "../../core/components/PageBar";
import { PAGES } from "../../core/page-list";
import { getUsage, onUsageChange } from "../../core/storage/usage.js";
import { getLoginDays, onLoginsChange, dayKey } from "../../core/storage/logins.js";
import { getUnlocked, onAchievementsChange } from "../../core/storage/achievements.js";
import { ALL as ALL_ACHIEVEMENTS } from "../achievements/achievement-list.js";   // アチーブの一覧（名前・レア度・アプリ）
import { Donut, BarChart, columnsOf, chartRange, timeText } from "./charts.jsx";
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

/** 期間の切りかえ（見出しの右） */
const SPANS = [
  { id: "day", name: "今日" },
  { id: "week", name: "今週" },
  { id: "month", name: "今月" },
  { id: "all", name: "すべて" },
];

/** 日ごとの履歴を、はじめに何日ぶん出すか（「もっと見る」で増やす） */
const HISTORY_STEP = 10;

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** "2026-11-17" → "11月17日"（曜日なし。数字のまとめのせまいところ用） */
function shortDate(key) {
  const [, m, d] = key.split("-").map(Number);
  return `${m}月${d}日`;
}

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
    const offs = [onUsageChange(redraw), onLoginsChange(redraw), onAchievementsChange(redraw)];
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
      {/* いちばん上のバー：「記録 › 今のタブ」、右はしにダーク／ホワイトの切り替え（core/components/PageBar.jsx） */}
      <PageBar icon="records" page="記録" item={app ? app.name : "すべて"} />

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
                {sec != null && <span className="rec-tab-time"><Tween value={sec} format={timeText} /></span>}
              </button>
            );
          })}
        </nav>

        {/* 各アプリのタブのとき：左のタブの下（画面の左下）に、そのアプリを開くボタン
            （おまけが出る広い画面では、こちらは隠して、おまけの列のいちばん下に出す。records.css） */}
        <OpenButton app={app} onOpenPage={onOpenPage} />

        {!rec ? (
          <div className="panel rec-empty">
            <Icon name="account" />
            <p>ゲストで使っているときは、記録をとっていません。<br />ログインすると、使った時間や学習の記録が見られるようになります。</p>
          </div>
        ) : (
          /* key … タブを切りかえるたびに作り直して、ふわっと出す（期間の切りかえでは作り直さない。数字・グラフがなめらかに変わる） */
          <div className="rec-body" key={current}>
            <Title app={app} span={span} onSpan={setSpan} />
            {app ? <AppView app={app} rec={rec} span={span} /> : <AllView rec={rec} span={span} onSelect={setCurrent} />}
          </div>
        )}
        {rec && <RecordsAside key={`aside-${current}`} rec={rec} app={app} span={span} onOpenPage={onOpenPage} />}
      </div>
    </div>
  );
}

// ───────── 見出し（アチーブ・設定・アカウントの「すべてのアチーブ」などと同じ形） ─────────
//  左：大きな文字（例：「すべての記録」）の下に、ページの説明　　右：期間の切りかえ（今日／今週／今月／すべて）
function Title({ app, span, onSpan }) {
  return (
    <header className="rec-title">
      <div className="rec-title-text">
        <h1>{app ? `${app.name}の記録` : "すべての記録"}</h1>
        <p>{app ? `${app.name}で学習した時間の記録です。` : "各アプリで学習した時間や、ログインした日の記録です。"}</p>
      </div>
      <div className="rec-seg" role="group" aria-label="期間">
        {SPANS.map((s) => (
          <button key={s.id} type="button" aria-pressed={span === s.id} className={span === s.id ? "is-on" : ""} onClick={() => onSpan(s.id)}>
            {s.name}
          </button>
        ))}
      </div>
    </header>
  );
}

// ───────── すべて ─────────
//  [すべて（数字 3 つ）       ][棒グラフ    ]
//  [アプリごとの時間          ][            ]
//  [（大きな円グラフ ＋ 内訳）][日ごとの履歴]
function AllView({ rec, span, onSelect }) {
  const { usage, prev } = rec;
  const [shift, setShift] = useChartShift(span);   // 棒グラフで、いくつ前を見ているか
  const apps = APPS.map((p) => ({ ...p, color: colorOf(p.id), sec: usage.apps[p.id] ?? 0 }));

  return (
    <>
      <div className="rec-row is-all">
        {/* 左の列（上下 2 段ぶんの高さ）：上に数字のまとめ、その下にアプリごとの時間 */}
        <div className="rec-stack">
        {/* 数字のまとめ（見出しは「すべて」） */}
        <Summary title="すべて" span={span} prev={prev} items={[
          { icon: "timer", label: "勉強した時間", value: timeText(usage.total), num: usage.total, fmt: timeText, sub: `${usage.days} 日 使った`,
            delta: prev && <Delta now={usage.total} before={prev.usage.total} word={prev.word} /> },
          { icon: "records", label: "1 日の平均", value: timeText(avg(usage.total, usage.days)), num: avg(usage.total, usage.days), fmt: timeText, sub: "使った日だけで計算",
            delta: prev && <Delta now={avg(usage.total, usage.days)} before={avg(prev.usage.total, prev.usage.days)} word={prev.word} /> },
          { icon: "check", label: "ログインした日", value: `${rec.loginDays} 日`, num: rec.loginDays, fmt: dayCount, sub: `連続 ${rec.streak} 日・最高 ${rec.best} 日`,
            delta: prev && <Delta now={rec.loginDays} before={prev.loginDays} word={prev.word} unit="day" /> },
        ]} />

        {/* アプリごとの時間：上に大きな円グラフ、その下にアプリごとの内訳（押すとそのアプリのタブへ） */}
        <Section title="アプリごとの時間" note={usage.total ? "押すと、そのアプリのタブへ" : ""} className="is-apps">
          <div className="rec-apps-tall">
            <Donut
              size="fluid"
              total={usage.total}
              parts={apps.map((a) => ({ value: a.sec, color: a.color, name: a.name, label: `${a.name}：${timeText(a.sec)}（${percent(a.sec, usage.total)}%）` }))}
              label={`合計 ${timeText(usage.total)}`}
            >
              <small>合計</small>
              <strong><Tween value={usage.total} format={timeText} /></strong>
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
                      <span className="rec-app-time"><Tween value={a.sec} format={timeOrDash} /><small><Tween value={percent(a.sec, usage.total)} format={pctText} /></small></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
        </div>

        {/* 右の上：棒グラフ（日・週・月・年）、右の下：日ごとの履歴 */}
        <UsageChart start={span} apps={apps} shift={shift} onShift={setShift} />
        <History byDay={usage.byDay} />
      </div>
    </>
  );
}

// ───────── 棒グラフ（上の期間に合わせた長さ。‹ › で前後へ） ─────────
//  今日 → 時間ごと（24 本）／今週 → 曜日ごと（7 本）／今月 → 日ごと／すべて → 月ごと（今年の 12 本）
const CHART_OF = {
  day: { id: "day", title: "時間ごと", now: "今日" },
  week: { id: "week", title: "曜日ごと", now: "今週" },
  month: { id: "month", title: "日ごと", now: "今月" },
  all: { id: "year", title: "月ごと", now: "今年" },
};

const chartOf = (start) => CHART_OF[start] ?? CHART_OF.week;

/** 棒グラフで、いくつ前を見ているか [shift, setShift]（0 ＝ 今、-1 ＝ 1 つ前 …）
 *  上の期間（start）を切りかえたら、今にもどす。AllView・AppView が持って、棒グラフと総時間で同じ期間を使う */
function useChartShift(start) {
  const [moved, setMoved] = useState({ start, n: 0 });
  const shift = moved.start === start ? moved.n : 0;
  const setShift = (f) => setMoved({ start, n: typeof f === "function" ? f(shift) : f });
  return [shift, setShift];
}

/** start … 上の期間（day／week／month／all）、apps … 積むアプリ [{ id, name, color }]
 *  shift・onShift … いくつ前を見ているかと、それを変える関数（useChartShift） */
function UsageChart({ start, apps, legend, shift, onShift: setShift }) {
  const info = chartOf(start);
  const cspan = info.id;
  const range = chartRange(cspan, shift);
  const usage = getUsage(range.from, range.to) ?? { byDay: {}, byHour: Array.from({ length: 24 }, () => ({ total: 0, apps: {} })) };

  return (
    <Section
      title={info.title}
      className="is-chart"
      tools={
        <>
          {/* ‹ 期間 › … 棒が並んでいる部分のまん中に置く（records.css） */}
          <span className="rec-nav">
            <button type="button" className="rec-nav-btn" onClick={() => setShift((n) => n - 1)} aria-label="前へ" title="前へ">‹</button>
            <span className="rec-nav-label">{range.label}</span>
            <button type="button" className="rec-nav-btn" onClick={() => setShift((n) => Math.min(0, n + 1))} disabled={shift >= 0} aria-label="次へ" title="次へ">›</button>
          </span>
          {/* 前にもどっているときだけ、今へもどるボタン（枠の右はし。まん中がずれないように、‹ › とは別に置く） */}
          {shift < 0 && <button type="button" className="rec-nav-now" onClick={() => setShift(0)}>{info.now}</button>}
        </>
      }
    >
      <BarChart cols={columnsOf(cspan, usage, range)} apps={apps} legend={legend} />
    </Section>
  );
}

// ───────── 各アプリ（すべて と同じ並び） ─────────
//  [アプリの名前（数字 3 つ）][棒グラフ    ]
//  [総時間（円グラフ）       ][            ]
//  [                         ][日ごとの履歴]
function AppView({ app, rec, span }) {
  const { usage } = rec;
  const color = colorOf(app.id);
  const sec = usage.apps[app.id] ?? 0;
  const days = Object.values(usage.byDay).filter((d) => (d.apps[app.id] ?? 0) > 0).length;
  const last = rec.lastUsed(app.id);
  // 棒グラフで見ている期間（‹ › で前後に動かせる）。総時間も、この期間の合計にする
  const [shift, setShift] = useChartShift(span);
  const range = chartRange(chartOf(span).id, shift);

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
      <div className="rec-row is-all" style={{ "--app": color }}>
        {/* 左の列：上に数字のまとめ（見出しはアプリの名前）、その下に総時間 */}
        <div className="rec-stack">
          <Summary title={app.name} span={span} prev={prev} items={[
            { icon: app.icon, label: "使った時間", value: timeText(sec), num: sec, fmt: timeText, sub: `全体の ${percent(sec, usage.total)}%`,
              delta: prev && <Delta now={sec} before={prevSec} word={prev.word} /> },
            { icon: "records", label: "1 日の平均", value: timeText(avg(sec, days)), num: avg(sec, days), fmt: timeText, sub: `${days} 日 使った`,
              delta: prev && <Delta now={avg(sec, days)} before={avg(prevSec, prevDays)} word={prev.word} /> },
            { icon: "check", label: "最後に使った日", value: last ? shortDate(last) : "—", sub: last ? "期間に関係なく" : "まだ使っていません", tip: last ? dateText(last) : "" },
          ]} />
          <TotalCard app={app} color={color} range={range} />
        </div>

        {/* 右の上：棒グラフ（このアプリだけ）、右の下：日ごとの履歴 */}
        <UsageChart start={span} apps={[{ id: app.id, name: app.name, color }]} legend={false} shift={shift} onShift={setShift} />
        <History byDay={byDay} one={app.id} />
      </div>
    </>
  );
}

/** 総時間（棒グラフに出ている期間 range の、そのアプリの合計。数字のまとめの下に置く）
 *  ‹ › で棒グラフを前後に動かすと、こちらもその期間の合計に変わる（数字・円グラフはなめらかに変わる）
 *  まん中に円グラフ … その期間の全部のアプリの合計のうち、このアプリが何 % か（アプリの色）。まん中に総時間
 *  下に、全体のうち何 %・使った日数・いちばん使った日（その期間の中で）
 *  円グラフの大きさと位置は、すべて の「アプリごとの時間」とそろえる（下の一覧を、アプリの数と同じ行の高さにする。records.css） */
function TotalCard({ app, color, range }) {
  const usage = getUsage(range.from, range.to) ?? { total: 0, apps: {}, byDay: {} };
  const total = usage.apps[app.id] ?? 0;
  const secOf = (d) => d.apps[app.id] ?? 0;
  const days = Object.entries(usage.byDay).filter(([, d]) => secOf(d) > 0);
  const best = days.reduce((a, b) => (secOf(b[1]) > secOf(a[1]) ? b : a), days[0]);   // いちばん使った日 [日付, 記録]
  const pct = percent(total, usage.total);
  return (
    <Section title="総時間" note={`${range.label} の合計`} className="is-total">
      <div className="rec-total">
        <Donut
          size="fluid"
          thick={12}
          total={usage.total}
          parts={[{ value: total, color, name: app.name, label: `${app.name}：${timeText(total)}（全体の ${pct}%）` }]}
          label={`${app.name}の総時間 ${timeText(total)}`}
        >
          <strong><Tween value={total} format={timeText} /></strong>
        </Donut>
        <ul className="rec-total-info" style={{ "--rows": APPS.length }}>
          <li><span>全体のうち</span><b><Tween value={pct} format={pctText} /></b></li>
          <li><span>使った日</span><b><Tween value={days.length} format={dayCount} /></b></li>
          <li><span>いちばん使った日</span><b>{best ? `${dateText(best[0])}・${timeText(secOf(best[1]))}` : "—"}</b></li>
        </ul>
      </div>
    </Section>
  );
}

// ───────── 右はしの「がんばりポイント」（とても広い画面のときだけ出る） ─────────
function RecordsAside({ rec, app, span, onOpenPage }) {
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
      <RecentAchievements app={app} />
      {/* いちばん下（画面の右下）に、そのアプリを開くボタン */}
      <OpenButton app={app} onOpenPage={onOpenPage} />
    </aside>
  );
}

/** そのアプリを開くボタン（各アプリのタブのときだけ。アプリの色でぬる） */
function OpenButton({ app, onOpenPage }) {
  if (!app || !onOpenPage) return null;
  return (
    <button type="button" className="rec-open" style={{ "--app": colorOf(app.id) }} onClick={() => onOpenPage(app.id)}>
      <Icon name={app.icon} />
      <span>{app.name}を開く</span>
    </button>
  );
}

/** 最近手に入れたアチーブ（おまけのいちばん下。期間に関係なく、新しい順に 4 つ）
 *  app を渡すと、そのアプリのアチーブだけ。名前・アプリ・手に入れた日・レア度（色は core/styles/theme.css の .rarity-〇〇） */
function RecentAchievements({ app }) {
  const unlocked = getUnlocked();   // { "アプリの id:アチーブの id": 手に入れた日時 }
  const list = ALL_ACHIEVEMENTS
    .filter((a) => unlocked[a.key] && (!app || a.key.startsWith(`${app.id}:`)))
    .sort((a, b) => (unlocked[b.key] > unlocked[a.key] ? 1 : -1))
    .slice(0, 4);
  const when = (a) => String(unlocked[a.key]).slice(5, 10).replace("-", "/");   // "2026-11-18 …" → "11/18"
  return (
    <section className="panel rec-aside-card">
      <h2 className="rec-aside-title is-got"><Icon name="check" />最近手に入れたアチーブ</h2>
      {list.length === 0 ? (
        <p className="rec-aside-none">{app ? `${app.name}のアチーブは、まだありません。` : "まだありません。アプリを使ってみましょう！"}</p>
      ) : (
        <ul className="rec-aside-list is-ach">
          {list.map((a) => (
            <li key={a.key} className={`rarity-${a.rarity}`}>
              <Icon name={a.appIcon} />
              <span><b>{a.name}</b><small>{a.appName}・{when(a)}</small></span>
              <em className="rec-aside-rarity">{a.rarityName}</em>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ───────── 部品 ─────────
/** 1 日の平均（秒）。使った日が 0 なら 0 */
const avg = (sec, days) => (days ? sec / days : 0);

/** 数字のまとめ（3 つの数字を 1 つの枠に入れる。見出しは、開いているタブの名前（すべて／プログラム学習 など））
 *  items … [{ icon, label, value, sub, delta, tip（マウスを乗せたときに出す言葉。なければ value）,
 *             num・fmt（数字と、その書き方。あれば期間を切りかえたとき、カウントするように変わる） }]（いちばん前が、いちばん大事な数字。色をつけて目立たせる）
 *  1 つの数字を 1 行にして、たてに並べる（左に名前と小さな説明、右に数字とくらべ。records.css の .rec-sum） */
function Summary({ title, span, prev, items }) {
  const note = `${SPAN_WORD[span]}の数字` + (prev ? `（▲▼ は${prev.word}とのくらべ）` : "");
  return (
    <Section title={title} note={note} className="is-sum">
      <ul className="rec-sum">
        {items.map((it, i) => (
          <li key={it.label} className={`rec-sum-item${i === 0 ? " is-main" : ""}`}>
            <span className="rec-sum-label"><Icon name={it.icon} />{it.label}</span>
            <strong className="rec-sum-value" title={it.tip || it.value}>{it.fmt ? <Tween value={it.num} format={it.fmt} /> : it.value}</strong>
            {it.delta && <span className="rec-sum-delta">{it.delta}</span>}
            {it.sub && <small className="rec-sum-sub" title={it.sub}>{it.sub}</small>}
          </li>
        ))}
      </ul>
    </Section>
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

/** 数字をなめらかに変える（前の数字から新しい数字へ、0.5 秒かけて少しずつ。はじめは動かさない）
 *  設定の「動きを少なくする」（.reduce-motion）のときは、すぐ変える */
function useTween(target, ms = 500) {
  const [shown, setShown] = useState(target);
  const now = useRef(target);   // 今 画面に出している数字
  useEffect(() => {
    const from = now.current;
    if (from === target || document.documentElement.classList.contains("reduce-motion")) {
      now.current = target; setShown(target); return undefined;
    }
    const t0 = performance.now();
    let id = 0;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / ms);
      const ease = 1 - (1 - k) ** 3;   // はじめ速く、だんだんゆっくり
      now.current = from + (target - from) * ease;
      setShown(now.current);
      if (k < 1) id = requestAnimationFrame(step);
    };
    id = requestAnimationFrame(step);
    return () => cancelAnimationFrame(id);
  }, [target, ms]);
  return shown;
}
/** 数字をなめらかに変えて出す。format … 数字を文字にする関数（例：timeText） */
function Tween({ value, format }) {
  return format(Math.round(useTween(value)));
}
/** 数字の書き方（Tween の format に使う） */
const dayCount = (n) => `${n} 日`;
const timeOrDash = (sec) => (sec > 0 ? timeText(sec) : "—");
const pctText = (n) => `${n}%`;

/** 期間のよび名（数字のまとめ・がんばりポイントで使う） */
const SPAN_WORD = { day: "今日", week: "今週", month: "今月", all: "今まで" };

/** 見出しつきのまとまり（中身は .rec-section-body。画面に収めるときは、この中だけスクロールする）
 *  tools … 見出しの右はしに出すもの（棒グラフの ‹ › など）
 *  foot  … いちばん下に出すもの（日ごとの履歴の凡例など。中身をスクロールしても、下に残る） */
function Section({ title, note, tools, foot, className = "", children }) {
  return (
    <section className={`panel rec-section ${className}`}>
      <header className="rec-section-head">
        <h2>{title}</h2>
        {note && <small>{note}</small>}
        {tools && <div className="rec-section-tools">{tools}</div>}
      </header>
      <div className="rec-section-body">{children}</div>
      {foot && <div className="rec-section-foot">{foot}</div>}
    </section>
  );
}

/** 何もないときの文 */
const Empty = ({ children }) => <p className="rec-none">{children}</p>;

/** 日ごとの履歴（新しい日が上）。one にアプリの id を渡すと、そのアプリだけの棒にする
 *  すべて のときは、棒の下に アプリごとの時間（色の丸 ＋ 時間）、いちばん下に凡例（色の見本。棒グラフと同じ形） */
function History({ byDay, one }) {
  const [shown, setShown] = useState(HISTORY_STEP);
  const keys = Object.keys(byDay).filter((k) => byDay[k].total > 0).sort().reverse();
  const top = Math.max(0, ...keys.map((k) => byDay[k].total));
  const rest = keys.length - shown;

  return (
    <Section
      title="日ごとの履歴" note={keys.length ? `${keys.length} 日` : ""} className="is-scroll"
      foot={!one && keys.length > 0 && (
        <ul className="rec-legend">
          {APPS.map((p) => <li key={p.id}><i style={{ background: colorOf(p.id) }} />{p.name}</li>)}
        </ul>
      )}
    >
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
                        <span key={p.id} className="rec-h-app" title={`${p.name} ${timeText(d.apps[p.id])}`}>
                          <i style={{ background: colorOf(p.id) }} />{timeText(d.apps[p.id])}
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
