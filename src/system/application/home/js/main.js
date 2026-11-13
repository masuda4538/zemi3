// ═══════════════════════════════════════════════════════════════
//  ホーム：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//    要素は $("id") で探す（document.getElementById の短い書き方。下で作っている）
//    app.user                   ログインしている人 { name, userId, avatar（画像。なければ ""） }（ゲストのときは null）
//    app.onUserChange(関数)     ログインしている人・名前・アイコンが変わったら呼ぶ
//    app.loginDays()            ログインした日 { days: ["2026-11-10", …], total, streak, best }（ゲストなら null）
//    app.usage(from, to)        その間にアプリを開いていた時間 { total: 秒, apps: { home: 秒, … }, days }（ゲストなら null）
//    app.achievements()         すべてのアチーブ（手に入れた日時 gotAt・今の数 now・レア度 rarity つき）
//    app.pages                  左に並ぶアプリの一覧 [{ id, name }]
//    app.open("achieve")        ほかのページを開く
//
//  ★ 書きかえやすいところ
//    drawUser … いちばん上の帯の左はしの、アイコンと名前
//    drawLogin … いちばん上の帯の右はしの、ログイン日数・連続日数
//    drawStudyTotal … いちばん上の帯の右はしの、累計勉強時間（アプリを開いていた時間の合計）
//    drawUsage … 使った時間の円グラフ（日・週・月・年。APP_COLORS がアプリごとの色）
//    drawChart … 円グラフの下のグラフ（日：時間ごと／週：曜日ごと／月：カレンダー／年：月ごと）
//    drawAchieve … アチーブ（円・レア度ごとの数・最近手に入れたもの。2 つ分の高さで、残りはスクロール）
//    drawApps … いちばん下のアプリごとのカード（app.stats()。学習時間の内訳・大事な数は src/system/home_setting/<アプリの id>.js）
//               カードの上に 2 つの円グラフ：学習時間の内訳（home_setting の time）・アチーブの取得率
// ═══════════════════════════════════════════════════════════════

/** アイコン（core/components/Icon.jsx と同じ形） */
const ICONS = {
  programming: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="m8.5 9.5-3 3 3 3M15.5 9.5l3 3-3 3M13.2 8.5l-2.4 8"/>',
  research: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5M7.5 9h6M7.5 12h4"/>',
  zukan: '<path d="M4 5a2 2 0 0 1 2-2h14v15H6a2 2 0 0 0-2 2z"/><path d="M4 20a2 2 0 0 0 2 2h14v-4M8.5 7.5h7M8.5 11h5"/>',
  quiz: '<rect x="4.5" y="4" width="15" height="17.5" rx="2.5"/><path d="M9 4V2.8h6V4M9.8 10.2a2.3 2.3 0 1 1 3.3 2c-.7.4-1.1.9-1.1 1.6v.4M12 17.4v.1"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.6 1.8M9.5 2.5h5M12 2.5V6M18.4 6.6l1.4-1.4"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9v11h4.5v-6h4v6h4.5V9"/>',
  trophy: '<path d="M7.5 4h9v5.5a4.5 4.5 0 0 1-9 0z"/><path d="M7.5 6H4.5v1.5A3 3 0 0 0 7.6 10.5M16.5 6h3v1.5a3 3 0 0 1-3.1 3M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="m8 12.3 2.7 2.7L16.2 9.5"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
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

// ───────── 1. いちばん上の帯の左はし：アイコンと名前 ─────────
const drawUser = () => {
  const user = app.user;   // ゲストなら null
  const box = $("user-avatar");
  box.replaceChildren();
  if (user?.avatar) {                     // アイコンの画像があるとき
    const img = el("img");
    img.src = user.avatar;
    img.alt = "";
    img.draggable = false;
    box.append(img);
  } else if (user) {                      // 画像がないとき：名前の 1 文字
    box.textContent = [...(user.name ?? "").trim()][0] ?? "?";
  } else {                                // ゲスト：人の形
    box.innerHTML = icon("account");
  }
  $("user-name").textContent = user ? user.name : "ゲスト";
  $("user-sub").textContent = user ? `ID：${user.userId}` : "ログインしていません";
};

// ───────── いちばん上の帯の右はし：累計勉強時間 ─────────
//  アプリ（プログラム学習〜タイマー。ホームはのぞく）を開いていた時間の、これまでの合計
//  （下の「使った時間」と同じ記録。core/storage/usage.js）
const drawStudyTotal = () => {
  const data = app.usage("2000-01-01", "2999-12-31");   // ゲストなら null
  const box = $("study-total");
  box.replaceChildren();
  const min = Math.floor((data?.total ?? 0) / 60);
  const parts = min >= 60 ? [[Math.floor(min / 60), "時間"], [min % 60, "分"]] : [[min, "分"]];
  for (const [n, unit] of parts) box.append(el("b", "", String(n)), unit);
  $("study-total-box").title = data ? `使った日：${data.days} 日` : "";
};

// ───────── いちばん上の帯の右はし：ログイン日数・連続日数 ─────────
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
/** アプリごとの色（id は core/page-list.js と同じ。ここにないアプリは灰色） */
const APP_COLORS = {
  programming: "#2563eb",  // 青
  research: "#0ea5e9",     // 水色
  zukan: "#14b8a6",        // 青緑
  quiz: "#f59e0b",         // 黄
  timer: "#8b5cf6",        // むらさき
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

  // アプリごと（左のサイドバーと同じ、いつも同じ並び順。ホームは計らない。使っていないアプリも 0 で出す）
  const rows = app.pages
    .filter((p) => p.id !== "home")
    .map((p) => ({ ...p, sec: data.apps[p.id] ?? 0, color: APP_COLORS[p.id] ?? "#94a3b8" }));
  const top = rows.reduce((a, r) => (r.sec > a.sec ? r : a), rows[0]);   // いちばん長く使ったアプリ

  // 円グラフ（ドーナツ）：12 時から時計回りに、上の並び順で色をつなぐ
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
      ? `いちばん使ったのは「${top.name}」です。`
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

// ───────── 4. アチーブ（円・ゴールド／シルバー／ブロンズの数・最近手に入れたもの） ─────────
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
    const li = el("li", `home-rarity-row rarity-${r.id}`);   // 色は core/styles/theme.css の .rarity-〇〇
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

  // 最近手に入れた（手に入れたものを全部、新しい順に。2 つ分の高さだけ見せて、残りはスクロールで見る → fitRecent）
  const recent = ALL.filter((a) => a.gotAt).sort((a, b) => (b.gotAt > a.gotAt ? 1 : -1));
  const ul = $("recent");
  ul.replaceChildren();
  if (!recent.length) {
    ul.append(el("li", "home-empty", app.user ? "まだありません。アプリを使ってみましょう！" : "ログインすると、アチーブが記録されます。"));
    return;
  }
  recent.forEach((a) => {
    const li = el("li", `home-ach is-got rarity-${a.rarity}`);   // レア度（core/styles/theme.css の .rarity-〇〇）
    const badge = el("span", "home-ach-badge");
    badge.innerHTML = icon(a.icon);
    const text = el("span", "home-ach-text");
    text.append(el("strong", "", a.name), el("span", "", `${a.appName}・${a.gotAt.slice(5, 10).replace("-", "/")} に取得`));
    li.append(badge, text, el("span", "rarity-label", a.rarityName));   // レア度の名前（枠がレア度の色）
    ul.append(li);
  });
  ul.scrollTop = 0;   // いちばん新しいものが上に見えるように
  fitRecent();
};

/** 「最近手に入れた」の高さを、ちょうど 2 つ分にする（3 つ目からはスクロール。画面の大きさが変わったら直す） */
const RECENT_ROWS = 2;
function fitRecent() {
  const ul = $("recent");
  const items = ul.querySelectorAll(".home-ach");
  ul.classList.toggle("is-scroll", items.length > RECENT_ROWS);
  if (items.length <= RECENT_ROWS) { ul.style.maxHeight = ""; return; }
  const first = items[0], last = items[RECENT_ROWS - 1];
  ul.style.maxHeight = `${last.offsetTop + last.offsetHeight - first.offsetTop}px`;
}
window.addEventListener("resize", fitRecent);
document.fonts?.ready.then(fitRecent);   // 文字の読み込みが終わって高さが変わったときも直す
$("open-achieve").addEventListener("click", () => app.open("achieve"));
$("go-login").addEventListener("click", () => app.open("account"));

// ───────── 4. アプリごとのカード（学習時間・アチーブの円グラフと「開く」ボタン） ─────────
//  app.stats() → [{ app: { id, name, icon }, time: [{ id, name, sec }], stats: [{ id, name, unit, value }], openSec, achieve: { got, total } }]
//  円グラフ 2 つ（学習時間の内訳・アチーブの取得率）、学習時間の内訳の一覧、いちばん下に大事な数を出す。色は APP_COLORS（使った時間のグラフと同じ）
/** 学習時間の内訳の色（アプリの色を、だんだんうすくする。上から順に使う） */
const SHADES = [100, 68, 44, 26, 14];
const shade = (i) => `color-mix(in srgb, var(--app) ${SHADES[i % SHADES.length]}%, var(--surface))`;
/** 円グラフのまん中に出す短い時間（59 分まで → 分、それより長い → 時間） */
const shortTime = (sec) => (sec < 3600 ? [String(Math.floor(sec / 60)), "分"] : [(sec / 3600).toFixed(sec < 36000 ? 1 : 0), "時間"]);

/** 円グラフ（ドーナツ）を作る。parts：[{ value, color, title }]、center：[数, 単位]、caption：下の文字 */
function donut(parts, total, center, caption) {
  const R = 38, LEN = 2 * Math.PI * R;
  let start = 0;
  const arcs = total > 0 ? parts.filter((p) => p.value > 0).map((p) => {
    const len = (p.value / total) * LEN;
    const arc = `<circle cx="50" cy="50" r="${R}" style="stroke:${p.color}" stroke-dasharray="${len} ${LEN - len}" stroke-dashoffset="${-start}"><title></title></circle>`;
    start += len;
    return arc;
  }).join("") : "";
  const fig = el("figure", "home-donut");
  const pie = el("div", "home-donut-pie");
  pie.innerHTML = `<svg viewBox="0 0 100 100"><circle class="home-donut-track" cx="50" cy="50" r="${R}"/>${arcs}</svg>`;
  parts.filter((p) => p.value > 0).forEach((p, i) => { pie.querySelectorAll("title")[i].textContent = p.title; });   // マウスを乗せると出る
  const mid = el("span", "home-donut-center");
  mid.append(el("b", "", center[0]), el("small", "", center[1]));
  pie.append(mid);
  fig.append(pie, el("figcaption", "", caption));
  return fig;
}

/** 学習時間の内訳の円グラフ（home_setting の time。まだ記録がなければ灰色の輪） */
function studyDonut(time) {
  const total = time.reduce((a, t) => a + t.sec, 0);
  const parts = time.map((t, i) => ({ value: t.sec, color: shade(i), title: `${t.name}：${timeText(t.sec)}` }));
  return donut(parts, total, total > 0 ? shortTime(total) : ["0", "分"], "学習時間");
}

/** アチーブの取得率の円グラフ（手に入れた数 / そのアプリのアチーブの数） */
function achieveDonut({ got, total }) {
  const rate = total ? got / total : 0;
  return donut([{ value: got, color: "var(--app)", title: `${got} / ${total} こ` }], total, [String(Math.round(rate * 100)), "%"], `アチーブ ${got}/${total}`);
}

/** 学習時間の内訳の一覧（色・名前・時間。まだ記録がない種類は —） */
function studyLegend(time, openSec) {
  const ul = el("ul", "home-donut-legend");
  time.forEach((t, i) => {
    const li = el("li");
    const dot = el("i");
    dot.style.background = shade(i);
    li.append(dot, el("span", "", t.name), el("b", "", t.sec > 0 ? timeText(t.sec) : "—"));
    ul.append(li);
  });
  ul.title = `このアプリを開いていた時間：${openSec > 0 ? timeText(openSec) : "0分"}`;   // マウスを乗せると出る
  return ul;
}

const drawApps = () => {
  const box = $("app-cards");
  box.replaceChildren();
  for (const { app: a, time, stats, openSec, achieve } of app.stats()) {
    const card = el("section", "panel home-app");   // 1 アプリ 1 枚のカード（上の枠と同じ見た目）
    card.style.setProperty("--app", APP_COLORS[a.id] ?? "var(--primary)");

    const head = el("div", "home-app-head");
    const ic = el("span", "home-app-icon");
    ic.innerHTML = icon(a.icon);
    const open = el("button", "home-link", "開く ›");
    open.type = "button";
    open.addEventListener("click", () => app.open(a.id));
    head.append(ic, el("span", "home-app-name", a.name), open);
    card.append(head);

    // 円グラフ 2 つ：学習時間の内訳 ｜ アチーブの取得率
    const charts = el("div", "home-app-charts");
    charts.append(studyDonut(time), achieveDonut(achieve));
    // 円グラフ 2 つと、学習時間の内訳（カードの大きさに合わせて、横か縦に並べる。CSS）
    const body = el("div", "home-app-body");   // この枠の大きさに合わせて、円グラフの大きさ・並べ方が変わる（CSS）
    const inner = el("div", "home-app-body-in");
    inner.append(charts, studyLegend(time, openSec));
    body.append(inner);
    card.append(body);

    // いちばん下：大事な数（home_setting の stats）。上の帯の「ログイン 1 日」と同じ形で、線で区切って横に並べる
    if (stats.length) {
      const row = el("ul", "home-app-stats");
      for (const x of stats) {
        const li = el("li");
        li.append(el("span", "", x.name), el("b", "", x.value.toLocaleString()), el("small", "", x.unit));
        li.title = `${x.name}：${x.value.toLocaleString()} ${x.unit}`;   // 名前が切れたときも、マウスを乗せると全部見える
        row.append(li);
      }
      card.append(row);
    }
    box.append(card);
  }
};

// ───────── はじめに描く・変わったら描き直す ─────────
const drawAll = () => { drawUser(); drawLogin(); drawStudyTotal(); drawUsage(); drawAchieve(); drawApps(); };
drawAll();
app.onLoginDaysChange(drawAll);          // ログインした日・ログインしている人が変わったとき
app.onUsageChange(() => { drawUsage(); drawStudyTotal(); drawApps(); });   // 使った時間の記録が増えたとき（30 秒ごとなど）
app.onAchievementsChange(() => { drawAchieve(); drawApps(); });   // ホームを開いているあいだにアチーブを手に入れたとき
app.onUserChange(drawUser);              // 名前・アイコンを変えたとき（アカウント → プロフィール）
app.onStatsChange(drawApps);             // 学習時間・大事な数が変わったとき
