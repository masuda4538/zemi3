// ═══════════════════════════════════════════════════════════════
//  マウスの効果（設定 → マウス）
//
//  カーソルの見た目は、いつもの Windows（PC）のカーソルのままです（アプリでは変えません）。
//    ・押せるところ（ボタン・左のタブなど）では指の形、文字を入れるところでは I の形（main/cursor.css）
//
//  ここでは、カーソルとは別に、オン／オフできる効果だけを描きます。
//    クリックの効果 … クリックしたところに波紋が広がる
//    動きの軌跡     … 動かしたあとに、光のしっぽが少し残る
//  画面のいちばん上に、透明な板（.cursor-fx）を重ねて描く。アプリ・サイドバーの窓の中の動きは bridge.js が知らせる。
// ═══════════════════════════════════════════════════════════════

/** 設定に合わせて効果を変える（settings.js の applySettings から呼ぶ） */
export function applyCursor(settings) {
  effects = {
    click: !!settings.clickEffect && !settings.reduceMotion,
    trail: !!settings.cursorTrail && !settings.reduceMotion,
    color: settings.effectColor || "#2563eb",
    size: 26,   // 波紋・軌跡の大きさのもと（ピクセル）
  };
  if (effects.click || effects.trail) startEffects();
  // 前の版で html に付けていた「アプリ専用のカーソル」を外す（いつもの PC のカーソルにする）
  const root = document.documentElement;
  root.classList.remove("custom-cursor");
  for (const name of ["default", "pointer", "text", "not-allowed"]) root.style.removeProperty(`--cur-${name}`);
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
