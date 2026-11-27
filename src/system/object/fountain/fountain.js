// ═══════════════════════════════════════════════════════════════
//  もの：噴水（丸い池 ＋ 柱と上のお皿。水が上がって、池に落ちる）
//    import { drawFountain } from "<ここまでの道>/object/fountain/fountain.js";
//    drawFountain(入れる場所の要素);   … 中に SVG の絵を入れる。大きさは入れる場所の はば に合わせる
//  ・池のふち（data-part="rim"）… この丸の広さを、まわりを歩くものが よける（ホームの広場 js/plaza.js）
//  ・時間帯：入れる場所より外がわに data-time="evening" ／ "night" があると、石と水の色が変わる
//  ・「アニメーションを減らす」のときは水が止まる
//  見た目は fountain.css
// ═══════════════════════════════════════════════════════════════
import "./fountain.css";

const SVG = `<svg class="obj-fountain" viewBox="0 0 200 160" aria-hidden="true">
  <path class="ft-wall" d="M10 124 V142 A90 18 0 0 0 190 142 V124 Z"/>
  <ellipse class="ft-rim" data-part="rim" cx="100" cy="124" rx="90" ry="18"/>
  <ellipse class="ft-water" cx="100" cy="125" rx="80" ry="13"/>
  <g class="ft-ripples">
    <ellipse cx="100" cy="126" rx="18" ry="4"/><ellipse cx="100" cy="126" rx="18" ry="4"/>
    <ellipse cx="62" cy="123" rx="9" ry="2.2"/><ellipse cx="138" cy="123" rx="9" ry="2.2"/>
  </g>
  <path class="ft-stone" d="M92 126 V74 H108 V126 Z"/>
  <ellipse class="ft-stone-dark" cx="100" cy="126" rx="13" ry="3.4"/>
  <path class="ft-stone" d="M70 68 Q100 92 130 68 Z"/>
  <ellipse class="ft-rim" cx="100" cy="68" rx="30" ry="6"/>
  <ellipse class="ft-water" cx="100" cy="68.5" rx="25" ry="4"/>
  <path class="ft-fall" d="M72 69 Q64 88 62 122"/>
  <path class="ft-fall" d="M128 69 Q136 88 138 122"/>
  <path class="ft-jet" d="M100 67 V14"/>
  <path class="ft-spray" d="M100 16 Q87 4 78 67"/>
  <path class="ft-spray" d="M100 16 Q113 4 122 67"/>
  <g class="ft-drops"><circle cx="86" cy="18" r="1.8"/><circle cx="114" cy="20" r="1.6"/><circle cx="93" cy="10" r="1.4"/><circle cx="108" cy="9" r="1.5"/></g>
</svg>`;
// ↑ 上から：池のふちの前の面 → 池のふちの上 → 池の水 → 波の輪 → 柱 → 柱の足もと → 上のお皿（下がわ・ふち・水）
//          → お皿からあふれて落ちる水（左・右） → まん中から上がる水 → てっぺんから左右に落ちる水 → しぶき

/** 噴水をかく。池のふちの要素を返す（よけるときに使う） */
export function drawFountain(host) {
  host.innerHTML = SVG;
  return { svg: host.querySelector("svg"), rim: host.querySelector('[data-part="rim"]') };
}
