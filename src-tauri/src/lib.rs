// ═══════════════════════════════════════════════════════════════
//  Rust 側の入口
//  今はデータベースを使っていないので、画面から呼ぶコマンドはありません。
//  コマンドを作ったら、下の generate_handler! に名前を足します。
//    例）
//      #[tauri::command]
//      fn hello(name: String) -> String { format!("こんにちは、{name} さん") }
//      …
//      .invoke_handler(tauri::generate_handler![hello])
//  画面側では invoke("hello", { name: "太郎" }) で呼べます。
//
//  使っているプラグイン
//    opener … URL やフォルダーを開く（設定画面の「フォルダを開く」）
//    store  … 設定をファイル（AppData の settings.json）に保存する（application/settings/settings.js）
// ═══════════════════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
