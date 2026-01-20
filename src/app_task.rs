use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};

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
        }
    }

    pub fn with_id(mut self, id: impl Into<String>) -> Self {
        self.id = id.into();
        self
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
}

impl TaskManager {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    pub fn create_task(&self, task_type: impl Into<String>) -> TaskInfo {
        let task = TaskInfo::new(task_type);
        let mut tasks = self.tasks.lock().unwrap();
        tasks.insert(task.id.clone(), task.clone());
        task
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
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id) {
            task.status = status.clone();
            task.updated_at = Utc::now().timestamp_millis();
            if status == TaskStatus::Completed || status == TaskStatus::Failed {
                task.completed_at = Some(Utc::now().timestamp_millis());
            }
        }
    }

    pub fn update_progress(&self, task_id: &str, progress: u8, message: Option<String>) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id) {
            task.progress = progress.min(100);
            task.message = message;
            task.updated_at = Utc::now().timestamp_millis();
        }
    }

    pub fn set_running(&self, task_id: &str) {
        self.update_status(task_id, TaskStatus::Running);
    }

    pub fn complete(&self, task_id: &str, result: Option<serde_json::Value>) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id) {
            let now = Utc::now().timestamp_millis();
            task.status = TaskStatus::Completed;
            task.progress = 100;
            task.result = result;
            task.updated_at = now;
            task.completed_at = Some(now);
        }
    }

    pub fn fail(&self, task_id: &str, error: impl Into<String>) {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id) {
            let now = Utc::now().timestamp_millis();
            task.status = TaskStatus::Failed;
            task.error = Some(error.into());
            task.updated_at = now;
            task.completed_at = Some(now);
        }
    }

    pub fn cancel(&self, task_id: &str) -> bool {
        let mut tasks = self.tasks.lock().unwrap();
        if let Some(task) = tasks.get_mut(task_id) {
            if task.status == TaskStatus::Pending || task.status == TaskStatus::Running {
                let now = Utc::now().timestamp_millis();
                task.status = TaskStatus::Cancelled;
                task.updated_at = now;
                task.completed_at = Some(now);
                return true;
            }
        }
        false
    }

    pub fn remove_task(&self, task_id: &str) -> Option<TaskInfo> {
        let mut tasks = self.tasks.lock().unwrap();
        tasks.remove(task_id)
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
