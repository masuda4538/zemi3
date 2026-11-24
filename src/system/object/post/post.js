// ═══════════════════════════════════════════════════════════════
//  もの：ポスト（赤い丸ポスト。丸い屋根・〇の中の入れ口と〒・四角いとびら・灰色の台）
//    import { drawPost } from "<ここまでの道>/object/post/post.js";
//    drawPost(入れる場所の要素);   … 中のいちばん前に SVG の絵を入れる（ほかの中身はそのまま）。大きさは はば に合わせる
//  ・入れる場所に has-mail を付けると … 手紙が入れ口から顔を出して、ふわふわ ゆれる
//  ・入れる場所に is-new を付けると   … ぴょこっと ゆれる（もう一度ゆらすときは、いったん外してから付ける）
//  ・時間帯：外がわに data-time="evening" ／ "night" があると、色が少し変わる
//  見た目は post.css
// ═══════════════════════════════════════════════════════════════
import "./post.css";

const SVG = `<svg class="obj-post" viewBox="0 0 120 224" aria-hidden="true">
  <ellipse class="pt-shadow" cx="60" cy="218" rx="50" ry="5"/>
  <rect class="pt-base" x="14" y="198" width="92" height="18" rx="4"/>
  <rect class="pt-body" x="22" y="52" width="76" height="148"/>
  <rect class="pt-shade" x="84" y="52" width="14" height="148"/>
  <rect class="pt-light" x="28" y="60" width="5" height="132" rx="2.5"/>
  <path class="pt-body" d="M18 54 C18 24 40 13 60 13 C80 13 102 24 102 54 Z"/>
  <circle class="pt-body" cx="60" cy="11" r="6"/>
  <rect class="pt-dark" x="13" y="49" width="94" height="9" rx="4.5"/>
  <circle class="pt-ring" cx="60" cy="96" r="27"/>
  <g class="pt-letter"><rect x="45" y="70" width="30" height="16" rx="1.5"/><path d="M45.5 70.5 L60 80 L74.5 70.5"/><circle cx="60" cy="80.5" r="2.2"/></g>
  <rect class="pt-slot" x="40" y="82" width="40" height="9" rx="4.5"/>
  <path class="pt-mark" d="M52 99 H68 M52 104 H68 M60 104 V117"/>
  <rect class="pt-door" x="42" y="140" width="36" height="42" rx="3"/>
</svg>`;
// ↑ 上から：足もとのかげ → 灰色の台 → 体 → 右がわのかげ → 左がわの光 → 丸い屋根 → 屋根のてっぺん → 屋根のつば
//          → 〇 → 顔を出す手紙 → 入れ口 → 〒 → とびら

/** ポストをかく（入れる場所の中の いちばん前に入れる） */
export function drawPost(host) {
  host.insertAdjacentHTML("afterbegin", SVG);
  return host.querySelector(".obj-post");
}
