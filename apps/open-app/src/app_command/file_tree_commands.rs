use crate::app_service::{
    FileTreeNode, clear_dir_cache, create_file, delete_path, read_dir_on_demand, rename_path,
    search_files, stop_watching, watch_directory,
};
use tauri::AppHandle;

#[tauri::command]
pub async fn read_dir(dir_path: String) -> Result<Vec<FileTreeNode>, String> {
    read_dir_on_demand(dir_path).await
}

#[tauri::command]
pub fn clear_cache(dir_path: Option<String>) {
    clear_dir_cache(dir_path);
}

#[tauri::command]
pub fn watch_dir(app_handle: AppHandle, dir_path: String) -> Result<(), String> {
    watch_directory(app_handle, dir_path)
}

#[tauri::command]
pub fn stop_watch_dir(dir_path: String) {
    stop_watching(&dir_path);
}

#[tauri::command]
pub async fn create_file_or_dir(path: String, is_directory: bool) -> Result<(), String> {
    create_file(path, is_directory).await
}

#[tauri::command]
pub async fn rename_file_or_dir(old_path: String, new_path: String) -> Result<(), String> {
    rename_path(old_path, new_path).await
}

#[tauri::command]
pub async fn delete_file_or_dir(path: String) -> Result<(), String> {
    delete_path(path).await
}

#[tauri::command]
pub async fn search_workspace_files(
    root_path: String,
    pattern: String,
    case_sensitive: bool,
) -> Result<Vec<String>, String> {
    search_files(root_path, pattern, case_sensitive).await
}
