//! 数据库健康检查服务

import Database from 'better-sqlite3';
import { join } from 'node:path';
import { StoragePaths, ensureStorageDir } from '../config/paths';
import { SurrealDBService } from './surreal/surreal-client';
import { QdrantService } from './qdrant/qdrant-client';
import logger from '../utils/logger';

export interface DatabaseHealth {
  sqlite: {
    app: boolean;
    symbol: boolean;
    edge: boolean;
    reverseEdge: boolean;
  };
  surrealdb: boolean;
  qdrant: boolean;
  errors: string[];
}

/**
 * 数据库健康检查器
 */
export class DatabaseHealthChecker {
  private static instance: DatabaseHealthChecker;
  private readonly appDbPath: string;
  private readonly symbolDbPath: string;
  private readonly edgeDbPath: string;
  private readonly reverseEdgeDbPath: string;
  private surrealService: SurrealDBService;
  private qdrantService: QdrantService;

  private constructor() {
    const sqlitePath = StoragePaths.sqlite();
    const dbPath = StoragePaths.database();

    this.appDbPath = join(dbPath, 'app.db');
    this.symbolDbPath = join(sqlitePath, 'symbol.db');
    this.edgeDbPath = join(sqlitePath, 'edge.db');
    this.reverseEdgeDbPath = join(sqlitePath, 'reverse_edge.db');
    this.surrealService = new SurrealDBService();
    this.qdrantService = new QdrantService();
  }

  public static async getInstance(): Promise<DatabaseHealthChecker> {
    if (!DatabaseHealthChecker.instance) {
      await ensureStorageDir('sqlite');
      await ensureStorageDir('database');
      DatabaseHealthChecker.instance = new DatabaseHealthChecker();
    }
    return DatabaseHealthChecker.instance;
  }

  /**
   * 检查所有数据库的健康状态
   */
  public async checkHealth(): Promise<DatabaseHealth> {
    const health: DatabaseHealth = {
      sqlite: {
        app: false,
        symbol: false,
        edge: false,
        reverseEdge: false
      },
      surrealdb: false,
      qdrant: false,
      errors: []
    };

    // 检查 app.db（主业务数据库）
    try {
      health.sqlite.app = this.checkSQLite(this.appDbPath);
    } catch (error) {
      health.errors.push(`App DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 检查 symbol.db（符号 KV 存储）
    try {
      health.sqlite.symbol = this.checkSQLite(this.symbolDbPath);
    } catch (error) {
      health.errors.push(`Symbol DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 检查 edge.db（正向边存储）
    try {
      health.sqlite.edge = this.checkSQLite(this.edgeDbPath);
    } catch (error) {
      health.errors.push(`Edge DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 检查 reverse_edge.db（反向边存储）
    try {
      health.sqlite.reverseEdge = this.checkSQLite(this.reverseEdgeDbPath);
    } catch (error) {
      health.errors.push(`Reverse Edge DB: ${error instanceof Error ? error.message : String(error)}`);
    }

    // 检查 SurrealDB
    try {
      await this.surrealService.connect();
      await this.surrealService.initSchema();
      health.surrealdb = true;
    } catch (error) {
      health.errors.push(`SurrealDB: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await this.surrealService.disconnect();
    }

    // 检查 Qdrant
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

  /**
   * 验证 app.db 的表结构
   */
  public async validateSchema(): Promise<boolean> {
    let isValid = true;

    try {
      const db = new Database(this.appDbPath, { readonly: true });
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as Array<{
        name: string;
      }>;

      // app.db 必须包含的表
      const requiredTables = [
        'workspaces',
        'notes',
        'imported_files',
        'imported_directories',
        'web_links',
        'git_repositories',
        'conversations',
        'terminals',
        'webviews',
        'chats',
        'tasks',
        'index_jobs',
        'index_metadata'
      ];

      for (const table of requiredTables) {
        if (!tables.find((t) => t.name === table)) {
          logger.error({ table }, 'Missing required table in app.db');
          isValid = false;
        }
      }

      db.close();
    } catch (error) {
      logger.error({ error }, 'Failed to validate app.db schema');
      isValid = false;
    }

    return isValid;
  }

  /**
   * 获取数据库统计信息
   */
  public async getStats(): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    try {
      const db = new Database(this.appDbPath, { readonly: true });

      const tables = [
        'workspaces',
        'notes',
        'imported_files',
        'imported_directories',
        'web_links',
        'git_repositories',
        'conversations',
        'terminals',
        'webviews',
        'chats',
        'tasks',
        'index_jobs',
        'index_metadata'
      ];

      for (const table of tables) {
        try {
          const result = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get() as { count: number };
          stats[table] = result.count;
        } catch {
          stats[table] = 0;
        }
      }

      db.close();
    } catch (error) {
      logger.error({ error }, 'Failed to get database stats');
    }

    return stats;
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

export async function getDatabaseStats(): Promise<Record<string, number>> {
  const checker = await DatabaseHealthChecker.getInstance();
  return checker.getStats();
}
