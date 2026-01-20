use crate::app_state::{AppState, GitRepository, ImportedFile, Note, NoteType, Workspace};
use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::Emitter;

// ============================================================================
// DTO Types (Data Transfer Objects)
// ============================================================================

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspaceDto {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkspaceDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteDto {
    pub workspace_id: String,
    pub title: String,
    pub note_type: String,
    pub content: Option<String>,
    pub file_path: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteDto {
    pub title: Option<String>,
    pub note_type: Option<String>,
    pub content: Option<String>,
    pub file_path: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileDto {
    pub workspace_id: String,
    pub name: String,
    pub original_path: String,
    pub stored_path: String,
    pub file_type: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFileDto {
    pub name: Option<String>,
    pub file_type: Option<String>,
    pub size_bytes: Option<i64>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRepositoryDto {
    pub workspace_id: String,
    pub name: String,
    pub url: String,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRepositoryDto {
    pub name: Option<String>,
    pub url: Option<String>,
    pub branch: Option<String>,
}

// ============================================================================
// Workspace Commands
// ============================================================================

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

// ============================================================================
// Note Commands
// ============================================================================

#[tauri::command]
pub fn get_all_notes(
    workspace_id: Option<String>,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match workspace_id {
        Some(ws_id) => match db.list_notes(&ws_id) {
            Ok(notes) => Ok(notes),
            Err(e) => Err(format!("Failed to fetch notes: {}", e)),
        },
        None => {
            // TODO: Implement get all notes from all workspaces
            Err("Getting notes from all workspaces not yet implemented".to_string())
        }
    }
}

#[tauri::command]
pub fn get_note(id: String, state: tauri::State<AppState>) -> Result<Note, String> {
    let db = state.db();

    match db.get_note(&id) {
        Ok(Some(note)) => Ok(note),
        Ok(None) => Err(format!("Note not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch note: {}", e)),
    }
}

#[tauri::command]
pub fn create_note(dto: CreateNoteDto, state: tauri::State<AppState>) -> Result<Note, String> {
    let db = state.db();

    let note_type = NoteType::parse(&dto.note_type).unwrap_or(NoteType::Markdown);
    let default_path = format!("/notes/{}.md", dto.title);
    let file_path = dto.file_path.unwrap_or(default_path).into();

    let note = Note::new(
        dto.workspace_id.clone(),
        dto.title,
        note_type,
        dto.content.unwrap_or_default(),
        file_path,
    );

    match db.create_note(&note) {
        Ok(_) => {
            // Add tags if provided
            if let Some(tags) = dto.tags {
                for tag in tags {
                    let _ = db.add_note_tag(&note.id, &tag);
                }
            }
            log::info!("Note created: {}", note.title);
            Ok(note)
        }
        Err(e) => Err(format!("Failed to create note: {}", e)),
    }
}

#[tauri::command]
pub fn update_note(
    id: String,
    dto: UpdateNoteDto,
    state: tauri::State<AppState>,
) -> Result<Note, String> {
    let db = state.db();

    match db.get_note(&id) {
        Ok(Some(mut note)) => {
            if let Some(title) = dto.title {
                note.title = title;
            }
            if let Some(note_type) = dto.note_type
                && let Some(nt) = NoteType::parse(&note_type)
            {
                note.note_type = nt;
            }
            if let Some(content) = dto.content {
                note.content = content;
            }
            if let Some(file_path) = dto.file_path {
                note.file_path = PathBuf::from(file_path);
            }
            if let Some(tags) = dto.tags {
                for existing_tag in &note.tags {
                    let _ = db.remove_note_tag(&note.id, existing_tag);
                }
                for tag in &tags {
                    let _ = db.add_note_tag(&note.id, tag);
                }
                note.tags = tags;
            }
            note.updated_at = Utc::now().timestamp_millis();

            match db.update_note(&note) {
                Ok(_) => Ok(note),
                Err(e) => Err(format!("Failed to update note: {}", e)),
            }
        }
        Ok(None) => Err(format!("Note not found: {}", id)),
        Err(e) => Err(format!("Failed to update note: {}", e)),
    }
}

#[tauri::command]
pub fn delete_note(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_note(&id) {
        Ok(_) => {
            log::info!("Note deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete note: {}", e)),
    }
}

#[tauri::command]
pub fn search_notes(
    workspace_id: String,
    query: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match db.search_notes(&workspace_id, &query) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to search notes: {}", e)),
    }
}

#[tauri::command]
pub fn get_notes_by_type(
    workspace_id: String,
    note_type: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    let nt = NoteType::parse(&note_type).ok_or_else(|| format!("Invalid note type: {}", note_type))?;

    match db.list_notes_by_type(&workspace_id, nt) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to fetch notes by type: {}", e)),
    }
}

#[tauri::command]
pub fn toggle_note_favorite(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.toggle_note_favorite(&id) {
        Ok(is_favorited) => {
            log::info!("Note {} favorite toggled to: {}", id, is_favorited);
            Ok(is_favorited)
        }
        Err(e) => Err(format!("Failed to toggle note favorite: {}", e)),
    }
}

#[tauri::command]
pub fn set_note_favorite(
    id: String,
    is_favorited: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let db = state.db();

    match db.set_note_favorite(&id, is_favorited) {
        Ok(_) => {
            log::info!("Note {} favorite set to: {}", id, is_favorited);
            Ok(())
        }
        Err(e) => Err(format!("Failed to set note favorite: {}", e)),
    }
}

#[tauri::command]
pub fn get_favorited_notes(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match db.list_favorited_notes(&workspace_id) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to fetch favorited notes: {}", e)),
    }
}

// ============================================================================
// File Commands
// ============================================================================

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
        None => {
            // TODO: Implement get all files from all workspaces
            Err("Getting files from all workspaces not yet implemented".to_string())
        }
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

// ============================================================================
// Repository Commands
// ============================================================================

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
            // TODO: Actually clone the repository
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

// ============================================================================
// System Commands
// ============================================================================

#[tauri::command]
pub fn ping(timestamp: String) -> String {
    format!("pong: {}", timestamp)
}

// ============================================================================
// Task Commands
// ============================================================================

use crate::app_task::{TaskHandle, TaskInfo, TaskManager, TaskStatus};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloneRepositoryTaskDto {
    pub workspace_id: String,
    pub url: String,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexRepositoryTaskDto {
    pub repository_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportFilesTaskDto {
    pub workspace_id: String,
    pub paths: Vec<String>,
}

#[tauri::command]
pub fn get_task(task_id: String, task_manager: tauri::State<TaskManager>) -> Result<TaskInfo, String> {
    task_manager
        .get_task(&task_id)
        .ok_or_else(|| format!("Task not found: {}", task_id))
}

#[tauri::command]
pub fn list_tasks(task_type: Option<String>, task_manager: tauri::State<TaskManager>) -> Vec<TaskInfo> {
    match task_type {
        Some(t) => task_manager.list_tasks_by_type(&t),
        None => task_manager.list_tasks(),
    }
}

#[tauri::command]
pub fn cancel_task(task_id: String, task_manager: tauri::State<TaskManager>) -> Result<bool, String> {
    if task_manager.cancel(&task_id) {
        Ok(true)
    } else {
        Err(format!("Cannot cancel task: {}", task_id))
    }
}

#[tauri::command]
pub fn cleanup_tasks(max_age_ms: Option<i64>, task_manager: tauri::State<TaskManager>) -> Result<(), String> {
    let age = max_age_ms.unwrap_or(3600000);
    task_manager.cleanup_completed(age);
    Ok(())
}

#[tauri::command]
pub async fn clone_repository_task(
    app: tauri::AppHandle,
    dto: CloneRepositoryTaskDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    let task = task_manager.create_task("clone_repository");
    let task_id = task.id.clone();
    let task_type = task.task_type.clone();

    let handle = TaskHandle {
        task_id: task_id.clone(),
        task_type: task_type.clone(),
        status: TaskStatus::Pending,
    };

    let manager = task_manager.inner().clone();
    let url = dto.url.clone();
    let branch = dto.branch.clone().unwrap_or_else(|| "main".to_string());

    tauri::async_runtime::spawn(async move {
        manager.set_running(&task_id);
        log::info!("Starting clone repository task: {} -> {}", task_id, url);

        manager.update_progress(&task_id, 10, Some("Preparing to clone...".to_string()));

        let result = async {
            manager.update_progress(&task_id, 30, Some("Cloning repository...".to_string()));
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;

            manager.update_progress(&task_id, 60, Some("Processing files...".to_string()));
            tokio::time::sleep(std::time::Duration::from_millis(100)).await;

            manager.update_progress(&task_id, 90, Some("Finalizing...".to_string()));

            Ok::<serde_json::Value, String>(serde_json::json!({
                "url": url,
                "branch": branch,
                "status": "cloned"
            }))
        }
        .await;

        match result {
            Ok(value) => {
                manager.complete(&task_id, Some(value));
                log::info!("Clone repository task completed: {}", task_id);
                let _ = app.emit("task:completed", serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type
                }));
            }
            Err(e) => {
                manager.fail(&task_id, &e);
                log::error!("Clone repository task failed: {} - {}", task_id, e);
                let _ = app.emit("task:failed", serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type,
                    "error": e
                }));
            }
        }
    });

    Ok(handle)
}

#[tauri::command]
pub async fn index_repository_task(
    app: tauri::AppHandle,
    dto: IndexRepositoryTaskDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    let task = task_manager.create_task("index_repository");
    let task_id = task.id.clone();
    let task_type = task.task_type.clone();

    let handle = TaskHandle {
        task_id: task_id.clone(),
        task_type: task_type.clone(),
        status: TaskStatus::Pending,
    };

    let manager = task_manager.inner().clone();
    let repo_id = dto.repository_id.clone();

    tauri::async_runtime::spawn(async move {
        manager.set_running(&task_id);
        log::info!("Starting index repository task: {} for repo {}", task_id, repo_id);

        manager.update_progress(&task_id, 10, Some("Scanning files...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 30, Some("Parsing AST...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 60, Some("Building index...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 80, Some("Generating embeddings...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.complete(&task_id, Some(serde_json::json!({
            "repositoryId": repo_id,
            "status": "indexed"
        })));

        log::info!("Index repository task completed: {}", task_id);
        let _ = app.emit("task:completed", serde_json::json!({
            "taskId": task_id,
            "taskType": task_type
        }));
    });

    Ok(handle)
}

#[tauri::command]
pub async fn import_files_task(
    app: tauri::AppHandle,
    dto: ImportFilesTaskDto,
    task_manager: tauri::State<'_, TaskManager>,
) -> Result<TaskHandle, String> {
    let task = task_manager.create_task("import_files");
    let task_id = task.id.clone();
    let task_type = task.task_type.clone();

    let handle = TaskHandle {
        task_id: task_id.clone(),
        task_type: task_type.clone(),
        status: TaskStatus::Pending,
    };

    let manager = task_manager.inner().clone();
    let paths = dto.paths.clone();
    let total = paths.len();

    tauri::async_runtime::spawn(async move {
        manager.set_running(&task_id);
        log::info!("Starting import files task: {} with {} files", task_id, total);

        for (i, path) in paths.iter().enumerate() {
            let progress = ((i + 1) * 100 / total) as u8;
            let msg = format!("Importing {} ({}/{})", path, i + 1, total);
            manager.update_progress(&task_id, progress, Some(msg));
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }

        manager.complete(&task_id, Some(serde_json::json!({
            "imported": total,
            "status": "completed"
        })));

        log::info!("Import files task completed: {}", task_id);
        let _ = app.emit("task:completed", serde_json::json!({
            "taskId": task_id,
            "taskType": task_type
        }));
    });

    Ok(handle)
}
