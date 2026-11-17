// ═══════════════════════════════════════════════════════════════
//  記録のページのグラフ（main.jsx で使う）。見た目は records.css の「グラフ」
//    <Donut parts={[{ value, color, label }]} total={合計} size={180}>まん中に出すもの</Donut>
//        … 円グラフ（ドーナツ）。12 時の位置から時計回りに、parts の順で色をつなぐ
//    <BarChart cols={columnsOf(span, usage, period)} apps={[{ id, name, color }]} />
//        … 使った時間の棒グラフ（アプリの色で下から積む）。マウスを乗せると、くわしい時間が出る
//    columnsOf(span, usage, period) … 期間に合わせて棒を作る
//        今日 → 時間ごと（0〜23 時）／今週 → 曜日ごと／今月 → 日ごと／すべて → 月ごと（最後の 12 か月）
// ═══════════════════════════════════════════════════════════════
import { dayKey } from "../../core/storage/logins.js";

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

/** 秒を「1時間23分」「12分」「40秒」の形にする（main.jsx と同じ） */
export function timeText(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}時間${m ? `${m}分` : ""}` : `${m}分`;
}

// ───────── 円グラフ（ドーナツ） ─────────
export function Donut({ parts, total, size = 160, thick = 13, children, label }) {
  const R = 50 - thick / 2 - 1;
  const LEN = 2 * Math.PI * R;
  let start = 0;
  const arcs = total > 0 ? parts.filter((p) => p.value > 0).map((p) => {
    const len = (Math.min(p.value, total) / total) * LEN;
    const arc = { ...p, len, start };
    start += len;
    return arc;
  }) : [];
  return (
    <div className="rec-donut" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg viewBox="0 0 100 100">
        <circle className="rec-donut-track" cx="50" cy="50" r={R} strokeWidth={thick} />
        {arcs.map((a, i) => (
          <circle
            key={i} cx="50" cy="50" r={R} strokeWidth={thick}
            stroke={a.color}
            strokeDasharray={`${a.len} ${LEN - a.len}`}
            strokeDashoffset={-a.start}
            strokeLinecap={arcs.length === 1 && a.len < LEN ? "round" : "butt"}
          >
            {a.label && <title>{a.label}</title>}
          </circle>
        ))}
      </svg>
      <div className="rec-donut-center">{children}</div>
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

/** 期間に合わせて棒を作る [{ key, label, sub, total, apps: { id: 秒 }, now, show（下の文字を出すか） }] */
export function columnsOf(span, usage, period) {
  const today = dayKey();
  const empty = { total: 0, apps: {} };
  if (span === "day") {   // 時間ごと
    const hour = new Date().getHours();
    return usage.byHour.map((h, i) => ({ key: `h${i}`, label: `${i}`, title: `${i}時台`, ...h, now: i === hour, show: i % 3 === 0 }));
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
  // すべて：月ごと（最後の 12 か月。使いはじめた月が 12 か月より新しければ、そこから）
  const now = new Date();
  const first = Object.keys(usage.byDay).sort()[0];
  let start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  if (first) {
    const [fy, fm] = first.split("-").map(Number);
    const f = new Date(fy, fm - 1, 1);
    if (f > start) start = f;
  }
  if (now.getFullYear() * 12 + now.getMonth() - (start.getFullYear() * 12 + start.getMonth()) < 5) start = new Date(now.getFullYear(), now.getMonth() - 5, 1);   // 少なくとも 6 か月
  const cols = [];
  for (let d = new Date(start); d <= now; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const col = { key: ym, total: 0, apps: {}, label: `${d.getMonth() + 1}月`, sub: d.getMonth() === 0 || cols.length === 0 ? `${d.getFullYear()}` : "",
      title: `${d.getFullYear()}年${d.getMonth() + 1}月`, now: d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(), show: true };
    for (const [k, day] of Object.entries(usage.byDay)) {
      if (!k.startsWith(ym)) continue;
      col.total += day.total;
      for (const [id, s] of Object.entries(day.apps)) col.apps[id] = (col.apps[id] ?? 0) + s;
    }
    cols.push(col);
  }
  return cols;
}

/** 使った時間の棒グラフ（apps の順に下から積む） */
export function BarChart({ cols, apps }) {
  const values = cols.map((c) => apps.reduce((n, a) => n + (c.apps[a.id] ?? 0), 0));
  const max = niceMax(Math.max(60, ...values));
  return (
    <div className="rec-bars">
      <div className="rec-bars-axis" aria-hidden="true">
        <span>{axisText(max)}</span><span>{axisText(max / 2)}</span><span>0</span>
      </div>
      <div className="rec-bars-plot">
        {cols.map((c, i) => {
          const total = values[i];
          const used = apps.filter((a) => (c.apps[a.id] ?? 0) > 0);
          const tip = `${c.title}：${timeText(total)}${used.length > 1 ? "\n" + used.map((a) => `${a.name} ${timeText(c.apps[a.id])}`).join("\n") : ""}`;
          return (
            <div key={c.key} className={`rec-col${c.now ? " is-now" : ""}${c.future ? " is-future" : ""}`} title={tip}>
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
  );
}
