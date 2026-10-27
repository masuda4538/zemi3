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
// ═══════════════════════════════════════════════════════════════

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
