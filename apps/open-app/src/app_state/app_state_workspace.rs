//! 工作空间状态管理模块
//!
//! 提供工作空间的 CRUD 操作和资源统计功能。

use chrono::Utc;
use rusqlite::{params, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub icon: Option<String>,
    pub color: Option<String>,
    pub sort_order: i32,
    pub is_active: bool,
    pub is_archived: bool,
    pub settings: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Workspace {
    pub fn new(name: String, description: Option<String>) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            icon: None,
            color: None,
            sort_order: 0,
            is_active: false,
            is_archived: false,
            settings: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceResourceCount {
    pub notes: i32,
    pub files: i32,
    pub directories: i32,
    pub repositories: i32,
    pub links: i32,
    pub conversations: i32,
    pub terminals: i32,
    pub webviews: i32,
    pub chats: i32,
}

impl DatabaseManager {
    pub fn create_workspace(&self, workspace: &Workspace) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, name, description, icon, color, sort_order, is_active, is_archived, settings, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)",
            params![
                workspace.id,
                workspace.name,
                workspace.description,
                workspace.icon,
                workspace.color,
                workspace.sort_order,
                workspace.is_active as i32,
                workspace.is_archived as i32,
                workspace.settings,
                workspace.created_at,
                workspace.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_workspace(&self, id: &str) -> SqliteResult<Option<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, settings, created_at, updated_at
             FROM workspaces WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                sort_order: row.get(5)?,
                is_active: row.get::<_, i32>(6)? != 0,
                is_archived: row.get::<_, i32>(7)? != 0,
                settings: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_workspaces(&self) -> SqliteResult<Vec<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, settings, created_at, updated_at
             FROM workspaces WHERE is_archived = 0 ORDER BY sort_order ASC, updated_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                sort_order: row.get(5)?,
                is_active: row.get::<_, i32>(6)? != 0,
                is_archived: row.get::<_, i32>(7)? != 0,
                settings: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;

        let mut workspaces = Vec::new();
        for workspace in rows {
            workspaces.push(workspace?);
        }
        Ok(workspaces)
    }

    pub fn update_workspace(&self, workspace: &Workspace) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE workspaces
             SET name = ?1, description = ?2, icon = ?3, color = ?4, sort_order = ?5, is_active = ?6, is_archived = ?7, settings = ?8, updated_at = ?9
             WHERE id = ?10",
            params![
                workspace.name,
                workspace.description,
                workspace.icon,
                workspace.color,
                workspace.sort_order,
                workspace.is_active as i32,
                workspace.is_archived as i32,
                workspace.settings,
                updated_at,
                workspace.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_workspace(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn get_active_workspace(&self) -> SqliteResult<Option<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, settings, created_at, updated_at
             FROM workspaces WHERE is_active = 1 LIMIT 1",
        )?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                icon: row.get(3)?,
                color: row.get(4)?,
                sort_order: row.get(5)?,
                is_active: true,
                is_archived: row.get::<_, i32>(7)? != 0,
                settings: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn set_active_workspace(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("UPDATE workspaces SET is_active = 0", [])?;
        conn.execute(
            "UPDATE workspaces SET is_active = 1 WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    pub fn archive_workspace(&self, id: &str, archived: bool) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();
        conn.execute(
            "UPDATE workspaces SET is_archived = ?1, updated_at = ?2 WHERE id = ?3",
            params![archived as i32, updated_at, id],
        )?;
        Ok(())
    }

    pub fn count_workspace_resources(
        &self,
        workspace_id: &str,
    ) -> SqliteResult<WorkspaceResourceCount> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        let notes_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM notes WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let files_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM imported_files WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let dirs_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM imported_directories WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let repos_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM git_repositories WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let links_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM web_links WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let conversations_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM conversations WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let terminals_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM terminals WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let webviews_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM webviews WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let chats_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM chats WHERE workspace_id = ?1 AND is_archived = 0",
            params![workspace_id],
            |row| row.get(0),
        )?;

        Ok(WorkspaceResourceCount {
            notes: notes_count,
            files: files_count,
            directories: dirs_count,
            repositories: repos_count,
            links: links_count,
            conversations: conversations_count,
            terminals: terminals_count,
            webviews: webviews_count,
            chats: chats_count,
        })
    }
}
