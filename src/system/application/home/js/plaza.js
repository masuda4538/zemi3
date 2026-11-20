// ═══════════════════════════════════════════════════════════════
//  ホーム：広場（フレンドのキャラクターが歩きまわる。★ 今は見た目のイメージだけ）
//  使い方（js/main.js）：mountPlaza({ scene: 広場の要素, layer: フレンドを入れる要素, friends: [フレンド] })
//    フレンド … { name, userId, color, online, lastLogin, achieve }（今は pages/friends/friends-sample.js の仮のデータ）
//  することと見た目
//    ・フレンドは人の形（丸い頭 ＋ 肩。SVG で描く）を、人ごとの色でぬる。頭の上に名前（オンラインなら緑の点）
//    ・ときどき、広場の中をとことこ歩く。奥（上のほう）へ行くほど小さく、手前の人ほど前に重なる
//    ・押すと小さなカードを出す：名前とアイコン・オンライン（または最後のログイン）・アチーブの取得率
//      カードを出しているあいだ、その人は止まる。カードの外を押すか × で閉じる
//    ・設定の「アニメーションを減らす」のときは歩かない
//  見た目は css/style.css の「広場」
// ═══════════════════════════════════════════════════════════════

import { lastLoginText as lastText } from "../../../pages/friends/friends-sample.js";   // 最後のログインの書き方（フレンドのページと同じ）

const rand = (min, max) => min + Math.random() * (max - min);
const reduced = () => document.documentElement.classList.contains("reduce-motion");
const X_MIN = 6, X_MAX = 90;        // 歩ける左右のはんい（広場の幅に対する %）
const Y_FRONT = 14, Y_BACK = 36;    // 足もとの高さ（下から %）：手前 〜 奥（下は左下の札にかからないように）
const SPEED = 90;                    // 1 % 進むのにかかる時間（ミリ秒）。大きいほど ゆっくり

/** 人の形（丸い頭 ＋ 肩。頭のまわりは少しあける） */
const PERSON = `<svg class="home-friend-body" viewBox="0 0 40 48" aria-hidden="true">
  <circle cx="20" cy="12.5" r="10"/>
  <path d="M3 48 V40 C3 31 9.5 26.5 14.5 26 A12.5 12.5 0 0 0 25.5 26 C30.5 26.5 37 31 37 40 V48 Z"/>
</svg>`;

export function mountPlaza({ scene, layer, friends }) {
  const people = [];   // { f, el, x, z, timer, paused }
  let open = null;     // カードを出している人

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
    card.style.setProperty("--c", f.color);
    card.setAttribute("aria-label", `${f.name} さん`);
    card.innerHTML = `
      <button type="button" class="home-friend-close" aria-label="閉じる">×</button>
      <div class="home-friend-top">
        <span class="home-friend-avatar">${f.name.slice(0, 1)}</span>
        <span class="home-friend-who"><b>${f.name}</b><small>ID：${f.userId}</small></span>
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
      </div>`;
    card.querySelector(".home-friend-close").addEventListener("click", closeCard);
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
  /** 歩いているとちゅうで止める（今いるところを、x・z にもどす） */
  const stopHere = (p) => {
    const s = scene.getBoundingClientRect(), cs = getComputedStyle(p.el);
    p.x = (parseFloat(cs.left) / s.width) * 100;
    p.z = Math.max(0, Math.min(1, ((parseFloat(cs.bottom) / s.height) * 100 - Y_FRONT) / (Y_BACK - Y_FRONT)));
    p.el.style.transitionDuration = "0ms";
    p.el.classList.remove("is-walking");
    put(p);
  };
  /** x（左右 %）・z（奥ゆき 0 手前 〜 1 奥）に置く。奥ほど上に・小さく・うしろに */
  const put = (p) => {
    p.el.style.left = `${p.x}%`;
    p.el.style.bottom = `${Y_FRONT + p.z * (Y_BACK - Y_FRONT)}%`;
    p.el.style.setProperty("--depth", p.z.toFixed(3));
    p.el.style.zIndex = String(8 - Math.round(p.z * 5));   // 手前の人ほど前（スタッピーは 9 で、いつもいちばん前）
  };
  const walk = (p) => {
    p.timer = setTimeout(() => {
      if (!p.paused && !reduced()) {
        const x = rand(X_MIN, X_MAX), z = Math.random();
        const dist = Math.hypot(x - p.x, (z - p.z) * 30);
        const ms = Math.max(600, dist * SPEED);
        p.el.style.setProperty("--face", x < p.x ? "-1" : "1");   // 進む向き（名前は反転しない）
        p.el.style.transitionDuration = `${ms}ms`;
        p.el.classList.add("is-walking");
        p.x = x; p.z = z;
        put(p);
        setTimeout(() => { p.el.classList.remove("is-walking"); placeCard(); }, ms);
      }
      walk(p);
    }, rand(2500, 7000));
  };

  for (const f of friends) {
    const el = document.createElement("button");
    el.type = "button";
    el.className = `home-friend${f.online ? " is-online" : ""}`;
    el.style.setProperty("--c", f.color);
    el.setAttribute("aria-label", `${f.name} さん（押すと くわしく見られます）`);
    el.innerHTML = `<span class="home-friend-name">${f.online ? "<i></i>" : ""}${f.name}</span>${PERSON}<span class="home-friend-shadow"></span>`;
    const p = { f, el, x: rand(X_MIN, X_MAX), z: Math.random(), timer: 0, paused: false };
    el.addEventListener("click", () => openCard(p));
    put(p);
    layer.append(el);
    people.push(p);
    walk(p);
  }

  return {
    destroy() { people.forEach((p) => clearTimeout(p.timer)); card.remove(); layer.replaceChildren(); },
  };
}
