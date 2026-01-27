import { EdgeType } from '../../types';
import logger from '../../utils/logger';
import { SymbolDB } from './symbol';
import { EdgeDB } from './edge';
import { ReverseEdgeDB } from './reverse-edge';

export class SQLiteIndexService {
  private symbolDb: SymbolDB;
  private edgeDb: EdgeDB;
  private reverseEdgeDb: ReverseEdgeDB;

  constructor(dbPath?: string) {
    this.symbolDb = new SymbolDB(dbPath);
    this.edgeDb = new EdgeDB(dbPath);
    this.reverseEdgeDb = new ReverseEdgeDB(dbPath);
  }

  async open(): Promise<void> {
    await Promise.all([this.symbolDb.open(), this.edgeDb.open(), this.reverseEdgeDb.open()]);
    logger.info('SQLite DB Service opened');
  }

  async close(): Promise<void> {
    await Promise.all([this.symbolDb.close(), this.edgeDb.close(), this.reverseEdgeDb.close()]);
    logger.info('SQLite DB Service closed');
  }

  async put(key: string, value: any): Promise<void> {
    await this.symbolDb.put(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.symbolDb.get<T>(key);
  }

  async delete(key: string): Promise<void> {
    await this.symbolDb.delete(key);
  }

  async putEdge(from: string, type: EdgeType, tos: string[]): Promise<void> {
    await this.edgeDb.put(from, type, tos);
  }

  async getEdge(from: string, type: EdgeType): Promise<string[]> {
    return this.edgeDb.get(from, type);
  }

  async deleteEdge(from: string, type: EdgeType): Promise<void> {
    await this.edgeDb.delete(from, type);
  }

  async putReverseEdge(to: string, type: EdgeType, froms: string[]): Promise<void> {
    await this.reverseEdgeDb.put(to, type, froms);
  }

  async getReverseEdge(to: string, type: EdgeType): Promise<string[]> {
    return this.reverseEdgeDb.get(to, type);
  }

  async deleteReverseEdge(to: string, type: EdgeType): Promise<void> {
    await this.reverseEdgeDb.delete(to, type);
  }

  async *iterateEdges(): AsyncIterableIterator<[string, string]> {
    yield* this.edgeDb.iterate();
  }

  async *iterateReverseEdges(): AsyncIterableIterator<[string, string]> {
    yield* this.reverseEdgeDb.iterate();
  }

  async *iterateMain(prefix?: string): AsyncIterableIterator<[string, string]> {
    yield* this.symbolDb.iterate(prefix);
  }

  async getByPrefix<T>(prefix: string): Promise<T[]> {
    return this.symbolDb.getByPrefix<T>(prefix);
  }

  async getSymbol(symbolId: string): Promise<any> {
    return this.symbolDb.getSymbol(symbolId);
  }

  async batchPut(entries: Array<{ key: string; value: any }>): Promise<void> {
    await this.symbolDb.batchPut(entries);
  }

  async batchPutEdges(entries: Array<{ from: string; type: EdgeType; tos: string[] }>): Promise<void> {
    await this.edgeDb.batchPut(entries);
  }

  async batchPutReverseEdges(entries: Array<{ to: string; type: EdgeType; froms: string[] }>): Promise<void> {
    await this.reverseEdgeDb.batchPut(entries);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    await this.symbolDb.deleteByPrefix(prefix);
  }
}

let instance: SQLiteIndexService | null = null;

export function getSQLiteDBInstance(): SQLiteIndexService {
  if (!instance) {
    instance = new SQLiteIndexService();
  }
  return instance;
}
