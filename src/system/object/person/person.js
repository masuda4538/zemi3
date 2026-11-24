// ═══════════════════════════════════════════════════════════════
//  もの：フレンドの人形（丸い頭 ＋ 肩。人ごとの色でぬる）
//    import { personSvg } from "<ここまでの道>/object/person/person.js";
//    el.innerHTML = personSvg("home-friend-body");   … SVG の文字。引数は SVG に付けるクラス名（見た目は使う がわの CSS で）
//  ・色は fill（例：fill: var(--c)）でぬる
// ═══════════════════════════════════════════════════════════════

/** 人の形（丸い頭 ＋ 肩。頭のまわりは少しあける） */
export function personSvg(className = "") {
  return `<svg class="obj-person ${className}" viewBox="0 0 40 48" aria-hidden="true">
  <circle cx="20" cy="12.5" r="10"/>
  <path d="M3 48 V40 C3 31 9.5 26.5 14.5 26 A12.5 12.5 0 0 0 25.5 26 C30.5 26.5 37 31 37 40 V48 Z"/>
</svg>`;
}
