import { Level } from 'level';
import path from 'path';
import { EdgeType } from '../types';
import logger from '../utils/logger';

export class LevelDBService {
  private db: Level<string, string>;
  private edgesDb: Level<string, string>;
  private reverseEdgesDb: Level<string, string>;

  constructor(dbPath?: string) {
    const basePath = dbPath || process.env.LEVELDB_PATH || './data/leveldb';
    this.db = new Level(path.join(basePath, 'main'));
    this.edgesDb = new Level(path.join(basePath, 'edges'));
    this.reverseEdgesDb = new Level(path.join(basePath, 'reverse-edges'));
  }

  async open(): Promise<void> {
    await Promise.all([this.db.open(), this.edgesDb.open(), this.reverseEdgesDb.open()]);
    logger.info('LevelDB opened');
  }

  async close(): Promise<void> {
    await Promise.all([this.db.close(), this.edgesDb.close(), this.reverseEdgesDb.close()]);
    logger.info('LevelDB closed');
  }

  async put(key: string, value: any): Promise<void> {
    await this.db.put(key, JSON.stringify(value));
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.db.get(key);
      return JSON.parse(value);
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.db.del(key);
    } catch (error: any) {
      if (error.code !== 'LEVEL_NOT_FOUND') {
        throw error;
      }
    }
  }

  async putEdge(from: string, type: EdgeType, tos: string[]): Promise<void> {
    const key = `${from}:${type}`;
    await this.edgesDb.put(key, JSON.stringify(tos));
  }

  async getEdge(from: string, type: EdgeType): Promise<string[]> {
    try {
      const key = `${from}:${type}`;
      const value = await this.edgesDb.get(key);
      return JSON.parse(value);
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return [];
      }
      throw error;
    }
  }

  async deleteEdge(from: string, type: EdgeType): Promise<void> {
    const key = `${from}:${type}`;
    try {
      await this.edgesDb.del(key);
    } catch (error: any) {
      if (error.code !== 'LEVEL_NOT_FOUND') {
        throw error;
      }
    }
  }

  async putReverseEdge(to: string, type: EdgeType, froms: string[]): Promise<void> {
    const key = `${to}:${type}`;
    await this.reverseEdgesDb.put(key, JSON.stringify(froms));
  }

  async getReverseEdge(to: string, type: EdgeType): Promise<string[]> {
    try {
      const key = `${to}:${type}`;
      const value = await this.reverseEdgesDb.get(key);
      return JSON.parse(value);
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
        return [];
      }
      throw error;
    }
  }

  async deleteReverseEdge(to: string, type: EdgeType): Promise<void> {
    const key = `${to}:${type}`;
    try {
      await this.reverseEdgesDb.del(key);
    } catch (error: any) {
      if (error.code !== 'LEVEL_NOT_FOUND') {
        throw error;
      }
    }
  }

  async *iterateEdges(): AsyncIterableIterator<[string, string]> {
    for await (const [key, value] of this.edgesDb.iterator()) {
      yield [key, value];
    }
  }

  async *iterateReverseEdges(): AsyncIterableIterator<[string, string]> {
    for await (const [key, value] of this.reverseEdgesDb.iterator()) {
      yield [key, value];
    }
  }

  async *iterateMain(prefix?: string): AsyncIterableIterator<[string, string]> {
    for await (const [key, value] of this.db.iterator()) {
      if (!prefix || key.startsWith(prefix)) {
        yield [key, value];
      }
    }
  }

  async getByPrefix<T>(prefix: string): Promise<T[]> {
    const results: T[] = [];
    for await (const [_, value] of this.iterateMain(prefix)) {
      results.push(JSON.parse(value));
    }
    return results;
  }

  async getSymbol(symbolId: string): Promise<any | null> {
    return this.get(`symbol:${symbolId}`);
  }

  async batchPut(entries: Array<{ key: string; value: any }>): Promise<void> {
    const ops = entries.map((e) => ({
      type: 'put' as const,
      key: e.key,
      value: JSON.stringify(e.value)
    }));
    await this.db.batch(ops);
  }

  async batchPutEdges(entries: Array<{ from: string; type: EdgeType; tos: string[] }>): Promise<void> {
    const ops = entries.map((e) => ({
      type: 'put' as const,
      key: `${e.from}:${e.type}`,
      value: JSON.stringify(e.tos)
    }));
    await this.edgesDb.batch(ops);
  }

  async batchPutReverseEdges(entries: Array<{ to: string; type: EdgeType; froms: string[] }>): Promise<void> {
    const ops = entries.map((e) => ({
      type: 'put' as const,
      key: `${e.to}:${e.type}`,
      value: JSON.stringify(e.froms)
    }));
    await this.reverseEdgesDb.batch(ops);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const ops: any[] = [];
    for await (const [key] of this.iterateMain(prefix)) {
      ops.push({ type: 'del', key });
    }
    if (ops.length > 0) {
      await this.db.batch(ops);
    }
  }
}

let instance: LevelDBService | null = null;

export function getLevelDBInstance(): LevelDBService {
  if (!instance) {
    instance = new LevelDBService();
  }
  return instance;
}
