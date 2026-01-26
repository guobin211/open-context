import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const BASE_DIR_NAME = '.open-context';
const __dirname = dirname(fileURLToPath(import.meta.url));
const __workspace = resolve(__dirname, '../../../../');

/**
 * 判断是否为开发环境
 */
function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * 获取存储根目录
 * 优先级：
 * 1. 环境变量 OPEN_CONTEXT_HOME
 * 2. 开发模式：项目根目录下的 .open-context
 * 3. 生产模式：~/.open-context
 */
export function getBaseDir(): string {
  if (process.env.OPEN_CONTEXT_HOME) {
    return resolve(process.env.OPEN_CONTEXT_HOME);
  }
  if (isDev()) {
    return join(__workspace, BASE_DIR_NAME);
  }
  return join(homedir(), BASE_DIR_NAME);
}

/**
 * 子目录路径配置
 */
export const StoragePaths = {
  // 基础目录
  bin: () => join(getBaseDir(), 'bin'),
  cache: () => join(getBaseDir(), 'cache'),
  config: () => join(getBaseDir(), 'config'),
  logs: () => join(getBaseDir(), 'logs'),

  // 数据库目录
  database: () => join(getBaseDir(), 'database'),
  sqlite: () => join(getBaseDir(), 'database', 'sqlite'),
  qdrant: () => join(getBaseDir(), 'database', 'qdrant'),
  surrealdb: () => join(getBaseDir(), 'database', 'surrealdb'),

  // 业务数据目录
  notebook: () => join(getBaseDir(), 'notebook'),
  session: () => join(getBaseDir(), 'session'),
  workspace: () => join(getBaseDir(), 'workspace'),
  files: () => join(getBaseDir(), 'files'),
  plugins: () => join(getBaseDir(), 'plugins'),
  commands: () => join(getBaseDir(), 'commands'),
  skills: () => join(getBaseDir(), 'skills'),
  todos: () => join(getBaseDir(), 'todos'),
  projects: () => join(getBaseDir(), 'projects'),
  rules: () => join(getBaseDir(), 'rules'),
  hooks: () => join(getBaseDir(), 'hooks'),

  // Git 仓库存储
  repos: () => join(getBaseDir(), 'repos')
} as const;

/**
 * 获取配置文件路径
 */
export function getConfigFilePath(): string {
  return join(StoragePaths.config(), 'config.json');
}

/**
 * 获取指定子目录下的文件路径
 */
export function getStorePath(subdir: keyof typeof StoragePaths, filename: string): string {
  const dirFn = StoragePaths[subdir];
  return join(dirFn(), filename);
}

/**
 * 确保目录存在
 */
export async function ensureStorageDir(subdir: keyof typeof StoragePaths): Promise<string> {
  const dirPath = StoragePaths[subdir]();
  await mkdir(dirPath, { recursive: true });
  return dirPath;
}

/**
 * 初始化所有存储目录
 */
export async function initStorageDirs(): Promise<void> {
  const dirs = Object.keys(StoragePaths) as Array<keyof typeof StoragePaths>;
  await Promise.all(dirs.map((dir) => ensureStorageDir(dir)));
}

/**
 * 默认配置
 */
export const DefaultConfig = {
  nodeServer: {
    port: 4500,
    autoStart: true
  },
  qdrant: {
    url: 'http://localhost:6333',
    embeddingDim: 1024
  },
  logLevel: 'info' as const
};
