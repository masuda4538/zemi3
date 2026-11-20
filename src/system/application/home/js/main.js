// ═══════════════════════════════════════════════════════════════
//  ホーム：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//    要素は $("id") で探す（document.getElementById の短い書き方。下で作っている）
//    app.user                   ログインしている人 { name, userId, avatar（画像。なければ ""） }（ゲストのときは null）
//    app.onUserChange(関数)     ログインしている人・名前・アイコンが変わったら呼ぶ
//    app.loginDays()            ログインした日 { days: ["2026-11-10", …], total, streak, best }（ゲストなら null）
//    app.usage(from, to)        その間にアプリを開いていた時間 { total: 秒, apps: { quiz: 秒, … }, days }（ゲストなら null）
//    app.achievements()         すべてのアチーブ（手に入れた日時 gotAt・今の数 now・レア度 rarity つき）
//    app.pages                  左に並ぶアプリの一覧 [{ id, name }]
//    app.open("records")        ほかのページを開く
//
//  ★ 書きかえやすいところ
//    drawUser    … いちばん上の帯の左はしの、アイコンと名前
//    drawLogin   … いちばん上の帯の、ログイン日数・連続日数
//    greet       … ホームを開いたときの、スタッピーのあいさつ（記録のカードのふきだし。GREETS で言葉を変えられる）
//    drawScene   … 記録のカードの空（時間帯で 朝・昼・夕方・夜 の色に。1 分ごとに見直す）
//    奥ゆき      … マウスを動かすと、空・奥の丘・手前の丘・草・スタッピーが べつべつの速さで ずれる（--px・--py。css で使う）
//    drawApps    … アプリを開くカード（APP_DESC がカードの説明、APP_COLORS が色）
//    drawAchieve … アチーブ（円・レア度ごとの数・最近手に入れたもの。2 つ分の高さで、残りはスクロール）
//    drawRecords … 「記録」へのカード（スタッピーのひとこと・今日／今週／これまでの時間・「記録を見る」ボタン）
//    スタッピー … いちばん下の mountCharacter（言葉は src/system/character/lines.js で変えられる）
//                 2 匹とも：マウスのほうへ体を向ける・近づくとよろこぶ（follow）、いろいろな動き、時間帯・今日の学習時間でしゃべる（talk）
//                 上の帯の子だけ：しばらくさわらないと、ホームの画面の中をおさんぽして、もとの場所に帰る（roam）
//  くわしい記録（グラフ）は、左のサイドバーの「記録」のページ（src/system/pages/records）で見る
//  スタッピー（キャラクター）は src/system/character/ にまとめてある（絵・動き・なでる・ことば）。ここでは置く場所とふきだしだけ決める
// ═══════════════════════════════════════════════════════════════
import { mountCharacter } from "../../../character/character.js";   // スタッピー（src/system/character）

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
  records: '<path d="M4 3.5v16.5h16.5"/><path d="M8.5 16.5v-4.5M12.5 16.5V8M16.5 16.5v-6.5"/>',
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

const pad = (n) => String(n).padStart(2, "0");
/** 日付の形（2026-11-03）。app.loginDays() の days・app.usage() と同じ */
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

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

// ───────── 共通：色と時間の書き方 ─────────
/** アプリごとの色（id は core/page-list.js と同じ。記録のページ src/system/pages/records/main.jsx と同じ色） */
const APP_COLORS = {
  programming: "#2563eb",  // 青
  research: "#0ea5e9",     // 水色
  zukan: "#14b8a6",        // 青緑
  quiz: "#f59e0b",         // 黄
  timer: "#8b5cf6",        // むらさき
};

/** アプリを開くカードの説明（ひとこと） */
const APP_DESC = {
  programming: "プログラムを書いて学ぶ",
  research: "調べたことを集める",
  zukan: "自分だけの図鑑を作る",
  quiz: "問題を作って解く",
  timer: "時間を計って集中する",
};

/** 秒を「1時間23分」「12分」「40秒」の形にする */
function timeText(sec) {
  const s = Math.round(sec);
  if (s < 60) return `${s}秒`;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h ? `${h}時間${m ? `${m}分` : ""}` : `${m}分`;
}

/** 今日・今週（月曜日から）・これまで の使った時間（秒）。ゲストなら null */
function studyTimes() {
  const t = new Date();
  const today = dayKey(t);
  const monday = dayKey(new Date(t.getFullYear(), t.getMonth(), t.getDate() - ((t.getDay() + 6) % 7)));
  const all = app.usage("2000-01-01", "2999-12-31");
  if (!all) return null;
  return {
    today: app.usage(today, today).total,
    week: app.usage(monday, today).total,
    all: all.total,
  };
}

// ───────── スタッピーのあいさつ（ホームを開いたとき。記録のカードのふきだしに 5 秒出して、いつもの言葉にもどる） ─────────
/** 時間ごとのあいさつ（[はじまりの時, ことば]。上から順に見て、いちばん最後に当てはまったもの） */
const GREETS = [
  [0, "こんばんは"],
  [5, "おはよう"],
  [11, "こんにちは"],
  [18, "こんばんは"],
];
let greetTimer = 0;
const greet = () => {
  const hour = new Date().getHours();
  const hello = GREETS.filter(([h]) => hour >= h).at(-1)[1];
  const user = app.user;
  const times = studyTimes();
  const line = !user ? "ログインすると、学んだ記録が残るよ。"
    : times.today > 0 ? `今日は ${timeText(times.today)} 学んだね。その調子！`
    : "今日もいっしょに学ぼう！";
  pop($("records-bubble"), `${user ? `${hello}、${user.name} さん！` : `${hello}！`}\n${line}`);   // \n のところで改行
  clearTimeout(greetTimer);
  greetTimer = setTimeout(() => { greetTimer = 0; drawRecords(); }, 5000);
};

// ───────── 記録のカードの空（時間帯で色が変わる。css の .home-records-chara[data-time]） ─────────
/** 時間帯（[はじまりの時, 名前]）：5 時〜朝、10 時〜昼、16 時〜夕方、19 時〜夜 */
const SKY_TIMES = [[0, "night"], [5, "morning"], [10, "day"], [16, "evening"], [19, "night"]];
const drawScene = () => {
  const hour = new Date().getHours();
  $("records-chara").dataset.time = SKY_TIMES.filter(([h]) => hour >= h).at(-1)[1];
};

// ───────── 2. アプリを開くカード（アイコン・名前・ひとこと。カードを押すと開く） ─────────
const drawApps = () => {
  const box = $("app-cards");
  box.replaceChildren();
  for (const p of app.pages.filter((p) => p.id !== "home")) {
    const card = el("button", "panel home-app");
    card.type = "button";
    card.style.setProperty("--app", APP_COLORS[p.id] ?? "var(--primary)");
    card.addEventListener("click", () => app.open(p.id));
    const ic = el("span", "home-app-icon");
    ic.innerHTML = icon(p.id);
    const text = el("span", "home-app-text");
    text.append(el("strong", "home-app-name", p.name), el("span", "home-app-desc", APP_DESC[p.id] ?? ""));
    card.append(ic, text, el("span", "home-app-go", "›"));
    box.append(card);
  }
};

// ───────── 4. 「記録」へのカード（左下。くわしいグラフは記録のページで） ─────────
const drawRecords = () => {
  const times = studyTimes();   // ゲストなら null
  const info = app.loginDays();
  $("records-nums").hidden = !times;
  $("open-records").textContent = times ? "記録を見る" : "ログインする";
  if (!times) {
    $("records-bubble").textContent = "ログインすると、学んだ時間を\nぼくが記録しておくよ！";
    return;
  }
  $("rec-today").textContent = timeText(times.today);
  $("rec-week").textContent = timeText(times.week);
  $("rec-all").textContent = timeText(times.all);
  // スタッピーのひとこと（今週の時間・連続ログインで変わる）
  $("records-bubble").textContent =
    times.week <= 0 ? "今週はまだ記録がないよ。\nいっしょにはじめよう！"
    : info?.streak >= 3 ? `${info.streak} 日連続ログイン中！\n今週は ${timeText(times.week)} がんばったね。`
    : `今週は ${timeText(times.week)} がんばったね！\n記録を見てみよう。`;   // \n のところで改行
};
$("open-records").addEventListener("click", () => app.open(app.user ? "records" : "account"));

// ───────── 3. アチーブ（右下）（円・ゴールド／シルバー／ブロンズの数・最近手に入れたもの） ─────────
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

  // 最近手に入れた（手に入れたものを全部、新しい順に。アチーブの枠の残りの高さに見えるだけ出して、残りはスクロールで見る → fitRecent）
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

/** 「最近手に入れた」の高さ：アチーブの枠の残りいっぱい（css/style.css）。いちばん低くても 2 つ分は見えるようにする
 *  入りきらないときはスクロール（is-scroll で右に少しすき間をあける）。画面の大きさが変わったら直す */
const RECENT_ROWS = 2;
function fitRecent() {
  const ul = $("recent");
  const items = ul.querySelectorAll(".home-ach");
  const last = items[Math.min(items.length, RECENT_ROWS) - 1];
  ul.style.minHeight = last ? `${last.offsetTop + last.offsetHeight - items[0].offsetTop}px` : "";
  ul.classList.toggle("is-scroll", ul.scrollHeight > ul.clientHeight + 1);
}
window.addEventListener("resize", fitRecent);
document.fonts?.ready.then(fitRecent);   // 文字の読み込みが終わって高さが変わったときも直す
$("open-achieve").addEventListener("click", () => app.open("achieve"));
$("go-login").addEventListener("click", () => app.open("account"));

// ───────── スタッピー（なでる・押す・自分から動く。くわしくは src/system/character/character.js） ─────────
/** ふきだしの言葉を変えて、ぽんと出す */
function pop(node, text) {
  node.textContent = text;
  node.classList.remove("is-pop");
  void node.offsetWidth;   // いったん描き直させる（同じアニメーションをもう一度始めるため）
  node.classList.add("is-pop");
}
/** スタッピーがしゃべる言葉（今日の学習時間に合わせる。時間帯の言葉は character の lines.js が足す） */
const studyTalk = () => {
  const t = studyTimes();   // ゲストなら null
  if (!t) return ["ログインすると、学んだ時間をおぼえておくよ！"];
  if (t.today <= 0) return ["今日はまだ勉強していないね。いっしょにはじめよう！"];
  if (t.today >= 3600) return [`今日は ${timeText(t.today)} も学んだね！すごい！`];
  return [`今日は ${timeText(t.today)} 学んだね！その調子！`];
};
/** なでたとき：ホームのアチーブ（achieve_setting/home.js）。はじめて → pet-1、合計 100 回 → pet-100 */
const onPet = () => { app.unlock("pet-1"); app.addProgress("pet-100"); };
// 記録へのカードのスタッピー（跳ねる姿・ぴょんぴょん・かげつき）：記録のふきだしが変わる
//   follow … マウスのほうを向く（立体的にかたむく）・近づくとよろこぶ
//   grab   … マウスでつかんで投げられる（重力で落ちて、地面でぽよんとはねる。止まったら歩いて丘に帰る）
//   stroll … 丘の上をとことこ歩く（ふきだしもいっしょ。右に寄ったら、ふきだしは左がわに出す）
//            rise … 奥へ歩ける高さ（px）。奥へ行くほど上に・小さく見える（css の --depth）
//   roam   … しばらくさわらないと、ホームの画面の中をおさんぽ（歩くときは小さめ。帰ってくるまで、ふきだしはかくす）
mountCharacter($("chara-records"), {
  pose: "jump", motion: "hop", shadow: true, follow: true, grab: true, roam: true, roamHeight: 110, talk: studyTalk,
  stroll: { area: $("records-chara"), mover: $("records-walker"), rise: 36, onMove: (r) => $("records-bubble").classList.toggle("is-left", r > 0.55) },
  onRoam: (on) => $("records-bubble").classList.toggle("is-away", on),
  onSay: (t) => { clearTimeout(greetTimer); greetTimer = 0; pop($("records-bubble"), t); },
  onRestore: () => drawRecords(), onPet,
});

// ───────── 奥ゆき：マウスの位置（-1〜1）を記録のカードの空に わたす。css が、遠いものほど少し・近いものほど大きく ずらす ─────────
const scene = $("records-chara");
let depthFrame = 0;
const setDepth = (px, py) => { scene.style.setProperty("--px", px.toFixed(3)); scene.style.setProperty("--py", py.toFixed(3)); };
document.addEventListener("pointermove", (e) => {
  if (depthFrame || document.documentElement.classList.contains("reduce-motion")) return;   // 「動きを少なくする」のときは ずらさない
  depthFrame = requestAnimationFrame(() => {
    depthFrame = 0;
    const r = scene.getBoundingClientRect();
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    setDepth(clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)), clamp((e.clientY - (r.top + r.height / 2)) / (window.innerHeight / 2)));
  });
});
document.addEventListener("pointerout", (e) => { if (!e.relatedTarget) setDepth(0, 0); });   // 画面の外へ出たら もとに

// ───────── はじめに描く・変わったら描き直す ─────────
const drawAll = () => { drawUser(); drawLogin(); drawApps(); drawAchieve(); drawRecords(); };
drawAll();
drawScene();
setInterval(drawScene, 60 * 1000);   // 時間帯が変わったら、空の色も変える
greet();                             // ホームを開いたときのあいさつ
app.onLoginDaysChange(drawAll);          // ログインした日・ログインしている人が変わったとき
app.onUsageChange(() => { if (!greetTimer) drawRecords(); });   // 使った時間の記録が増えたとき（30 秒ごとなど。あいさつ中は待つ）
app.onAchievementsChange(drawAchieve);   // ホームを開いているあいだにアチーブを手に入れたとき
app.onUserChange(drawUser);              // 名前・アイコンを変えたとき（アカウント → プロフィール）
