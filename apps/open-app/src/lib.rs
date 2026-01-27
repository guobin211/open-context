pub mod app_command;
pub mod app_events;
pub mod app_plugins;
pub mod app_service;
pub mod app_state;
pub mod logging;

use crate::app_state::init_app_dirs;
use app_service::TaskManager;
use app_state::AppState;
use futures::lock::Mutex;
use tauri::{Context, Wry};

pub type TauriBuilder = tauri::Builder<Wry>;

/// Run the application
pub fn run() {
    let app_state = AppState::new().expect("Failed to initialize app state");
    init_app_dirs().expect("Failed to initialize app dirs");
    let task_manager = TaskManager::new();

    let mut builder = tauri::Builder::default();
    // states
    builder = builder.manage(Mutex::new(app_state));
    builder = builder.manage(Mutex::new(task_manager));

    // plugins
    builder = builder.setup(|app: &mut tauri::App| {
        #[cfg(desktop)]
        app_plugins::setup_desktop_plugins(app);
        Ok(())
    });
    builder = app_plugins::setup_general_plugins(builder);

    // invoke handler
    builder = app_command::setup_invoke_handler(builder);

    // background task
    tauri::async_runtime::spawn(async move {
        // 启动后台任务
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
        log::info!("Background task completed");
    });
    // context
    let ctx: Context = tauri::generate_context!();
    builder.run(ctx).unwrap_or_else(|err| {
        log::error!("error while running tauri application: {err}");
        panic!("error while running tauri application: {err}");
    });
}
