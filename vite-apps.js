// ═══════════════════════════════════════════════════════════════
//  各アプリのページ（src/system/application/<id>/ の HTML）を、普通の Web ページとして動かすための設定
//  （vite.config.js から読む。★ このファイルは触らなくて大丈夫です）
//
//  1. 各アプリの HTML の <head> のいちばん上に、自動で 2 つ入れる
//       ・共通の見た目（main/frame/frame.css）… 色・ダークモード・btn・panel・input
//       ・window.app を用意する短いスクリプト（中身は main/frame/bridge.js）
//  2. 保存したとき（npm run tauri dev の間）
//       ・CSS … そのまま見た目だけ入れかわる
//       ・HTML … そのページの窓だけ読み直す
//       ・JS など … そのアプリの窓だけ読み直す（外の画面は読み直さない → ログインしたまま）
//       ・Rust（.rs）… 何もしない（tauri dev が Rust を作り直す）
//  3. アプリを作るとき（npm run tauri build）
//       ・各アプリの HTML も、ページとして作る
//       ・各アプリのフォルダーの画像などのファイルを、そのままの場所にコピーする
//         （JS の中で "./images/cat.png" のように書いた画像も見つかるように）
// ═══════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";

const APP_DIR = path.resolve("src/system/application");
const slash = (p) => p.replace(/\\/g, "/");

/** そのファイルが「各アプリのフォルダーの中」なら { id, name }（name はフォルダーの中での場所） */
function appFile(file) {
  const rel = slash(path.relative(APP_DIR, file));
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  const [id, ...rest] = rel.split("/");
  return rest.length ? { id, name: rest.join("/") } : null;
}

/** 各アプリのフォルダーの中のファイルをすべて集める */
function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".") || e.name === "node_modules") continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** HTML・CSS・JS で作るページか（そのフォルダーに main.html がある） */
const isHtmlApp = (id) => fs.existsSync(path.join(APP_DIR, id, "main.html"));

// 窓の中で window.app を用意する（外の画面の bridge.js から受け取る。単体で開いたときは、お試し用の app）
const BOOT = `
(function () {
  var app = null;
  try { if (window.parent !== window && window.parent.__zemiApp) app = window.parent.__zemiApp(window); }
  catch (e) { console.error(e); }
  if (!app) {
    var only = function () { return Promise.reject(new Error("アプリの中で開いたときだけ使えます")); };
    app = {
      page: { id: location.pathname.split("/").slice(-2)[0], name: "" },
      user: { name: "テスト", loginId: "test" }, pages: [],
      notify: function (o) { console.log("[お知らせ]", o && o.title, (o && o.message) || ""); },
      unlock: function () { return false; }, addProgress: function () { return 0; }, setProgress: function () { return 0; },
      invoke: only, open: function () {}, openUrl: function (u) { window.open(u, "_blank", "noopener"); },
      achievements: function () { return []; },
      onAchievementsChange: function () { return function () {}; }
    };
  }
  window.app = app;
})();
`;

export default function appsPlugin() {
  let outDir = "dist";
  return {
    name: "zemi-apps",

    // アプリを作るとき：各アプリの HTML もページとして作る
    config(config, { command }) {
      if (command !== "build") return;
      const input = { main: path.resolve("index.html") };
      for (const file of walk(APP_DIR)) {
        const f = appFile(file);
        if (f && f.name.endsWith(".html") && isHtmlApp(f.id)) input[`app/${f.id}/${f.name}`] = file;
      }
      return { build: { rolldownOptions: { input } } };
    },
    configResolved(c) { outDir = path.resolve(c.root, c.build.outDir); },

    // 各アプリの HTML に、共通の見た目と window.app を入れる
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const f = appFile(ctx.filename ?? "");
        if (!f || !isHtmlApp(f.id)) return;
        return [
          { tag: "link", attrs: { rel: "stylesheet", href: "/src/system/main/frame/frame.css" }, injectTo: "head-prepend" },
          { tag: "script", children: BOOT, injectTo: "head-prepend" },
        ];
      },
    },

    // 保存したとき：外の画面（ログインしている画面）を読み直さないようにする
    handleHotUpdate({ file, server }) {
      const f = appFile(file);
      if (!f || !isHtmlApp(f.id)) return;
      if (f.name === "achievements/achievements.js") return;   // アチーブの一覧（外の画面で使う）→ ふつうどおり
      if (f.name.endsWith(".css")) return;                 // CSS は見た目だけ入れかえ（Vite がする）
      if (f.name.endsWith(".html")) {                      // HTML はそのページ（窓）だけ読み直す
        server.ws.send({ type: "full-reload", path: "/" + slash(path.relative(server.config.root, file)) });
        return [];
      }
      if (f.name.endsWith(".rs")) return [];               // Rust は tauri dev が作り直す
      server.ws.send({ type: "custom", event: "zemi:app-changed", data: { id: f.id } });   // その窓だけ読み直す
      return [];
    },

    // アプリを作ったあと：各アプリのフォルダーのファイル（画像など）を、同じ場所にコピーする
    writeBundle() {
      for (const file of walk(APP_DIR)) {
        const f = appFile(file);
        if (!f || !isHtmlApp(f.id) || /\.(html|rs|md)$/.test(f.name)) continue;
        const to = path.join(outDir, "src/system/application", f.id, f.name);
        if (fs.existsSync(to)) continue;
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(file, to);
      }
    },
  };
}
