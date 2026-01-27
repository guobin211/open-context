import { Surreal } from 'surrealdb';
import { EdgeType } from '../../types';
import logger from '../../utils/logger';
import {
  DB_NAME,
  FullTextSearchOptions,
  FullTextSearchResult,
  GraphQueryOptions,
  GraphQueryResult,
  NAMESPACE,
  SurrealSymbol
} from './surreal-types';
import * as actions from './surreal-actions';

export class SurrealDBService {
  private db: Surreal;
  private isConnected = false;

  constructor() {
    this.db = new Surreal();
  }

  async connect(): Promise<void> {
    try {
      const url = process.env.SURREALDB_URL || 'http://localhost:8000/rpc';
      const user = process.env.SURREALDB_USER || 'root';
      const pass = process.env.SURREALDB_PASSWORD || 'root';

      await this.db.connect(url);

      await this.db.signin({
        username: user,
        password: pass
      });

      await this.db.use({
        namespace: NAMESPACE,
        database: DB_NAME
      });

      this.isConnected = true;
      logger.info({ url, namespace: NAMESPACE, database: DB_NAME }, 'SurrealDB connected');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to SurrealDB');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.db.close();
      this.isConnected = false;
      logger.info('SurrealDB disconnected');
    }
  }

  async initSchema(): Promise<void> {
    return actions.initSchema(this.db);
  }

  async upsertSymbol(symbol: SurrealSymbol): Promise<void> {
    return actions.upsertSymbol(this.db, symbol);
  }

  async batchUpsertSymbols(symbols: SurrealSymbol[]): Promise<void> {
    return actions.batchUpsertSymbols(this.db, symbols);
  }

  async getSymbol(symbolId: string): Promise<SurrealSymbol | null> {
    return actions.getSymbol(this.db, symbolId);
  }

  async findByFilePathAndHash(filePath: string, contentHash: string): Promise<SurrealSymbol | null> {
    return actions.findByFilePathAndHash(this.db, filePath, contentHash);
  }

  async createEdge(from: string, to: string, type: EdgeType): Promise<void> {
    return actions.createEdge(this.db, from, to, type);
  }

  async batchCreateEdges(edges: Array<{ from: string; to: string; type: EdgeType }>): Promise<void> {
    return actions.batchCreateEdges(this.db, edges);
  }

  async fullTextSearch(options: FullTextSearchOptions): Promise<FullTextSearchResult[]> {
    return actions.fullTextSearch(this.db, options);
  }

  async queryGraph(options: GraphQueryOptions): Promise<GraphQueryResult> {
    return actions.queryGraph(this.db, options);
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    return actions.deleteSymbol(this.db, symbolId);
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    return actions.deleteByRepoId(this.db, repoId);
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    return actions.deleteByWorkspaceId(this.db, workspaceId);
  }

  async deleteVirtualSymbols(): Promise<number> {
    return actions.deleteVirtualSymbols(this.db);
  }
}

let instance: SurrealDBService | null = null;

export function getSurrealDBInstance(): SurrealDBService {
  if (!instance) {
    instance = new SurrealDBService();
  }
  return instance;
}
