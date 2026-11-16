import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
import fs from "node:fs";
import path from "node:path";
import appsPlugin from "./vite-apps.js";   // 各アプリのページ（src/system/application）を普通の Web ページとして動かす
const host = process.env.TAURI_DEV_HOST;

// スタート画面（青いロード画面）を index.html に入れる
//   src/system/start-end/loading-screen.html の中身を、index.html の「<!-- loading-screen -->」のところに入れます。
//   （アプリのプログラムより先に出したいので、JS ではなく HTML のまま入れる）
const LOADING_SCREEN = path.resolve("src/system/start-end/loading-screen.html");
function loadingScreen() {
  return {
    name: "loading-screen",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        if (!/\/index\.html$/.test(ctx.path) || ctx.path.includes("/src/")) return html;   // いちばん外の index.html だけ
        return html.replace("<!-- loading-screen -->", fs.readFileSync(LOADING_SCREEN, "utf8"));
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react(), appsPlugin(), loadingScreen()],

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || "127.0.0.1",
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
}));
