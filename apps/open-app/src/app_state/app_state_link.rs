use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WebLink {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub favicon_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub tags: Vec<String>,
    pub is_favorited: bool,
    pub is_archived: bool,
    pub visit_count: i32,
    pub last_visited_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl WebLink {
    pub fn new(workspace_id: String, title: String, url: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            title,
            url,
            description: None,
            favicon_url: None,
            thumbnail_url: None,
            tags: Vec::new(),
            is_favorited: false,
            is_archived: false,
            visit_count: 0,
            last_visited_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Web link management operations
impl DatabaseManager {
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
                thumbnail_url: None,
                tags,
                is_favorited: false,
                is_archived: false,
                visit_count: 0,
                last_visited_at: None,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

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
                thumbnail_url: None,
                tags,
                is_favorited: false,
                is_archived: false,
                visit_count: 0,
                last_visited_at: None,
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

    pub fn delete_web_link(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM web_links WHERE id = ?1", params![id])?;
        Ok(())
    }

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
                thumbnail_url: None,
                tags,
                is_favorited: false,
                is_archived: false,
                visit_count: 0,
                last_visited_at: None,
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
    use crate::app_state::Workspace;
    use std::env;

    fn setup_test_db() -> (DatabaseManager, Workspace) {
        let test_db_path = env::temp_dir().join(format!("test_link_{}.db", uuid::Uuid::new_v4()));
        let db = DatabaseManager::new(test_db_path).unwrap();

        let workspace = Workspace::new("Test Workspace".to_string(), None);
        db.create_workspace(&workspace).unwrap();

        (db, workspace)
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
