import Database from 'better-sqlite3';
import { join } from 'node:path';
import { StoragePaths, ensureStorageDir } from '../config/paths';

interface GitRepository {
  id: string;
  workspace_id: string;
  name: string;
  remote_url: string;
  local_path: string;
  branch: string;
  default_branch?: string;
  last_commit_hash?: string;
  last_synced_at?: number;
  clone_status: string;
  clone_progress: number;
  index_status: string;
  indexed_at?: number;
  file_count: number;
  symbol_count: number;
  vector_count: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

interface IndexJob {
  id: string;
  repo_id: string;
  job_type: string;
  status: string;
  progress: number;
  total_files?: number;
  processed_files: number;
  total_symbols?: number;
  processed_symbols: number;
  error_message?: string;
  metadata?: string;
  started_at?: number;
  completed_at?: number;
  created_at: number;
}

interface IndexMetadata {
  id: string;
  repo_id: string;
  file_path: string;
  content_hash: string;
  last_indexed_at: number;
  symbol_count: number;
  language?: string;
  file_size?: number;
}

let db: Database.Database | null = null;

export class RepositoryDatabase {
  private static instance: RepositoryDatabase;

  private constructor(private connection: Database.Database) {}

  public static async getInstance(): Promise<RepositoryDatabase> {
    if (RepositoryDatabase.instance) {
      return RepositoryDatabase.instance;
    }

    const dbPath = join(await ensureStorageDir('sqlite'), 'repository.db');
    const connection = new Database(dbPath, { timeout: 5000 });
    connection.pragma('journal_mode = WAL');
    connection.pragma('synchronous = NORMAL');

    RepositoryDatabase.instance = new RepositoryDatabase(connection);
    return RepositoryDatabase.instance;
  }

  getRepository(id: string): GitRepository | null {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE id = ?');
    return stmt.get(id) as GitRepository | null;
  }

  getRepositoriesByWorkspace(workspaceId: string): GitRepository[] {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE workspace_id = ? AND is_archived = 0');
    return stmt.all(workspaceId) as GitRepository[];
  }

  getRepositoryByStatus(status: string): GitRepository[] {
    const stmt = this.connection.prepare('SELECT * FROM git_repositories WHERE index_status = ?');
    return stmt.all(status) as GitRepository[];
  }

  getRepoIndexJobs(repoId: string, limit = 10): IndexJob[] {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE repo_id = ? ORDER BY created_at DESC LIMIT ?');
    return stmt.all(repoId, limit) as IndexJob[];
  }

  getIndexJob(id: string): IndexJob | null {
    const stmt = this.connection.prepare('SELECT * FROM index_jobs WHERE id = ?');
    return stmt.get(id) as IndexJob | null;
  }

  getIndexMetadataByRepo(repoId: string): IndexMetadata[] {
    const stmt = this.connection.prepare('SELECT * FROM index_metadata WHERE repo_id = ?');
    return stmt.all(repoId) as IndexMetadata[];
  }

  getIndexMetadata(filePath: string): IndexMetadata | null {
    const stmt = this.connection.prepare('SELECT * FROM index_metadata WHERE file_path = ?');
    return stmt.get(filePath) as IndexMetadata | null;
  }

  close(): void {
    this.connection.close();
  }
}

export async function getRepositoryDatabase(): Promise<RepositoryDatabase> {
  return RepositoryDatabase.getInstance();
}
