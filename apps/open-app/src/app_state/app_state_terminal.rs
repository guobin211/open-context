//! 终端会话状态管理模块
//!
//! 提供终端会话的 CRUD 操作。

use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Terminal {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub shell: String,
    pub cwd: String,
    pub env: Option<String>,
    pub history: String,
    pub history_count: i32,
    pub is_active: bool,
    pub is_archived: bool,
    pub last_command_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Terminal {
    pub fn new(workspace_id: String, name: String, shell: String, cwd: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            name,
            shell,
            cwd,
            env: None,
            history: "[]".to_string(),
            history_count: 0,
            is_active: false,
            is_archived: false,
            last_command_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

impl DatabaseManager {
    pub fn create_terminal(&self, terminal: &Terminal) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO terminals (id, workspace_id, name, shell, cwd, env, history, history_count, is_active, is_archived, last_command_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            params![
                terminal.id,
                terminal.workspace_id,
                terminal.name,
                terminal.shell,
                terminal.cwd,
                terminal.env,
                terminal.history,
                terminal.history_count,
                terminal.is_active as i32,
                terminal.is_archived as i32,
                terminal.last_command_at,
                terminal.created_at,
                terminal.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_terminal(&self, id: &str) -> SqliteResult<Option<Terminal>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, shell, cwd, env, history, history_count, is_active, is_archived, last_command_at, created_at, updated_at
             FROM terminals WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Terminal {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                shell: row.get(3)?,
                cwd: row.get(4)?,
                env: row.get(5)?,
                history: row.get(6)?,
                history_count: row.get(7)?,
                is_active: row.get::<_, i32>(8)? != 0,
                is_archived: row.get::<_, i32>(9)? != 0,
                last_command_at: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_terminals_by_workspace(&self, workspace_id: &str) -> SqliteResult<Vec<Terminal>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, shell, cwd, env, history, history_count, is_active, is_archived, last_command_at, created_at, updated_at
             FROM terminals WHERE workspace_id = ?1 AND is_archived = 0 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(Terminal {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                shell: row.get(3)?,
                cwd: row.get(4)?,
                env: row.get(5)?,
                history: row.get(6)?,
                history_count: row.get(7)?,
                is_active: row.get::<_, i32>(8)? != 0,
                is_archived: row.get::<_, i32>(9)? != 0,
                last_command_at: row.get(10)?,
                created_at: row.get(11)?,
                updated_at: row.get(12)?,
            })
        })?;

        rows.collect()
    }

    pub fn update_terminal(&self, terminal: &Terminal) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE terminals SET name = ?1, shell = ?2, cwd = ?3, env = ?4, history = ?5, history_count = ?6, is_active = ?7, is_archived = ?8, last_command_at = ?9, updated_at = ?10 WHERE id = ?11",
            params![
                terminal.name,
                terminal.shell,
                terminal.cwd,
                terminal.env,
                terminal.history,
                terminal.history_count,
                terminal.is_active as i32,
                terminal.is_archived as i32,
                terminal.last_command_at,
                updated_at,
                terminal.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_terminal(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM terminals WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn set_active_terminal(&self, workspace_id: &str, terminal_id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        // 取消当前工作区所有终端的活跃状态
        conn.execute(
            "UPDATE terminals SET is_active = 0 WHERE workspace_id = ?1",
            params![workspace_id],
        )?;
        // 设置指定终端为活跃
        conn.execute(
            "UPDATE terminals SET is_active = 1 WHERE id = ?1",
            params![terminal_id],
        )?;
        Ok(())
    }

    pub fn update_terminal_cwd(&self, id: &str, cwd: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE terminals SET cwd = ?1, updated_at = ?2 WHERE id = ?3",
            params![cwd, updated_at, id],
        )?;
        Ok(())
    }

    pub fn append_terminal_history(
        &self,
        id: &str,
        history: &str,
        history_count: i32,
    ) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE terminals SET history = ?1, history_count = ?2, last_command_at = ?3, updated_at = ?3 WHERE id = ?4",
            params![history, history_count, now, id],
        )?;
        Ok(())
    }
}
