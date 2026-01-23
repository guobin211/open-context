/**
 * React Hook for listening to Tauri app events
 * 简化 Tauri 事件监听的 React Hook
 *
 * 使用示例：
 * ```tsx
 * import { useAppEvent, useWindowEvent } from '@/hooks/use-app-events';
 *
 * function MyComponent() {
 *   // 监听应用就绪事件
 *   useAppEvent('app:ready', (payload) => {
 *     console.log('App ready at:', payload.timestamp);
 *   });
 *
 *   // 监听窗口聚焦事件
 *   useWindowEvent('window:focused', (payload) => {
 *     console.log('Window focused:', payload.window_id);
 *   });
 *
 *   // 监听主题变化
 *   const theme = useThemeEvent();
 *
 *   // 监听服务状态
 *   const { isServiceRunning } = useServiceStatus('node-server');
 *
 *   return <div>...</div>;
 * }
 * ```
 */

import { useEffect, useRef, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type {
  AppEventName,
  AppEventPayload,
  AppReadyPayload,
  AppStartedPayload,
  LocaleChangedPayload,
  NotificationPayload,
  ServiceErrorPayload,
  ServiceStartedPayload,
  ServiceStoppedPayload,
  ThemeChangedPayload,
  ThemeMode,
  UpdateAvailablePayload,
  WindowFocusedPayload
} from '../lib/app-events';

/**
 * 通用事件监听 Hook
 */
export function useAppEvent<T = AppEventPayload>(
  eventName: string,
  handler: (payload: T) => void,
  deps: unknown[] = []
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    const setupListener = async () => {
      unlisten = await listen<T>(eventName, (event) => {
        handlerRef.current(event.payload);
      });
    };

    setupListener().catch(console.error);

    return () => {
      if (unlisten) {
        unlisten();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventName, ...deps]);
}

/**
 * 窗口事件监听 Hook
 */
export function useWindowEvent<T = AppEventPayload>(
  eventName: AppEventName,
  handler: (payload: T) => void,
  deps: unknown[] = []
) {
  return useAppEvent(eventName, handler, deps);
}

/**
 * 应用就绪事件 Hook
 */
export function useAppReady(callback: (payload: AppReadyPayload) => void) {
  useAppEvent<AppReadyPayload>('app:ready', callback);
}

/**
 * 应用启动事件 Hook
 */
export function useAppStarted(callback: (payload: AppStartedPayload) => void) {
  useAppEvent<AppStartedPayload>('app:started', callback);
}

/**
 * 主题变化监听 Hook
 * 返回当前主题，并在主题变化时自动更新
 */
export function useThemeEvent(initialTheme: ThemeMode = 'system') {
  const [theme, setTheme] = useState<ThemeMode>(initialTheme);

  useAppEvent<ThemeChangedPayload>('theme:changed', (payload) => {
    setTheme(payload.theme);
  });

  return theme;
}

/**
 * 语言变化监听 Hook
 */
export function useLocaleEvent(initialLocale = 'en-US') {
  const [locale, setLocale] = useState(initialLocale);

  useAppEvent<LocaleChangedPayload>('locale:changed', (payload) => {
    setLocale(payload.locale);
  });

  return locale;
}

/**
 * 窗口聚焦状态 Hook
 */
export function useWindowFocus(windowId?: string) {
  const [isFocused, setIsFocused] = useState(true);

  useAppEvent<WindowFocusedPayload>('window:focused', (payload) => {
    if (!windowId || payload.window_id === windowId) {
      setIsFocused(true);
    }
  });

  useAppEvent<WindowFocusedPayload>('window:blurred', (payload) => {
    if (!windowId || payload.window_id === windowId) {
      setIsFocused(false);
    }
  });

  return isFocused;
}

/**
 * 服务状态监听 Hook
 */
export function useServiceStatus(serviceName: string) {
  const [isRunning, setIsRunning] = useState(false);
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useAppEvent<ServiceStartedPayload>('service:started', (payload) => {
    if (payload.service_name === serviceName) {
      setIsRunning(true);
      setPort(payload.port);
      setError(null);
    }
  });

  useAppEvent<ServiceStoppedPayload>('service:stopped', (payload) => {
    if (payload.service_name === serviceName) {
      setIsRunning(false);
      setPort(null);
    }
  });

  useAppEvent<ServiceErrorPayload>('service:error', (payload) => {
    if (payload.service_name === serviceName) {
      setError(payload.error);
    }
  });

  return { isRunning, port, error };
}

/**
 * 通知监听 Hook
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  useAppEvent<NotificationPayload>('notification', (payload) => {
    setNotifications((prev) => [...prev, payload]);
  });

  const clearNotifications = () => setNotifications([]);

  const removeNotification = (timestamp: number) => {
    setNotifications((prev) => prev.filter((n) => n.timestamp !== timestamp));
  };

  return { notifications, clearNotifications, removeNotification };
}

/**
 * 更新检查 Hook
 */
export function useUpdateCheck() {
  const [updateAvailable, setUpdateAvailable] = useState<UpdateAvailablePayload | null>(null);
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useAppEvent<UpdateAvailablePayload>('update:available', (payload) => {
    setUpdateAvailable(payload);
  });

  useAppEvent('update:downloaded', () => {
    setUpdateDownloaded(true);
  });

  return { updateAvailable, updateDownloaded };
}

/**
 * 网络状态监听 Hook
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useAppEvent<{ online: boolean }>('network:status_changed', (payload) => {
    setIsOnline(payload.online);
  });

  return isOnline;
}

/**
 * 多事件监听 Hook
 * 用于同时监听多个事件
 */
export function useMultipleEvents(
  events: Array<{
    name: string;
    handler: (payload: unknown) => void;
  }>
) {
  useEffect(() => {
    const unlisteners: UnlistenFn[] = [];

    const setupListeners = async () => {
      for (const { name, handler } of events) {
        const unlisten = await listen(name, (event) => {
          handler(event.payload);
        });
        unlisteners.push(unlisten);
      }
    };

    setupListeners().catch(console.error);

    return () => {
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, [events]);
}

/**
 * 事件过滤 Hook
 * 只监听特定条件的事件
 */
export function useFilteredEvent<T = AppEventPayload>(
  eventName: string,
  filter: (payload: T) => boolean,
  handler: (payload: T) => void,
  deps: unknown[] = []
) {
  useAppEvent<T>(
    eventName,
    (payload) => {
      if (filter(payload)) {
        handler(payload);
      }
    },
    deps
  );
}
