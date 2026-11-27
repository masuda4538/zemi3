// ═══════════════════════════════════════════════════════════════
//  チャットの スタンプの一覧
//    絵は public/images/stamp/<id>.svg（線の絵 ＋ ひとこと）。データベースには 絵を入れず、この id（と ファイルの場所）だけを持つ
//    スタンプを 増やすときは、public/images/stamp に 絵（SVG か PNG）を置いて、下の STAMPS に 1 行 足す
//  使っているところ：chat.jsx（入力欄の横の スタンプのボタン・吹き出し）・chat-store.js・ホームのポストの通知
// ═══════════════════════════════════════════════════════════════

/** スタンプ { id, name（ひとこと）, file（public/images/stamp の中の ファイル名） }。ならびは この順 */
export const STAMPS = [
  { id: "good", name: "いいね！", file: "good.svg" },
  { id: "thanks", name: "ありがとう", file: "thanks.svg" },
  { id: "great", name: "すごい！", file: "great.svg" },
  { id: "fight", name: "がんばろう", file: "fight.svg" },
  { id: "ok", name: "OK！", file: "ok.svg" },
  { id: "sorry", name: "ごめんね", file: "sorry.svg" },
  { id: "otsukare", name: "おつかれさま", file: "otsukare.svg" },
  { id: "oyasumi", name: "おやすみ", file: "oyasumi.svg" },
];

/** id → スタンプ（ないときは null） */
export const stampOf = (id) => STAMPS.find((s) => s.id === id) ?? null;

/** スタンプの 絵の場所（アプリの いちばん上からの 場所） */
export const stampSrc = (s) => `${import.meta.env.BASE_URL}images/stamp/${s.file}`;
