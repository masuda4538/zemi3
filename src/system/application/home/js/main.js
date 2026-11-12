// ═══════════════════════════════════════════════════════════════
//  ホーム：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//    要素は $("id") で探す（document.getElementById の短い書き方。下で作っている）
//    app.user                   ログインしている人（ゲストのときは null）
//    app.loginDays()            ログインした日 { days: ["2026-11-10", …], total, streak, best }（ゲストなら null）
//    app.usage(from, to)        その間にアプリを開いていた時間 { total: 秒, apps: { home: 秒, … }, days }（ゲストなら null）
//    app.achievements()         すべてのアチーブ（手に入れた日時 gotAt・今の数 now・レア度 rarity つき）
//    app.pages                  左に並ぶアプリの一覧 [{ id, name }]
//    app.open("achieve")        ほかのページを開く
//
//  ★ 書きかえやすいところ
//    updateTime … 上の時計（左はしに日付、まん中に時:分:秒）
//    drawLogin … 時計の帯の右はしの、ログイン日数・連続日数
//    drawUsage … 使った時間の円グラフ（日・週・月・年。APP_COLORS がアプリごとの色）
//    drawChart … 円グラフの下のグラフ（日：時間ごと／週：曜日ごと／月：カレンダー／年：月ごと）
//    drawAchieve … アチーブ（円・レア度ごとの数・最近手に入れた 2 つ）
// ═══════════════════════════════════════════════════════════════

/** アイコン（main/components/Icon.jsx と同じ形） */
const ICONS = {
  programming: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m8.5 9.5-3 3 3 3M15.5 9.5l3 3-3 3M13.2 8.5l-2.4 8"/>',
  research: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 9h6M7.5 12h4"/>',
  zukan: '<path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h14v-4M8.5 7.5h7M8.5 11h5"/>',
  quiz: '<rect x="4.5" y="4" width="15" height="17.5" rx="2.5"/><path d="M9 4V2.8h6V4M9.8 10.2a2.3 2.3 0 1 1 3.3 2c-.7.4-1.1.9-1.1 1.6v.4M12 17.4v.1"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11h4.5v-6h4v6h4.5V9"/>',
  trophy: '<path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5v1.5A3 3 0 0 0 7.6 10.5M16.5 6h3v1.5a3 3 0 0 1-3.1 3M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  mouse: '<rect x="6" y="2.5" width="12" height="19" rx="6"/><path d="M12 6.5v3.5"/>',
};
const icon = (name) => `<svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.trophy}</svg>`;

/** 要素を作る（文字は textContent で入れるので、名前などに記号があっても安全） */
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

/** id で要素を探す（document.getElementById の短い書き方） */
const $ = (id) => document.getElementById(id);

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];
const pad = (n) => String(n).padStart(2, "0");
/** 日付の形（2026-11-03）。app.loginDays() の days・app.usage() と同じ */
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 「11月10日（火）」の形 */
const mdw = (d) => `${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`;

// ───────── 1. 時計の帯（左はしに日付、まん中に時:分:秒。日付は 0 時をこえたときだけ書きかえる） ─────────
let shownDay = "";
const updateTime = () => {
  const d = new Date();
  $("clock").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (dayKey(d) !== shownDay) {
    shownDay = dayKey(d);
    $("date").textContent = `${d.getFullYear()}年${mdw(d)}`;
  }
};
updateTime();
setInterval(updateTime, 1000);   // 1 秒ごとに時計を進める

// ───────── 時計の帯の右はし：ログイン日数・連続日数 ─────────
const drawLogin = () => {
  const info = app.loginDays();   // ゲストなら null
  $("login-stats").hidden = !info;
  $("go-login").hidden = !!info;
  if (!info) return;
  $("login-total").textContent = info.total;
  $("login-streak").textContent = info.streak;
  $("login-stats").title = `最高記録：${info.best} 日連続`;

  // ホームのアチーブ（achieve_setting/home.js）：ログイン日数を、そのままアチーブの数にする
  app.setProgress("streak-3", info.streak);   // 3 日連続
  app.setProgress("days-10", info.total);     // 合計 10 日
};

// ───────── 3. 使った時間（アプリごとの円グラフ。日・週・月・年で切りかえ、‹ › で前後へ） ─────────
/** アプリごとの色（id は main/apps.js と同じ。ここにないアプリは灰色） */
const APP_COLORS = {
  programming: "#2563eb",  // 青
  research: "#0ea5e9",     // 水色
  zukan: "#14b8a6",        // 青緑
  quiz: "#f59e0b",         // 黄
};
const CHART_APPS = Object.keys(APP_COLORS);   // 棒グラフで下から積む順番
let span = "day";       // 今見ている長さ
let shift = 0;          // 0 ＝ 今日（今週・今月・今年）、-1 ＝ 1 つ前 …

/** 見ている期間 { from: Date, to: Date, title } */
function periodOf() {
  const t = new Date();
  if (span === "day") {
    const d = new Date(t.getFullYear(), t.getMonth(), t.getDate() + shift);
    return { from: d, to: d, title: `${d.getFullYear()}年${mdw(d)}` };
  }
  if (span === "week") {   // 月曜日から日曜日まで
    const monday = new Date(t.getFullYear(), t.getMonth(), t.getDate() - ((t.getDay() + 6) % 7) + shift * 7);
    const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
    return { from: monday, to: sunday, title: `${mdw(monday)} 〜 ${mdw(sunday)}` };
  }
  if (span === "month") {
    const first = new Date(t.getFullYear(), t.getMonth() + shift, 1);
    return { from: first, to: new Date(first.getFullYear(), first.getMonth() + 1, 0), title: `${first.getFullYear()}年${first.getMonth() + 1}月` };
  }
  const y = t.getFullYear() + shift;
  return { from: new Date(y, 0, 1), to: new Date(y, 11, 31), title: `${y}年` };
}

/** 秒を「1時間23分」「12分」「40秒」の形にする */
function timeText(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}時間${m ? `${m}分` : ""}` : `${m}分`;
}

const drawUsage = () => {
  const { from, to, title } = periodOf();
  const data = app.usage(dayKey(from), dayKey(to));   // ゲストなら null
  $("usage-title").textContent = title;
  $("usage-next").disabled = shift >= 0;   // 未来には進めない
  $("usage-now").hidden = shift === 0;
  $("usage-now").textContent = { day: "今日", week: "今週", month: "今月", year: "今年" }[span];
  document.querySelectorAll("#usage-tabs button").forEach((b) => b.classList.toggle("is-on", b.dataset.span === span));
  $("usage-body").hidden = !data;
  $("usage-chart-box").hidden = !data;
  $("usage-guest").hidden = !!data;
  if (!data) { $("usage-note").textContent = ""; return; }
  drawChart(data, from, to);

  // アプリごとに、長い順に並べる（プログラム学習〜問題作成。ホームは計らない。使っていないアプリも 0 で出す）
  const rows = app.pages
    .filter((p) => p.id !== "home")
    .map((p) => ({ ...p, sec: data.apps[p.id] ?? 0, color: APP_COLORS[p.id] ?? "#94a3b8" }))
    .sort((a, b) => b.sec - a.sec);

  // 円グラフ（ドーナツ）：12 時から時計回りに、長いアプリから順に色をつなぐ
  const R = 40, LEN = 2 * Math.PI * R;
  let start = 0;
  const parts = data.total > 0
    ? rows.filter((r) => r.sec > 0).map((r) => {
      const len = (r.sec / data.total) * LEN;
      const part = `<circle cx="50" cy="50" r="${R}" stroke="${r.color}" stroke-dasharray="${len} ${LEN - len}" stroke-dashoffset="${-start}"><title>${r.name}：${timeText(r.sec)}</title></circle>`;
      start += len;
      return part;
    }).join("")
    : "";
  $("usage-pie").innerHTML =
    `<svg viewBox="0 0 100 100"><circle class="home-pie-track" cx="50" cy="50" r="${R}"/>${parts}</svg>` +
    `<span class="home-pie-center"><small>合計</small><strong></strong></span>`;
  $("usage-pie").querySelector("strong").textContent = data.total > 0 ? timeText(data.total) : "0分";
  $("usage-pie").setAttribute("aria-label", `${title}の合計 ${timeText(data.total)}`);

  // 右の一覧：色・アイコン・名前・時間・割合
  const list = $("usage-list");
  list.replaceChildren();
  rows.forEach((r) => {
    const li = el("li", `home-usage-row${r.sec > 0 ? "" : " is-zero"}`);
    const dot = el("span", "home-usage-dot");
    dot.style.background = r.color;
    const ic = el("span", "home-usage-icon");
    ic.innerHTML = icon(r.id);
    const pct = data.total > 0 ? Math.round((r.sec / data.total) * 100) : 0;
    li.append(dot, ic, el("span", "home-usage-name", r.name), el("span", "home-usage-time", r.sec > 0 ? timeText(r.sec) : "—"), el("span", "home-usage-pct", `${pct}%`));
    list.append(li);
  });

  // 下のひとこと（週・月・年は 1 日あたりも出す）
  $("usage-note").textContent = data.total <= 0
    ? "まだ記録がありません。アプリを開くと、開いている時間が記録されます。"
    : span === "day"
      ? `いちばん使ったのは「${rows[0].name}」です。`
      : `使った日 ${data.days} 日・1 日あたり ${timeText(data.total / Math.max(1, data.days))}`;
};

document.querySelectorAll("#usage-tabs button").forEach((b) => b.addEventListener("click", () => { span = b.dataset.span; shift = 0; drawUsage(); }));
$("usage-prev").addEventListener("click", () => { shift--; drawUsage(); });
$("usage-next").addEventListener("click", () => { if (shift < 0) { shift++; drawUsage(); } });
$("usage-now").addEventListener("click", () => { shift = 0; drawUsage(); });
$("usage-login").addEventListener("click", () => app.open("account"));
setInterval(() => { if (shift === 0) drawUsage(); }, 15 * 1000);   // 今の期間を見ているときは 15 秒ごとに数を進める

// ───────── 円グラフの下のグラフ（日：時間ごと／週：曜日ごと／月：カレンダー／年：月ごと） ─────────
/** 「11月10日 14時台：40分（プログラム学習 30分・問題作成 10分）」のような、マウスをのせたときの説明 */
const tipOf = (label, cell) => {
  const parts = CHART_APPS.filter((id) => cell.apps[id] > 0)
    .map((id) => `${app.pages.find((p) => p.id === id)?.name ?? id} ${timeText(cell.apps[id])}`);
  return `${label}：${cell.total > 0 ? timeText(cell.total) : "0分"}${parts.length ? `（${parts.join("・")}）` : ""}`;
};

/** グラフの上限を、きりのいい数（秒）にする（5分・10分・15分・30分・1時間・2時間 …） */
function niceMax(sec) {
  const steps = [300, 600, 900, 1800, 3600, 7200, 10800, 14400, 21600, 28800, 43200, 86400];
  return steps.find((s) => s >= sec) ?? Math.ceil(sec / 86400) * 86400;
}

/** 積み上げ棒グラフ。cols = [{ label（下の文字）, sub（その下の小さい文字）, tip, cell: { total, apps }, now（今なら true） }] */
function barChart(cols) {
  const max = niceMax(Math.max(60, ...cols.map((c) => c.cell.total)));
  const box = el("div", "home-bars");
  // 左のめもり（0・半分・上限）と、うすい横線
  const axis = el("div", "home-bars-axis");
  [max, max / 2, 0].forEach((v) => axis.append(el("span", "", v ? timeText(v) : "0")));
  const plot = el("div", "home-bars-plot");
  cols.forEach((c) => {
    const col = el("div", `home-bar${c.now ? " is-now" : ""}`);
    col.title = c.tip;
    const area = el("div", "home-bar-area");
    const stack = el("div", "home-bar-stack");
    stack.style.height = `${(c.cell.total / max) * 100}%`;
    CHART_APPS.forEach((id) => {   // 下から アプリの順に色を積む
      const sec = c.cell.apps[id] ?? 0;
      if (!sec) return;
      const seg = el("span", "home-bar-seg");
      seg.style.flexGrow = sec;
      seg.style.background = APP_COLORS[id];
      stack.append(seg);
    });
    area.append(stack);
    col.append(area, el("span", "home-bar-label", c.label ?? ""));
    if (c.sub != null) col.append(el("span", "home-bar-sub", c.sub));
    plot.append(col);
  });
  box.append(axis, plot);
  return box;
}

/** 月のカレンダー（月曜はじまり）。使った時間が長い日ほど濃い青 */
function monthCalendar(data, first) {
  const y = first.getFullYear(), m = first.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  const max = Math.max(1, ...Object.values(data.byDay).map((d) => d.total));
  const today = dayKey(new Date());
  const box = el("div", "home-heat");
  ["月", "火", "水", "木", "金", "土", "日"].forEach((w, i) => box.append(el("span", `home-heat-week${i === 5 ? " is-sat" : i === 6 ? " is-sun" : ""}`, w)));
  for (let i = 0; i < (first.getDay() + 6) % 7; i++) box.append(el("span", "home-heat-day is-blank"));
  for (let n = 1; n <= last; n++) {
    const d = new Date(y, m, n);
    const key = dayKey(d);
    const cell = data.byDay[key] ?? { total: 0, apps: {} };
    const cls = ["home-heat-day"];
    if (key === today) cls.push("is-today");
    if (key > today) cls.push("is-future");
    const day = el("span", cls.join(" "));
    if (cell.total > 0) {
      const level = Math.round(18 + (cell.total / max) * 72);   // 18〜90%：長い日ほど濃い
      day.style.background = `color-mix(in srgb, var(--primary) ${level}%, var(--surface))`;
      if (level >= 50) day.classList.add("is-dark");
    }
    day.title = tipOf(mdw(d), cell);
    day.append(el("b", "", n), el("small", "", cell.total > 0 ? timeText(cell.total) : ""));
    box.append(day);
  }
  return box;
}

function drawChart(data, from, to) {
  const box = $("usage-chart");
  box.replaceChildren();
  const now = new Date();
  if (span === "day") {   // 0 時〜23 時（3 時間ごとに文字）
    $("usage-chart-title").textContent = "何時に使ったか（1 時間ごと）";
    const isToday = dayKey(from) === dayKey(now);
    box.append(barChart(data.byHour.map((cell, h) => ({
      label: h % 3 === 0 ? `${h}` : "", cell, now: isToday && h === now.getHours(),
      tip: tipOf(`${h}時台`, cell),
    }))));
  } else if (span === "week") {   // 月〜日
    $("usage-chart-title").textContent = "何曜日に使ったか";
    box.append(barChart(Array.from({ length: 7 }, (_, i) => {
      const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      const cell = data.byDay[dayKey(d)] ?? { total: 0, apps: {} };
      return { label: WEEK[d.getDay()], sub: `${d.getMonth() + 1}/${d.getDate()}`, cell, now: dayKey(d) === dayKey(now), tip: tipOf(mdw(d), cell) };
    })));
  } else if (span === "month") {   // カレンダー
    $("usage-chart-title").textContent = "日ごと（カレンダー。長く使った日ほど濃い）";
    box.append(monthCalendar(data, from));
  } else {   // 1 月〜12 月
    $("usage-chart-title").textContent = "何月に使ったか";
    box.append(barChart(Array.from({ length: 12 }, (_, i) => {
      const prefix = `${from.getFullYear()}-${pad(i + 1)}-`;
      const cell = { total: 0, apps: {} };
      for (const [key, d] of Object.entries(data.byDay)) {
        if (!key.startsWith(prefix)) continue;
        cell.total += d.total;
        for (const [id, sec] of Object.entries(d.apps)) cell.apps[id] = (cell.apps[id] ?? 0) + sec;
      }
      return { label: `${i + 1}月`, cell, now: from.getFullYear() === now.getFullYear() && i === now.getMonth(), tip: tipOf(`${from.getFullYear()}年${i + 1}月`, cell) };
    })));
  }
}

// ───────── 4. アチーブ（円・ゴールド／シルバー／ブロンズの数・最近手に入れた 2 つ） ─────────
const drawAchieve = () => {
  const ALL = app.achievements();   // [{ key, name, appName, icon, goal, gotAt（手に入れた日時）, now（今の数） }, …]
  const got = ALL.filter((a) => a.gotAt).length;
  const rate = ALL.length ? got / ALL.length : 0;

  // 円グラフ（12 時から、手に入れたぶんだけ線をのばす）
  const R = 42, LEN = 2 * Math.PI * R;
  $("ring").innerHTML =
    `<svg viewBox="0 0 100 100"><circle class="home-ring-track" cx="50" cy="50" r="${R}"/>` +
    (got ? `<circle class="home-ring-fill" cx="50" cy="50" r="${R}" stroke-dasharray="${LEN * rate} ${LEN}"/>` : "") +
    `</svg><span class="home-ring-pct">${Math.round(rate * 100)}<small>%</small></span>`;
  $("ring").setAttribute("aria-label", `アチーブ ${got} / ${ALL.length} こ（${Math.round(rate * 100)}%）`);
  $("achieve-count").textContent = `${got} / ${ALL.length}`;

  // ゴールド・シルバー・ブロンズごとの数（手に入れにくい順に上から）
  const bars = $("rarity-bars");
  bars.replaceChildren();
  [...(app.rarities ?? [])].reverse().forEach((r) => {
    const mine = ALL.filter((a) => a.rarity === r.id);
    const n = mine.filter((a) => a.gotAt).length;
    const li = el("li", `home-rarity-row rarity-${r.id}`);   // 色は main/theme.css の .rarity-〇〇
    li.setAttribute("aria-label", `${r.name} ${n} / ${mine.length} こ`);
    const bar = el("span", "home-rarity-bar");
    const fill = el("span", "home-rarity-fill");
    fill.style.width = `${mine.length ? (n / mine.length) * 100 : 0}%`;
    bar.append(fill);
    const count = el("span", "home-rarity-count");
    count.append(el("b", "", n), ` / ${mine.length}`);
    li.append(el("span", "home-rarity-name", r.name), bar, count);
    bars.append(li);
  });

  // 最近手に入れた（新しい順に 2 つ）
  const recent = ALL.filter((a) => a.gotAt).sort((a, b) => (b.gotAt > a.gotAt ? 1 : -1)).slice(0, 2);
  const ul = $("recent");
  ul.replaceChildren();
  if (!recent.length) {
    ul.append(el("li", "home-empty", app.user ? "まだありません。アプリを使ってみましょう！" : "ログインすると、アチーブが記録されます。"));
    return;
  }
  recent.forEach((a) => {
    const li = el("li", `home-ach is-got rarity-${a.rarity}`);   // レア度（main/theme.css の .rarity-〇〇）
    const badge = el("span", "home-ach-badge");
    badge.innerHTML = icon(a.icon);
    const text = el("span", "home-ach-text");
    text.append(el("strong", "", a.name), el("span", "", `${a.appName}・${a.gotAt.slice(5, 10).replace("-", "/")} に取得`));
    li.append(badge, text, el("span", "rarity-label", a.rarityName));   // レア度の名前（枠がレア度の色）
    ul.append(li);
  });
};
$("open-achieve").addEventListener("click", () => app.open("achieve"));
$("go-login").addEventListener("click", () => app.open("account"));

// ───────── はじめに描く・変わったら描き直す ─────────
const drawAll = () => { drawLogin(); drawUsage(); drawAchieve(); };
drawAll();
app.onLoginDaysChange(drawAll);          // ログインした日・ログインしている人が変わったとき
app.onUsageChange(drawUsage);            // 使った時間の記録が増えたとき（30 秒ごとなど）
app.onAchievementsChange(drawAchieve);   // ホームを開いているあいだにアチーブを手に入れたとき
