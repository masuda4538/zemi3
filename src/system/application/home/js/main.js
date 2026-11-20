// ═══════════════════════════════════════════════════════════════
//  ホーム：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//    要素は $("id") で探す（document.getElementById の短い書き方。下で作っている）
//    app.user                   ログインしている人 { name, userId, avatar（画像。なければ ""） }（ゲストのときは null）
//    app.onUserChange(関数)     ログインしている人・名前・アイコンが変わったら呼ぶ
//    app.loginDays()            ログインした日 { days: ["2026-11-10", …], total, streak, best }（ゲストなら null）
//    app.usage(from, to)        その間にアプリを開いていた時間 { total: 秒, apps: { quiz: 秒, … }, days }（ゲストなら null）
//    app.open("records")        ほかのページを開く
//
//  ★ 書きかえやすいところ
//    drawUser    … いちばん上の帯の左はしの、アイコンと名前
//    drawLogin   … いちばん上の帯の、ログイン日数・連続日数
//    greet       … ホームを開いたときの、スタッピーのあいさつ（スタッピーのふきだし。GREETS で言葉を変えられる）
//    drawScene   … 広場の空（時間帯で 朝・昼・夕方・夜 の色に。1 分ごとに見直す）
//    奥ゆき      … マウスを動かすと、空・奥の丘・手前の丘・草・スタッピーが べつべつの速さで ずれる（--px・--py。css で使う）
//    drawRecords … 左下の札（今日／今週／これまでの時間・「記録を見る」ボタン）と、スタッピーのひとこと
//    広場        … フレンドが歩きまわる（js/plaza.js。★ 今は pages/friends/friends-sample.js の仮のフレンドで、見た目だけ）
//    スタッピー … いちばん下の mountCharacter（言葉は src/system/character/lines.js で変えられる）
//                 マウスのほうへ体を向ける・近づくとよろこぶ（follow）、つかんで投げられる（grab）、丘の上をとことこ（stroll）、
//                 ホームの画面の中をおさんぽ（roam）、時間帯・今日の学習時間でしゃべる（talk）
//  くわしい記録（グラフ）は、左のサイドバーの「記録」のページ（src/system/pages/records）で見る
//  スタッピー（キャラクター）は src/system/character/ にまとめてある（絵・動き・なでる・ことば）。ここでは置く場所とふきだしだけ決める
// ═══════════════════════════════════════════════════════════════
import { mountCharacter } from "../../../character/character.js";   // スタッピー（src/system/character）
import { mountPlaza } from "./plaza.js";                              // 広場のフレンド（★ 今は見た目のイメージだけ）
import { FRIENDS_SAMPLE } from "../../../pages/friends/friends-sample.js";   // 仮のフレンド（フレンドのページと同じ）

/** アイコン（core/components/Icon.jsx と同じ形。ゲストのときのアイコンに使う） */
const ICONS = {
  account: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
};
const icon = (name) => `<svg class="home-icon" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] ?? ICONS.account}</svg>`;

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

// ───────── 共通：時間の書き方 ─────────
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

// ───────── 広場の空（時間帯で色が変わる。css の .home-records-chara[data-time]） ─────────
/** 時間帯（[はじまりの時, 名前]）：5 時〜朝、10 時〜昼、16 時〜夕方、19 時〜夜 */
const SKY_TIMES = [[0, "night"], [5, "morning"], [10, "day"], [16, "evening"], [19, "night"]];
const drawScene = () => {
  const hour = new Date().getHours();
  $("records-chara").dataset.time = SKY_TIMES.filter(([h]) => hour >= h).at(-1)[1];
};

// ───────── 左下の札：今日・今週・これまでの時間（くわしいグラフは記録のページで） ─────────
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

// ───────── 広場のフレンド（★ 今は仮のフレンドで、見た目のイメージだけ。js/plaza.js） ─────────
mountPlaza({ scene: $("records-chara"), layer: $("plaza-friends"), friends: FRIENDS_SAMPLE });
$("plaza-count").textContent = `フレンド ${FRIENDS_SAMPLE.length}人・オンライン ${FRIENDS_SAMPLE.filter((f) => f.online).length}人`;

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
const drawAll = () => { drawUser(); drawLogin(); drawRecords(); };
drawAll();
drawScene();
setInterval(drawScene, 60 * 1000);   // 時間帯が変わったら、空の色も変える
greet();                             // ホームを開いたときのあいさつ
app.onLoginDaysChange(drawAll);          // ログインした日・ログインしている人が変わったとき
app.onUsageChange(() => { if (!greetTimer) drawRecords(); });   // 使った時間の記録が増えたとき（30 秒ごとなど。あいさつ中は待つ）
app.onUserChange(drawUser);              // 名前・アイコンを変えたとき（アカウント → プロフィール）
