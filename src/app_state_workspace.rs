use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};

use crate::app_state::{DatabaseManager, Workspace};

/// Workspace management operations
impl DatabaseManager {
    /// Create a new workspace
    pub fn create_workspace(&self, workspace: &Workspace) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO workspaces (id, name, description, created_at, updated_at, is_active)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
            params![
                workspace.id,
                workspace.name,
                workspace.description,
                workspace.created_at,
                workspace.updated_at,
                workspace.is_active as i32,
            ],
        )?;
        Ok(())
    }

    /// Get workspace by ID
    pub fn get_workspace(&self, id: &str) -> SqliteResult<Option<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at, is_active
             FROM workspaces WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                is_active: row.get::<_, i32>(5)? != 0,
            }))
        } else {
            Ok(None)
        }
    }

    /// List all workspaces
    pub fn list_workspaces(&self) -> SqliteResult<Vec<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at, is_active
             FROM workspaces ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map([], |row| {
            Ok(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                is_active: row.get::<_, i32>(5)? != 0,
            })
        })?;

        let mut workspaces = Vec::new();
        for workspace in rows {
            workspaces.push(workspace?);
        }
        Ok(workspaces)
    }

    /// Update workspace
    pub fn update_workspace(&self, workspace: &Workspace) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE workspaces
             SET name = ?1, description = ?2, updated_at = ?3, is_active = ?4
             WHERE id = ?5",
            params![
                workspace.name,
                workspace.description,
                updated_at,
                workspace.is_active as i32,
                workspace.id,
            ],
        )?;
        Ok(())
    }

    /// Delete workspace
    pub fn delete_workspace(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Get active workspace
    pub fn get_active_workspace(&self) -> SqliteResult<Option<Workspace>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, description, created_at, updated_at, is_active
             FROM workspaces WHERE is_active = 1 LIMIT 1",
        )?;

        let mut rows = stmt.query([])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Workspace {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                is_active: true,
            }))
        } else {
            Ok(None)
        }
    }

    /// Set active workspace (deactivates all others)
    pub fn set_active_workspace(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        // Deactivate all workspaces
        conn.execute("UPDATE workspaces SET is_active = 0", [])?;

        // Activate the specified workspace
        conn.execute(
            "UPDATE workspaces SET is_active = 1 WHERE id = ?1",
            params![id],
        )?;

        Ok(())
    }

    /// Count resources in a workspace
    pub fn count_workspace_resources(
        &self,
        workspace_id: &str,
    ) -> SqliteResult<WorkspaceResourceCount> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        let notes_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM notes WHERE workspace_id = ?1",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let files_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM imported_files WHERE workspace_id = ?1",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let dirs_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM imported_directories WHERE workspace_id = ?1",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let repos_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM git_repositories WHERE workspace_id = ?1",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let links_count: i32 = conn.query_row(
            "SELECT COUNT(*) FROM web_links WHERE workspace_id = ?1",
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

/// Workspace resource count
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
        let test_db_path =
            env::temp_dir().join(format!("test_workspace_{}.db", uuid::Uuid::new_v4()));
        DatabaseManager::new(test_db_path).unwrap()
    }

    #[test]
    fn test_create_and_get_workspace() {
        let db = setup_test_db();
        let workspace = Workspace::new(
            "Test Workspace".to_string(),
            Some("Test description".to_string()),
        );

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
