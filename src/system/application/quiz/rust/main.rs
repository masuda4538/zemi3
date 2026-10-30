// ═══════════════════════════════════════════════════════════════
//  問題作成：Rust の窓口 ★ 書きかえてよい（このファイルの名前と場所だけは変えない）
//  JS（js/main.js）から呼べる関数を、ここに「登録」します。中身の処理は logic.rs に書きます。
//
//    js/main.js      await app.invoke("grade", { score: 2, total: 3 })
//       ↓
//    rust/main.rs    #[tauri::command] fn grade(score, total)   ← 窓口（ここ）。いちばん下の crate::commands![ ] に登録
//       ↓
//    rust/logic.rs   pub fn grade(score, total)                 ← 中身の処理
//
//  ■ JS から呼べる関数を足す
//    1. ここに関数を書いて、上に #[tauri::command] を付ける
//    2. いちばん下の crate::commands![ ] に、関数の名前を足す
//    ・JS の { } の中の名前は、Rust の引数の名前と同じにする（Rust の user_name は、JS では userName）
//    ・Err を返すと、JS ではエラーになる → try { … } catch (err) { … } で受け取る
//    ・struct（いくつかの値のまとまり）を返すと、JS では { percent: 67, … } のオブジェクトになる
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

/// 点数からひょうかを返す
///   JS：await app.invoke("grade", { score: 2, total: 3 })
///       →  { percent: 67, rank: "B", message: "よくできました！…" }
#[tauri::command]
fn grade(score: u32, total: u32) -> Result<logic::Grade, String> {
    if total == 0 || score > total {
        return Err("点数か問題の数がおかしいです".into());
    }
    Ok(logic::grade(score, total))
}

// ★ JS から呼べるようにする関数を、ここに並べる（カンマで区切る）
crate::commands![grade];
