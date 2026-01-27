import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';
import path from 'path';
import { StoragePaths } from '../../config';
import { EdgeType } from '../../types';
import logger from '../../utils/logger';

export class EdgeDB {
  private edgesDb: Keyv;

  constructor(dbPath?: string) {
    const basePath = dbPath || StoragePaths.sqlite();
    this.edgesDb = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'edge.db'))
    });
  }

  async open(): Promise<void> {
    await this.edgesDb.set('connection_test', true);
    logger.info('EdgeDB opened');
  }

  async close(): Promise<void> {
    await this.edgesDb.disconnect();
    logger.info('EdgeDB closed');
  }

  async put(from: string, type: EdgeType, tos: string[]): Promise<void> {
    const key = `${from}:${type}`;
    await this.edgesDb.set(key, tos);
  }

  async get(from: string, type: EdgeType): Promise<string[]> {
    const key = `${from}:${type}`;
    const value = await this.edgesDb.get<string[]>(key);
    return value ?? [];
  }

  async delete(from: string, type: EdgeType): Promise<void> {
    const key = `${from}:${type}`;
    await this.edgesDb.delete(key);
  }

  async *iterate(): AsyncIterableIterator<[string, string]> {
    if (!this.edgesDb.store) {
      return;
    }

    for await (const [key, value] of this.edgesDb.store) {
      if (value !== undefined) {
        yield [key, JSON.stringify(value)];
      }
    }
  }

  async batchPut(entries: Array<{ from: string; type: EdgeType; tos: string[] }>): Promise<void> {
    const promises = entries.map((e) => this.edgesDb.set(`${e.from}:${e.type}`, e.tos));
    await Promise.all(promises);
  }
}
