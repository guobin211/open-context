use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct WorkspaceDatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl WorkspaceDatabaseManager {
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
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

    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

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

        conn.execute(
            "CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                task_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                progress INTEGER NOT NULL DEFAULT 0,
                message TEXT,
                result TEXT,
                error TEXT,
                retry_count INTEGER NOT NULL DEFAULT 0,
                max_retries INTEGER NOT NULL DEFAULT 3,
                retry_delay_ms INTEGER NOT NULL DEFAULT 1000,
                input TEXT,
                persistent INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                completed_at INTEGER
            )",
            [],
        )?;

        self.run_migrations(&conn)?;
        self.create_indexes(&conn)?;

        Ok(())
    }

    fn run_migrations(&self, conn: &Connection) -> SqliteResult<()> {
        // workspaces migrations
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN icon TEXT", []);
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN color TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE workspaces ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE workspaces ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );

        // notes migrations
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN parent_id TEXT", []);
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN summary TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE notes ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE notes ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE notes ADD COLUMN is_favorited INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE notes ADD COLUMN is_pinned INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE notes ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute("ALTER TABLE notes ADD COLUMN last_viewed_at INTEGER", []);

        // imported_files migrations
        let _ = conn.execute(
            "ALTER TABLE imported_files ADD COLUMN parent_directory_id TEXT",
            [],
        );
        let _ = conn.execute("ALTER TABLE imported_files ADD COLUMN checksum TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE imported_files ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );

        // imported_directories migrations
        let _ = conn.execute(
            "ALTER TABLE imported_directories ADD COLUMN parent_id TEXT",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE imported_directories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );

        // web_links migrations
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN thumbnail_url TEXT", []);
        let _ = conn.execute(
            "ALTER TABLE web_links ADD COLUMN is_favorited INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE web_links ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE web_links ADD COLUMN visit_count INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE web_links ADD COLUMN last_visited_at INTEGER",
            [],
        );

        Ok(())
    }

    fn create_indexes(&self, conn: &Connection) -> SqliteResult<()> {
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_workspaces_active ON workspaces(is_active)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_workspaces_archived ON workspaces(is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_workspaces_sort ON workspaces(sort_order)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(workspace_id, note_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_favorited ON notes(workspace_id, is_favorited)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_pinned ON notes(workspace_id, is_pinned)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_archived ON notes(workspace_id, is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(workspace_id, updated_at DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_viewed ON notes(workspace_id, last_viewed_at DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_workspace ON imported_files(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_parent ON imported_files(parent_directory_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_type ON imported_files(workspace_id, file_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_checksum ON imported_files(checksum)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_archived ON imported_files(workspace_id, is_archived)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_workspace ON imported_directories(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_parent ON imported_directories(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_archived ON imported_directories(workspace_id, is_archived)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace ON web_links(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_favorited ON web_links(workspace_id, is_favorited)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_archived ON web_links(workspace_id, is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_visited ON web_links(workspace_id, last_visited_at DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_url ON web_links(url)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(task_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_persistent ON tasks(persistent)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)",
            [],
        )?;

        Ok(())
    }

    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
}
