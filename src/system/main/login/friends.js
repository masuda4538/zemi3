/* =========================================================
 * 起動画面の黒猫（study-notes の js/splash-friends.js から、猫の動きだけを移したもの）
 *  今は、左の灰色の面のまんなかに座っている大きい猫 1 匹だけを出している（軽くするため）。
 *  端から顔を出す猫も出したいときは、下の CAST に大きさ（'big' / 'mid' / 'small'）を並べる。
 *    例）const CAST = ['big', 'mid', 'small'];   → 3 匹が画面の端やログインの枠のふちから顔を出す
 *  まんなかの猫の動き：まばたき・きょろきょろ・耳・しっぽ・目を細める・首をかしげる・あくび
 *  端の猫の動き（CAST に入れたとき）：
 *
 *  1匹の動き
 *    のぞく・ぴょこん・かしげる・のび・しっぽ・あくび・うとうと・毛づくろい・猫パンチ・手をふる・耳だけ・ちらっ
 *  2匹の動き（となりどうし）
 *    親子・見つめあう・かくれんぼ
 *  マウスへの反応
 *    目がマウスを追いかける ／ マウスを乗せると、目を細める（^ ^）
 *    猫の上でマウスを動かしてなでると、頭をすりよせ、耳を寝かせ、のどを鳴らして「ゴロゴロ」と出る
 *    マウスが近づくと、前足をのばして取ろうとする（ちょいちょい）
 *    猫をクリックすると、びっくりして目がまんまるになり、さっと引っこむ（まんなかの猫は跳ねるだけ）
 *  ダークモード（夜）
 *    猫はみんな寝ている（目を閉じて、ゆっくり息をする）。ときどき「Zz」。なでると寝言を言う
 *  パスワードを「表示」にしたとき（setShy）
 *    まんなかの猫が、パスワードを見ないようにする。「表示」にするたびに次のどれか
 *      両手で目を隠す ／ そっぽを向く ／ 丸くなる（どれも、ときどき ちらっとのぞく）
 *  ログインできたとき
 *    みんな一斉にぴょこん（celebrate）
 *
 *  study-notes にある「毛玉」「猫じゃらし（飛びこんでくる猫）」「夜空」「バーの先の猫」は入れていません。
 *  動きは Web Animations API（element.animate）。「アニメーションを減らす」設定のときは動かさない。
 *
 *  使い方（main.jsx）：
 *    const friends = createFriends(画面全体の要素);   // 猫を出して動かしはじめる
 *    friends.refresh();     // ログイン／新規登録を切りかえたとき（置き場所を選びなおす）
 *    friends.setShy(true);  // パスワードを「表示」にしたとき（false で元にもどす）
 *    friends.celebrate();   // ログインできたとき
 *    friends.destroy();     // 画面を閉じるとき
 * ========================================================= */

// ---------- 絵（SVG・viewBox 0 0 100 100。下側が端。体は端の外まで続く） ----------
//  .f-pet（なでられたとき・前足をのばすとき傾く）> .f-head（体ごと動く）> しっぽ・のばす前足（.f-arm。体のうしろ）・耳・体・顔（目・^ ^ の目・口）・毛づくろいの前足
//  .f-cover：目を隠す両手（パスワードを「表示」にしているあいだ。動きは friends.css の .is-shy-cover / .is-peek）
//  目：.f-eyes（まばたき）> .f-gaze（マウスを追う）> .f-pupils（きょろきょろ）
//  .f-room：見えない四角。前足をいっぱいにのばしたときに届く範囲まで広げてある
//    アプリ（Tauri の WebKit）は、猫の絵の「最初の大きさ」の外を描かないことがあり、
//    のばした前足が耳の高さで切れてしまうので、最初から前足の届く範囲まで絵があることにしておく
const CAT =
  '<svg viewBox="0 0 100 100" class="friend-svg">' +
  '<rect class="f-room" x="-95" y="-45" width="290" height="145"/>' +
  '<g class="f-pet"><g class="f-head">' +
  '<g class="f-tail"><path class="tail hit" d="M21 92 C8 94 3 86 6 73"/></g>' +
  '<g class="f-arm"><path class="arm-in"/>' +
  '<g class="arm-paw"><ellipse class="paw" cx="0" cy="0" rx="10" ry="9"/><path class="toes" d="M3.5 -4.5 h3 M4.8 0 h3 M3.5 4.5 h3"/></g></g>' +
  '<g class="f-earwrap f-earwrap-l"><g class="f-ear f-ear-l"><path class="hit" d="M22 60 Q25 38 29 25 Q31 17 37 20 L53 34 Z"/></g></g>' +
  '<g class="f-earwrap f-earwrap-r"><g class="f-ear f-ear-r"><path class="hit" d="M88 60 Q85 38 81 25 Q79 17 73 20 L57 34 Z"/></g></g>' +
  '<path class="hit" d="M55 29 C78 29 91 47 93 68 C95 88 95 104 90 114 C84 124 70 128 55 128 C40 128 26 124 20 114 C15 104 15 88 17 68 C19 47 32 29 55 29 Z"/>' +
  '<g class="f-eyes"><g class="f-gaze"><g class="f-pupils">' +
  '<circle class="eye" cx="43" cy="55" r="6.2"/><circle class="eye" cx="67" cy="55" r="6.2"/>' +
  '</g></g></g>' +
  '<g class="f-happy"><path class="happy" d="M37 57 Q43 49 49 57 M61 57 Q67 49 73 57"/></g>' +
  '<g class="f-sleep"><path class="happy" d="M37 55 Q43 61 49 55 M61 55 Q67 61 73 55"/></g>' +
  '<g class="f-mouth"><ellipse class="mouth" cx="55" cy="70" rx="5" ry="6.5"/></g>' +
  '<g class="f-gpaw"><path class="gpaw" d="M30 100 L30 80 Q30 70 38 70 Q46 70 46 80 L46 100 Z"/><path class="toes" d="M34 74.5 v3.5 M38 73.5 v3.5 M42 74.5 v3.5"/></g>' +
  '<g class="f-cover">' +
  '<g class="cover-paw cover-l"><ellipse class="gpaw" cx="43" cy="55" rx="11.5" ry="10.5"/><path class="cover-arm" d="M34.5 60 L51.5 60 L51.5 110 L34.5 110 Z"/><path class="toes" d="M37.5 48.5 v3.2 M43 47.2 v3.2 M48.5 48.5 v3.2"/></g>' +
  '<g class="cover-paw cover-r"><ellipse class="gpaw" cx="67" cy="55" rx="11.5" ry="10.5"/><path class="cover-arm" d="M58.5 60 L75.5 60 L75.5 110 L58.5 110 Z"/><path class="toes" d="M61.5 48.5 v3.2 M67 47.2 v3.2 M72.5 48.5 v3.2"/></g>' +
  '</g>' +
  '</g></g></svg>';

// ---------- 動きの道具 ----------
const SMOOTH = 'cubic-bezier(.45, 0, .25, 1)';     // ゆっくり動き出して、ゆっくり止まる
const SPRING = 'cubic-bezier(.25, 1.35, .45, 1)';  // 少し行き過ぎて戻る（ばねのよう）
const QUICK = 'cubic-bezier(.3, 0, .6, 1)';
const HIDE = 'translateY(105%)';
const SIZE_RANK = { boss: 4, big: 3, mid: 2, small: 1 };

// [割合, transform（または {transform, opacity} など）, (次までの曲線)] の並びから動きを作る
function play(el, list, T) {
  if (!el) return null;
  let prev = 0;
  const kf = list.map(([offset, v, easing]) => {
    prev = Math.max(prev, Math.max(0, Math.min(1, offset)));
    return { offset: prev, easing: easing || SMOOTH, ...(typeof v === 'string' ? { transform: v } : v) };
  });
  try {
    return el.animate(kf, { duration: T, fill: 'both' });
  } catch (err) {
    console.warn('起動画面の猫の動きを作れませんでした', err);
    return null;
  }
}
const clamp = (x) => Math.max(0, Math.min(1, x));
// まばたき（at：始める割合）
function blink(a, T, at, slow) {
  const r = (slow ? 900 : 240) / T;
  play(a.eyes, [[0, 'scaleY(1)'], [clamp(at), 'scaleY(1)'], [clamp(at + r * 0.45), 'scaleY(.08)'],
    [clamp(at + r * (slow ? 0.6 : 0.55)), 'scaleY(.08)'], [clamp(at + r), 'scaleY(1)'], [1, 'scaleY(1)']], T);
}
// 2回つづけてぱちぱち
function blink2(a, T, at) {
  const r = 200 / T;
  play(a.eyes, [[0, 'scaleY(1)'], [at, 'scaleY(1)'], [at + r * 0.5, 'scaleY(.08)'], [at + r, 'scaleY(1)'],
    [at + r * 1.6, 'scaleY(1)'], [at + r * 2.1, 'scaleY(.08)'], [at + r * 2.6, 'scaleY(1)'], [1, 'scaleY(1)']], T);
}
// 耳をぴくぴく
function twitch(a, T, at) {
  const s = 160 / T;
  play(a.earL, [[0, 'rotate(0)'], [at, 'rotate(0)'], [at + s, 'rotate(-16deg)', QUICK], [at + s * 2, 'rotate(0)', QUICK],
    [at + s * 3, 'rotate(-12deg)', QUICK], [at + s * 4, 'rotate(0)'], [1, 'rotate(0)']], T);
  play(a.earR, [[0, 'rotate(0)'], [at + s * 1.5, 'rotate(0)'], [at + s * 2.5, 'rotate(14deg)', QUICK], [at + s * 3.5, 'rotate(0)'], [1, 'rotate(0)']], T);
}
// しっぽをふりふり：times 回
function wag(a, T, at, times, amp = 22) {
  const s = Math.min(260 / T, (1 - at) / (2 * times + 1));
  const l = [[0, 'rotate(0)'], [at, 'rotate(0)']];
  for (let i = 0; i < times; i += 1) {
    const t = at + s * 2 * i;
    l.push([t + s, `rotate(${-amp}deg)`], [t + s * 2, `rotate(${amp * 0.5}deg)`]);
  }
  l.push([clamp(at + s * 2 * times + s), 'rotate(0)'], [1, 'rotate(0)']);
  play(a.tail, l, T);
}
// 目をきょろきょろ
function look(a, T, at, span) {
  const k = 3.5;
  play(a.pupils, [[0, 'translate(0, 0)'], [at, 'translate(0, 0)'], [at + span * 0.2, `translate(${-k}px, 0)`],
    [at + span * 0.45, `translate(${-k}px, 0)`], [at + span * 0.65, `translate(${k}px, -1px)`],
    [at + span * 0.85, `translate(${k}px, -1px)`], [at + span, 'translate(0, 0)'], [1, 'translate(0, 0)']], T);
}
// ある方向（dx：+1 右・−1 左）をじっと見る
function lookAt(a, T, from, to, dx) {
  const v = `translate(${dx * 3.5}px, 0)`;
  play(a.pupils, [[0, 'translate(0, 0)'], [from, 'translate(0, 0)'], [from + 0.05, v], [to, v],
    [clamp(to + 0.05), 'translate(0, 0)'], [1, 'translate(0, 0)']], T);
}
// 目を ^ ^ にする（from〜to のあいだ）
function happy(a, T, from, to) {
  const e = 0.03;
  play(a.eyes, [[0, { opacity: 1 }], [from, { opacity: 1 }], [from + e, { opacity: 0 }], [to, { opacity: 0 }],
    [clamp(to + e), { opacity: 1 }], [1, { opacity: 1 }]], T);
  play(a.happy, [[0, { opacity: 0 }], [from, { opacity: 0 }], [from + e, { opacity: 1 }], [to, { opacity: 1 }],
    [clamp(to + e), { opacity: 0 }], [1, { opacity: 0 }]], T);
}
// 体を出して、しばらくいて、引っこむ
function stay(a, T, y, inAt, outAt, delay = 0) {
  const list = [[0, HIDE]];
  if (delay) list.push([delay, HIDE]);
  list.push([inAt, `translateY(${y}%)`, SPRING], [outAt, `translateY(${y}%)`], [1, HIDE]);
  play(a.actor, list, T);
}
// 0 → 1 → 0 の山（a〜b で上がり、c〜d で下がる）。なめらかにする
function ramp(t, a, b, c, d) {
  const e = (x) => x * x * (3 - 2 * x);
  if (t <= a || t >= d) return 0;
  if (t < b) return e((t - a) / (b - a));
  if (t > c) return e((d - t) / (d - c));
  return 1;
}
// 前足の動きを、時間にそって決める（猫パンチ・手をふる）。描くのは毎フレームの frame()
function armScript(a, T, side, fn) {
  a.armScript = { t0: performance.now(), T, side, fn };
}

// ---------- 1匹の動き ----------
const ACTIONS = {
  peek(a) {
    const T = 4600;
    play(a.actor, [[0, HIDE], [0.16, 'translateY(40%)'], [0.36, 'translateY(40%)'], [0.48, 'translateY(8%)', SPRING],
      [0.84, 'translateY(8%)'], [1, HIDE]], T);
    look(a, T, 0.17, 0.2);
    play(a.head, [[0, 'rotate(0)'], [0.52, 'rotate(0)'], [0.6, 'rotate(-10deg)'], [0.7, 'rotate(-10deg)'],
      [0.78, 'rotate(0)'], [1, 'rotate(0)']], T);
    blink(a, T, 0.72);
    return T;
  },
  pop(a) {
    const T = 3200;
    play(a.actor, [[0, HIDE, QUICK], [0.12, 'translateY(-6%) scale(.9, 1.12)'], [0.2, 'translateY(8%) scale(1.1, .9)'],
      [0.28, 'translateY(4%) scale(.97, 1.03)'], [0.34, 'translateY(4%) scale(1)'], [0.74, 'translateY(4%) scale(1)'],
      [0.8, 'translateY(-2%) scale(.95, 1.06)', QUICK], [1, HIDE]], T);
    blink(a, T, 0.4);
    twitch(a, T, 0.5);
    wag(a, T, 0.36, 2, 18);
    return T;
  },
  tilt(a) {
    const T = 4400;
    stay(a, T, 6, 0.18, 0.86);
    play(a.head, [[0, 'rotate(0)'], [0.24, 'rotate(0)'], [0.34, 'rotate(-15deg)'], [0.46, 'rotate(-15deg)'],
      [0.58, 'rotate(13deg)'], [0.68, 'rotate(13deg)'], [0.78, 'rotate(0)'], [1, 'rotate(0)']], T);
    look(a, T, 0.3, 0.42);
    blink(a, T, 0.8);
    return T;
  },
  stretch(a) {
    const T = 4800;
    play(a.actor, [[0, HIDE], [0.18, 'translateY(6%)', SPRING], [0.3, 'translateY(6%) scale(1)'],
      [0.42, 'translateY(-2%) scale(.95, 1.08)'], [0.52, 'translateY(6%) scale(1.03, .97)'], [0.58, 'translateY(6%) scale(1)'],
      [0.86, 'translateY(6%)'], [1, HIDE]], T);
    play(a.earL, [[0, 'rotate(0)'], [0.3, 'rotate(0)'], [0.42, 'rotate(-22deg)'], [0.54, 'rotate(0)'], [1, 'rotate(0)']], T);
    play(a.earR, [[0, 'rotate(0)'], [0.3, 'rotate(0)'], [0.42, 'rotate(22deg)'], [0.54, 'rotate(0)'], [1, 'rotate(0)']], T);
    blink(a, T, 0.6, true); // ゆっくりまばたき（猫の「すき」の合図）
    twitch(a, T, 0.78);
    return T;
  },
  tail(a) {
    const T = 4600;
    stay(a, T, 2, 0.16, 0.86);
    wag(a, T, 0.2, 5, 26);
    look(a, T, 0.24, 0.4);
    play(a.head, [[0, 'rotate(0)'], [0.66, 'rotate(0)'], [0.72, 'rotate(8deg)'], [0.8, 'rotate(0)'], [1, 'rotate(0)']], T);
    blink(a, T, 0.68);
    return T;
  },
  // あくび：目を閉じて口を大きく開け、そのあと目をしょぼしょぼ
  yawn(a) {
    const T = 4800;
    play(a.actor, [[0, HIDE], [0.16, 'translateY(6%)', SPRING], [0.3, 'translateY(6%) scale(1)'],
      [0.4, 'translateY(3%) scale(.97, 1.05)'], [0.56, 'translateY(3%) scale(.97, 1.05)'], [0.64, 'translateY(6%) scale(1)'],
      [0.86, 'translateY(6%)'], [1, HIDE]], T);
    play(a.eyes, [[0, 'scaleY(1)'], [0.28, 'scaleY(1)'], [0.34, 'scaleY(.08)'], [0.58, 'scaleY(.08)'], [0.62, 'scaleY(.5)'],
      [0.66, 'scaleY(.12)'], [0.7, 'scaleY(.7)'], [0.74, 'scaleY(.12)'], [0.8, 'scaleY(1)'], [1, 'scaleY(1)']], T);
    play(a.mouth, [[0, 'scale(0)'], [0.3, 'scale(0)'], [0.4, 'scale(1.05, 1.2)'], [0.52, 'scale(1, 1.1)'],
      [0.6, 'scale(0)'], [1, 'scale(0)']], T);
    play(a.earL, [[0, 'rotate(0)'], [0.32, 'rotate(0)'], [0.42, 'rotate(-12deg)'], [0.58, 'rotate(-12deg)'], [0.64, 'rotate(0)'], [1, 'rotate(0)']], T);
    play(a.earR, [[0, 'rotate(0)'], [0.32, 'rotate(0)'], [0.42, 'rotate(12deg)'], [0.58, 'rotate(12deg)'], [0.64, 'rotate(0)'], [1, 'rotate(0)']], T);
    return T;
  },
  // うとうと：だんだん目が閉じてこっくり → はっと起きて、きょろきょろ
  doze(a) {
    const T = 5800;
    play(a.actor, [[0, HIDE], [0.12, 'translateY(8%)', SPRING], [0.48, 'translateY(8%)'], [0.56, 'translateY(16%)'],
      [0.6, 'translateY(16%)'], [0.63, 'translateY(0) scale(.95, 1.06)', QUICK], [0.67, 'translateY(8%) scale(1)'],
      [0.88, 'translateY(8%)'], [1, HIDE]], T);
    play(a.eyes, [[0, 'scale(1)'], [0.18, 'scale(1)'], [0.3, 'scale(1, .5)'], [0.36, 'scale(1, .6)'], [0.46, 'scale(1, .2)'],
      [0.52, 'scale(1, .08)'], [0.6, 'scale(1, .08)'], [0.62, 'scale(1.25)', QUICK], [0.7, 'scale(1.1)'], [0.76, 'scale(1)'], [1, 'scale(1)']], T);
    play(a.head, [[0, 'rotate(0)'], [0.4, 'rotate(0)'], [0.56, 'rotate(9deg)'], [0.6, 'rotate(9deg)'], [0.63, 'rotate(0)', QUICK], [1, 'rotate(0)']], T);
    look(a, T, 0.68, 0.18);
    twitch(a, T, 0.63);
    return T;
  },
  // 毛づくろい：前足で顔をくしくし（目は ^ ^）
  groom(a) {
    const T = 5000;
    stay(a, T, 6, 0.16, 0.86);
    happy(a, T, 0.3, 0.76);
    const up = (x, y, r = 0) => ({ transform: `translate(${x}px, ${y}px) rotate(${r}deg)`, opacity: 1 });
    const down = (o) => ({ transform: 'translate(0, 30px) rotate(0deg)', opacity: o });
    play(a.gpaw, [[0, down(0)], [0.28, down(0)], [0.29, down(1)], [0.36, up(0, -4)], [0.42, up(5, -14, -14)], [0.48, up(0, -6, 4)],
      [0.54, up(5, -14, -14)], [0.6, up(0, -6, 4)], [0.66, up(5, -14, -14)], [0.72, up(0, -4)],
      [0.78, down(1)], [0.79, down(0)], [1, down(0)]], T);
    play(a.head, [[0, 'rotate(0)'], [0.34, 'rotate(0)'], [0.42, 'rotate(6deg)'], [0.7, 'rotate(6deg)'], [0.78, 'rotate(0)'], [1, 'rotate(0)']], T);
    return T;
  },
  // 猫パンチ：端のかげから前足を自然にのばして、ちょいちょい（体は目の下まで隠れたまま）
  punch(a) {
    const T = 3200;
    const side = Math.random() < 0.5 ? -1 : 1;
    play(a.actor, [[0, HIDE], [0.14, 'translateY(36%)', SPRING], [0.84, 'translateY(36%)'], [1, HIDE]], T);
    lookAt(a, T, 0.2, 0.8, side);
    const swats = [0.34, 0.47, 0.6];
    armScript(a, T, side, (t) => {
      const env = ramp(t, 0.16, 0.3, 0.72, 0.86);
      let swipe = 0;
      swats.forEach((s0) => { if (t > s0 && t < s0 + 0.08) swipe = Math.sin(((t - s0) / 0.08) * Math.PI); });
      return { px: 55 + side * (46 - 14 * swipe), py: 10 - 6 * swipe, env, swipe };
    });
    return T;
  },
  // 手をふる：顔の横で前足をふりふり（目は ^ ^）
  wave(a) {
    const T = 4000;
    const side = Math.random() < 0.5 ? -1 : 1;
    stay(a, T, 6, 0.16, 0.86);
    happy(a, T, 0.32, 0.8);
    play(a.head, [[0, 'rotate(0)'], [0.28, 'rotate(0)'], [0.36, `rotate(${-side * 6}deg)`], [0.78, `rotate(${-side * 6}deg)`], [0.86, 'rotate(0)'], [1, 'rotate(0)']], T);
    armScript(a, T, side, (t) => {
      const env = ramp(t, 0.2, 0.32, 0.76, 0.88);
      const ph = Math.max(0, t - 0.3) * T / 1000 * Math.PI * 2 * 1.6; // 1秒に1.6回ふる
      return { px: 55 + side * (44 + 9 * Math.sin(ph)), py: 16 + 3 * Math.cos(ph * 2), env, swipe: 0 };
    });
    return T;
  },
  // 耳だけ：耳の先だけ出して、ぴこぴこ
  ears(a) {
    const T = 3200;
    stay(a, T, 58, 0.18, 0.76);
    twitch(a, T, 0.3);
    play(a.earR, [[0, 'rotate(0)'], [0.55, 'rotate(0)'], [0.6, 'rotate(16deg)', QUICK], [0.65, 'rotate(0)'],
      [0.7, 'rotate(14deg)', QUICK], [0.75, 'rotate(0)'], [1, 'rotate(0)']], T);
    return T;
  },
  // ちらっ：目だけ出して、ぱちぱち
  glance(a) {
    const T = 3400;
    play(a.actor, [[0, HIDE], [0.2, 'translateY(38%)'], [0.74, 'translateY(38%)'], [0.9, HIDE], [1, HIDE]], T);
    blink2(a, T, 0.3);
    lookAt(a, T, 0.5, 0.68, Math.random() < 0.5 ? -1 : 1);
    return T;
  },
};
const NAMES = Object.keys(ACTIONS);

// ---------- 2匹の動き（F は L のとなり。dir が +1 なら L から見て右、−1 なら左） ----------
const DUOS = {
  // 親子：大きい猫のあとから小さい猫がついてきて、ぴょこん
  family(L, F, dir) {
    const T = 5200;
    stay(L, T, 6, 0.14, 0.86);
    play(F.actor, [[0, HIDE], [0.26, HIDE], [0.38, 'translateY(8%) scale(1)', SPRING], [0.46, 'translateY(-4%) scale(.94, 1.08)', QUICK],
      [0.54, 'translateY(8%) scale(1.04, .96)'], [0.6, 'translateY(8%) scale(1)'], [0.9, 'translateY(8%) scale(1)'], [1, `${HIDE} scale(1)`]], T);
    lookAt(L, T, 0.3, 0.5, dir);
    lookAt(F, T, 0.6, 0.8, -dir);
    play(F.head, [[0, 'rotate(0)'], [0.6, 'rotate(0)'], [0.66, `rotate(${-dir * 9}deg)`], [0.8, `rotate(${-dir * 9}deg)`], [0.86, 'rotate(0)'], [1, 'rotate(0)']], T);
    blink(L, T, 0.7);
    blink(F, T, 0.7);
    wag(L, T, 0.48, 3, 20);
    return T;
  },
  // 見つめあう：顔を見合わせて、いっしょにまばたき
  gaze(L, F, dir) {
    const T = 4800;
    stay(L, T, 6, 0.16, 0.86);
    stay(F, T, 6, 0.2, 0.86, 0.04);
    play(L.head, [[0, 'rotate(0)'], [0.28, 'rotate(0)'], [0.36, `rotate(${dir * 9}deg)`], [0.78, `rotate(${dir * 9}deg)`], [0.84, 'rotate(0)'], [1, 'rotate(0)']], T);
    play(F.head, [[0, 'rotate(0)'], [0.28, 'rotate(0)'], [0.36, `rotate(${-dir * 9}deg)`], [0.78, `rotate(${-dir * 9}deg)`], [0.84, 'rotate(0)'], [1, 'rotate(0)']], T);
    lookAt(L, T, 0.24, 0.8, dir);
    lookAt(F, T, 0.24, 0.8, -dir);
    blink(L, T, 0.46);
    blink(F, T, 0.46);
    happy(L, T, 0.6, 0.76);
    happy(F, T, 0.6, 0.76);
    return T;
  },
  // かくれんぼ：1匹が引っこむと、となりから別の猫が出てくる
  seek(L, F, dir) {
    const T = 4600;
    play(L.actor, [[0, HIDE], [0.12, 'translateY(6%)', SPRING], [0.36, 'translateY(6%)'], [0.44, HIDE, QUICK], [1, HIDE]], T);
    look(L, T, 0.14, 0.2);
    play(F.actor, [[0, HIDE], [0.46, HIDE], [0.56, 'translateY(4%)', SPRING], [0.88, 'translateY(4%)'], [1, HIDE]], T);
    lookAt(F, T, 0.6, 0.8, -dir);
    play(F.head, [[0, 'rotate(0)'], [0.62, 'rotate(0)'], [0.68, `rotate(${-dir * 10}deg)`], [0.78, `rotate(${-dir * 10}deg)`], [0.84, 'rotate(0)'], [1, 'rotate(0)']], T);
    blink(F, T, 0.82);
    return T;
  },
};
const DUO_NAMES = Object.keys(DUOS);

// ダークモード（夜）でなでたときの寝言・ふだんなでたとき
const PURR_WORDS = ['ゴロゴロ…', 'ゴロゴロ', 'すりすり'];
const SLEEP_TALK = ['むにゃむにゃ…', 'もう食べられないにゃ…', 'おさかな…', 'ねこじゃらし…まって…', 'すやぁ…', 'にゃむ…', 'あったかい…', 'ごはん…まだ…？', 'もう5分…'];

// 置き場所（下・上が多め。ログインの枠のふちからも、ときどき出る）
const EDGES = ['bottom', 'bottom', 'bottom', 'top', 'top', 'left', 'right', 'cardTop', 'cardTop', 'cardLeft', 'cardRight'];
const NIGHT_EDGES = ['bottom', 'bottom', 'bottom', 'cardTop', 'cardTop', 'left', 'right'];
// 猫がかぶらないようにするもの（ロゴ・右上のボタン・キャッチコピー）
const AVOID = '.start-brand-logo, .win-buttons, .brand-catch';
const CAST = [];   // 端から顔を出す猫（今は出さない。上の説明を見てください）
const REACH_R = 175;     // この距離（px）より近づくと前足をのばす
const UPPER = 38;        // 前足：肩からひじまで（viewBox の長さ）
const FORE = 40;         // 前足：ひじから手先まで
const BASE = 'translateY(4%)';   // まんなかの猫の座り位置

/**
 * root：起動画面の全体（.start）。猫はこの中に作られる
 * ログインの枠は .start-card、まんなかの猫が座る場所は .brand-ledge の上のふち（今はシステム名の枠）
 */
export function createFriends(root) {
  let stopped = false;
  let all = [];
  let night = false;
  let reduce = false;
  let mouse = null;
  let mouseMoved = false;   // 前のフレームからマウスが動いたか
  let lastNow = 0;
  let celebrated = false;
  let shy = false;          // パスワードを見せている（まんなかの猫が目を隠している）
  let shyToken = 0;         // のぞく動きのタイマーを、隠すのをやめたら止めるための番号
  const timers = new Set();      // あとで止めるための setTimeout / setInterval
  const listeners = [];          // あとで外すためのイベント

  const later = (fn, ms) => { const id = setTimeout(() => { timers.delete(id); fn(); }, ms); timers.add(id); return id; };
  const every = (fn, ms) => { const id = setInterval(fn, ms); timers.add(id); return id; };
  const on = (el, type, fn, opt) => { el.addEventListener(type, fn, opt); listeners.push([el, type, fn, opt]); };
  const card = () => root.querySelector('.start-card');
  const ledge = () => root.querySelector('.brand-ledge');
  const gone = () => stopped || !root.isConnected || root.classList.contains('is-leaving');

  // ---------- 端の情報 ----------
  //  axis＝位置を動かす向き、min〜max＝置ける範囲、fix＝もう一方の座標、rot＝回転、sgn＝猫から見た右が座標の＋か−か
  function edgeInfo(edge, w, h) {
    const W = root.clientWidth;
    const H = root.clientHeight;
    const cEl = card();
    const c = cEl ? cEl.getBoundingClientRect() : null;
    switch (edge) {
      case 'bottom': return { axis: 'x', min: W * 0.05, max: W * 0.95, fix: H - h / 2, rot: 0, sgn: 1 };
      case 'top': return { axis: 'x', min: W * 0.05, max: W * 0.95, fix: h / 2, rot: 180, sgn: -1 };
      case 'left': return { axis: 'y', min: H * 0.08, max: H * 0.95, fix: h / 2, rot: 90, sgn: 1 };
      case 'right': return { axis: 'y', min: H * 0.08, max: H * 0.95, fix: W - h / 2, rot: -90, sgn: -1 };
      case 'cardTop': return c && { axis: 'x', min: c.left + w / 2 + 16, max: c.right - w / 2 - 16, fix: c.top + 3 - h / 2, rot: 0, sgn: 1 };
      case 'cardLeft': return c && { axis: 'y', min: c.top + w / 2 + 16, max: c.bottom - w / 2 - 16, fix: c.left + 3 - h / 2, rot: -90, sgn: -1 };
      case 'cardRight': return c && { axis: 'y', min: c.top + w / 2 + 16, max: c.bottom - w / 2 - 16, fix: c.right - 3 + h / 2, rot: 90, sgn: 1 };
      case 'ledge': {
        const l = ledge();
        if (!l) return null;
        const r = l.getBoundingClientRect();
        if (!r.width) return null;
        return { axis: 'x', min: r.left, max: r.right, fix: r.top - h / 2, rot: 0, sgn: 1 };
      }
      default: return null;
    }
  }
  function place(a, edge, pos) {
    const w = a.el.offsetWidth;
    const h = a.el.offsetHeight;
    const g = edgeInfo(edge, w, h);
    const cx = g.axis === 'x' ? pos : g.fix;
    const cy = g.axis === 'x' ? g.fix : pos;
    a.el.style.left = `${cx - w / 2}px`;
    a.el.style.top = `${cy - h / 2}px`;
    a.el.style.transform = `rotate(${g.rot}deg)`;
    a.el.dataset.edge = edge;
    a.el.dataset.pos = String(pos);
    a.rot = g.rot;
  }
  const panels = () => [...root.querySelectorAll(AVOID)].map((el) => el.getBoundingClientRect()).filter((r) => r.width);
  function blocked(a, g, pos) {
    const cx = g.axis === 'x' ? pos : g.fix;
    const cy = g.axis === 'x' ? g.fix : pos;
    const m = Math.max(a.el.offsetWidth, a.el.offsetHeight) / 2 + 6;
    return panels().some((r) => cx > r.left - m && cx < r.right + m && cy > r.top - m && cy < r.bottom + m);
  }
  // その場所に置けるか（範囲の中で、同じ端のほかの猫と重ならず、ロゴなどにもかぶらない）
  function fits(a, edge, pos, list, skip = []) {
    const g = edgeInfo(edge, a.el.offsetWidth, a.el.offsetHeight);
    if (!g || g.min > g.max || pos < g.min || pos > g.max) return false;
    if (blocked(a, g, pos)) return false;
    return !list.some((o) => o !== a && !skip.includes(o) && o.el.dataset.edge === edge
      && Math.abs(Number(o.el.dataset.pos) - pos) < (o.el.offsetWidth + a.el.offsetWidth) / 2 + 12);
  }
  // 重ならない場所を選んで置く
  function choose(a, list, skip = [], edges = EDGES) {
    for (let tries = 0; tries < 40; tries += 1) {
      let edge;
      do { edge = edges[Math.floor(Math.random() * edges.length)]; } while (edge === a.lastEdge && Math.random() < 0.6);
      const g = edgeInfo(edge, a.el.offsetWidth, a.el.offsetHeight);
      if (!g || g.min > g.max) continue;
      const pos = g.min + Math.random() * (g.max - g.min);
      if (fits(a, edge, pos, list, skip)) {
        a.lastEdge = edge;
        place(a, edge, pos);
        return true;
      }
    }
    return false;
  }

  // ---------- 1匹分の部品 ----------
  function parts(el) {
    const q = (sel) => el.querySelector(sel);
    return {
      el, actor: q('.actor'), head: q('.f-head'), eyes: q('.f-eyes'), gaze: q('.f-gaze'),
      pupils: q('.f-pupils'), happy: q('.f-happy'), mouth: q('.f-mouth'), gpaw: q('.f-gpaw'),
      earL: q('.f-ear-l'), earR: q('.f-ear-r'), tail: q('.f-tail'), arm: q('.f-arm'), pet: q('.f-pet'),
      armIn: q('.arm-in'), armPaw: q('.arm-paw'), hand: null, swipeAt: 0,
      earWrapL: q('.f-earwrap-l'), earWrapR: q('.f-earwrap-r'), petLevel: 0, petLast: null, petMoveAt: 0, purrAt: 0,
      size: SIZE_RANK[(el.className.match(/size-(\w+)/) || [])[1]] || 2,
      last: '', timer: 0, rot: 0, holds: new Set(), reach: 0, fixed: false,
    };
  }
  // 猫の動き（element.animate で作ったもの）だけを集める。CSS のなめらかな切り替え（transition）は含めない
  const anims = (a) => a.el.getAnimations({ subtree: true })
    .filter((x) => !(typeof CSSTransition !== 'undefined' && x instanceof CSSTransition));
  function reset(a) {
    anims(a).forEach((x) => x.cancel());
    a.armScript = null;
  }
  const busy = (a) => anims(a).some((x) => x.playState === 'running' || x.playState === 'paused');
  // その場に引き止める（なでられている・前足をのばしている間は、動きを一時停止して引っこまない）
  function hold(a, why) {
    a.holds.add(why);
    anims(a).forEach((x) => { if (x.playState === 'running') x.pause(); });
  }
  function release(a, why) {
    a.holds.delete(why);
    if (!a.holds.size) anims(a).forEach((x) => { if (x.playState === 'paused') x.play(); });
  }

  // ---------- 動かす ----------
  function schedule(a, delay) {
    if (a.timer) { clearTimeout(a.timer); timers.delete(a.timer); }
    a.timer = later(() => run(a), delay);
  }
  const gap = () => 150 + Math.random() * 700;

  function run(a) {
    if (gone() || night) return; // 夜はみんな寝ている
    if (a.holds.size || busy(a)) { schedule(a, 500); return; }
    reset(a);
    a.el.dataset.edge = '';
    if (Math.random() < 0.28 && tryDuo(a)) return;
    if (!choose(a, all)) { schedule(a, 800); return; }
    let name;
    do { name = NAMES[Math.floor(Math.random() * NAMES.length)]; } while (name === a.last && Math.random() < 0.85);
    a.last = name;
    schedule(a, ACTIONS[name](a) + gap());
  }

  // となりに、もう1匹を呼んで2匹の動きをする
  function tryDuo(a) {
    const idle = all.filter((b) => b !== a && !b.fixed && !b.holds.size && !busy(b));
    if (!idle.length) return false;
    const kind = DUO_NAMES[Math.floor(Math.random() * DUO_NAMES.length)];
    let L = a;
    let F = idle[Math.floor(Math.random() * idle.length)];
    if (kind === 'family') {
      const smaller = idle.filter((b) => b.size < a.size);
      const bigger = idle.filter((b) => b.size > a.size);
      if (smaller.length) F = smaller[Math.floor(Math.random() * smaller.length)];
      else if (bigger.length) { L = bigger[Math.floor(Math.random() * bigger.length)]; F = a; } else return false;
    }
    [L, F].forEach((x) => { clearTimeout(x.timer); reset(x); x.el.dataset.edge = ''; });
    for (let tries = 0; tries < 20; tries += 1) {
      if (!choose(L, all, [F])) continue;
      const edge = L.el.dataset.edge;
      const g = edgeInfo(edge, L.el.offsetWidth, L.el.offsetHeight);
      const d = (L.el.offsetWidth + F.el.offsetWidth) / 2 + 4;
      let dir = Math.random() < 0.5 ? 1 : -1;
      let pos = Number(L.el.dataset.pos) + dir * g.sgn * d;
      if (!fits(F, edge, pos, all, [L])) {
        dir = -dir;
        pos = Number(L.el.dataset.pos) + dir * g.sgn * d;
        if (!fits(F, edge, pos, all, [L])) { L.el.dataset.edge = ''; continue; }
      }
      place(F, edge, pos);
      const T = DUOS[kind](L, F, dir);
      schedule(L, T + gap());
      schedule(F, T + gap() + 200);
      return true;
    }
    [L, F].forEach((x) => { if (x !== a) schedule(x, 300); });
    return false;
  }

  // ---------- 座標の変換 ----------
  // 猫から見た向きに直す（画面の向き → 猫の向き）
  function toLocal(a, dx, dy) {
    const t = (-a.rot * Math.PI) / 180;
    return [dx * Math.cos(t) - dy * Math.sin(t), dx * Math.sin(t) + dy * Math.cos(t)];
  }
  // 猫の中の点（viewBox の座標）が画面のどこにあるか
  function toScreen(a, vx, vy, ty) {
    const r = a.el.getBoundingClientRect();
    const w = a.el.offsetWidth;
    const h = a.el.offsetHeight;
    const lx = (vx / 100) * w - w / 2;
    const ly = (vy / 100) * h + ty - h / 2;
    const t = (a.rot * Math.PI) / 180;
    return [r.left + r.width / 2 + lx * Math.cos(t) - ly * Math.sin(t), r.top + r.height / 2 + lx * Math.sin(t) + ly * Math.cos(t)];
  }
  // 画面の点（x, y）を、猫の絵の座標（viewBox）に直す
  function toView(a, x, y, ty) {
    const w = a.el.offsetWidth;
    const h = a.el.offsetHeight;
    const r = a.el.getBoundingClientRect();
    const [mx, my] = toLocal(a, x - (r.left + r.width / 2), y - (r.top + r.height / 2));
    return [(mx / w) * 100 + 50, ((my - ty) / h) * 100 + 50];
  }
  // root の中での位置に直す（root が画面の左上にないとき用）
  const inRoot = (x, y) => { const r = root.getBoundingClientRect(); return [x - r.left, y - r.top]; };

  // ---------- なでる（猫の上でマウスを動かすと、だんだん気持ちよくなる） ----------
  function stroke(a, e) {
    const ty = new DOMMatrix(getComputedStyle(a.actor).transform).f;
    const [vx, vy] = toView(a, e.clientX, e.clientY, ty);
    if (a.petLast) {
      const dist = Math.hypot(vx - a.petLast[0], vy - a.petLast[1]);
      a.petLevel = Math.min(1, a.petLevel + dist / 240);
    }
    a.petLast = [vx, vy];
    a.petMoveAt = performance.now();
    const lean = Math.max(-11, Math.min(11, (vx - 55) * 0.22)); // なでる手の方へ頭をすりよせる
    a.pet.style.transform = `rotate(${lean.toFixed(1)}deg)`;
    showPet(a, performance.now());
  }
  function showPet(a, now) {
    const lv = a.petLevel;
    a.earWrapL.style.transform = `rotate(${(-16 * lv).toFixed(1)}deg)`;
    a.earWrapR.style.transform = `rotate(${(16 * lv).toFixed(1)}deg)`;
    a.el.classList.toggle('is-purring', lv > 0.55);
    if (night ? lv > 0.35 && now - a.purrAt > 1400 : lv > 0.6 && now - a.purrAt > 1100) {
      a.purrAt = now;
      purrText(a, night ? SLEEP_TALK : PURR_WORDS);
    }
  }
  function purrText(a, words = PURR_WORDS, cls = '') {
    const ty = new DOMMatrix(getComputedStyle(a.actor).transform).f;
    const [sx, sy] = toScreen(a, 55, 22, ty);
    const [x, y] = inRoot(sx, sy);
    const t = document.createElement('div');
    t.className = `purr-text ${cls}`;
    t.textContent = words[Math.floor(Math.random() * words.length)];
    t.style.left = `${x}px`;
    t.style.top = `${y}px`;
    root.appendChild(t);
    const drift = (Math.random() - 0.5) * 30;
    const an = t.animate([
      { transform: 'translate(-50%, -50%) scale(.8)', opacity: 0 },
      { transform: 'translate(-50%, -80%) scale(1)', opacity: 1, offset: 0.25 },
      { transform: `translate(calc(-50% + ${drift}px), -260%) scale(1)`, opacity: 0 }], { duration: 1500, easing: 'ease-out' });
    an.onfinish = () => t.remove();
  }
  // なでるのをやめたら、だんだん元にもどる
  function calmDown(a, now) {
    if (a.petLevel <= 0) return;
    const petting = a.holds.has('pet');
    if (petting && now - a.petMoveAt < 350) return;
    a.petLevel = Math.max(0, a.petLevel - (petting ? 0.004 : 0.03));
    if (a.petLevel === 0) {
      a.earWrapL.style.transform = '';
      a.earWrapR.style.transform = '';
      a.el.classList.remove('is-purring');
      a.petLast = null;
      return;
    }
    showPet(a, now);
  }

  // ---------- 前足（肩・ひじ・手先の2つの関節で、マウスの方へ自然にのばす） ----------
  function armCore(a, px, py, env, swipe) {
    const side = a.side;
    const S = [55 + side * 26, 80];                     // 肩（体のうしろ。うでは体のかげから出てくる）
    let dx = px - S[0];
    let dy = Math.min(py - S[1], 6);                    // 体の下（端の外）へは向けない
    let d = Math.hypot(dx, dy) || 1;
    const maxLen = (UPPER + FORE) * (0.96 + 0.12 * swipe);
    const want = Math.min(d, maxLen) * (0.25 + 0.75 * env) * (1 - 0.18 * (1 - swipe) * (d > maxLen ? 1 : 0));
    const T = [S[0] + (dx / d) * want, S[1] + (dy / d) * want];
    if (!a.hand) a.hand = [S[0], S[1] + 6];
    const k = swipe > 0 ? 0.55 : 0.22;                 // 手先は少し遅れてついてくる
    a.hand = [a.hand[0] + (T[0] - a.hand[0]) * k, a.hand[1] + (T[1] - a.hand[1]) * k];
    const P = a.hand;
    dx = P[0] - S[0];
    dy = P[1] - S[1];
    d = Math.max(Math.hypot(dx, dy), 1);
    const reachLen = Math.min(d, UPPER + FORE - 0.5);
    const cosA = (UPPER * UPPER + reachLen * reachLen - FORE * FORE) / (2 * UPPER * reachLen);
    const alpha = Math.min(0.9, Math.acos(Math.max(-1, Math.min(1, cosA)))); // ひじは曲げすぎない
    const base = Math.atan2(dy, dx);
    const bend = base + side * alpha * (dy < 0 ? 1 : -1);
    const E = [S[0] + Math.cos(bend) * UPPER, S[1] + Math.sin(bend) * UPPER];
    a.armIn.setAttribute('d', `M${S[0].toFixed(1)} ${S[1].toFixed(1)} Q${E[0].toFixed(1)} ${E[1].toFixed(1)} ${P[0].toFixed(1)} ${P[1].toFixed(1)}`);
    const fa = (Math.atan2(P[1] - E[1], P[0] - E[0]) * 180) / Math.PI;
    a.armPaw.setAttribute('transform', `translate(${P[0].toFixed(1)} ${P[1].toFixed(1)}) rotate(${fa.toFixed(1)}) scale(${(1 - 0.15 * swipe).toFixed(3)} ${(1 + 0.12 * swipe).toFixed(3)})`);
    a.arm.style.opacity = '1';
  }
  // マウスへ前足をのばす
  function drawArm(a, now, ty, tgt) {
    const [px, py] = toView(a, tgt.x, tgt.y, ty);
    if (a.reach > 0.7 && now > a.swipeAt + 900) a.swipeAt = now + 250 + Math.random() * 650; // ちょいちょい
    const st = (now - a.swipeAt) / 240;
    const swipe = st > 0 && st < 1 ? Math.sin(st * Math.PI) : 0;
    armCore(a, px, py, a.reach, swipe);
    if (!a.holds.has('pet')) { // 体もマウスの方へ少し傾ける
      const lean = Math.max(-9, Math.min(9, (Math.atan2(px - 55, 100 - py) * 180) / Math.PI * 0.15));
      a.pet.style.transform = `rotate(${(lean * a.reach).toFixed(2)}deg)`;
    }
  }
  // 決まった動き（猫パンチ・手をふる）の前足を描く。終わったら false
  function drawScript(a, now) {
    const sc = a.armScript;
    if (!sc) return false;
    const t = (now - sc.t0) / sc.T;
    if (t >= 1) { a.armScript = null; return false; }
    const v = sc.fn(Math.max(0, t));
    if (v.env < 0.01) { a.arm.style.opacity = '0'; a.hand = null; return true; }
    a.side = sc.side;
    armCore(a, v.px, v.py, v.env, v.swipe);
    return true;
  }

  // 毎フレーム：目で追う・前足をのばす・なでたあと落ち着く
  function frame(now) {
    if (gone()) return;
    requestAnimationFrame(frame);
    lastNow = now;
    all.forEach((a) => calmDown(a, now));
    if (night) return; // 夜はみんな寝ている
    // 軽くするため：マウスが動いていない・前足を出していない・猫パンチなどもしていないときは、計算しない
    const idle = !mouseMoved && all.every((a) => a.reach === 0 && !a.armScript);
    mouseMoved = false;
    if (idle) return;
    all.forEach((a) => {
      if (a.el.style.visibility === 'hidden') return;
      const h = a.el.offsetHeight;
      const ty = new DOMMatrix(getComputedStyle(a.actor).transform).f; // 今どれだけ顔を出しているか
      const out = ty < h * 0.3;
      const [ex, ey] = toScreen(a, 55, 55, ty);
      const R = REACH_R * (a.fixed ? 1.2 : 1);
      const tgt = mouse && Math.hypot(mouse.x - ex, mouse.y - ey) < R ? mouse : null;
      if (mouse) { // 目で追う
        const [gx, gy] = toLocal(a, mouse.x - ex, mouse.y - ey);
        const glen = Math.hypot(gx, gy) || 1;
        const gk = Math.min(3.2, glen / 30);
        a.gaze.style.transform = `translate(${(gx / glen) * gk}px, ${(gy / glen) * gk}px)`;
      }
      const near = out && !a.holds.has('pet') && !!tgt && !(a.fixed && shy); // 前足をのばす（なでられている・目を隠している間はのばさない）
      if (tgt) a.tgt = tgt;
      a.reach += ((near ? 1 : 0) - a.reach) * 0.16;
      if (a.reach < 0.01 || !a.tgt) {
        a.reach = 0;
        if (drawScript(a, now)) return; // 猫パンチ・手をふる の前足
        a.hand = null;
        a.arm.style.opacity = '0';
        if (!a.holds.has('pet')) a.pet.style.transform = '';
        if (a.holds.has('reach')) release(a, 'reach');
        return;
      }
      if (a.reach > 0.3 && !a.holds.has('reach')) hold(a, 'reach');
      if (a.reach < 0.15 && a.holds.has('reach')) release(a, 'reach');
      const [hx] = toLocal(a, a.tgt.x - ex, a.tgt.y - ey); // 前足はねらう側の肩から出す
      if (!a.side || (a.side < 0 && hx > 8) || (a.side > 0 && hx < -8)) a.side = hx >= 0 ? 1 : -1;
      drawArm(a, now, ty, a.tgt);
    });
  }

  // ---------- まんなかの猫（左の面の段の上にいつも座っている。引っこまない） ----------
  const BOSS = {
    idle: [
      (a) => { blink(a, 1200, 0.2); return 1200; },
      (a) => { look(a, 2600, 0, 1); return 2600; },
      (a) => { twitch(a, 1600, 0.1); return 1600; },
      (a) => { wag(a, 2600, 0, 4, 22); return 2600; },
      (a) => { happy(a, 2400, 0.15, 0.75); return 2400; },
      (a) => { blink(a, 2000, 0.15, true); return 2000; },
      (a) => {
        play(a.head, [[0, 'rotate(0)'], [0.25, 'rotate(-9deg)'], [0.55, 'rotate(-9deg)'], [0.8, 'rotate(0)'], [1, 'rotate(0)']], 2600);
        return 2600;
      },
      (a) => { // あくび
        const T = 2800;
        play(a.eyes, [[0, 'scaleY(1)'], [0.1, 'scaleY(.08)'], [0.6, 'scaleY(.08)'], [0.7, 'scaleY(.5)'], [0.76, 'scaleY(.12)'], [0.86, 'scaleY(1)'], [1, 'scaleY(1)']], T);
        play(a.mouth, [[0, 'scale(0)'], [0.14, 'scale(0)'], [0.3, 'scale(1.05, 1.2)'], [0.5, 'scale(1, 1.1)'], [0.62, 'scale(0)'], [1, 'scale(0)']], T);
        return T;
      },
    ],
    surprise(a) {
      reset(a);
      play(a.actor, [[0, BASE], [0.3, 'translateY(-14%) scale(.94, 1.08)', QUICK], [0.6, 'translateY(6%) scale(1.06, .94)'], [1, `${BASE} scale(1)`]], 700);
      play(a.eyes, [[0, 'scale(1)'], [0.15, 'scale(1.45)'], [0.75, 'scale(1.45)'], [1, 'scale(1)']], 1100);
      play(a.earL, [[0, 'rotate(0)'], [0.2, 'rotate(-14deg)'], [0.75, 'rotate(-14deg)'], [1, 'rotate(0)']], 1100);
      play(a.earR, [[0, 'rotate(0)'], [0.2, 'rotate(14deg)'], [0.75, 'rotate(14deg)'], [1, 'rotate(0)']], 1100);
    },
    cheer(a) {
      const T = 2000;
      reset(a);
      play(a.actor, [[0, BASE], [0.18, 'translateY(-12%) scale(.94, 1.08)', QUICK], [0.36, 'translateY(6%) scale(1.06, .94)'],
        [0.54, 'translateY(-10%) scale(.95, 1.06)', QUICK], [0.72, 'translateY(6%) scale(1.05, .95)'], [1, `${BASE} scale(1)`]], T);
      happy(a, T + 800, 0.1, 0.8);
      wag(a, T, 0.1, 4, 24);
    },
  };
  function bossLoop(a) {
    const tick = () => {
      if (gone()) return;
      if (!night && !shy && !a.holds.size && !busy(a) && a.el.style.visibility !== 'hidden') BOSS.idle[Math.floor(Math.random() * BOSS.idle.length)](a);
      later(tick, 1800 + Math.random() * 2200);
    };
    later(tick, 900);
  }
  function placeBoss(a) {
    const l = ledge();
    const r = l && l.getBoundingClientRect();
    if (!r || !r.width) { a.el.style.visibility = 'hidden'; return; } // 新規登録のとき（左の面がない）
    a.el.style.visibility = '';
    const rr = root.getBoundingClientRect();
    place(a, 'ledge', r.left + r.width / 2 - rr.left);
  }

  // ---------- パスワードを見ないようにする（パスワードを「表示」にしているあいだ） ----------
  //  「表示」にするたびに、次の 3 つからどれか 1 つ（前と同じにはなりにくい）。見た目は friends.css の .is-shy-〇〇
  //    cover … 両手で目をふさぐ。ときどき右手をずらして、指のすきまから片目でちらっ
  //    away  … ぷいっと そっぽを向く。ときどき目だけこっちに戻して、ちらっ
  //    curl  … 体を低くして丸くなり、目をぎゅっと閉じる。ときどき うす目でちらっ
  //  のぞく動き（.is-peek）は、どれも 2〜4 秒おき
  const SHY_MODES = ['cover', 'away', 'curl'];
  const SHY_WORDS = { cover: ['みてないよ', 'みてないにゃ'], away: ['ぷいっ', 'ふんっ'], curl: ['まるっ', 'みないにゃ…'] };
  let shyMode = '';
  let lastShyMode = '';
  function peekLater(token) {
    later(() => {
      if (token !== shyToken || !shy || gone()) return;
      boss.el.classList.add('is-peek');
      later(() => {
        boss.el.classList.remove('is-peek');
        if (token === shyToken && shy) peekLater(token);
      }, 900 + Math.random() * 600);   // のぞいている時間
    }, 1800 + Math.random() * 2400);   // 次にのぞくまで
  }
  function setShy(on) {
    if (stopped || on === shy) return;
    shy = on;
    shyToken += 1;
    boss.el.classList.remove('is-shy', 'is-peek', ...SHY_MODES.map((m) => `is-shy-${m}`));
    if (!on) { shyMode = ''; return; }
    // どれにするか選ぶ（前と同じものは、なるべく避ける）
    do { shyMode = SHY_MODES[Math.floor(Math.random() * SHY_MODES.length)]; } while (shyMode === lastShyMode && Math.random() < 0.8);
    lastShyMode = shyMode;
    // のばしていた前足をしまって、ほかの動きを止める
    boss.reach = 0;
    boss.hand = null;
    boss.arm.style.opacity = '0';
    if (!boss.holds.has('pet')) boss.pet.style.transform = '';
    if (boss.holds.has('reach')) release(boss, 'reach');
    reset(boss);
    boss.el.classList.add('is-shy', `is-shy-${shyMode}`);
    if (reduce || night) return;
    later(() => { if (shy && !night) purrText(boss, SHY_WORDS[shyMode]); }, 250);
    peekLater(shyToken);
  }

  // ---------- びっくり（クリックしたとき） ----------
  function surprise(a) {
    const T = 700;
    const cur = getComputedStyle(a.actor).transform;
    reset(a);
    play(a.actor, [[0, cur && cur !== 'none' ? cur : 'translateY(6%)', QUICK], [0.3, 'translateY(-4%) scale(1.08, .92)'], [1, `${HIDE} scale(1)`]], T);
    play(a.eyes, [[0, 'scale(1)'], [0.15, 'scale(1.45)'], [1, 'scale(1.45)']], T);
    play(a.earL, [[0, 'rotate(0)'], [0.2, 'rotate(-14deg)'], [1, 'rotate(-14deg)']], T);
    play(a.earR, [[0, 'rotate(0)'], [0.2, 'rotate(14deg)'], [1, 'rotate(14deg)']], T);
    return T;
  }
  // ---------- お祝い（ぴょんぴょん跳ねて ^ ^） ----------
  function cheer(a) {
    const T = 3200;
    play(a.actor, [[0, HIDE], [0.14, 'translateY(-6%) scale(.92, 1.1)', SPRING], [0.22, 'translateY(4%) scale(1.06, .94)'],
      [0.3, 'translateY(-8%) scale(.95, 1.06)', QUICK], [0.38, 'translateY(4%) scale(1.05, .95)'],
      [0.46, 'translateY(-6%) scale(.96, 1.05)', QUICK], [0.54, 'translateY(4%) scale(1)'], [0.82, 'translateY(4%) scale(1)'], [1, `${HIDE} scale(1)`]], T);
    happy(a, T, 0.18, 0.78);
    wag(a, T, 0.2, 4, 24);
    return T;
  }

  // ---------- マウス ----------
  function bindMouse() {
    on(root, 'pointermove', (e) => { mouse = { x: e.clientX, y: e.clientY }; mouseMoved = true; });
    on(root, 'pointerleave', () => {
      mouse = null;
      all.forEach((a) => { a.reach = 0; a.arm.style.opacity = '0'; a.pet.style.transform = ''; if (a.holds.has('reach')) release(a, 'reach'); });
    });
    all.forEach((a) => {
      // なでる：マウスを乗せると目を細めて傾く（その間は引っこまない）
      on(a.el, 'pointerover', () => {
        if (a.holds.has('pet')) return;
        a.pet.style.transform = '';
        a.el.classList.add('is-petted');
        hold(a, 'pet');
      });
      on(a.el, 'pointermove', (e) => { if (a.holds.has('pet')) stroke(a, e); });
      on(a.el, 'pointerout', (e) => {
        if (e.relatedTarget && a.el.contains(e.relatedTarget)) return;
        a.el.classList.remove('is-petted');
        a.pet.style.transform = '';
        a.petLast = null;
        release(a, 'pet');
      });
      // クリック：びっくりする。まんなかの猫は跳ねるだけ、ほかの猫は引っこむ
      on(a.el, 'click', (e) => {
        e.stopPropagation();
        if (night) return; // 夜はなでることしかできない
        a.holds.clear();
        a.reach = 0;
        a.arm.style.opacity = '0';
        a.pet.style.transform = '';
        a.el.classList.remove('is-petted');
        if (a.fixed) { BOSS.surprise(a); return; }
        schedule(a, surprise(a) + 1500 + Math.random() * 1500);
      });
    });
  }

  // ---------- ダークモード（夜）：みんな寝ている ----------
  function snore() {
    if (!night || gone()) return;
    const sleepers = all.filter((a) => !a.holds.has('pet') && a.el.style.visibility !== 'hidden' && a.el.dataset.edge);
    if (sleepers.length) purrText(sleepers[Math.floor(Math.random() * sleepers.length)], ['z', 'Zz', 'zzZ', 'Z…'], 'is-z');
  }
  // 寝かせる：端に顔を出して目を閉じ、ゆっくり息をする（場所はそのまま動かない）
  function sleepPose(a) {
    reset(a);
    if (!a.fixed) a.actor.style.transform = `translateY(${10 + Math.random() * 8}%)`;
    const T = 3000 + Math.random() * 1400;
    a.head.animate([
      { transform: 'scale(1, 1)' }, { transform: 'scale(1.02, 1.035)', offset: 0.45 }, { transform: 'scale(1, 1)' }],
    { duration: T, iterations: Infinity, easing: 'ease-in-out', delay: -Math.random() * T });
  }
  function clearPose(a) {
    if (a.timer) { clearTimeout(a.timer); timers.delete(a.timer); a.timer = 0; }
    a.holds.clear();
    a.el.classList.remove('is-petted', 'is-purring');
    a.pet.style.transform = '';
    a.arm.style.opacity = '0';
    a.gaze.style.transform = '';
    a.reach = 0;
    a.hand = null;
    a.el.getAnimations().forEach((x) => x.cancel());
    reset(a);
  }
  function goNight() {
    all.forEach((a) => {
      clearPose(a);
      if (!a.fixed) { a.actor.style.transform = ''; a.el.dataset.edge = ''; }
    });
    const boss = all.find((a) => a.fixed);
    if (boss) placeBoss(boss);
    all.filter((a) => !a.fixed).forEach((a) => { if (choose(a, all, [], NIGHT_EDGES)) sleepPose(a); });
    if (boss) sleepPose(boss);
  }
  let snoreTimer = 0;
  function setNight(isNight) {
    if (isNight === night) return;
    night = isNight;
    root.classList.toggle('is-night', night);
    if (snoreTimer) { clearInterval(snoreTimer); timers.delete(snoreTimer); snoreTimer = 0; }
    if (reduce) return;
    if (night) {
      goNight();
      snoreTimer = every(snore, 1700);
    } else {
      // 朝：みんな起きて、また顔を出しはじめる
      all.forEach((a, i) => {
        clearPose(a);
        if (a.fixed) a.actor.style.transform = BASE;
        else { a.actor.style.transform = ''; a.el.dataset.edge = ''; schedule(a, 120 + i * 220); }
      });
    }
  }

  // ---------- はじめる ----------
  const mainEl = root.querySelector('.start-main');
  CAST.forEach((size) => {
    const f = document.createElement('div');
    f.className = `edge-friend size-${size}`;
    f.setAttribute('aria-hidden', 'true');
    f.innerHTML = `<div class="actor">${CAT}</div>`;
    root.insertBefore(f, mainEl);
  });
  const bossEl = document.createElement('div');
  bossEl.className = 'edge-friend size-boss is-boss';
  bossEl.setAttribute('aria-hidden', 'true');
  bossEl.innerHTML = `<div class="actor">${CAT}</div>`;
  root.insertBefore(bossEl, mainEl);
  all = [...root.querySelectorAll('.edge-friend')].map(parts);
  const boss = all.find((a) => a.el === bossEl);
  boss.fixed = true;
  boss.actor.style.transform = BASE;
  placeBoss(boss);
  on(window, 'resize', () => placeBoss(boss));
  let ro = null;
  if (typeof ResizeObserver === 'function') {
    ro = new ResizeObserver(() => placeBoss(boss));
    ro.observe(root);
    if (ledge()) ro.observe(ledge());   // 猫が座る枠の大きさが変わったときも座りなおす
  }

  reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)
    || document.documentElement.classList.contains('reduce-motion')
    || typeof Element.prototype.animate !== 'function';

  // ダークモードかどうかを見て、夜にする（テーマを切りかえたら、すぐ反映）
  const isDark = () => document.documentElement.dataset.theme === 'dark';
  const mo = new MutationObserver(() => setNight(isDark()));
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  if (reduce) {
    // 動かさず、下の端に並べて顔を出した姿で止める
    const W = root.clientWidth;
    const movers = all.filter((a) => !a.fixed);
    movers.forEach((a, i) => { place(a, 'bottom', W * (0.05 + (0.9 * (i + 0.5)) / movers.length)); a.actor.style.transform = 'translateY(6%)'; });
    root.classList.toggle('is-night', isDark());
  } else {
    bindMouse();
    requestAnimationFrame(frame);
    bossLoop(boss);
    if (isDark()) setNight(true);
    else all.filter((a) => !a.fixed).forEach((a, i) => schedule(a, 80 + i * 260)); // 最初から次々に出てくる
  }

  return {
    /** ログイン／新規登録を切りかえたとき：まんなかの猫の位置をなおし、ほかの猫は置き場所を選びなおす */
    refresh() {
      if (stopped) return;
      requestAnimationFrame(() => {
        placeBoss(boss);
        if (reduce) return;
        if (night) { goNight(); return; }
        all.filter((a) => !a.fixed).forEach((a, i) => {
          clearPose(a);
          a.actor.style.transform = '';
          a.el.dataset.edge = '';
          schedule(a, 120 + i * 160);
        });
      });
    },
    /** パスワードを「表示」にしたとき true、隠したとき false：まんなかの猫がパスワードを見ないようにする */
    setShy(on) { setShy(!!on); },
    /** ログインできたとき：みんな一斉にぴょこん */
    celebrate() {
      setShy(false);
      if (stopped || celebrated || reduce || night || gone()) return;
      celebrated = true;
      BOSS.cheer(boss);
      const movers = all.filter((a) => !a.fixed);
      movers.forEach((a) => { clearPose(a); a.el.dataset.edge = ''; });
      movers.forEach((a, i) => {
        later(() => {
          if (stopped) return;
          if (!choose(a, all)) return;
          a.timer = later(() => {}, cheer(a));
        }, i * 90);
      });
    },
    /** 画面を閉じるとき：止めて、作ったものを消す */
    destroy() {
      stopped = true;
      timers.forEach((id) => { clearTimeout(id); clearInterval(id); });
      timers.clear();
      listeners.forEach(([el, type, fn, opt]) => el.removeEventListener(type, fn, opt));
      mo.disconnect();
      if (ro) ro.disconnect();
      all.forEach((a) => a.el.remove());
      root.querySelectorAll('.purr-text').forEach((t) => t.remove());
      root.classList.remove('is-night');
    },
  };
}
