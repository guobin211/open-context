import type { AppConfig } from './app-settings';
import { defaultShortcuts } from './default-shortcuts';

export const defaultAppConfig: AppConfig = {
  general: {
    language: 'zh-CN',
    autoUpdate: true,
    startOnBoot: false,
    minimizeToTray: false
  },
  appearance: {
    theme: 'system',
    fontSize: 14,
    editorTheme: 'vs-dark',
    uiScale: 1
  },
  storage: {
    localPath: '',
    maxCacheSize: 500,
    autoCleanup: true,
    backupEnabled: false,
    backupPath: ''
  },
  cloudStorage: {
    enabled: false,
    provider: 'cos',
    cosConfig: {
      secretId: '',
      secretKey: '',
      region: 'ap-guangzhou',
      bucket: ''
    },
    syncStrategy: 'manual'
  },
  aiProvider: {
    type: 'local',
    localModel: 'gpt-3.5-turbo',
    cloudProviders: [],
    defaultProvider: '',
    modelParams: {
      temperature: 0.7,
      maxTokens: 2048,
      topP: 0.9
    }
  },
  server: {
    nodeServerEnabled: true,
    nodeServerUrl: 'http://localhost:4500',
    nodeServerPort: 4500,
    autoStartServer: true,
    mcpEnabled: false,
    httpApiEnabled: false
  },
  shortcuts: defaultShortcuts,
  _internal: {
    activeCategory: 'general'
  }
};
