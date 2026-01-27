import Keyv from 'keyv';
import KeyvSqlite from '@keyv/sqlite';
import path from 'path';
import { StoragePaths } from '../../config';
import { EdgeType } from '../../types';
import logger from '../../utils/logger';

export class ReverseEdgeDB {
  private reverseEdgesDb: Keyv;

  constructor(dbPath?: string) {
    const basePath = dbPath || StoragePaths.sqlite();
    this.reverseEdgesDb = new Keyv({
      store: new KeyvSqlite(path.join(basePath, 'reverse_edge.db'))
    });
  }

  async open(): Promise<void> {
    await this.reverseEdgesDb.set('connection_test', true);
    logger.info('ReverseEdgeDB opened');
  }

  async close(): Promise<void> {
    await this.reverseEdgesDb.disconnect();
    logger.info('ReverseEdgeDB closed');
  }

  async put(to: string, type: EdgeType, froms: string[]): Promise<void> {
    const key = `${to}:${type}`;
    await this.reverseEdgesDb.set(key, froms);
  }

  async get(to: string, type: EdgeType): Promise<string[]> {
    const key = `${to}:${type}`;
    const value = await this.reverseEdgesDb.get<string[]>(key);
    return value ?? [];
  }

  async delete(to: string, type: EdgeType): Promise<void> {
    const key = `${to}:${type}`;
    await this.reverseEdgesDb.delete(key);
  }

  async *iterate(): AsyncIterableIterator<[string, string]> {
    if (!this.reverseEdgesDb.store) {
      return;
    }

    for await (const [key, value] of this.reverseEdgesDb.store) {
      if (value !== undefined) {
        yield [key, JSON.stringify(value)];
      }
    }
  }

  async batchPut(entries: Array<{ to: string; type: EdgeType; froms: string[] }>): Promise<void> {
    const promises = entries.map((e) => this.reverseEdgesDb.set(`${e.to}:${e.type}`, e.froms));
    await Promise.all(promises);
  }
}
