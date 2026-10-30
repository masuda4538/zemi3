// ═══════════════════════════════════════════════════════════════
//  プログラム学習：Rust の処理 ★ 自由に書きかえてよい
//  main.rs（窓口）から呼ばれる関数を書きます。JS から直接は呼べません（main.rs を通す）。
//  ・main.rs から使わせたい関数には pub を付ける
//  ・main.rs の  mod logic;  でつながっている → main.rs から logic::関数名() で呼ぶ
//  ・ファイルを増やしたら（このフォルダーに 〇〇.rs を作る）、main.rs に  mod 〇〇;  を足す
// ═══════════════════════════════════════════════════════════════

/// 1 から n まで数えて、3 の倍数は Fizz、5 の倍数は Buzz、両方の倍数は FizzBuzz にする
pub fn fizzbuzz(n: u32) -> Vec<String> {
    let mut list = Vec::new();          // 結果を入れる入れ物（JS の配列のようなもの）
    for i in 1..=n {                    // for 文：1 から n までくり返す
        let word = if i % 15 == 0 {     // if 文：15 で割り切れたら
            "FizzBuzz".to_string()
        } else if i % 3 == 0 {
            "Fizz".to_string()
        } else if i % 5 == 0 {
            "Buzz".to_string()
        } else {
            i.to_string()               // 数をそのまま文字にする
        };
        list.push(word);
    }
    list
}
