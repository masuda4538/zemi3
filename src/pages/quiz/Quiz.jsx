// ═══════════════════════════════════════════════════════════════
//  問題作成
//  左のアイコン「問題作成」を押すと表示されるページです。
//  ここに画面を作っていきます（今はアイコンと名前だけ）。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../../components/PageTitle";

export default function Quiz({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note="ここに問題作成の画面を作ります（src/pages/quiz/Quiz.jsx）" />
    </div>
  );
}
