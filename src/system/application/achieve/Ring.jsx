// ═══════════════════════════════════════════════════════════════
//  進み具合の円グラフ（ドーナツの形）。アチーブの画面で使う
//    <Ring got={3} total={9} size={160} label="すべて" />
//  まんなかに % を出し、100% になったら金色の「コンプリート」になる（色だけでなく文字でも出す）
//  見た目は achieve.css の .ring
// ═══════════════════════════════════════════════════════════════
const R = 42;                        // 円の半径（viewBox 100 × 100 の中）
const LEN = 2 * Math.PI * R;         // 円周

export default function Ring({ got, total, size = 120, label, big = false }) {
  const rate = total ? got / total : 0;
  const pct = Math.round(rate * 100);
  const done = total > 0 && got === total;
  return (
    <div
      className={`ring${big ? " is-big" : ""}${done ? " is-done" : ""}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? ""} ${got} / ${total} こ（${pct}%）`}
    >
      <svg viewBox="0 0 100 100">
        <circle className="ring-track" cx="50" cy="50" r={R} />
        {got > 0 && (
          <circle
            className="ring-fill"
            cx="50" cy="50" r={R}
            strokeDasharray={`${LEN * rate} ${LEN}`}
            style={{ "--len": LEN }}
          />
        )}
      </svg>
      <div className="ring-center">
        <strong>{pct}<small>%</small></strong>
        {big && <span>{done ? "コンプリート！" : `${got} / ${total} こ`}</span>}
      </div>
    </div>
  );
}
