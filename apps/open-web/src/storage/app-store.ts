import { create } from 'zustand';
import { emit, listen } from '@tauri-apps/api/event';
import { logger } from '@/lib/logger';

interface AppState {
  theme: 'light' | 'dark';
  language: string;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: string) => void;
}

/**
 * App Store - 全局应用状态管理
 *
 * 功能定位：管理全局应用状态（主题、语言等），支持跨窗口状态同步
 * 技术特性：
 * - Zustand 轻量级状态管理
 * - Tauri 事件系统支持多窗口状态同步
 * - JSON 序列化确保跨窗口通信
 * - Logger 记录状态变更和事件发送/接收
 */
export const useAppStore = create<AppState>((set) => ({
  theme: 'light',
  language: 'zh-CN',

  setTheme: (theme) => {
    set({ theme });
    logger.info({ theme }, 'App store: theme updated');

    try {
      emit('app-state-changed', { type: 'theme', value: theme });
      logger.info({ type: 'theme', value: theme }, 'App store: state change emitted');
    } catch (error) {
      logger.error({ error }, 'App store: failed to emit state change');
    }
  },

  setLanguage: (language) => {
    set({ language });
    logger.info({ language }, 'App store: language updated');

    try {
      emit('app-state-changed', { type: 'language', value: language });
      logger.info({ type: 'language', value: language }, 'App store: state change emitted');
    } catch (error) {
      logger.error({ error }, 'App store: failed to emit state change');
    }
  }
}));

interface AppStateChangeEvent {
  type: 'theme' | 'language';
  value: string;
}

/**
 * 初始化多窗口状态同步监听
 *
 * 在应用初始化时调用此函数，监听其他窗口的状态变化事件
 * 并更新本地状态以保持一致性
 */
export function initializeMultiWindowSync() {
  logger.info('App store: initializing multi-window sync');

  let unlisten: Promise<() => void> | null = null;

  try {
    unlisten = listen<AppStateChangeEvent>('app-state-changed', (event) => {
      const { type, value } = event.payload;
      logger.info({ type, value }, 'App store: received state change event');

      if (type === 'theme') {
        const currentState = useAppStore.getState().theme;
        if (currentState !== value) {
          useAppStore.getState().setTheme(value as 'light' | 'dark');
          logger.info('App store: theme synced from remote window');
        }
      } else if (type === 'language') {
        const currentState = useAppStore.getState().language;
        if (currentState !== value) {
          useAppStore.getState().setLanguage(value);
          logger.info('App store: language synced from remote window');
        }
      }
    });

    logger.info('App store: multi-window sync initialized successfully');
  } catch (error) {
    logger.error({ error }, 'App store: failed to initialize multi-window sync');
  }

  return () => {
    if (unlisten) {
      unlisten.then((fn) => fn());
      logger.info('App store: multi-window sync cleanup');
    }
  };
}
