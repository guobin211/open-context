/// Tauri 事件发射器
/// 提供在 Tauri 应用中发送事件到前端的便捷方法
use super::event_type::{AppEvent, WindowId};
use tauri::{AppHandle, Emitter, Manager};

/// 事件发射器，用于向前端发送事件
pub struct EventEmitter {
    app: AppHandle,
}

impl EventEmitter {
    /// 创建新的事件发射器
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    /// 发送全局事件（所有窗口都会收到）
    pub fn emit_global(&self, event: &AppEvent) -> tauri::Result<()> {
        let event_name = event.event_name();
        self.app.emit(&event_name, event)?;
        log::debug!("Emitted global event: {}", event_name);
        Ok(())
    }

    /// 发送事件到特定窗口
    pub fn emit_to_window(&self, window_id: &WindowId, event: &AppEvent) -> tauri::Result<()> {
        let event_name = event.event_name();
        let window_label = window_id.as_str();

        if let Some(window) = self.app.get_webview_window(window_label) {
            window.emit(&event_name, event)?;
            log::debug!("Emitted event to window {}: {}", window_label, event_name);
            Ok(())
        } else {
            log::warn!("Window not found: {}", window_label);
            Err(tauri::Error::WindowNotFound)
        }
    }

    /// 智能发送事件
    /// 如果事件包含 window_id，则只发送到该窗口；否则发送到所有窗口
    pub fn emit(&self, event: &AppEvent) -> tauri::Result<()> {
        if let Some(window_id) = event.window_id() {
            self.emit_to_window(window_id, event)
        } else {
            self.emit_global(event)
        }
    }

    /// 批量发送事件
    pub fn emit_batch(&self, events: &[AppEvent]) -> Vec<tauri::Result<()>> {
        events.iter().map(|event| self.emit(event)).collect()
    }
}

/// 事件监听器注册工具
pub struct EventListener;

impl EventListener {
    /// 在窗口创建时注册事件监听器（示例）
    pub fn setup_window_listeners(window: &tauri::WebviewWindow) {
        let window_id = WindowId::new(window.label());
        let window_clone = window.clone();

        // 监听窗口聚焦事件
        window.on_window_event(move |event| match event {
            tauri::WindowEvent::Focused(focused) => {
                let app_event = if *focused {
                    AppEvent::WindowFocused {
                        window_id: window_id.clone(),
                        timestamp: AppEvent::now(),
                    }
                } else {
                    AppEvent::WindowBlurred {
                        window_id: window_id.clone(),
                        timestamp: AppEvent::now(),
                    }
                };

                if let Some(app) = window_clone.app_handle().try_state::<EventEmitter>() {
                    let _ = app.emit_global(&app_event);
                }
            }
            tauri::WindowEvent::Moved(position) => {
                let app_event = AppEvent::WindowMoved {
                    window_id: window_id.clone(),
                    x: position.x,
                    y: position.y,
                    timestamp: AppEvent::now(),
                };

                if let Some(app) = window_clone.app_handle().try_state::<EventEmitter>() {
                    let _ = app.emit_global(&app_event);
                }
            }
            tauri::WindowEvent::Resized(size) => {
                let app_event = AppEvent::WindowResized {
                    window_id: window_id.clone(),
                    width: size.width,
                    height: size.height,
                    timestamp: AppEvent::now(),
                };

                if let Some(app) = window_clone.app_handle().try_state::<EventEmitter>() {
                    let _ = app.emit_global(&app_event);
                }
            }
            tauri::WindowEvent::CloseRequested { .. } => {
                let app_event = AppEvent::WindowClosed {
                    window_id: window_id.clone(),
                    timestamp: AppEvent::now(),
                };

                if let Some(app) = window_clone.app_handle().try_state::<EventEmitter>() {
                    let _ = app.emit_global(&app_event);
                }
            }
            _ => {}
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_events::{NotificationLevel, ThemeMode};

    #[test]
    fn test_event_creation() {
        let event = AppEvent::AppReady {
            timestamp: AppEvent::now(),
        };
        assert_eq!(event.event_name(), "app:ready");
    }

    #[test]
    fn test_window_event_routing() {
        let window_id = WindowId::new("test-window");
        let event = AppEvent::WindowFocused {
            window_id: window_id.clone(),
            timestamp: AppEvent::now(),
        };

        assert_eq!(event.window_id(), Some(&window_id));
        assert_eq!(event.event_name(), "window:focused");
    }

    #[test]
    fn test_theme_event() {
        let event = AppEvent::ThemeChanged {
            theme: ThemeMode::Dark,
            timestamp: AppEvent::now(),
        };

        let json = serde_json::to_string(&event).unwrap();
        println!("JSON: {}", json);
        // JSON 使用 serde 的 tag/content 格式，type 字段值是 "ThemeChanged"
        assert!(json.contains("ThemeChanged"));
        assert!(json.contains("dark"));
    }

    #[test]
    fn test_notification_event() {
        let event = AppEvent::Notification {
            title: "Test".to_string(),
            body: "Test notification".to_string(),
            level: NotificationLevel::Info,
            timestamp: AppEvent::now(),
        };

        assert_eq!(event.event_name(), "notification");
    }
}
