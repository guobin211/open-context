export interface AppConfig {
  activeCategory: string | null;
  language: string;
  theme: 'light' | 'dark' | 'system';
  dataStoragePath: string;
  cloudStorage: {
    enabled: boolean;
    cosConfig: {
      secretId: string;
      secretKey: string;
      region: string;
      bucket: string;
    };
  };
  modelProvider: {
    type: 'local' | 'cloud';
    localModel: string;
    cloudProvider: string;
    apiKey: string;
  };
  openNodeServer: {
    enabled: boolean;
    url: string;
    port: number;
  };
  services: {
    mcpEnabled: boolean;
    httpEnabled: boolean;
  };
  authKey: string;
}

export type SettingsCategory = 'general' | 'appearance' | 'data' | 'cloud' | 'models' | 'server' | 'services' | 'auth';

export interface SettingsMenuItem {
  id: SettingsCategory;
  label: string;
  icon: string;
  description?: string;
}
