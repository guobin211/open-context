// 通用设置
export interface GeneralConfig {
  language: 'zh-CN' | 'zh-TW' | 'en' | 'ja' | 'ko';
  autoUpdate: boolean;
  startOnBoot: boolean;
  minimizeToTray: boolean;
}

// 外观设置
export interface AppearanceConfig {
  theme: 'light' | 'dark' | 'system';
  fontSize: number;
  editorTheme: 'vs-light' | 'vs-dark' | 'hc-black';
  uiScale: number;
}

// 数据存储设置
export interface StorageConfig {
  localPath: string;
  maxCacheSize: number;
  autoCleanup: boolean;
  backupEnabled: boolean;
  backupPath: string;
}

// 云存储设置
export interface CloudStorageConfig {
  enabled: boolean;
  provider: 'cos' | 's3' | 'oss';
  cosConfig: {
    secretId: string;
    secretKey: string;
    region: string;
    bucket: string;
  };
  syncStrategy: 'auto' | 'manual' | 'wifi-only';
}

// AI 提供商设置
export interface CloudProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
  models: string[];
}

export interface AIProviderConfig {
  type: 'local' | 'cloud';
  localModel: string;
  cloudProviders: CloudProvider[];
  defaultProvider: string;
  modelParams: {
    temperature: number;
    maxTokens: number;
    topP: number;
  };
}

// 服务器设置
export interface ServerConfig {
  nodeServerEnabled: boolean;
  nodeServerUrl: string;
  nodeServerPort: number;
  autoStartServer: boolean;
  mcpEnabled: boolean;
  httpApiEnabled: boolean;
}

// 快捷键映射
export type ShortcutsMap = Record<string, string>;

export interface AppConfig {
  general: GeneralConfig;
  appearance: AppearanceConfig;
  storage: StorageConfig;
  cloudStorage: CloudStorageConfig;
  aiProvider: AIProviderConfig;
  server: ServerConfig;
  shortcuts: ShortcutsMap;
  _internal: {
    activeCategory: SettingsCategory;
  };
}

export type SettingsCategory = 'general' | 'appearance' | 'storage' | 'cloud' | 'ai' | 'server' | 'shortcuts';

export interface SettingsMenuItem {
  id: SettingsCategory;
  label: string;
  icon: string;
  description?: string;
}
