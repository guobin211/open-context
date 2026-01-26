import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';
import path from 'path';
import { StoragePaths } from '../config';
import { EdgeType } from '../types';
import logger from '../utils/logger';

export class LevelDBService {
  private db: Keyv;
  private edgesDb: Keyv;
  private reverseEdgesDb: Keyv;

  constructor(dbPath?: string) {
    const basePath = dbPath || StoragePaths.leveldb();

    this.db = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'main.sqlite'))
    });

    this.edgesDb = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'edges.sqlite'))
    });

    this.reverseEdgesDb = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'reverse-edges.sqlite'))
    });
  }

  async open(): Promise<void> {
    await Promise.all([
      this.db.set('connection_test', true),
      this.edgesDb.set('connection_test', true),
      this.reverseEdgesDb.set('connection_test', true)
    ]);
    logger.info('Keyv SQLite opened');
  }

  async close(): Promise<void> {
    await Promise.all([this.db.disconnect(), this.edgesDb.disconnect(), this.reverseEdgesDb.disconnect()]);
    logger.info('Keyv SQLite closed');
  }

  async put(key: string, value: any): Promise<void> {
    await this.db.set(key, value);
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.db.get<T>(key);
    return value ?? null;
  }

  async delete(key: string): Promise<void> {
    await this.db.delete(key);
  }

  async putEdge(from: string, type: EdgeType, tos: string[]): Promise<void> {
    const key = `${from}:${type}`;
    await this.edgesDb.set(key, tos);
  }

  async getEdge(from: string, type: EdgeType): Promise<string[]> {
    const key = `${from}:${type}`;
    const value = await this.edgesDb.get<string[]>(key);
    return value ?? [];
  }

  async deleteEdge(from: string, type: EdgeType): Promise<void> {
    const key = `${from}:${type}`;
    await this.edgesDb.delete(key);
  }

  async putReverseEdge(to: string, type: EdgeType, froms: string[]): Promise<void> {
    const key = `${to}:${type}`;
    await this.reverseEdgesDb.set(key, froms);
  }

  async getReverseEdge(to: string, type: EdgeType): Promise<string[]> {
    const key = `${to}:${type}`;
    const value = await this.reverseEdgesDb.get<string[]>(key);
    return value ?? [];
  }

  async deleteReverseEdge(to: string, type: EdgeType): Promise<void> {
    const key = `${to}:${type}`;
    await this.reverseEdgesDb.delete(key);
  }

  async *iterateEdges(): AsyncIterableIterator<[string, string]> {
    if (!this.edgesDb.store) {
      return;
    }

    for await (const [key, value] of this.edgesDb.store) {
      if (value !== undefined) {
        yield [key, JSON.stringify(value)];
      }
    }
  }

  async *iterateReverseEdges(): AsyncIterableIterator<[string, string]> {
    if (!this.reverseEdgesDb.store) {
      return;
    }

    for await (const [key, value] of this.reverseEdgesDb.store) {
      if (value !== undefined) {
        yield [key, JSON.stringify(value)];
      }
    }
  }

  async *iterateMain(prefix?: string): AsyncIterableIterator<[string, string]> {
    if (!this.db.store) {
      return;
    }

    for await (const [key, value] of this.db.store) {
      if (!prefix || key.startsWith(prefix)) {
        if (value !== undefined) {
          yield [key, JSON.stringify(value)];
        }
      }
    }
  }

  async getByPrefix<T>(prefix: string): Promise<T[]> {
    const results: T[] = [];
    if (!this.db.store) {
      return results;
    }

    for await (const [key, value] of this.db.store) {
      if (key.startsWith(prefix) && value !== undefined) {
        results.push(value as T);
      }
    }
    return results;
  }

  async getSymbol(symbolId: string): Promise<any> {
    return this.get(`symbol:${symbolId}`);
  }

  async batchPut(entries: Array<{ key: string; value: any }>): Promise<void> {
    const promises = entries.map((e) => this.db.set(e.key, e.value));
    await Promise.all(promises);
  }

  async batchPutEdges(entries: Array<{ from: string; type: EdgeType; tos: string[] }>): Promise<void> {
    const promises = entries.map((e) => this.edgesDb.set(`${e.from}:${e.type}`, e.tos));
    await Promise.all(promises);
  }

  async batchPutReverseEdges(entries: Array<{ to: string; type: EdgeType; froms: string[] }>): Promise<void> {
    const promises = entries.map((e) => this.reverseEdgesDb.set(`${e.to}:${e.type}`, e.froms));
    await Promise.all(promises);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (!this.db.store) {
      return;
    }

    const keysToDelete: string[] = [];
    for await (const [key] of this.db.store) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    if (keysToDelete.length > 0) {
      await Promise.all(keysToDelete.map((key) => this.db.delete(key)));
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
