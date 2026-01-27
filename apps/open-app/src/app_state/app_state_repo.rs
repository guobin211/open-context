use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CloneStatus {
    Pending,
    Cloning,
    Completed,
    Failed,
}

impl CloneStatus {
    pub fn as_str(&self) -> &str {
        match self {
            CloneStatus::Pending => "pending",
            CloneStatus::Cloning => "cloning",
            CloneStatus::Completed => "completed",
            CloneStatus::Failed => "failed",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(CloneStatus::Pending),
            "cloning" => Some(CloneStatus::Cloning),
            "completed" => Some(CloneStatus::Completed),
            "failed" => Some(CloneStatus::Failed),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IndexStatus {
    NotIndexed,
    Indexing,
    Indexed,
    Failed,
}

impl IndexStatus {
    pub fn as_str(&self) -> &str {
        match self {
            IndexStatus::NotIndexed => "not_indexed",
            IndexStatus::Indexing => "indexing",
            IndexStatus::Indexed => "indexed",
            IndexStatus::Failed => "failed",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "not_indexed" => Some(IndexStatus::NotIndexed),
            "indexing" => Some(IndexStatus::Indexing),
            "indexed" => Some(IndexStatus::Indexed),
            "failed" => Some(IndexStatus::Failed),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepository {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub remote_url: String,
    pub local_path: PathBuf,
    pub branch: String,
    pub default_branch: Option<String>,
    pub last_commit_hash: Option<String>,
    pub last_synced_at: Option<i64>,
    pub clone_status: CloneStatus,
    pub clone_progress: i32,
    pub index_status: IndexStatus,
    pub indexed_at: Option<i64>,
    pub file_count: i32,
    pub symbol_count: i32,
    pub vector_count: i32,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl GitRepository {
    pub fn new(
        workspace_id: String,
        name: String,
        remote_url: String,
        local_path: PathBuf,
        branch: String,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            name,
            remote_url,
            local_path,
            branch: branch.clone(),
            default_branch: Some(branch),
            last_commit_hash: None,
            last_synced_at: None,
            clone_status: CloneStatus::Pending,
            clone_progress: 0,
            index_status: IndexStatus::NotIndexed,
            indexed_at: None,
            file_count: 0,
            symbol_count: 0,
            vector_count: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Git repository management operations
impl DatabaseManager {
    /// Create Git repository record
    pub fn create_git_repository(&self, repo: &GitRepository) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO git_repositories
             (id, workspace_id, name, remote_url, local_path, branch, default_branch, last_commit_hash, last_synced_at, clone_status, clone_progress, index_status, indexed_at, file_count, symbol_count, vector_count, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19)",
            params![
                repo.id,
                repo.workspace_id,
                repo.name,
                repo.remote_url,
                repo.local_path.to_str().unwrap(),
                repo.branch,
                repo.default_branch,
                repo.last_commit_hash,
                repo.last_synced_at,
                repo.clone_status.as_str(),
                repo.clone_progress,
                repo.index_status.as_str(),
                repo.indexed_at,
                repo.file_count,
                repo.symbol_count,
                repo.vector_count,
                repo.is_archived as i32,
                repo.created_at,
                repo.updated_at,
            ],
        )?;
        Ok(())
    }

    /// Get Git repository by ID
    pub fn get_git_repository(&self, id: &str) -> SqliteResult<Option<GitRepository>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, remote_url, local_path, branch, default_branch, last_commit_hash, last_synced_at, clone_status, clone_progress, index_status, indexed_at, file_count, symbol_count, vector_count, is_archived, created_at, updated_at
             FROM git_repositories WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let clone_status_str: String = row.get(9)?;
            let index_status_str: String = row.get(11)?;

            Ok(Some(GitRepository {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                remote_url: row.get(3)?,
                local_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                branch: row.get(5)?,
                default_branch: row.get(6)?,
                last_commit_hash: row.get(7)?,
                last_synced_at: row.get(8)?,
                clone_status: CloneStatus::parse(&clone_status_str).unwrap_or(CloneStatus::Pending),
                clone_progress: row.get(10)?,
                index_status: IndexStatus::parse(&index_status_str).unwrap_or(IndexStatus::NotIndexed),
                indexed_at: row.get(12)?,
                file_count: row.get(13)?,
                symbol_count: row.get(14)?,
                vector_count: row.get(15)?,
                is_archived: row.get::<_, i32>(16)? != 0,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List Git repositories in workspace
    pub fn list_git_repositories(&self, workspace_id: &str) -> SqliteResult<Vec<GitRepository>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, remote_url, local_path, branch, default_branch, last_commit_hash, last_synced_at, clone_status, clone_progress, index_status, indexed_at, file_count, symbol_count, vector_count, is_archived, created_at, updated_at
             FROM git_repositories WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let clone_status_str: String = row.get(9)?;
            let index_status_str: String = row.get(11)?;

            Ok(GitRepository {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                remote_url: row.get(3)?,
                local_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                branch: row.get(5)?,
                default_branch: row.get(6)?,
                last_commit_hash: row.get(7)?,
                last_synced_at: row.get(8)?,
                clone_status: CloneStatus::parse(&clone_status_str).unwrap_or(CloneStatus::Pending),
                clone_progress: row.get(10)?,
                index_status: IndexStatus::parse(&index_status_str).unwrap_or(IndexStatus::NotIndexed),
                indexed_at: row.get(12)?,
                file_count: row.get(13)?,
                symbol_count: row.get(14)?,
                vector_count: row.get(15)?,
                is_archived: row.get::<_, i32>(16)? != 0,
                created_at: row.get(17)?,
                updated_at: row.get(18)?,
            })
        })?;

        let mut repositories = Vec::new();
        for repo in rows {
            repositories.push(repo?);
        }
        Ok(repositories)
    }

    /// Update Git repository sync status
    pub fn update_git_repository_sync(&self, repo_id: &str, commit_hash: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE git_repositories
             SET last_commit_hash = ?1, last_synced_at = ?2, updated_at = ?3
             WHERE id = ?4",
            params![commit_hash, now, now, repo_id],
        )?;
        Ok(())
    }

    /// Update Git repository metadata
    pub fn update_git_repository(&self, repo: &GitRepository) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE git_repositories
             SET name = ?1, remote_url = ?2, branch = ?3, updated_at = ?4
             WHERE id = ?5",
            params![repo.name, repo.remote_url, repo.branch, updated_at, repo.id,],
        )?;
        Ok(())
    }

    /// Update Git repository clone status
    pub fn update_git_repository_clone_status(
        &self,
        repo_id: &str,
        status: CloneStatus,
        progress: i32,
    ) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE git_repositories
             SET clone_status = ?1, clone_progress = ?2, updated_at = ?3
             WHERE id = ?4",
            params![status.as_str(), progress, updated_at, repo_id],
        )?;
        Ok(())
    }

    /// Update Git repository index status
    pub fn update_git_repository_index_status(
        &self,
        repo_id: &str,
        status: IndexStatus,
        indexed_at: Option<i64>,
    ) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE git_repositories
             SET index_status = ?1, indexed_at = ?2, updated_at = ?3
             WHERE id = ?4",
            params![status.as_str(), indexed_at, updated_at, repo_id],
        )?;
        Ok(())
    }

    /// Update Git repository statistics
    pub fn update_git_repository_stats(
        &self,
        repo_id: &str,
        file_count: i32,
        symbol_count: i32,
        vector_count: i32,
    ) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE git_repositories
             SET file_count = ?1, symbol_count = ?2, vector_count = ?3, updated_at = ?4
             WHERE id = ?5",
            params![file_count, symbol_count, vector_count, updated_at, repo_id],
        )?;
        Ok(())
    }

    /// Delete Git repository record
    pub fn delete_git_repository(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM git_repositories WHERE id = ?1", params![id])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_state::Workspace;
    use std::env;

    fn setup_test_db() -> (DatabaseManager, Workspace) {
        let test_db_path = env::temp_dir().join(format!("test_repo_{}.db", uuid::Uuid::new_v4()));
        let db = DatabaseManager::new(test_db_path).unwrap();

        let workspace = Workspace::new("Test Workspace".to_string(), None);
        db.create_workspace(&workspace).unwrap();

        (db, workspace)
    }

    #[test]
    fn test_create_and_get_repository() {
        let (db, workspace) = setup_test_db();
        let repo = GitRepository::new(
            workspace.id.clone(),
            "my-repo".to_string(),
            "https://github.com/user/repo.git".to_string(),
            std::path::PathBuf::from("/local/repo"),
            "main".to_string(),
        );

        db.create_git_repository(&repo).unwrap();
        let retrieved = db.get_git_repository(&repo.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.name, "my-repo");
        assert_eq!(retrieved.branch, "main");
    }

    #[test]
    fn test_update_repository_sync() {
        let (db, workspace) = setup_test_db();
        let repo = GitRepository::new(
            workspace.id.clone(),
            "my-repo".to_string(),
            "https://github.com/user/repo.git".to_string(),
            std::path::PathBuf::from("/local/repo"),
            "main".to_string(),
        );

        db.create_git_repository(&repo).unwrap();
        db.update_git_repository_sync(&repo.id, "abc123def456")
            .unwrap();

        let updated = db.get_git_repository(&repo.id).unwrap().unwrap();
        assert_eq!(updated.last_commit_hash, Some("abc123def456".to_string()));
        assert!(updated.last_synced_at.is_some());
    }
}
