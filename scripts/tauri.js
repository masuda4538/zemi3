// ═══════════════════════════════════════════════════════════════
//  npm run tauri 〜 の入口（package.json の "tauri" から呼ばれる）★ ふだんは触らなくて大丈夫です
//
//  npm run tauri dev を WSL で実行したときだけ、起動の前に「日本語入力」の準備をします
//    1. 日本語入力（fcitx5 ＋ Mozc）が入っていなければ、「入れますか？」と聞いて入れる（パスワードを聞かれます）
//    2. Mozc を使う設定（~/.config/fcitx5/profile）が無ければ作る
//    3. 日本語入力（fcitx5）を、WSL で動く形で起動しなおす（--disable=wayland。DBus が無ければ用意する）
//    4. 日本語入力とつながったかを確かめて、アプリが日本語入力を使えるようにして（GTK_IM_MODULE・GDK_BACKEND=x11）、tauri dev を起動する
//  入っていれば、何も聞かずにそのまま起動します。アプリの中では Ctrl + Space で日本語 ⇄ 英字。
//  うまくいかないときは、ターミナルに出る「日本語入力：…」の行と、~/.cache/zemi3-fcitx5.log を見てください。
//
//  Windows・Mac で実行したとき、npm run tauri build などのときは、何もしないで tauri をそのまま動かします。
//  （Windows で動かすと、Windows の日本語入力がそのまま使えます。準備は setup-kit v2 の「環境を作る」）
//  日本語入力の準備をしたくないとき：ZEMI_NO_IME=1 npm run tauri dev
//  起動の前に、Node.js の版が package.json の "engines" と合っているかも確かめます（違っても知らせるだけ）
// ═══════════════════════════════════════════════════════════════
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline/promises";

const args = process.argv.slice(2);
const env = { ...process.env };

// Node.js の版の確認（package.json の "engines" に書いた版。違っても止めずに知らせるだけ）
//   Rust の版は rust-toolchain.toml で自動でそろうので、ここでは調べません
try {
  const want = JSON.parse(fs.readFileSync("package.json", "utf8")).engines?.node ?? "";
  const wantMajor = Number((want.match(/\d+/) ?? [])[0]);
  const nowMajor = Number(process.versions.node.split(".")[0]);
  if (wantMajor && nowMajor !== wantMajor) {
    console.log(`\n! Node.js ${process.versions.node} で動かしています。このプロジェクトは Node.js ${wantMajor} 系にそろえています。`);
    console.log("  setup-kit のダッシュボードで「差分を直す」を押すと、決められた版に入れ直せます。\n");
  }
} catch { /* 調べられなくても、そのまま動かす */ }

/** WSL の中か（Linux で、/proc/version に microsoft と書いてある） */
const inWsl = () => {
  if (process.platform !== "linux") return false;
  try { return /microsoft/i.test(fs.readFileSync("/proc/version", "utf8")); } catch { return false; }
};

/** コマンドを実行して、うまくいったか */
const ok = (cmd, cmdArgs = []) => spawnSync(cmd, cmdArgs, { stdio: "ignore" }).status === 0;

/** 入れる必要があるもの（日本語入力の本体・Mozc・GTK のアプリから使うための部品） */
const PACKAGES = ["fcitx5", "fcitx5-mozc", "fcitx5-frontend-gtk3", "dbus-x11"];
const missing = () => PACKAGES.filter((p) => !ok("dpkg", ["-s", p]));

/** Mozc を使う設定（キーボード：日本語 ＋ Mozc。Ctrl + Space で切りかえ） */
const PROFILE = path.join(os.homedir(), ".config", "fcitx5", "profile");
const PROFILE_TEXT = `[Groups/0]
Name=Default
Default Layout=jp
DefaultIM=mozc

[Groups/0/Items/0]
Name=keyboard-jp
Layout=

[Groups/0/Items/1]
Name=mozc
Layout=

[GroupOrder]
0=Default
`;

async function setupJapaneseInput() {
  // 1. 入っていなければ、聞いてから入れる
  const need = missing();
  if (need.length) {
    console.log("\n┌──────────────────────────────────────────────────────────");
    console.log("│ 【アップデート】日本語入力（fcitx5 ＋ Mozc）が入っていません");
    console.log("│  入れると、アプリの中で日本語が打てるようになります（Ctrl + Space で切りかえ）");
    console.log(`│  入れるもの：${need.join(" ")}`);
    console.log("└──────────────────────────────────────────────────────────");
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = (await rl.question("今すぐ入れますか？ [Y/n] ")).trim().toLowerCase();
    rl.close();
    if (answer === "n" || answer === "no") {
      console.log("→ 入れずに起動します（日本語は打てません）。次に起動したときに、また聞きます。\n");
      return;
    }
    console.log("→ 入れます。パスワードを聞かれたら、WSL のパスワードを入れてください。\n");
    const update = spawnSync("sudo", ["apt-get", "update"], { stdio: "inherit" });
    const install = update.status === 0 && spawnSync("sudo", ["apt-get", "install", "-y", ...need], { stdio: "inherit" });
    if (!install || install.status !== 0 || missing().length) {
      console.log("\n× 入れられませんでした。日本語入力なしで起動します。\n");
      return;
    }
    console.log("\n✓ 日本語入力を入れました。\n");
  }

  // 2. Mozc を使う設定が無ければ作る（fcitx5 が動いているあいだは書きかえられるので、止めてから）
  const profile = fs.existsSync(PROFILE) ? fs.readFileSync(PROFILE, "utf8") : "";
  if (!/Name=mozc/.test(profile)) {
    ok("pkill", ["-x", "fcitx5"]);
    fs.mkdirSync(path.dirname(PROFILE), { recursive: true });
    fs.writeFileSync(PROFILE, PROFILE_TEXT);
    console.log("✓ 日本語入力の設定（Mozc）を作りました。");
  }

  // 3. アプリと日本語入力がやりとりする道（DBus）を用意する（WSL では無いことがある）
  if (!env.DBUS_SESSION_BUS_ADDRESS) {
    const userBus = `/run/user/${process.getuid()}/bus`;
    if (fs.existsSync(userBus)) env.DBUS_SESSION_BUS_ADDRESS = `unix:path=${userBus}`;
    else {
      const out = spawnSync("dbus-launch", ["--sh-syntax"], { encoding: "utf8" }).stdout ?? "";
      const m = out.match(/DBUS_SESSION_BUS_ADDRESS='([^']+)'/);
      if (m) env.DBUS_SESSION_BUS_ADDRESS = m[1];
    }
  }

  // 4. 日本語入力を、WSL で動く形で起動しなおす（前に動いていたものと入れかえる）
  //    --disable=wayland … WSL の画面（WSLg）では、wayland の部分を使うと日本語が入らないので切る
  const logFile = path.join(os.homedir(), ".cache", "zemi3-fcitx5.log");
  fs.mkdirSync(path.dirname(logFile), { recursive: true });
  const log = fs.openSync(logFile, "w");
  if (ok("pkill", ["-x", "fcitx5"])) await new Promise((r) => setTimeout(r, 500));   // 前のもの（別の形で動いていたもの）を止める
  spawn("fcitx5", ["--disable=wayland", "-d"], { stdio: ["ignore", log, log], env, detached: true }).unref();

  // 5. つながったか確かめる（3 秒まで待つ）
  let connected = false;
  for (let i = 0; i < 15 && !connected; i++) {
    await new Promise((r) => setTimeout(r, 200));
    connected = spawnSync("fcitx5-remote", [], { env, stdio: "ignore" }).status === 0;
  }

  // 6. アプリから日本語入力を使えるようにする（GDK_BACKEND=x11 … WSL の画面で日本語入力がいちばん安定する形）
  env.GTK_IM_MODULE = "fcitx";
  env.QT_IM_MODULE = "fcitx";
  env.XMODIFIERS = "@im=fcitx";
  env.GDK_BACKEND ??= "x11";

  if (connected) {
    console.log("✓ 日本語入力：準備できました。アプリの入力欄で Ctrl + Space を押すと、日本語 ⇄ 英字 が切りかわります。");
    console.log("  （Windows 側の日本語入力は「英字（A）」のままにしておいてください）\n");
  } else {
    console.log("× 日本語入力：日本語入力（fcitx5）とつながりませんでした。日本語なしで起動します。");
    if (process.getuid?.() === 0) console.log("  root ユーザーでは Mozc が動きません。ふだんのユーザーで実行してください。");
    console.log(`  くわしい記録：${logFile}\n`);
  }
}

if (args[0] === "dev" && inWsl() && !process.env.ZEMI_NO_IME) {
  try { await setupJapaneseInput(); } catch (err) { console.log("日本語入力の準備でエラーが出ました（そのまま起動します）：", err.message); }
}

// tauri を動かす（@tauri-apps/cli の tauri.js を、今の node で動かす。Windows・WSL のどちらでも同じ）
const cli = path.resolve("node_modules", "@tauri-apps", "cli", "tauri.js");
const child = spawn(process.execPath, [cli, ...args], { stdio: "inherit", env });
child.on("exit", (code, signal) => process.exit(signal ? 1 : code ?? 0));
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => child.kill(sig));
