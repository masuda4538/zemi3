// ═══════════════════════════════════════════════════════════════
//  プログラム学習：Rust の窓口 ★ 書きかえてよい（このファイルの名前と場所だけは変えない）
//  JS（js/main.js）から呼べる関数を、ここに「登録」します。中身の処理は logic.rs に書きます。
//
//    js/main.js      await app.invoke("fizzbuzz", { n: 15 })
//       ↓
//    rust/main.rs    #[tauri::command] fn fizzbuzz(n)   ← 窓口（ここ）。いちばん下の crate::commands![ ] に登録
//       ↓
//    rust/logic.rs   pub fn fizzbuzz(n)                 ← 中身の処理
//
//  ■ JS から呼べる関数を足す
//    1. ここに関数を書いて、上に #[tauri::command] を付ける
//    2. いちばん下の crate::commands![ ] に、関数の名前を足す
//    ・JS の { } の中の名前は、Rust の引数の名前と同じにする（Rust の user_name は、JS では userName）
//    ・Err を返すと、JS ではエラーになる → try { … } catch (err) { … } で受け取る
//
//  ■ 処理のファイルを足す（このフォルダーに calc.rs を作った例）
//    下の「mod logic;」の下に  mod calc;  を足す → calc::関数名() で使える（calc.rs の関数には pub を付ける）
//
//  ■ 保存したら
//    npm run tauri dev が自動で Rust を作り直して、アプリが開き直します（少し時間がかかります）。
//    エラー「cannot find macro `__cmd__名前`」が出たら → crate::commands![ ] の名前と、関数の名前がちがう
// ═══════════════════════════════════════════════════════════════

// 処理のファイルをつなぐ（同じフォルダーの logic.rs）
mod logic;

/// FizzBuzz を 1 から n まで作って返す（n は 1〜100）
///   JS：await app.invoke("fizzbuzz", { n: 15 })   →  ["1", "2", "Fizz", "4", "Buzz", …]
#[tauri::command]
fn fizzbuzz(n: u32) -> Result<Vec<String>, String> {
    if !(1..=100).contains(&n) {
        return Err("1 から 100 までの数を入れてください".into());
    }
    Ok(logic::fizzbuzz(n))
}

// ★ JS から呼べるようにする関数を、ここに並べる（カンマで区切る）
crate::commands![fizzbuzz];
