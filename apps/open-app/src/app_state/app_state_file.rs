use chrono::Utc;
use rusqlite::{Result as SqliteResult, params};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

use crate::app_state::{DatabaseManager, ImportedDirectory};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedFile {
    pub id: String,
    pub workspace_id: String,
    pub parent_directory_id: Option<String>,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_type: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
    pub checksum: Option<String>,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ImportedFile {
    pub fn new(
        workspace_id: String,
        name: String,
        original_path: PathBuf,
        stored_path: PathBuf,
        file_type: String,
        size_bytes: i64,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            parent_directory_id: None,
            name,
            original_path,
            stored_path,
            file_type,
            size_bytes,
            mime_type: None,
            checksum: None,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone)]
pub struct StorageStats {
    pub files_count: i32,
    pub directories_count: i32,
    pub total_files_size_bytes: i64,
    pub total_directories_size_bytes: i64,
    pub total_size_bytes: i64,
}

/// File management operations
impl DatabaseManager {
    /// Create imported file record
    pub fn create_imported_file(&self, file: &ImportedFile) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO imported_files
             (id, workspace_id, name, original_path, stored_path, file_type, size_bytes, mime_type, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                file.id,
                file.workspace_id,
                file.name,
                file.original_path.to_str().unwrap(),
                file.stored_path.to_str().unwrap(),
                file.file_type,
                file.size_bytes,
                file.mime_type,
                file.created_at,
                file.updated_at,
            ],
        )?;
        Ok(())
    }

    /// Get imported file by ID
    pub fn get_imported_file(&self, id: &str) -> SqliteResult<Option<ImportedFile>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, original_path, stored_path, file_type, size_bytes, mime_type, created_at, updated_at
             FROM imported_files WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ImportedFile {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_directory_id: None,
                name: row.get(2)?,
                original_path: std::path::PathBuf::from(row.get::<_, String>(3)?),
                stored_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                file_type: row.get(5)?,
                size_bytes: row.get(6)?,
                mime_type: row.get(7)?,
                checksum: None,
                is_archived: false,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List imported files in workspace
    pub fn list_imported_files(&self, workspace_id: &str) -> SqliteResult<Vec<ImportedFile>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, original_path, stored_path, file_type, size_bytes, mime_type, created_at, updated_at
             FROM imported_files WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(ImportedFile {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_directory_id: None,
                name: row.get(2)?,
                original_path: std::path::PathBuf::from(row.get::<_, String>(3)?),
                stored_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                file_type: row.get(5)?,
                size_bytes: row.get(6)?,
                mime_type: row.get(7)?,
                checksum: None,
                is_archived: false,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut files = Vec::new();
        for file in rows {
            files.push(file?);
        }
        Ok(files)
    }

    /// Delete imported file
    pub fn delete_imported_file(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM imported_files WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Update imported file metadata
    pub fn update_imported_file(&self, file: &ImportedFile) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE imported_files
             SET name = ?1, file_type = ?2, mime_type = ?3, updated_at = ?4
             WHERE id = ?5",
            params![
                file.name,
                file.file_type,
                file.mime_type,
                updated_at,
                file.id,
            ],
        )?;
        Ok(())
    }
}

/// Directory management operations
impl DatabaseManager {
    /// Create imported directory record
    pub fn create_imported_directory(&self, dir: &ImportedDirectory) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO imported_directories
             (id, workspace_id, name, original_path, stored_path, file_count, total_size_bytes, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
            params![
                dir.id,
                dir.workspace_id,
                dir.name,
                dir.original_path.to_str().unwrap(),
                dir.stored_path.to_str().unwrap(),
                dir.file_count,
                dir.total_size_bytes,
                dir.created_at,
                dir.updated_at,
            ],
        )?;
        Ok(())
    }

    /// Get imported directory by ID
    pub fn get_imported_directory(&self, id: &str) -> SqliteResult<Option<ImportedDirectory>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, original_path, stored_path, file_count, total_size_bytes, created_at, updated_at
             FROM imported_directories WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(ImportedDirectory {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                name: row.get(2)?,
                original_path: std::path::PathBuf::from(row.get::<_, String>(3)?),
                stored_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                file_count: row.get(5)?,
                total_size_bytes: row.get(6)?,
                is_archived: false,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List imported directories in workspace
    pub fn list_imported_directories(
        &self,
        workspace_id: &str,
    ) -> SqliteResult<Vec<ImportedDirectory>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, original_path, stored_path, file_count, total_size_bytes, created_at, updated_at
             FROM imported_directories WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(ImportedDirectory {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                name: row.get(2)?,
                original_path: std::path::PathBuf::from(row.get::<_, String>(3)?),
                stored_path: std::path::PathBuf::from(row.get::<_, String>(4)?),
                file_count: row.get(5)?,
                total_size_bytes: row.get(6)?,
                is_archived: false,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        })?;

        let mut directories = Vec::new();
        for dir in rows {
            directories.push(dir?);
        }
        Ok(directories)
    }

    /// Update imported directory statistics
    pub fn update_imported_directory(&self, dir: &ImportedDirectory) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE imported_directories
             SET name = ?1, file_count = ?2, total_size_bytes = ?3, updated_at = ?4
             WHERE id = ?5",
            params![
                dir.name,
                dir.file_count,
                dir.total_size_bytes,
                updated_at,
                dir.id,
            ],
        )?;
        Ok(())
    }

    /// Delete imported directory
    pub fn delete_imported_directory(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "DELETE FROM imported_directories WHERE id = ?1",
            params![id],
        )?;
        Ok(())
    }

    /// Get total storage used by workspace
    pub fn get_workspace_storage_stats(&self, workspace_id: &str) -> SqliteResult<StorageStats> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();

        let files_size: i64 = conn.query_row(
            "SELECT COALESCE(SUM(size_bytes), 0) FROM imported_files WHERE workspace_id = ?1",
            params![workspace_id],
            |row| row.get(0),
        )?;

        let dirs_size: i64 = conn.query_row(
            "SELECT COALESCE(SUM(total_size_bytes), 0) FROM imported_directories WHERE workspace_id = ?1",
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

        Ok(StorageStats {
            files_count,
            directories_count: dirs_count,
            total_files_size_bytes: files_size,
            total_directories_size_bytes: dirs_size,
            total_size_bytes: files_size + dirs_size,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_state::{ImportedDirectory, Workspace};
    use std::env;

    fn setup_test_db() -> (DatabaseManager, Workspace) {
        let test_db_path = env::temp_dir().join(format!("test_files_{}.db", uuid::Uuid::new_v4()));
        let db = DatabaseManager::new(test_db_path).unwrap();

        let workspace = Workspace::new("Test Workspace".to_string(), None);
        db.create_workspace(&workspace).unwrap();

        (db, workspace)
    }

    #[test]
    fn test_create_and_get_file() {
        let (db, workspace) = setup_test_db();
        let file = ImportedFile::new(
            workspace.id.clone(),
            "test.pdf".to_string(),
            std::path::PathBuf::from("/original/test.pdf"),
            std::path::PathBuf::from("/stored/test.pdf"),
            "pdf".to_string(),
            1024000,
        );

        db.create_imported_file(&file).unwrap();
        let retrieved = db.get_imported_file(&file.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, file.id);
        assert_eq!(retrieved.name, "test.pdf");
    }

    #[test]
    fn test_create_and_get_directory() {
        let (db, workspace) = setup_test_db();
        let mut dir = ImportedDirectory::new(
            workspace.id.clone(),
            "my-folder".to_string(),
            std::path::PathBuf::from("/original/my-folder"),
            std::path::PathBuf::from("/stored/my-folder"),
        );
        dir.file_count = 10;
        dir.total_size_bytes = 5000000;

        db.create_imported_directory(&dir).unwrap();
        let retrieved = db.get_imported_directory(&dir.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.file_count, 10);
        assert_eq!(retrieved.total_size_bytes, 5000000);
    }

    #[test]
    fn test_storage_stats() {
        let (db, workspace) = setup_test_db();

        let file1 = ImportedFile::new(
            workspace.id.clone(),
            "file1.txt".to_string(),
            std::path::PathBuf::from("/file1.txt"),
            std::path::PathBuf::from("/stored/file1.txt"),
            "txt".to_string(),
            1000,
        );
        let file2 = ImportedFile::new(
            workspace.id.clone(),
            "file2.txt".to_string(),
            std::path::PathBuf::from("/file2.txt"),
            std::path::PathBuf::from("/stored/file2.txt"),
            "txt".to_string(),
            2000,
        );

        db.create_imported_file(&file1).unwrap();
        db.create_imported_file(&file2).unwrap();

        let stats = db.get_workspace_storage_stats(&workspace.id).unwrap();
        assert_eq!(stats.files_count, 2);
        assert_eq!(stats.total_files_size_bytes, 3000);
    }
}
