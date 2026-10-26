// ═══════════════════════════════════════════════════════════════
//  Rust 側の入口
//    db.rs       … データベース（MariaDB）への接続
//    account.rs  … ログイン・新規登録・アカウント変更の処理
//    commands.rs … 画面から呼ぶコマンドの一覧
//  コマンドを増やしたら、下の generate_handler! にも名前を足します。
// ═══════════════════════════════════════════════════════════════
mod account;
mod commands;
mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(db::Db::default())
        .manage(commands::Session::default())
        .invoke_handler(tauri::generate_handler![
            commands::db_status,
            commands::list_genders,
            commands::list_languages,
            commands::add_language,
            commands::register,
            commands::login,
            commands::dev_login,
            commands::logout,
            commands::get_me,
            commands::update_me,
            commands::change_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
