import { readFileSync, existsSync } from 'node:fs';
import { getConfigFilePath, DefaultConfig } from './paths';
import logger from '../utils/logger';

export interface SqliteConfig {
  workspace_db: string;
  repository_db: string;
  symbol_db: string;
  edge_db: string;
  reverse_edge_db: string;
  wal_mode: boolean;
  busy_timeout: number;
}

export interface SurrealDbConfig {
  url: string;
  namespace: string;
  database: string;
  username: string;
  password: string;
  embedded: boolean;
}

export interface QdrantConfig {
  url: string;
  api_key?: string;
  embedding_dim: number;
  collection_name: string;
  distance: string;
  embedded: boolean;
}

export interface DatabaseConfig {
  sqlite: SqliteConfig;
  surrealdb: SurrealDbConfig;
  qdrant: QdrantConfig;
}

export interface NodeServerConfig {
  port: number;
  host: string;
  auto_start: boolean;
}

export interface AppConfigFile {
  version: string;
  database?: DatabaseConfig;
  node_server?: NodeServerConfig;
  log_level?: string;
}

export class ConfigLoader {
  private static instance: ConfigLoader;
  private config: AppConfigFile | null = null;

  private constructor() {}

  public static getInstance(): ConfigLoader {
    if (!ConfigLoader.instance) {
      ConfigLoader.instance = new ConfigLoader();
    }
    return ConfigLoader.instance;
  }

  public load(): AppConfigFile {
    if (this.config) {
      return this.config;
    }

    const configPath = getConfigFilePath();

    if (!existsSync(configPath)) {
      logger.warn({ configPath }, 'Config file not found, using defaults');
      this.config = this.getDefaultConfig();
      return this.config;
    }

    try {
      const configData = readFileSync(configPath, 'utf-8');
      const parsedConfig = JSON.parse(configData) as AppConfigFile;
      this.config = this.mergeWithDefaults(parsedConfig);
      logger.info({ configPath }, 'Config loaded successfully');
      return this.config;
    } catch (error) {
      logger.error({ error, configPath }, 'Failed to load config file, using defaults');
      this.config = this.getDefaultConfig();
      return this.config;
    }
  }

  public reload(): AppConfigFile {
    this.config = null;
    return this.load();
  }

  private getDefaultConfig(): AppConfigFile {
    return {
      version: '0.1.0',
      database: {
        sqlite: {
          workspace_db: '~/.open-context/database/sqlite/workspace.db',
          repository_db: '~/.open-context/database/sqlite/repository.db',
          symbol_db: '~/.open-context/database/sqlite/symbol.db',
          edge_db: '~/.open-context/database/sqlite/edge.db',
          reverse_edge_db: '~/.open-context/database/sqlite/reverse_edge.db',
          wal_mode: true,
          busy_timeout: 5000
        },
        surrealdb: {
          url: process.env.SURREALDB_URL || 'http://localhost:8000',
          namespace: 'code_index',
          database: 'open_context',
          username: process.env.SURREALDB_USER || 'root',
          password: process.env.SURREALDB_PASS || 'root',
          embedded: false
        },
        qdrant: {
          url: process.env.QDRANT_URL || DefaultConfig.qdrant.url,
          api_key: process.env.QDRANT_API_KEY,
          embedding_dim: DefaultConfig.qdrant.embeddingDim,
          collection_name: 'code_symbols',
          distance: 'Cosine',
          embedded: false
        }
      },
      node_server: {
        port: DefaultConfig.nodeServer.port,
        host: '127.0.0.1',
        auto_start: DefaultConfig.nodeServer.autoStart
      },
      log_level: DefaultConfig.logLevel
    };
  }

  private mergeWithDefaults(config: AppConfigFile): AppConfigFile {
    const defaults = this.getDefaultConfig();

    return {
      version: config.version || defaults.version,
      database: config.database ? {
        sqlite: { ...defaults.database!.sqlite, ...config.database.sqlite },
        surrealdb: { ...defaults.database!.surrealdb, ...config.database.surrealdb },
        qdrant: { ...defaults.database!.qdrant, ...config.database.qdrant }
      } : defaults.database,
      node_server: config.node_server ? { ...defaults.node_server, ...config.node_server } : defaults.node_server,
      log_level: config.log_level || defaults.log_level
    };
  }
}

export function getDatabaseConfig(): DatabaseConfig {
  const config = ConfigLoader.getInstance().load();
  if (!config.database) {
    throw new Error('Database configuration not found');
  }
  return config.database;
}

export function getNodeServerConfig(): NodeServerConfig {
  const config = ConfigLoader.getInstance().load();
  if (!config.node_server) {
    throw new Error('Node server configuration not found');
  }
  return config.node_server;
}

export function getSqliteConfig(): SqliteConfig {
  return getDatabaseConfig().sqlite;
}

export function getSurrealDbConfig(): SurrealDbConfig {
  return getDatabaseConfig().surrealdb;
}

export function getQdrantConfig(): QdrantConfig {
  return getDatabaseConfig().qdrant;
}
