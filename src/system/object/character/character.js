// ═══════════════════════════════════════════════════════════════
//  キャラクター「スタッピー」：動きと、なでる・押すしかけ　［このフォルダーの入口：character.js］
//
//  使い方（ホームの JS でも、React のページでも同じ）
//    import { mountCharacter } from "<ここまでの道>/object/character/character.js";
//    const stappy = mountCharacter(入れる場所の要素, {
//      pose: "main",            … 絵（"main" ＝ 立ち姿 ／ "jump" ＝ 跳ねている姿。images.js）
//      motion: "sway",          … いつもの動き（"sway" ＝ ゆらゆら ／ "hop" ＝ ぴょんぴょん ／ "none"）
//      shadow: false,           … 足もとにかげを出すか（"hop" のときに合わせて動く）
//      follow: false,           … マウスのほうへ体を向けたり、立体的に（3D に）かたむけたりするか。近づくと うれしそうにする
//      grab: false,             … マウスでつかんで、投げられるか（重力で落ちて、地面で ぽよんと はねる。そのあと歩いて帰る）
//      roam: false,             … しばらくさわらないと、画面の中を歩きまわる（おさんぽ）。しばらくしたら もとの場所に帰る
//      roamHeight: 0,           … おさんぽ中の絵の高さ（px。0 ならそのまま）。大きな絵を、歩くときだけ小さくしたいとき
//      ground: null,            … 地面の高さ（関数。() => ({ top, bottom }) 画面の上からの px）。あると、おさんぽでは足もとが
//                                 この間だけを歩き（空を歩かない）、投げたときも この下のはし（bottom）に落ちる。なければ画面ぜんぶ
//      onRoam: (on) => {},      … おさんぽに出かけた（true）・帰ってきた（false）とき
//      stroll: { area, mover, onMove, rise, avoid },
//                               … その場の近くを とことこ歩く。area ＝ 歩ける枠、mover ＝ 動かす要素（なければ入れる場所）、
//                                 onMove(ratio) ＝ 歩いたあと、枠の中のどこにいるか（0 ＝ 左はし 〜 1 ＝ 右はし）
//                                 rise ＝ 奥へ歩ける高さ（px。0 なら左右だけ）。奥へ行くほど上に・小さく見える（mover の --depth：0 手前 〜 1 奥）
//                                 avoid ＝ 立ち止まらない場所を返す関数（例：() => [噴水.getBoundingClientRect(), …]。1 つでも配列でもよい）。通りぬけはする
//      talk: () => [],          … しゃべる言葉を足したいとき（例：今日の学習時間に合わせた言葉）。呼ぶたびに配列を返す
//      onSay: (text) => {},     … ふきだしに出したい言葉が来る（自分のふきだしに入れる）
//      onRestore: () => {},     … いつもの言葉にもどしてほしいとき
//      onPet: (count) => {},    … なでたとき（count ＝ その日になでた回数）。アチーブなどに使う
//    });
//    stappy.destroy();          … 片づける（React の useEffect のおわりで呼ぶ）
//
//  スタッピーがすること
//    ・いつも … ふわふわ呼吸（少しふくらんだり しぼんだり）、ときどき まばたき
//    ・ときどき自分から … きょろきょろ ／ 小さくジャンプ ／ くるっと回る ／ もじもじ ／ 羽ばたき ／ おじぎ ／ ダンス ／ よろこびジャンプ（IDLE_MOTIONS）
//                         ときどき ひとりごと（時間帯の言葉・talk の言葉。lines.js の TIME_LINES）
//    ・なでる（上でマウスを左右に動かす・指でこする）… ほっぺが赤くなる・ハートやキラキラ・音符が出る・ゆれる
//    ・押す（Enter キーでも）… ぴょんと大きく跳ねて、ひとこと
//    ・follow … マウスのほうへ 立体的に かたむく（3D の回転。かたむいた がわは少し暗く）・向きを変える。近くに来ると よろこぶ（NEAR_LINES）
//    ・grab   … マウスでつかむと持ち上がり、はなすと投げた勢いで飛んで、重力で落ちて、地面で ぽよんと はねる。止まったら歩いて帰る
//    ・stroll … ときどき、枠の中をとことこ歩く（進む向きに体を向ける。rise があれば奥にも行く：奥ほど小さく）
//    ・roam   … さわらずに少したつと、ぴょんぴょん歩いて画面の中をおさんぽ（進む向きに体を向ける）。
//               歩いているときも、なでる・押すができる。おさんぽ中の言葉は、自分の小さなふきだしに出す
//    ・1 分さわらないと … いねむり（目をとじて Zzz）。なでる・押すと起きる（おさんぽ中なら、帰ってから ねる）
//  見た目は character.css、言葉は lines.js、画像は images/（images.js）
//  ※ 設定の「アニメーションを減らす」がオンのときは、自分から動く・まばたき・おさんぽはしない
// ═══════════════════════════════════════════════════════════════
import { IMAGES } from "./images.js";
import {
  PET_LINES, CLICK_LINES, SLEEP_LINES, WAKE_LINES,
  TIME_LINES, NEAR_LINES, ROAM_START_LINES, ROAM_LINES, ROAM_BACK_LINES, GRAB_LINES, LAND_LINES,
} from "./lines.js";
import "./character.css";

const PET_STEP = 90;           // マウスをこれだけ（px）動かしたら 1 回なでた
const PET_GAP = 220;           // 続けてなでたと数えるまでの、いちばん短い間（ミリ秒）
const SAY_MS = 2600;           // ことばを出しておく時間（ミリ秒）。そのあと、いつもの言葉にもどる
const SLEEP_MS = 60 * 1000;    // これだけさわらないと、いねむりする（ミリ秒）
const IDLE_MIN = 7000, IDLE_MAX = 14000;     // 自分から動く間（ミリ秒。この間でばらばら）
const BLINK_MIN = 2500, BLINK_MAX = 6000;    // まばたきの間（ミリ秒）
const TALK_RATE = 0.35;                      // 自分から動いたときに、ひとりごとを言う割合
/** 自分から動くときの動き（character.css） */
const IDLE_MOTIONS = ["is-look", "is-hop", "is-spin", "is-wiggle", "is-flap", "is-bow", "is-dance", "is-joy"];
// マウスを追う
const NEAR_PX = 130;           // これより近くにマウスが来たら「近い」（よろこぶ）
const NEAR_COOL = 20 * 1000;   // よろこぶのは、この間に 1 回まで（ミリ秒）
const LEAN_MAX = 9;            // いちばん かたむく角度（度。画面の中で）
const TURN_Y = 22, TURN_X = 12;   // 立体的に回る いちばん大きな角度（度。左右 ／ 上下）
// おさんぽ
const ROAM_MIN = 15 * 1000, ROAM_MAX = 25 * 1000;   // さわらずに、これだけたつと出かける（ミリ秒）
const ROAM_AGAIN_MIN = 40 * 1000, ROAM_AGAIN_MAX = 70 * 1000;   // 帰ってきてから、次に出かけるまで
const STEP_PX = 70;            // 1 歩で進む長さ（px）
const STEP_MS = 420;           // 1 歩にかかる時間（ミリ秒。character.css の is-step と同じ）
const EDGE = 12;               // 画面のはしから、これだけはなれたところまで行ける（px）
// その場の近くを歩く（stroll）
const STROLL_MIN = 6000, STROLL_MAX = 12000;   // 歩きだすまでの間（ミリ秒）
const STROLL_STEP = 38;        // 1 歩で進む長さ（px）
const STROLL_PAD = 6;          // 枠のはしから、これだけはなれたところまで行ける（px）
// つかんで投げる（grab）
const GRAB_PX = 10;            // つかんだまま これだけ動かしたら「持ち上げた」（px。少しなら ただ押しただけ）
const GRAVITY = 0.0026;        // 重力（px／ミリ秒²。大きいほど早く落ちる）
const BOUNCE = 0.45;           // 地面ではねかえる強さ（0〜1。1 だと同じ高さまで はねる）
const WALL = 0.6;              // かべ・天井ではねかえる強さ
const FRICTION = 0.82;         // 地面についたとき、横の勢いが のこる割合

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
const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
/** 今の時間帯の言葉（lines.js の TIME_LINES） */
const timeLines = () => { const h = new Date().getHours(); return TIME_LINES.filter(([from]) => h >= from).at(-1)[1]; };

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
export function mountCharacter(host, {
  pose = "main", motion = "sway", shadow = false, follow = false, grab = false, roam = false, roamHeight = 0, ground = null, stroll = null, talk,
  onSay, onRestore, onPet, onRoam,
} = {}) {
  const face = FACE[pose] ?? FACE.main;

  // 形：[ボタン（なでる・押す）[向き・かたむき[動き（反応・自分から）[呼吸[いつもの動き[絵・まぶた・ほっぺ]]]]] かげ・Zzz・小さなふきだし]
  const root = document.createElement("button");
  root.type = "button";
  root.className = `chara pose-${pose}`;   // pose-main ／ pose-jump（絵の種類）
  root.setAttribute("aria-label", "スタッピー（なでる・押すと反応します）");
  root.title = "なでてみよう！";
  root.innerHTML = `
    <span class="chara-lean">
      <span class="chara-act">
        <span class="chara-breath">
          <span class="chara-base is-${motion}">
            <img class="chara-img" src="${IMAGES[pose] ?? IMAGES.main}" alt="" draggable="false">
            ${face.cheeks.map(([l, t, w, h]) => `<span class="chara-cheek" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%"></span>`).join("")}
            ${face.lids.map(([l, t, w, h, r]) => `<span class="chara-lid" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%;--r:${r}deg"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><ellipse cx="50" cy="50" rx="50" ry="50"/><path d="M14 54 Q50 82 86 54"/></svg></span>`).join("")}
          </span>
        </span>
      </span>
    </span>
    ${shadow ? `<span class="chara-shadow is-${motion}"></span>` : ""}
    <span class="chara-zzz" aria-hidden="true"><i>Z</i><i>z</i><i>z</i></span>
    <span class="chara-say" aria-live="polite"></span>`;
  host.replaceChildren(root);
  const lean = root.querySelector(".chara-lean");
  const act = root.querySelector(".chara-act");
  const img = root.querySelector(".chara-img");
  const bubble = root.querySelector(".chara-say");
  const ACTS = ["is-petted", "is-jump", "is-step", "is-land", ...IDLE_MOTIONS];

  let count = readCount();
  let sayTimer = 0, idleTimer = 0, blinkTimer = 0, sleepTimer = 0, blushTimer = 0, roamTimer = 0, bubbleTimer = 0, strollTimer = 0;
  let sleeping = false, alive = true;

  // ── ことば ──
  /** ことばを出す（keep が true なら、もどさない：いねむり中）。おさんぽ中は、自分の小さなふきだしに出す */
  const say = (text, keep = false) => {
    if (roaming) {
      bubble.textContent = text;
      bubble.classList.remove("is-on"); void bubble.offsetWidth; bubble.classList.add("is-on");
      clearTimeout(bubbleTimer);
      if (!keep) bubbleTimer = setTimeout(() => bubble.classList.remove("is-on"), SAY_MS);
      return;
    }
    onSay?.(text);
    clearTimeout(sayTimer);
    if (!keep) sayTimer = setTimeout(() => onRestore?.(), SAY_MS);
  };
  /** ひとりごとの言葉（時間帯の言葉 ＋ 使う人が足した言葉） */
  const chatLines = () => [...timeLines(), ...(talk?.() ?? [])];

  // ── いねむり ──
  let sleepAfterRoam = false;
  const sleep = () => {
    if (sleeping) return;
    if (roaming) { sleepAfterRoam = true; return; }   // おさんぽ中なら、帰ってから ねる
    sleeping = true;
    root.classList.add("is-sleeping");
    say(pick(SLEEP_LINES), true);
  };
  /** さわったら呼ぶ：いねむりしていたら起きる。1 分後にまたいねむり。おさんぽの時計も 0 から */
  const touch = () => {
    clearTimeout(sleepTimer);
    sleepTimer = setTimeout(sleep, SLEEP_MS);
    sleepAfterRoam = false;
    planRoam(rand(ROAM_MIN, ROAM_MAX));
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
  /** 自分から動く（ダンスのときは音符、よろこびジャンプのときはキラキラも出す） */
  const doMotion = (cls) => {
    replay(act, cls, ACTS);
    const r = root.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height * 0.25;
    if (cls === "is-dance") [0, 500, 1000].forEach((ms, i) => setTimeout(() => burst(x + (i % 2 ? 18 : -18), y, "note"), ms));
    if (cls === "is-joy") { burst(x - 14, y, "sparkle"); setTimeout(() => burst(x + 14, y - 6, "sparkle"), 420); }
  };
  const idleLoop = () => {
    idleTimer = setTimeout(() => {
      if (!sleeping && !walking && !grabbing && !flying && !reduced() && act.classList.length === 1) {
        doMotion(pick(IDLE_MOTIONS));
        if (Math.random() < TALK_RATE) say(pick(roaming ? [...ROAM_LINES, ...chatLines()] : chatLines()));
      }
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
  let moved = 0, lastX = null, lastY = null, lastPet = 0, dragged = 0, hovered = false;
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
    if (grabbing) { moveGrab(e); return; }
    if (flying) return;
    if (pressed && Math.hypot(e.clientX - pressed.x, e.clientY - pressed.y) > GRAB_PX) { startGrab(e); return; }
    hovered = true;
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
  const onLeave = () => { lastX = null; moved = 0; hovered = false; };
  let pressed = null;   // マウスのボタンを押した場所（つかむ用）
  const onDown = (e) => {
    dragged = 0;
    if (grab && e.pointerType === "mouse" && e.button === 0 && !flying) pressed = { x: e.clientX, y: e.clientY };   // 指のときは「なでる」だけ
  };
  const onUp = (e) => { pressed = null; if (grabbing) releaseGrab(e); };
  // ── 押す（なでている途中で指をはなしたときは、押したことにしない） ──
  const onClick = (e) => {
    if (dragged > 30) { dragged = 0; return; }
    if (touch()) return;   // 起こしただけ
    const r = root.getBoundingClientRect();
    const x = e.clientX || r.left + r.width / 2, y = e.clientY || r.top + r.height / 3;   // Enter キーのときは まん中の上
    replay(act, "is-jump", ACTS);
    burst(x, y - 10, "heart", true);
    burst(x + 18, y, "sparkle");
    say(pick([...CLICK_LINES, ...chatLines()]));
  };
  // ゆれる・跳ねるが終わったら、いつもの動きにもどす
  const onEnd = (e) => {
    if (e.target === act) act.classList.remove(...ACTS);
  };

  // ── マウスを追う（follow）：かたむき・向き。近くに来たら よろこぶ ──
  let faceDir = 1, lastNear = 0, frame = 0;
  const setFace = (dir) => { faceDir = dir; lean.style.setProperty("--face", String(dir)); };
  const onPointer = (e) => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      if (sleeping || walking || flying || grabbing || reduced()) { straighten(); return; }
      const r = root.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      // マウスのほうへ かたむく（遠いほど少し。左右の向きは、はっきり左右にいるときだけ変える）
      if (Math.abs(dx) > 60) setFace(dx < 0 ? -1 : 1);
      const tilt = Math.max(-LEAN_MAX, Math.min(LEAN_MAX, (dx / Math.max(160, dist)) * LEAN_MAX));
      lean.style.setProperty("--lean", `${(tilt * faceDir).toFixed(1)}deg`);   // 左を向いているときは、回す向きも反対（絵を左右反転しているため）
      // 立体的に回る：マウスが右なら右を向くように（左右）、上なら少し見上げるように（上下）。回ったがわは少し暗く
      const reach = Math.max(220, dist);
      const ry = Math.max(-TURN_Y, Math.min(TURN_Y, (dx / reach) * TURN_Y));
      const rx = Math.max(-TURN_X, Math.min(TURN_X, (-dy / reach) * TURN_X));
      lean.style.setProperty("--ry", `${ry.toFixed(1)}deg`);
      lean.style.setProperty("--rx", `${rx.toFixed(1)}deg`);
      lean.style.setProperty("--shade", (1 - Math.abs(ry) / 160).toFixed(3));
      // 近くに来たら よろこぶ（ときどき）
      if (dist < NEAR_PX && Date.now() - lastNear > NEAR_COOL && act.classList.length === 1) {
        lastNear = Date.now();
        doMotion("is-joy");
        say(pick(NEAR_LINES));
      }
    });
  };
  /** まっすぐにもどす（かたむき・立体の回転） */
  const straighten = () => { ["--lean", "--ry", "--rx"].forEach((v) => lean.style.setProperty(v, "0deg")); lean.style.setProperty("--shade", "1"); };
  const onPointerOut = (e) => { if (!e.relatedTarget) straighten(); };   // 画面の外へ出たら まっすぐ

  // ── おさんぽ（roam）：画面の中を ぴょんぴょん歩いて、しばらくしたら もとの場所に帰る ──
  let roaming = false, walking = false;
  let job = 0;   // 今の「おさんぽ・帰る」の番号。つかまれたら番号が変わって、前のおさんぽは やめる
  const homeBox = { w: 0, h: 0 };
  function planRoam(ms) {
    clearTimeout(roamTimer);
    if (roam) roamTimer = setTimeout(startRoam, ms);
  }
  /** もとの場所（host）の、画面での位置 */
  const homeRect = () => host.getBoundingClientRect();
  /** 行ける場所（画面のはしから EDGE はなれたところ。体がはみ出さないように） */
  const clampX = (x) => Math.max(EDGE, Math.min(window.innerWidth - homeBox.w - EDGE, x));
  const clampY = (y) => Math.max(EDGE, Math.min(window.innerHeight - homeBox.h - EDGE, y));
  /** 行き先の高さ（体の上のはし）：ground があれば、足もとが地面の中に来るように。なければ画面のどこでも */
  const randomTop = () => {
    const g = ground?.();
    if (!g) return clampY(rand(0, window.innerHeight));
    return clampY(rand(g.top, g.bottom) - homeBox.h);
  };
  const randomSpot = () => {
    const now = root.getBoundingClientRect();
    for (let i = 0; i < 8; i++) {   // 今の場所から、ある程度はなれたところを選ぶ
      const x = clampX(rand(0, window.innerWidth)), y = randomTop();
      if (Math.hypot(x - now.left, y - now.top) > 180) return [x, y];
    }
    return [clampX(rand(0, window.innerWidth)), randomTop()];
  };
  /** もとの場所からはなれる：体をページのいちばん上に出して（position: fixed）、もとの場所は同じ大きさであけておく */
  const leaveHome = () => {
    const r = root.getBoundingClientRect();
    const ih = img.getBoundingClientRect().height;
    const k = roamHeight ? Math.min(1, roamHeight / ih) : 1;   // おさんぽ中の大きさ（roamHeight のとき小さくする）
    homeBox.w = r.width * k; homeBox.h = r.height * k;
    host.style.width = `${r.width}px`; host.style.height = `${r.height}px`;   // もとの場所が つぶれないように
    img.style.height = `${ih}px`;                                            // 今の大きさから
    root.style.left = `${r.left + (r.width - homeBox.w) / 2}px`;             // 足もとの まん中をそろえる
    root.style.top = `${r.top + r.height - homeBox.h}px`;
    root.classList.add("is-roaming");
    document.body.append(root);
    void img.offsetWidth;
    img.style.height = `${ih * k}px`;                                        // ふわっと小さくなる（character.css）
    roaming = true;
    onRoam?.(true);
  };
  /** もとの場所にもどる */
  const backHome = () => {
    root.classList.remove("is-roaming");
    root.style.left = root.style.top = "";
    img.style.height = "";
    host.style.width = host.style.height = "";
    bubble.classList.remove("is-on");
    host.append(root);
    roaming = false;
    setFace(1);
    onRoam?.(false);
  };
  /** (x, y) まで、1 歩ずつ ぴょんぴょん歩く。なでられている・ねているあいだは 止まって待つ */
  const walkTo = async (x, y) => {
    const my = job;
    walking = true;
    straighten();
    for (;;) {
      if (!alive || job !== my) { walking = false; return false; }   // つかまれた・片づけた → やめる
      if (hovered || sleeping) { await wait(300); continue; }
      const left = parseFloat(root.style.left), top = parseFloat(root.style.top);
      const dx = x - left, dy = y - top, dist = Math.hypot(dx, dy);
      if (dist < 2) break;
      if (Math.abs(dx) > 4) setFace(dx < 0 ? -1 : 1);   // 進む向きに体を向ける
      const k = Math.min(1, STEP_PX / dist);
      root.style.left = `${left + dx * k}px`;
      root.style.top = `${top + dy * k}px`;
      replay(act, "is-step", ACTS);
      await wait(STEP_MS);
    }
    walking = false;
    return true;
  };
  async function startRoam() {
    if (!roam || roaming || sleeping || reduced() || !alive) return planRoam(rand(ROAM_MIN, ROAM_MAX));
    if (walking) return planRoam(3000);   // とことこ歩いている最中なら、歩き終わってから
    if (!host.getClientRects().length) return planRoam(rand(ROAM_MIN, ROAM_MAX));   // もとの場所が見えていない（せまい画面など）
    leaveHome();
    const my = ++job;
    say(pick(ROAM_START_LINES));
    const trips = 1 + Math.floor(Math.random() * 3);   // 1〜3 か所 まわる
    for (let i = 0; i < trips && alive && !reduced(); i++) {
      if (!(await walkTo(...randomSpot()))) return;   // つかまれたら、おさんぽは おしまい
      if (Math.random() < 0.5) say(pick(ROAM_LINES));
      await wait(rand(3500, 7000));   // 着いたら少しのんびり（そのあいだも自分から動く）
      if (job !== my) return;
    }
    goHome(my);
  }
  /** もとの場所まで歩いて帰る（おさんぽのおわり・投げられたあと） */
  async function goHome(my) {
    if (!alive || job !== my) return;
    const h = homeRect();
    if (!(await walkTo(h.left + (h.width - homeBox.w) / 2, h.top + h.height - homeBox.h))) return;
    backHome();
    say(pick(ROAM_BACK_LINES));
    replay(act, "is-joy", ACTS);
    if (sleepAfterRoam) { sleepAfterRoam = false; setTimeout(sleep, 1500); return; }
    planRoam(rand(ROAM_AGAIN_MIN, ROAM_AGAIN_MAX));
  }

  // ── つかんで投げる（grab）：持ち上げる → はなすと飛ぶ → 重力で落ちて、地面で ぽよんと はねる → 歩いて帰る ──
  let grabbing = null, flying = false, flyFrame = 0;
  /** 引っぱって のびる・ちぢむ（--sx・--sy）と、回る（--lean） */
  const setStretch = (sx, sy, deg) => {
    root.style.setProperty("--sx", sx.toFixed(3)); root.style.setProperty("--sy", sy.toFixed(3));
    lean.style.setProperty("--lean", `${deg.toFixed(1)}deg`);
  };
  function startGrab(e) {
    pressed = null;
    dragged = 999;   // このあとの click は「押した」にしない
    touch();          // ねていたら起きる・時計を 0 から
    clearTimeout(roamTimer);
    job++;            // おさんぽ・帰るのを やめる
    walking = false;
    if (!roaming) leaveHome();
    const left = parseFloat(root.style.left), top = parseFloat(root.style.top);
    grabbing = { ox: e.clientX - left, oy: e.clientY - top, x: left, y: top, t: performance.now(), vx: 0, vy: 0 };
    root.setPointerCapture?.(e.pointerId);   // 枠の外へ動かしても、ずっとつかめるように
    root.classList.add("is-grabbed");
    act.classList.remove(...ACTS);
    straighten();
    say(pick(GRAB_LINES));
  }
  function moveGrab(e) {
    const g = grabbing, now = performance.now();
    const x = clampX(e.clientX - g.ox), y = clampY(e.clientY - g.oy);
    const dt = Math.max(1, now - g.t);
    // 速さ（px／ミリ秒）。少しずつならして、はなしたときの勢いにする
    g.vx = g.vx * 0.6 + ((x - g.x) / dt) * 0.4;
    g.vy = g.vy * 0.6 + ((y - g.y) / dt) * 0.4;
    g.x = x; g.y = y; g.t = now;
    root.style.left = `${x}px`; root.style.top = `${y}px`;
    setStretch(1, 1, Math.max(-25, Math.min(25, g.vx * 18)));   // 動かした向きに ぶらんと かたむく
  }
  function releaseGrab(e) {
    const g = grabbing;
    grabbing = null;
    root.releasePointerCapture?.(e.pointerId);
    root.classList.remove("is-grabbed");
    flying = true;
    root.classList.add("is-flying");
    let x = g.x, y = g.y, vx = Math.max(-2.5, Math.min(2.5, g.vx)), vy = Math.max(-2.5, Math.min(2.5, g.vy)), last = performance.now(), rest = 0;
    const step = (t) => {
      if (!alive) return;
      const dt = Math.min(32, t - last); last = t;
      // 地面：ground があれば その下のはし（足もと）、なければ画面の下
      const floor = Math.min(window.innerHeight - EDGE, ground?.()?.bottom ?? Infinity) - homeBox.h, right = window.innerWidth - homeBox.w - EDGE;
      vy += GRAVITY * dt;
      x += vx * dt; y += vy * dt;
      if (x < EDGE) { x = EDGE; vx = -vx * WALL; }          // 左のかべ
      if (x > right) { x = right; vx = -vx * WALL; }        // 右のかべ
      if (y < EDGE) { y = EDGE; vy = -vy * WALL; }          // 天井
      let onFloor = false;
      if (y >= floor) {                                      // 地面
        y = floor; onFloor = true;
        if (vy > 0.25) { vy = -vy * BOUNCE; replay(act, "is-land", ACTS); }   // ぽよん（つぶれて はねる）
        else vy = 0;
        vx *= FRICTION;
      }
      root.style.left = `${x}px`; root.style.top = `${y}px`;
      // 落ちる速さで たてに のびる・横に ちぢむ。横の勢いで 少し回る
      const st = onFloor ? 1 : 1 + Math.min(0.22, Math.abs(vy) * 0.16);
      setStretch(1 / st, st, Math.max(-20, Math.min(20, vx * 14)));
      if (Math.abs(vx) > 0.02) setFace(vx < 0 ? -1 : 1);
      rest = onFloor && vy === 0 && Math.abs(vx) < 0.03 ? rest + dt : 0;
      if (rest > 120) return land();
      flyFrame = requestAnimationFrame(step);
    };
    flyFrame = requestAnimationFrame(step);
  }
  /** 止まった：ひとこと言って、少ししたら歩いて帰る */
  function land() {
    flying = false;
    root.classList.remove("is-flying");
    setStretch(1, 1, 0);
    say(pick(LAND_LINES));
    const my = ++job;
    setTimeout(() => goHome(my), 2200);
  }
  // ── その場の近くを歩く（stroll）：枠（area）の中を、左右にとことこ ──
  const mover = stroll?.mover ?? host;
  const rise = stroll?.rise ?? 0;   // 奥へ歩ける高さ（px）
  let strollX = 0, strollZ = 0;     // 今ずらしている長さ（px）と、奥ゆき（0 手前 〜 1 奥）
  /** 歩ける はんい [左, 右]（今ずらしている長さで表す） */
  const strollRange = () => {
    const a = stroll.area.getBoundingClientRect(), m = mover.getBoundingClientRect();
    const base = m.left - strollX;   // ずらしていないときの左はし
    return [a.left + STROLL_PAD - base, a.right - STROLL_PAD - (base + m.width)];
  };
  /** x までずらしたとき、立ち止まらない場所（stroll.avoid）に かかるか（左右だけで見る） */
  const blocked = (x) => {
    const list = [stroll.avoid?.() ?? []].flat().filter((b) => b && b.width);
    const m = mover.getBoundingClientRect(), left = m.left - strollX + x;
    return list.some((b) => left < b.right && left + m.width > b.left);
  };
  const setStroll = (x, z = strollZ) => {
    strollX = x; strollZ = z;
    mover.style.translate = `${Math.round(x)}px ${Math.round(-z * rise)}px`;   // 奥ほど上へ
    mover.style.setProperty("--depth", z.toFixed(3));                         // 奥ほど小さく（css で使う）
    const [lo, hi] = strollRange();
    stroll.onMove?.(hi > lo ? (x - lo) / (hi - lo) : 0.5);
  };
  const strollLoop = () => {
    strollTimer = setTimeout(async () => {
      if (alive && !roaming && !walking && !sleeping && !hovered && !reduced() && host.getClientRects().length) {
        const [lo, hi] = strollRange();
        if (hi - lo > STROLL_STEP * 2) {
          let to = rand(lo, hi);
          if (Math.abs(to - strollX) < STROLL_STEP * 2) to = strollX < (lo + hi) / 2 ? hi : lo;   // 近すぎたら反対がわへ
          for (let i = 0; i < 12 && blocked(to); i++) to = rand(lo, hi);   // 立ち止まらない場所（avoid）なら、えらびなおす
          const toZ = rise ? Math.random() : 0;   // 奥ゆきも ばらばらに
          walking = true;
          straighten();
          setFace(to < strollX ? -1 : 1);
          while (alive && !roaming && (Math.abs(to - strollX) > 1 || Math.abs(toZ - strollZ) > 0.01)) {
            if (hovered || sleeping) { await wait(300); continue; }   // なでられている・ねているあいだは止まる
            const dx = to - strollX, dz = (toZ - strollZ) * rise * 2;   // 奥へは 2 倍の長さに数える（ゆっくり見える）
            const k = Math.min(1, STROLL_STEP / Math.max(1, Math.hypot(dx, dz)));
            setStroll(strollX + dx * k, strollZ + (toZ - strollZ) * k);
            replay(act, "is-step", ACTS);
            await wait(STEP_MS);
          }
          walking = false;
          if (alive && !roaming && Math.random() < 0.4) doMotion(pick(["is-look", "is-joy", "is-flap"]));   // 着いたら ひと動き
        }
      }
      if (alive) strollLoop();
    }, rand(STROLL_MIN, STROLL_MAX));
  };

  /** 画面の大きさが変わったら、おさんぽ中・とことこ中の体が はみ出さないように */
  const onResize = () => {
    if (stroll && !roaming) { const [lo, hi] = strollRange(); setStroll(Math.max(lo, Math.min(hi, strollX))); }
    if (!roaming) return;
    root.style.left = `${clampX(parseFloat(root.style.left))}px`;
    root.style.top = `${clampY(parseFloat(root.style.top))}px`;
  };

  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerleave", onLeave);
  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onUp);
  root.addEventListener("click", onClick);
  act.addEventListener("animationend", onEnd);
  if (follow) {
    document.addEventListener("pointermove", onPointer);
    document.addEventListener("pointerout", onPointerOut);
  }
  window.addEventListener("resize", onResize);
  blinkLoop();
  idleLoop();
  if (stroll) {
    mover.classList.add("chara-mover");
    // 最初の場所が 立ち止まらない場所（avoid）なら、かからない場所へ動かしておく（画面ができてから）
    requestAnimationFrame(() => {
      if (!alive || !stroll.avoid || !blocked(strollX)) return;
      const [lo, hi] = strollRange();
      for (let i = 0; i < 30; i++) { const x = rand(lo, hi); if (!blocked(x)) { setStroll(x); break; } }
    });
    strollLoop();
  }
  touch();

  return {
    root,
    destroy() {
      alive = false;
      [sayTimer, idleTimer, blinkTimer, sleepTimer, blushTimer, roamTimer, bubbleTimer, strollTimer].forEach(clearTimeout);
      cancelAnimationFrame(frame);
      cancelAnimationFrame(flyFrame);
      document.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("resize", onResize);
      root.remove();
    },
  };
}
