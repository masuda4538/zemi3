// ═══════════════════════════════════════════════════════════════
//  プログラム学習
//  左のアイコン「プログラム学習」を押すと表示されるページです。
//  ここに画面を作っていきます（今はアイコンと名前だけ）。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../components/PageTitle";

export default function Programming({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note="ここにプログラム学習の画面を作ります（src/pages/Programming.jsx）" />
    </div>
  );
}
