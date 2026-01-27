/**
 * 共享存储路径配置
 * 与 Tauri 和 Node.js 端保持一致
 */

const BASE_DIR_NAME = '.open-context';

/**
 * 判断是否为开发环境
 */
const isDev = (): boolean => {
  return import.meta.env.DEV;
};

declare global {
  var __WORKSPACE__: string;
}

/**
 * 获取存储根目录
 * 优先级：
 * 1. 开发模式：返回相对路径 .open-context（项目根目录）
 * 2. 生产模式：~/.open-context
 */
export const getBaseDir = async (): Promise<string> => {
  if (isDev()) {
    return typeof __WORKSPACE__ !== 'undefined' ? __WORKSPACE__ : BASE_DIR_NAME;
  }
  try {
    const { homeDir } = await import('@tauri-apps/api/path');
    const home = await homeDir();
    return `${home}${BASE_DIR_NAME}`;
  } catch {
    return BASE_DIR_NAME;
  }
};

/**
 * 子目录名称常量
 */
export const StorageDirs = {
  BIN: 'bin',
  CACHE: 'cache',
  CONFIG: 'config',
  DATABASE: 'database',
  NOTEBOOK: 'notebook',
  SESSION: 'session',
  WORKSPACE: 'workspace',
  FILES: 'files',
  LOGS: 'logs',
  PLUGINS: 'plugins',
  COMMANDS: 'commands',
  SKILLS: 'skills',
  RULES: 'rules',
  HOOKS: 'hooks',
  REPOS: 'repos'
} as const;

/**
 * Store 文件名常量
 */
export const StoreFiles = {
  CHAT: 'chat-store.store.json',
  RIGHT_SIDEBAR: 'right-sidebar.store.json',
  NOTEBOOK: 'notebook-store.store.json',
  WORKSPACE: 'workspace-store.store.json',
  SETTINGS: 'settings-store.store.json'
} as const;

/**
 * 获取 Store 文件的完整路径
 */
export const getStoreFilePath = async (storeFile: keyof typeof StoreFiles): Promise<string> => {
  const baseDir = await getBaseDir();
  return `${baseDir}/${StorageDirs.CACHE}/${StoreFiles[storeFile]}`;
};

/**
 * 获取指定子目录的完整路径
 */
export const getStoragePath = async (subdir: keyof typeof StorageDirs, filename?: string): Promise<string> => {
  const baseDir = await getBaseDir();
  const dirPath = `${baseDir}/${StorageDirs[subdir]}`;
  return filename ? `${dirPath}/${filename}` : dirPath;
};

/**
 * 配置文件路径
 */
export const getConfigFilePath = async (): Promise<string> => {
  return getStoragePath('CONFIG', 'config.json');
};

/**
 * 默认配置值
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
