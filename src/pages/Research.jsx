// ═══════════════════════════════════════════════════════════════
//  情報収集
//  左のアイコン「情報収集」を押すと表示されるページです。
//  ここに画面を作っていきます（今はアイコンと名前だけ）。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../components/PageTitle";

export default function Research({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note="ここに情報収集の画面を作ります（src/pages/Research.jsx）" />
    </div>
  );
}
