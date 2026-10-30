// ═══════════════════════════════════════════════════════════════
//  設定 → キーボード：ショートカットを登録する画面
//    「変更」を押すと「キーを押してください…」になり、押した組み合わせがそのまま登録される
//      Esc … やめる　／　Ctrl か Alt と組み合わせる（F1〜F12 は 1 つでも OK）
//    すでに別の操作で使っているキーなら、猫が「付け替えますか？」と聞く
//    × で「なし」に、「すべて最初に戻す」で最初のキーに戻る
//    できたことは右上のお知らせ（notify）、登録できないキーなどはこの画面の下に出す
//  操作の一覧・キーの読み取りは main/shortcuts.js
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { notify } from "../../main/common/notify.js";
import { ACTIONS, DEFAULT_SHORTCUTS, comboFromEvent, formatCombo, checkCombo, actionOfCombo } from "../../main/shortcuts.js";

/**
 * shortcuts : { 操作の id: "Ctrl+1" など }
 * onChange  : (新しい shortcuts) => void
 * confirm   : 猫つきの確認（App.jsx から）
 */
export default function ShortcutEditor({ shortcuts, onChange, confirm }) {
  const [recording, setRecording] = useState(null);   // キーを待っている操作の id
  const [message, setMessage] = useState({ text: "", type: "" });

  // キーを待っているあいだ：押したキーを読み取る（ほかのショートカットは動かさない）
  useEffect(() => {
    if (!recording) return;
    const onKey = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "Escape" && !e.ctrlKey && !e.altKey && !e.shiftKey) { setRecording(null); setMessage({ text: "", type: "" }); return; }
      const combo = comboFromEvent(e);
      if (!combo) return;   // Ctrl などだけを押しているあいだは待つ
      const problem = checkCombo(combo);
      if (problem) { setMessage({ text: problem, type: "error" }); return; }   // そのまま待ち続ける
      const id = recording;
      setRecording(null);
      await assign(id, combo);
    };
    window.addEventListener("keydown", onKey, true);   // true：ほかより先に受け取る
    return () => window.removeEventListener("keydown", onKey, true);
  });

  const nameOf = (id) => ACTIONS.find((a) => a.id === id)?.name ?? id;
  // できたら：下の文を消して、右上にお知らせ
  const done = (title, message = "") => {
    setMessage({ text: "", type: "" });
    notify({ type: "success", title, message, key: "shortcut" });
  };

  // 登録する（ほかの操作で使っていたら、付け替えるか聞く）
  const assign = async (id, combo) => {
    const other = actionOfCombo(shortcuts, combo);
    if (other && other.id !== id) {
      const ok = await confirm({
        title: `「${formatCombo(combo)}」は「${other.name}」で使っています`,
        message: `「${nameOf(id)}」に付け替えますか？\n「${other.name}」のショートカットは「なし」になります。`,
        okLabel: "付け替える", cancelLabel: "やめる",
        cat: { says: "かぶってるよ…？", bye: "付け替えたよ！" },
      });
      if (!ok) { setMessage({ text: "", type: "" }); return; }
      onChange({ ...shortcuts, [other.id]: "", [id]: combo });
      done(`「${nameOf(id)}」を ${formatCombo(combo)} にしました`, `「${other.name}」は なし になりました。`);
      return;
    }
    onChange({ ...shortcuts, [id]: combo });
    done(`「${nameOf(id)}」を ${formatCombo(combo)} にしました`);
  };

  const clear = (id) => {
    onChange({ ...shortcuts, [id]: "" });
    done(`「${nameOf(id)}」のショートカットを なし にしました`);
  };

  const resetAll = async () => {
    const ok = await confirm({ title: "ショートカットを最初に戻しますか？", message: "登録したキーが、すべて最初のキーに戻ります。", okLabel: "戻す" });
    if (!ok) return;
    setRecording(null);
    onChange({ ...DEFAULT_SHORTCUTS });
    done("ショートカットをすべて最初のキーに戻しました");
  };

  const groups = [...new Set(ACTIONS.map((a) => a.group))];
  const changed = ACTIONS.some((a) => shortcuts[a.id] !== DEFAULT_SHORTCUTS[a.id]);

  return (
    <div className="sc">
      {groups.map((g) => (
        <section key={g} className="panel sc-group">
          <h2 className="sc-group-title">{g}</h2>
          {ACTIONS.filter((a) => a.group === g).map((a) => {
            const rec = recording === a.id;
            const combo = shortcuts[a.id];
            return (
              <div key={a.id} className={`sc-row${rec ? " is-recording" : ""}`}>
                <span className="sc-name">{a.name}</span>
                <kbd className={`sc-key${combo ? "" : " is-none"}`}>{rec ? "キーを押してください…" : formatCombo(combo)}</kbd>
                <div className="sc-actions">
                  {rec ? (
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRecording(null); setMessage({ text: "", type: "" }); }}>やめる</button>
                  ) : (
                    <>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRecording(a.id); setMessage({ text: "登録したいキーを押してください（Esc でやめる）", type: "info" }); }}>
                        {combo ? "変更" : "登録"}
                      </button>
                      <button type="button" className="sc-clear" onClick={() => clear(a.id)} disabled={!combo} aria-label={`${a.name}のショートカットを消す`} title="なしにする">×</button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </section>
      ))}

      <div className="sc-foot">
        <p className={`sc-msg is-${message.type || "none"}`} role="status">{message.text || " "}</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={resetAll} disabled={!changed}>すべて最初に戻す</button>
      </div>

      <section className="panel sc-group sc-fixed">
        <h2 className="sc-group-title">変えられない操作</h2>
        <div className="sc-row"><span className="sc-name">ログイン・保存などのボタンを押す（入力中）</span><kbd className="sc-key">Enter</kbd><div className="sc-actions" /></div>
        <div className="sc-row"><span className="sc-name">確認の画面を閉じる・登録をやめる</span><kbd className="sc-key">Esc</kbd><div className="sc-actions" /></div>
      </section>
    </div>
  );
}
