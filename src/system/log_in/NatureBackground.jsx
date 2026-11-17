// ═══════════════════════════════════════════════════════════════
//  背景「青空と草原」（ログイン・新規登録の画面のうしろ）
//    水色の空・お日さま・ゆっくり流れる雲・重なった緑の丘・木と花。ダークモードのときは夜空（星と月）
//    見た目（色・動き）は login-screen.css の「背景：青空と草原」
//  ★ スタート画面（start-end/loading-screen.html）にも同じ絵があります。絵を変えるときは両方を直してください
//    （スタート画面はアプリのプログラムより先に出すので、HTML に直接書いています）
// ═══════════════════════════════════════════════════════════════

/** 雲の形（4 つとも同じ形で、大きさ・高さ・速さを CSS で変える） */
function Cloud({ className }) {
  return (
    <svg className={`nature-cloud ${className}`} viewBox="0 0 240 110" aria-hidden="true">
      <path d="M30 96 C6 96 4 64 30 60 C30 34 62 26 80 42 C90 14 136 10 150 38 C170 22 204 32 204 58 C230 58 238 96 206 96 Z" fill="#fff" />
    </svg>
  );
}

/** 木（幹と、丸い葉っぱをいくつか重ねる） */
function Tree({ x, y, w, h, leaves }) {
  return (
    <g className="tree">
      <rect className="trunk" x={x} y={y} width={w} height={h} rx="6" />
      {leaves.map(([cx, cy, r, light], i) => <circle key={i} className={light ? "leaf2" : "leaf"} cx={cx} cy={cy} r={r} />)}
    </g>
  );
}

export default function NatureBackground() {
  return (
    <div className="nature" aria-hidden="true">
      <span className="nature-stars" />
      <span className="nature-sun" />
      <Cloud className="c1" /><Cloud className="c2" /><Cloud className="c3" /><Cloud className="c4" />
      <svg className="nature-land" viewBox="0 0 1440 420" preserveAspectRatio="xMidYMax slice">
        <path className="far" d="M0 196 C150 150 300 160 450 182 C620 206 760 124 940 140 C1110 156 1260 196 1440 156 V420 H0 Z" />
        <path className="mid" d="M0 262 C200 214 380 232 560 254 C760 280 900 214 1100 226 C1260 236 1360 256 1440 244 V420 H0 Z" />
        {/* 木（左と右） */}
        <Tree x="196" y="200" w="18" h="62" leaves={[[205, 186, 40], [178, 204, 28], [232, 206, 30], [194, 172, 16, true]]} />
        <Tree x="1226" y="186" w="16" h="56" leaves={[[1234, 172, 36], [1210, 190, 24], [1258, 192, 26], [1224, 160, 14, true]]} />
        <Tree x="1316" y="214" w="12" h="40" leaves={[[1322, 204, 24], [1316, 196, 9, true]]} />
        <path className="near" d="M0 326 C240 296 480 316 720 308 C960 300 1200 296 1440 318 V420 H0 Z" />
        {/* 草 */}
        <g className="grass" fill="none" strokeWidth="4" strokeLinecap="round">
          <path d="M90 352 l-4 -16 M98 352 l2 -20 M106 352 l6 -14" /><path d="M380 342 l-4 -14 M388 342 l2 -18 M396 342 l6 -12" />
          <path d="M1030 340 l-4 -16 M1038 340 l2 -20 M1046 340 l6 -14" /><path d="M1300 352 l-4 -14 M1308 352 l2 -18 M1316 352 l6 -12" />
          <path d="M640 366 l-3 -12 M647 366 l2 -15 M654 366 l5 -11" />
        </g>
        {/* 花 */}
        <g className="flower">
          <circle cx="150" cy="360" r="6" fill="#fff" /><circle cx="150" cy="360" r="2.6" fill="#f6c945" />
          <circle cx="300" cy="372" r="5" fill="#f9a8c8" /><circle cx="470" cy="352" r="6" fill="#fff" /><circle cx="470" cy="352" r="2.6" fill="#f6c945" />
          <circle cx="900" cy="368" r="5" fill="#fde68a" /><circle cx="1120" cy="356" r="6" fill="#fff" /><circle cx="1120" cy="356" r="2.6" fill="#f6c945" />
          <circle cx="1380" cy="372" r="5" fill="#f9a8c8" /><circle cx="780" cy="384" r="5" fill="#fff" />
        </g>
      </svg>
    </div>
  );
}
