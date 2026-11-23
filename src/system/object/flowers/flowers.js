// ═══════════════════════════════════════════════════════════════
//  もの：花ばたけ（チューリップと丸い花を ならべる。手前の花ほど大きい。そよ風で ゆれる）
//    import { drawFlowerField } from "<ここまでの道>/object/flowers/flowers.js";
//    drawFlowerField(入れる場所の要素, { count: 120, path: true });
//      count … 花の数（さいしょに ためす数。道のところは とばすので、少し へる）
//      path  … まん中に道をあけるか（true ＝ あける）
//  ・入れる場所は、広場の要素（container-type: size）の中に置く。花の大きさは 広場の高さ（cqh）に合わせる
//  ・ならび方は いつも同じ（毎回ばらばらにならない）
//  ・時間帯：外がわに data-time="night" があると暗くなる。「アニメーションを減らす」のときは ゆれない
//  見た目は flowers.css
// ═══════════════════════════════════════════════════════════════
import "./flowers.css";

const COLORS = ["#ff8fb1", "#ffd166", "#ffffff", "#c3a6ff", "#ff9e6b", "#7cc7ff", "#ff6b81"];

/** 花ばたけをかく */
export function drawFlowerField(host, { count = 120, path = true } = {}) {
  let seed = 7;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };   // いつも同じならび方にする
  const html = [];
  for (let i = 0; i < count; i++) {
    const x = rnd() * 100, b = 1 + rnd() * 40;   // 左右（%）・下からの高さ（%）
    if (path && x > 40 && x < 60 && b < 34) continue;   // まん中の道はあける
    const size = 5.6 - b * 0.09;                  // 手前（下）ほど大きい（cqh ＝ 広場の高さの %）
    const c = COLORS[Math.floor(rnd() * COLORS.length)];
    const tulip = rnd() < 0.45;
    const head = tulip
      ? `<path d="M6 7 Q6 1 9 3 Q12 0 15 3 Q18 1 18 7 Q18 13 12 13 Q6 13 6 7 Z" fill="${c}"/>`
      : `<g fill="${c}"><circle cx="12" cy="4" r="3.6"/><circle cx="16.5" cy="7.5" r="3.6"/><circle cx="7.5" cy="7.5" r="3.6"/><circle cx="9.5" cy="12" r="3.6"/><circle cx="14.5" cy="12" r="3.6"/></g><circle cx="12" cy="8.6" r="2.6" fill="#ffcf4a"/>`;
    html.push(`<span class="fb-flower" style="left:${x.toFixed(1)}%;bottom:${b.toFixed(1)}%;width:${size.toFixed(2)}cqh;animation-delay:${(-rnd() * 3).toFixed(2)}s;z-index:${Math.round(50 - b)}">`
      + `<svg viewBox="0 0 24 34"><path class="fb-stem" d="M12 34 V12"/><path class="fb-leaf" d="M12 28 Q5 25 4 19 Q10 20 12 26 Z"/>${head}</svg></span>`);
  }
  host.classList.add("obj-flowers");
  host.innerHTML = html.join("");
}
