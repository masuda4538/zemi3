// ═══════════════════════════════════════════════════════════════
//  タイマー：動き（普通の JavaScript） ★ 自由に書きかえてよい
//  index.html の <script type="module" src="./js/main.js"> で読まれています。
//
//  3 つのタイマーは、それぞれ別に動きます（ストップウォッチを動かしたまま、カウントダウンも使える）。
//  時間は「スタートした時刻」から計算しているので、ほかのページを見ている間も正しく進みます。
//  状態は localStorage（この PC のブラウザの保存場所）に入れておくので、窓を読み直しても続きから動きます。
//
//  ★ 書きかえやすいところ
//    PRESETS     … カウントダウンのボタンの時間（分）
//    DEFAULTS    … はじめの設定（ポモドーロの時間など）
//    beep        … 終わったときの音（高さ・長さ・回数）
//    finishCountdown / finishPhase … 終わったときにすること（お知らせ・アチーブ）
//  アチーブ（achieve_setting/timer.js）
//    first-start … はじめてスタートした / pomodoro-4 … 勉強を 4 回 / focus-60 … 1 回 60 分以上
// ═══════════════════════════════════════════════════════════════

/** カウントダウンのボタンの時間（分） */
const PRESETS = [5, 10, 15, 25, 30, 45, 60, 90];

/** はじめの設定（保存したものが無いとき） */
const DEFAULTS = {
  mode: "stopwatch",   // 今見ているタイマー："stopwatch" / "countdown" / "pomodoro"
  sound: true,         // 終わったときに音を鳴らす
  // 時間の持ち方：running（動いているか）・startedAt（動かしはじめた時刻 ms）・acc（それまでにたまった時間 ms）
  sw: { running: false, startedAt: 0, acc: 0, laps: [] },                    // ストップウォッチ（laps：ラップを押したときの合計 ms）
  cd: { minutes: 25, running: false, startedAt: 0, acc: 0, done: false },   // カウントダウン
  pm: {                                                                      // ポモドーロ
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

// ───────── 保存・読み込み ─────────
function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (saved) return { ...DEFAULTS, ...saved, sw: { ...DEFAULTS.sw, ...saved.sw }, cd: { ...DEFAULTS.cd, ...saved.cd }, pm: { ...DEFAULTS.pm, ...saved.pm } };
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
const phaseMs = () => S.pm[S.pm.phase === "work" ? "work" : S.pm.phase] * 60000;
/** カウントダウンの長さ（ms） */
const countdownMs = () => S.cd.minutes * 60000;

/** 時間を文字にする（1 時間をこえたら 時:分:秒） */
function fmt(ms) {
  const sec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
/** 残り時間は、切り上げて見せる（0:00 になった瞬間に終わるように） */
const fmtLeft = (ms) => fmt(Math.ceil(Math.max(0, ms) / 1000) * 1000);

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
  app.notify({ type: "success", title: "カウントダウンが終わりました", message: `${c.minutes} 分たちました。おつかれさまです！` });
  if (c.minutes >= 60) app.unlock("focus-60");
}
function finishPhase() {
  const p = S.pm;
  const was = p.phase;
  if (was === "work") {
    p.count += 1; p.todayCount += 1; p.todayMs += p.work * 60000;
    app.addProgress("pomodoro-4");          // 勉強を 4 回やりきる
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
  if (S.cd.running && elapsed(S.cd) >= countdownMs()) { finishCountdown(); save(); }
  // ポモドーロ：長く閉じていたときは、何段階も進むことがある
  for (let i = 0; i < 10 && S.pm.running && elapsed(S.pm) >= phaseMs(); i++) { finishPhase(); save(); }
}

// ───────── 画面に出す ─────────
/** 入力欄に値を入れる（入力している最中は書きかえない） */
const setVal = (el, v) => { if (document.activeElement !== el) el.value = v; };

const C = 2 * Math.PI * 54;   // 輪の長さ
const PHASE_NAME = { work: "勉強中", short: "休憩中", long: "長い休憩中" };
const timerOf = (mode) => ({ stopwatch: S.sw, countdown: S.cd, pomodoro: S.pm })[mode];

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
    subText = `${S.cd.minutes} 分`;
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

  document.querySelector(".tm").classList.toggle("is-break", isBreak);
  $("time").textContent = timeText;
  $("sub").textContent = subText;
  $("phase").textContent = phaseText;
  $("ring").style.strokeDasharray = `${C}`;
  $("ring").style.strokeDashoffset = `${C * (1 - ratio)}`;

  // ボタン
  const started = elapsed(t) > 0;
  $("start").textContent = t.running ? "一時停止" : (started && !(mode === "countdown" && S.cd.done)) ? "再開" : "スタート";
  $("lap").hidden = mode !== "stopwatch";
  $("lap").disabled = !S.sw.running;
  $("skip").hidden = mode !== "pomodoro";
  $("reset").disabled = !started && !(mode === "pomodoro" && (S.pm.count > 0 || S.pm.phase !== "work"));
}

/** 切りかえ・設定の部分（押したときだけ書きかえる） */
function renderPanels() {
  document.querySelectorAll("#modes button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.mode === S.mode)));
  document.querySelectorAll(".tm-pane").forEach((p) => { p.hidden = p.dataset.pane !== S.mode; });

  // ラップ（新しいものを上に）
  const laps = $("laps");
  laps.replaceChildren();
  S.sw.laps.map((total, i) => ({ i, total, split: total - (S.sw.laps[i - 1] ?? 0) })).reverse().forEach(({ i, total, split }) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>#${i + 1}</span><em></em><b></b>`;
    li.querySelector("em").textContent = `+${fmt(split)}`;
    li.querySelector("b").textContent = fmt(total);
    laps.append(li);
  });
  $("laps-empty").hidden = S.sw.laps.length > 0;

  // カウントダウン（動いている・止めている途中は、時間を変えられない）
  const locked = S.cd.running || (S.cd.acc > 0 && !S.cd.done);
  document.querySelectorAll("#presets button").forEach((b) => { b.classList.toggle("on", Number(b.dataset.min) === S.cd.minutes); b.disabled = locked; });
  setVal($("cd-min"), S.cd.minutes);
  $("cd-min").disabled = locked;
  document.querySelectorAll(".tm-step-btn").forEach((b) => { b.disabled = locked; });

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
$("start").addEventListener("click", toggle);
$("reset").addEventListener("click", reset);
$("lap").addEventListener("click", () => { S.sw.laps.push(elapsed(S.sw)); save(); renderPanels(); });
$("skip").addEventListener("click", () => {   // ポモドーロの今の段階をとばす（記録はしない）
  const p = S.pm;
  p.phase = p.phase === "work" ? ((p.count + 1) % 4 === 0 ? "long" : "short") : "work";
  p.acc = 0; p.startedAt = now();
  save(); renderPanels();
});
document.querySelectorAll("#modes button").forEach((b) => b.addEventListener("click", () => { S.mode = b.dataset.mode; save(); renderPanels(); }));

// カウントダウンの時間
$("presets").append(...PRESETS.map((m) => {
  const b = document.createElement("button");
  b.type = "button"; b.dataset.min = m; b.textContent = m >= 60 && m % 60 === 0 ? `${m / 60} 時間` : `${m} 分`;
  b.addEventListener("click", () => { S.cd.minutes = m; S.cd.acc = 0; S.cd.done = false; save(); renderPanels(); });
  return b;
}));
const clamp = (v, lo, hi, fallback) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback; };
$("cd-min").addEventListener("change", (e) => { S.cd.minutes = clamp(e.target.value, 1, 600, S.cd.minutes); S.cd.acc = 0; S.cd.done = false; save(); renderPanels(); });
document.querySelectorAll(".tm-step-btn").forEach((b) => b.addEventListener("click", () => {
  S.cd.minutes = clamp(S.cd.minutes + Number(b.dataset.step), 1, 600, S.cd.minutes); S.cd.acc = 0; S.cd.done = false; save(); renderPanels();
}));

// ポモドーロの設定
for (const [id, key, hi] of [["pm-work", "work", 180], ["pm-short", "short", 60], ["pm-long", "long", 90]]) {
  $(id).addEventListener("change", (e) => { S.pm[key] = clamp(e.target.value, 1, hi, S.pm[key]); save(); renderPanels(); });
}
$("pm-auto").addEventListener("change", (e) => { S.pm.auto = e.target.checked; save(); });
$("sound").addEventListener("change", (e) => { S.sound = e.target.checked; if (S.sound) { readyAudio(); beep(); } save(); });

// スペースキーでスタート／一時停止（入力欄にいるときはしない）
document.addEventListener("keydown", (e) => {
  if (e.code !== "Space" || e.repeat || e.target.closest?.("input, textarea, button")) return;
  e.preventDefault();
  toggle();
});

// ───────── はじめに描く・0.2 秒ごとに進める ─────────
check();
renderPanels();
setInterval(() => { check(); render(); }, 200);
// ラップ・回数などは、終わったとき（check の中）に変わるので、1 秒ごとにまとめて描き直す
setInterval(() => { if (S.pm.running || S.cd.running) renderPanels(); }, 1000);
