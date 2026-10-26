// ═══════════════════════════════════════════════════════════════
//  ホーム：画面（見た目）
//  左のアイコン「ホーム」を押すと表示されます。
//  見た目はこのファイル、処理（計算・データ・DB や Rust の呼び出し）は home.js に書きます。
//  page には apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../../components/PageTitle";
import { getNote } from "./home.js";

export default function Home({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note={getNote()} />
    </div>
  );
}
