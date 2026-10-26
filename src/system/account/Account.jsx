// アカウント：画面（見た目）
import PageTitle from "../../components/PageTitle";
import { getNote } from "./account.js";

export default function Account({ page }) {
  return (
    <div className="page-center">
      <PageTitle page={page} note={getNote()} />
    </div>
  );
}