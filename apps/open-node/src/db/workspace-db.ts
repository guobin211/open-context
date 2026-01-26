import Database from 'better-sqlite3';
import { join } from 'node:path';
import { StoragePaths, ensureStorageDir } from '../config/paths';

interface Workspace {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
}

interface Note {
  id: string;
  workspace_id: string;
  parent_id?: string;
  title: string;
  note_type: string;
  content: string;
  summary?: string;
  file_path: string;
  tags?: string;
  word_count: number;
  sort_order: number;
  is_favorited: number;
  is_pinned: number;
  is_archived: number;
  last_viewed_at?: number;
  created_at: number;
  updated_at: number;
}

let db: Database.Database | null = null;

export class WorkspaceDatabase {
  private static instance: WorkspaceDatabase;

  private constructor(private connection: Database.Database) {}

  public static async getInstance(): Promise<WorkspaceDatabase> {
    if (WorkspaceDatabase.instance) {
      return WorkspaceDatabase.instance;
    }

    const dbPath = join(await ensureStorageDir('sqlite'), 'workspace.db');
    const connection = new Database(dbPath, { readonly: true, timeout: 5000 });
    connection.pragma('journal_mode = WAL');
    connection.pragma('synchronous = NORMAL');

    WorkspaceDatabase.instance = new WorkspaceDatabase(connection);
    return WorkspaceDatabase.instance;
  }

  getWorkspace(id: string): Workspace | null {
    const stmt = this.connection.prepare('SELECT * FROM workspaces WHERE id = ?');
    return stmt.get(id) as Workspace | null;
  }

  getWorkspacesByActive(isActive: number): Workspace[] {
    const stmt = this.connection.prepare('SELECT * FROM workspaces WHERE is_active = ? ORDER BY sort_order');
    return stmt.all(isActive) as Workspace[];
  }

  getNotesByWorkspace(workspaceId: string, limit = 50): Note[] {
    const stmt = this.connection.prepare(
      'SELECT * FROM notes WHERE workspace_id = ? AND is_archived = 0 ORDER BY updated_at DESC LIMIT ?'
    );
    return stmt.all(workspaceId, limit) as Note[];
  }

  getNote(id: string): Note | null {
    const stmt = this.connection.prepare('SELECT * FROM notes WHERE id = ?');
    return stmt.get(id) as Note | null;
  }

  close(): void {
    this.connection.close();
  }
}

export async function getWorkspaceDatabase(): Promise<WorkspaceDatabase> {
  return WorkspaceDatabase.getInstance();
}
