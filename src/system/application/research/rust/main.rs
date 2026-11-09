// ═══════════════════════════════════════════════════════════════
//  情報収集：Rust の窓口 ★ 書きかえてよい（このファイルの名前と場所だけは変えない）
//  JS（js/main.js）から呼べる関数を、ここに「登録」します。中身の処理は logic.rs に書きます。
//
//    js/main.js      await app.invoke("site_of", { url: "https://…" })
//       ↓
//    rust/main.rs    #[tauri::command] fn site_of(url)   ← 窓口（ここ）。いちばん下の crate::commands![ ] に登録
//       ↓
//    rust/logic.rs   pub fn site_of(url)                 ← 中身の処理
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

/// URL をチェックして、サイト名（example.com など）を返す
///   JS：await app.invoke("site_of", { url: "https://example.com/a" })   →  "example.com"
///       URL がおかしいときはエラー（JS の catch に入る）
#[tauri::command]
fn site_of(url: String) -> Result<String, String> {
    logic::site_of(&url)
}

// ★ JS から呼べるようにする関数を、ここに並べる（カンマで区切る）
crate::commands![site_of];
