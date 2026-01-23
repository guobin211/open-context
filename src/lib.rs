mod app_commands;
pub mod app_config;
mod app_event_emitter;
mod app_events;
mod app_file_tree;
mod app_file_tree_commands;
mod app_runtime;
mod app_sidecar;
pub mod app_state;
mod app_state_file;
mod app_state_note;
mod app_state_repo_link;
mod app_state_workspace;
pub mod app_task;

// ==================== Tauri Command Exports ====================
use app_commands::{
    // Task commands
    cancel_task,
    cleanup_tasks,
    clone_repository_task,
    create_file,
    create_note,
    create_repository,
    create_workspace,
    delete_file,
    delete_note,
    delete_repository,
    delete_workspace,
    // File commands
    get_all_files,
    // Note commands
    get_all_notes,
    // Repository commands
    get_all_repositories,
    // Workspace commands
    get_all_workspaces,
    get_favorited_notes,
    get_file,
    get_note,
    get_notes_by_type,
    get_repository,
    get_task,
    get_workspace,
    import_files_task,
    index_repository_task,
    list_tasks,
    // System command
    ping,
    search_notes,
    set_note_favorite,
    toggle_note_favorite,
    update_file,
    update_note,
    update_repository,
    update_workspace,
};

use app_file_tree_commands::{
    clear_cache, create_file_or_dir, delete_file_or_dir, read_dir, rename_file_or_dir,
    search_workspace_files, stop_watch_dir, watch_dir,
};

// ==================== Event Exports ====================
use app_event_emitter::{EventEmitter, EventListener};
use app_events::AppEvent;

// ==================== State Management Exports ====================
use app_state::AppState;
use app_task::TaskManager;
use tauri::Manager;

/// Run the application
pub fn run() {
    let app_state = AppState::new().expect("Failed to initialize app state");
    let task_manager = TaskManager::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
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
        .manage(app_state)
        .manage(task_manager)
        .setup(|app| {
            // 初始化事件发射器并管理其状态
            let event_emitter = EventEmitter::new(app.handle().clone());
            app.manage(event_emitter);

            // 发送应用启动事件
            let version = app.package_info().version.to_string();
            let emitter = app.state::<EventEmitter>();
            let _ = emitter.emit_global(&AppEvent::AppStarted {
                version,
                timestamp: AppEvent::now(),
            });

            // 为主窗口设置监听器
            if let Some(main_window) = app.get_webview_window("main") {
                EventListener::setup_window_listeners(&main_window);
            }

            // 发送应用就绪事件
            let _ = emitter.emit_global(&AppEvent::AppReady {
                timestamp: AppEvent::now(),
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Workspace commands
            get_all_workspaces,
            get_workspace,
            create_workspace,
            update_workspace,
            delete_workspace,
            // Note commands
            get_all_notes,
            get_note,
            create_note,
            update_note,
            delete_note,
            search_notes,
            get_notes_by_type,
            toggle_note_favorite,
            set_note_favorite,
            get_favorited_notes,
            // File commands
            get_all_files,
            get_file,
            create_file,
            update_file,
            delete_file,
            // Repository commands
            get_all_repositories,
            get_repository,
            create_repository,
            update_repository,
            delete_repository,
            // Task commands
            get_task,
            list_tasks,
            cancel_task,
            cleanup_tasks,
            clone_repository_task,
            index_repository_task,
            import_files_task,
            // File tree commands
            read_dir,
            clear_cache,
            watch_dir,
            stop_watch_dir,
            create_file_or_dir,
            rename_file_or_dir,
            delete_file_or_dir,
            search_workspace_files,
            // System command
            ping,
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app_handle, event| match event {
            tauri::RunEvent::ExitRequested { .. } => {
                if let Some(emitter) = app_handle.try_state::<EventEmitter>() {
                    let _ = emitter.emit_global(&AppEvent::AppWillQuit {
                        timestamp: AppEvent::now(),
                    });
                }
            }
            tauri::RunEvent::Exit => {
                if let Some(emitter) = app_handle.try_state::<EventEmitter>() {
                    let _ = emitter.emit_global(&AppEvent::AppQuit {
                        timestamp: AppEvent::now(),
                    });
                }
            }
            _ => {}
        });
}
