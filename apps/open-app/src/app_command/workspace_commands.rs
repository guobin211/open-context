use crate::app_state::{AppState, Workspace};
use chrono::Utc;

use super::dto::{CreateWorkspaceDto, UpdateWorkspaceDto};

#[tauri::command]
pub fn get_all_workspaces(state: tauri::State<AppState>) -> Result<Vec<Workspace>, String> {
    let db = state.db();
    match db.list_workspaces() {
        Ok(workspaces) => Ok(workspaces),
        Err(e) => Err(format!("Failed to fetch workspaces: {}", e)),
    }
}

#[tauri::command]
pub fn get_workspace(id: String, state: tauri::State<AppState>) -> Result<Workspace, String> {
    let db = state.db();
    match db.get_workspace(&id) {
        Ok(Some(workspace)) => Ok(workspace),
        Ok(None) => Err(format!("Workspace not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch workspace: {}", e)),
    }
}

#[tauri::command]
pub fn create_workspace(
    dto: CreateWorkspaceDto,
    state: tauri::State<AppState>,
) -> Result<Workspace, String> {
    let db = state.db();
    let workspace = Workspace::new(dto.name, dto.description);

    match db.create_workspace(&workspace) {
        Ok(_) => {
            log::info!("Workspace created: {}", workspace.name);
            Ok(workspace)
        }
        Err(e) => Err(format!("Failed to create workspace: {}", e)),
    }
}

#[tauri::command]
pub fn update_workspace(
    id: String,
    dto: UpdateWorkspaceDto,
    state: tauri::State<AppState>,
) -> Result<Workspace, String> {
    let db = state.db();

    match db.get_workspace(&id) {
        Ok(Some(mut workspace)) => {
            if let Some(name) = dto.name {
                workspace.name = name;
            }
            if let Some(description) = dto.description {
                workspace.description = Some(description);
            }
            if let Some(is_active) = dto.is_active {
                workspace.is_active = is_active;
            }
            workspace.updated_at = Utc::now().timestamp_millis();

            match db.update_workspace(&workspace) {
                Ok(_) => Ok(workspace),
                Err(e) => Err(format!("Failed to update workspace: {}", e)),
            }
        }
        Ok(None) => Err(format!("Workspace not found: {}", id)),
        Err(e) => Err(format!("Failed to update workspace: {}", e)),
    }
}

#[tauri::command]
pub fn delete_workspace(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_workspace(&id) {
        Ok(_) => {
            log::info!("Workspace deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete workspace: {}", e)),
    }
}
