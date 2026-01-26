//! 导入目录相关的 Tauri 命令

use crate::app_state::{AppState, ImportedDirectory};
use chrono::Utc;
use std::path::PathBuf;

use super::dto::{CreateDirectoryDto, UpdateDirectoryDto};

#[tauri::command]
pub fn get_all_directories(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<ImportedDirectory>, String> {
    let db = state.db();
    match db.list_imported_directories(&workspace_id) {
        Ok(directories) => Ok(directories),
        Err(e) => Err(format!("Failed to fetch directories: {}", e)),
    }
}

#[tauri::command]
pub fn get_directory(
    id: String,
    state: tauri::State<AppState>,
) -> Result<ImportedDirectory, String> {
    let db = state.db();
    match db.get_imported_directory(&id) {
        Ok(Some(directory)) => Ok(directory),
        Ok(None) => Err(format!("Directory not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch directory: {}", e)),
    }
}

#[tauri::command]
pub fn create_directory(
    dto: CreateDirectoryDto,
    state: tauri::State<AppState>,
) -> Result<ImportedDirectory, String> {
    let db = state.db();
    let directory = ImportedDirectory::new(
        dto.workspace_id,
        dto.name,
        PathBuf::from(dto.original_path),
        PathBuf::from(dto.stored_path),
    );

    match db.create_imported_directory(&directory) {
        Ok(_) => {
            log::info!("Directory created: {}", directory.name);
            Ok(directory)
        }
        Err(e) => Err(format!("Failed to create directory: {}", e)),
    }
}

#[tauri::command]
pub fn update_directory(
    id: String,
    dto: UpdateDirectoryDto,
    state: tauri::State<AppState>,
) -> Result<ImportedDirectory, String> {
    let db = state.db();

    match db.get_imported_directory(&id) {
        Ok(Some(mut directory)) => {
            if let Some(name) = dto.name {
                directory.name = name;
            }
            if let Some(file_count) = dto.file_count {
                directory.file_count = file_count;
            }
            if let Some(total_size_bytes) = dto.total_size_bytes {
                directory.total_size_bytes = total_size_bytes;
            }
            directory.updated_at = Utc::now().timestamp_millis();

            match db.update_imported_directory(&directory) {
                Ok(_) => Ok(directory),
                Err(e) => Err(format!("Failed to update directory: {}", e)),
            }
        }
        Ok(None) => Err(format!("Directory not found: {}", id)),
        Err(e) => Err(format!("Failed to update directory: {}", e)),
    }
}

#[tauri::command]
pub fn delete_directory(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_imported_directory(&id) {
        Ok(_) => {
            log::info!("Directory deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete directory: {}", e)),
    }
}
