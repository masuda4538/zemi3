use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Manager};

fn get_projects_root(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?
        .join("projects");
    if !dir.exists() {
        fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(dir)
}

fn safe_join(base: &Path, sub: &str) -> Result<PathBuf, String> {
    if sub.contains("..") || sub.contains('/') || sub.contains('\\') {
        return Err("無効な名前が含まれています".to_string());
    }
    Ok(base.join(sub))
}

#[tauri::command]
pub fn ensure_project_dir(app: AppHandle, project_name: String) -> Result<String, String> {
    let root = get_projects_root(&app)?;
    let proj_dir = safe_join(&root, &project_name)?;
    if !proj_dir.exists() {
        fs::create_dir_all(&proj_dir).map_err(|e| e.to_string())?;
    }
    Ok(proj_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_project_file(
    app: AppHandle,
    project_name: String,
    file_name: String,
    content: String,
) -> Result<(), String> {
    let root = get_projects_root(&app)?;
    let proj_dir = safe_join(&root, &project_name)?;
    fs::create_dir_all(&proj_dir).map_err(|e| e.to_string())?;

    let file_path = safe_join(&proj_dir, &file_name)?;
    fs::write(&file_path, content).map_err(|e| format!("保存失敗: {}", e))?;
    Ok(())
}

/// 自由制作の複数ファイルを一括保存してプロジェクトパスを返す
#[tauri::command]
pub fn save_all_project_files(
    app: AppHandle,
    project_name: String,
    files: HashMap<String, String>,
) -> Result<String, String> {
    let root = get_projects_root(&app)?;
    let proj_dir = safe_join(&root, &project_name)?;
    fs::create_dir_all(&proj_dir).map_err(|e| e.to_string())?;

    for (file_name, content) in files {
        let file_path = safe_join(&proj_dir, &file_name)?;
        fs::write(&file_path, content).map_err(|e| format!("{} の保存失敗: {}", file_name, e))?;
    }
    Ok(proj_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn read_project_file(
    app: AppHandle,
    project_name: String,
    file_name: String,
) -> Result<String, String> {
    let root = get_projects_root(&app)?;
    let proj_dir = safe_join(&root, &project_name)?;
    let file_path = safe_join(&proj_dir, &file_name)?;
    fs::read_to_string(&file_path).map_err(|e| format!("読込失敗: {}", e))
}

#[tauri::command]
pub fn list_project_files(app: AppHandle, project_name: String) -> Result<Vec<String>, String> {
    let root = get_projects_root(&app)?;
    let proj_dir = safe_join(&root, &project_name)?;
    if !proj_dir.exists() {
        return Ok(vec![]);
    }

    let mut files = Vec::new();
    for entry in fs::read_dir(proj_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        if let Some(name) = entry.file_name().to_str() {
            if name.ends_with(".py") {
                files.push(name.to_string());
            }
        }
    }
    files.sort();
    Ok(files)
}
