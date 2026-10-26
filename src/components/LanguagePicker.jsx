// ═══════════════════════════════════════════════════════════════
//  言語・試験を選ぶ部品（新規登録・アカウント画面で共通）
//  ・押すたびに 選ぶ／外す が切り替わる
//  ・一覧にないものは、下の欄から追加できる（追加したものは自動で選ばれる）
//  プログラム言語と試験は、同じ一覧（language テーブル）に入っています。
// ═══════════════════════════════════════════════════════════════
import { useState } from "react";
import { addLanguage } from "../system/common/api.js";
import { Spinner } from "./Form";
import "./form.css";

/**
 * languages : 一覧 [{ languageId, languageName }]
 * selected  : 選んでいる languageId の配列
 * onChange  : (新しい selected) => void
 * onAdded   : (追加した language) => void（一覧に足すため）
 */
export default function LanguagePicker({ languages, selected, onChange, onAdded }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  const add = async () => {
    if (!name.trim()) { setError("追加する名前を入力してください。"); return; }
    setBusy(true); setError("");
    try {
      const lang = await addLanguage(name.trim());
      onAdded(lang);
      if (!selected.includes(lang.languageId)) onChange([...selected, lang.languageId]);
      setName("");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="lang-picker">
      <div className="lang-group">
        <div className="lang-group-head">
          <span>一覧</span>
          {selected.length > 0 && <span className="lang-count">{selected.length} 件選択</span>}
        </div>
        <div className="chips">
          {languages.map((l) => {
            const on = selected.includes(l.languageId);
            return (
              <button key={l.languageId} type="button" aria-pressed={on} className={`chip chip-sm${on ? " on" : ""}`} onClick={() => toggle(l.languageId)}>
                {on && <svg viewBox="0 0 24 24" className="chip-check" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>}
                {l.languageName}
              </button>
            );
          })}
          {languages.length === 0 && <span className="field-help">まだありません</span>}
        </div>
      </div>

      <div className="lang-add">
        <input
          className="input"
          value={name}
          placeholder="一覧にない言語・試験を追加（例：Dart、Ruby技術者認定試験）"
          onChange={(e) => { setName(e.target.value); setError(""); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button type="button" className="btn btn-ghost" onClick={add} disabled={busy}>
          {busy ? <Spinner /> : "追加"}
        </button>
      </div>
      <span className={error ? "field-error" : "field-help"} role={error ? "alert" : undefined}>{error || " "}</span>
    </div>
  );
}
