pub mod log_config;

pub const APP_NAME: &str = "open-context";
pub const APP_VERSION: &str = env!("CARGO_PKG_VERSION");
// 启动台窗口
pub const MAIN_WINDOW_LABEL: &str = "main";
// 演练和测试窗口
pub const PLAYGROUND_WINDOW_LABEL: &str = "app-playground";
// 设置窗口
pub const SETTINGS_WINDOW_LABEL: &str = "app-settings";
// 工作空间窗口
pub const WORKSPACE_WINDOW_LABEL: &str = "app-workspace";
// 浏览器窗口
pub const BROWSER_WINDOW_LABEL: &str = "app-browser";
// 终端窗口
pub const TERMINAL_WINDOW_LABEL: &str = "app-terminal";

#[cfg(target_os = "macos")]
pub const DEFAULT_SHORTCUT: &str = "command+shift+space";

#[cfg(any(target_os = "windows", target_os = "linux"))]
pub const DEFAULT_SHORTCUT: &str = "ctrl+shift+space";
