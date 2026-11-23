// ═══════════════════════════════════════════════════════════════
//  ホーム：広場（フレンドのキャラクターが歩きまわる。★ 今は見た目のイメージだけ）
//  使い方（js/main.js）：広場 1 つにつき 1 回よぶ（ホームには「お気に入り」と「そのほか」の 2 つの広場がある）
//    const plaza = mountPlaza({
//      scene: 広場の要素, layer: フレンドを入れる要素, friends: [フレンド],
//      fountain: 噴水（または木の根もと）, rim: 池のふち（または木の根もと）  … よけるもの（ない広場では書かない）
//      edge: 左下のポスト,                              … これより左には行かない
//      noStop: 掲示板,                                  … この左右のはばの中では 立ち止まらない（通りすぎるだけ）
//      onDetail: (フレンド) => フレンド詳細を開く,
//      isFavorite: (userId) => お気に入りか, onFavorite: (フレンド) => お気に入りを切りかえる,
//      onBubble: (userId) => 吹き出しを押したとき,
//      empty: だれもいないときに出す要素,
//    });
//    plaza.add(フレンド, "left")      … 広場に入れる（"left" ／ "right" なら、そのはしから歩いて入ってくる）
//    plaza.remove(userId, "right")    … 広場から出す（"left" ／ "right" なら、そのはしへ歩いて出ていく）
//    plaza.setBubbles({ userId: "問題を送ったよ！" })   … フレンドの頭の上の吹き出し（書いていない人は消す）
//    フレンド … { name, userId, color, online, lastLogin, achieve }（今は pages/friends/friends-sample.js の仮のデータ）
//  することと見た目
//    ・フレンドは人の形（丸い頭 ＋ 肩。絵は object/person）を、人ごとの色でぬる。頭の上に名前（オンラインなら緑の点）
//    ・ときどき、広場の中をとことこ歩く。奥（上のほう）へ行くほど小さく、手前の人ほど前に重なる
//    ・まん中の噴水はよけて歩く（噴水の池の上では止まらない。向こうがわへ行くときは、池の角を回って行く）
//      噴水より手前にいる人は噴水の前に、奥にいる人は噴水のうしろに見える
//    ・左下のポスト（edge）より左には行かない（ポストに かくれないように）
//    ・押すと小さなカードを出す：名前とアイコン・オンライン（または最後のログイン）・アチーブの取得率
//      カードを出しているあいだ、その人は止まる。カードの外を押すか × で閉じる
//      カードの ☆ を押すと、お気に入りにする・外す（onFavorite。その人は となりの広場へ歩いていく）
//      カードの「くわしく見る」を押すと、フレンドのページの「フレンド詳細」を開く（onDetail）
//    ・吹き出し（setBubbles）を出している人は、吹き出しを押すと onBubble（ポストのその問題を開く）
//    ・設定の「アニメーションを減らす」のときは歩かない（出入りは、すぐに入れかわる）
//  見た目は css/style.css の「広場」
// ═══════════════════════════════════════════════════════════════

import { lastLoginText as lastText } from "../../../pages/friends/friends-sample.js";   // 最後のログインの書き方（フレンドのページと同じ）
import { personSvg } from "../../../object/person/person.js";   // フレンドの人形の絵（src/system/object/person）

const rand = (min, max) => min + Math.random() * (max - min);
const reduced = () => document.documentElement.classList.contains("reduce-motion");
const X_MIN = 6, X_MAX = 90;        // 歩ける左右のはんい（広場の幅に対する %）
const Y_FRONT = 14, Y_BACK = 38;    // 足もとの高さ（下から %）：手前 〜 奥（下は右下の札にかからないように）
const SPEED = 90;                    // 1 % 進むのにかかる時間（ミリ秒）。大きいほど ゆっくり

/** 人の形（丸い頭 ＋ 肩。絵は object/person） */
const PERSON = personSvg("home-friend-body");

// ── 噴水をよける道さがし ──
//  場所は { x: 左右（%）, z: 奥ゆき（0 手前 〜 1 奥） } で表す。
//  噴水の池は、この x・z の中の四角（r = { xL, xR, zF（手前）, zB（奥） }）として考える

/** 点 p が、噴水の四角の中にあるか */
const inside = (p, r) => p.x > r.xL && p.x < r.xR && p.z > r.zF && p.z < r.zB;

/** a から b へまっすぐ歩くと、噴水の四角を通るか（線と四角が重なるかを調べる） */
function hits(a, b, r) {
  let t0 = 0, t1 = 1;   // 線のうち、四角の中にある部分（0 ＝ a 〜 1 ＝ b）
  const dx = b.x - a.x, dz = b.z - a.z;
  for (const [d, q] of [[-dx, a.x - r.xL], [dx, r.xR - a.x], [-dz, a.z - r.zF], [dz, r.zB - a.z]]) {
    if (d === 0) { if (q <= 0) return false; continue; }   // その辺と平行で、外がわを通る
    const t = q / d;
    if (d < 0) t0 = Math.max(t0, t); else t1 = Math.min(t1, t);
    if (t0 >= t1) return false;
  }
  return t1 - t0 > 1e-6;
}

/** a から b への道（とちゅうで曲がる点のならび。さいごが b）。
 *  まっすぐ行けなければ、四角の 4 つの角（少し外がわ）を通る いちばん短い道をさがす */
function route(a, b, r) {
  if (!hits(a, b, r)) return [b];
  const ex = 0.6, ez = 0.03;   // 角から、これだけ外がわを通る
  const corners = [[r.xL - ex, r.zF - ez], [r.xR + ex, r.zF - ez], [r.xL - ex, r.zB + ez], [r.xR + ex, r.zB + ez]]
    .map(([x, z]) => ({ x, z })).filter((c) => c.x >= 0 && c.x <= 100 && c.z >= -0.3 && c.z <= 1);
  const nodes = [a, ...corners, b], n = nodes.length;
  const cost = (u, v) => Math.hypot(v.x - u.x, (v.z - u.z) * 30);
  // 近い点から順に、そこまでの いちばん短い長さを決めていく（ダイクストラ法）
  const dist = Array(n).fill(Infinity), prev = Array(n).fill(-1), done = Array(n).fill(false);
  dist[0] = 0;
  for (;;) {
    let u = -1;
    for (let i = 0; i < n; i++) if (!done[i] && dist[i] < Infinity && (u < 0 || dist[i] < dist[u])) u = i;
    if (u < 0) break;
    done[u] = true;
    for (let v = 0; v < n; v++) {
      if (done[v] || hits(nodes[u], nodes[v], r)) continue;
      const d = dist[u] + cost(nodes[u], nodes[v]);
      if (d < dist[v]) { dist[v] = d; prev[v] = u; }
    }
  }
  if (dist[n - 1] === Infinity) return [b];   // 道が見つからないとき（ふつうはない）は、まっすぐ
  const path = [];
  for (let v = n - 1; v > 0; v = prev[v]) path.unshift(nodes[v]);
  return path;
}

export function mountPlaza({ scene, layer, friends, fountain = null, rim = null, edge = null, noStop = null, onDetail, isFavorite, onFavorite, onBubble, empty = null }) {
  const people = new Map();   // userId → { f, el, x, z, timer, leg, paused, gone }
  let open = null;            // カードを出している人

  // ── 押したときの小さなカード（1 つだけ。押した人の上に出す） ──
  const card = document.createElement("div");
  card.className = "home-friend-card";
  card.hidden = true;
  card.setAttribute("role", "dialog");
  scene.append(card);

  const closeCard = () => {
    if (!open) return;
    open.el.classList.remove("is-open");
    open.paused = false;
    open = null;
    card.hidden = true;
  };
  const openCard = (p) => {
    if (open === p) { closeCard(); return; }
    closeCard();
    open = p;
    p.paused = true;
    stopHere(p);   // 歩いているとちゅうなら、その場で止まる
    p.el.classList.add("is-open");
    const f = p.f;
    const fav = isFavorite?.(f.userId) ?? false;
    card.style.setProperty("--c", f.color);
    card.setAttribute("aria-label", `${f.name} さん`);
    card.innerHTML = `
      <button type="button" class="home-friend-close" aria-label="閉じる">×</button>
      <div class="home-friend-top">
        <span class="home-friend-avatar">${f.name.slice(0, 1)}</span>
        <span class="home-friend-who"><b>${f.name}</b><small>ID：${f.userId}</small></span>
        ${onFavorite ? `<button type="button" class="home-friend-fav${fav ? " is-on" : ""}" aria-pressed="${fav}" title="${fav ? "お気に入りから外す" : "お気に入りにする"}">${fav ? "★" : "☆"}</button>` : ""}
      </div>
      <div class="home-friend-row">
        ${f.online
          ? `<span class="home-friend-online"><i></i>オンライン</span>`
          : `<span class="home-friend-label">最後のログイン</span><b>${lastText(f.lastLogin)}</b>`}
      </div>
      <div class="home-friend-row">
        <span class="home-friend-label">アチーブ</span>
        <span class="home-friend-bar"><i style="width:${f.achieve}%"></i></span>
        <b>${f.achieve}%</b>
      </div>
      ${onDetail ? `<button type="button" class="home-friend-more">くわしく見る<span aria-hidden="true">›</span></button>` : ""}`;
    card.querySelector(".home-friend-close").addEventListener("click", closeCard);
    card.querySelector(".home-friend-more")?.addEventListener("click", () => { closeCard(); onDetail(f); });
    card.querySelector(".home-friend-fav")?.addEventListener("click", () => { closeCard(); onFavorite(f); });
    card.hidden = false;
    placeCard();
  };
  /** カードを、押した人の頭の上に置く（広場からはみ出さないように） */
  const placeCard = () => {
    if (!open) return;
    const s = scene.getBoundingClientRect(), r = open.el.getBoundingClientRect();
    const w = card.offsetWidth, h = card.offsetHeight;
    const left = Math.max(8, Math.min(s.width - w - 8, r.left - s.left + r.width / 2 - w / 2));
    let top = r.top - s.top - h - 8;
    if (top < 8) top = Math.min(s.height - h - 8, r.bottom - s.top + 8);   // 上に入らなければ下に
    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
  };
  // カードの外を押したら閉じる
  document.addEventListener("pointerdown", (e) => {
    if (open && !card.contains(e.target) && !open.el.contains(e.target)) closeCard();
  });
  window.addEventListener("resize", placeCard);

  // ── 置く・歩く ──
  /** 噴水の池の四角（x・z で。フレンドの体の はばの半分だけ広げる）。噴水がなければ null */
  const zone = (p) => {
    const s = scene.getBoundingClientRect();
    if (!fountain || !rim || !s.width || !s.height) return null;
    const f = fountain.getBoundingClientRect(), c = rim.getBoundingClientRect();
    const half = ((p.el.offsetWidth / 2 + 6) / s.width) * 100;
    const toZ = (px) => (((s.bottom - px) / s.height) * 100 - Y_FRONT) / (Y_BACK - Y_FRONT);   // 画面の高さ → 奥ゆき
    return {
      xL: ((c.left - s.left) / s.width) * 100 - half, xR: ((c.right - s.left) / s.width) * 100 + half,
      zF: toZ(f.bottom) - 0.04,   // 池の前の面より、少し手前まで
      zB: toZ(c.top) + 0.02,      // 池のふちの奥まで
    };
  };
  /** 重なりの順番：噴水（5）より手前の人は 6〜8、奥の人は 3〜4（どちらも手前の人ほど前）
   *  歩くときは、噴水の左右のはばに入る がわの点（from か to）で決める（噴水の横を通るときは、どちらでも重ならない） */
  const layerOf = (from, to, r) => {
    if (!r) return 8 - Math.round(to.z * 5);
    const inX = (q) => q.x > r.xL && q.x < r.xR;
    const q = inX(from) && !inX(to) ? from : to;
    if (q.z <= r.zF) return 8 - Math.round(Math.max(0, q.z / Math.max(0.01, r.zF)) * 2);
    if (q.z >= r.zB) return 4 - Math.round(((q.z - r.zB) / Math.max(0.01, 1 - r.zB)));
    return q.z < (r.zF + r.zB) / 2 ? 6 : 4;
  };
  /** 歩いているとちゅうで止める（今いるところを、x・z にもどす）。歩くのは、少したってから また始まる */
  const stopHere = (p) => {
    const s = scene.getBoundingClientRect(), cs = getComputedStyle(p.el);
    p.x = (parseFloat(cs.left) / s.width) * 100;
    p.z = Math.max(0, Math.min(1, ((parseFloat(cs.bottom) / s.height) * 100 - Y_FRONT) / (Y_BACK - Y_FRONT)));
    clearTimeout(p.leg); clearTimeout(p.timer);
    p.el.style.transitionDuration = "0ms";
    p.el.classList.remove("is-walking");
    put(p);
    walk(p);
  };
  /** x（左右 %）・z（奥ゆき 0 手前 〜 1 奥）に置く。奥ほど上に・小さく。from …… 歩きだす前の場所（重なりの順番に使う） */
  const put = (p, from = p) => {
    p.el.style.left = `${p.x}%`;
    p.el.style.bottom = `${Y_FRONT + p.z * (Y_BACK - Y_FRONT)}%`;
    p.el.style.setProperty("--depth", p.z.toFixed(3));
    p.el.style.zIndex = String(layerOf({ x: from.x, z: from.z }, { x: p.x, z: p.z }, zone(p)));   // スタッピーは 9 で、いつもいちばん前
  };
  /** 歩ける左はし（%）：ポスト（edge）があれば、その右がわから
   *  ポストは画面の左下に いつもあるので、画面の左はしからの長さで考える（広場の はば ＝ 画面の はば） */
  const xMin = (p) => {
    const s = scene.getBoundingClientRect();
    if (!edge || !s.width) return X_MIN;
    const e = edge.getBoundingClientRect(), home = edge.offsetParent?.getBoundingClientRect() ?? { left: 0 };
    return Math.min(X_MAX - 10, Math.max(X_MIN, ((e.right - home.left + p.el.offsetWidth / 2 + 8) / s.width) * 100));
  };
  /** 立ち止まらない左右のはば（%）：noStop（掲示板）があれば、その左はし〜右はし（体の はばの半分だけ広げる） */
  const noStopRange = (p) => {
    const s = scene.getBoundingClientRect();
    if (!noStop || !s.width) return null;
    const b = noStop.getBoundingClientRect();
    if (!b.width) return null;
    const half = p.el.offsetWidth / 2;
    return [((b.left - s.left - half) / s.width) * 100, ((b.right - s.left + half) / s.width) * 100];
  };
  /** 噴水の上・掲示板の前 ではない場所を、ばらばらに 1 つえらぶ */
  const randomSpot = (p) => {
    const r = zone(p), lo = xMin(p), ns = noStopRange(p);
    let q;
    for (let i = 0; i < 30; i++) {
      q = { x: rand(lo, X_MAX), z: Math.random() };
      if ((!r || !inside(q, r)) && (!ns || q.x < ns[0] || q.x > ns[1])) break;
    }
    return q;
  };
  /** 道（曲がる点のならび）を、1 本ずつ順に歩く。おわったら done() */
  const walkPath = (p, path, done) => {
    if (!path.length || (p.paused && !p.gone)) { done(); return; }
    const [q, ...rest] = path;
    const ms = Math.max(200, Math.hypot(q.x - p.x, (q.z - p.z) * 30) * SPEED);
    if (Math.abs(q.x - p.x) > 0.5) p.el.style.setProperty("--face", q.x < p.x ? "-1" : "1");   // 進む向き（名前は反転しない）
    p.el.style.transitionDuration = `${ms}ms`;
    const from = { x: p.x, z: p.z };
    p.x = q.x; p.z = q.z;
    put(p, from);
    p.leg = setTimeout(() => walkPath(p, rest, done), ms);
  };
  /** a から to への道（噴水があれば、よけて回る） */
  const pathTo = (p, to) => { const r = zone(p); return r ? route({ x: p.x, z: p.z }, to, r) : [to]; };
  /** 少し待ってから、次の場所へ歩く。歩きおわったら、また次 */
  const walk = (p, wait = rand(2500, 7000)) => {
    clearTimeout(p.timer);
    p.timer = setTimeout(() => {
      if (p.gone) return;
      if (p.paused || reduced()) { walk(p); return; }
      p.el.classList.add("is-walking");
      walkPath(p, pathTo(p, randomSpot(p)), () => {
        p.el.classList.remove("is-walking");
        placeCard();
        walk(p);
      });
    }, wait);
  };
  /** だれもいないときの お知らせ */
  const drawEmpty = () => { if (empty) empty.hidden = people.size > 0; };

  // ── 入れる・出す ──
  const add = (f, from = null) => {
    if (people.has(f.userId)) return;
    const el = document.createElement("button");
    el.type = "button";
    el.className = `home-friend${f.online ? " is-online" : ""}`;
    el.style.setProperty("--c", f.color);
    el.setAttribute("aria-label", `${f.name} さん（押すと くわしく見られます）`);
    el.innerHTML = `<span class="home-friend-name">${f.online ? "<i></i>" : ""}${f.name}</span>${PERSON}<span class="home-friend-shadow"></span>`;
    const p = { f, el, x: 0, z: 0, timer: 0, leg: 0, paused: false, gone: false };
    el.addEventListener("click", (e) => {
      if (e.target.closest(".home-friend-bubble")) { onBubble?.(f.userId); return; }   // 吹き出しを押した
      openCard(p);
    });
    layer.append(el);   // 先に入れてから（体の はばが分かるように）、噴水の上ではない場所に置く
    people.set(f.userId, p);
    drawEmpty();
    const spot = randomSpot(p);
    if (from && !reduced()) {
      // はしの外に置いてから、広場の中へ歩いてくる
      Object.assign(p, { x: from === "left" ? -6 : 106, z: spot.z });
      p.el.style.transitionDuration = "0ms";
      put(p);
      void el.offsetWidth;   // 外に置いたところを、いったん描かせる
      el.classList.add("is-walking");
      walkPath(p, pathTo(p, spot), () => { el.classList.remove("is-walking"); walk(p); });
    } else {
      Object.assign(p, spot);
      put(p);
      walk(p);
    }
  };
  const remove = (userId, to = null) => {
    const p = people.get(userId);
    if (!p) return;
    if (open === p) closeCard();
    people.delete(userId);
    drawEmpty();
    p.gone = true;
    clearTimeout(p.timer); clearTimeout(p.leg);
    const bye = () => p.el.remove();
    if (!to || reduced()) { bye(); return; }
    // そのはしへ歩いて出ていく
    stopHereOnly(p);
    p.el.classList.add("is-walking");
    walkPath(p, pathTo(p, { x: to === "left" ? -8 : 108, z: p.z }), bye);
  };
  /** 止めるだけ（また歩きださない。remove のとき） */
  const stopHereOnly = (p) => {
    const s = scene.getBoundingClientRect(), cs = getComputedStyle(p.el);
    p.x = (parseFloat(cs.left) / s.width) * 100;
    p.z = Math.max(0, Math.min(1, ((parseFloat(cs.bottom) / s.height) * 100 - Y_FRONT) / (Y_BACK - Y_FRONT)));
    p.el.style.transitionDuration = "0ms";
    put(p);
    void p.el.offsetWidth;
  };
  /** 頭の上の吹き出し（{ userId: 言葉 }。書いていない人は消す） */
  const setBubbles = (map = {}) => {
    for (const [id, p] of people) {
      let b = p.el.querySelector(".home-friend-bubble");
      const text = map[id];
      if (!text) { b?.remove(); p.el.classList.remove("has-bubble"); continue; }
      if (!b) {
        b = document.createElement("span");
        b.className = "home-friend-bubble";
        p.el.prepend(b);
      }
      b.textContent = text;
      b.title = "押すと、ポストで見られます";
      p.el.classList.add("has-bubble");
    }
  };

  friends.forEach((f) => add(f));
  drawEmpty();

  return {
    add, remove, setBubbles,
    has: (userId) => people.has(userId),
    closeCard,
    destroy() { people.forEach((p) => { p.gone = true; clearTimeout(p.timer); clearTimeout(p.leg); }); card.remove(); layer.replaceChildren(); },
  };
}
