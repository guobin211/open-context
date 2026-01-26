//! 任务状态持久化层
//!
//! 提供任务数据的 SQLite 持久化功能，支持：
//! - 任务创建、更新、删除
//! - 加载未完成的持久化任务
//! - 任务重试机制

use crate::app_service::{TaskInfo, TaskStatus};
use rusqlite::Connection;
use rusqlite::{Result as SqliteResult, params};
use std::sync::{Arc, Mutex};

pub struct TaskStateManager {
    conn: Arc<Mutex<Connection>>,
}

impl TaskStateManager {
    pub fn new(conn: Arc<Mutex<Connection>>) -> Self {
        Self { conn }
    }

    /// 保存任务到数据库
    pub fn save_task(&self, task: &TaskInfo) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR REPLACE INTO tasks (
                id, task_type, status, progress, message, result, error,
                retry_count, max_retries, retry_delay_ms, input, persistent,
                created_at, updated_at, completed_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                task.id,
                task.task_type,
                status_to_string(&task.status),
                task.progress,
                task.message,
                task.result.as_ref().map(|v| v.to_string()),
                task.error,
                task.retry_count,
                task.max_retries,
                task.retry_delay_ms,
                task.input.as_ref().map(|v| v.to_string()),
                task.persistent as i32,
                task.created_at,
                task.updated_at,
                task.completed_at,
            ],
        )?;
        Ok(())
    }

    /// 更新任务状态
    pub fn update_task_status(
        &self,
        task_id: &str,
        status: &TaskStatus,
        progress: u8,
        message: Option<&str>,
        updated_at: i64,
        completed_at: Option<i64>,
    ) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tasks SET status = ?1, progress = ?2, message = ?3, updated_at = ?4, completed_at = ?5 WHERE id = ?6",
            params![
                status_to_string(status),
                progress,
                message,
                updated_at,
                completed_at,
                task_id,
            ],
        )?;
        Ok(())
    }

    /// 更新任务结果
    pub fn update_task_result(
        &self,
        task_id: &str,
        result: Option<&serde_json::Value>,
        updated_at: i64,
        completed_at: i64,
    ) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tasks SET status = 'completed', progress = 100, result = ?1, updated_at = ?2, completed_at = ?3 WHERE id = ?4",
            params![
                result.map(|v| v.to_string()),
                updated_at,
                completed_at,
                task_id,
            ],
        )?;
        Ok(())
    }

    /// 更新任务错误
    pub fn update_task_error(
        &self,
        task_id: &str,
        error: &str,
        updated_at: i64,
        completed_at: i64,
    ) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tasks SET status = 'failed', error = ?1, updated_at = ?2, completed_at = ?3 WHERE id = ?4",
            params![error, updated_at, completed_at, task_id],
        )?;
        Ok(())
    }

    /// 更新重试计数
    pub fn update_retry_count(
        &self,
        task_id: &str,
        retry_count: u8,
        updated_at: i64,
    ) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE tasks SET retry_count = ?1, status = 'pending', error = NULL, progress = 0, completed_at = NULL, updated_at = ?2 WHERE id = ?3",
            params![retry_count, updated_at, task_id],
        )?;
        Ok(())
    }

    /// 获取单个任务
    pub fn get_task(&self, task_id: &str) -> SqliteResult<Option<TaskInfo>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, task_type, status, progress, message, result, error,
                    retry_count, max_retries, retry_delay_ms, input, persistent,
                    created_at, updated_at, completed_at
             FROM tasks WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![task_id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(row_to_task_info(row)?))
        } else {
            Ok(None)
        }
    }

    /// 加载所有持久化的未完成任务（用于应用启动时恢复）
    pub fn load_pending_persistent_tasks(&self) -> SqliteResult<Vec<TaskInfo>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, task_type, status, progress, message, result, error,
                    retry_count, max_retries, retry_delay_ms, input, persistent,
                    created_at, updated_at, completed_at
             FROM tasks
             WHERE persistent = 1 AND status IN ('pending', 'running')
             ORDER BY created_at ASC",
        )?;

        let mut tasks = Vec::new();
        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            tasks.push(row_to_task_info(row)?);
        }
        Ok(tasks)
    }

    /// 加载可重试的失败任务
    pub fn load_retryable_tasks(&self) -> SqliteResult<Vec<TaskInfo>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, task_type, status, progress, message, result, error,
                    retry_count, max_retries, retry_delay_ms, input, persistent,
                    created_at, updated_at, completed_at
             FROM tasks
             WHERE persistent = 1 AND status = 'failed' AND retry_count < max_retries
             ORDER BY created_at ASC",
        )?;

        let mut tasks = Vec::new();
        let mut rows = stmt.query([])?;
        while let Some(row) = rows.next()? {
            tasks.push(row_to_task_info(row)?);
        }
        Ok(tasks)
    }

    /// 列出所有任务
    pub fn list_tasks(
        &self,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> SqliteResult<Vec<TaskInfo>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, task_type, status, progress, message, result, error,
                    retry_count, max_retries, retry_delay_ms, input, persistent,
                    created_at, updated_at, completed_at
             FROM tasks
             ORDER BY created_at DESC
             LIMIT ?1 OFFSET ?2",
        )?;

        let mut tasks = Vec::new();
        let mut rows = stmt.query(params![limit.unwrap_or(100), offset.unwrap_or(0)])?;
        while let Some(row) = rows.next()? {
            tasks.push(row_to_task_info(row)?);
        }
        Ok(tasks)
    }

    /// 按类型列出任务
    pub fn list_tasks_by_type(&self, task_type: &str) -> SqliteResult<Vec<TaskInfo>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, task_type, status, progress, message, result, error,
                    retry_count, max_retries, retry_delay_ms, input, persistent,
                    created_at, updated_at, completed_at
             FROM tasks
             WHERE task_type = ?1
             ORDER BY created_at DESC",
        )?;

        let mut tasks = Vec::new();
        let mut rows = stmt.query(params![task_type])?;
        while let Some(row) = rows.next()? {
            tasks.push(row_to_task_info(row)?);
        }
        Ok(tasks)
    }

    /// 删除任务
    pub fn delete_task(&self, task_id: &str) -> SqliteResult<bool> {
        let conn = self.conn.lock().unwrap();
        let rows_affected = conn.execute("DELETE FROM tasks WHERE id = ?1", params![task_id])?;
        Ok(rows_affected > 0)
    }

    /// 清理已完成的旧任务
    pub fn cleanup_completed_tasks(&self, max_age_ms: i64) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();
        let cutoff = chrono::Utc::now().timestamp_millis() - max_age_ms;
        let rows_affected = conn.execute(
            "DELETE FROM tasks WHERE status IN ('completed', 'failed', 'cancelled') AND completed_at < ?1",
            params![cutoff],
        )?;
        Ok(rows_affected)
    }

    /// 将运行中的任务标记为待重试（用于应用崩溃后恢复）
    pub fn mark_running_as_pending(&self) -> SqliteResult<usize> {
        let conn = self.conn.lock().unwrap();
        let now = chrono::Utc::now().timestamp_millis();
        let rows_affected = conn.execute(
            "UPDATE tasks SET status = 'pending', updated_at = ?1 WHERE status = 'running' AND persistent = 1",
            params![now],
        )?;
        Ok(rows_affected)
    }
}

fn status_to_string(status: &TaskStatus) -> &'static str {
    match status {
        TaskStatus::Pending => "pending",
        TaskStatus::Running => "running",
        TaskStatus::Completed => "completed",
        TaskStatus::Failed => "failed",
        TaskStatus::Cancelled => "cancelled",
    }
}

fn string_to_status(s: &str) -> TaskStatus {
    match s {
        "pending" => TaskStatus::Pending,
        "running" => TaskStatus::Running,
        "completed" => TaskStatus::Completed,
        "failed" => TaskStatus::Failed,
        "cancelled" => TaskStatus::Cancelled,
        _ => TaskStatus::Pending,
    }
}

fn row_to_task_info(row: &rusqlite::Row) -> SqliteResult<TaskInfo> {
    let status_str: String = row.get(2)?;
    let result_str: Option<String> = row.get(5)?;
    let input_str: Option<String> = row.get(10)?;
    let persistent_int: i32 = row.get(11)?;

    Ok(TaskInfo {
        id: row.get(0)?,
        task_type: row.get(1)?,
        status: string_to_status(&status_str),
        progress: row.get(3)?,
        message: row.get(4)?,
        result: result_str.and_then(|s| serde_json::from_str(&s).ok()),
        error: row.get(6)?,
        retry_count: row.get(7)?,
        max_retries: row.get(8)?,
        retry_delay_ms: row.get(9)?,
        input: input_str.and_then(|s| serde_json::from_str(&s).ok()),
        persistent: persistent_int != 0,
        created_at: row.get(12)?,
        updated_at: row.get(13)?,
        completed_at: row.get(14)?,
    })
}
