// ═══════════════════════════════════════════════════════════════
//  問題作成：画面（見た目）　［このフォルダーの入口：main.jsx］
//  左のアイコン「問題作成」を押すと表示されます。
//  見た目はこのファイル、処理（計算・データ・DB や Rust の呼び出し）は quiz.js に書きます。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// お試し
//お試し２
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../../components/PageTitle";
import { getNote } from "./quiz.js";

export default function Quiz({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note={getNote()} />
    </div>
  );
}
