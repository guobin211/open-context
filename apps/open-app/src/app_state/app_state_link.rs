//! 网页链接状态管理模块
//!
//! 提供网页链接的 CRUD 操作。

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
    pub content: Option<String>,
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
            content: None,
            is_favorited: false,
            is_archived: false,
            visit_count: 0,
            last_visited_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

impl DatabaseManager {
    pub fn create_web_link(&self, link: &WebLink) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let tags_json = serde_json::to_string(&link.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "INSERT INTO web_links (id, workspace_id, title, url, description, favicon_url, thumbnail_url, tags, content, is_favorited, is_archived, visit_count, last_visited_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                link.id,
                link.workspace_id,
                link.title,
                link.url,
                link.description,
                link.favicon_url,
                link.thumbnail_url,
                tags_json,
                link.content,
                link.is_favorited as i32,
                link.is_archived as i32,
                link.visit_count,
                link.last_visited_at,
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
            "SELECT id, workspace_id, title, url, description, favicon_url, thumbnail_url, tags, content, is_favorited, is_archived, visit_count, last_visited_at, created_at, updated_at
             FROM web_links WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let tags_json: Option<String> = row.get(7)?;
            let tags: Vec<String> = tags_json
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();

            Ok(Some(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                thumbnail_url: row.get(6)?,
                tags,
                content: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                visit_count: row.get(11)?,
                last_visited_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_web_links(&self, workspace_id: &str) -> SqliteResult<Vec<WebLink>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, description, favicon_url, thumbnail_url, tags, content, is_favorited, is_archived, visit_count, last_visited_at, created_at, updated_at
             FROM web_links WHERE workspace_id = ?1 AND is_archived = 0 ORDER BY last_visited_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let tags_json: Option<String> = row.get(7)?;
            let tags: Vec<String> = tags_json
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();

            Ok(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                thumbnail_url: row.get(6)?,
                tags,
                content: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                visit_count: row.get(11)?,
                last_visited_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        rows.collect()
    }

    pub fn update_web_link(&self, link: &WebLink) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();
        let tags_json = serde_json::to_string(&link.tags).unwrap_or_else(|_| "[]".to_string());

        conn.execute(
            "UPDATE web_links SET title = ?1, url = ?2, description = ?3, favicon_url = ?4, thumbnail_url = ?5, tags = ?6, content = ?7, is_favorited = ?8, is_archived = ?9, visit_count = ?10, last_visited_at = ?11, updated_at = ?12 WHERE id = ?13",
            params![
                link.title,
                link.url,
                link.description,
                link.favicon_url,
                link.thumbnail_url,
                tags_json,
                link.content,
                link.is_favorited as i32,
                link.is_archived as i32,
                link.visit_count,
                link.last_visited_at,
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
            "SELECT id, workspace_id, title, url, description, favicon_url, thumbnail_url, tags, content, is_favorited, is_archived, visit_count, last_visited_at, created_at, updated_at
             FROM web_links
             WHERE workspace_id = ?1 AND is_archived = 0 AND (title LIKE ?2 OR url LIKE ?2 OR description LIKE ?2)
             ORDER BY last_visited_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id, search_pattern], |row| {
            let tags_json: Option<String> = row.get(7)?;
            let tags: Vec<String> = tags_json
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();

            Ok(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                thumbnail_url: row.get(6)?,
                tags,
                content: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                visit_count: row.get(11)?,
                last_visited_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        rows.collect()
    }

    pub fn increment_link_visit(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE web_links SET visit_count = visit_count + 1, last_visited_at = ?1, updated_at = ?1 WHERE id = ?2",
            params![now, id],
        )?;
        Ok(())
    }

    pub fn toggle_link_favorite(&self, id: &str, favorited: bool) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE web_links SET is_favorited = ?1, updated_at = ?2 WHERE id = ?3",
            params![favorited as i32, updated_at, id],
        )?;
        Ok(())
    }

    pub fn archive_link(&self, id: &str, archived: bool) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE web_links SET is_archived = ?1, updated_at = ?2 WHERE id = ?3",
            params![archived as i32, updated_at, id],
        )?;
        Ok(())
    }

    pub fn list_favorite_links(&self, workspace_id: &str) -> SqliteResult<Vec<WebLink>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, description, favicon_url, thumbnail_url, tags, content, is_favorited, is_archived, visit_count, last_visited_at, created_at, updated_at
             FROM web_links WHERE workspace_id = ?1 AND is_favorited = 1 AND is_archived = 0 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let tags_json: Option<String> = row.get(7)?;
            let tags: Vec<String> = tags_json
                .and_then(|s| serde_json::from_str(&s).ok())
                .unwrap_or_default();

            Ok(WebLink {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                description: row.get(4)?,
                favicon_url: row.get(5)?,
                thumbnail_url: row.get(6)?,
                tags,
                content: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                visit_count: row.get(11)?,
                last_visited_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        rows.collect()
    }
}
