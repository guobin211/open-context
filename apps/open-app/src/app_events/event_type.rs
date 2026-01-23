use serde::{Deserialize, Serialize};

/// 窗口标识符，用于区分不同的窗口实例
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct WindowId(pub String);

impl WindowId {
    pub fn new(id: impl Into<String>) -> Self {
        Self(id.into())
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl From<String> for WindowId {
    fn from(id: String) -> Self {
        Self(id)
    }
}

impl From<&str> for WindowId {
    fn from(id: &str) -> Self {
        Self(id.to_string())
    }
}

/// 应用程序事件枚举
/// 涵盖应用生命周期、窗口管理、状态变化等常见事件
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum AppEvent {
    // ============================================
    // 应用生命周期事件
    // ============================================
    /// 应用启动事件
    AppStarted { version: String, timestamp: i64 },

    /// 应用就绪事件（所有初始化完成）
    AppReady { timestamp: i64 },

    /// 应用即将退出
    AppWillQuit { timestamp: i64 },

    /// 应用已退出
    AppQuit { timestamp: i64 },

    // ============================================
    // 窗口事件
    // ============================================
    /// 窗口创建
    WindowCreated {
        window_id: WindowId,
        label: String,
        timestamp: i64,
    },

    /// 窗口就绪（窗口完成加载）
    WindowReady { window_id: WindowId, timestamp: i64 },

    /// 窗口显示
    WindowShown { window_id: WindowId, timestamp: i64 },

    /// 窗口隐藏
    WindowHidden { window_id: WindowId, timestamp: i64 },

    /// 窗口聚焦
    WindowFocused { window_id: WindowId, timestamp: i64 },

    /// 窗口失焦
    WindowBlurred { window_id: WindowId, timestamp: i64 },

    /// 窗口关闭
    WindowClosed { window_id: WindowId, timestamp: i64 },

    /// 窗口移动
    WindowMoved {
        window_id: WindowId,
        x: i32,
        y: i32,
        timestamp: i64,
    },

    /// 窗口调整大小
    WindowResized {
        window_id: WindowId,
        width: u32,
        height: u32,
        timestamp: i64,
    },

    /// 窗口最小化
    WindowMinimized { window_id: WindowId, timestamp: i64 },

    /// 窗口最大化
    WindowMaximized { window_id: WindowId, timestamp: i64 },

    /// 窗口恢复（从最小化或最大化恢复）
    WindowRestored { window_id: WindowId, timestamp: i64 },

    /// 窗口进入全屏
    WindowFullscreen { window_id: WindowId, timestamp: i64 },

    // ============================================
    // 应用状态变化事件
    // ============================================
    /// 应用状态变化
    AppStateChanged {
        old_state: AppStateSnapshot,
        new_state: AppStateSnapshot,
        timestamp: i64,
    },

    /// 主题变化
    ThemeChanged { theme: ThemeMode, timestamp: i64 },

    /// 语言变化
    LocaleChanged { locale: String, timestamp: i64 },

    // ============================================
    // 服务/进程事件
    // ============================================
    /// 后端服务启动
    ServiceStarted {
        service_name: String,
        port: Option<u16>,
        timestamp: i64,
    },

    /// 后端服务停止
    ServiceStopped {
        service_name: String,
        reason: ServiceStopReason,
        timestamp: i64,
    },

    /// 后端服务错误
    ServiceError {
        service_name: String,
        error: String,
        timestamp: i64,
    },

    // ============================================
    // 系统事件
    // ============================================
    /// 系统通知
    Notification {
        title: String,
        body: String,
        level: NotificationLevel,
        timestamp: i64,
    },

    /// 自动更新可用
    UpdateAvailable {
        version: String,
        release_notes: Option<String>,
        timestamp: i64,
    },

    /// 自动更新下载完成
    UpdateDownloaded { version: String, timestamp: i64 },

    /// 网络状态变化
    NetworkStatusChanged { online: bool, timestamp: i64 },

    // ============================================
    // 任务事件
    // ============================================
    /// 任务创建
    TaskCreated {
        task_id: String,
        task_type: String,
        timestamp: i64,
    },

    /// 任务开始执行
    TaskStarted {
        task_id: String,
        task_type: String,
        timestamp: i64,
    },

    /// 任务进度更新
    TaskProgress {
        task_id: String,
        task_type: String,
        progress: u8,
        message: Option<String>,
        timestamp: i64,
    },

    /// 任务完成
    TaskCompleted {
        task_id: String,
        task_type: String,
        result: Option<serde_json::Value>,
        timestamp: i64,
    },

    /// 任务失败
    TaskFailed {
        task_id: String,
        task_type: String,
        error: String,
        timestamp: i64,
    },

    /// 任务取消
    TaskCancelled {
        task_id: String,
        task_type: String,
        timestamp: i64,
    },

    // ============================================
    // 自定义事件
    // ============================================
    /// 自定义事件（用于扩展）
    Custom {
        name: String,
        payload: serde_json::Value,
        window_id: Option<WindowId>,
        timestamp: i64,
    },
}

/// 应用状态快照（用于状态变化事件）
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppStateSnapshot {
    pub version: String,
    pub active_windows: usize,
    pub services_running: Vec<String>,
    pub theme: ThemeMode,
    pub locale: String,
}

/// 主题模式
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ThemeMode {
    Light,
    Dark,
    System,
}

/// 服务停止原因
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceStopReason {
    /// 用户主动停止
    UserRequested,
    /// 服务崩溃
    Crashed,
    /// 应用退出
    AppQuit,
    /// 超时
    Timeout,
    /// 其他原因
    Other(String),
}

/// 通知级别
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum NotificationLevel {
    Info,
    Warning,
    Error,
    Success,
}

impl AppEvent {
    /// 获取事件的窗口 ID（如果适用）
    pub fn window_id(&self) -> Option<&WindowId> {
        match self {
            Self::WindowCreated { window_id, .. }
            | Self::WindowReady { window_id, .. }
            | Self::WindowShown { window_id, .. }
            | Self::WindowHidden { window_id, .. }
            | Self::WindowFocused { window_id, .. }
            | Self::WindowBlurred { window_id, .. }
            | Self::WindowClosed { window_id, .. }
            | Self::WindowMoved { window_id, .. }
            | Self::WindowResized { window_id, .. }
            | Self::WindowMinimized { window_id, .. }
            | Self::WindowMaximized { window_id, .. }
            | Self::WindowRestored { window_id, .. }
            | Self::WindowFullscreen { window_id, .. } => Some(window_id),
            Self::Custom { window_id, .. } => window_id.as_ref(),
            _ => None,
        }
    }

    /// 获取事件的时间戳
    pub fn timestamp(&self) -> i64 {
        match self {
            Self::AppStarted { timestamp, .. }
            | Self::AppReady { timestamp, .. }
            | Self::AppWillQuit { timestamp, .. }
            | Self::AppQuit { timestamp, .. }
            | Self::WindowCreated { timestamp, .. }
            | Self::WindowReady { timestamp, .. }
            | Self::WindowShown { timestamp, .. }
            | Self::WindowHidden { timestamp, .. }
            | Self::WindowFocused { timestamp, .. }
            | Self::WindowBlurred { timestamp, .. }
            | Self::WindowClosed { timestamp, .. }
            | Self::WindowMoved { timestamp, .. }
            | Self::WindowResized { timestamp, .. }
            | Self::WindowMinimized { timestamp, .. }
            | Self::WindowMaximized { timestamp, .. }
            | Self::WindowRestored { timestamp, .. }
            | Self::WindowFullscreen { timestamp, .. }
            | Self::AppStateChanged { timestamp, .. }
            | Self::ThemeChanged { timestamp, .. }
            | Self::LocaleChanged { timestamp, .. }
            | Self::ServiceStarted { timestamp, .. }
            | Self::ServiceStopped { timestamp, .. }
            | Self::ServiceError { timestamp, .. }
            | Self::Notification { timestamp, .. }
            | Self::UpdateAvailable { timestamp, .. }
            | Self::UpdateDownloaded { timestamp, .. }
            | Self::NetworkStatusChanged { timestamp, .. }
            | Self::TaskCreated { timestamp, .. }
            | Self::TaskStarted { timestamp, .. }
            | Self::TaskProgress { timestamp, .. }
            | Self::TaskCompleted { timestamp, .. }
            | Self::TaskFailed { timestamp, .. }
            | Self::TaskCancelled { timestamp, .. }
            | Self::Custom { timestamp, .. } => *timestamp,
        }
    }

    /// 获取事件名称
    pub fn event_name(&self) -> String {
        match self {
            Self::AppStarted { .. } => "app:started".to_string(),
            Self::AppReady { .. } => "app:ready".to_string(),
            Self::AppWillQuit { .. } => "app:will_quit".to_string(),
            Self::AppQuit { .. } => "app:quit".to_string(),
            Self::WindowCreated { .. } => "window:created".to_string(),
            Self::WindowReady { .. } => "window:ready".to_string(),
            Self::WindowShown { .. } => "window:shown".to_string(),
            Self::WindowHidden { .. } => "window:hidden".to_string(),
            Self::WindowFocused { .. } => "window:focused".to_string(),
            Self::WindowBlurred { .. } => "window:blurred".to_string(),
            Self::WindowClosed { .. } => "window:closed".to_string(),
            Self::WindowMoved { .. } => "window:moved".to_string(),
            Self::WindowResized { .. } => "window:resized".to_string(),
            Self::WindowMinimized { .. } => "window:minimized".to_string(),
            Self::WindowMaximized { .. } => "window:maximized".to_string(),
            Self::WindowRestored { .. } => "window:restored".to_string(),
            Self::WindowFullscreen { .. } => "window:fullscreen".to_string(),
            Self::AppStateChanged { .. } => "app_state:changed".to_string(),
            Self::ThemeChanged { .. } => "theme:changed".to_string(),
            Self::LocaleChanged { .. } => "locale:changed".to_string(),
            Self::ServiceStarted { .. } => "service:started".to_string(),
            Self::ServiceStopped { .. } => "service:stopped".to_string(),
            Self::ServiceError { .. } => "service:error".to_string(),
            Self::Notification { .. } => "notification".to_string(),
            Self::UpdateAvailable { .. } => "update:available".to_string(),
            Self::UpdateDownloaded { .. } => "update:downloaded".to_string(),
            Self::NetworkStatusChanged { .. } => "network:status_changed".to_string(),
            Self::TaskCreated { .. } => "task:created".to_string(),
            Self::TaskStarted { .. } => "task:started".to_string(),
            Self::TaskProgress { .. } => "task:progress".to_string(),
            Self::TaskCompleted { .. } => "task:completed".to_string(),
            Self::TaskFailed { .. } => "task:failed".to_string(),
            Self::TaskCancelled { .. } => "task:cancelled".to_string(),
            Self::Custom { name, .. } => name.clone(),
        }
    }

    /// 创建当前时间戳
    pub fn now() -> i64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis() as i64
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_window_id_creation() {
        let id = WindowId::new("main-window");
        assert_eq!(id.as_str(), "main-window");
    }

    #[test]
    fn test_event_window_id_extraction() {
        let window_id = WindowId::new("test-window");
        let event = AppEvent::WindowCreated {
            window_id: window_id.clone(),
            label: "Test Window".to_string(),
            timestamp: AppEvent::now(),
        };

        assert_eq!(event.window_id(), Some(&window_id));
    }

    #[test]
    fn test_event_name() {
        let event = AppEvent::AppReady {
            timestamp: AppEvent::now(),
        };
        assert_eq!(event.event_name(), "app:ready");
    }

    #[test]
    fn test_serialization() {
        let event = AppEvent::WindowReady {
            window_id: WindowId::new("main"),
            timestamp: 1234567890,
        };

        let json = serde_json::to_string(&event).unwrap();
        let deserialized: AppEvent = serde_json::from_str(&json).unwrap();

        assert_eq!(event.event_name(), deserialized.event_name());
    }
}
