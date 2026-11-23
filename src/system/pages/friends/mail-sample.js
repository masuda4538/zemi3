// ═══════════════════════════════════════════════════════════════
//  フレンドから届くもの（★ 仮のデータ。見た目のイメージ用）
//  フレンドからものを送る・受け取る機能は まだ作っていません。
//  使っているところ：ホームのポスト（application/home/js/mailbox.js）と、フレンドのページ（pages/friends/main.jsx）の
//                    「届いた申請」「フレンド詳細の 送り合ったもの」
//
//  ★ 本当の機能を作るとき
//    ・最初に届いているものは、MAIL_SAMPLE のかわりに、本当のデータ（下と同じ形の配列）をわたす
//    ・あとから届いたものは、ホームの main.js にある mailbox.receive(届いたもの) を呼ぶと、ポストに入る
//      （手紙がポストの入れ口から顔を出す。問題なら、送った人の頭の上に吹き出しも出る）
//
//  届いたもの 1 つの形
//    id    … 見分けるための名前（同じものが 2 回入らないように）
//    type  … 種類："letter"（手紙） ／ "quiz"（問題） ／ "request"（フレンド申請） ／ "gift"（応援のスタンプ）
//    from  … 送ってきた人 { userId, name, color }（フレンドでない人からの申請もあるので、名前と色もいっしょに）
//    at    … 届いた日時（Date）
//    text  … 本文（手紙の文・応援のひとこと。申請にはなくてよい）
//    stamp … 応援のスタンプの種類（gift のときだけ）："cheer"（がんばって） ／ "star"（すごい！） ／ "heart"（ありがとう）
//    quiz  … 問題（quiz のときだけ）{ title: 題名, questions: [{ q: 問題文, choices: [選択肢…], answer: 正解の番号（0 から） }] }
//            ※ answer は、あとで「解く」を作るときに使う（今は画面に出さない）
//    read  … もう見たか（true ＝ 見た）
//
//  自分が送ったもの（SENT_SAMPLE）も同じ形。from のかわりに to（送った相手 { userId, name, color }）。read はない
// ═══════════════════════════════════════════════════════════════
import { FRIENDS_SAMPLE } from "./friends-sample.js";

const ago = (min) => new Date(Date.now() - min * 60 * 1000);   // 今から min 分前
/** フレンドの userId から、送ってきた人 { userId, name, color } を作る */
export const who = (id) => {
  const f = FRIENDS_SAMPLE.find((x) => x.userId === id);
  return { userId: f.userId, name: f.name, color: f.color };
};

/** 種類ごとの名前（一覧のしぼりこみ・見出しに使う） */
export const MAIL_TYPES = {
  letter: { name: "手紙" },
  quiz: { name: "問題" },
  request: { name: "フレンド申請" },
  gift: { name: "応援" },
};

/** 応援のスタンプ（文字。絵は mailbox.js でかく） */
export const STAMPS = {
  cheer: "がんばって！",
  star: "すごい！",
  heart: "ありがとう",
};

export const MAIL_SAMPLE = [
  { id: "m1", type: "letter", from: who("taro"), at: ago(12), read: false,
    text: "今日のプログラム学習、さいごの問題がやっと解けたよ！\nそっちはどう？ こんど いっしょにタイマーで勉強しよう。" },
  { id: "m2", type: "gift", from: who("hanako"), at: ago(130), read: false, stamp: "cheer",
    text: "もうすぐテストだね。応援してるよ！" },
  { id: "m3", type: "request", from: { userId: "sakura", name: "さくら", color: "#f97316" }, at: ago(60 * 5 + 20), read: false },
  { id: "m6", type: "quiz", from: who("taro"), at: ago(40), read: false,
    text: "作ってみたよ！ 3 問とも解けるかな？",
    quiz: { title: "Python のきほん クイズ", questions: [
      { q: "print(\"Hello\") を実行すると、画面に何が出る？", choices: ["Hello", "\"Hello\"", "print", "エラーになる"], answer: 0 },
      { q: "Python で、同じことを くり返すときに使うことばは？", choices: ["if", "for", "def", "import"], answer: 1 },
      { q: "len(\"apple\") の答えは いくつ？", choices: ["4", "5", "6", "apple"], answer: 1 },
    ] } },
  { id: "m4", type: "letter", from: who("yuki"), at: ago(60 * 26), read: true,
    text: "デジタル図鑑に、新しい生き物を登録したよ。\nよかったら見てみてね。" },
  { id: "m5", type: "gift", from: who("jiro"), at: ago(60 * 24 * 3 + 15), read: true, stamp: "star",
    text: "連続ログイン 7 日、すごいね！" },
  { id: "m8", type: "quiz", from: who("jiro"), at: ago(60 * 3 + 10), read: false,
    text: "算数の問題だよ。あんざんで できるかな？",
    quiz: { title: "計算クイズ", questions: [
      { q: "12 × 3 は いくつ？", choices: ["32", "36", "38", "42"], answer: 1 },
      { q: "100 − 37 は いくつ？", choices: ["63", "67", "73", "77"], answer: 0 },
    ] } },
  { id: "m7", type: "quiz", from: who("yuki"), at: ago(60 * 24 * 2 + 30), read: true,
    text: "図鑑を見ながら作ったよ。",
    quiz: { title: "生き物クイズ", questions: [
      { q: "カエルの子どもの名前は？", choices: ["オタマジャクシ", "ヤゴ", "ボウフラ", "イモムシ"], answer: 0 },
      { q: "こん虫の足は 何本？", choices: ["4 本", "6 本", "8 本", "10 本"], answer: 1 },
    ] } },
];

/** 自分が送ったもの（★ 仮のデータ。フレンド詳細の「送り合ったもの」に出す） */
export const SENT_SAMPLE = [
  { id: "s1", type: "letter", to: who("taro"), at: ago(25),
    text: "クイズありがとう！\n2 問目で まちがえちゃった…。次はぜんぶ正解するね。" },
  { id: "s2", type: "quiz", to: who("hanako"), at: ago(60 * 6),
    text: "Web ページの勉強で作った問題です。",
    quiz: { title: "HTML クイズ", questions: [
      { q: "いちばん大きな見出しのタグは？", choices: ["<h1>", "<h6>", "<p>", "<big>"], answer: 0 },
      { q: "ほかのページへのリンクを作るタグは？", choices: ["<link>", "<a>", "<href>", "<url>"], answer: 1 },
    ] } },
  { id: "s3", type: "gift", to: who("jiro"), at: ago(60 * 24 * 2), stamp: "heart",
    text: "いつも ありがとう！" },
];

/** 選択肢の前につける しるし（ア・イ・ウ・エ…） */
export const CHOICE_MARKS = ["ア", "イ", "ウ", "エ", "オ", "カ"];
