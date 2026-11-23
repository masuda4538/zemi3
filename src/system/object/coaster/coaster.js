// ═══════════════════════════════════════════════════════════════
//  もの：ジェットコースター（赤いレール ＋ 柱。3 両の車が レールの上を ぐるっと走る。ループもある）
//    import { drawCoaster } from "<ここまでの道>/object/coaster/coaster.js";
//    drawCoaster(入れる場所の要素);   … 中に SVG の絵を入れる。大きさは はば に合わせる
//  ・車は SVG の animateMotion で、レール（TRACK）の上を走る（rotate="auto" で、坂やループでは かたむく）
//  ・「アニメーションを減らす」のときは止まる（animateMotion は CSS では止まらないので、ここで止める）
//  ・時間帯：外がわに data-time="night" があると暗くなる
//  見た目は coaster.css
// ═══════════════════════════════════════════════════════════════
import "./coaster.css";

/** レールの道（左の駅 → 大きな坂 → ループ → 小さな坂 → 下を通って駅へもどる） */
const TRACK = "M20 120 L40 120 C60 120 62 30 80 30 C98 30 100 118 122 118 L150 118 C175 118 195 100 195 85 C195 65 180 55 165 55 C150 55 135 65 135 85 C135 100 155 118 180 118 C200 118 205 80 220 80 C235 80 238 118 245 118 L250 118 C258 118 258 132 245 132 L20 132 C10 132 10 120 20 120 Z";
const CARS = [["#2563eb", -0.6], ["#3b82f6", -0.3], ["#60a5fa", 0]];   // [色, 出発を ずらす秒]（前の車ほど先）
const LAP = 9;   // 1 周の秒

/** ジェットコースターをかく */
export function drawCoaster(host) {
  const cars = CARS.map(([c, begin]) => `<g class="cs-car">`
    + `<rect x="-7" y="-10" width="14" height="8" rx="2.5" fill="${c}"/><circle cx="-3" cy="-11" r="2.2" class="cs-head"/><circle cx="3" cy="-11" r="2.2" class="cs-head"/>`
    + `<animateMotion dur="${LAP}s" repeatCount="indefinite" rotate="auto" begin="${begin}s" path="${TRACK}"/></g>`).join("");
  host.innerHTML = `<svg class="obj-coaster" viewBox="0 0 260 150" aria-hidden="true">
    <path class="cs-pole" d="M60 70 V150 M80 30 V150 M100 75 V150 M165 85 V150 M220 80 V150 M240 110 V150 M30 120 V150"/>
    <path class="cs-rail" d="${TRACK}"/>
    <path class="cs-rail is-tie" d="${TRACK}"/>
    ${cars}
  </svg>`;
  const svg = host.querySelector("svg");
  // 「アニメーションを減らす」（html の reduce-motion）に合わせて、止める・動かす
  const sync = () => {
    if (document.documentElement.classList.contains("reduce-motion")) svg.pauseAnimations(); else svg.unpauseAnimations();
  };
  sync();
  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return svg;
}
