// ═══════════════════════════════════════════════════════════════
//  プログラム学習：Rust の窓口 ★ 書きかえてよい（このファイルの名前と場所だけは変えない）
//  このアプリの画面（JS）から呼べる関数を、ここに「登録」します。
//  中身の処理は、このフォルダー（rust/）に 好きな名前の .rs を作って書きます（このファイルから mod でつなぐ）。
//  rust/main.rs があるアプリは、本体の src-tauri/build.rs が 自動で見つけて アプリに組み込みます。
//
//    JS            await app.invoke("ping")
//       ↓
//    rust/main.rs  #[tauri::command] fn ping(…)   ← 窓口（ここ）。いちばん下の crate::commands![ ] に登録
//       ↓
//    rust/〇〇.rs   pub fn 〇〇(…)                  ← 中身の処理（下の「ファイルをつなぐ」に mod 〇〇; を書く）
//
//  ■ JS から呼べる関数を足す
//    1. ここに関数を書いて、上に #[tauri::command] を付ける
//    2. いちばん下の crate::commands![ ] に、関数の名前を足す（カンマで区切る）
//    ・名前は自由（ほかのアプリと同じ名前でも大丈夫。どのアプリから呼んだかで 分けている）
//    ・JS の { } の中の名前は、Rust の引数の名前を キャメルケースにしたもの（Rust の user_name → JS では userName）
//    ・Err を返すと、JS ではエラーになる → try { … } catch (err) { … } で受け取る
//    ・引数に AppHandle（アプリ全体）や Window を受け取るときは、<R: tauri::Runtime> を付けて AppHandle<R> と書く
//        #[tauri::command]
//        fn save<R: tauri::Runtime>(app: tauri::AppHandle<R>, text: String) -> Result<(), String> { … }
//      （<R> を書かないと「the trait bound `AppHandle: CommandArg<'_, R>` is not satisfied」のエラーになる）
//
//  ■ 処理のファイルを足す（このフォルダーに calc.rs を作った例）
//    下の「ファイルをつなぐ」に  mod calc;  を足す → calc::関数名() で使える（calc.rs の中で 使わせたい関数には pub を付ける）
//    calc.rs の中に #[tauri::command] の関数を書いて そのまま登録するときは、 use calc::*;  も足して、
//    crate::commands![ ] には 名前だけを書く（calc::関数名 のようには書けない）
//    フォルダーで分けたいときは、rust/calc/mod.rs を作って  mod calc;
//
//  ■ やってはいけないこと（アプリ全体が 起動しなくなる・ほかの人と ぶつかる）
//    ・このアプリの中に src-tauri・tauri.conf.json・Cargo.toml を作らない。tauri::Builder や fn run() を書かない（本体に 1 つだけ）
//    ・画面から window.__TAURI__ で呼ばない（app.invoke を使う。app は 自動で用意されている）
//    ・ライブラリ（クレート）を使うときは、本体の src-tauri/Cargo.toml に足す（足すときは みんなに声をかける）
//    ・Rust に エラーがあると、全員の npm run tauri dev が 起動しなくなる
//      → 自分の PC で 起動できるのを 確かめてから push する
//
//  ■ 保存したら
//    npm run tauri dev が自動で Rust を作り直して、アプリが開き直します（少し時間がかかります）。
//    うまく作り直されないときは、Ctrl + C で止めて、もう一度 npm run tauri dev を実行します。
//    エラー「cannot find macro `__cmd__名前`」が出たら → crate::commands![ ] の名前と、関数の名前がちがう
//  書き方の見本は ホームの rust/（main.rs と logic.rs）
//
//  ■ ★ プログラム学習：今ある Rust（../src-tauri/src の ai.rs・executor.rs・workspace.rs）を 使えるようにする手順
//    今の src-tauri は「別のアプリ」の作りなので、本体の npm run tauri dev では 作られない（動かない）。
//    1. ai.rs・executor.rs・workspace.rs を、このフォルダー（rust/）に移す
//    2. 下の「ファイルをつなぐ」に、次の 6 行を足す
//         mod ai;  mod executor;  mod workspace;
//         use ai::*;  use executor::*;  use workspace::*;
//    3. いちばん下の crate::commands![ ] に、9 つの関数の名前を足す
//         run_python_code, grade_task_code, check_python_syntax, ensure_project_dir, save_project_file,
//         save_all_project_files, read_project_file, list_project_files, ask_ai_hint
//    4. workspace.rs の AppHandle を使っている 6 つの関数に <R: Runtime> を付ける（上の「引数に AppHandle…」）
//         use tauri::{AppHandle, Manager, Runtime};
//         fn get_projects_root<R: Runtime>(app: &AppHandle<R>) …
//         pub fn ensure_project_dir<R: Runtime>(app: AppHandle<R>, project_name: String) …（ほかの 4 つも同じ）
//    5. 本体の src-tauri/Cargo.toml の [dependencies] に、次を足す（みんなに声をかけてから）
//         tokio = { version = "1", features = ["process", "time", "io-util"] }
//         regex = "1"
//         reqwest = { version = "0.12", default-features = false, features = ["json"] }
//    6. script.js の getTauriInvoke() を、window.__TAURI__ ではなく app.invoke を使う形にする
//    7. 動いたら、../src-tauri フォルダーと package.json の @tauri-apps/cli は いらなくなる
//    ※ 保存したプロジェクトの場所が、本体の アプリのデータ用フォルダー（com.nkc-user.tauri-app）の projects に変わる
// ═══════════════════════════════════════════════════════════════

// ファイルをつなぐ（このフォルダーに .rs を作ったら、ここに  mod ファイル名;  を足す）

/// 動くかどうか 確かめる用（いらなくなったら 消してよい。消したら 下の commands! からも 消す）
///   JS：await app.invoke("ping")   →  "プログラム学習の Rust が動いています"
#[tauri::command]
fn ping() -> String {
    "プログラム学習の Rust が動いています".into()
}

// ★ JS から呼べるようにする関数を、ここに並べる（カンマで区切る）
crate::commands![ping];
