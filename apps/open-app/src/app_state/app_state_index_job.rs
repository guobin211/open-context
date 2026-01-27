//! 索引任务状态管理模块

use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IndexJobType {
    Full,
    Incremental,
}

impl IndexJobType {
    pub fn as_str(&self) -> &str {
        match self {
            IndexJobType::Full => "full",
            IndexJobType::Incremental => "incremental",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "full" => Some(IndexJobType::Full),
            "incremental" => Some(IndexJobType::Incremental),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IndexJobStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl IndexJobStatus {
    pub fn as_str(&self) -> &str {
        match self {
            IndexJobStatus::Pending => "pending",
            IndexJobStatus::Running => "running",
            IndexJobStatus::Completed => "completed",
            IndexJobStatus::Failed => "failed",
            IndexJobStatus::Cancelled => "cancelled",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(IndexJobStatus::Pending),
            "running" => Some(IndexJobStatus::Running),
            "completed" => Some(IndexJobStatus::Completed),
            "failed" => Some(IndexJobStatus::Failed),
            "cancelled" => Some(IndexJobStatus::Cancelled),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexJob {
    pub id: String,
    pub repo_id: String,
    pub job_type: IndexJobType,
    pub status: IndexJobStatus,
    pub progress: i32,
    pub total_files: Option<i32>,
    pub processed_files: i32,
    pub total_symbols: Option<i32>,
    pub processed_symbols: i32,
    pub error_message: Option<String>,
    pub metadata: Option<String>,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
    pub created_at: i64,
}

impl IndexJob {
    pub fn new(repo_id: String, job_type: IndexJobType) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            repo_id,
            job_type,
            status: IndexJobStatus::Pending,
            progress: 0,
            total_files: None,
            processed_files: 0,
            total_symbols: None,
            processed_symbols: 0,
            error_message: None,
            metadata: None,
            started_at: None,
            completed_at: None,
            created_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexMetadata {
    pub id: String,
    pub repo_id: String,
    pub file_path: String,
    pub content_hash: String,
    pub last_indexed_at: i64,
    pub symbol_count: i32,
    pub language: Option<String>,
    pub file_size: Option<i64>,
}

impl IndexMetadata {
    pub fn new(
        repo_id: String,
        file_path: String,
        content_hash: String,
        symbol_count: i32,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            repo_id,
            file_path,
            content_hash,
            last_indexed_at: now,
            symbol_count,
            language: None,
            file_size: None,
        }
    }
}

impl DatabaseManager {
    // IndexJob CRUD

    pub fn create_index_job(&self, job: &IndexJob) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO index_jobs (id, repo_id, job_type, status, progress, total_files, processed_files, total_symbols, processed_symbols, error_message, metadata, started_at, completed_at, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                job.id,
                job.repo_id,
                job.job_type.as_str(),
                job.status.as_str(),
                job.progress,
                job.total_files,
                job.processed_files,
                job.total_symbols,
                job.processed_symbols,
                job.error_message,
                job.metadata,
                job.started_at,
                job.completed_at,
                job.created_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_index_job(&self, id: &str) -> SqliteResult<Option<IndexJob>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, repo_id, job_type, status, progress, total_files, processed_files, total_symbols, processed_symbols, error_message, metadata, started_at, completed_at, created_at
             FROM index_jobs WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let job_type_str: String = row.get(2)?;
            let status_str: String = row.get(3)?;

            Ok(Some(IndexJob {
                id: row.get(0)?,
                repo_id: row.get(1)?,
                job_type: IndexJobType::parse(&job_type_str).unwrap_or(IndexJobType::Full),
                status: IndexJobStatus::parse(&status_str).unwrap_or(IndexJobStatus::Pending),
                progress: row.get(4)?,
                total_files: row.get(5)?,
                processed_files: row.get(6)?,
                total_symbols: row.get(7)?,
                processed_symbols: row.get(8)?,
                error_message: row.get(9)?,
                metadata: row.get(10)?,
                started_at: row.get(11)?,
                completed_at: row.get(12)?,
                created_at: row.get(13)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_index_jobs_by_repo(&self, repo_id: &str) -> SqliteResult<Vec<IndexJob>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, repo_id, job_type, status, progress, total_files, processed_files, total_symbols, processed_symbols, error_message, metadata, started_at, completed_at, created_at
             FROM index_jobs WHERE repo_id = ?1 ORDER BY created_at DESC",
        )?;

        let rows = stmt.query_map(params![repo_id], |row| {
            let job_type_str: String = row.get(2)?;
            let status_str: String = row.get(3)?;

            Ok(IndexJob {
                id: row.get(0)?,
                repo_id: row.get(1)?,
                job_type: IndexJobType::parse(&job_type_str).unwrap_or(IndexJobType::Full),
                status: IndexJobStatus::parse(&status_str).unwrap_or(IndexJobStatus::Pending),
                progress: row.get(4)?,
                total_files: row.get(5)?,
                processed_files: row.get(6)?,
                total_symbols: row.get(7)?,
                processed_symbols: row.get(8)?,
                error_message: row.get(9)?,
                metadata: row.get(10)?,
                started_at: row.get(11)?,
                completed_at: row.get(12)?,
                created_at: row.get(13)?,
            })
        })?;

        let mut jobs = Vec::new();
        for job in rows {
            jobs.push(job?);
        }
        Ok(jobs)
    }

    pub fn update_index_job(&self, job: &IndexJob) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "UPDATE index_jobs
             SET status = ?1, progress = ?2, total_files = ?3, processed_files = ?4, total_symbols = ?5, processed_symbols = ?6, error_message = ?7, metadata = ?8, started_at = ?9, completed_at = ?10
             WHERE id = ?11",
            params![
                job.status.as_str(),
                job.progress,
                job.total_files,
                job.processed_files,
                job.total_symbols,
                job.processed_symbols,
                job.error_message,
                job.metadata,
                job.started_at,
                job.completed_at,
                job.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_index_job(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM index_jobs WHERE id = ?1", params![id])?;
        Ok(())
    }

    // IndexMetadata CRUD

    pub fn create_index_metadata(&self, metadata: &IndexMetadata) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO index_metadata (id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
             ON CONFLICT(repo_id, file_path) DO UPDATE SET
                content_hash = excluded.content_hash,
                last_indexed_at = excluded.last_indexed_at,
                symbol_count = excluded.symbol_count,
                language = excluded.language,
                file_size = excluded.file_size",
            params![
                metadata.id,
                metadata.repo_id,
                metadata.file_path,
                metadata.content_hash,
                metadata.last_indexed_at,
                metadata.symbol_count,
                metadata.language,
                metadata.file_size,
            ],
        )?;
        Ok(())
    }

    pub fn get_index_metadata(&self, id: &str) -> SqliteResult<Option<IndexMetadata>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size
             FROM index_metadata WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(IndexMetadata {
                id: row.get(0)?,
                repo_id: row.get(1)?,
                file_path: row.get(2)?,
                content_hash: row.get(3)?,
                last_indexed_at: row.get(4)?,
                symbol_count: row.get(5)?,
                language: row.get(6)?,
                file_size: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn get_index_metadata_by_file(
        &self,
        repo_id: &str,
        file_path: &str,
    ) -> SqliteResult<Option<IndexMetadata>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size
             FROM index_metadata WHERE repo_id = ?1 AND file_path = ?2",
        )?;

        let mut rows = stmt.query(params![repo_id, file_path])?;
        if let Some(row) = rows.next()? {
            Ok(Some(IndexMetadata {
                id: row.get(0)?,
                repo_id: row.get(1)?,
                file_path: row.get(2)?,
                content_hash: row.get(3)?,
                last_indexed_at: row.get(4)?,
                symbol_count: row.get(5)?,
                language: row.get(6)?,
                file_size: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_index_metadata_by_repo(&self, repo_id: &str) -> SqliteResult<Vec<IndexMetadata>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size
             FROM index_metadata WHERE repo_id = ?1 ORDER BY last_indexed_at DESC",
        )?;

        let rows = stmt.query_map(params![repo_id], |row| {
            Ok(IndexMetadata {
                id: row.get(0)?,
                repo_id: row.get(1)?,
                file_path: row.get(2)?,
                content_hash: row.get(3)?,
                last_indexed_at: row.get(4)?,
                symbol_count: row.get(5)?,
                language: row.get(6)?,
                file_size: row.get(7)?,
            })
        })?;

        let mut metadata_list = Vec::new();
        for metadata in rows {
            metadata_list.push(metadata?);
        }
        Ok(metadata_list)
    }

    pub fn delete_index_metadata(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM index_metadata WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn delete_index_metadata_by_repo(&self, repo_id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "DELETE FROM index_metadata WHERE repo_id = ?1",
            params![repo_id],
        )?;
        Ok(())
    }
}
