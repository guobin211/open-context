use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};

use crate::app_state::{DatabaseManager, GitRepository, WebLink};

/// Git repository management operations
impl DatabaseManager {
    /// Create Git repository record
    pub fn create_git_repository(&self, repo: &GitRepository) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO git_repositories
             (id, workspace_id, name, remote_url, local_path, branch, last_commit_hash, last_synced_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                repo.id,
                repo.workspace_id,
                repo.name,
                repo.remote_url,
                repo.local_path.to_str().unwrap(),
                repo.branch,
                repo.last_commit_hash,
                repo.last_synced_at,
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
            "SELECT id, workspace_id, name, remote_url, local_path, branch, last_commit_hash, last_synced_at, created_at, updated_at
             FROM git_repositories WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(GitRepository {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                remote_url: row.get(3)?,
                local_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                branch: row.get(5)?,
                last_commit_hash: row.get(6)?,
                last_synced_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
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
            "SELECT id, workspace_id, name, remote_url, local_path, branch, last_commit_hash, last_synced_at, created_at, updated_at
             FROM git_repositories WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(GitRepository {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                remote_url: row.get(3)?,
                local_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                branch: row.get(5)?,
                last_commit_hash: row.get(6)?,
                last_synced_at: row.get(7)?,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
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

    /// Delete Git repository record
    pub fn delete_git_repository(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM git_repositories WHERE id = ?1", params![id])?;
        Ok(())
    }
}

/// Web link management operations
impl DatabaseManager {
    /// Create web link record
    pub fn create_web_link(&self, link: &WebLink) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let tags_json = serde_json::to_string(&link.tags).unwrap();

        conn.execute(
            "INSERT INTO web_links
             (id, workspace_id, title, url, description, favicon_url, tags, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                link.id,
                link.workspace_id,
                link.title,
                link.url,
                link.description,
                link.favicon_url,
                tags_json,
                link.created_at,
                link.updated_at,
            ],
        )?;
        Ok(())
    }

    /// Get web link by ID
    pub fn get_web_link(&self, id: &str) -> SqliteResult<Option<WebLink>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, description, favicon_url, tags, created_at, updated_at
             FROM web_links WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(Some(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                tags,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List web links in workspace
    pub fn list_web_links(&self, workspace_id: &str) -> SqliteResult<Vec<WebLink>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, description, favicon_url, tags, created_at, updated_at
             FROM web_links WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                tags,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut links = Vec::new();
        for link in rows {
            links.push(link?);
        }
        Ok(links)
    }

    /// Update web link
    pub fn update_web_link(&self, link: &WebLink) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();
        let tags_json = serde_json::to_string(&link.tags).unwrap();

        conn.execute(
            "UPDATE web_links
             SET title = ?1, url = ?2, description = ?3, favicon_url = ?4, tags = ?5, updated_at = ?6
             WHERE id = ?7",
            params![
                link.title,
                link.url,
                link.description,
                link.favicon_url,
                tags_json,
                updated_at,
                link.id,
            ],
        )?;
        Ok(())
    }

    /// Delete web link
    pub fn delete_web_link(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM web_links WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Search web links by title or URL
    pub fn search_web_links(&self, workspace_id: &str, query: &str) -> SqliteResult<Vec<WebLink>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let search_pattern = format!("%{}%", query);

        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, description, favicon_url, tags, created_at, updated_at
             FROM web_links
             WHERE workspace_id = ?1 AND (title LIKE ?2 OR url LIKE ?2)
             ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id, search_pattern], |row| {
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();

            Ok(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                tags,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut links = Vec::new();
        for link in rows {
            links.push(link?);
        }
        Ok(links)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_state::{DatabaseManager, Workspace};
    use std::env;

    fn setup_test_db() -> (DatabaseManager, Workspace) {
        let test_db_path =
            env::temp_dir().join(format!("test_repo_link_{}.db", uuid::Uuid::new_v4()));
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

    #[test]
    fn test_create_and_get_web_link() {
        let (db, workspace) = setup_test_db();
        let link = WebLink::new(
            workspace.id.clone(),
            "Example Website".to_string(),
            "https://example.com".to_string(),
        );

        db.create_web_link(&link).unwrap();
        let retrieved = db.get_web_link(&link.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.title, "Example Website");
        assert_eq!(retrieved.url, "https://example.com");
    }

    #[test]
    fn test_search_web_links() {
        let (db, workspace) = setup_test_db();

        let link1 = WebLink::new(
            workspace.id.clone(),
            "Rust Programming".to_string(),
            "https://rust-lang.org".to_string(),
        );
        let link2 = WebLink::new(
            workspace.id.clone(),
            "Python Tutorial".to_string(),
            "https://python.org".to_string(),
        );

        db.create_web_link(&link1).unwrap();
        db.create_web_link(&link2).unwrap();

        let results = db.search_web_links(&workspace.id, "rust").unwrap();
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].title, "Rust Programming");
    }
}
