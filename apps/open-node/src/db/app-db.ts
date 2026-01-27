//! app.db 统一数据库访问层
//! 与 Rust 端共享同一个 SQLite 数据库文件

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { StoragePaths, ensureStorageDir } from '../config/paths';
import logger from '../utils/logger';

// Workspace 表接口
export interface WorkspaceRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  is_active: number;
  is_archived: number;
  settings: string | null;
  created_at: number;
  updated_at: number;
}

// Note 表接口
export interface NoteRow {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  title: string;
  note_type: string;
  content: string;
  summary: string | null;
  file_path: string;
  tags: string | null;
  word_count: number;
  sort_order: number;
  is_favorited: number;
  is_pinned: number;
  is_archived: number;
  last_viewed_at: number | null;
  created_at: number;
  updated_at: number;
}

// GitRepository 表接口
export interface GitRepositoryRow {
  id: string;
  workspace_id: string;
  name: string;
  remote_url: string;
  local_path: string;
  branch: string;
  default_branch: string | null;
  last_commit_hash: string | null;
  last_synced_at: number | null;
  clone_status: string;
  clone_progress: number;
  index_status: string;
  indexed_at: number | null;
  file_count: number;
  symbol_count: number;
  vector_count: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

// IndexJob 表接口
export interface IndexJobRow {
  id: string;
  repo_id: string;
  job_type: string;
  status: string;
  progress: number;
  total_files: number | null;
  processed_files: number;
  total_symbols: number | null;
  processed_symbols: number;
  error_message: string | null;
  metadata: string | null;
  started_at: number | null;
  completed_at: number | null;
  created_at: number;
}

// IndexMetadata 表接口
export interface IndexMetadataRow {
  id: string;
  repo_id: string;
  file_path: string;
  content_hash: string;
  last_indexed_at: number;
  symbol_count: number;
  language: string | null;
  file_size: number | null;
}

// ImportedFile 表接口
export interface ImportedFileRow {
  id: string;
  workspace_id: string;
  parent_directory_id: string | null;
  name: string;
  original_path: string;
  stored_path: string;
  file_type: string;
  size_bytes: number;
  mime_type: string | null;
  checksum: string | null;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

// ImportedDirectory 表接口
export interface ImportedDirectoryRow {
  id: string;
  workspace_id: string;
  parent_id: string | null;
  name: string;
  original_path: string;
  stored_path: string;
  file_count: number;
  total_size_bytes: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

// WebLink 表接口
export interface WebLinkRow {
  id: string;
  workspace_id: string;
  title: string;
  url: string;
  description: string | null;
  favicon_url: string | null;
  thumbnail_url: string | null;
  tags: string | null;
  content: string | null;
  is_favorited: number;
  is_archived: number;
  visit_count: number;
  last_visited_at: number | null;
  created_at: number;
  updated_at: number;
}

// Conversation 表接口
export interface ConversationRow {
  id: string;
  workspace_id: string;
  chat_id: string | null;
  title: string;
  model: string | null;
  system_prompt: string | null;
  messages: string;
  message_count: number;
  token_count: number;
  is_favorited: number;
  is_archived: number;
  last_active_at: number | null;
  created_at: number;
  updated_at: number;
}

// Chat 表接口
export interface ChatRow {
  id: string;
  workspace_id: string;
  name: string;
  description: string | null;
  default_model: string | null;
  default_prompt: string | null;
  conversation_count: number;
  is_active: number;
  is_archived: number;
  last_active_at: number | null;
  created_at: number;
  updated_at: number;
}

// Terminal 表接口
export interface TerminalRow {
  id: string;
  workspace_id: string;
  name: string;
  shell: string;
  cwd: string;
  env: string | null;
  history: string;
  history_count: number;
  is_active: number;
  is_archived: number;
  last_command_at: number | null;
  created_at: number;
  updated_at: number;
}

// Webview 表接口
export interface WebviewRow {
  id: string;
  workspace_id: string;
  title: string;
  url: string;
  favicon_url: string | null;
  history: string;
  is_loading: number;
  is_active: number;
  is_archived: number;
  scroll_x: number;
  scroll_y: number;
  zoom_level: number;
  last_active_at: number | null;
  created_at: number;
  updated_at: number;
}

// Task 表接口
export interface TaskRow {
  id: string;
  task_type: string;
  status: string;
  progress: number;
  message: string | null;
  result: string | null;
  error: string | null;
  retry_count: number;
  max_retries: number;
  retry_delay_ms: number;
  input: string | null;
  persistent: number;
  created_at: number;
  updated_at: number;
  completed_at: number | null;
}

/**
 * 统一的 app.db 数据库访问类
 * 与 Rust 端共享同一个数据库文件
 */
export class AppDatabase {
  private static instance: AppDatabase;
  private connection: Database.Database;
  private readonly dbPath: string;

  private constructor(dbPath: string) {
    this.dbPath = dbPath;
    this.connection = new Database(dbPath, { timeout: 5000 });
    this.connection.pragma('journal_mode = WAL');
    this.connection.pragma('synchronous = NORMAL');
    this.connection.pragma('cache_size = -64000');
    this.connection.pragma('temp_store = MEMORY');
    logger.info({ dbPath }, 'AppDatabase connected');
  }

  /**
   * 获取单例实例
   */
  public static async getInstance(): Promise<AppDatabase> {
    if (AppDatabase.instance) {
      return AppDatabase.instance;
    }

    await ensureStorageDir('database');
    const dbPath = join(StoragePaths.database(), 'app.db');
    AppDatabase.instance = new AppDatabase(dbPath);
    return AppDatabase.instance;
  }

  /**
   * 获取数据库路径
   */
  public getDbPath(): string {
    return this.dbPath;
  }

  // ==================== Workspace 操作 ====================

  getWorkspace(id: string): WorkspaceRow | null {
    const stmt = this.connection.prepare('SELECT * FROM workspaces WHERE id = ?');
    return stmt.get(id) as WorkspaceRow | null;
  }

  getAllWorkspaces(): WorkspaceRow[] {
    const stmt = this.connection.prepare('SELECT * FROM workspaces ORDER BY sort_order ASC');
    return stmt.all() as WorkspaceRow[];
  }

  getActiveWorkspace(): WorkspaceRow | null {
    const stmt = this.connection.prepare('SELECT * FROM workspaces WHERE is_active = 1 LIMIT 1');
    return stmt.get() as WorkspaceRow | null;
  }

  getWorkspacesByArchived(isArchived: number): WorkspaceRow[] {
    const stmt = this.connection.prepare('SELECT * FROM workspaces WHERE is_archived = ? ORDER BY sort_order ASC');
    return stmt.all(isArchived) as WorkspaceRow[];
  }

  // ==================== Note 操作 ====================

  getNote(id: string): NoteRow | null {
    const stmt = this.connection.prepare('SELECT * FROM notes WHERE id = ?');
    return stmt.get(id) as NoteRow | null;
  }

  getNotesByWorkspace(workspaceId: string, limit = 50): NoteRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM notes WHERE workspace_id = ? AND is_archived = 0 ORDER BY updated_at DESC LIMIT ?'
    );
    return stmt.all(workspaceId, limit) as NoteRow[];
  }

  getNotesByType(workspaceId: string, noteType: string): NoteRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM notes WHERE workspace_id = ? AND note_type = ? AND is_archived = 0 ORDER BY updated_at DESC'
    );
    return stmt.all(workspaceId, noteType) as NoteRow[];
  }

  getFavoritedNotes(workspaceId: string): NoteRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM notes WHERE workspace_id = ? AND is_favorited = 1 AND is_archived = 0 ORDER BY updated_at DESC'
    );
    return stmt.all(workspaceId) as NoteRow[];
  }

  // ==================== GitRepository 操作 ====================

  getRepository(id: string): GitRepositoryRow | null {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE id = ?');
    return stmt.get(id) as GitRepositoryRow | null;
  }

  getRepositoriesByWorkspace(workspaceId: string): GitRepositoryRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM git_repositories WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as GitRepositoryRow[];
  }

  getRepositoriesByIndexStatus(status: string): GitRepositoryRow[] {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE index_status = ?');
    return stmt.all(status) as GitRepositoryRow[];
  }

  getRepositoriesByCloneStatus(status: string): GitRepositoryRow[] {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE clone_status = ?');
    return stmt.all(status) as GitRepositoryRow[];
  }

  getAllRepositories(): GitRepositoryRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM git_repositories WHERE is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all() as GitRepositoryRow[];
  }

  // ==================== IndexJob 操作（双端读写）====================

  getIndexJob(id: string): IndexJobRow | null {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE id = ?');
    return stmt.get(id) as IndexJobRow | null;
  }

  getIndexJobsByRepo(repoId: string, limit = 10): IndexJobRow[] {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE repo_id = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(repoId, limit) as IndexJobRow[];
  }

  getIndexJobsByStatus(status: string): IndexJobRow[] {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE status = ? ORDER BY created_at DESC');
    return stmt.all(status) as IndexJobRow[];
  }

  getLatestIndexJob(repoId: string): IndexJobRow | null {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE repo_id = ? ORDER BY created_at DESC LIMIT 1');
    return stmt.get(repoId) as IndexJobRow | null;
  }

  createIndexJob(job: Omit<IndexJobRow, 'created_at'>): IndexJobRow {
    const now = Date.now();
    const stmt = this.connection.prepare(`
      INSERT INTO index_jobs (
        id, repo_id, job_type, status, progress,
        total_files, processed_files, total_symbols, processed_symbols,
        error_message, metadata, started_at, completed_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      job.id,
      job.repo_id,
      job.job_type,
      job.status,
      job.progress,
      job.total_files,
      job.processed_files,
      job.total_symbols,
      job.processed_symbols,
      job.error_message,
      job.metadata,
      job.started_at,
      job.completed_at,
      now
    );

    return { ...job, created_at: now };
  }

  updateIndexJobProgress(id: string, progress: number, processedFiles: number, processedSymbols: number): void {
    const stmt = this.connection.prepare(`
      UPDATE index_jobs
      SET progress = ?, processed_files = ?, processed_symbols = ?
      WHERE id = ?
    `);
    stmt.run(progress, processedFiles, processedSymbols, id);
  }

  updateIndexJobStatus(id: string, status: string, errorMessage?: string | null, completedAt?: number | null): void {
    const stmt = this.connection.prepare(`
      UPDATE index_jobs
      SET status = ?, error_message = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(status, errorMessage ?? null, completedAt ?? null, id);
  }

  startIndexJob(id: string): void {
    const now = Date.now();
    const stmt = this.connection.prepare(`
      UPDATE index_jobs
      SET status = 'running', started_at = ?
      WHERE id = ?
    `);
    stmt.run(now, id);
  }

  completeIndexJob(id: string, totalFiles: number, totalSymbols: number): void {
    const now = Date.now();
    const stmt = this.connection.prepare(`
      UPDATE index_jobs
      SET status = 'completed', progress = 100,
          total_files = ?, processed_files = ?,
          total_symbols = ?, processed_symbols = ?,
          completed_at = ?
      WHERE id = ?
    `);
    stmt.run(totalFiles, totalFiles, totalSymbols, totalSymbols, now, id);
  }

  failIndexJob(id: string, errorMessage: string): void {
    const now = Date.now();
    const stmt = this.connection.prepare(`
      UPDATE index_jobs
      SET status = 'failed', error_message = ?, completed_at = ?
      WHERE id = ?
    `);
    stmt.run(errorMessage, now, id);
  }

  // ==================== IndexMetadata 操作（双端读写）====================

  getIndexMetadata(id: string): IndexMetadataRow | null {
    const stmt = this.connection.prepare('SELECT * FROM index_metadata WHERE id = ?');
    return stmt.get(id) as IndexMetadataRow | null;
  }

  getIndexMetadataByRepo(repoId: string): IndexMetadataRow[] {
    const stmt = this.connection.prepare('SELECT * FROM index_metadata WHERE repo_id = ?');
    return stmt.all(repoId) as IndexMetadataRow[];
  }

  getIndexMetadataByPath(repoId: string, filePath: string): IndexMetadataRow | null {
    const stmt = this.connection.prepare('SELECT * FROM index_metadata WHERE repo_id = ? AND file_path = ?');
    return stmt.get(repoId, filePath) as IndexMetadataRow | null;
  }

  upsertIndexMetadata(metadata: IndexMetadataRow): void {
    const stmt = this.connection.prepare(`
      INSERT INTO index_metadata (id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(repo_id, file_path) DO UPDATE SET
        content_hash = excluded.content_hash,
        last_indexed_at = excluded.last_indexed_at,
        symbol_count = excluded.symbol_count,
        language = excluded.language,
        file_size = excluded.file_size
    `);

    stmt.run(
      metadata.id,
      metadata.repo_id,
      metadata.file_path,
      metadata.content_hash,
      metadata.last_indexed_at,
      metadata.symbol_count,
      metadata.language,
      metadata.file_size
    );
  }

  batchUpsertIndexMetadata(metadataList: IndexMetadataRow[]): void {
    const stmt = this.connection.prepare(`
      INSERT INTO index_metadata (id, repo_id, file_path, content_hash, last_indexed_at, symbol_count, language, file_size)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(repo_id, file_path) DO UPDATE SET
        content_hash = excluded.content_hash,
        last_indexed_at = excluded.last_indexed_at,
        symbol_count = excluded.symbol_count,
        language = excluded.language,
        file_size = excluded.file_size
    `);

    const transaction = this.connection.transaction((items: IndexMetadataRow[]) => {
      for (const m of items) {
        stmt.run(
          m.id,
          m.repo_id,
          m.file_path,
          m.content_hash,
          m.last_indexed_at,
          m.symbol_count,
          m.language,
          m.file_size
        );
      }
    });

    transaction(metadataList);
  }

  deleteIndexMetadataByRepo(repoId: string): void {
    const stmt = this.connection.prepare('DELETE FROM index_metadata WHERE repo_id = ?');
    stmt.run(repoId);
  }

  deleteIndexMetadataByPath(repoId: string, filePath: string): void {
    const stmt = this.connection.prepare('DELETE FROM index_metadata WHERE repo_id = ? AND file_path = ?');
    stmt.run(repoId, filePath);
  }

  // ==================== ImportedFile 操作 ====================

  getImportedFile(id: string): ImportedFileRow | null {
    const stmt = this.connection.prepare('SELECT * FROM imported_files WHERE id = ?');
    return stmt.get(id) as ImportedFileRow | null;
  }

  getImportedFilesByWorkspace(workspaceId: string): ImportedFileRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM imported_files WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as ImportedFileRow[];
  }

  getImportedFilesByDirectory(directoryId: string): ImportedFileRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM imported_files WHERE parent_directory_id = ? AND is_archived = 0'
    );
    return stmt.all(directoryId) as ImportedFileRow[];
  }

  // ==================== ImportedDirectory 操作 ====================

  getImportedDirectory(id: string): ImportedDirectoryRow | null {
    const stmt = this.connection.prepare('SELECT * FROM imported_directories WHERE id = ?');
    return stmt.get(id) as ImportedDirectoryRow | null;
  }

  getImportedDirectoriesByWorkspace(workspaceId: string): ImportedDirectoryRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM imported_directories WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as ImportedDirectoryRow[];
  }

  // ==================== WebLink 操作 ====================

  getWebLink(id: string): WebLinkRow | null {
    const stmt = this.connection.prepare('SELECT * FROM web_links WHERE id = ?');
    return stmt.get(id) as WebLinkRow | null;
  }

  getWebLinksByWorkspace(workspaceId: string): WebLinkRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM web_links WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as WebLinkRow[];
  }

  getFavoriteWebLinks(workspaceId: string): WebLinkRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM web_links WHERE workspace_id = ? AND is_favorited = 1 AND is_archived = 0 ORDER BY last_visited_at DESC'
    );
    return stmt.all(workspaceId) as WebLinkRow[];
  }

  // ==================== Conversation 操作 ====================

  getConversation(id: string): ConversationRow | null {
    const stmt = this.connection.prepare('SELECT * FROM conversations WHERE id = ?');
    return stmt.get(id) as ConversationRow | null;
  }

  getConversationsByWorkspace(workspaceId: string): ConversationRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM conversations WHERE workspace_id = ? AND is_archived = 0 ORDER BY last_active_at DESC'
    );
    return stmt.all(workspaceId) as ConversationRow[];
  }

  getConversationsByChat(chatId: string): ConversationRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM conversations WHERE chat_id = ? AND is_archived = 0 ORDER BY last_active_at DESC'
    );
    return stmt.all(chatId) as ConversationRow[];
  }

  // ==================== Chat 操作 ====================

  getChat(id: string): ChatRow | null {
    const stmt = this.connection.prepare('SELECT * FROM chats WHERE id = ?');
    return stmt.get(id) as ChatRow | null;
  }

  getChatsByWorkspace(workspaceId: string): ChatRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM chats WHERE workspace_id = ? AND is_archived = 0 ORDER BY last_active_at DESC'
    );
    return stmt.all(workspaceId) as ChatRow[];
  }

  // ==================== Terminal 操作 ====================

  getTerminal(id: string): TerminalRow | null {
    const stmt = this.connection.prepare('SELECT * FROM terminals WHERE id = ?');
    return stmt.get(id) as TerminalRow | null;
  }

  getTerminalsByWorkspace(workspaceId: string): TerminalRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM terminals WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as TerminalRow[];
  }

  getActiveTerminal(workspaceId: string): TerminalRow | null {
    const stmt = this.connection.prepare('SELECT * FROM terminals WHERE workspace_id = ? AND is_active = 1 LIMIT 1');
    return stmt.get(workspaceId) as TerminalRow | null;
  }

  // ==================== Webview 操作 ====================

  getWebview(id: string): WebviewRow | null {
    const stmt = this.connection.prepare('SELECT * FROM webviews WHERE id = ?');
    return stmt.get(id) as WebviewRow | null;
  }

  getWebviewsByWorkspace(workspaceId: string): WebviewRow[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM webviews WHERE workspace_id = ? AND is_archived = 0 ORDER BY created_at DESC'
    );
    return stmt.all(workspaceId) as WebviewRow[];
  }

  getActiveWebview(workspaceId: string): WebviewRow | null {
    const stmt = this.connection.prepare('SELECT * FROM webviews WHERE workspace_id = ? AND is_active = 1 LIMIT 1');
    return stmt.get(workspaceId) as WebviewRow | null;
  }

  // ==================== Task 操作 ====================

  getTask(id: string): TaskRow | null {
    const stmt = this.connection.prepare('SELECT * FROM tasks WHERE id = ?');
    return stmt.get(id) as TaskRow | null;
  }

  getTasksByStatus(status: string): TaskRow[] {
    const stmt = this.connection.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC');
    return stmt.all(status) as TaskRow[];
  }

  getPendingTasks(): TaskRow[] {
    const stmt = this.connection.prepare('SELECT * FROM tasks WHERE status = "pending" ORDER BY created_at ASC');
    return stmt.all() as TaskRow[];
  }

  // ==================== 统计查询 ====================

  getWorkspaceStats(workspaceId: string): {
    noteCount: number;
    fileCount: number;
    linkCount: number;
    repoCount: number;
    conversationCount: number;
  } {
    const noteCount = (
      this.connection
        .prepare('SELECT COUNT(*) as count FROM notes WHERE workspace_id = ? AND is_archived = 0')
        .get(workspaceId) as { count: number }
    ).count;

    const fileCount = (
      this.connection
        .prepare('SELECT COUNT(*) as count FROM imported_files WHERE workspace_id = ? AND is_archived = 0')
        .get(workspaceId) as { count: number }
    ).count;

    const linkCount = (
      this.connection
        .prepare('SELECT COUNT(*) as count FROM web_links WHERE workspace_id = ? AND is_archived = 0')
        .get(workspaceId) as { count: number }
    ).count;

    const repoCount = (
      this.connection
        .prepare('SELECT COUNT(*) as count FROM git_repositories WHERE workspace_id = ? AND is_archived = 0')
        .get(workspaceId) as { count: number }
    ).count;

    const conversationCount = (
      this.connection
        .prepare('SELECT COUNT(*) as count FROM conversations WHERE workspace_id = ? AND is_archived = 0')
        .get(workspaceId) as { count: number }
    ).count;

    return { noteCount, fileCount, linkCount, repoCount, conversationCount };
  }

  // ==================== 通用操作 ====================

  /**
   * 检查数据库连接是否正常
   */
  isHealthy(): boolean {
    try {
      this.connection.pragma('journal_mode');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取所有表名
   */
  getTableNames(): string[] {
    const rows = this.connection
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
      .all() as Array<{ name: string }>;
    return rows.map((r) => r.name);
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    this.connection.close();
    logger.info('AppDatabase closed');
  }
}

let appDbInstance: AppDatabase | null = null;

/**
 * 获取 AppDatabase 单例
 */
export async function getAppDatabase(): Promise<AppDatabase> {
  if (!appDbInstance) {
    appDbInstance = await AppDatabase.getInstance();
  }
  return appDbInstance;
}
