import { StoragePaths } from '@/config';
import logger from '@/utils/logger';
import { createNodeEngines } from '@surrealdb/node';
import path from 'node:path';
import { Surreal } from 'surrealdb';

export class SurrealEmbed {
  private db: Surreal;
  private dbPath: string;
  constructor(dbPath?: string) {
    const basePath = dbPath || StoragePaths.surrealdb();
    this.dbPath = path.join(basePath, 'embed.db');
    this.db = new Surreal({
      engines: createNodeEngines()
    });
  }

  async connect(): Promise<void> {
    await this.db.connect(`surrealkv://${this.dbPath}`);
    logger.info('SurrealEmbed connected');
  }
}

let instance: SurrealEmbed | null = null;

export function getSurrealEmbedInstance(): SurrealEmbed {
  if (!instance) {
    instance = new SurrealEmbed();
  }
  return instance;
}
