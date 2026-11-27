// ═══════════════════════════════════════════════════════════════
//  タイマー：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//
//  3 つのタイマーは、それぞれ別に動きます（ストップウォッチを動かしたまま、カウントダウンも使える）。
//  動いているタイマーは、左のメニューの右に ● と時間、上のバーの右はしにも 出ます。
//  時間は「スタートした時刻」から計算しているので、ほかのページを見ている間も正しく進みます。
//  状態は localStorage（この PC のブラウザの保存場所）に入れておくので、窓を読み直しても続きから動きます。
//
//  キー操作（入力欄にいるときは はたらかない）
//    Space … スタート／一時停止（どのボタンを えらんでいても。ボタンを押すのは Enter）　R … リセット　L … ラップ　N … 次へ（ポモドーロ）　1〜3 … 切りかえ　Ctrl + B … メニュー
//
//  ★ 書きかえやすいところ
//    PRESETS     … カウントダウンの「よく使う時間」のボタン（分）
//    DEFAULTS    … はじめの設定（ポモドーロの時間など）
//    beep        … 終わったときの音（高さ・長さ・回数）
//    finishCountdown / finishPhase … 終わったときにすること（お知らせ・アチーブ・記録）
//  アチーブ（achieve_setting/timer.js）
//    first-start … はじめてスタートした / pomodoro-4 … 勉強を 4 回 / focus-60 … 1 回 60 分以上
//  記録（home_setting/timer.js）… さいごまで やりきった時間を、学習時間の内訳（stats.json）に 足す
//    ポモドーロの勉強 → "pomodoro"（と、やりきった回数 "pomodoro"）／ カウントダウン → "countdown"
//    ★ 今の 記録のページ（pages/records）は、アプリを開いていた時間だけを出していて、この内訳は まだ画面に出ない
// ═══════════════════════════════════════════════════════════════

/** カウントダウンの「よく使う時間」のボタン（分） */
const PRESETS = [5, 10, 15, 25, 30, 45, 60, 90];
/** カウントダウンの いちばん長い時間（秒）… 9 時間 59 分 59 秒 */
const MAX_CD = 9 * 3600 + 59 * 60 + 59;

/** はじめの設定（保存したものが無いとき） */
const DEFAULTS = {
  mode: "stopwatch",   // 今見ているタイマー："stopwatch" / "countdown" / "pomodoro"
  sound: true,         // 終わったときに音を鳴らす
  navOpen: true,       // 左のメニューを出しているか
  // 時間の持ち方：running（動いているか）・startedAt（動かしはじめた時刻 ms）・acc（それまでにたまった時間 ms）
  sw: { running: false, startedAt: 0, acc: 0, laps: [] },                        // ストップウォッチ（laps：ラップを押したときの合計 ms）
  cd: { seconds: 25 * 60, running: false, startedAt: 0, acc: 0, done: false },   // カウントダウン（seconds：決めた時間の秒。のばすと増える）
  pm: {                                                                          // ポモドーロ
    work: 25, short: 5, long: 15, auto: true,       // 勉強・休憩・長い休憩（分）、終わったら次をすぐ始める
    phase: "work", count: 0,                        // 今の段階（work / short / long）、勉強をやりきった回数
    running: false, startedAt: 0, acc: 0,
    day: "", todayCount: 0, todayMs: 0,             // 今日の回数と時間（日付が変わったら 0 にもどす）
  },
};

const KEY = "zemi-timer";
const $ = (id) => document.getElementById(id);
const now = () => Date.now();
const pad = (n) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const MODE_NAME = { stopwatch: "ストップウォッチ", countdown: "カウントダウン", pomodoro: "ポモドーロ" };
const MODES = Object.keys(MODE_NAME);

// ───────── 保存・読み込み ─────────
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved) {
      const s = { ...DEFAULTS, ...saved, sw: { ...DEFAULTS.sw, ...saved.sw }, cd: { ...DEFAULTS.cd, ...saved.cd }, pm: { ...DEFAULTS.pm, ...saved.pm } };
      // 前の形（分だけで持っていた）から 秒に うつす
      if (saved.cd && saved.cd.seconds == null && saved.cd.minutes != null) s.cd.seconds = saved.cd.minutes * 60;
      delete s.cd.minutes;
      return s;
    }
  } catch { /* 読めなければはじめから */ }
  return structuredClone(DEFAULTS);
}
const S = load();
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* 保存できなくても動く */ } };

// ───────── 時間の計算 ─────────
/** たまった時間（ms） */
const elapsed = (t) => t.acc + (t.running ? now() - t.startedAt : 0);
/** 動かす・止める */
function run(t) { if (!t.running) { t.running = true; t.startedAt = now(); } }
function pause(t) { if (t.running) { t.acc += now() - t.startedAt; t.running = false; } }
/** ポモドーロの今の段階の長さ（ms） */
const phaseMs = () => S.pm[S.pm.phase] * 60000;
/** カウントダウンの長さ（ms） */
const countdownMs = () => S.cd.seconds * 1000;
/** そのタイマーが「はじまっている」か（時間が たまっている） */
const started = (mode) => { const t = timerOf(mode); return (t.running || elapsed(t) > 0) && !(mode === "countdown" && S.cd.done); };

/** 時間を文字にする（1 時間をこえたら 時:分:秒） */
function fmt(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
/** 残り時間は、切り上げて見せる（0:00 になった瞬間に終わるように） */
const fmtLeft = (ms) => fmt(Math.ceil(Math.max(0, ms) / 1000) * 1000);
/** 長さを ことばにする（例：1 時間 30 分 ・ 25 分 ・ 1 分 30 秒） */
function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return [h && `${h} 時間`, m && `${m} 分`, s && `${s} 秒`].filter(Boolean).join(" ") || "0 秒";
}

// ───────── 音（終わったとき） ─────────
let audio = null;
/** 音を出す準備（ボタンを押したときに作る。押す前は音を出せないため） */
const readyAudio = () => { try { audio ??= new AudioContext(); if (audio.state === "suspended") audio.resume(); } catch { /* 音が使えない */ } };
/** ピピピッと 3 回鳴らす */
function beep() {
  if (!S.sound || !audio) return;
  for (let i = 0; i < 3; i++) {
    const t = audio.currentTime + i * 0.28;
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.frequency.value = 880;   // 音の高さ（Hz）
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    osc.connect(gain).connect(audio.destination);
    osc.start(t); osc.stop(t + 0.22);
  }
}

// ───────── 終わったとき ─────────
function finishCountdown() {
  const c = S.cd;
  c.running = false; c.acc = countdownMs(); c.done = true;
  beep();
  app.notify({ type: "success", title: "カウントダウンが終わりました", message: `${fmtDur(c.seconds)} たちました。おつかれさまです！` });
  app.addStudyTime?.("countdown", c.seconds);   // 学習時間の内訳に 足す
  if (c.seconds >= 3600) app.unlock("focus-60");
}
function finishPhase() {
  const p = S.pm;
  const was = p.phase;
  if (was === "work") {
    p.count += 1; p.todayCount += 1; p.todayMs += p.work * 60000;
    app.addProgress("pomodoro-4");                 // 勉強を 4 回やりきる
    app.addStudyTime?.("pomodoro", p.work * 60);   // 学習時間の内訳に 足す
    app.addStat?.("pomodoro");                     // やりきった回数
    if (p.work >= 60) app.unlock("focus-60");
    p.phase = p.count % 4 === 0 ? "long" : "short";
  } else {
    p.phase = "work";
  }
  p.acc = 0;
  p.running = p.auto;
  p.startedAt = now();
  beep();
  app.notify(was === "work"
    ? { type: "success", title: "勉強の時間が終わりました", message: `${p.phase === "long" ? "長い休憩" : "休憩"}（${p[p.phase]} 分）${p.auto ? "をはじめます" : "：スタートを押してください"}` }
    : { type: "info", title: "休憩が終わりました", message: `勉強（${p.work} 分）${p.auto ? "をはじめます" : "：スタートを押してください"}` });
}
/** 終わっていないか確かめる（どのタイマーを見ているときも、0.2 秒ごと） */
function check() {
  if (S.pm.day !== today()) { S.pm.day = today(); S.pm.todayCount = 0; S.pm.todayMs = 0; save(); }
  if (S.cd.running && elapsed(S.cd) >= countdownMs()) { finishCountdown(); save(); renderPanels(); }
  // ポモドーロ：長く閉じていたときは、何段階も進むことがある
  for (let i = 0; i < 10 && S.pm.running && elapsed(S.pm) >= phaseMs(); i++) { finishPhase(); save(); renderPanels(); }
}

// ───────── 画面に出す ─────────
/** 入力欄に値を入れる（入力している最中は書きかえない） */
const setVal = (el, v) => { if (document.activeElement !== el) el.value = v; };

const C = 2 * Math.PI * 54;   // 輪の長さ
const PHASE_NAME = { work: "勉強中", short: "休憩中", long: "長い休憩中" };
const timerOf = (mode) => ({ stopwatch: S.sw, countdown: S.cd, pomodoro: S.pm })[mode];

/** メニューの右・上のバーに出す「今の時間」{ text, cls }（はじまっていなければ null） */
function badge(mode) {
  const t = timerOf(mode);
  if (mode === "countdown" && S.cd.done) return { text: "おわり", cls: "is-done" };
  if (!started(mode)) return null;
  const text = mode === "stopwatch" ? fmt(elapsed(S.sw))
    : mode === "countdown" ? fmtLeft(countdownMs() - elapsed(S.cd))
    : fmtLeft(phaseMs() - elapsed(S.pm));
  const cls = !t.running ? "is-pause" : mode === "pomodoro" && S.pm.phase !== "work" ? "is-run is-break" : "is-run";
  return { text, cls };
}

/** 時計・ボタン・メニューの時間（0.2 秒ごと） */
function render() {
  const mode = S.mode;
  const t = timerOf(mode);
  let ratio = 0, phaseText = "", subText = "", timeText = "", isBreak = false;

  if (mode === "stopwatch") {
    const ms = elapsed(S.sw);
    timeText = fmt(ms);
    subText = `.${pad(Math.floor((ms % 1000) / 10))}`;   // 1/100 秒
    ratio = (ms % 60000) / 60000;                         // 輪は 1 分で 1 周
    phaseText = "ストップウォッチ";
  } else if (mode === "countdown") {
    const left = countdownMs() - elapsed(S.cd);
    timeText = fmtLeft(left);
    ratio = Math.max(0, left) / countdownMs();
    phaseText = S.cd.done ? "おわり！" : S.cd.running ? "カウントダウン中" : "カウントダウン";
    subText = `ぜんぶで ${fmtDur(S.cd.seconds)}`;
  } else {
    const p = S.pm;
    const left = phaseMs() - elapsed(p);
    timeText = fmtLeft(left);
    ratio = Math.max(0, left) / phaseMs();
    isBreak = p.phase !== "work";
    phaseText = `${PHASE_NAME[p.phase]}${p.phase === "work" ? `（${(p.count % 4) + 1} / 4 回目）` : ""}`;
    const next = p.phase === "work" ? ((p.count + 1) % 4 === 0 ? "long" : "short") : "work";
    subText = `次：${next === "work" ? "勉強" : next === "long" ? "長い休憩" : "休憩"} ${p[next]} 分`;
  }

  document.body.classList.toggle("is-break", isBreak);
  $("time").textContent = timeText;
  $("sub").textContent = subText;
  $("phase").textContent = phaseText;
  $("ring").style.strokeDasharray = `${C}`;
  $("ring").style.strokeDashoffset = `${C * (1 - ratio)}`;

  // 見出しの横：今の様子
  const state = $("state");
  const done = mode === "countdown" && S.cd.done;
  state.textContent = done ? "おわり！" : t.running ? "動いています" : started(mode) ? "一時停止中" : "止まっています";
  state.className = `count${done ? " is-done" : t.running ? " is-run" : ""}`;

  // ボタン
  $("start-label").textContent = t.running ? "一時停止" : started(mode) ? "再開" : "スタート";
  $("lap").hidden = mode !== "stopwatch";
  $("lap").disabled = !S.sw.running;
  $("skip").hidden = mode !== "pomodoro";
  $("reset").disabled = !started(mode) && !done && !(mode === "pomodoro" && (S.pm.count > 0 || S.pm.phase !== "work"));

  // カウントダウン：のばすボタン（はじまっていて、まだ終わっていないとき）
  const canExtend = started("countdown");
  document.querySelectorAll("#extend button").forEach((b) => { b.disabled = !canExtend || S.cd.seconds >= MAX_CD; });

  // 左のメニューの右：動いているタイマーの時間
  let live = null;
  for (const m of MODES) {
    const b = badge(m), el = $(`n-${m}`);
    el.textContent = b?.text ?? "";
    el.className = `n${b ? ` ${b.cls}` : ""}`;
    if (b && timerOf(m).running && m !== mode && !live) live = { m, ...b };
  }
  // 上のバーの右はし：ほかのタイマーが動いていたら 出す
  $("live").hidden = !live;
  if (live) $("live").innerHTML = `<i></i>${MODE_NAME[live.m]} ${live.text}`;
}

/** 切りかえ・設定の部分（押したとき・終わったときだけ書きかえる） */
function renderPanels() {
  document.querySelectorAll("#modes button").forEach((b) => {
    const on = b.dataset.mode === S.mode;
    b.setAttribute("aria-selected", String(on));
    b.tabIndex = on ? 0 : -1;
  });
  document.querySelectorAll(".tm-pane").forEach((p) => { p.hidden = p.dataset.pane !== S.mode; });
  $("title").textContent = MODE_NAME[S.mode];
  $("nav").classList.toggle("closed", !S.navOpen);
  $("burger").setAttribute("aria-expanded", String(S.navOpen));

  // ラップ（新しいものを上に。いちばん速い区切りは緑、おそい区切りは赤）
  const laps = $("laps");
  const rows = S.sw.laps.map((total, i) => ({ i, total, split: total - (S.sw.laps[i - 1] ?? 0) }));
  const splits = rows.map((r) => r.split);
  const best = rows.length >= 2 ? Math.min(...splits) : -1, worst = rows.length >= 2 ? Math.max(...splits) : -1;
  laps.replaceChildren(...rows.reverse().map(({ i, total, split }) => {
    const li = document.createElement("li");
    li.className = split === best ? "is-best" : split === worst ? "is-worst" : "";
    li.innerHTML = `<span>#${i + 1}</span><em></em><b></b>`;
    li.querySelector("em").textContent = `+${fmt(split)}`;
    li.querySelector("b").textContent = fmt(total);
    return li;
  }));
  $("laps-empty").hidden = S.sw.laps.length > 0;
  $("laps-count").textContent = S.sw.laps.length;

  // カウントダウン（はじまっている間は、決め直せない。のばすことはできる）
  const locked = started("countdown");
  document.querySelectorAll("#presets button").forEach((b) => { b.classList.toggle("on", Number(b.dataset.min) * 60 === S.cd.seconds); b.disabled = locked; });
  const sec = S.cd.seconds;
  setVal($("cd-h"), Math.floor(sec / 3600)); setVal($("cd-m"), Math.floor((sec % 3600) / 60)); setVal($("cd-s"), sec % 60);
  for (const id of ["cd-h", "cd-m", "cd-s"]) $(id).disabled = locked;
  $("cd-lock").hidden = !locked;

  // ポモドーロ
  setVal($("pm-work"), S.pm.work); setVal($("pm-short"), S.pm.short); setVal($("pm-long"), S.pm.long); $("pm-auto").checked = S.pm.auto;
  $("pm-count").textContent = S.pm.todayCount;
  $("pm-minutes").textContent = Math.round(S.pm.todayMs / 60000);
  const dots = $("pm-dots");
  dots.replaceChildren(...Array.from({ length: 4 }, (_, i) => { const d = document.createElement("i"); d.classList.toggle("on", i < S.pm.count % 4); return d; }));

  $("sound").checked = S.sound;
  render();
}

// ───────── ボタン ─────────
function toggle() {
  readyAudio();
  const t = timerOf(S.mode);
  if (t.running) pause(t);
  else {
    if (S.mode === "countdown" && S.cd.done) { S.cd.acc = 0; S.cd.done = false; }   // 終わったあとにもう一度
    run(t);
    app.unlock("first-start");   // アチーブ「よーいドン」
  }
  save(); renderPanels();
}
function reset() {
  if (S.mode === "stopwatch") Object.assign(S.sw, { running: false, acc: 0, laps: [] });
  if (S.mode === "countdown") Object.assign(S.cd, { running: false, acc: 0, done: false });
  if (S.mode === "pomodoro") Object.assign(S.pm, { running: false, acc: 0, phase: "work", count: 0 });
  save(); renderPanels();
}
function lap() {
  if (!S.sw.running) return;
  S.sw.laps.push(elapsed(S.sw)); save(); renderPanels();
}
function skip() {   // ポモドーロの今の段階をとばす（記録はしない）
  const p = S.pm;
  p.phase = p.phase === "work" ? ((p.count + 1) % 4 === 0 ? "long" : "short") : "work";
  p.acc = 0; p.startedAt = now();
  save(); renderPanels();
}
function setMode(mode) {
  S.mode = mode; save(); renderPanels();
  if (document.activeElement?.closest?.("[hidden]")) document.activeElement.blur();   // かくれた所に えらんだままにしない
}
function toggleNav() { S.navOpen = !S.navOpen; save(); renderPanels(); }

$("start").addEventListener("click", toggle);
$("reset").addEventListener("click", reset);
$("lap").addEventListener("click", lap);
$("skip").addEventListener("click", skip);
$("burger").addEventListener("click", toggleNav);
document.querySelectorAll("#modes button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));
// メニューの中は ↑ ↓ キーでも えらべる
$("modes").addEventListener("keydown", (e) => {
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  e.preventDefault();
  const i = (MODES.indexOf(S.mode) + (e.key === "ArrowDown" ? 1 : -1) + MODES.length) % MODES.length;
  setMode(MODES[i]);
  document.querySelector(`#modes button[data-mode="${MODES[i]}"]`).focus();
});

// カウントダウン：よく使う時間
$("presets").append(...PRESETS.map((m) => {
  const b = document.createElement("button");
  b.type = "button"; b.dataset.min = m; b.textContent = m >= 60 && m % 60 === 0 ? `${m / 60} 時間` : m > 60 ? `${Math.floor(m / 60)}時間${m % 60}分` : `${m} 分`;
  b.addEventListener("click", () => { S.cd.seconds = m * 60; S.cd.acc = 0; S.cd.done = false; save(); renderPanels(); });
  return b;
}));
// カウントダウン：時・分・秒（どれかを変えたら、3 つを合わせて決める。0 秒にはしない）
const clamp = (v, lo, hi, fallback) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };
for (const id of ["cd-h", "cd-m", "cd-s"]) {
  $(id).addEventListener("change", () => {
    const h = clamp($("cd-h").value, 0, 9, 0), m = clamp($("cd-m").value, 0, 59, 0), s = clamp($("cd-s").value, 0, 59, 0);
    S.cd.seconds = Math.max(1, h * 3600 + m * 60 + s); S.cd.acc = 0; S.cd.done = false;
    $(id).blur();   // 入れなおした数を すぐ 見せる
    save(); renderPanels();
  });
}
// カウントダウン：のばす（動いている途中・一時停止中）
document.querySelectorAll("#extend button").forEach((b) => b.addEventListener("click", () => {
  if (!started("countdown")) return;
  const add = Math.min(Number(b.dataset.add), MAX_CD - S.cd.seconds);
  if (add <= 0) return;
  S.cd.seconds += add;
  app.notify({ type: "info", title: `${fmtDur(add)} のばしました`, message: `のこり ${fmtLeft(countdownMs() - elapsed(S.cd))}（ぜんぶで ${fmtDur(S.cd.seconds)}）`, key: "timer-extend" });
  save(); renderPanels();
}));

// ポモドーロの設定
for (const [id, key, hi] of [["pm-work", "work", 180], ["pm-short", "short", 60], ["pm-long", "long", 90]]) {
  $(id).addEventListener("change", (e) => { S.pm[key] = clamp(e.target.value, 1, hi, S.pm[key]); save(); renderPanels(); });
}
$("pm-auto").addEventListener("change", (e) => { S.pm.auto = e.target.checked; save(); });
$("sound").addEventListener("change", (e) => { S.sound = e.target.checked; if (S.sound) { readyAudio(); beep(); } save(); });

// ───────── キー操作 ─────────
/** そのボタンが 見えていて 押せるときだけ 押す */
const press = (id) => { const b = $(id); if (b && !b.hidden && !b.disabled) b.click(); };
document.addEventListener("keydown", (e) => {
  // Ctrl + B … メニューを開け閉め
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "b") { e.preventDefault(); toggleNav(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target.closest?.("input, textarea, select")) return;   // 入力欄にいるときは しない
  if (e.code === "Space") {   // どこにいても スタート／一時停止（えらんでいるボタンは押さない。ボタンは Enter で押せる）
    if (e.target.closest?.("input[type=checkbox]")) return;
    e.preventDefault(); toggle(); return;
  }
  const k = e.key.toLowerCase();
  if (k === "r") press("reset");
  else if (k === "l") press("lap");
  else if (k === "n") press("skip");
  else if (["1", "2", "3"].includes(k)) setMode(MODES[Number(k) - 1]);
  else return;
  e.preventDefault();
});

// ───────── はじめに描く・0.2 秒ごとに進める ─────────
check();
renderPanels();
setInterval(() => { check(); render(); }, 200);
