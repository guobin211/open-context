/**
 * Tauri 应用事件类型定义
 * 与 Rust 后端的 app_events.rs 保持同步
 *
 * 使用示例：
 * ```typescript
 * import { listen } from '@tauri-apps/api/event';
 * import type { AppEvent } from './app-events.types';
 *
 * // 监听应用就绪事件
 * await listen<AppEvent>('app:ready', (event) => {
 *   console.log('App is ready:', event.payload);
 * });
 *
 * // 监听窗口事件
 * await listen<AppEvent>('window:focused', (event) => {
 *   const { window_id } = event.payload.data;
 *   console.log('Window focused:', window_id);
 * });
 * ```
 */

export type WindowId = string;

// ============================================
// 事件负载类型
// ============================================

export interface AppStartedPayload {
  version: string;
  timestamp: number;
}

export interface AppReadyPayload {
  timestamp: number;
}

export interface AppWillQuitPayload {
  timestamp: number;
}

export interface AppQuitPayload {
  timestamp: number;
}

export interface WindowCreatedPayload {
  window_id: WindowId;
  label: string;
  timestamp: number;
}

export interface WindowReadyPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowShownPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowHiddenPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowFocusedPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowBlurredPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowClosedPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowMovedPayload {
  window_id: WindowId;
  x: number;
  y: number;
  timestamp: number;
}

export interface WindowResizedPayload {
  window_id: WindowId;
  width: number;
  height: number;
  timestamp: number;
}

export interface WindowMinimizedPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowMaximizedPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowRestoredPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface WindowFullscreenPayload {
  window_id: WindowId;
  timestamp: number;
}

export interface AppStateSnapshot {
  version: string;
  active_windows: number;
  services_running: string[];
  theme: ThemeMode;
  locale: string;
}

export interface AppStateChangedPayload {
  old_state: AppStateSnapshot;
  new_state: AppStateSnapshot;
  timestamp: number;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeChangedPayload {
  theme: ThemeMode;
  timestamp: number;
}

export interface LocaleChangedPayload {
  locale: string;
  timestamp: number;
}

export interface ServiceStartedPayload {
  service_name: string;
  port: number | null;
  timestamp: number;
}

export type ServiceStopReason = 'user_requested' | 'crashed' | 'app_quit' | 'timeout' | { other: string };

export interface ServiceStoppedPayload {
  service_name: string;
  reason: ServiceStopReason;
  timestamp: number;
}

export interface ServiceErrorPayload {
  service_name: string;
  error: string;
  timestamp: number;
}

export type NotificationLevel = 'info' | 'warning' | 'error' | 'success';

export interface NotificationPayload {
  title: string;
  body: string;
  level: NotificationLevel;
  timestamp: number;
}

export interface UpdateAvailablePayload {
  version: string;
  release_notes: string | null;
  timestamp: number;
}

export interface UpdateDownloadedPayload {
  version: string;
  timestamp: number;
}

export interface NetworkStatusChangedPayload {
  online: boolean;
  timestamp: number;
}

export interface CustomPayload {
  name: string;
  payload: unknown;
  window_id: WindowId | null;
  timestamp: number;
}

// ============================================
// 事件联合类型
// ============================================

export type AppEventPayload =
  | { type: 'AppStarted'; data: AppStartedPayload }
  | { type: 'AppReady'; data: AppReadyPayload }
  | { type: 'AppWillQuit'; data: AppWillQuitPayload }
  | { type: 'AppQuit'; data: AppQuitPayload }
  | { type: 'WindowCreated'; data: WindowCreatedPayload }
  | { type: 'WindowReady'; data: WindowReadyPayload }
  | { type: 'WindowShown'; data: WindowShownPayload }
  | { type: 'WindowHidden'; data: WindowHiddenPayload }
  | { type: 'WindowFocused'; data: WindowFocusedPayload }
  | { type: 'WindowBlurred'; data: WindowBlurredPayload }
  | { type: 'WindowClosed'; data: WindowClosedPayload }
  | { type: 'WindowMoved'; data: WindowMovedPayload }
  | { type: 'WindowResized'; data: WindowResizedPayload }
  | { type: 'WindowMinimized'; data: WindowMinimizedPayload }
  | { type: 'WindowMaximized'; data: WindowMaximizedPayload }
  | { type: 'WindowRestored'; data: WindowRestoredPayload }
  | { type: 'WindowFullscreen'; data: WindowFullscreenPayload }
  | { type: 'AppStateChanged'; data: AppStateChangedPayload }
  | { type: 'ThemeChanged'; data: ThemeChangedPayload }
  | { type: 'LocaleChanged'; data: LocaleChangedPayload }
  | { type: 'ServiceStarted'; data: ServiceStartedPayload }
  | { type: 'ServiceStopped'; data: ServiceStoppedPayload }
  | { type: 'ServiceError'; data: ServiceErrorPayload }
  | { type: 'Notification'; data: NotificationPayload }
  | { type: 'UpdateAvailable'; data: UpdateAvailablePayload }
  | { type: 'UpdateDownloaded'; data: UpdateDownloadedPayload }
  | { type: 'NetworkStatusChanged'; data: NetworkStatusChangedPayload }
  | { type: 'Custom'; data: CustomPayload };

// ============================================
// 事件名称常量
// ============================================

export const APP_EVENT_NAMES = {
  // 应用生命周期
  APP_STARTED: 'app:started',
  APP_READY: 'app:ready',
  APP_WILL_QUIT: 'app:will_quit',
  APP_QUIT: 'app:quit',

  // 窗口事件
  WINDOW_CREATED: 'window:created',
  WINDOW_READY: 'window:ready',
  WINDOW_SHOWN: 'window:shown',
  WINDOW_HIDDEN: 'window:hidden',
  WINDOW_FOCUSED: 'window:focused',
  WINDOW_BLURRED: 'window:blurred',
  WINDOW_CLOSED: 'window:closed',
  WINDOW_MOVED: 'window:moved',
  WINDOW_RESIZED: 'window:resized',
  WINDOW_MINIMIZED: 'window:minimized',
  WINDOW_MAXIMIZED: 'window:maximized',
  WINDOW_RESTORED: 'window:restored',
  WINDOW_FULLSCREEN: 'window:fullscreen',

  // 应用状态
  APP_STATE_CHANGED: 'app_state:changed',
  THEME_CHANGED: 'theme:changed',
  LOCALE_CHANGED: 'locale:changed',

  // 服务
  SERVICE_STARTED: 'service:started',
  SERVICE_STOPPED: 'service:stopped',
  SERVICE_ERROR: 'service:error',

  // 系统
  NOTIFICATION: 'notification',
  UPDATE_AVAILABLE: 'update:available',
  UPDATE_DOWNLOADED: 'update:downloaded',
  NETWORK_STATUS_CHANGED: 'network:status_changed'
} as const;

export type AppEventName = (typeof APP_EVENT_NAMES)[keyof typeof APP_EVENT_NAMES];

// ============================================
// 工具函数类型
// ============================================

export interface AppEvent {
  type: string;
  data: Record<string, unknown>;
}

/**
 * 类型守卫：检查是否为窗口事件
 */
export function isWindowEvent(event: AppEventPayload): boolean {
  return event.type.startsWith('Window');
}

/**
 * 类型守卫：检查是否为应用生命周期事件
 */
export function isAppLifecycleEvent(event: AppEventPayload): boolean {
  return ['AppStarted', 'AppReady', 'AppWillQuit', 'AppQuit'].includes(event.type);
}

/**
 * 类型守卫：检查是否为服务事件
 */
export function isServiceEvent(event: AppEventPayload): boolean {
  return ['ServiceStarted', 'ServiceStopped', 'ServiceError'].includes(event.type);
}

/**
 * 提取事件的窗口 ID（如果存在）
 */
export function getWindowId(event: AppEventPayload): WindowId | null {
  if ('window_id' in event.data) {
    return event.data.window_id as WindowId;
  }
  return null;
}

/**
 * 提取事件的时间戳
 */
export function getTimestamp(event: AppEventPayload): number {
  return event.data.timestamp as number;
}
