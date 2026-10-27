// ═══════════════════════════════════════════════════════════════
//  問題作成：入口［このフォルダーの入口：main.jsx］
//  左のアイコン「問題作成」を押すと、このファイルが読み込まれます。
//
//  ★ このファイルは、下の 3 つをつなぐだけです。ふだんは触らなくて大丈夫です。
//    quiz.html … 画面（普通の HTML）
//    quiz.css  … 見た目（普通の CSS）
//    quiz.js   … 動き（普通の JavaScript。start(root) が最初に呼ばれる）
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from "react";
import html from "./quiz.html?raw";   // quiz.html の中身を、文字としてそのまま読み込む
import { start } from "./quiz.js";
import "./quiz.css";

export default function Quiz({ page }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    root.innerHTML = html;                  // quiz.html を画面に入れる
    const stop = start(root, { page });     // quiz.js を動かす
    return () => {                          // ほかの画面へ移るとき
      if (typeof stop === "function") stop();
      root.innerHTML = "";
    };
  }, [page]);

  return <div ref={rootRef} className="quiz-root" />;
}
