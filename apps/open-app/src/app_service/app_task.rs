use chrono::Utc;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::Emitter;

use crate::app_state::TaskStateManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskId(pub String);

impl TaskId {
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl Default for TaskId {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskInfo {
    pub id: String,
    pub task_type: String,
    pub status: TaskStatus,
    pub progress: u8,
    pub message: Option<String>,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub completed_at: Option<i64>,
    // 重试相关字段
    pub retry_count: u8,
    pub max_retries: u8,
    pub retry_delay_ms: u64,
    // 任务输入参数（用于重试时重新执行）
    pub input: Option<serde_json::Value>,
    // 是否持久化
    pub persistent: bool,
}

impl TaskInfo {
    pub fn new(task_type: impl Into<String>) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: TaskId::new().0,
            task_type: task_type.into(),
            status: TaskStatus::Pending,
            progress: 0,
            message: None,
            result: None,
            error: None,
            created_at: now,
            updated_at: now,
            completed_at: None,
            retry_count: 0,
            max_retries: 3,
            retry_delay_ms: 1000,
            input: None,
            persistent: false,
        }
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.id = id.into();
        self
    }

    pub fn with_input(mut self, input: serde_json::Value) -> Self {
        self.input = Some(input);
        self
    }

    pub fn with_max_retries(mut self, max_retries: u8) -> Self {
        self.max_retries = max_retries;
        self
    }

    pub fn with_retry_delay(mut self, delay_ms: u64) -> Self {
        self.retry_delay_ms = delay_ms;
        self
    }

    pub fn with_persistent(mut self, persistent: bool) -> Self {
        self.persistent = persistent;
        self
    }

    /// 是否可以重试
    pub fn can_retry(&self) -> bool {
        self.status == TaskStatus::Failed && self.retry_count < self.max_retries
    }

    /// 增加重试计数
    pub fn increment_retry(&mut self) {
        self.retry_count += 1;
        self.status = TaskStatus::Pending;
        self.error = None;
        self.progress = 0;
        self.updated_at = Utc::now().timestamp_millis();
        self.completed_at = None;
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskHandle {
    pub task_id: String,
    pub task_type: String,
    pub status: TaskStatus,
}

#[derive(Clone)]
pub struct TaskManager {
    tasks: Arc<Mutex<HashMap<String, TaskInfo>>>,
    persistence: Option<Arc<TaskStateManager>>,
}

impl TaskManager {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            persistence: None,
        }
    }

    /// 创建带持久化支持的 TaskManager
    pub fn with_persistence(conn: Arc<Mutex<Connection>>) -> Self {
        let persistence = TaskStateManager::new(conn);
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            persistence: Some(Arc::new(persistence)),
        }
    }

    /// 初始化：加载持久化的未完成任务到内存
    pub fn load_persistent_tasks(&self) -> Result<Vec<TaskInfo>, String> {
        if let Some(ref persistence) = self.persistence {
            // 将运行中的任务标记为待执行（应用崩溃恢复）
            let _ = persistence.mark_running_as_pending();

            // 加载未完成任务
            let tasks = persistence
                .load_pending_persistent_tasks()
                .map_err(|e| e.to_string())?;

            // 加载到内存
            let mut mem_tasks = self.tasks.lock().unwrap();
            for task in &tasks {
                mem_tasks.insert(task.id.clone(), task.clone());
            }

            Ok(tasks)
        } else {
            Ok(vec![])
        }
    }

    /// 加载可重试的失败任务
    pub fn load_retryable_tasks(&self) -> Result<Vec<TaskInfo>, String> {
        if let Some(ref persistence) = self.persistence {
            persistence
                .load_retryable_tasks()
                .map_err(|e| e.to_string())
        } else {
            Ok(vec![])
        }
    }

    pub fn create_task(&self, task_type: impl Into<String>) -> TaskInfo {
        let task = TaskInfo::new(task_type);
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task.clone());
        task
    }

    /// 创建持久化任务
    pub fn create_persistent_task(&self, task_type: impl Into<String>) -> TaskInfo {
        let task = TaskInfo::new(task_type).with_persistent(true);
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task.clone());

        // 持久化到数据库
        if let Some(ref persistence) = self.persistence {
            let _ = persistence.save_task(&task);
        }

        task
    }

    /// 创建带输入参数的持久化任务（支持重试）
    pub fn create_persistent_task_with_input(
        &self,
        task_type: impl Into<String>,
        input: serde_json::Value,
        max_retries: u8,
    ) -> TaskInfo {
        let task = TaskInfo::new(task_type)
            .with_persistent(true)
            .with_input(input)
            .with_max_retries(max_retries);

        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task.clone());

        // 持久化到数据库
        if let Some(ref persistence) = self.persistence {
            let _ = persistence.save_task(&task);
        }

        task
    }

    /// 添加已存在的任务到内存（用于加载持久化任务）
    pub fn add_task(&self, task: TaskInfo) {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task);
    }

    pub fn get_task(&self, task_id: &str) -> Option<TaskInfo> {
        let tasks = self.tasks.lock().unwrap();
        tasks.get(task_id).cloned()
    }

    pub fn list_tasks(&self) -> Vec<TaskInfo> {
        let tasks = self.tasks.lock().unwrap();
        tasks.values().cloned().collect()
    }

    pub fn list_tasks_by_type(&self, task_type: &str) -> Vec<TaskInfo> {
        let tasks = self.tasks.lock().unwrap();
        tasks
            .values()
            .filter(|t| t.task_type == task_type)
            .cloned()
            .collect()
    }

    pub fn update_status(&self, task_id: &str, status: TaskStatus) {
        let task_persistent = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                task.status = status.clone();
                task.updated_at = Utc::now().timestamp_millis();
                if status == TaskStatus::Completed || status == TaskStatus::Failed {
                    task.completed_at = Some(Utc::now().timestamp_millis());
                }
                Some((
                    task.persistent,
                    task.progress,
                    task.message.clone(),
                    task.updated_at,
                    task.completed_at,
                ))
            } else {
                None
            }
        };

        // 同步到数据库
        if let Some((persistent, progress, message, updated_at, completed_at)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_status(
                task_id,
                &status,
                progress,
                message.as_deref(),
                updated_at,
                completed_at,
            );
        }
    }

    pub fn update_progress(&self, task_id: &str, progress: u8, message: Option<String>) {
        let task_persistent = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                task.progress = progress.min(100);
                task.message = message.clone();
                task.updated_at = Utc::now().timestamp_millis();
                Some((
                    task.persistent,
                    task.status.clone(),
                    task.updated_at,
                    task.completed_at,
                ))
            } else {
                None
            }
        };

        // 同步到数据库
        if let Some((persistent, status, updated_at, completed_at)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_status(
                task_id,
                &status,
                progress.min(100),
                message.as_deref(),
                updated_at,
                completed_at,
            );
        }
    }

    pub fn set_running(&self, task_id: &str) {
        self.update_status(task_id, TaskStatus::Running);
    }

    pub fn complete(&self, task_id: &str, result: Option<serde_json::Value>) {
        let task_persistent = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Completed;
                task.progress = 100;
                task.result = result.clone();
                task.updated_at = now;
                task.completed_at = Some(now);
                Some((task.persistent, now))
            } else {
                None
            }
        };

        // 同步到数据库
        if let Some((persistent, now)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_result(task_id, result.as_ref(), now, now);
        }
    }

    /// 完成任务并发送 Tauri 事件通知
    pub fn complete_with_emit<R: tauri::Runtime>(
        &self,
        task_id: &str,
        result: Option<serde_json::Value>,
        app: &tauri::AppHandle<R>,
    ) {
        let (task_type, task_persistent) = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Completed;
                task.progress = 100;
                task.result = result.clone();
                task.updated_at = now;
                task.completed_at = Some(now);
                (Some(task.task_type.clone()), Some((task.persistent, now)))
            } else {
                (None, None)
            }
        };

        // 同步到数据库
        if let Some((persistent, now)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_result(task_id, result.as_ref(), now, now);
        }

        if let Some(task_type) = task_type {
            let _ = app.emit(
                "task:completed",
                serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type,
                    "result": result
                }),
            );
        }
    }

    pub fn fail(&self, task_id: &str, error: impl Into<String>) {
        let (task_persistent, error_str) = {
            let error_str = error.into();
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Failed;
                task.error = Some(error_str.clone());
                task.updated_at = now;
                task.completed_at = Some(now);
                (Some((task.persistent, now)), error_str)
            } else {
                (None, error_str)
            }
        };

        // 同步到数据库
        if let Some((persistent, now)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_error(task_id, &error_str, now, now);
        }
    }

    /// 失败任务并发送 Tauri 事件通知
    pub fn fail_with_emit<R: tauri::Runtime>(
        &self,
        task_id: &str,
        error: impl Into<String>,
        app: &tauri::AppHandle<R>,
    ) {
        let (task_type, error_msg, task_persistent) = {
            let error_str = error.into();
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Failed;
                task.error = Some(error_str.clone());
                task.updated_at = now;
                task.completed_at = Some(now);
                (
                    Some(task.task_type.clone()),
                    error_str.clone(),
                    Some((task.persistent, now, error_str)),
                )
            } else {
                (None, error_str.clone(), None)
            }
        };

        // 同步到数据库
        if let Some((persistent, now, err)) = task_persistent
            && persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_task_error(task_id, &err, now, now);
        }

        if let Some(task_type) = task_type {
            let _ = app.emit(
                "task:failed",
                serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type,
                    "error": error_msg
                }),
            );
        }
    }

    pub fn cancel(&self, task_id: &str) -> bool {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id)
            && (task.status == TaskStatus::Pending || task.status == TaskStatus::Running)
        {
            let now = Utc::now().timestamp_millis();
            task.status = TaskStatus::Cancelled;
            task.updated_at = now;
            task.completed_at = Some(now);
            return true;
        }
        false
    }

    /// 取消任务并发送 Tauri 事件通知
    pub fn cancel_with_emit<R: tauri::Runtime>(
        &self,
        task_id: &str,
        app: &tauri::AppHandle<R>,
    ) -> bool {
        let task_type = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id)
                && (task.status == TaskStatus::Pending || task.status == TaskStatus::Running)
            {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Cancelled;
                task.updated_at = now;
                task.completed_at = Some(now);
                Some(task.task_type.clone())
            } else {
                None
            }
        };

        if let Some(task_type) = task_type {
            let _ = app.emit(
                "task:cancelled",
                serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type
                }),
            );
            return true;
        }
        false
    }

    /// 更新进度并发送 Tauri 事件通知
    pub fn update_progress_with_emit<R: tauri::Runtime>(
        &self,
        task_id: &str,
        progress: u8,
        message: Option<String>,
        app: &tauri::AppHandle<R>,
    ) {
        let task_type = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                task.progress = progress.min(100);
                task.message = message.clone();
                task.updated_at = Utc::now().timestamp_millis();
                Some(task.task_type.clone())
            } else {
                None
            }
        };

        if let Some(task_type) = task_type {
            let _ = app.emit(
                "task:progress",
                serde_json::json!({
                    "taskId": task_id,
                    "taskType": task_type,
                    "progress": progress.min(100),
                    "message": message
                }),
            );
        }
    }

    pub fn remove_task(&self, task_id: &str) -> Option<TaskInfo> {
        let task = {
            let mut tasks = self.tasks.lock().unwrap();
            tasks.remove(task_id)
        };

        // 从数据库删除
        if let Some(ref task) = task
            && task.persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.delete_task(task_id);
        }

        task
    }

    pub fn cleanup_completed(&self, max_age_ms: i64) {
        let now = Utc::now().timestamp_millis();
        let mut tasks = self.tasks.lock().unwrap();
        tasks.retain(|_, task| {
            if let Some(completed_at) = task.completed_at {
                now - completed_at < max_age_ms
            } else {
                true
            }
        });

        // 清理数据库中的旧任务
        if let Some(ref persistence) = self.persistence {
            let _ = persistence.cleanup_completed_tasks(max_age_ms);
        }
    }

    /// 重试失败的任务
    pub fn retry_task(&self, task_id: &str) -> Option<TaskInfo> {
        let task = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(task_id) {
                if task.can_retry() {
                    task.increment_retry();
                    Some(task.clone())
                } else {
                    None
                }
            } else {
                None
            }
        };

        // 同步到数据库
        if let Some(ref task) = task
            && task.persistent
            && let Some(ref persistence) = self.persistence
        {
            let _ = persistence.update_retry_count(task_id, task.retry_count, task.updated_at);
        }

        task
    }

    /// 重试失败任务并发送事件通知
    pub fn retry_task_with_emit<R: tauri::Runtime>(
        &self,
        task_id: &str,
        app: &tauri::AppHandle<R>,
    ) -> Option<TaskInfo> {
        let task = self.retry_task(task_id);

        if let Some(ref task) = task {
            let _ = app.emit(
                "task:retry",
                serde_json::json!({
                    "taskId": task_id,
                    "taskType": task.task_type,
                    "retryCount": task.retry_count,
                    "maxRetries": task.max_retries
                }),
            );
        }

        task
    }
}

impl Default for TaskManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_task_lifecycle() {
        let manager = TaskManager::new();

        let task = manager.create_task("test_task");
        assert_eq!(task.status, TaskStatus::Pending);

        manager.set_running(&task.id);
        let updated = manager.get_task(&task.id).unwrap();
        assert_eq!(updated.status, TaskStatus::Running);

        manager.update_progress(&task.id, 50, Some("Half done".to_string()));
        let updated = manager.get_task(&task.id).unwrap();
        assert_eq!(updated.progress, 50);

        manager.complete(&task.id, Some(serde_json::json!({"result": "success"})));
        let completed = manager.get_task(&task.id).unwrap();
        assert_eq!(completed.status, TaskStatus::Completed);
        assert_eq!(completed.progress, 100);
    }

    #[test]
    fn test_task_failure() {
        let manager = TaskManager::new();
        let task = manager.create_task("failing_task");

        manager.set_running(&task.id);
        manager.fail(&task.id, "Something went wrong");

        let failed = manager.get_task(&task.id).unwrap();
        assert_eq!(failed.status, TaskStatus::Failed);
        assert_eq!(failed.error, Some("Something went wrong".to_string()));
    }

    #[test]
    fn test_task_cancellation() {
        let manager = TaskManager::new();
        let task = manager.create_task("cancellable_task");

        assert!(manager.cancel(&task.id));
        let cancelled = manager.get_task(&task.id).unwrap();
        assert_eq!(cancelled.status, TaskStatus::Cancelled);
    }
}
