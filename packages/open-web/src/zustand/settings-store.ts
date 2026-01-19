import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig } from '@/types/settings.types';

interface SettingsStore {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  resetConfig: () => void;
}

const defaultConfig: AppConfig = {
  activeCategory: 'general',
  language: 'zh-CN',
  theme: 'system',
  dataStoragePath: '',
  cloudStorage: {
    enabled: false,
    cosConfig: {
      secretId: '',
      secretKey: '',
      region: '',
      bucket: ''
    }
  },
  modelProvider: {
    type: 'local',
    localModel: 'gpt-3.5-turbo',
    cloudProvider: 'openai',
    apiKey: ''
  },
  openNodeServer: {
    enabled: true,
    url: 'http://localhost:4500',
    port: 4500
  },
  services: {
    mcpEnabled: false,
    httpEnabled: false
  },
  authKey: ''
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      config: defaultConfig,
      setConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates }
        }));
      },
      resetConfig: () => {
        set(() => ({
          config: defaultConfig,
          activeCategory: 'general'
        }));
      }
    }),
    {
      name: 'open-context-settings',
      partialize: (state) => ({
        config: state.config
      })
    }
  )
);
