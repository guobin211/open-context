use crate::common::log_config::{LogConfig, LogTarget};
use tauri::{AppHandle, Manager, WebviewWindow, Wry};
use tauri_plugin_log::{Target, TargetKind};
use tauri_plugin_prevent_default::Flags;

/// 执行窗口相关操作
fn perform_window_operations(window: &WebviewWindow) {
    // 先尝试设置焦点，再显示窗口，顺序更合理
    if let Err(e) = window.set_focus() {
        log::error!("窗口聚焦失败: {e}");
    }
    if let Err(e) = window.show() {
        log::error!("窗口显示失败: {e}");
    }
    // 将窗口带到最前面
    if let Err(e) = window.set_always_on_top(true) {
        log::warn!("无法设置窗口置顶: {e}");
    }
}

/// 处理单实例情况下的窗口操作和事件发送
fn handle_single_instance(app: &AppHandle, args: Vec<String>, cwd: String) {
    log::info!("tauri_plugin_single_instance: {args:?}, 工作目录: {cwd}");
    if let Some(window) = app.get_webview_window("main") {
        // 窗口操作
        perform_window_operations(&window);
        // 发送自定义事件通知主窗口
    } else {
        log::error!("未找到主窗口");
    }
}

/// 配置桌面平台的插件
pub fn setup_desktop_plugins(app: &mut tauri::App) {
    app.handle()
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec!["--plugin", "--tauri_plugin_autostart"]),
        ))
        .expect("tauri_plugin_autostart failed to initialize");
    app.handle()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .expect("tauri_plugin_updater failed to initialize");
    // Conditional compilation for macOS
    #[cfg(target_os = "macos")]
    {
        app.handle()
            .plugin(tauri_nspanel::init())
            .expect("tauri_nspanel failed to initialize");
    }
}

type TauriBuilder = tauri::Builder<Wry>;

/// 配置通用插件
pub fn setup_general_plugins(builder: TauriBuilder) -> TauriBuilder {
    // 配置日志插件
    let log_config = LogConfig::from_env("open-app");
    let log_level_filter = match log_config.level {
        log::Level::Trace => log::LevelFilter::Trace,
        log::Level::Debug => log::LevelFilter::Debug,
        log::Level::Info => log::LevelFilter::Info,
        log::Level::Warn => log::LevelFilter::Warn,
        log::Level::Error => log::LevelFilter::Error,
    };

    let mut log_targets = vec![];
    match log_config.target {
        LogTarget::Console => {
            log_targets.push(Target::new(TargetKind::Stdout));
            log_targets.push(Target::new(TargetKind::Webview));
        }
        LogTarget::File => {
            let log_file_name = format!("{}.log", log_config.file_prefix);
            log_targets.push(Target::new(TargetKind::LogDir {
                file_name: Some(log_file_name),
            }));
        }
        LogTarget::Both => {
            log_targets.push(Target::new(TargetKind::Stdout));
            log_targets.push(Target::new(TargetKind::Webview));
            let log_file_name = format!("{}.log", log_config.file_prefix);
            log_targets.push(Target::new(TargetKind::LogDir {
                file_name: Some(log_file_name),
            }));
        }
    }

    let log_plugin = tauri_plugin_log::Builder::new()
        .targets(log_targets)
        .level(log_level_filter)
        .build();

    let mut builder = builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_fs_pro::init())
        .plugin(tauri_plugin_upload::init())
        .plugin(tauri_plugin_process::init())
        .plugin(log_plugin)
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
            handle_single_instance(app, args, cwd);
        }))
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_localhost::Builder::new(14399).build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_positioner::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_autostart::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_cache::init())
        .plugin(tauri_plugin_tcp::init())
        .plugin(tauri_plugin_udp::init())
        .plugin(tauri_plugin_macos_permissions::init())
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_nspanel::init());

    // 添加防止默认行为的插件
    let flags = Flags::all()
        .difference(Flags::CONTEXT_MENU | Flags::DEV_TOOLS | Flags::RELOAD | Flags::FOCUS_MOVE);
    let prevent_default = tauri_plugin_prevent_default::Builder::default()
        .with_flags(flags)
        .build();
    builder = builder.plugin(prevent_default);
    log::info!("plugins initialized");
    builder
}
