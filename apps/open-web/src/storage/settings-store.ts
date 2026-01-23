import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppConfig } from '../lib/app-settings';
import { defaultAppConfig } from '../lib/default-settings';

interface SettingsStore {
  config: AppConfig;
  setConfig: (config: Partial<AppConfig>) => void;
  updateConfig: (path: string, value: unknown) => void;
  resetConfig: () => void;
  exportConfig: () => string;
  importConfig: (json: string) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      config: defaultAppConfig,
      setConfig: (updates) => {
        set((state) => ({
          config: { ...state.config, ...updates }
        }));
      },
      updateConfig: (path, value) => {
        const keys = path.split('.');
        set((state) => {
          const newConfig = JSON.parse(JSON.stringify(state.config));
          let current = newConfig;
          for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
              current[keys[i]] = {};
            }
            current = current[keys[i]];
          }
          current[keys[keys.length - 1]] = value;
          return { config: newConfig };
        });
      },
      resetConfig: () => {
        set(() => ({ config: defaultAppConfig }));
      },
      exportConfig: () => {
        const config = get().config;
        return JSON.stringify(config, null, 2);
      },
      importConfig: (json) => {
        try {
          const parsed = JSON.parse(json);
          set(() => ({ config: parsed }));
        } catch (error) {
          console.error('Failed to import config:', error);
          throw error;
        }
      }
    }),
    {
      name: 'open-context-settings',
      version: 1,
      partialize: (state) => ({ config: state.config })
    }
  )
);
