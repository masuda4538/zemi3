// ═══════════════════════════════════════════════════════════════
//  設定
//  左下の「設定」を押すと表示されるページです。
//  表示モード（ホワイト／ダーク）と、アプリの情報を表示します。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { APP_TITLE } from "../../config";

export default function Settings({ theme, onTheme }) {
  const [version, setVersion] = useState("");

  useEffect(() => {
    // Tauri の外（ブラウザ）で開いたときは取れないので、取れなくても続ける
    getVersion().then(setVersion).catch(() => setVersion(""));
  }, []);

  return (
    <div className="page-narrow">
      <h1 className="page-heading">設定</h1>

      <section className="panel">
        <div className="panel-head"><h2>表示</h2></div>
        <div className="set-row">
          <div>
            <strong>表示モード</strong>
            <p>画面の明るさを切り替えます。選んだモードは保存されます。</p>
          </div>
          <div className="seg" role="radiogroup" aria-label="表示モード">
            <button type="button" role="radio" aria-checked={theme === "light"} className={theme === "light" ? "active" : ""} onClick={() => onTheme("light")}>ホワイト</button>
            <button type="button" role="radio" aria-checked={theme === "dark"} className={theme === "dark" ? "active" : ""} onClick={() => onTheme("dark")}>ダーク</button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><h2>このアプリについて</h2></div>
        <div className="set-row">
          <div>
            <strong>{APP_TITLE}</strong>
            <p>{version ? `バージョン ${version} ・ ` : ""}Tauri ＋ React ＋ Rust</p>
          </div>
        </div>
        <div className="set-row">
          <div>
            <strong>キーボード操作</strong>
            <p>Ctrl + 1：ホーム ／ Ctrl + 2〜5：各アプリ ／ Ctrl + ,：設定</p>
          </div>
        </div>
      </section>
    </div>
  );
}
