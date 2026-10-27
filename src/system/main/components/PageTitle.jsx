// ページの中央に、アイコンと名前を大きく出す（中身を作るまでの仮の画面）
import Icon from "./Icon";

export default function PageTitle({ page, note }) {
  return (
    <div className="app-title">
      <span className="app-title-icon"><Icon name={page.icon} /></span>
      <h1>{page.name}</h1>
      {note && <p className="app-title-note">{note}</p>}
    </div>
  );
}
