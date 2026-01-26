import { SQLiteDBService } from './index-db';
import { SurrealDBService, SurrealSymbol } from './surrealdb-client';
import { SymbolPayload, EdgeType } from '../types';
import logger from '../utils/logger';

export class DataSyncService {
  constructor(
    private sqliteDb: SQLiteDBService,
    private surrealDb: SurrealDBService
  ) {}

  async syncSymbolToSurreal(symbolId: string, payload: SymbolPayload, contentHash: string): Promise<void> {
    try {
      const surrealSymbol: SurrealSymbol = {
        ...payload,
        content_hash: contentHash
      };

      await this.surrealDb.upsertSymbol(surrealSymbol);
      logger.debug({ symbolId }, 'Symbol synced to SurrealDB');
    } catch (error) {
      logger.error({ error, symbolId }, 'Failed to sync symbol to SurrealDB');
      throw error;
    }
  }

  async syncEdgeToSurreal(from: string, to: string, edgeType: EdgeType): Promise<void> {
    try {
      await this.surrealDb.createEdge(from, to, edgeType);
      logger.debug({ from, to, edgeType }, 'Edge synced to SurrealDB');
    } catch (error) {
      logger.error({ error, from, to, edgeType }, 'Failed to sync edge to SurrealDB');
      throw error;
    }
  }

  async batchSyncSymbolsToSurreal(
    symbols: Array<{ symbolId: string; payload: SymbolPayload; contentHash: string }>
  ): Promise<void> {
    try {
      const surrealSymbols: SurrealSymbol[] = symbols.map((s) => ({
        ...s.payload,
        content_hash: s.contentHash
      }));

      await this.surrealDb.batchUpsertSymbols(surrealSymbols);
      logger.info({ count: symbols.length }, 'Batch symbols synced to SurrealDB');
    } catch (error) {
      logger.error({ error, count: symbols.length }, 'Failed to batch sync symbols to SurrealDB');
      throw error;
    }
  }

  async batchSyncEdgesToSurreal(
    edges: Array<{ from: string; to: string; type: EdgeType }>
  ): Promise<void> {
    try {
      await this.surrealDb.batchCreateEdges(edges);
      logger.info({ count: edges.length }, 'Batch edges synced to SurrealDB');
    } catch (error) {
      logger.error({ error, count: edges.length }, 'Failed to batch sync edges to SurrealDB');
      throw error;
    }
  }

  async deleteSymbolFromBoth(symbolId: string): Promise<void> {
    try {
      await this.sqliteDb.delete(`symbol:${symbolId}`);
      logger.debug({ symbolId }, 'Symbol deleted from SQLite and SurrealDB');
    } catch (error) {
      logger.error({ error, symbolId }, 'Failed to delete symbol');
      throw error;
    }
  }
}

let instance: DataSyncService | null = null;

export function getDataSyncService(sqliteDb: SQLiteDBService, surrealDb: SurrealDBService): DataSyncService {
  if (!instance) {
    instance = new DataSyncService(sqliteDb, surrealDb);
  }
  return instance;
}

