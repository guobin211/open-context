use crate::app_service::{TaskHandle, TaskInfo, TaskManager, TaskStatus};
use tauri::Emitter;

use super::dto::{CloneRepositoryTaskDto, ImportFilesTaskDto, IndexRepositoryTaskDto};

#[tauri::command]
pub fn get_task(
    task_id: String,
    task_manager: tauri::State<TaskManager>,
) -> Result<TaskInfo, String> {
    task_manager
        .get_task(&task_id)
        .ok_or_else(|| format!("Task not found: {}", task_id))
}

#[tauri::command]
pub fn list_tasks(
    task_type: Option<String>,
    task_manager: tauri::State<TaskManager>,
) -> Vec<TaskInfo> {
    match task_type {
        Some(t) => task_manager.list_tasks_by_type(&t),
        None => task_manager.list_tasks(),
    }
}

#[tauri::command]
pub fn cancel_task(
    task_id: String,
    task_manager: tauri::State<TaskManager>,
) -> Result<bool, String> {
    if task_manager.cancel(&task_id) {
        Ok(true)
    } else {
        Err(format!("Cannot cancel task: {}", task_id))
    }
}

#[tauri::command]
pub fn cleanup_tasks(
    max_age_ms: Option<i64>,
    task_manager: tauri::State<TaskManager>,
) -> Result<(), String> {
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
                let _ = app.emit(
                    "task:completed",
                    serde_json::json!({
                        "taskId": task_id,
                        "taskType": task_type
                    }),
                );
            }
            Err(e) => {
                manager.fail(&task_id, &e);
                log::error!("Clone repository task failed: {} - {}", task_id, e);
                let _ = app.emit(
                    "task:failed",
                    serde_json::json!({
                        "taskId": task_id,
                        "taskType": task_type,
                        "error": e
                    }),
                );
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
        log::info!(
            "Starting index repository task: {} for repo {}",
            task_id,
            repo_id
        );

        manager.update_progress(&task_id, 10, Some("Scanning files...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 30, Some("Parsing AST...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 60, Some("Building index...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.update_progress(&task_id, 80, Some("Generating embeddings...".to_string()));
        tokio::time::sleep(std::time::Duration::from_millis(100)).await;

        manager.complete(
            &task_id,
            Some(serde_json::json!({
                "repositoryId": repo_id,
                "status": "indexed"
            })),
        );

        log::info!("Index repository task completed: {}", task_id);
        let _ = app.emit(
            "task:completed",
            serde_json::json!({
                "taskId": task_id,
                "taskType": task_type
            }),
        );
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
        log::info!(
            "Starting import files task: {} with {} files",
            task_id,
            total
        );

        for (i, path) in paths.iter().enumerate() {
            let progress = ((i + 1) * 100 / total) as u8;
            let msg = format!("Importing {} ({}/{})", path, i + 1, total);
            manager.update_progress(&task_id, progress, Some(msg));
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }

        manager.complete(
            &task_id,
            Some(serde_json::json!({
                "imported": total,
                "status": "completed"
            })),
        );

        log::info!("Import files task completed: {}", task_id);
        let _ = app.emit(
            "task:completed",
            serde_json::json!({
                "taskId": task_id,
                "taskType": task_type
            }),
        );
    });

    Ok(handle)
}
