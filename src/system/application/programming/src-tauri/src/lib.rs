mod ai;
mod executor;
mod workspace;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            executor::run_python_code,
            executor::grade_task_code,
            executor::check_python_syntax, // ★ 追加
            workspace::ensure_project_dir,
            workspace::save_project_file,
            workspace::save_all_project_files,
            workspace::read_project_file,
            workspace::list_project_files,
            ai::ask_ai_hint,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
