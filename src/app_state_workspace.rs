use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};

use crate::app_state::{DatabaseManager, Workspace};

impl DatabaseManager {
    pub fn create_workspace(&self, workspace: &Workspace) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, name, description, icon, color, sort_order, is_active, is_archived, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                workspace.id,
                workspace.name,
                workspace.description,
                workspace.icon,
                workspace.color,
                workspace.sort_order,
                workspace.is_active as i32,
                workspace.is_archived as i32,
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
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, created_at, updated_at
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
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_workspaces(&self) -> SqliteResult<Vec<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, created_at, updated_at
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
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
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
             SET name = ?1, description = ?2, icon = ?3, color = ?4, sort_order = ?5, is_active = ?6, is_archived = ?7, updated_at = ?8
             WHERE id = ?9",
            params![
                workspace.name,
                workspace.description,
                workspace.icon,
                workspace.color,
                workspace.sort_order,
                workspace.is_active as i32,
                workspace.is_archived as i32,
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
            "SELECT id, name, description, icon, color, sort_order, is_active, is_archived, created_at, updated_at
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
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn set_active_workspace(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("UPDATE workspaces SET is_active = 0", [])?;
        conn.execute("UPDATE workspaces SET is_active = 1 WHERE id = ?1", params![id])?;
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

    pub fn count_workspace_resources(&self, workspace_id: &str) -> SqliteResult<WorkspaceResourceCount> {
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

        Ok(WorkspaceResourceCount {
            notes: notes_count,
            files: files_count,
            directories: dirs_count,
            repositories: repos_count,
            links: links_count,
        })
    }
}

#[derive(Debug, Clone)]
pub struct WorkspaceResourceCount {
    pub notes: i32,
    pub files: i32,
    pub directories: i32,
    pub repositories: i32,
    pub links: i32,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_state::DatabaseManager;
    use std::env;

    fn setup_test_db() -> DatabaseManager {
        let test_db_path = env::temp_dir().join(format!("test_workspace_{}.db", uuid::Uuid::new_v4()));
        DatabaseManager::new(test_db_path).unwrap()
    }

    #[test]
    fn test_create_and_get_workspace() {
        let db = setup_test_db();
        let workspace = Workspace::new("Test Workspace".to_string(), Some("Test description".to_string()));

        db.create_workspace(&workspace).unwrap();
        let retrieved = db.get_workspace(&workspace.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, workspace.id);
        assert_eq!(retrieved.name, workspace.name);
    }

    #[test]
    fn test_list_workspaces() {
        let db = setup_test_db();

        let ws1 = Workspace::new("Workspace 1".to_string(), None);
        let ws2 = Workspace::new("Workspace 2".to_string(), None);

        db.create_workspace(&ws1).unwrap();
        db.create_workspace(&ws2).unwrap();

        let workspaces = db.list_workspaces().unwrap();
        assert_eq!(workspaces.len(), 2);
    }

    #[test]
    fn test_update_workspace() {
        let db = setup_test_db();
        let mut workspace = Workspace::new("Original Name".to_string(), None);

        db.create_workspace(&workspace).unwrap();

        workspace.name = "Updated Name".to_string();
        workspace.description = Some("New description".to_string());
        db.update_workspace(&workspace).unwrap();

        let updated = db.get_workspace(&workspace.id).unwrap().unwrap();
        assert_eq!(updated.name, "Updated Name");
        assert_eq!(updated.description, Some("New description".to_string()));
    }

    #[test]
    fn test_delete_workspace() {
        let db = setup_test_db();
        let workspace = Workspace::new("To Delete".to_string(), None);

        db.create_workspace(&workspace).unwrap();
        db.delete_workspace(&workspace.id).unwrap();

        let retrieved = db.get_workspace(&workspace.id).unwrap();
        assert!(retrieved.is_none());
    }

    #[test]
    fn test_active_workspace() {
        let db = setup_test_db();
        let ws1 = Workspace::new("Workspace 1".to_string(), None);
        let ws2 = Workspace::new("Workspace 2".to_string(), None);

        db.create_workspace(&ws1).unwrap();
        db.create_workspace(&ws2).unwrap();

        db.set_active_workspace(&ws1.id).unwrap();
        let active = db.get_active_workspace().unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().id, ws1.id);

        db.set_active_workspace(&ws2.id).unwrap();
        let active = db.get_active_workspace().unwrap();
        assert!(active.is_some());
        assert_eq!(active.unwrap().id, ws2.id);
    }
}
