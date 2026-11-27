// ═══════════════════════════════════════════════════════════════
//  もの：観覧車（白いわく ＋ 色とりどりのゴンドラ。ゆっくり回り、ゴンドラは いつも下向き）
//    import { drawWheel } from "<ここまでの道>/object/wheel/wheel.js";
//    drawWheel(入れる場所の要素);   … 中に SVG の絵を入れる。大きさは はば に合わせる
//  ・ゴンドラの数と色は下の COLORS（色の数 ＝ ゴンドラの数）
//  ・時間帯：外がわに data-time="night" があると暗くなり、ゴンドラに明かりがつく
//  ・「アニメーションを減らす」のときは止まる
//  見た目は wheel.css
// ═══════════════════════════════════════════════════════════════
import "./wheel.css";

const COLORS = ["#f87171", "#fbbf24", "#34d399", "#60a5fa", "#a78bfa", "#f472b6", "#fb923c", "#22d3ee"];
const CX = 100, CY = 100, R = 80;   // 回るまん中と、わくの半径（SVG の中の長さ）

/** 観覧車をかく */
export function drawWheel(host) {
  const n = COLORS.length;
  // 細い線（わくの まん中から 16 本）
  const spokes = Array.from({ length: 16 }, (_, k) => {
    const a = (2 * Math.PI * k) / 16;
    return `M${CX} ${CY} L${(CX + R * Math.cos(a)).toFixed(1)} ${(CY + R * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
  // ゴンドラ：わくの上の点に つるす。transform-origin を つるした点にして、わくと反対に回す（いつも下向き）
  const cars = COLORS.map((c, k) => {
    const a = (2 * Math.PI * k) / n, x = CX + R * Math.cos(a), y = CY + R * Math.sin(a);
    return `<g class="fw-car" style="transform-origin:${x.toFixed(1)}px ${y.toFixed(1)}px">`
      + `<path class="fw-hang" d="M${x.toFixed(1)} ${y.toFixed(1)} v5"/>`
      + `<rect x="${(x - 8).toFixed(1)}" y="${(y + 5).toFixed(1)}" width="16" height="13" rx="4" fill="${c}"/>`
      + `<rect class="fw-window" x="${(x - 5).toFixed(1)}" y="${(y + 8).toFixed(1)}" width="10" height="5" rx="1.5"/></g>`;
  }).join("");
  host.innerHTML = `<svg class="obj-wheel" viewBox="0 0 200 220" aria-hidden="true">
    <path class="fw-leg" d="M${CX} ${CY} L60 220 M${CX} ${CY} L140 220 M74 178 H126"/>
    <g class="fw-wheel">
      <circle class="fw-rim" cx="${CX}" cy="${CY}" r="${R}"/>
      <circle class="fw-rim is-inner" cx="${CX}" cy="${CY}" r="${R - 14}"/>
      <path class="fw-spoke" d="${spokes}"/>
      ${cars}
    </g>
    <circle class="fw-hub" cx="${CX}" cy="${CY}" r="8"/>
  </svg>`;
  return host.querySelector("svg");
}
