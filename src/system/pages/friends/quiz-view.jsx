// ═══════════════════════════════════════════════════════════════
//  フレンド：問題の中身を見せる部品（フレンド詳細の「送り合ったもの」と、チャットの問題で使う）
//    <QuizView quiz={問題} note="ひとこと" canSolve showAnswer />
//      quiz       … { title, questions: [{ q, choices, answer }] }（形は mail-sample.js・chat-store.js）
//      note       … ひとこと（なくてもよい）
//      canSolve   … 「問題作成で解く」ボタンを出す（届いた問題のとき。★ 解く機能は まだ準備中）
//      showAnswer … 正解の選択肢を緑で目立たせる（自分が送った問題のとき）
// ═══════════════════════════════════════════════════════════════
import Icon from "../../core/components/Icon";
import { notify } from "../../core/utils/notify.js";
import { CHOICE_MARKS } from "./mail-sample.js";

export default function QuizView({ quiz, note, canSolve = false, showAnswer = false }) {
  if (!quiz) return null;
  const solve = () => notify({ type: "info", title: "問題を解く機能は準備中です", message: "今は見た目のイメージだけです。", key: "friends" });
  return (
    <div className="fr-quiz">
      <div className="fr-quiz-head">
        <span className="fr-kind is-quiz"><Icon name="quiz" /></span>
        <span><b>{quiz.title}</b><small>{quiz.questions.length}問</small></span>
        {canSolve && <button type="button" className="btn btn-primary" onClick={solve}><Icon name="quiz" />問題作成で解く</button>}
      </div>
      {note && <p className="fr-quiz-note">{note}</p>}
      <ol className="fr-quiz-list">
        {quiz.questions.map((x, i) => (
          <li key={i}>
            <span className="fr-q-no">Q{i + 1}</span>
            <div>
              <p>{x.q}</p>
              <ul className="fr-choices">
                {x.choices.map((c, j) => {
                  const ok = showAnswer && j === x.answer;
                  return (
                    <li key={j} className={ok ? "is-answer" : ""}>
                      <i>{CHOICE_MARKS[j] ?? j + 1}</i>{c}
                      {ok && <span className="fr-answer-tag"><Icon name="check" />正解</span>}
                    </li>
                  );
                })}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
