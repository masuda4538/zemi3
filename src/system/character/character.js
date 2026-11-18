// ═══════════════════════════════════════════════════════════════
//  キャラクター「スタッピー」：動きと、なでる・押すしかけ　［このフォルダーの入口：character.js］
//
//  使い方（ホームの JS でも、React のページでも同じ）
//    import { mountCharacter } from "<ここまでの道>/character/character.js";
//    const stappy = mountCharacter(入れる場所の要素, {
//      pose: "main",            … 絵（"main" ＝ 立ち姿 ／ "jump" ＝ 跳ねている姿。images.js）
//      motion: "sway",          … いつもの動き（"sway" ＝ ゆらゆら ／ "hop" ＝ ぴょんぴょん ／ "none"）
//      shadow: false,           … 足もとにかげを出すか（"hop" のときに合わせて動く）
//      onSay: (text) => {},     … ふきだしに出したい言葉が来る（自分のふきだしに入れる）
//      onRestore: () => {},     … いつもの言葉にもどしてほしいとき
//      onPet: (count) => {},    … なでたとき（count ＝ その日になでた回数）。アチーブなどに使う
//    });
//    stappy.destroy();          … 片づける（React の useEffect のおわりで呼ぶ）
//
//  スタッピーがすること
//    ・いつも … ふわふわ呼吸（少しふくらんだり しぼんだり）、ときどき まばたき
//    ・ときどき自分から … きょろきょろ ／ 小さくジャンプ ／ くるっと回る ／ もじもじ（IDLE_MOTIONS）
//    ・なでる（上でマウスを左右に動かす・指でこする）… ほっぺが赤くなる・ハートやキラキラ・音符が出る・ゆれる
//    ・押す（Enter キーでも）… ぴょんと大きく跳ねて、ひとこと
//    ・1 分さわらないと … いねむり（目をとじて Zzz）。なでる・押すと起きる
//  見た目は character.css、言葉は lines.js、画像は images/（images.js）
//  ※ 設定の「アニメーションを減らす」がオンのときは、自分から動く・まばたきはしない
// ═══════════════════════════════════════════════════════════════
import { IMAGES } from "./images.js";
import { PET_LINES, CLICK_LINES, SLEEP_LINES, WAKE_LINES } from "./lines.js";
import "./character.css";

const PET_STEP = 90;           // マウスをこれだけ（px）動かしたら 1 回なでた
const PET_GAP = 220;           // 続けてなでたと数えるまでの、いちばん短い間（ミリ秒）
const SAY_MS = 2600;           // ことばを出しておく時間（ミリ秒）。そのあと、いつもの言葉にもどる
const SLEEP_MS = 60 * 1000;    // これだけさわらないと、いねむりする（ミリ秒）
const IDLE_MIN = 7000, IDLE_MAX = 14000;     // 自分から動く間（ミリ秒。この間でばらばら）
const BLINK_MIN = 2500, BLINK_MAX = 6000;    // まばたきの間（ミリ秒）
const IDLE_MOTIONS = ["is-look", "is-hop", "is-spin", "is-wiggle"];   // 自分から動くときの動き（character.css）

/** 顔の場所（画像の大きさに対する %）。まばたきのまぶた（lids）と、ほっぺ（cheeks）を重ねる場所
 *  [左, 上, 幅, 高さ, 回転（度）]。jump の絵は もともと目をとじているので、まぶたはなし */
const FACE = {
  main: {
    lids: [[35.8, 35.2, 11.7, 13.5, -8], [62.6, 30.6, 11.1, 12.6, -8]],
    cheeks: [[27.7, 44.8, 12, 8], [70.8, 37.8, 12, 8]],
  },
  jump: {
    lids: [],
    cheeks: [[22.7, 33, 11.7, 8], [61.3, 37.4, 11.7, 8]],
  },
};

const pick = (list) => list[Math.floor(Math.random() * list.length)];
const rand = (min, max) => min + Math.random() * (max - min);
const pad = (n) => String(n).padStart(2, "0");
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const reduced = () => document.documentElement.classList.contains("reduce-motion");

// ───────── なでた回数（その日のあいだだけ。アプリを閉じると 0 にもどる。ホームと記録で共通） ─────────
const countKey = () => `stappy-pet:${today()}`;
function readCount() { try { return Number(sessionStorage.getItem(countKey())) || 0; } catch { return 0; } }
function saveCount(n) { try { sessionStorage.setItem(countKey(), String(n)); } catch { /* 保存できなくても動く */ } }

// ───────── 飛んでいくもの（ハート・キラキラ・音符） ─────────
const SHAPES = {
  heart: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.9 4.3 7.3C19.5 16.4 12 21 12 21z"/></svg>',
  sparkle: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5c.6 4.7 2.3 8 9.5 10.5-7.2 2.5-8.9 5.8-9.5 10.5-.6-4.7-2.3-8-9.5-10.5C9.7 9.5 11.4 6.2 12 1.5z"/></svg>',
  note: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 3.5 20 1v14.2a3.3 3.3 0 1 1-2-3V6.1l-7 1.6v9.5a3.3 3.3 0 1 1-2-3z"/></svg>',
};
/** 画面の x, y から、ふわっと上がって消えるものを 1 つ出す（kind：heart／sparkle／note） */
function burst(x, y, kind = "heart", big = false) {
  const p = document.createElement("span");
  p.className = `chara-burst is-${kind}${big ? " is-big" : ""}`;
  p.setAttribute("aria-hidden", "true");
  p.innerHTML = SHAPES[kind];
  p.style.left = `${x}px`;
  p.style.top = `${y}px`;
  p.style.setProperty("--dx", `${Math.round(rand(-14, 14))}px`);   // 少し左右にずらす
  document.body.append(p);
  setTimeout(() => p.remove(), 1100);
}

/** アニメーションを最初からやり直す（クラスを外して付け直す） */
function replay(node, cls, all) {
  node.classList.remove(...all);
  void node.offsetWidth;   // いったん描き直させる（これがないと同じアニメーションが始まらない）
  node.classList.add(cls);
}

// ───────── 本体 ─────────
export function mountCharacter(host, { pose = "main", motion = "sway", shadow = false, onSay, onRestore, onPet } = {}) {
  const face = FACE[pose] ?? FACE.main;

  // 形：[ボタン（なでる・押す）[動き（反応・自分から）[呼吸[いつもの動き[絵・まぶた・ほっぺ]]]] かげ・Zzz]
  const root = document.createElement("button");
  root.type = "button";
  root.className = `chara pose-${pose}`;   // pose-main ／ pose-jump（絵の種類）
  root.setAttribute("aria-label", "スタッピー（なでる・押すと反応します）");
  root.title = "なでてみよう！";
  root.innerHTML = `
    <span class="chara-act">
      <span class="chara-breath">
        <span class="chara-base is-${motion}">
          <img class="chara-img" src="${IMAGES[pose] ?? IMAGES.main}" alt="" draggable="false">
          ${face.cheeks.map(([l, t, w, h]) => `<span class="chara-cheek" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></span>`).join("")}
          ${face.lids.map(([l, t, w, h, r]) => `<span class="chara-lid" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%;--r:${r}deg"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="50" cy="50" rx="50" ry="50"/><path d="M14 54 Q50 82 86 54"/></svg></span>`).join("")}
        </span>
      </span>
    </span>
    ${shadow ? `<span class="chara-shadow is-${motion}"></span>` : ""}
    <span class="chara-zzz" aria-hidden="true"><i>Z</i><i>z</i><i>z</i></span>`;
  host.replaceChildren(root);
  const act = root.querySelector(".chara-act");
  const ACTS = ["is-petted", "is-jump", ...IDLE_MOTIONS];

  let count = readCount();
  let sayTimer = 0, idleTimer = 0, blinkTimer = 0, sleepTimer = 0, blushTimer = 0;
  let sleeping = false;

  /** ことばを出す（keep が true なら、もどさない：いねむり中） */
  const say = (text, keep = false) => {
    onSay?.(text);
    clearTimeout(sayTimer);
    if (!keep) sayTimer = setTimeout(() => onRestore?.(), SAY_MS);
  };

  // ── いねむり ──
  const sleep = () => {
    if (sleeping) return;
    sleeping = true;
    root.classList.add("is-sleeping");
    say(pick(SLEEP_LINES), true);
  };
  /** さわったら呼ぶ：いねむりしていたら起きる。1 分後にまたいねむり */
  const touch = () => {
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(sleep, SLEEP_MS);
    if (!sleeping) return false;
    sleeping = false;
    root.classList.remove("is-sleeping");
    replay(act, "is-jump", ACTS);
    say(pick(WAKE_LINES));
    return true;
  };

  // ── まばたき・自分から動く（ばらばらの間で、くり返す） ──
  const blinkLoop = () => {
    blinkTimer = setTimeout(() => {
      if (!sleeping && !reduced()) {
        root.classList.add("is-blink");
        setTimeout(() => root.classList.remove("is-blink"), 180);
      }
      blinkLoop();
    }, rand(BLINK_MIN, BLINK_MAX));
  };
  const idleLoop = () => {
    idleTimer = setTimeout(() => {
      if (!sleeping && !reduced() && act.classList.length === 1) replay(act, pick(IDLE_MOTIONS), ACTS);
      idleLoop();
    }, rand(IDLE_MIN, IDLE_MAX));
  };

  // ── ほっぺを赤くする（なでているあいだ。少したつと もどる） ──
  const blush = () => {
    root.classList.add("is-blush");
    clearTimeout(blushTimer);
    blushTimer = setTimeout(() => root.classList.remove("is-blush"), 1600);
  };

  // ── なでる ──
  let moved = 0, lastX = null, lastY = null, lastPet = 0, dragged = 0;
  const pet = (x, y) => {
    if (touch()) return;   // 起こしただけ
    count = readCount() + 1;   // ホームと記録で同じ数を使う
    saveCount(count);
    blush();
    replay(act, "is-petted", ACTS);
    burst(x, y - 10, "heart");
    if (count >= 5 && Math.random() < 0.5) burst(x + 16, y - 2, pick(["sparkle", "note"]));
    if (count >= 20) burst(x - 14, y - 4, "heart");   // たくさんなでると、ハートがふえる
    say(pick(PET_LINES.filter(([n]) => count >= n).at(-1)[1]));
    onPet?.(count);
  };
  const onMove = (e) => {
    if (lastX != null) {
      const d = Math.hypot(e.clientX - lastX, e.clientY - lastY);
      moved += d;
      dragged += d;
    }
    lastX = e.clientX; lastY = e.clientY;
    if (moved >= PET_STEP && Date.now() - lastPet >= PET_GAP) {
      moved = 0;
      lastPet = Date.now();
      pet(e.clientX, e.clientY);
    }
  };
  const onLeave = () => { lastX = null; moved = 0; };
  const onDown = () => { dragged = 0; };
  // ── 押す（なでている途中で指をはなしたときは、押したことにしない） ──
  const onClick = (e) => {
    if (dragged > 30) { dragged = 0; return; }
    if (touch()) return;   // 起こしただけ
    const r = root.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 3;   // Enter キーのときは まん中の上
    replay(act, "is-jump", ACTS);
    burst(x, y - 10, "heart", true);
    burst(x + 18, y, "sparkle");
    say(pick(CLICK_LINES));
  };
  // ゆれる・跳ねるが終わったら、いつもの動きにもどす
  const onEnd = (e) => {
    if (e.target === act) act.classList.remove(...ACTS);
  };

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("click", onClick);
  act.addEventListener("animationend", onEnd);
  blinkLoop();
  idleLoop();
  touch();

  return {
    root,
    destroy() {
      [sayTimer, idleTimer, blinkTimer, sleepTimer, blushTimer].forEach(clearTimeout);
      root.remove();
    },
  };
}
