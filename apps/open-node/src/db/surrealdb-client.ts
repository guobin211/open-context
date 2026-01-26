import { Surreal } from 'surrealdb';
import { EdgeType, SymbolPayload } from '../types';
import logger from '../utils/logger';

const DB_NAME = 'open_context';
const NAMESPACE = 'code_index';

export interface SurrealSymbol extends SymbolPayload {
  id?: string;
  content_hash: string;
}

export interface SurrealEdge {
  in: string;
  out: string;
}

export interface FullTextSearchOptions {
  query: string;
  workspaceId: string;
  limit?: number;
  filters?: {
    repoIds?: string[];
    language?: string;
    symbolKinds?: string[];
  };
}

export interface FullTextSearchResult {
  symbolId: string;
  symbolName: string;
  code: string;
  filePath: string;
  bm25Score: number;
}

export interface GraphQueryOptions {
  symbolId: string;
  depth?: number;
  edgeType?: EdgeType;
  direction?: 'outbound' | 'inbound' | 'both';
}

export interface GraphQueryResult {
  nodes: string[];
  edges: Array<{
    from: string;
    to: string;
    type: EdgeType;
  }>;
}

export class SurrealDBService {
  private db: Surreal;
  private isConnected = false;

  constructor() {
    this.db = new Surreal();
  }

  async connect(): Promise<void> {
    try {
      const url = process.env.SURREALDB_URL || 'http://localhost:8000';
      const user = process.env.SURREALDB_USER || 'root';
      const pass = process.env.SURREALDB_PASS || 'root';

      await this.db.connect(url);

      // 使用 root 权限连接
      await this.db.signin({
        username: user,
        password: pass
      });

      // 然后切换到指定的 namespace 和 database
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
    try {
      await this.db.query(`
        -- 定义 symbol 表
        DEFINE TABLE IF NOT EXISTS symbol SCHEMAFULL;
        DEFINE FIELD IF NOT EXISTS workspace_id ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS repo_id ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS repo_name ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS file_path ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS content_hash ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS symbol_id ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS symbol_name ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS symbol_kind ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS code ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS signature ON symbol TYPE option<string>;
        DEFINE FIELD IF NOT EXISTS language ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS exported ON symbol TYPE bool;
        DEFINE FIELD IF NOT EXISTS visibility ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS importance ON symbol TYPE float;
        DEFINE FIELD IF NOT EXISTS commit ON symbol TYPE string;
        DEFINE FIELD IF NOT EXISTS indexed_at ON symbol TYPE number;

        -- 全文索引（使用 ascii analyzer）
        DEFINE ANALYZER IF NOT EXISTS ascii_analyzer TOKENIZERS blank,class FILTERS lowercase,ascii;
        DEFINE INDEX IF NOT EXISTS symbol_name_idx ON symbol FIELDS symbol_name SEARCH ANALYZER ascii_analyzer BM25;
        DEFINE INDEX IF NOT EXISTS code_idx ON symbol FIELDS code SEARCH ANALYZER ascii_analyzer BM25;
        DEFINE INDEX IF NOT EXISTS signature_idx ON symbol FIELDS signature SEARCH ANALYZER ascii_analyzer BM25;

        -- 唯一索引（防止重复）
        DEFINE INDEX IF NOT EXISTS symbol_unique_idx ON symbol FIELDS file_path, content_hash UNIQUE;

        -- workspace_id 索引（用于查询过滤）
        DEFINE INDEX IF NOT EXISTS workspace_id_idx ON symbol FIELDS workspace_id;
        DEFINE INDEX IF NOT EXISTS repo_id_idx ON symbol FIELDS repo_id;
        DEFINE INDEX IF NOT EXISTS symbol_kind_idx ON symbol FIELDS symbol_kind;
        DEFINE INDEX IF NOT EXISTS language_idx ON symbol FIELDS language;

        -- 定义关系边表
        DEFINE TABLE IF NOT EXISTS IMPORTS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
        DEFINE TABLE IF NOT EXISTS CALLS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
        DEFINE TABLE IF NOT EXISTS IMPLEMENTS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
        DEFINE TABLE IF NOT EXISTS EXTENDS SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
        DEFINE TABLE IF NOT EXISTS USES SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
        DEFINE TABLE IF NOT EXISTS REFERENCES SCHEMAFULL TYPE RELATION IN symbol OUT symbol;
      `);

      logger.info('SurrealDB schema initialized');
    } catch (error) {
      logger.error({ error }, 'Failed to initialize SurrealDB schema');
      throw error;
    }
  }

  async upsertSymbol(symbol: SurrealSymbol): Promise<void> {
    try {
      const recordId = `symbol:${symbol.symbol_id}`;
      await this.db.upsert(recordId, symbol as unknown as Record<string, unknown>);
    } catch (error) {
      if (error instanceof Error && error.message.includes('duplicate')) {
        logger.debug({ symbolId: symbol.symbol_id }, 'Symbol already exists, skipping');
      } else {
        logger.error({ error, symbolId: symbol.symbol_id }, 'Failed to upsert symbol');
        throw error;
      }
    }
  }

  async batchUpsertSymbols(symbols: SurrealSymbol[]): Promise<void> {
    try {
      const promises = symbols.map((symbol) => this.upsertSymbol(symbol));
      await Promise.all(promises);
    } catch (error) {
      logger.error({ error }, 'Failed to batch upsert symbols');
      throw error;
    }
  }

  async getSymbol(symbolId: string): Promise<SurrealSymbol | null> {
    try {
      const recordId = `symbol:${symbolId}`;
      const result = await this.db.select(recordId);
      const data = result as unknown as SurrealSymbol | SurrealSymbol[] | null;
      return data ? (Array.isArray(data) ? data[0] : data) : null;
    } catch (error) {
      logger.error({ error, symbolId }, 'Failed to get symbol');
      return null;
    }
  }

  async findByFilePathAndHash(filePath: string, contentHash: string): Promise<SurrealSymbol | null> {
    try {
      const result = await this.db.query<[SurrealSymbol[]]>(
        'SELECT * FROM symbol WHERE file_path = $path AND content_hash = $hash LIMIT 1',
        { path: filePath, hash: contentHash }
      );

      const symbols = result[0];
      return symbols && symbols.length > 0 ? symbols[0] : null;
    } catch (error) {
      logger.error({ error, filePath }, 'Failed to find symbol by file path and hash');
      return null;
    }
  }

  async createEdge(from: string, to: string, type: EdgeType): Promise<void> {
    try {
      // 构造完整的 record ID
      const fromRecordId = `symbol:\`${from}\``;
      const toRecordId = `symbol:\`${to}\``;

      await this.db.query(`RELATE ${fromRecordId}->${type}->${toRecordId}`);
    } catch (error) {
      logger.error({ error, from, to, type }, 'Failed to create edge');
      throw error;
    }
  }

  async batchCreateEdges(edges: Array<{ from: string; to: string; type: EdgeType }>): Promise<void> {
    try {
      const promises = edges.map((edge) => this.createEdge(edge.from, edge.to, edge.type));
      await Promise.all(promises);
    } catch (error) {
      logger.error({ error }, 'Failed to batch create edges');
      throw error;
    }
  }

  async fullTextSearch(options: FullTextSearchOptions): Promise<FullTextSearchResult[]> {
    try {
      const { query, workspaceId, limit = 10, filters } = options;

      let whereClause = `workspace_id = $workspace_id`;
      const params: Record<string, any> = { workspace_id: workspaceId, query, limit };

      if (filters?.repoIds && filters.repoIds.length > 0) {
        whereClause += ` AND repo_id IN $repo_ids`;
        params.repo_ids = filters.repoIds;
      }

      if (filters?.language) {
        whereClause += ` AND language = $language`;
        params.language = filters.language;
      }

      if (filters?.symbolKinds && filters.symbolKinds.length > 0) {
        whereClause += ` AND symbol_kind IN $symbol_kinds`;
        params.symbol_kinds = filters.symbolKinds;
      }

      const result = await this.db.query<[FullTextSearchResult[]]>(
        `
        SELECT
          symbol_id AS symbolId,
          symbol_name AS symbolName,
          code,
          file_path AS filePath,
          search::score(1) AS bm25Score
        FROM symbol
        WHERE ${whereClause}
          AND (symbol_name @@ $query OR code @@ $query OR signature @@ $query)
        ORDER BY bm25Score DESC
        LIMIT $limit
      `,
        params
      );

      return result[0] || [];
    } catch (error) {
      logger.error({ error, options }, 'Failed to perform full-text search');
      return [];
    }
  }

  async queryGraph(options: GraphQueryOptions): Promise<GraphQueryResult> {
    try {
      const { symbolId, depth = 2, edgeType, direction = 'outbound' } = options;
      const recordId = `symbol:\`${symbolId}\``;

      let traversalOperator = '->';
      if (direction === 'inbound') {
        traversalOperator = '<-';
      } else if (direction === 'both') {
        traversalOperator = '<->';
      }

      let edgeFilter = '';
      if (edgeType) {
        edgeFilter = edgeType;
      } else {
        edgeFilter = '(IMPORTS|CALLS|IMPLEMENTS|EXTENDS|USES|REFERENCES)';
      }

      // SurrealDB 2.x 使用简单的遍历语法，不支持 ..depth
      // 改用递归查询或多次遍历
      const result = await this.db.query<[{ id: string }[]]>(
        `
        SELECT id FROM ${recordId}${traversalOperator}${edgeFilter}
      `
      );

      const nodes = result[0]?.map((n: { id: string }) => n.id.replace('symbol:', '').replace(/`/g, '')) || [];

      // 获取相关的边
      const edgesQuery = edgeType
        ? `SELECT in, out FROM ${edgeType} WHERE in = ${recordId} OR out = ${recordId}`
        : `SELECT in, out FROM IMPORTS, CALLS, IMPLEMENTS, EXTENDS, USES, REFERENCES WHERE in = ${recordId} OR out = ${recordId}`;

      const edgesResult = await this.db.query<[Array<{ in: string; out: string }>]>(edgesQuery);

      const edges =
        edgesResult[0]?.map((e: { in: string; out: string }) => ({
          from: e.in.replace('symbol:', '').replace(/`/g, ''),
          to: e.out.replace('symbol:', '').replace(/`/g, ''),
          type: edgeType || ('REFERENCES' as EdgeType)
        })) || [];

      return { nodes: [symbolId, ...nodes], edges };
    } catch (error) {
      logger.error({ error, options }, 'Failed to query graph');
      return { nodes: [options.symbolId], edges: [] };
    }
  }

  async deleteSymbol(symbolId: string): Promise<void> {
    try {
      const recordId = `symbol:${symbolId}`;
      await this.db.delete(recordId);
    } catch (error) {
      logger.error({ error, symbolId }, 'Failed to delete symbol');
      throw error;
    }
  }

  async deleteByRepoId(repoId: string): Promise<void> {
    try {
      await this.db.query('DELETE symbol WHERE repo_id = $repo_id', { repo_id: repoId });
      logger.info({ repoId }, 'Deleted symbols for repo');
    } catch (error) {
      logger.error({ error, repoId }, 'Failed to delete symbols by repo');
      throw error;
    }
  }

  async deleteByWorkspaceId(workspaceId: string): Promise<void> {
    try {
      await this.db.query('DELETE symbol WHERE workspace_id = $workspace_id', {
        workspace_id: workspaceId
      });
      logger.info({ workspaceId }, 'Deleted symbols for workspace');
    } catch (error) {
      logger.error({ error, workspaceId }, 'Failed to delete symbols by workspace');
      throw error;
    }
  }

  async deleteVirtualSymbols(): Promise<number> {
    try {
      const result = await this.db.query<[{ count: number }[]]>(
        'DELETE symbol WHERE workspace_id = "virtual" RETURN BEFORE'
      );
      const count = result[0]?.length || 0;
      logger.info({ count }, 'Deleted virtual symbols');
      return count;
    } catch (error) {
      logger.error({ error }, 'Failed to delete virtual symbols');
      return 0;
    }
  }
}

let instance: SurrealDBService | null = null;

export function getSurrealDBInstance(): SurrealDBService {
  if (!instance) {
    instance = new SurrealDBService();
  }
  return instance;
}
