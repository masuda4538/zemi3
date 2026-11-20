// ═══════════════════════════════════════════════════════════════
//  記録のページのグラフ（main.jsx で使う）。見た目は records.css の「グラフ」
//    <Donut parts={[{ value, color, label, name }]} total={合計} size={180}>まん中に出すもの</Donut>
//        … マウスを乗せると、その色の部分が少し太くなり、ふきだし（Tip）で名前・時間・% が出る
//        … 円グラフ（ドーナツ）。12 時の位置から時計回りに、parts の順で色をつなぐ
//          size="fluid" にすると、大きさは CSS で決める（records.css の .rec-donut.is-fluid。枠の高さに合わせる）
//    <BarChart cols={columnsOf(span, usage, period)} apps={[{ id, name, color }]} />
//        … 使った時間の棒グラフ（アプリの色で下から積む）。マウスを乗せると、くわしい時間が出る
//          アプリが 2 つ以上のときは、下に色の見本を出す（legend={false} で出さない）
//          マウスを乗せると、ふきだし（Tip）で その日の合計とアプリごとの時間が出る
//    ふきだし（Tip）… マウスの少し上に出す白い小さな枠。見た目は records.css の「ふきだし」
//    chartRange(span, shift) … 棒グラフの期間 { from, to, label }（span：day／week／month／year、shift：0 ＝ 今、-1 ＝ 1 つ前 …）
//    columnsOf(span, usage, period) … 期間に合わせて棒を作る
//        日 → 時間ごと（0〜23 時）／週 → 曜日ごと（月〜日）／月 → 日ごと／年 → 月ごと（1〜12 月）
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { dayKey } from "../../core/storage/logins.js";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** 秒を「1時間23分」「12分」「40秒」の形にする（main.jsx と同じ） */
export function timeText(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}時間${m ? `${m}分` : ""}` : `${m}分`;
}

// ───────── ふきだし（マウスを乗せたときに出す） ─────────
/** ふきだしを出す・消すための入れもの。[今のふきだし, 出す(e, 中身), 消す()] */
function useTip() {
  const [tip, setTip] = useState(null);
  const show = (e, body) => setTip({ x: e.clientX, y: e.clientY, body });
  const hide = () => setTip(null);
  return [tip, show, hide];
}

/** ふきだし本体。画面のはしからはみ出さないように、左右を少し内側に寄せる */
function Tip({ tip }) {
  if (!tip) return null;
  const x = Math.min(window.innerWidth - 110, Math.max(110, tip.x));
  return <div className="rec-tip" style={{ left: x, top: tip.y }} role="tooltip">{tip.body}</div>;
}

/** ふきだしの中身：見出し・合計・色ごとの行 [{ color, name, sec }] */
function TipBody({ title, total, rows = [] }) {
  return (
    <>
      <span className="rec-tip-title">{title}</span>
      {total != null && <strong className="rec-tip-total">{timeText(total)}</strong>}
      {rows.length > 0 && (
        <span className="rec-tip-rows">
          {rows.map((r) => (
            <span key={r.name} className="rec-tip-row"><i style={{ background: r.color }} />{r.name}<b>{r.text ?? timeText(r.sec)}</b></span>
          ))}
        </span>
      )}
    </>
  );
}

// ───────── 円グラフ（ドーナツ） ─────────
export function Donut({ parts, total, size = 160, thick = 13, children, label }) {
  const [tip, show, hide] = useTip();
  const [hover, setHover] = useState(-1);   // マウスを乗せている部分（-1 ＝ なし）
  const R = 50 - thick / 2 - 3;             // 乗せたときに太くする分、少し内側に描く
  const LEN = 2 * Math.PI * R;
  let start = 0;
  // 0 の部分も長さ 0 で残す（期間を切りかえたとき、同じ部分がのび縮みして、なめらかに変わるように）
  const arcs = parts.map((p) => {
    const len = total > 0 ? (Math.min(p.value, total) / total) * LEN : 0;
    const arc = { ...p, len, start };
    start += len;
    return arc;
  });
  const drawn = arcs.filter((a) => a.len > 0).length;   // 見えている部分の数
  const pct = (v) => (total > 0 ? Math.round((v / total) * 100) : 0);
  return (
    <div className={`rec-donut${size === "fluid" ? " is-fluid" : ""}`} style={size === "fluid" ? undefined : { width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100">
        <circle className="rec-donut-track" cx="50" cy="50" r={R} strokeWidth={thick} />
        {arcs.map((a, i) => (
          <circle
            key={a.name ?? i} cx="50" cy="50" r={R} strokeWidth={hover === i ? thick + 4 : thick}
            className={hover >= 0 && hover !== i ? "is-dim" : ""}
            stroke={a.color}
            strokeDasharray={`${a.len} ${LEN - a.len}`}
            strokeDashoffset={-a.start}
            strokeLinecap={drawn === 1 && a.len > 0 && a.len < LEN ? "round" : "butt"}
            onMouseMove={(e) => { setHover(i); show(e, <TipBody title={a.name ?? a.label} rows={[{ color: a.color, name: `${pct(a.value)}%`, text: timeText(a.value) }]} />); }}
            onMouseLeave={() => { setHover(-1); hide(); }}
          />
        ))}
      </svg>
      <div className="rec-donut-center">{children}</div>
      <Tip tip={tip} />
    </div>
  );
}

// ───────── 棒グラフ ─────────
/** 棒のいちばん上のめもり（ちょうどよい切りのよい時間に切り上げる） */
function niceMax(sec) {
  const steps = [60, 300, 600, 900, 1800, 3600, 7200, 10800, 14400, 21600, 28800, 43200, 86400];
  return steps.find((s) => s >= sec) ?? Math.ceil(sec / 86400) * 86400;
}
/** めもりの文字（「30分」「2時間」） */
const axisText = (sec) => (sec >= 3600 ? `${+(sec / 3600).toFixed(1)}時間` : `${Math.round(sec / 60)}分`);

/** 棒グラフの期間 { from, to, label }（"2026-11-18" の形。両方ふくむ）
 *  span … "day"（1 日）／"week"（月曜〜日曜）／"month"（1 か月）／"year"（1 年）、shift … 0 ＝ 今、-1 ＝ 1 つ前、-2 ＝ 2 つ前 … */
export function chartRange(span, shift = 0) {
  const t = new Date();
  const md = (d) => `${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`;
  const yr = (d) => (d.getFullYear() === t.getFullYear() ? "" : `${d.getFullYear()}年`);
  if (span === "day") {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + shift);
    return { from: dayKey(d), to: dayKey(d), label: `${yr(d)}${md(d)}` };
  }
  if (span === "week") {   // 月曜日から日曜日まで
    const mon = new Date(t.getFullYear(), t.getMonth(), t.getDate() - ((t.getDay() + 6) % 7) + shift * 7);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    return { from: dayKey(mon), to: dayKey(sun), label: `${yr(mon)}${md(mon)}　～　${md(sun)}` };   // 「～」の前後は全角のすき間
  }
  if (span === "month") {
    const first = new Date(t.getFullYear(), t.getMonth() + shift, 1);
    return { from: dayKey(first), to: dayKey(new Date(first.getFullYear(), first.getMonth() + 1, 0)), label: `${first.getFullYear()}年${first.getMonth() + 1}月` };
  }
  const y = t.getFullYear() + shift;
  return { from: `${y}-01-01`, to: `${y}-12-31`, label: `${y}年` };
}

/** 期間に合わせて棒を作る [{ key, label, sub, title, total, apps: { id: 秒 }, now（今）, future（まだ来ていない）, show（下の文字を出すか） }] */
export function columnsOf(span, usage, period) {
  const today = dayKey();
  const now = new Date();
  const empty = { total: 0, apps: {} };
  if (span === "day") {   // 時間ごと（今日なら、今の時間に色をつける）
    const isToday = period.from === today;
    return usage.byHour.map((h, i) => ({
      key: `h${i}`, label: `${i}`, title: `${i}時台`, ...h, show: i % 3 === 0,
      now: isToday && i === now.getHours(), future: period.from > today || (isToday && i > now.getHours()),
    }));
  }
  if (span === "week" || span === "month") {   // 曜日ごと・日ごと
    const [y, m, d] = period.from.split("-").map(Number);
    const cols = [];
    for (let i = 0; ; i++) {
      const date = new Date(y, m - 1, d + i);
      const key = dayKey(date);
      if (key > period.to) break;
      const day = usage.byDay[key] ?? empty;
      const n = date.getDate();
      cols.push({
        key, total: day.total, apps: day.apps, now: key === today, future: key > today,
        label: span === "week" ? WEEK[date.getDay()] : `${n}`,
        sub: span === "week" ? `${date.getMonth() + 1}/${n}` : "",
        title: `${date.getMonth() + 1}月${n}日（${WEEK[date.getDay()]}）`,
        show: span === "week" || n === 1 || n % 5 === 0 || key === today,
      });
    }
    return cols;
  }
  // 年：月ごと（1 月〜12 月）
  const year = Number(period.from.slice(0, 4));
  return Array.from({ length: 12 }, (_, i) => {
    const ym = `${year}-${String(i + 1).padStart(2, "0")}`;
    const col = {
      key: ym, total: 0, apps: {}, label: `${i + 1}月`, title: `${year}年${i + 1}月`, show: true,
      now: year === now.getFullYear() && i === now.getMonth(),
      future: year > now.getFullYear() || (year === now.getFullYear() && i > now.getMonth()),
    };
    for (const [k, day] of Object.entries(usage.byDay)) {
      if (!k.startsWith(ym)) continue;
      col.total += day.total;
      for (const [id, s] of Object.entries(day.apps)) col.apps[id] = (col.apps[id] ?? 0) + s;
    }
    return col;
  });
}

/** 使った時間の棒グラフ（apps の順に下から積む） */
export function BarChart({ cols, apps, legend = true }) {
  const [tip, show, hide] = useTip();
  const values = cols.map((c) => apps.reduce((n, a) => n + (c.apps[a.id] ?? 0), 0));
  const max = niceMax(Math.max(600, ...values));   // いちばん低くても 10 分（めもりが 0・5分・10分 になる）
  return (
    <div className="rec-chart">
      <div className="rec-bars">
        <div className="rec-bars-axis" aria-hidden="true">
          <span>{axisText(max)}</span><span>{axisText(max / 2)}</span><span>0</span>
        </div>
        <div className="rec-bars-plot">
          {cols.map((c, i) => {
            const total = values[i];
            const used = apps.filter((a) => (c.apps[a.id] ?? 0) > 0);
            const body = <TipBody title={c.title} total={total} rows={used.length > 1 ? used.map((a) => ({ color: a.color, name: a.name, sec: c.apps[a.id] })) : []} />;
            return (
              <div
                key={c.key} className={`rec-col${c.now ? " is-now" : ""}${c.future ? " is-future" : ""}`}
                aria-label={`${c.title} ${timeText(total)}`}
                onMouseMove={(e) => show(e, body)} onMouseLeave={hide}
              >
                <div className="rec-col-area">
                  <div className="rec-col-stack" style={{ height: `${(total / max) * 100}%` }}>
                    {used.map((a) => <span key={a.id} style={{ flexGrow: c.apps[a.id], background: a.color }} />)}
                  </div>
                </div>
                <span className="rec-col-label">{c.show ? c.label : ""}</span>
                {cols.some((x) => x.sub) && <span className="rec-col-sub">{c.sub}</span>}
              </div>
            );
          })}
        </div>
      </div>
      {legend && apps.length > 1 && (
        <ul className="rec-legend">
          {apps.map((a) => <li key={a.id}><i style={{ background: a.color }} />{a.name}</li>)}
        </ul>
      )}
      <Tip tip={tip} />
    </div>
  );
}
