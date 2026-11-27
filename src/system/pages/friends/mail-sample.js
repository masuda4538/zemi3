// ═══════════════════════════════════════════════════════════════
//  届いたフレンド申請（★ 仮のデータ。見た目のイメージ用）と、問題の選択肢の しるし
//  手紙・応援のスタンプは なくしました（フレンドとの やりとりは チャットで。スタンプも チャットで送る）
//  使っているところ：ホームのポスト（application/home/js/main.js → mailbox.js）と、
//                    フレンドのページ（pages/friends/main.jsx）の「フレンドを追加」の「届いた申請」
//
//  ★ 本当の機能を作るとき
//    ・REQUEST_SAMPLE のかわりに、データベースの friend_request（to_user_id が自分で status が 0 のもの）をわたす
//    ・あとから届いた申請は、ホームの main.js にある mailbox.receive(届いた申請) を呼ぶと、ポストに入る
//
//  届いた申請 1 つの形
//    id    … 見分けるための名前（同じものが 2 回入らないように）
//    type  … "request"（フレンド申請）
//    from  … 申請してきた人 { userId, name, color }（まだフレンドでない人なので、名前と色もいっしょに）
//    at    … 届いた日時（Date）
//    read  … もう見たか（true ＝ 見た）
// ═══════════════════════════════════════════════════════════════

const ago = (min) => new Date(Date.now() - min * 60 * 1000);   // 今から min 分前

/** 届いたフレンド申請 */
export const REQUEST_SAMPLE = [
  { id: "m3", type: "request", from: { userId: "sakura", name: "さくら", color: "#f97316" }, at: ago(60 * 5 + 20), read: false },
];

/** 選択肢の前につける しるし（ア・イ・ウ・エ…） */
export const CHOICE_MARKS = ["ア", "イ", "ウ", "エ", "オ", "カ"];
