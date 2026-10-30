// ═══════════════════════════════════════════════════════════════
//  ホーム：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  main.html の <script type="module" src="./js/main.js"> で読まれています。
//    要素は $("id") で探す（document.getElementById の短い書き方。下で作っている）
//    app.user                   ログインしている人（app.user.name で名前）
//    app.pages                  左に並ぶページの一覧 / app.open("quiz") でそのページを開く
//    app.achievements()         すべてのアチーブ（手に入れた日時 gotAt・今の数 now つき）
//    app.notify({ … })          右上のお知らせ
//
//  ★ 書きかえやすいところ
//    drawToday … 上の「今日は何の日」に出すもの（祝日は holidaysOf で計算）
//    NEWS … お知らせの一覧（新しいものを上に足す）
//    TIPS … 今日のヒントの一覧
//    APP_TEXT … アプリのボタンに出す説明
// ═══════════════════════════════════════════════════════════════

/** お知らせ（新しいものを上に書く） */
const NEWS = [
  { date: "2026-10-30", title: "ホーム画面ができました", text: "アプリへのボタン・アチーブ・お知らせが見られるようになりました。" },
  { date: "2026-10-29", title: "数をためるアチーブ", text: "「10 回正解」のように、数をためると手に入るアチーブが作れるようになりました。" },
  { date: "2026-10-28", title: "設定をファイルに保存", text: "テーマやショートカットが、アプリを閉じても残るようになりました。" },
];

/** 今日のヒント（日付で 1 つ選ぶ。「次のヒント」で次へ） */
const TIPS = [
  "Ctrl + 1〜5 で、ホームや各アプリをすぐに開けます。",
  "Ctrl + B で、左のサイドバーを隠して画面を広く使えます。",
  "Ctrl + Shift + D で、ホワイトとダークを切り替えられます。",
  "ショートカットは「設定」→「キーボード」で自分の好きなキーにできます。",
  "アイコンの画像は「アカウント」→「プロフィール」で変えられます。",
  "ログイン画面でパスワードを「表示」にすると、猫が見ないようにしてくれます。",
  "アチーブは、各アプリを使っていると手に入ります。ホームから進み具合を確認できます。",
];

/** アプリのボタンに出す説明（id は main/apps.js と同じ） */
const APP_TEXT = {
  programming: "プログラムの書き方を学ぶ",
  research: "気になることを調べて集める",
  zukan: "見つけたものを図鑑にまとめる",
  quiz: "問題を作って、解いてためす",
};

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
const DAY = 24 * 60 * 60 * 1000;   // 1 日のミリ秒
/** 2 つの日付の間が何日か（時刻は見ない） */
const daysBetween = (a, b) =>
  Math.round((new Date(b.getFullYear(), b.getMonth(), b.getDate()) - new Date(a.getFullYear(), a.getMonth(), a.getDate())) / DAY);
const dateKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
const SEASON = ["冬", "冬", "春", "春", "春", "夏", "夏", "夏", "秋", "秋", "秋", "冬"];   // 1 月〜12 月

/** その年の日本の祝日 { "2026-11-3": "文化の日", … }（インターネットを使わず、計算で出す） */
const holidayCache = {};
function holidaysOf(y) {
  if (holidayCache[y]) return holidayCache[y];
  const list = {};
  const add = (m, d, name) => { list[`${y}-${m}-${d}`] = name; };
  // m 月の n 回目の月曜日が何日か（ハッピーマンデー）
  const monday = (m, n) => 1 + ((8 - new Date(y, m - 1, 1).getDay()) % 7) + (n - 1) * 7;
  // 春分・秋分の日（国立天文台の計算に近い式。2099 年まで使える）
  const b = y - 1980, leap = Math.floor(b / 4);

  add(1, 1, "元日");          add(1, monday(1, 2), "成人の日");
  add(2, 11, "建国記念の日"); add(2, 23, "天皇誕生日");
  add(3, Math.floor(20.8431 + 0.242194 * b - leap), "春分の日");
  add(4, 29, "昭和の日");     add(5, 3, "憲法記念日"); add(5, 4, "みどりの日"); add(5, 5, "こどもの日");
  add(7, monday(7, 3), "海の日");   add(8, 11, "山の日");
  add(9, monday(9, 3), "敬老の日"); add(9, Math.floor(23.2488 + 0.242194 * b - leap), "秋分の日");
  add(10, monday(10, 2), "スポーツの日");
  add(11, 3, "文化の日");     add(11, 23, "勤労感謝の日");

  const base = { ...list };
  const shift = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  // 国民の休日：祝日と祝日にはさまれた日（9 月によくある）
  for (let d = new Date(y, 0, 1); d.getFullYear() === y; d = shift(d, 1)) {
    if (!base[dateKey(d)] && d.getDay() !== 0 && base[dateKey(shift(d, -1))] && base[dateKey(shift(d, 1))]) list[dateKey(d)] = "国民の休日";
  }
  // 振替休日：祝日が日曜日なら、そのあとの祝日でない日がお休み
  Object.keys(base).forEach((k) => {
    const [, m, dd] = k.split("-").map(Number);
    let d = new Date(y, m - 1, dd);
    if (d.getDay() !== 0) return;
    do d = shift(d, 1); while (list[dateKey(d)]);
    if (d.getFullYear() === y) list[dateKey(d)] = "振替休日";
  });
  return (holidayCache[y] = list);
}
const holidayOf = (d) => holidaysOf(d.getFullYear())[dateKey(d)];

/** 今日より後で、いちばん近い祝日 { date, name } */
function nextHoliday(today) {
  for (let i = 1; i <= 400; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
    const name = holidayOf(d);
    if (name) return { date: d, name };
  }
  return null;
}

// ───────── 1. 今日の情報（左：時計　右：今日は何の日） ─────────
// 「今日は何の日」は日付が変わったときだけ書きかえる
const drawToday = (d) => {
  const y = d.getFullYear(), m = d.getMonth() + 1;
  $("date").textContent = `${y}年${m}月${d.getDate()}日（${WEEK[d.getDay()]}）`;

  // 今日：曜日と、祝日・お休み・平日、季節
  const holiday = holidayOf(d);
  const kind = holiday ? `祝日（${holiday}）` : d.getDay() === 0 || d.getDay() === 6 ? "お休みの日" : "平日";
  $("today-week").textContent = `${WEEK[d.getDay()]}曜日`;
  $("today-kind").textContent = `${kind}・${SEASON[m - 1]}`;

  // 今年：何日目か、あと何日か（バーで進み具合）
  const yearDays = daysBetween(new Date(y, 0, 1), new Date(y + 1, 0, 1));
  const nth = daysBetween(new Date(y, 0, 1), d) + 1;
  $("year-day").textContent = `${nth} 日目`;
  $("year-left").textContent = `あと ${yearDays - nth} 日（${Math.round((nth / yearDays) * 100)}%）`;
  $("year-bar").style.width = `${(nth / yearDays) * 100}%`;

  // 今月：月末まであと何日か
  const last = new Date(y, m, 0).getDate();   // 次の月の「0 日」＝ この月の最後の日
  $("month-left").textContent = last === d.getDate() ? "今日が最後の日" : `あと ${last - d.getDate()} 日`;
  $("month-end").textContent = `${m}月は${last}日まで`;

  // 次の祝日
  const next = nextHoliday(d);
  $("holiday-name").textContent = next ? next.name : "—";
  $("holiday-when").textContent = next
    ? `${next.date.getMonth() + 1}月${next.date.getDate()}日（${WEEK[next.date.getDay()]}）・あと ${daysBetween(d, next.date)} 日`
    : "";
};

let shownDay = "";
const updateTime = () => {
  const d = new Date();
  $("clock").textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  if (dateKey(d) !== shownDay) { shownDay = dateKey(d); drawToday(d); }   // 夜中の 0 時をこえたら書きかえる
};
updateTime();
setInterval(updateTime, 1000);   // 1 秒ごとに時計を進める

// ───────── 2. アプリのボタン ─────────
const drawApps = (all) => {
  const box = $("apps");
  box.replaceChildren();
  app.pages.filter((p) => p.id !== "home").forEach((p) => {
    const mine = all.filter((a) => a.appId === p.id);   // このアプリのアチーブ
    const btn = el("button", "home-app");
    btn.type = "button";
    btn.innerHTML = `<span class="home-app-icon">${icon(p.id)}</span>`;
    const text = el("span", "home-app-text");
    text.append(el("strong", "", p.name), el("span", "", APP_TEXT[p.id] ?? ""));
    btn.append(text);
    if (mine.length) btn.append(el("span", "home-app-badge", `${mine.filter((a) => a.gotAt).length} / ${mine.length}`));
    btn.title = `${p.name}を開く`;
    btn.addEventListener("click", () => app.open(p.id));
    box.append(btn);
  });
};

// ───────── 3. アチーブ ─────────
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

  // 最近手に入れた（新しい順に 3 つ）
  const recent = ALL.filter((a) => a.gotAt).sort((a, b) => (b.gotAt > a.gotAt ? 1 : -1)).slice(0, 3);
  fillList($("recent"), recent, (a) => `${a.gotAt.slice(5, 10).replace("-", "/")} に取得`, "まだありません。アプリを使ってみましょう！", true);

  // もう少しで手に入る（数をためるアチーブで、進んでいる順に 2 つ）
  const near = ALL
    .filter((a) => a.goal && !a.gotAt)
    .sort((a, b) => b.now / b.goal - a.now / a.goal)
    .slice(0, 2);
  fillList($("near"), near, (a) => `${a.now} / ${a.goal}`, "数をためるアチーブはありません。", false);

  drawApps(ALL);
};

// アチーブの一覧の 1 行
function fillList(ul, list, sub, empty, got) {
  ul.replaceChildren();
  if (!list.length) { ul.append(el("li", "home-empty", empty)); return; }
  list.forEach((a) => {
    const li = el("li", `home-ach${got ? " is-got" : ""}`);
    const badge = el("span", "home-ach-badge");
    badge.innerHTML = icon(got ? a.icon : "trophy");
    const text = el("span", "home-ach-text");
    text.append(el("strong", "", a.name), el("span", "", `${a.appName}・${sub(a)}`));
    li.append(badge, text);
    if (!got && a.goal) {
      const bar = el("span", "home-ach-bar");
      const fill = el("span", "home-ach-fill");
      fill.style.width = `${(a.now / a.goal) * 100}%`;
      bar.append(fill);
      text.append(bar);
    }
    ul.append(li);
  });
}

drawAchieve();
app.onAchievementsChange(drawAchieve);   // ホームを開いているあいだに手に入れたら、すぐ反映
$("open-achieve").addEventListener("click", () => app.open("achieve"));

// ───────── 4. お知らせ ─────────
const news = $("news");
NEWS.forEach((n) => {
  const li = el("li", "home-news-item");
  li.append(el("time", "home-news-date", n.date.slice(5).replace("-", "/")));
  const text = el("div", "home-news-text");
  text.append(el("strong", "", n.title), el("p", "", n.text));
  li.append(text);
  news.append(li);
});

// ───────── 5. 今日のヒント（日付で決める → 「次のヒント」で次へ） ─────────
const d = new Date();
let tip = (d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate()) % TIPS.length;
const showTip = () => { $("tip").textContent = TIPS[tip]; };
showTip();
$("next-tip").addEventListener("click", () => { tip = (tip + 1) % TIPS.length; showTip(); });
