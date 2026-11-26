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
//    drawRecords … 右下の札（今日／今週／これまでの時間・「記録を見る」ボタン）と、スタッピーのひとこと
//    広場        … フレンドが歩きまわる（js/plaza.js。★ 今は pages/friends/friends-sample.js の仮のフレンドで、見た目だけ）
//                 まん中に掲示板（勉強時間ランキング）。フレンドもスタッピーも、掲示板の前では立ち止まらない
//    ポスト      … 左下。チャットの通知（だれから来たか）と、フレンド申請 だけを受け取る（js/mailbox.js。★ フレンドは仮の人たち）
//    openFriend  … 広場のカードの「くわしく見る」・ポストの送った人 → フレンドのページの「フレンド詳細」へ
//    openChat    … ポストのチャットの通知・広場の吹き出し → フレンドのページの その人とのチャットへ
//    2 つの広場  … 最初は お気に入りの広場（plazaFav。噴水・観覧車・ジェットコースター・スタッピー）、
//                 右どなりは そのほかの広場（plazaOther。花ばたけ）。showPlaza(0 ／ 1) で横にすべる
//                 カードの ☆ で お気に入りを切りかえると、その人は となりの広場へ歩いていく
//    吹き出し    … まだ見ていないチャットがあるフレンドの頭の上に「チャットが来たよ！」（いちばん新しいのが問題なら「問題を送ったよ！」。drawBubbles）
//    掲示板      … お気に入りの広場の奥。お気に入りのフレンドと自分の、今週の勉強時間ランキング（js/ranking.js。掲示板の絵は object/board。フレンドの時間は仮）
//    大きい木    … そのほかの広場の奥。フレンドは根もとを よけて歩く（絵は object/tree）
//    スタッピー … いちばん下の mountCharacter（言葉は src/system/object/character/lines.js で変えられる）
//                 マウスのほうへ体を向ける・近づくとよろこぶ（follow）、つかんで投げられる（grab）、丘の上をとことこ（stroll）、
//                 ホームの画面の中をおさんぽ（roam）、時間帯・今日の学習時間でしゃべる（talk）
//  くわしい記録（グラフ）は、左のサイドバーの「記録」のページ（src/system/pages/records）で見る
//  スタッピー（キャラクター）と広場の「もの」は src/system/object/ にまとめてある（絵・動き・見た目）。ここでは置く場所とふきだしだけ決める
// ═══════════════════════════════════════════════════════════════
import { mountCharacter } from "../../../object/character/character.js";   // スタッピー（src/system/object/character）
// 広場の「もの」（絵と見た目。src/system/object）
import { drawPost } from "../../../object/post/post.js";               // 赤い丸ポスト
import { drawWheel } from "../../../object/wheel/wheel.js";            // 観覧車
import { drawCoaster } from "../../../object/coaster/coaster.js";      // ジェットコースター
import { drawTree } from "../../../object/tree/tree.js";               // 大きい木
import { drawFlowerField } from "../../../object/flowers/flowers.js";  // 花ばたけ
import { mountPlaza } from "./plaza.js";                              // 広場のフレンド（★ 今は見た目のイメージだけ）
import { FRIENDS_SAMPLE, RANKING_SAMPLE } from "../../../pages/friends/friends-sample.js";   // 仮のフレンド（フレンドのページと同じ）
import { mountMailbox } from "./mailbox.js";
import { mountRanking } from "./ranking.js";                          // お気に入りの広場の掲示板（今週の勉強ランキング）
import { MAIL_SAMPLE } from "../../../pages/friends/mail-sample.js";   // フレンドから届いたもの（仮のデータ。ここでは フレンド申請だけ使う）
import { unreadChats, markAllRead } from "../../../pages/friends/chat-store.js";   // チャット（まだ見ていないもの）
import { requestFriend, requestChat } from "../../../pages/friends/open-friend.js";   // フレンドのページの「フレンド詳細」「チャット」を開く
import { loadFavorites, toggleFavorite } from "../../../pages/friends/favorites.js";   // お気に入りのフレンド（その PC の中に覚えておく）

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
  const time = SKY_TIMES.filter(([h]) => hour >= h).at(-1)[1];
  // 2 つの広場と、ホーム全体（ポストの色に使う）に付ける
  for (const el of [$("records-chara"), $("plaza-2"), document.querySelector(".home")]) el.dataset.time = time;
};

// ───────── 右下の札：今日・今週・これまでの時間（くわしいグラフは記録のページで） ─────────
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

// ───────── 広場の「もの」を置く（絵は src/system/object。置く場所と大きさは css/style.css） ─────────
drawPost($("mailbox-post"));
drawWheel($("plaza-wheel"));
drawCoaster($("plaza-coaster"));
const tree = drawTree($("plaza-tree"));                // { svg, foot }：根もとを、フレンドが よける
drawFlowerField($("flowerbed"), { count: 120, path: true });

// ───────── スタッピー（なでる・押す・自分から動く。くわしくは src/system/object/character/character.js） ─────────
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
//            avoid … 立ち止まらない場所（まん中の掲示板と、左下のポスト）。通りすぎるときは、掲示板の前に見える
//   roam   … しばらくさわらないと、ホームの画面の中をおさんぽ（歩くときは小さめ。帰ってくるまで、ふきだしはかくす）
//   ground … 地面の高さ。おさんぽでは足もとが 丘の地面（画面の下から 5〜38%）の中だけを歩く（空は歩かない）。投げたときも地面に落ちる
mountCharacter($("chara-records"), {
  pose: "jump", motion: "hop", shadow: true, follow: true, grab: true, roam: true, roamHeight: 110, talk: studyTalk,
  ground: () => ({ top: window.innerHeight * 0.62, bottom: window.innerHeight * 0.95 }),
  stroll: { area: $("records-chara"), mover: $("records-walker"), rise: 36, avoid: () => [$("plaza-board").getBoundingClientRect(), $("mailbox-post").getBoundingClientRect()], onMove: (r) => $("records-bubble").classList.toggle("is-left", r > 0.55) },
  onRoam: (on) => $("records-bubble").classList.toggle("is-away", on),
  onSay: (t) => { clearTimeout(greetTimer); greetTimer = 0; pop($("records-bubble"), t); },
  onRestore: () => drawRecords(), onPet,
});

// ───────── フレンド詳細を開く（フレンドのページ。だれを開くかは open-friend.js でメモしてわたす） ─────────
const openFriend = (userId) => { requestFriend(userId); app.open("friends"); };
/** その人とのチャットを開く（フレンドのページ） */
const openChat = (userId) => { requestChat(userId); app.open("friends"); };
const isFriend = (userId) => FRIENDS_SAMPLE.some((f) => f.userId === userId);

// ───────── 広場のフレンド（★ 今は仮のフレンドで、見た目のイメージだけ。js/plaza.js） ─────────
//   お気に入りの人は 最初の広場、そうでない人は となりの広場（お気に入りは favorites.js。その PC の中に覚えておく）
const me = app.user?.userId ?? null;
let favorites = loadFavorites(me);
const plazaOpts = { edge: $("mailbox-post"), onDetail: (f) => openFriend(f.userId), isFavorite: (id) => favorites.has(id), onFavorite: (f) => flipFavorite(f), onBubble: (id) => openBubble(id) };
const plazaFav = mountPlaza({
  ...plazaOpts, scene: $("records-chara"), layer: $("plaza-friends"), empty: $("plaza-empty-1"),
  friends: FRIENDS_SAMPLE.filter((f) => favorites.has(f.userId)), noStop: $("plaza-board"),   // 掲示板の前では立ち止まらない
});
const plazaOther = mountPlaza({
  ...plazaOpts, scene: $("plaza-2"), layer: $("plaza-friends-2"), empty: $("plaza-empty-2"),
  friends: FRIENDS_SAMPLE.filter((f) => !favorites.has(f.userId)),
  fountain: tree.foot, rim: tree.foot,   // 大きい木の根もとを よける（噴水と同じしくみ）
});

// ───────── 掲示板の上のはし：広場の札（左上）の すぐ下。ただし わくの上の アーチの看板が、名前の帯（いちばん上）に かからないように下げる ─────────
//   看板の大きさは 掲示板の大きさで変わるので、置いてから はかって、かかっていたら その分 下げる（2 回 くり返して ととのえる）
const placeBoard = () => {
  const home = document.querySelector(".home");
  const label = document.querySelector(".home-plaza-label").getBoundingClientRect();
  const hero = document.querySelector(".home-hero").getBoundingClientRect();
  let top = Math.round(label.bottom + 14);
  home.style.setProperty("--board-top", `${top}px`);
  for (let i = 0; i < 2; i++) {
    const sign = document.querySelector("#plaza-board .bd-sign")?.getBoundingClientRect();
    const over = sign ? hero.bottom + 10 - sign.top : 0;   // 看板が 帯に かかっている長さ
    if (over <= 0) break;
    top += Math.ceil(over);
    home.style.setProperty("--board-top", `${top}px`);
  }
};
window.addEventListener("resize", placeBoard);

// ───────── 掲示板：今週の勉強時間ランキング（お気に入りのフレンドと自分。js/ranking.js。絵は object/board） ─────────
//   自分は本当の今週の時間（studyTimes）、フレンドは仮の時間（friends-sample.js の weekSec）
const ranking = mountRanking({
  board: $("plaza-board"), format: timeText,
  //   今週の人のならび：お気に入りのフレンド ＋ 仮のメンバー（RANKING_SAMPLE。★ デザイン確認用） ＋ 自分
  //   自分は本当の今週の時間・連続ログイン日数
  getRows: () => {
    const rows = [...FRIENDS_SAMPLE.filter((f) => favorites.has(f.userId)), ...RANKING_SAMPLE].map((f) => ({
      userId: f.userId, name: f.name, color: f.color, sec: f.weekSec ?? 0, streak: f.streak,
    }));
    const times = studyTimes();   // ゲストなら null（ランキングに入らない）
    if (app.user && times) {
      rows.push({
        userId: app.user.userId, name: app.user.name || app.user.userId, color: "#2563eb", me: true,
        sec: times.week, streak: app.loginDays()?.streak ?? 0,
      });
    }
    return rows;
  },
  guestNote: () => (app.user ? "" : "ログインすると、あなたも ランキングに入ります。"),
});
placeBoard();   // 掲示板（看板つき）を かいてから、置く場所を決める
/** お気に入りを切りかえる：その人は 今の広場の右はし（または左はし）へ歩いて出ていき、となりの広場に はしから入ってくる */
function flipFavorite(f) {
  favorites = toggleFavorite(me, f.userId);
  const nowFav = favorites.has(f.userId);
  const [from, to] = nowFav ? [plazaOther, plazaFav] : [plazaFav, plazaOther];
  from.remove(f.userId, nowFav ? "left" : "right");      // お気に入り（左の広場）へは左へ、そのほか（右の広場）へは右へ
  setTimeout(() => { to.add(f, nowFav ? "right" : "left"); drawBubbles(mailbox.list()); }, 400);
  drawPlazaCount();
  ranking.draw();   // お気に入りが変わったので、ランキングも書き直す
  app.notify({ type: "success", title: nowFav ? `${f.name} さんを お気に入りにしました` : `${f.name} さんを お気に入りから外しました`, message: nowFav ? "最初の広場に来ます。" : "となりの広場（そのほか）へ行きます。" });
}
/** 上の札：それぞれの広場の人数と、オンラインの人数 */
function drawPlazaCount() {
  const fav = FRIENDS_SAMPLE.filter((f) => favorites.has(f.userId)).length;
  $("plaza-n-0").textContent = fav;
  $("plaza-n-1").textContent = FRIENDS_SAMPLE.length - fav;
  $("plaza-count").textContent = `オンライン ${FRIENDS_SAMPLE.filter((f) => f.online).length}人`;
}
drawPlazaCount();

// ───────── 2 つの広場の行き来（左右の矢印・上の札・← → キー） ─────────
let plazaNow = 0;   // 0 ＝ お気に入りの広場、1 ＝ そのほかの広場
function showPlaza(n) {
  plazaNow = n;
  $("plaza-track").classList.toggle("is-second", n === 1);
  $("plaza-next").hidden = n === 1;
  $("plaza-prev").hidden = n === 0;
  document.querySelectorAll(".home-plaza-tabs [data-plaza]").forEach((b) => b.setAttribute("aria-selected", String(Number(b.dataset.plaza) === n)));
  plazaFav.closeCard(); plazaOther.closeCard();
}
$("plaza-next").addEventListener("click", () => showPlaza(1));
$("plaza-prev").addEventListener("click", () => showPlaza(0));
document.querySelectorAll(".home-plaza-tabs [data-plaza]").forEach((b) => b.addEventListener("click", () => showPlaza(Number(b.dataset.plaza))));
document.addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea, [contenteditable]") || e.ctrlKey || e.altKey || e.metaKey) return;
  if (e.key === "ArrowRight" && plazaNow === 0) showPlaza(1);
  if (e.key === "ArrowLeft" && plazaNow === 1) showPlaza(0);
});

// ───────── はじめに描く・変わったら描き直す ─────────
const drawAll = () => { drawUser(); drawLogin(); drawRecords(); };
drawAll();
drawScene();
setInterval(drawScene, 60 * 1000);   // 時間帯が変わったら、空の色も変える
greet();                             // ホームを開いたときのあいさつ
app.onLoginDaysChange(() => { drawAll(); ranking.draw(); });          // ログインした日・ログインしている人が変わったとき
app.onUsageChange(() => { if (!greetTimer) drawRecords(); ranking.draw(); });   // 使った時間の記録が増えたとき（30 秒ごとなど。あいさつ中は待つ）
app.onUserChange(drawUser);              // 名前・アイコンを変えたとき（アカウント → プロフィール）

// ───────── 左下のポスト（チャットの通知と フレンド申請。js/mailbox.js） ─────────
//   チャット … まだ見ていないメッセージがある人ごとに 1 つ（pages/friends/chat-store.js の unreadChats から作る）
//   申請     … 仮のデータ（pages/friends/mail-sample.js の フレンド申請だけ）
//   本当の機能を作ったら：届いたときに mailbox.receive(届いたもの) を呼ぶ
//   onReceive … あとから届いたときに、右上にお知らせを出す
function postMails() {
  const chats = unreadChats(app.user?.userId).map(({ friendId, count, last }) => {
    const f = FRIENDS_SAMPLE.find((x) => x.userId === friendId);
    if (!f) return null;
    return {
      id: `chat:${friendId}:${last.id}`, type: "chat", from: { userId: f.userId, name: f.name, color: f.color },
      at: new Date(last.at), count, quiz: last.type === "quiz", read: false,
      text: last.type === "quiz" ? `問題「${last.quiz?.title ?? ""}」を送ってきました`
        : last.type === "code" ? `コード（${last.lang || "その他"}）を送ってきました` : last.text,
    };
  }).filter(Boolean);
  return [...chats, ...MAIL_SAMPLE.filter((m) => m.type === "request")];
}
const mailbox = mountMailbox({
  post: $("mailbox-post"), badge: $("mailbox-badge"), box: $("mailbox"), mails: postMails(), isFriend, onFriend: openFriend,
  onChat: openChat, onAllRead: () => markAllRead(app.user?.userId),
  onChange: (items) => drawBubbles(items),
  onReceive: (m) => app.notify({ type: "info", title: `${m.from.name} さんから${m.type === "chat" ? "チャット" : "フレンド申請"}が届きました`, message: "左下のポストを押すと見られます。" }),
});
app.onUserChange(() => mailbox.setMails(postMails()));   // ログインしている人が変わったら、その人のチャットに
// ★ 本当の機能を作るまでは、receive はまだ呼ばない

// ───────── 吹き出し：まだ見ていないチャットがあるフレンドの頭の上に「チャットが来たよ！」 ─────────
//   いちばん新しいのが問題なら「問題を送ったよ！」。押すと、その人とのチャットを開く（開いたら見たことになり、吹き出しは消える）
function drawBubbles(items) {
  const map = {};
  for (const m of items) {
    if (m.type !== "chat" || m.read || map[m.from.userId]) continue;
    map[m.from.userId] = m.quiz ? { text: "問題を送ったよ！", kind: "quiz" } : { text: "チャットが来たよ！", kind: "chat" };
  }
  plazaFav.setBubbles(map);
  plazaOther.setBubbles(map);
}
/** 吹き出しを押したとき：その人とのチャットを開く */
function openBubble(userId) { openChat(userId); }
drawBubbles(mailbox.list());
