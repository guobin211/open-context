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
            created_at: now,
            updated_at: now,
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
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub workspace_id: String,
    pub parent_id: Option<String>,
    pub title: String,
    pub note_type: NoteType,
    pub content: String,
    pub summary: Option<String>,
    pub file_path: PathBuf,
    pub tags: Vec<String>,
    pub word_count: i32,
    pub sort_order: i32,
    pub is_favorited: bool,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub last_viewed_at: Option<i64>,
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
        let word_count = content.split_whitespace().count() as i32;
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            parent_id: None,
            title,
            note_type,
            content,
            summary: None,
            file_path,
            tags: Vec::new(),
            word_count,
            sort_order: 0,
            is_favorited: false,
            is_pinned: false,
            is_archived: false,
            last_viewed_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Imported File
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

/// Imported Directory
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedDirectory {
    pub id: String,
    pub workspace_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_count: i32,
    pub total_size_bytes: i64,
    pub is_archived: bool,
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
            parent_id: None,
            name,
            original_path,
            stored_path,
            file_count: 0,
            total_size_bytes: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Clone status for Git repository
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum CloneStatus {
    Pending,
    Cloning,
    Cloned,
    Failed,
}

impl CloneStatus {
    pub fn as_str(&self) -> &str {
        match self {
            CloneStatus::Pending => "pending",
            CloneStatus::Cloning => "cloning",
            CloneStatus::Cloned => "cloned",
            CloneStatus::Failed => "failed",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "pending" => Some(CloneStatus::Pending),
            "cloning" => Some(CloneStatus::Cloning),
            "cloned" => Some(CloneStatus::Cloned),
            "failed" => Some(CloneStatus::Failed),
            _ => None,
        }
    }
}

/// Index status for Git repository
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum IndexStatus {
    NotIndexed,
    Indexing,
    Indexed,
    Failed,
    Outdated,
}

impl IndexStatus {
    pub fn as_str(&self) -> &str {
        match self {
            IndexStatus::NotIndexed => "not_indexed",
            IndexStatus::Indexing => "indexing",
            IndexStatus::Indexed => "indexed",
            IndexStatus::Failed => "failed",
            IndexStatus::Outdated => "outdated",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "not_indexed" => Some(IndexStatus::NotIndexed),
            "indexing" => Some(IndexStatus::Indexing),
            "indexed" => Some(IndexStatus::Indexed),
            "failed" => Some(IndexStatus::Failed),
            "outdated" => Some(IndexStatus::Outdated),
            _ => None,
        }
    }
}

/// Git Repository
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitRepository {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub remote_url: String,
    pub local_path: PathBuf,
    pub branch: String,
    pub default_branch: Option<String>,
    pub last_commit_hash: Option<String>,
    pub last_synced_at: Option<i64>,
    pub clone_status: CloneStatus,
    pub clone_progress: i32,
    pub index_status: IndexStatus,
    pub indexed_at: Option<i64>,
    pub file_count: i32,
    pub is_archived: bool,
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
            branch: branch.clone(),
            default_branch: Some(branch),
            last_commit_hash: None,
            last_synced_at: None,
            clone_status: CloneStatus::Pending,
            clone_progress: 0,
            index_status: IndexStatus::NotIndexed,
            indexed_at: None,
            file_count: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Web Link
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
                icon TEXT,
                color TEXT,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Notes table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                parent_id TEXT,
                title TEXT NOT NULL,
                note_type TEXT NOT NULL,
                content TEXT NOT NULL,
                summary TEXT,
                file_path TEXT NOT NULL,
                tags TEXT,
                word_count INTEGER NOT NULL DEFAULT 0,
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_favorited INTEGER NOT NULL DEFAULT 0,
                is_pinned INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                last_viewed_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES notes(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Imported files table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS imported_files (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                parent_directory_id TEXT,
                name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                file_type TEXT NOT NULL,
                size_bytes INTEGER NOT NULL,
                mime_type TEXT,
                checksum TEXT,
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_directory_id) REFERENCES imported_directories(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // Imported directories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS imported_directories (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                parent_id TEXT,
                name TEXT NOT NULL,
                original_path TEXT NOT NULL,
                stored_path TEXT NOT NULL,
                file_count INTEGER NOT NULL DEFAULT 0,
                total_size_bytes INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                FOREIGN KEY (parent_id) REFERENCES imported_directories(id) ON DELETE SET NULL
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
                default_branch TEXT,
                last_commit_hash TEXT,
                last_synced_at INTEGER,
                clone_status TEXT NOT NULL DEFAULT 'pending',
                clone_progress INTEGER NOT NULL DEFAULT 0,
                index_status TEXT NOT NULL DEFAULT 'not_indexed',
                indexed_at INTEGER,
                file_count INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
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
                thumbnail_url TEXT,
                tags TEXT,
                is_favorited INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                visit_count INTEGER NOT NULL DEFAULT 0,
                last_visited_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // Run migrations for existing databases
        self.run_migrations(&conn)?;

        // Create indexes for better query performance
        self.create_indexes(&conn)?;

        Ok(())
    }

    /// Run database migrations for existing databases
    fn run_migrations(&self, conn: &Connection) -> SqliteResult<()> {
        // workspaces migrations
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN icon TEXT", []);
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN color TEXT", []);
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);

        // notes migrations
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN parent_id TEXT", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN summary TEXT", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN is_favorited INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN last_viewed_at INTEGER", []);

        // imported_files migrations
        let _ = conn.execute("ALTER TABLE imported_files ADD COLUMN parent_directory_id TEXT", []);
        let _ = conn.execute("ALTER TABLE imported_files ADD COLUMN checksum TEXT", []);
        let _ = conn.execute("ALTER TABLE imported_files ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);

        // imported_directories migrations
        let _ = conn.execute("ALTER TABLE imported_directories ADD COLUMN parent_id TEXT", []);
        let _ = conn.execute("ALTER TABLE imported_directories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);

        // git_repositories migrations
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN default_branch TEXT", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN clone_status TEXT NOT NULL DEFAULT 'pending'", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN clone_progress INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN index_status TEXT NOT NULL DEFAULT 'not_indexed'", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN indexed_at INTEGER", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN file_count INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE git_repositories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);

        // web_links migrations
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN thumbnail_url TEXT", []);
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN is_favorited INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN visit_count INTEGER NOT NULL DEFAULT 0", []);
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN last_visited_at INTEGER", []);

        Ok(())
    }

    /// Create database indexes
    fn create_indexes(&self, conn: &Connection) -> SqliteResult<()> {
        // Workspaces indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_workspaces_active ON workspaces(is_active)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_workspaces_archived ON workspaces(is_archived)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_workspaces_sort ON workspaces(sort_order)", [])?;

        // Notes indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(workspace_id, note_type)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_favorited ON notes(workspace_id, is_favorited)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(workspace_id, is_pinned)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(workspace_id, is_archived)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(workspace_id, updated_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_notes_viewed ON notes(workspace_id, last_viewed_at DESC)", [])?;

        // Imported files indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_workspace ON imported_files(workspace_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_parent ON imported_files(parent_directory_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_type ON imported_files(workspace_id, file_type)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_checksum ON imported_files(checksum)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_files_archived ON imported_files(workspace_id, is_archived)", [])?;

        // Imported directories indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dirs_workspace ON imported_directories(workspace_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dirs_parent ON imported_directories(parent_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_dirs_archived ON imported_directories(workspace_id, is_archived)", [])?;

        // Git repositories indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_workspace ON git_repositories(workspace_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_clone_status ON git_repositories(clone_status)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_index_status ON git_repositories(index_status)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_repos_archived ON git_repositories(workspace_id, is_archived)", [])?;

        // Web links indexes
        conn.execute("CREATE INDEX IF NOT EXISTS idx_links_workspace ON web_links(workspace_id)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_links_favorited ON web_links(workspace_id, is_favorited)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_links_archived ON web_links(workspace_id, is_archived)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_links_visited ON web_links(workspace_id, last_visited_at DESC)", [])?;
        conn.execute("CREATE INDEX IF NOT EXISTS idx_links_url ON web_links(url)", [])?;

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
