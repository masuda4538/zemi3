// ═══════════════════════════════════════════════════════════════
//  問題作成：Rust の処理 ★ 自由に書きかえてよい
//  main.rs（窓口）から呼ばれる関数を書きます。JS から直接は呼べません（main.rs を通す）。
//  ・main.rs から使わせたい関数・struct には pub を付ける
//  ・main.rs の  mod logic;  でつながっている → main.rs から logic::関数名() で呼ぶ
//  ・ファイルを増やしたら（このフォルダーに 〇〇.rs を作る）、main.rs に  mod 〇〇;  を足す
// ═══════════════════════════════════════════════════════════════
use serde::Serialize;

/// ひょうか（JS には { percent, rank, message } のオブジェクトで届く）
/// #[derive(Serialize)] を付けると、JS に送れる形にしてくれる
#[derive(Serialize)]
pub struct Grade {
    pub percent: u32,      // 正解した割合（0〜100）
    pub rank: String,      // S・A・B・C
    pub message: String,   // ひとこと
}

/// 点数からひょうかを決める
pub fn grade(score: u32, total: u32) -> Grade {
    let percent = (score * 100 + total / 2) / total;   // 四捨五入して % にする
    let (rank, message) = match percent {
        100 => ("S", "パーフェクト！全問正解です！"),
        80..=99 => ("A", "すばらしい！あと少しで満点です。"),
        50..=79 => ("B", "よくできました！まちがえた問題をもう一度見てみよう。"),
        _ => ("C", "これから！かいせつを読んで、もう一度ちょうせんしよう。"),
    };
    Grade { percent, rank: rank.into(), message: message.into() }
}
