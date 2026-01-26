//! 数据库管理模块
//!
//! 负责 SQLite 数据库的初始化、Schema 创建和迁移。

use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::{Arc, Mutex};

pub struct DatabaseManager {
    conn: Arc<Mutex<Connection>>,
}

impl DatabaseManager {
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent)
                .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        }

        let conn = Connection::open(db_path)?;

        // 启用 WAL 模式和优化设置
        conn.execute_batch(
            "PRAGMA journal_mode = WAL;
             PRAGMA synchronous = NORMAL;
             PRAGMA cache_size = -64000;
             PRAGMA temp_store = MEMORY;
             PRAGMA foreign_keys = ON;",
        )?;

        let manager = Self {
            conn: Arc::new(Mutex::new(conn)),
        };

        manager.init_schema()?;
        Ok(manager)
    }

    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();

        // workspaces 表
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
                settings TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // notes 表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                parent_id TEXT,
                title TEXT NOT NULL,
                note_type TEXT NOT NULL,
                content TEXT NOT NULL DEFAULT '',
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

        // imported_directories 表（需要先创建，因为 imported_files 引用它）
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

        // imported_files 表
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

        // web_links 表
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
                content TEXT,
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

        // git_repositories 表
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

        // chats 表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS chats (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                default_model TEXT,
                default_prompt TEXT,
                conversation_count INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                last_active_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // conversations 表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS conversations (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                chat_id TEXT,
                title TEXT NOT NULL,
                model TEXT,
                system_prompt TEXT,
                messages TEXT NOT NULL DEFAULT '[]',
                message_count INTEGER NOT NULL DEFAULT 0,
                token_count INTEGER NOT NULL DEFAULT 0,
                is_favorited INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                last_active_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
                FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE SET NULL
            )",
            [],
        )?;

        // terminals 表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS terminals (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                name TEXT NOT NULL,
                shell TEXT NOT NULL,
                cwd TEXT NOT NULL,
                env TEXT,
                history TEXT NOT NULL DEFAULT '[]',
                history_count INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                last_command_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // webviews 表
        conn.execute(
            "CREATE TABLE IF NOT EXISTS webviews (
                id TEXT PRIMARY KEY,
                workspace_id TEXT NOT NULL,
                title TEXT NOT NULL,
                url TEXT NOT NULL,
                favicon_url TEXT,
                history TEXT NOT NULL DEFAULT '[]',
                is_loading INTEGER NOT NULL DEFAULT 0,
                is_active INTEGER NOT NULL DEFAULT 0,
                is_archived INTEGER NOT NULL DEFAULT 0,
                scroll_x INTEGER NOT NULL DEFAULT 0,
                scroll_y INTEGER NOT NULL DEFAULT 0,
                zoom_level REAL NOT NULL DEFAULT 1.0,
                last_active_at INTEGER,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            )",
            [],
        )?;

        // tasks 表
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
        let _ = conn.execute("ALTER TABLE workspaces ADD COLUMN settings TEXT", []);

        // web_links migrations
        let _ = conn.execute("ALTER TABLE web_links ADD COLUMN content TEXT", []);

        Ok(())
    }

    fn create_indexes(&self, conn: &Connection) -> SqliteResult<()> {
        // workspaces 索引
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

        // notes 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace ON notes(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_parent ON notes(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_type ON notes(workspace_id, note_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_favorited ON notes(workspace_id, is_favorited)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_pinned ON notes(workspace_id, is_pinned)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_archived ON notes(workspace_id, is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_updated ON notes(workspace_id, updated_at DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_notes_workspace_viewed ON notes(workspace_id, last_viewed_at DESC)",
            [],
        )?;

        // imported_files 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_workspace ON imported_files(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_parent ON imported_files(parent_directory_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_workspace_type ON imported_files(workspace_id, file_type)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_checksum ON imported_files(checksum)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_files_workspace_archived ON imported_files(workspace_id, is_archived)",
            [],
        )?;

        // imported_directories 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_workspace ON imported_directories(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_parent ON imported_directories(parent_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_dirs_workspace_archived ON imported_directories(workspace_id, is_archived)",
            [],
        )?;

        // web_links 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace ON web_links(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace_favorited ON web_links(workspace_id, is_favorited)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace_archived ON web_links(workspace_id, is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_workspace_visited ON web_links(workspace_id, last_visited_at DESC)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_links_url ON web_links(url)",
            [],
        )?;

        // git_repositories 索引
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
            "CREATE INDEX IF NOT EXISTS idx_repos_workspace_archived ON git_repositories(workspace_id, is_archived)",
            [],
        )?;

        // chats 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chats_workspace ON chats(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chats_workspace_active ON chats(workspace_id, is_active)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_chats_workspace_active_time ON chats(workspace_id, last_active_at DESC)",
            [],
        )?;

        // conversations 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_workspace ON conversations(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_chat ON conversations(chat_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_workspace_favorited ON conversations(workspace_id, is_favorited)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_workspace_archived ON conversations(workspace_id, is_archived)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_conversations_workspace_active ON conversations(workspace_id, last_active_at DESC)",
            [],
        )?;

        // terminals 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_terminals_workspace ON terminals(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_terminals_workspace_active ON terminals(workspace_id, is_active)",
            [],
        )?;

        // webviews 索引
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_webviews_workspace ON webviews(workspace_id)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_webviews_workspace_active ON webviews(workspace_id, is_active)",
            [],
        )?;

        // tasks 索引
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
