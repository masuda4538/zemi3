// ═══════════════════════════════════════════════════════════════
//  設定：画面（見た目）　［このフォルダーの入口：main.jsx］
//  GitHub の Settings のように、左に項目、右に選んだ項目の中身を出します（main/components/SettingsLayout.jsx）。
//    表示 / 操作 / キーボード（ショートカットの登録。ShortcutEditor.jsx）/ 起動・ログイン / 情報 / リセット（下の SECTIONS）
//  変えるとすぐ反映され、その PC の中のファイル（AppData の settings.json）に保存されます（データベースには入れません）。
//  main/App.jsx から settings（今の設定）、onSettings（変更）、onResetSettings、confirm を受け取ります。
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from "react";
import { getVersion } from "@tauri-apps/api/app";
import SettingsLayout from "../../main/components/SettingsLayout";
import Icon from "../../main/components/Icon";
import { Switch } from "../../main/components/Form";
import { APP_TITLE } from "../../main/config";
import { inTauri, isDev } from "../../main/common/api.js";
import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { THEMES, FONT_SIZES, forgetLastUserId, settingsFilePath } from "./settings.js";
import ShortcutEditor from "./ShortcutEditor";
import { notify } from "../../main/common/notify.js";
import "./settings.css";

/** 左の項目（上から順に並ぶ） */
const SECTIONS = [
  { id: "display",  name: "表示",           icon: "monitor",  desc: "画面の見た目を変えます。" },
  { id: "behavior", name: "操作",           icon: "pointer",  desc: "うっかり操作を防ぎます。" },
  { id: "keyboard", name: "キーボード",     icon: "keyboard", desc: "ショートカットを登録できます。「変更」を押してから、使いたいキーを押してください。" },
  { id: "startup",  name: "起動・ログイン", icon: "power",    desc: "次に起動したときから反映されます。" },
  { id: "info",     name: "情報",           icon: "info",     desc: "アプリのバージョンと、設定・データの保存場所です。" },
  { id: "reset",    name: "リセット",       icon: "reset",    desc: "設定を最初の状態に戻します。" },
];

export default function Settings({ settings, onSettings, onResetSettings, confirm, user }) {
  const [current, setCurrent] = useState("display");
  // 設定を変える → すぐ保存して、右上に短くお知らせ（続けて変えたときは 1 つにまとめる）
  const set = (key) => (value) => {
    onSettings({ [key]: value });
    notify({ type: "success", title: "設定を保存しました", duration: 2000, key: "settings" });
  };
  const section = SECTIONS.find((x) => x.id === current);

  return (
    <SettingsLayout
      head={<div className="set-head"><span className="set-head-icon"><Icon name="settings" /></span><div className="set-head-text"><strong>設定</strong><span>変えるとすぐ反映されます</span></div></div>}
      items={SECTIONS}
      current={current}
      onSelect={setCurrent}
      title={section.name}
      desc={section.desc}
    >
      {current === "display" && (
        <Card>
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
      )}

      {current === "behavior" && (
        <Card>
          <Row title="ログアウトの前に確認する" desc="ログアウトを押したときに、確認を出します。">
            <Switch checked={settings.confirmLogout} onChange={set("confirmLogout")} label="ログアウトの前に確認する" />
          </Row>
          <Row title="アプリを閉じる前に確認する" desc="× や Alt + F4 で閉じるときに、確認を出します。">
            <Switch checked={settings.confirmClose} onChange={set("confirmClose")} label="アプリを閉じる前に確認する" />
          </Row>
        </Card>
      )}

      {current === "keyboard" && (
        <ShortcutEditor shortcuts={settings.shortcuts} onChange={(v) => onSettings({ shortcuts: v })} confirm={confirm} />
      )}

      {current === "startup" && (
        <Card>
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
      )}

      {current === "info" && <InfoCard user={user} />}

      {current === "reset" && (
        <Card>
          <Row title="設定を初期状態に戻す" desc="この画面の設定をすべて最初の状態に戻します。">
            <button
              type="button"
              className="btn btn-danger"
              onClick={async () => {
                const ok = await confirm({ title: "設定を初期状態に戻しますか？", message: "この画面の設定がすべて最初の状態に戻ります。", okLabel: "戻す", danger: true });
                if (ok) { onResetSettings(); notify({ type: "success", title: "設定を初期状態に戻しました", key: "settings" }); }
              }}
            >
              初期状態に戻す
            </button>
          </Row>
        </Card>
      )}
    </SettingsLayout>
  );
}

// ───────── 情報・データ ─────────
function InfoCard({ user }) {
  const [version, setVersion] = useState("");
  const [path, setPath] = useState("");
  const [openError, setOpenError] = useState("");

  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(""));
    settingsFilePath().then(setPath);
  }, []);

  // エクスプローラーで設定ファイルのフォルダーを開いて、settings.json を選んだ状態にする
  const openFolder = async () => {
    setOpenError("");
    try { await revealItemInDir(path); } catch (err) { setOpenError(`開けませんでした（${String(err)}）`); }
  };

  return (
    <Card>
      <Row title={APP_TITLE} desc={`バージョン ${version || "-"} ・ ${isDev ? "開発中（npm run tauri dev）" : inTauri ? "アプリ" : "ブラウザ"}`} />
      {user && <Row title="ログイン中" desc={`${user.name}（${user.userId}）`} />}
      <Row
        title="設定の保存場所"
        desc={path
          ? <>この PC の中のファイルに保存しています。<br /><code className="set-path">{path}</code>{openError && <><br /><span className="set-error">{openError}</span></>}</>
          : "ブラウザで開いているので、ブラウザの中（localStorage）に保存しています。"}
      >
        {path && <button type="button" className="btn btn-ghost btn-sm" onClick={openFolder}>フォルダを開く</button>}
      </Row>
      <Row title="アカウントの保存" desc="今はデータベースを使っていません。アカウントの内容はアプリを閉じると消えます。" />
    </Card>
  );
}

// ───────── 部品 ─────────
/** 右の中身の枠（見出しは SettingsLayout が出すので、ここには付けない） */
function Card({ children }) {
  return <section className="panel settings-card">{children}</section>;
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
