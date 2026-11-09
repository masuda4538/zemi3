// ═══════════════════════════════════════════════════════════════
//  Rust 側の入口 ★ このファイルは触らなくて大丈夫です
//
//  Rust は、各アプリのフォルダーの rust/main.rs に書きます（ほかの人とぶつからないように）
//    src/system/application/home/rust/main.rs
//    src/system/application/programming/rust/main.rs
//    src/system/application/research/rust/main.rs
//    src/system/application/zukan/rust/main.rs
//    src/system/application/quiz/rust/main.rs
//  画面（js/main.js）で app.invoke("hello", { … }) と書くと、
//  そのアプリの rust/main.rs の hello が呼ばれます（下の invoke_handler がアプリごとに分けて渡す）。
//  ほかのアプリに同じ名前の関数があっても大丈夫です。
//
//  ★ アプリ（フォルダー）を増やしたとき だけ、ここの 2 か所に 1 行ずつ足します
//    ① 下の「mod」の並び   ② invoke_handler の match の並び
//
//  使っているプラグイン
//    opener … URL やフォルダーを開く（設定画面の「フォルダを開く」）
//    store  … 設定をファイル（AppData の settings.json）に保存する（application/settings/settings.js）
// ═══════════════════════════════════════════════════════════════
use tauri::ipc::{Invoke, InvokeBody};
use tauri::Runtime;

/// 各アプリの rust/main.rs のいちばん下に書く：crate::commands![hello, add];
/// 並べた関数を、画面から呼べるようにする（中で Tauri の generate_handler! を使っている）
#[macro_export]
macro_rules! commands {
    ($($name:ident),* $(,)?) => {
        pub fn handle<R: tauri::Runtime>(invoke: tauri::ipc::Invoke<R>) -> bool {
            $crate::typed::<R, _>(tauri::generate_handler![$($name),*])(invoke)
        }
    };
}

/// commands! の中で使う（関数の形を Rust に教えるため）
#[doc(hidden)]
pub fn typed<R: Runtime, F: Fn(Invoke<R>) -> bool>(f: F) -> F {
    f
}

// ① 各アプリの rust/main.rs を読み込む（場所はこのファイルから見た位置）
#[path = "../../src/system/application/home/rust/main.rs"]
mod home;
#[path = "../../src/system/application/programming/rust/main.rs"]
mod programming;
#[path = "../../src/system/application/research/rust/main.rs"]
mod research;
#[path = "../../src/system/application/zukan/rust/main.rs"]
mod zukan;
#[path = "../../src/system/application/quiz/rust/main.rs"]
mod quiz;

/// 画面から送られてきた「どのアプリから呼んだか」（app.invoke が __app という名前で付けて送る）
fn app_of<R: Runtime>(invoke: &Invoke<R>) -> Option<String> {
    match invoke.message.payload() {
        InvokeBody::Json(v) => v.get("__app")?.as_str().map(str::to_owned),
        _ => None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        // ② どのアプリの rust/main.rs に渡すかを決める
        .invoke_handler(|invoke| match app_of(&invoke).as_deref() {
            Some("home") => home::handle(invoke),
            Some("programming") => programming::handle(invoke),
            Some("research") => research::handle(invoke),
            Some("zukan") => zukan::handle(invoke),
            Some("quiz") => quiz::handle(invoke),
            _ => false, // どのアプリでもない →「コマンドが見つかりません」のエラーになる
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
