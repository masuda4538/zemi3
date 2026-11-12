// ═══════════════════════════════════════════════════════════════
//  Rust 側の入口 ★ このファイルは触らなくて大丈夫です
//
//  Rust は、各アプリのフォルダーの rust/main.rs に書きます（ほかの人とぶつからないように）
//    例）src/system/application/home/rust/main.rs
//  rust/main.rs があるアプリは、build.rs が自動で見つけて読み込みます
//  （アプリを増やしても、このファイルは書きかえなくてよい。rust/main.rs が無いアプリは Rust を使わないだけ）
//
//  画面（JS）で app.invoke("hello", { … }) と書くと、
//  そのアプリの rust/main.rs の hello が呼ばれます（下の invoke_handler がアプリごとに分けて渡す）。
//  ほかのアプリに同じ名前の関数があっても大丈夫です。
//
//  WSL で重くならないように、起動したときに WEBKIT_DISABLE_DMABUF_RENDERER=1 にしている（run の最初）
//  WSL でスクロールがもたつかないように、「なめらかスクロール」を切っている（setup。Linux だけ）
//
//  使っているプラグイン
//    opener … URL やフォルダーを開く（設定画面の「フォルダを開く」、app.openUrl）
//    store  … 設定をファイル（AppData の settings.json）に保存する（src/system/pages/settings/settings.js）
// ═══════════════════════════════════════════════════════════════
use tauri::ipc::{Invoke, InvokeBody};
use tauri::Runtime;
#[cfg(target_os = "linux")]
use tauri::Manager;

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

// 各アプリの rust/main.rs を読み込む（build.rs が作った一覧。route 関数もここに入っている）
include!(concat!(env!("OUT_DIR"), "/apps.rs"));

/// 画面から送られてきた「どのアプリから呼んだか」（app.invoke が __app という名前で付けて送る）
fn app_of<R: Runtime>(invoke: &Invoke<R>) -> Option<String> {
    match invoke.message.payload() {
        InvokeBody::Json(v) => v.get("__app")?.as_str().map(str::to_owned),
        _ => None,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Linux（WSL で開発するとき）だけ：画面の描き方を、WSL でも軽く動くものにする
    //   WebKitGTK の「DMABUF」という描き方は、WSL ではとても重くなることがあるので使わない
    //   （Windows のアプリには関係ない。自分で WEBKIT_DISABLE_DMABUF_RENDERER を決めているときは、そちらを使う）
    #[cfg(target_os = "linux")]
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        // SAFETY: 起動してすぐ（ほかのスレッドがまだ動いていないとき）に 1 回だけ設定する
        unsafe { std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1") };
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        // Linux（WSL）だけ：「なめらかスクロール」を切る（WSL では、ホイールを回してから動くまでに遅れが出て、ラグに感じるため）
        .setup(|_app| {
            #[cfg(target_os = "linux")]
            for (_, window) in _app.webview_windows() {
                let _ = window.with_webview(|webview| {
                    use webkit2gtk::{SettingsExt, WebViewExt};
                    if let Some(settings) = webview.inner().settings() {
                        settings.set_enable_smooth_scrolling(false);
                    }
                });
            }
            Ok(())
        })
        // どのアプリの rust/main.rs に渡すかを決める（どのアプリでもない →「コマンドが見つかりません」のエラー）
        .invoke_handler(|invoke| match app_of(&invoke) {
            Some(app) => route(&app, invoke),
            None => false,
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
