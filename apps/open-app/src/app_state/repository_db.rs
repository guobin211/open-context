use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct RepositoryDatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl RepositoryDatabaseManager {
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
                symbol_count INTEGER NOT NULL DEFAULT 0,
                vector_count INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS index_jobs (
                id TEXT PRIMARY KEY,
                repo_id TEXT NOT NULL,
                job_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                progress INTEGER NOT NULL DEFAULT 0,
                total_files INTEGER,
                processed_files INTEGER NOT NULL DEFAULT 0,
                total_symbols INTEGER,
                processed_symbols INTEGER NOT NULL DEFAULT 0,
                error_message TEXT,
                metadata TEXT,
                started_at INTEGER,
                completed_at INTEGER,
                created_at INTEGER NOT NULL,
                FOREIGN KEY (repo_id) REFERENCES git_repositories(id) ON DELETE CASCADE
            )",
            [],
        )?;

        conn.execute(
            "CREATE TABLE IF NOT EXISTS index_metadata (
                id TEXT PRIMARY KEY,
                repo_id TEXT NOT NULL,
                file_path TEXT NOT NULL,
                content_hash TEXT NOT NULL,
                last_indexed_at INTEGER NOT NULL,
                symbol_count INTEGER NOT NULL DEFAULT 0,
                language TEXT,
                file_size INTEGER,
                UNIQUE(repo_id, file_path),
                FOREIGN KEY (repo_id) REFERENCES git_repositories(id) ON DELETE CASCADE
            )",
            [],
        )?;

        self.run_migrations(&conn)?;
        self.create_indexes(&conn)?;

        Ok(())
    }

    fn run_migrations(&self, conn: &Connection) -> SqliteResult<()> {
        // git_repositories migrations
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN default_branch TEXT",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN clone_status TEXT NOT NULL DEFAULT 'pending'",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN clone_progress INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN index_status TEXT NOT NULL DEFAULT 'not_indexed'",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN indexed_at INTEGER",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN file_count INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN symbol_count INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN vector_count INTEGER NOT NULL DEFAULT 0",
            [],
        );
        let _ = conn.execute(
            "ALTER TABLE git_repositories ADD COLUMN is_archived INTEGER NOT NULL DEFAULT 0",
            [],
        );

        Ok(())
    }

    fn create_indexes(&self, conn: &Connection) -> SqliteResult<()> {
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_repos_workspace ON git_repositories(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_repos_clone_status ON git_repositories(clone_status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_repos_index_status ON git_repositories(index_status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_repos_archived ON git_repositories(workspace_id, is_archived)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_repo ON index_jobs(repo_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_status ON index_jobs(status)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_jobs_created ON index_jobs(created_at DESC)",
            [],
        )?;

        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_metadata_repo ON index_metadata(repo_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_metadata_hash ON index_metadata(content_hash)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_metadata_indexed ON index_metadata(last_indexed_at DESC)",
            [],
        )?;

        Ok(())
    }

    pub fn conn(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
}
