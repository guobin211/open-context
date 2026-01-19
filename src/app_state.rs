use chrono::Utc;
use rusqlite::{Connection, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use uuid::Uuid;

use crate::app_config::AppConfig;

// ============================================================================
// Data Models
// ============================================================================

/// Workspace - contains multiple resources (notes, files, repos, links)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
    pub is_active: bool,
}

impl Workspace {
    pub fn new(name: String, description: Option<String>) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            name,
            description,
            created_at: now,
            updated_at: now,
            is_active: false,
        }
    }
}

/// Note types
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NoteType {
    RichText,
    Markdown,
    Code,
    Table,
    MindMap,
    Flowchart,
}

impl NoteType {
    pub fn as_str(&self) -> &str {
        match self {
            NoteType::RichText => "richtext",
            NoteType::Markdown => "markdown",
            NoteType::Code => "code",
            NoteType::Table => "table",
            NoteType::MindMap => "mindmap",
            NoteType::Flowchart => "flowchart",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "richtext" => Some(NoteType::RichText),
            "markdown" => Some(NoteType::Markdown),
            "code" => Some(NoteType::Code),
            "table" => Some(NoteType::Table),
            "mindmap" => Some(NoteType::MindMap),
            "flowchart" => Some(NoteType::Flowchart),
            _ => None,
        }
    }
}

/// Note - multi-modal notes (rich text, markdown, code, etc.)
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub note_type: NoteType,
    pub content: String,
    pub file_path: PathBuf,
    pub tags: Vec<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Note {
    pub fn new(
        workspace_id: String,
        title: String,
        note_type: NoteType,
        content: String,
        file_path: PathBuf,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            title,
            note_type,
            content,
            file_path,
            tags: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

/// Imported File
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportedFile {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_type: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
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
            name,
            original_path,
            stored_path,
            file_type,
            size_bytes,
            mime_type: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Imported Directory
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImportedDirectory {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_count: i32,
    pub total_size_bytes: i64,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ImportedDirectory {
    pub fn new(
        workspace_id: String,
        name: String,
        original_path: PathBuf,
        stored_path: PathBuf,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            name,
            original_path,
            stored_path,
            file_count: 0,
            total_size_bytes: 0,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Git Repository
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitRepository {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub remote_url: String,
    pub local_path: PathBuf,
    pub branch: String,
    pub last_commit_hash: Option<String>,
    pub last_synced_at: Option<i64>,
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
            branch,
            last_commit_hash: None,
            last_synced_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Web Link
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WebLink {
    pub id: String,
    pub workspace_id: String,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub favicon_url: Option<String>,
    pub tags: Vec<String>,
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
            tags: Vec::new(),
            created_at: now,
            updated_at: now,
        }
    }
}

// ============================================================================
// Database Manager
// ============================================================================

pub struct DatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl DatabaseManager {
    /// Create a new database manager
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        }

        let conn = Connection::open(db_path)?;
        let manager = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        manager.init_schema()?;
        Ok(manager)
    }

    /// Initialize database schema
    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

        // Workspaces table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                is_active INTEGER NOT NULL DEFAULT 0
            )",
            [],
        )?;

        // Notes table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                title TEXT NOT NULL,
                note_type TEXT NOT NULL,
                content TEXT NOT NULL,
                file_path TEXT NOT NULL,
                tags TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Imported files table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS imported_files (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                mime_type TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Imported directories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS imported_directories (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                file_count INTEGER NOT NULL DEFAULT 0,
                total_size_bytes INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Git repositories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS git_repositories (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                remote_url TEXT NOT NULL,
                local_path TEXT NOT NULL,
                branch TEXT NOT NULL,
                last_commit_hash TEXT,
                last_synced_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Web links table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS web_links (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                description TEXT,
                favicon_url TEXT,
                tags TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Create indexes for better query performance
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace
             ON notes(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_workspace
             ON imported_files(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_workspace
             ON imported_directories(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_repos_workspace
             ON git_repositories(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace
             ON web_links(workspace_id)",
            [],
        )?;

        Ok(())
    }

    /// Get a reference to the connection
    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
}

// ============================================================================
// AppState - Global Application State
// ============================================================================

/// Manages application global state
#[derive(Clone)]
pub struct AppState {
    db: Arc<DatabaseManager>,
    config: Arc<Mutex<AppConfig>>,
}

impl AppState {
    /// Create a new AppState instance
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = AppConfig::load()?;
        let db_path = AppConfig::config_dir().join("app_state.db");
        let db = DatabaseManager::new(db_path)?;

        Ok(Self {
            db: Arc::new(db),
            config: Arc::new(Mutex::new(config)),
        })
    }

    /// Get database manager
    pub fn db(&self) -> Arc<DatabaseManager> {
        Arc::clone(&self.db)
    }

    /// Get configuration
    pub fn config(&self) -> AppConfig {
        self.config.lock().unwrap().clone()
    }

    /// Update configuration
    pub fn update_config<F>(&self, f: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: FnOnce(&mut AppConfig) -> Result<(), Box<dyn std::error::Error>>,
    {
        let mut config = self.config.lock().unwrap();
        f(&mut config)?;
        config.save()?;
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new().expect("Failed to initialize AppState")
    }
}
