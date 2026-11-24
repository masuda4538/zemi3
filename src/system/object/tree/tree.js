// ═══════════════════════════════════════════════════════════════
//  もの：大きい木（太い幹 ＋ 丸い葉っぱ。ピンクの実。根もとに白い花。葉っぱが そよ風で ゆれる）
//    import { drawTree } from "<ここまでの道>/object/tree/tree.js";
//    const { foot } = drawTree(入れる場所の要素);   … 中に SVG の絵を入れる。大きさは入れる場所に合わせる（たて横の わり合いは そのまま）
//  ・foot … 根もとの広さ（見えない要素）。まわりを歩くものが よける（ホームの広場 js/plaza.js）
//  ・時間帯：外がわに data-time="evening" ／ "night" があると、色が変わる
//  ・「アニメーションを減らす」のときは ゆれない
//  見た目は tree.css
// ═══════════════════════════════════════════════════════════════
import "./tree.css";

const SVG = `<svg class="obj-tree" viewBox="0 0 200 210" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
  <ellipse class="tr-shadow" cx="100" cy="205" rx="62" ry="6"/>
  <path class="tr-trunk" d="M84 207 C90 196 91 176 92 150 C88 140 74 132 64 126 L68 122 C78 126 88 132 93 136 C94 124 94 116 93 108 L107 108 C106 120 106 128 107 136 C113 128 122 122 134 118 L137 123 C126 129 112 140 108 150 C109 176 110 196 116 207 Z"/>
  <path class="tr-bark" d="M98 196 C97 178 98 160 99 140 M104 186 C104 170 105 158 105 146"/>
  <g class="tr-leaves">
    <circle class="tr-leaf is-dark" cx="56" cy="98" r="38"/>
    <circle class="tr-leaf is-dark" cx="144" cy="98" r="38"/>
    <circle class="tr-leaf" cx="100" cy="74" r="56"/>
    <circle class="tr-leaf" cx="64" cy="58" r="34"/>
    <circle class="tr-leaf" cx="136" cy="58" r="34"/>
    <circle class="tr-leaf is-light" cx="100" cy="34" r="30"/>
    <circle class="tr-shine" cx="82" cy="40" r="12"/>
    <circle class="tr-shine" cx="56" cy="74" r="8"/>
    <g class="tr-fruit"><circle cx="70" cy="92" r="4"/><circle cx="122" cy="66" r="4"/><circle cx="142" cy="104" r="4"/><circle cx="96" cy="100" r="4"/><circle cx="108" cy="30" r="4"/></g>
  </g>
  <g class="tr-flowers"><circle cx="72" cy="204" r="3.4"/><circle cx="80" cy="207" r="3"/><circle cx="124" cy="205" r="3.4"/><circle cx="132" cy="207" r="3"/><circle cx="118" cy="208" r="2.6"/></g>
</svg>
<span class="obj-tree-foot" aria-hidden="true"></span>`;
// ↑ 上から：かげ → 幹 → 幹のすじ → 葉っぱ（うしろの濃い丸 → まん中 → 上の明るい丸 → 光 → 実） → 根もとの花 ／ 根もとの広さ

/** 大きい木をかく。{ svg, foot } を返す */
export function drawTree(host) {
  host.innerHTML = SVG;
  return { svg: host.querySelector("svg"), foot: host.querySelector(".obj-tree-foot") };
}
