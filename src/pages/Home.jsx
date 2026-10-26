// ═══════════════════════════════════════════════════════════════
//  ホーム
//  左のアイコン「ホーム」を押すと表示されるページです。
//  ここに画面を作っていきます（今はアイコンと名前だけ）。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../components/PageTitle";

export default function Home({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note="ここにホームの画面を作ります（src/pages/Home.jsx）" />
    </div>
  );
}
