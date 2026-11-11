// ═══════════════════════════════════════════════════════════════
//  窓（iframe）の中に出す HTML を、普通の Web ページとして動かすための設定
//  （vite.config.js から読む。★ このファイルは触らなくて大丈夫です）
//
//  窓の中に出す HTML のフォルダー（どちらも「フォルダー/index.html」が入口）
//    src/system/application/<id>/  … 各アプリ（右側の窓）
//    src/system/sidebar/           … 左のサイドバー（左側の窓）
//
//  1. その HTML の <head> のいちばん上に、自動で 2 つ入れる
//       ・共通の見た目（main/frame/frame.css）… 色・ダークモード・btn・panel・input
//       ・window.app を用意する短いスクリプト（中身は main/frame/bridge.js）
//  2. 保存したとき（npm run tauri dev の間）
//       ・CSS … そのまま見た目だけ入れかわる
//       ・HTML … その窓だけ読み直す
//       ・JS など … その窓だけ読み直す（外の画面は読み直さない → ログインしたまま）
//       ・Rust（.rs）… 何もしない（tauri dev が Rust を作り直す）
//  3. アプリを作るとき（npm run tauri build）
//       ・窓の HTML も、ページとして作る
//       ・フォルダーの画像などのファイルを、そのままの場所にコピーする
//         （JS の中で "./images/cat.png" のように書いた画像も見つかるように）
// ═══════════════════════════════════════════════════════════════
import fs from "node:fs";
import path from "node:path";

/** 窓の HTML を置くフォルダー
 *  root の中の、ids に書いたフォルダー（ids が無いときは、root の中のすべてのフォルダー）が 1 つの窓 */
const WINDOWS = [
  { root: path.resolve("src/system/application") },                 // 各アプリ
  { root: path.resolve("src/system"), ids: ["sidebar"] },           // 左のサイドバー
];
const slash = (p) => p.replace(/\\/g, "/");

/** そのファイルが窓のフォルダーの中なら { root, id, name }（name はフォルダーの中での場所） */
function appFile(file) {
  for (const { root, ids } of WINDOWS) {
    const rel = slash(path.relative(root, file));
    if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
    const [id, ...rest] = rel.split("/");
    if (ids && !ids.includes(id)) continue;
    if (rest.length) return { root, id, name: rest.join("/") };
  }
  return null;
}

/** フォルダーの中のファイルをすべて集める */
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

/** HTML で作る窓か（そのフォルダーに index.html がある） */
const isWindow = (f) => fs.existsSync(path.join(f.root, f.id, "index.html"));

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
      achievements: function () { return []; }, rarities: [],
      onAchievementsChange: function () { return function () {}; },
      loginDays: function () { return null; },
      onLoginDaysChange: function () { return function () {}; },
      usage: function () { return null; },
      onUsageChange: function () { return function () {}; }
    };
  }
  window.app = app;
})();
`;

export default function appsPlugin() {
  let outDir = "dist";
  let root = process.cwd();
  return {
    name: "zemi-apps",

    // アプリを作るとき：窓の HTML もページとして作る
    config(config, { command }) {
      if (command !== "build") return;
      const input = { main: path.resolve("index.html") };
      for (const file of WINDOWS.flatMap((w) => (w.ids ?? [""]).flatMap((id) => walk(path.join(w.root, id))))) {
        const f = appFile(file);
        if (f && f.name.endsWith(".html") && isWindow(f)) input[slash(path.relative(process.cwd(), file))] = file;
      }
      return { build: { rolldownOptions: { input } } };
    },
    configResolved(c) {
      root = c.root;
      outDir = path.resolve(c.root, c.build.outDir);
    },

    // 窓の HTML に、共通の見た目と window.app を入れる
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        const f = appFile(ctx.filename ?? "");
        if (!f || !isWindow(f)) return;
        return [
          { tag: "link", attrs: { rel: "stylesheet", href: "/src/system/main/frame/frame.css" }, injectTo: "head-prepend" },
          { tag: "script", children: BOOT, injectTo: "head-prepend" },
        ];
      },
    },

    // 保存したとき：外の画面（ログインしている画面）を読み直さないようにする
    handleHotUpdate({ file, server }) {
      const f = appFile(file);
      if (!f || !isWindow(f)) return;
      if (f.name.endsWith(".css")) return;                 // CSS は見た目だけ入れかえ（Vite がする）
      if (f.name.endsWith(".html")) {                      // HTML はその窓だけ読み直す
        server.ws.send({ type: "full-reload", path: "/" + slash(path.relative(server.config.root, file)) });
        return [];
      }
      if (f.name.endsWith(".rs")) return [];               // Rust は tauri dev が作り直す
      server.ws.send({ type: "custom", event: "zemi:app-changed", data: { id: f.id } });   // その窓だけ読み直す
      return [];
    },

    // アプリを作ったあと：窓のフォルダーのファイル（画像など）を、同じ場所にコピーする
    writeBundle() {
      for (const file of WINDOWS.flatMap((w) => (w.ids ?? [""]).flatMap((id) => walk(path.join(w.root, id))))) {
        const f = appFile(file);
        if (!f || !isWindow(f) || /\.(html|rs|md)$/.test(f.name)) continue;
        const to = path.join(outDir, path.relative(root, file));
        if (fs.existsSync(to)) continue;
        fs.mkdirSync(path.dirname(to), { recursive: true });
        fs.copyFileSync(file, to);
      }
    },
  };
}
