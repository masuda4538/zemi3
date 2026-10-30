// ═══════════════════════════════════════════════════════════════
//  情報収集：入口［このフォルダーの入口：main.jsx］ ★ このファイルは触らなくて大丈夫です
//  左のアイコン「情報収集」を押すと、このファイルが読み込まれます。
//  書きかえていくのは、この 3 つです
//    main.html … 画面（普通の HTML）
//    main.css  … 見た目（普通の CSS）
//    main.js   … 動き（普通の JavaScript。start(root, app) が最初に呼ばれる）
//  アチーブは achievements.js
// ═══════════════════════════════════════════════════════════════
import HtmlApp from "../../main/components/HtmlApp";
import html from "./main.html?raw";   // main.html の中身を、文字としてそのまま読み込む
import { start } from "./main.js";
import "./main.css";

export default function Research(props) {
  return <HtmlApp html={html} start={start} {...props} />;
}
