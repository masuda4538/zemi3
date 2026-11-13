// ═══════════════════════════════════════════════════════════════
//  確認のダイアログの上に座る黒猫（ConfirmDialog.jsx で使う）
//  mood（気持ち）で顔が変わります。見た目と動きは dialog-cat.css
//    sad   … さみしそう（ふだん）
//    happy … うれしい ^ ^（「まだいる」にマウスを乗せたとき）
//    cry   … なみだ目（「閉じる」「ログアウト」にマウスを乗せたとき）
//    bye   … 手をふって「またね！」（押したあと、閉じるまで）
//  says … 吹き出しに出す言葉
// ═══════════════════════════════════════════════════════════════
import "./dialog-cat.css";

export default function DialogCat({ mood = "sad", says }) {
  return (
    <div className={`dcat is-${mood}`} aria-hidden="true">
      {says && <p className="dcat-says" key={says}>{says}</p>}
      <svg className="dcat-svg" viewBox="0 0 110 100">
        <g className="dcat-all">
        {/* しっぽ（体のうしろ） */}
        <g className="dcat-tail"><path d="M24 92 C10 94 5 85 9 71" /></g>
        {/* 手をふる前足（bye のときだけ。体のうしろから出す） */}
        <g className="dcat-wave">
          <path className="dcat-wave-arm" d="M82 98 L92 50" />
          <ellipse className="dcat-paw" cx="93" cy="45" rx="9" ry="8.5" />
          <path className="dcat-toes" d="M88.5 39.5 v3 M93 38.3 v3 M97.5 39.5 v3" />
        </g>
        {/* 耳 */}
        <g className="dcat-ear dcat-ear-l"><path d="M25 60 Q28 38 32 25 Q34 17 40 20 L56 34 Z" /></g>
        <g className="dcat-ear dcat-ear-r"><path d="M91 60 Q88 38 84 25 Q82 17 76 20 L60 34 Z" /></g>
        {/* 体（下はダイアログのふちのうしろに隠れる） */}
        <path className="dcat-body" d="M58 29 C81 29 94 47 96 68 C98 88 98 104 93 114 C87 124 73 128 58 128 C43 128 29 124 23 114 C18 104 18 88 20 68 C22 47 35 29 58 29 Z" />
        {/* 目：さみしい（白い輪の目＋下がりまゆ） */}
        <g className="dcat-face dcat-face-sad">
          <circle className="dcat-eye" cx="46" cy="57" r="6" />
          <circle className="dcat-eye" cx="70" cy="57" r="6" />
          <path className="dcat-line" d="M38 47.5 L49 44.5 M78 47.5 L67 44.5" />
        </g>
        {/* 目：うれしい ^ ^ */}
        <g className="dcat-face dcat-face-happy">
          <path className="dcat-line" d="M40 59 Q46 51 52 59 M64 59 Q70 51 76 59" />
        </g>
        {/* 目：なみだ目（ぎゅっと閉じた目＋なみだ） */}
        <g className="dcat-face dcat-face-cry">
          <path className="dcat-line" d="M40 54 L50 58 L40 61 M76 54 L66 58 L76 61" />
          <path className="dcat-tear dcat-tear-l" d="M44 64 Q41 69 44 71 Q47 69 44 64 Z" />
          <path className="dcat-tear dcat-tear-r" d="M72 64 Q69 69 72 71 Q75 69 72 64 Z" />
        </g>
        {/* 口 */}
        <path className="dcat-mouth dcat-mouth-sad" d="M53 72 Q58 68.5 63 72" />
        <path className="dcat-mouth dcat-mouth-happy" d="M52 69 Q55 73 58 69 Q61 73 64 69" />
        </g>
      </svg>
    </div>
  );
}
