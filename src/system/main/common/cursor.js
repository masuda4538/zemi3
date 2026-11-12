// ═══════════════════════════════════════════════════════════════
//  このアプリ専用のマウスカーソル（設定 → マウス）
//
//  ■ カーソルの見た目（アプリの中では、いつもこのカーソルを使う）
//    ふつうの形（矢印・手・I・禁止）のまま、本体の色・ふちの色・大きさ・影を変えられる。
//    絵はここで作り（SVG → PNG）、CSS の変数（--cur-default など）に入れる → main/cursor.css が画面全体に使う。
//    ★ 軽くするために
//      ・PNG は blob: の短い URL にする（data: の長い文字だと、要素ごと・窓ごとに何度も読み直して重くなる）
//      ・色・大きさ・影が前と同じなら、作り直さない（ほかの設定を変えたときは何もしない）
//
//  ■ 効果（カーソルの見た目とは別に、オン／オフできる）
//    クリックの効果 … クリックしたところに波紋が広がる
//    動きの軌跡     … 動かしたあとに、光のしっぽが少し残る
//    画面のいちばん上に、透明な板（.cursor-fx）を重ねて描く。アプリ・サイドバーの窓の中の動きは bridge.js が知らせる。
// ═══════════════════════════════════════════════════════════════

/** 色の組み合わせの見本（押すと本体とふちの色がまとめて変わる） */
export const CURSOR_PRESETS = [
  { name: "白", fill: "#ffffff", line: "#111111" },
  { name: "黒", fill: "#111111", line: "#ffffff" },
  { name: "青", fill: "#2563eb", line: "#ffffff" },
  { name: "水色", fill: "#38bdf8", line: "#0b2a4a" },
  { name: "ピンク", fill: "#f472b6", line: "#ffffff" },
  { name: "黄", fill: "#facc15", line: "#111111" },
];

/** 大きさ（ピクセル）の、いちばん小さい・大きい値 */
export const CURSOR_SIZE_MIN = 18;
export const CURSOR_SIZE_MAX = 64;

/** CSS の変数の名前（main/cursor.css と bridge.js で使う） */
export const CURSOR_VARS = ["--cur-default", "--cur-pointer", "--cur-text", "--cur-not-allowed"];

// ───────── 絵（32 × 32 のマスに描く） ─────────

/** 矢印（Windows の矢印に近い、しっぽ付き。先っぽが 3, 2.5） */
const ARROW = "M3 2.5V24l5.2-5.1 3.6 8.2 3.5-1.5-3.5-8h7.3z";

/** 手（人差し指で指す。指先が 11, 2.5） */
const HAND = "M9.2 4.6c0-1.3 1-2.2 2.2-2.2s2.2 1 2.2 2.2v8.2l.4-.1v-2.3c0-1.2 1-2.1 2.1-2.1s2.1.9 2.1 2.1v2.6l.4.1v-1.8c0-1.2 1-2.1 2.1-2.1s2.1.9 2.1 2.1v2.5l.3.1c.1-1.1 1-1.9 2-1.9 1.2 0 2.1.9 2.1 2.1v5.7c0 4.6-3.7 8.3-8.3 8.3h-1.6c-2.8 0-5.4-1.4-6.9-3.8l-4.1-6.3c-.7-1-.4-2.4.7-3 1-.6 2.2-.4 2.9.5l1.3 1.7z";

/** I（文字を入れるところ。まん中が 16, 16） */
const BEAM = "M11 4.5h2.4c1.1 0 2 .5 2.6 1.3.6-.8 1.5-1.3 2.6-1.3H21M16 6.5v19M11 27.5h2.4c1.1 0 2-.5 2.6-1.3.6.8 1.5 1.3 2.6 1.3H21";

/** 禁止のしるし（右下に小さく） */
const NO = '<circle cx="23" cy="23" r="6.2" fill="#fff" stroke="#dc2626" stroke-width="2.4"/><path d="m18.8 27.2 8.4-8.4" stroke="#dc2626" stroke-width="2.4"/>';

/** 4 つの絵の SVG（文字）と、指す場所（ホットスポット） */
function svgs({ cursorFill: fill = "#ffffff", cursorLine: line = "#111111", cursorShadow: shadow = true }) {
  const filter = shadow
    ? '<defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx=".7" dy="1.1" stdDeviation=".9" flood-color="#000" flood-opacity=".4"/></filter></defs>'
    : "";
  const g = (inner) => `<g${shadow ? ' filter="url(#s)"' : ""}>${inner}</g>`;
  const wrap = (inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${filter}${inner}</svg>`;
  const arrow = `<path d="${ARROW}" fill="${fill}" stroke="${line}" stroke-width="1.6" stroke-linejoin="round"/>`;
  return {
    default: { svg: wrap(g(arrow)), hot: [3, 3] },
    pointer: { svg: wrap(g(`<path d="${HAND}" fill="${fill}" stroke="${line}" stroke-width="1.5" stroke-linejoin="round"/>`)), hot: [11, 3] },
    text: {
      svg: wrap(g(`<path d="${BEAM}" fill="none" stroke="${line}" stroke-width="4.2" stroke-linecap="round"/><path d="${BEAM}" fill="none" stroke="${fill}" stroke-width="2" stroke-linecap="round"/>`)),
      hot: [16, 16],
    },
    "not-allowed": { svg: wrap(g(arrow + NO)), hot: [3, 3] },
  };
}

/** SVG を PNG にして、短い URL（blob:…）を返す（どのブラウザでもカーソルに使えるように） */
function toPng(svg, px) {
  return new Promise((resolve, reject) => {
    const scale = Math.max(1, window.devicePixelRatio || 1);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(px * scale);
      canvas.height = Math.round(px * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error("PNG を作れませんでした"))), "image/png");
    };
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

const clampSize = (n) => Math.min(CURSOR_SIZE_MAX, Math.max(CURSOR_SIZE_MIN, Math.round(Number(n) || 26)));
let ticket = 0;   // 続けて変えたとき（大きさのスライダーなど）に、最後の設定だけを使うため
let madeFor = "";  // 今のカーソルを作ったときの「色・大きさ・影」（同じなら作り直さない）
let urls = [];     // 今使っている PNG の URL（作り直したら、少しあとで前のものを捨てる）

/** 設定に合わせてカーソルと効果を変える（settings.js の applySettings から呼ぶ） */
export async function applyCursor(settings, root = document.documentElement) {
  // 効果（クリック・軌跡）
  effects = {
    click: !!settings.clickEffect && !settings.reduceMotion,
    trail: !!settings.cursorTrail && !settings.reduceMotion,
    color: settings.effectColor || "#2563eb",
    size: clampSize(settings.cursorSize),
  };
  if (effects.click || effects.trail) startEffects();

  // カーソルの見た目（前と同じなら何もしない → ほかの設定を変えたときは軽い）
  const px = clampSize(settings.cursorSize);
  const want = JSON.stringify([settings.cursorFill, settings.cursorLine, px, settings.cursorShadow, window.devicePixelRatio]);
  if (want === madeFor && root.classList.contains("custom-cursor")) return;
  const my = ++ticket;
  const fallback = { default: "default", pointer: "pointer", text: "text", "not-allowed": "not-allowed" };
  try {
    const values = await Promise.all(Object.entries(svgs(settings)).map(async ([name, { svg, hot }]) => {
      const png = await toPng(svg, px);
      const k = px / 32;   // 絵のマス（32）から、画面の大きさへ
      return [name, `url("${png}") ${Math.round(hot[0] * k)} ${Math.round(hot[1] * k)}, ${fallback[name]}`];
    }));
    const made = values.map(([, value]) => value.match(/url\("([^"]+)"\)/)[1]);
    if (my !== ticket) { made.forEach((u) => URL.revokeObjectURL(u)); return; }   // もっと新しい設定が来た → これは使わない
    for (const [name, value] of values) root.style.setProperty(`--cur-${name}`, value);
    root.classList.add("custom-cursor");
    madeFor = want;
    const old = urls;
    urls = made;
    setTimeout(() => old.forEach((u) => URL.revokeObjectURL(u)), 2000);   // 窓の中にも新しい絵が行きわたってから捨てる
  } catch (err) {
    console.warn("カーソルの絵を作れませんでした。ふつうのカーソルにします。", err);
    root.classList.remove("custom-cursor");
  }
}

/** 設定の画面の見本用：絵の SVG を data URL で返す */
export function cursorPreview(settings) {
  return Object.fromEntries(Object.entries(svgs(settings)).map(([name, { svg }]) => [name, `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`]));
}

// ═════════ 効果（クリックの波紋・動きの軌跡） ═════════
let effects = { click: false, trail: false, color: "#2563eb", size: 26 };
let layer = null;        // 画面のいちばん上に重ねる透明な板
let ctx = null;          // 軌跡を描くキャンバス
let points = [];         // 軌跡の点 { x, y, t }
let raf = 0;
const TRAIL_MS = 320;    // 軌跡が消えるまでの時間

/** 透明な板を用意して、外の画面のマウスの動きを見はじめる（1 回だけ） */
function startEffects() {
  if (layer) return;
  layer = document.createElement("div");
  layer.className = "cursor-fx";
  layer.setAttribute("aria-hidden", "true");
  const canvas = document.createElement("canvas");
  layer.append(canvas);
  document.body.append(layer);
  ctx = canvas.getContext("2d");
  const fit = () => {
    const s = window.devicePixelRatio || 1;
    canvas.width = innerWidth * s; canvas.height = innerHeight * s;
    canvas.style.width = `${innerWidth}px`; canvas.style.height = `${innerHeight}px`;
    ctx.setTransform(s, 0, 0, s, 0, 0);
  };
  fit();
  window.addEventListener("resize", fit);
  window.addEventListener("pointermove", (e) => cursorMoved(e.clientX, e.clientY), { passive: true });
  window.addEventListener("pointerdown", (e) => cursorClicked(e.clientX, e.clientY), { passive: true });
}

/** マウスが動いた（x, y は外の画面での位置）。窓の中の動きは bridge.js が位置を直して呼ぶ */
export function cursorMoved(x, y) {
  if (!effects.trail || !layer) return;
  const t = performance.now();
  const last = points[points.length - 1];
  if (last) {   // 速く動かしたときも線がとぎれないように、あいだに点を足す
    const steps = Math.min(12, Math.floor(Math.hypot(x - last.x, y - last.y) / 6));
    for (let i = 1; i < steps; i++) points.push({ x: last.x + ((x - last.x) * i) / steps, y: last.y + ((y - last.y) * i) / steps, t });
  }
  points.push({ x, y, t });
  if (!raf) raf = requestAnimationFrame(drawTrail);
}

/** クリックした（x, y は外の画面での位置） */
export function cursorClicked(x, y) {
  if (!effects.click || !layer) return;
  const r = Math.round(effects.size * 1.4);
  const ring = document.createElement("span");
  ring.className = "cursor-fx-ripple";
  ring.style.cssText = `left:${x - r}px;top:${y - r}px;width:${r * 2}px;height:${r * 2}px;--fx:${effects.color}`;
  layer.append(ring);
  ring.addEventListener("animationend", () => ring.remove());
}

/** 軌跡を描く（点が残っているあいだだけ動く） */
function drawTrail() {
  const now = performance.now();
  points = points.filter((p) => now - p.t < TRAIL_MS);
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  ctx.strokeStyle = effects.color;
  ctx.lineCap = "butt";   // 丸くすると重なったところが濃くなるので、角のまま
  const max = effects.size * 0.4;   // しっぽのいちばん太いところ
  // となりの点どうしを線でつなぐ（新しいところほど太く・濃く）
  for (let i = 1; i < points.length; i++) {
    const life = 1 - (now - points[i].t) / TRAIL_MS;   // 1 → 0 で消えていく
    ctx.globalAlpha = life * 0.5;
    ctx.lineWidth = Math.max(0.5, max * life);
    ctx.beginPath();
    ctx.moveTo(points[i - 1].x, points[i - 1].y);
    ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  raf = points.length ? requestAnimationFrame(drawTrail) : 0;
}
