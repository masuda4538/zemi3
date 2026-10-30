// ═══════════════════════════════════════════════════════════════
//  ホーム：Rust の窓口 ★ 書きかえてよい（このファイルの名前と場所だけは変えない）
//  JS（js/main.js）から呼べる関数を、ここに「登録」します。中身の処理は、このフォルダー（rust/）のほかのファイルに書きます。
//
//    js/main.js   await app.invoke("hello", { name: "太郎" })
//       ↓
//    rust/main.rs    #[tauri::command] fn hello(…)  ← 窓口（ここ）。いちばん下の crate::commands![ ] に登録
//       ↓
//    rust/logic.rs   pub fn greeting(…)         ← 中身の処理
//
//  ■ JS から呼べる関数を足す
//    1. ここに関数を書いて、上に #[tauri::command] を付ける
//    2. いちばん下の crate::commands![ ] に、関数の名前を足す
//    名前は自由です（ほかのアプリと同じ名前でも大丈夫）。
//    ・JS の { } の中の名前は、Rust の引数の名前と同じにする（Rust の user_name は、JS では userName）
//    ・Err を返すと、JS ではエラーになる → try { … } catch (err) { … } で受け取る
//
//  ■ 処理のファイルを足す（このフォルダーに calc.rs を作った例）
//    下の「mod logic;」の下に  mod calc;  を足す → calc::関数名() で使える
//    （calc.rs の中で、使わせたい関数には pub を付ける）
//
//  ■ 保存したら
//    npm run tauri dev が自動で Rust を作り直して、アプリが開き直します（少し時間がかかります）。
//    うまく作り直されないときは、Ctrl + C で止めて、もう一度 npm run tauri dev を実行します。
//    エラー「cannot find macro `__cmd__名前`」が出たら → crate::commands![ ] の名前と、関数の名前がちがう
// ═══════════════════════════════════════════════════════════════

// 処理のファイルをつなぐ（同じフォルダーの logic.rs）
mod logic;

/// 例 1：あいさつを返す
///   JS：await app.invoke("hello", { name: "太郎" })
#[tauri::command]
fn hello(name: String) -> String {
    logic::greeting(&name)
}

/// 例 2：割り算（0 で割るとエラー）
///   JS：await app.invoke("divide", { a: 10, b: 4 })   →  2.5
#[tauri::command]
fn divide(a: f64, b: f64) -> Result<f64, String> {
    logic::divide(a, b)
}

// ★ JS から呼べるようにする関数を、ここに並べる（カンマで区切る）
crate::commands![hello, divide];
