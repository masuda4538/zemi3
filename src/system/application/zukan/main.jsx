// ═══════════════════════════════════════════════════════════════
//  デジタル図鑑：画面（見た目）　［このフォルダーの入口：main.jsx］
//  左のアイコン「デジタル図鑑」を押すと表示されます。
//  見た目はこのファイル、処理（計算・データ・DB や Rust の呼び出し）は zukan.js に書きます。
//  page には main/apps.js の設定（名前・色・アイコン）が入っています。
// ═══════════════════════════════════════════════════════════════
import PageTitle from "../../main/components/PageTitle";
import { getNote } from "./zukan.js";

export default function Zukan({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note={getNote()} />
    </div>
  );
}
