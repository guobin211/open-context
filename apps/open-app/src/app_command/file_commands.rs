use crate::app_state::{AppState, ImportedFile};
use chrono::Utc;
use std::path::PathBuf;

use super::dto::{CreateFileDto, UpdateFileDto};

#[tauri::command]
pub fn get_all_files(
    workspace_id: Option<String>,
    state: tauri::State<AppState>,
) -> Result<Vec<ImportedFile>, String> {
    let db = state.db();

    match workspace_id {
        Some(ws_id) => match db.list_imported_files(&ws_id) {
            Ok(files) => Ok(files),
            Err(e) => Err(format!("Failed to fetch files: {}", e)),
        },
        None => Err("Getting files from all workspaces not yet implemented".to_string()),
    }
}

#[tauri::command]
pub fn get_file(id: String, state: tauri::State<AppState>) -> Result<ImportedFile, String> {
    let db = state.db();

    match db.get_imported_file(&id) {
        Ok(Some(file)) => Ok(file),
        Ok(None) => Err(format!("File not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch file: {}", e)),
    }
}

#[tauri::command]
pub fn create_file(
    dto: CreateFileDto,
    state: tauri::State<AppState>,
) -> Result<ImportedFile, String> {
    let db = state.db();
    let now = Utc::now().timestamp_millis();

    let file = ImportedFile {
        id: uuid::Uuid::new_v4().to_string(),
        workspace_id: dto.workspace_id.clone(),
        parent_directory_id: None,
        name: dto.name.clone(),
        original_path: PathBuf::from(dto.original_path.clone()),
        stored_path: PathBuf::from(dto.stored_path.clone()),
        file_type: dto.file_type.clone(),
        size_bytes: dto.size_bytes,
        mime_type: dto.mime_type.clone(),
        checksum: None,
        is_archived: false,
        created_at: now,
        updated_at: now,
    };

    match db.create_imported_file(&file) {
        Ok(_) => {
            log::info!("File created: {}", file.name);
            Ok(file)
        }
        Err(e) => Err(format!("Failed to create file: {}", e)),
    }
}

#[tauri::command]
pub fn update_file(
    id: String,
    dto: UpdateFileDto,
    state: tauri::State<AppState>,
) -> Result<ImportedFile, String> {
    let db = state.db();

    match db.get_imported_file(&id) {
        Ok(Some(mut file)) => {
            if let Some(name) = dto.name {
                file.name = name;
            }
            if let Some(file_type) = dto.file_type {
                file.file_type = file_type;
            }
            if let Some(size_bytes) = dto.size_bytes {
                file.size_bytes = size_bytes;
            }
            if let Some(mime_type) = dto.mime_type {
                file.mime_type = Some(mime_type);
            }
            file.updated_at = Utc::now().timestamp_millis();

            match db.update_imported_file(&file) {
                Ok(_) => Ok(file),
                Err(e) => Err(format!("Failed to update file: {}", e)),
            }
        }
        Ok(None) => Err(format!("File not found: {}", id)),
        Err(e) => Err(format!("Failed to update file: {}", e)),
    }
}

#[tauri::command]
pub fn delete_file(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_imported_file(&id) {
        Ok(_) => {
            log::info!("File deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete file: {}", e)),
    }
}
