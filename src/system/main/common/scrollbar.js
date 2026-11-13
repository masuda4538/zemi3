// ═══════════════════════════════════════════════════════════════
//  細いスクロールバー（中身の上に重ねて出す）★ ふだんは触らなくて大丈夫です
//
//  ふつうのスクロールバーは、出たときに右に幅を取るので、中身が左に「ガクッ」とずれます。
//  そこで、ふつうのバーは見えないようにして（main/scrollbar.css）、
//  かわりに細いバーを、中身の上に重ねて描きます（幅を取らないので、中身はずれません）。
//
//    ・スクロールしている間だけ出て、止まると少しして消える
//    ・右端（下端）にマウスを近づけると出て、少し太くなる。つかんで動かす（ドラッグ）こともできる
//    ・ホイール・タッチパッド・キーボード（↑↓・PageUp など）でのスクロールは、今までと同じ
//  呼んでいるところ：src/main.jsx（外の画面）と main/frame/bridge.js（各アプリ・サイドバーの窓の中）
//  見た目（色・太さ）は main/scrollbar.css で変えられます。
// ═══════════════════════════════════════════════════════════════

const HIDE_MS = 900;   // スクロールが止まってから、バーが消えるまで（ミリ秒）
const EDGE = 14;       // 右端（下端）から何ピクセル以内にマウスが来たら出すか
const MIN = 28;        // バーのいちばん短い長さ（ピクセル）

/** その画面（document）に、細いスクロールバーを付ける（同じ画面に 2 回呼んでも 1 回だけ） */
export function installScrollbars(doc = document) {
  if (!doc || doc.__zemiScrollbars) return;
  doc.__zemiScrollbars = true;
  const win = doc.defaultView;

  // バーを描く透明な板（画面のいちばん上。マウスの操作はじゃましない）
  const layer = doc.createElement("div");
  layer.className = "ovs-layer";
  layer.setAttribute("aria-hidden", "true");
  const put = () => { if (doc.body) doc.body.appendChild(layer); else win.setTimeout(put, 30); };
  put();

  /** スクロールする要素 → { el, y: バー, x: バー, timer, hover, drag } */
  const states = new Map();
  const root = () => doc.scrollingElement || doc.documentElement;

  // ───────── 調べる ─────────
  /** その向きにスクロールできるか（"y" = たて / "x" = よこ） */
  function canScroll(el, axis) {
    const more = axis === "y" ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    if (more <= 1) return false;
    if (el === root()) {
      // 画面全体：html と body のどちらかで overflow: hidden なら、スクロールしない
      const h = win.getComputedStyle(doc.documentElement), b = doc.body ? win.getComputedStyle(doc.body) : null;
      const key = axis === "y" ? "overflowY" : "overflowX";
      return h[key] !== "hidden" && (!b || b[key] !== "hidden");
    }
    const o = win.getComputedStyle(el)[axis === "y" ? "overflowY" : "overflowX"];
    return o === "auto" || o === "scroll" || o === "overlay";
  }
  /** 要素の中身が見えている四角（画面の中の位置） */
  function box(el) {
    if (el === root()) return { left: 0, top: 0, width: el.clientWidth || win.innerWidth, height: el.clientHeight || win.innerHeight };
    const r = el.getBoundingClientRect();
    return { left: r.left + el.clientLeft, top: r.top + el.clientTop, width: el.clientWidth, height: el.clientHeight };
  }

  // ───────── バーを作る・動かす ─────────
  function stateOf(el) {
    let s = states.get(el);
    if (s) return s;
    s = { el, timer: 0, hover: null, drag: null, y: makeThumb("y"), x: makeThumb("x") };
    for (const axis of ["y", "x"]) s[axis].addEventListener("pointerdown", (e) => startDrag(s, axis, e));
    states.set(el, s);
    return s;
  }
  function makeThumb(axis) {
    const t = doc.createElement("div");
    t.className = `ovs-thumb ${axis}`;
    layer.appendChild(t);
    return t;
  }
  /** バーの長さと位置を、今のスクロールに合わせる */
  function place(s) {
    const { el } = s;
    const b = box(el);
    for (const axis of ["y", "x"]) {
      const t = s[axis];
      if (!canScroll(el, axis)) { t.classList.remove("on"); continue; }
      const view = axis === "y" ? b.height : b.width;
      const all = axis === "y" ? el.scrollHeight : el.scrollWidth;
      const pos = axis === "y" ? el.scrollTop : el.scrollLeft;
      const len = Math.max(MIN, Math.round(view * view / all));
      const at = Math.round((pos / (all - view)) * (view - len)) || 0;
      if (axis === "y") {
        t.style.height = `${len}px`;
        t.style.transform = `translate(${b.left + b.width - 12}px, ${b.top + at}px)`;
      } else {
        t.style.width = `${len}px`;
        t.style.transform = `translate(${b.left + at}px, ${b.top + b.height - 12}px)`;
      }
      t.dataset.len = String(len);
      t.dataset.view = String(view);
    }
  }
  /** 出す（しばらくしたら消す。マウスが乗っている・つかんでいる間は消さない） */
  function show(el) {
    const s = stateOf(el);
    place(s);
    for (const axis of ["y", "x"]) if (canScroll(el, axis)) s[axis].classList.add("on");
    win.clearTimeout(s.timer);
    s.timer = win.setTimeout(() => hide(s), HIDE_MS);
  }
  function hide(s) {
    if (s.hover || s.drag) { s.timer = win.setTimeout(() => hide(s), HIDE_MS); return; }
    s.y.classList.remove("on", "big");
    s.x.classList.remove("on", "big");
    if (!s.el.isConnected) { s.y.remove(); s.x.remove(); states.delete(s.el); }   // なくなった要素の分は片付ける
  }

  // ───────── つかんで動かす ─────────
  function startDrag(s, axis, e) {
    if (e.button !== 0) return;
    e.preventDefault();
    const t = s[axis];
    const all = axis === "y" ? s.el.scrollHeight : s.el.scrollWidth;
    const view = Number(t.dataset.view), len = Number(t.dataset.len);
    s.drag = {
      axis, from: axis === "y" ? e.clientY : e.clientX,
      start: axis === "y" ? s.el.scrollTop : s.el.scrollLeft,
      ratio: (all - view) / Math.max(1, view - len),
    };
    t.classList.add("drag");
    t.setPointerCapture?.(e.pointerId);
    const move = (ev) => {
      const d = ((axis === "y" ? ev.clientY : ev.clientX) - s.drag.from) * s.drag.ratio;
      if (axis === "y") s.el.scrollTop = s.drag.start + d; else s.el.scrollLeft = s.drag.start + d;
    };
    const up = () => {
      s.drag = null;
      t.classList.remove("drag");
      t.removeEventListener("pointermove", move);
      t.removeEventListener("pointerup", up);
      t.removeEventListener("pointercancel", up);
      show(s.el);
    };
    t.addEventListener("pointermove", move);
    t.addEventListener("pointerup", up);
    t.addEventListener("pointercancel", up);
  }

  // ───────── スクロールしたら出す ─────────
  let pending = new Set(), raf = 0;
  doc.addEventListener("scroll", (e) => {
    const t = e.target;
    const el = t === doc || t === doc.documentElement || t === doc.body ? root() : t;
    if (!(el instanceof win.Element)) return;
    pending.add(el);
    if (!raf) raf = win.requestAnimationFrame(() => { raf = 0; const list = pending; pending = new Set(); list.forEach(show); });
  }, { capture: true, passive: true });

  // ───────── 右端（下端）にマウスが来たら出して、少し太くする ─────────
  let hovered = null, moveRaf = 0, last = null;
  doc.addEventListener("pointermove", (e) => {
    last = e;
    if (moveRaf) return;
    moveRaf = win.requestAnimationFrame(() => { moveRaf = 0; checkHover(last); });
  }, { passive: true });
  doc.addEventListener("pointerleave", () => setHover(null));
  function checkHover(e) {
    if (e.target?.classList?.contains("ovs-thumb")) return;   // バーの上：今のまま
    let found = null;
    for (let n = e.target instanceof win.Element ? e.target : null; n && !found; n = n.parentElement) {
      for (const axis of ["y", "x"]) {
        if (!canScroll(n, axis)) continue;
        const b = box(n);
        const near = axis === "y"
          ? e.clientX >= b.left + b.width - EDGE && e.clientX <= b.left + b.width && e.clientY >= b.top && e.clientY <= b.top + b.height
          : e.clientY >= b.top + b.height - EDGE && e.clientY <= b.top + b.height && e.clientX >= b.left && e.clientX <= b.left + b.width;
        if (near) { found = { el: n, axis }; break; }
      }
    }
    setHover(found);
  }
  function setHover(found) {
    if (hovered && (!found || hovered.el !== found.el || hovered.axis !== found.axis)) {
      const s = states.get(hovered.el);
      if (s) { s.hover = null; s[hovered.axis].classList.remove("big"); }
      hovered = null;
    }
    if (found && !hovered) {
      hovered = found;
      const s = stateOf(found.el);
      s.hover = found.axis;
      show(found.el);
      s[found.axis].classList.add("big");
    }
  }
  // 窓の大きさが変わったら、出ているバーの位置を直す
  win.addEventListener("resize", () => states.forEach((s) => { if (s.y.classList.contains("on") || s.x.classList.contains("on")) place(s); }), { passive: true });
}
