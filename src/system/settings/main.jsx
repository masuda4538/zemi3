// ═══════════════════════════════════════════════════════════════
//  設定：画面（見た目）　［このフォルダーの入口：main.jsx］
//    左の列 … 表示・操作
//    右の列 … 起動・ログイン、情報・データ
//  変えるとすぐ反映され、その PC の中に保存されます（データベースには入れません）。
//  App.jsx から settings（今の設定）、onSettings（変更）、onResetSettings、confirm を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { Switch, Spinner } from "../../components/Form";
import { APP_TITLE } from "../../config";
import { checkDb, inTauri, isDev } from "../common/api.js";
import { THEMES, FONT_SIZES, SHORTCUTS, forgetLastUserId } from "./settings.js";
import "./settings.css";

export default function Settings({ settings, onSettings, onResetSettings, confirm, user }) {
  const set = (key) => (value) => onSettings({ [key]: value });

  return (
    <div className="settings">
      <h1 className="page-heading">設定</h1>
      <div className="settings-columns">
        {/* ───── 左の列 ───── */}
        <div className="settings-col">
          <Card title="表示" note="画面の見た目を変えます。">
            <Row title="テーマ" desc="「PC に合わせる」は Windows の設定に合わせて切り替わります。">
              <Segment options={THEMES} value={settings.theme} onChange={set("theme")} />
            </Row>
            <Row title="文字の大きさ" desc="画面全体の大きさが変わります。">
              <Segment options={FONT_SIZES} value={settings.fontSize} onChange={set("fontSize")} />
            </Row>
            <Row title="アニメーションを減らす" desc="画面が動く効果を少なくします。">
              <Switch checked={settings.reduceMotion} onChange={set("reduceMotion")} label="アニメーションを減らす" />
            </Row>
            <Row title="サイドバーの文字を隠す" desc="左のサイドバーをアイコンだけにして、画面を広く使います。">
              <Switch checked={settings.compactSidebar} onChange={set("compactSidebar")} label="サイドバーの文字を隠す" />
            </Row>
          </Card>

          <Card title="操作" note="うっかり操作を防ぎます。">
            <Row title="ログアウトの前に確認する" desc="ログアウトを押したときに、確認を出します。">
              <Switch checked={settings.confirmLogout} onChange={set("confirmLogout")} label="ログアウトの前に確認する" />
            </Row>
            <Row title="アプリを閉じる前に確認する" desc="× や Alt + F4 で閉じるときに、確認を出します。">
              <Switch checked={settings.confirmClose} onChange={set("confirmClose")} label="アプリを閉じる前に確認する" />
            </Row>
            <div className="set-row set-row-block">
              <div>
                <strong>キーボード操作</strong>
                <p>ログインしたあとに使えます。</p>
              </div>
              <ul className="shortcuts">
                {SHORTCUTS.map((s) => (
                  <li key={s.keys}><kbd>{s.keys}</kbd><span>{s.what}</span></li>
                ))}
              </ul>
            </div>
          </Card>
        </div>

        {/* ───── 右の列 ───── */}
        <div className="settings-col">
          <Card title="起動・ログイン" note="次に起動したときから反映されます。">
            <Row title="ログイン ID を覚えておく" desc="次のログインのとき、ログイン ID が入った状態になります。">
              <Switch
                checked={settings.rememberId}
                onChange={(v) => { if (!v) forgetLastUserId(); set("rememberId")(v); }}
                label="ログイン ID を覚えておく"
              />
            </Row>
            <Row title="起動したときに最大化する" desc="オフにすると、元のサイズで起動します。">
              <Switch checked={settings.startMaximized} onChange={set("startMaximized")} label="起動したときに最大化する" />
            </Row>
          </Card>

          <InfoCard user={user} />

          <Card title="設定のリセット">
            <div className="set-row">
              <div>
                <strong>設定を初期状態に戻す</strong>
                <p>この画面の設定をすべて最初の状態に戻します。アカウントやデータベースの内容は消えません。</p>
              </div>
              <button
                type="button"
                className="btn btn-danger"
                onClick={async () => {
                  const ok = await confirm({ title: "設定を初期状態に戻しますか？", message: "この画面の設定がすべて最初の状態に戻ります。", okLabel: "戻す", danger: true });
                  if (ok) onResetSettings();
                }}
              >
                初期状態に戻す
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ───────── 情報・データ ─────────
function InfoCard({ user }) {
  const [version, setVersion] = useState("");
  const [db, setDb] = useState({ state: "checking", message: "" });

  const testDb = () => {
    setDb({ state: "checking", message: "" });
    checkDb().then(() => setDb({ state: "ok", message: "" })).catch((e) => setDb({ state: "ng", message: String(e) }));
  };

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
    testDb();
  }, []);

  return (
    <Card title="情報・データ">
      <Row title={APP_TITLE} desc={`バージョン ${version || "-"} ・ ${isDev ? "開発中（npm run tauri dev）" : inTauri ? "アプリ" : "ブラウザ"}`} />
      {user && <Row title="ログイン中" desc={`${user.name}（${user.userId}）`} />}
      <Row
        title="データベース"
        desc={db.state === "ng" ? db.message : "この PC の MariaDB（sotsuken）"}
      >
        <span className={`db-state is-${db.state}`}>
          {db.state === "checking" ? <><Spinner />確認中</> : db.state === "ok" ? "接続できています" : "接続できません"}
        </span>
        <button type="button" className="btn btn-ghost btn-sm" onClick={testDb} disabled={db.state === "checking"}>もう一度確認</button>
      </Row>
    </Card>
  );
}

// ───────── 部品 ─────────
function Card({ title, note, children }) {
  return (
    <section className="panel settings-card">
      <div className="panel-head">
        <h2>{title}</h2>
        {note && <p>{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Row({ title, desc, children }) {
  return (
    <div className="set-row">
      <div>
        <strong>{title}</strong>
        {desc && <p>{desc}</p>}
      </div>
      {children && <div className="set-control">{children}</div>}
    </div>
  );
}

function Segment({ options, value, onChange }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? "active" : ""} onClick={() => onChange(o.id)}>
          {o.name}
        </button>
      ))}
    </div>
  );
}
