pub mod ai;
pub mod executor;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            executor::run_python_code,
            executor::grade_task_code,
            executor::check_python_syntax,
            ai::ask_ai_hint,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
