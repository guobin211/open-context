import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';
import path from 'path';
import { StoragePaths } from '../../config';
import logger from '../../utils/logger';

export class SymbolDB {
  private db: Keyv;

  constructor(dbPath?: string) {
    const basePath = dbPath || StoragePaths.sqlite();
    this.db = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'symbol.db'))
    });
  }

  async open(): Promise<void> {
    await this.db.set('connection_test', true);
    logger.info('SymbolDB opened');
  }

  async close(): Promise<void> {
    await this.db.disconnect();
    logger.info('SymbolDB closed');
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

  async *iterate(prefix?: string): AsyncIterableIterator<[string, string]> {
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
