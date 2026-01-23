use crate::app_state::{AppState, GitRepository};
use std::path::PathBuf;

use super::dto::{CreateRepositoryDto, UpdateRepositoryDto};

#[tauri::command]
pub fn get_all_repositories(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<GitRepository>, String> {
    let db = state.db();

    match db.list_git_repositories(&workspace_id) {
        Ok(repos) => Ok(repos),
        Err(e) => Err(format!("Failed to fetch repositories: {}", e)),
    }
}

#[tauri::command]
pub fn get_repository(id: String, state: tauri::State<AppState>) -> Result<GitRepository, String> {
    let db = state.db();

    match db.get_git_repository(&id) {
        Ok(Some(repo)) => Ok(repo),
        Ok(None) => Err(format!("Repository not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch repository: {}", e)),
    }
}

#[tauri::command]
pub fn create_repository(
    dto: CreateRepositoryDto,
    state: tauri::State<AppState>,
) -> Result<GitRepository, String> {
    let db = state.db();

    let repo = GitRepository::new(
        dto.workspace_id.clone(),
        dto.name.clone(),
        dto.url.clone(),
        PathBuf::new(),
        dto.branch.unwrap_or_else(|| "main".to_string()),
    );

    match db.create_git_repository(&repo) {
        Ok(_) => {
            log::info!("Repository created: {}", repo.name);
            Ok(repo)
        }
        Err(e) => Err(format!("Failed to create repository: {}", e)),
    }
}

#[tauri::command]
pub fn update_repository(
    id: String,
    dto: UpdateRepositoryDto,
    state: tauri::State<AppState>,
) -> Result<GitRepository, String> {
    let db = state.db();

    match db.get_git_repository(&id) {
        Ok(Some(mut repo)) => {
            if let Some(name) = dto.name {
                repo.name = name;
            }
            if let Some(url) = dto.url {
                repo.remote_url = url;
            }
            if let Some(branch) = dto.branch {
                repo.branch = branch;
            }

            match db.update_git_repository(&repo) {
                Ok(_) => Ok(repo),
                Err(e) => Err(format!("Failed to update repository: {}", e)),
            }
        }
        Ok(None) => Err(format!("Repository not found: {}", id)),
        Err(e) => Err(format!("Failed to update repository: {}", e)),
    }
}

#[tauri::command]
pub fn delete_repository(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_git_repository(&id) {
        Ok(_) => {
            log::info!("Repository deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete repository: {}", e)),
    }
}
