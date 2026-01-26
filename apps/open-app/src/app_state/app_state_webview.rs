//! 网页视图状态管理模块
//!
//! 提供网页视图的 CRUD 操作。

use chrono::Utc;
use rusqlite::{params, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Webview {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub url: String,
    pub favicon_url: Option<String>,
    pub history: String,
    pub is_loading: bool,
    pub is_active: bool,
    pub is_archived: bool,
    pub scroll_x: i32,
    pub scroll_y: i32,
    pub zoom_level: f64,
    pub last_active_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Webview {
    pub fn new(workspace_id: String, title: String, url: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            title,
            url,
            favicon_url: None,
            history: "[]".to_string(),
            is_loading: false,
            is_active: false,
            is_archived: false,
            scroll_x: 0,
            scroll_y: 0,
            zoom_level: 1.0,
            last_active_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

impl DatabaseManager {
    pub fn create_webview(&self, webview: &Webview) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO webviews (id, workspace_id, title, url, favicon_url, history, is_loading, is_active, is_archived, scroll_x, scroll_y, zoom_level, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)",
            params![
                webview.id,
                webview.workspace_id,
                webview.title,
                webview.url,
                webview.favicon_url,
                webview.history,
                webview.is_loading as i32,
                webview.is_active as i32,
                webview.is_archived as i32,
                webview.scroll_x,
                webview.scroll_y,
                webview.zoom_level,
                webview.last_active_at,
                webview.created_at,
                webview.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_webview(&self, id: &str) -> SqliteResult<Option<Webview>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, favicon_url, history, is_loading, is_active, is_archived, scroll_x, scroll_y, zoom_level, last_active_at, created_at, updated_at
             FROM webviews WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Webview {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                favicon_url: row.get(4)?,
                history: row.get(5)?,
                is_loading: row.get::<_, i32>(6)? != 0,
                is_active: row.get::<_, i32>(7)? != 0,
                is_archived: row.get::<_, i32>(8)? != 0,
                scroll_x: row.get(9)?,
                scroll_y: row.get(10)?,
                zoom_level: row.get(11)?,
                last_active_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_webviews_by_workspace(&self, workspace_id: &str) -> SqliteResult<Vec<Webview>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, url, favicon_url, history, is_loading, is_active, is_archived, scroll_x, scroll_y, zoom_level, last_active_at, created_at, updated_at
             FROM webviews WHERE workspace_id = ?1 AND is_archived = 0 ORDER BY last_active_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(Webview {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                title: row.get(2)?,
                url: row.get(3)?,
                favicon_url: row.get(4)?,
                history: row.get(5)?,
                is_loading: row.get::<_, i32>(6)? != 0,
                is_active: row.get::<_, i32>(7)? != 0,
                is_archived: row.get::<_, i32>(8)? != 0,
                scroll_x: row.get(9)?,
                scroll_y: row.get(10)?,
                zoom_level: row.get(11)?,
                last_active_at: row.get(12)?,
                created_at: row.get(13)?,
                updated_at: row.get(14)?,
            })
        })?;

        rows.collect()
    }

    pub fn update_webview(&self, webview: &Webview) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE webviews SET title = ?1, url = ?2, favicon_url = ?3, history = ?4, is_loading = ?5, is_active = ?6, is_archived = ?7, scroll_x = ?8, scroll_y = ?9, zoom_level = ?10, last_active_at = ?11, updated_at = ?12 WHERE id = ?13",
            params![
                webview.title,
                webview.url,
                webview.favicon_url,
                webview.history,
                webview.is_loading as i32,
                webview.is_active as i32,
                webview.is_archived as i32,
                webview.scroll_x,
                webview.scroll_y,
                webview.zoom_level,
                webview.last_active_at,
                updated_at,
                webview.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_webview(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM webviews WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn set_active_webview(&self, workspace_id: &str, webview_id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        // 取消当前工作区所有网页视图的活跃状态
        conn.execute(
            "UPDATE webviews SET is_active = 0 WHERE workspace_id = ?1",
            params![workspace_id],
        )?;
        // 设置指定网页视图为活跃
        conn.execute(
            "UPDATE webviews SET is_active = 1, last_active_at = ?1 WHERE id = ?2",
            params![now, webview_id],
        )?;
        Ok(())
    }

    pub fn update_webview_url(&self, id: &str, url: &str, title: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE webviews SET url = ?1, title = ?2, updated_at = ?3 WHERE id = ?4",
            params![url, title, updated_at, id],
        )?;
        Ok(())
    }

    pub fn update_webview_scroll(&self, id: &str, scroll_x: i32, scroll_y: i32) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        conn.execute(
            "UPDATE webviews SET scroll_x = ?1, scroll_y = ?2 WHERE id = ?3",
            params![scroll_x, scroll_y, id],
        )?;
        Ok(())
    }

    pub fn update_webview_zoom(&self, id: &str, zoom_level: f64) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        conn.execute(
            "UPDATE webviews SET zoom_level = ?1 WHERE id = ?2",
            params![zoom_level, id],
        )?;
        Ok(())
    }

    pub fn set_webview_loading(&self, id: &str, is_loading: bool) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        conn.execute(
            "UPDATE webviews SET is_loading = ?1 WHERE id = ?2",
            params![is_loading as i32, id],
        )?;
        Ok(())
    }
}
