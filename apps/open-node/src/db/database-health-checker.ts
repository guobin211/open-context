import Database from 'better-sqlite3';
import { join } from 'node:path';
import { StoragePaths, ensureStorageDir } from '../config/paths';
import { SurrealDBService } from './surrealdb-client';
import { QdrantService } from './qdrant-client';
import logger from '../utils/logger';

export interface DatabaseHealth {
  sqlite: {
    workspace: boolean;
    repository: boolean;
    index: boolean;
  };
  surrealdb: boolean;
  qdrant: boolean;
  errors: string[];
}

export class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker;
  private readonly workspaceDbPath: string;
  private readonly repositoryDbPath: string;
  private readonly indexDbPath: string;
  private surrealService: SurrealDBService;
  private qdrantService: QdrantService;

  private constructor() {
    this.workspaceDbPath = join(StoragePaths.sqlite(), 'workspace.db');
    this.repositoryDbPath = join(StoragePaths.sqlite(), 'repository.db');
    this.indexDbPath = join(StoragePaths.sqlite(), 'symbol.db');
    this.surrealService = new SurrealDBService();
    this.qdrantService = new QdrantService();
  }

  public static async getInstance(): Promise<DatabaseHealthChecker> {
    if (!DatabaseHealthChecker.instance) {
      await ensureStorageDir('sqlite');
      DatabaseHealthChecker.instance = new DatabaseHealthChecker();
    }
    return DatabaseHealthChecker.instance;
  }

  public async checkHealth(): Promise<DatabaseHealth> {
    const health: DatabaseHealth = {
      sqlite: {
        workspace: false,
        repository: false,
        index: false
      },
      surrealdb: false,
      qdrant: false,
      errors: []
    };

    try {
      health.sqlite.workspace = this.checkSQLite(this.workspaceDbPath);
    } catch (error) {
      health.errors.push(`Workspace DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      health.sqlite.repository = this.checkSQLite(this.repositoryDbPath);
    } catch (error) {
      health.errors.push(`Repository DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      health.sqlite.index = this.checkSQLite(this.indexDbPath);
    } catch (error) {
      health.errors.push(`Index DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      await this.surrealService.connect();
      await this.surrealService.initSchema();
      health.surrealdb = true;
    } catch (error) {
      health.errors.push(`SurrealDB: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.surrealService.disconnect();
    }

    try {
      await this.qdrantService.connect();
      health.qdrant = this.qdrantService.isHealthy();
    } catch (error) {
      health.errors.push(`Qdrant: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      this.qdrantService.disconnect();
    }

    logger.info(health, 'Database health check completed');
    return health;
  }

  private checkSQLite(dbPath: string): boolean {
    try {
      const db = new Database(dbPath, { readonly: true, timeout: 5000 });
      db.pragma('journal_mode');
      db.close();
      return true;
    } catch (error) {
      throw new Error(`SQLite check failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  public async validateSchema(): Promise<boolean> {
    let isValid = true;

    try {
      const workspaceDb = new Database(this.workspaceDbPath, { readonly: true });
      const tables = workspaceDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{
        name: string;
      }>;

      const requiredTables = ['workspaces', 'notes', 'imported_files', 'imported_directories', 'web_links', 'tasks'];

      for (const table of requiredTables) {
        if (!tables.find((t) => t.name === table)) {
          logger.error({ table }, 'Missing required table in workspace.db');
          isValid = false;
        }
      }

      workspaceDb.close();
    } catch (error) {
      logger.error({ error }, 'Failed to validate workspace.db.db schema');
      isValid = false;
    }

    try {
      const repositoryDb = new Database(this.repositoryDbPath, { readonly: true });
      const tables = repositoryDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{
        name: string;
      }>;

      const requiredTables = ['git_repositories', 'index_jobs', 'index_metadata'];

      for (const table of requiredTables) {
        if (!tables.find((t) => t.name === table)) {
          logger.error({ table }, 'Missing required table in repository.db');
          isValid = false;
        }
      }

      repositoryDb.close();
    } catch (error) {
      logger.error({ error }, 'Failed to validate repository.db schema');
      isValid = false;
    }

    return isValid;
  }
}

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const checker = await DatabaseHealthChecker.getInstance();
  return checker.checkHealth();
}

export async function validateDatabaseSchema(): Promise<boolean> {
  const checker = await DatabaseHealthChecker.getInstance();
  return checker.validateSchema();
}
