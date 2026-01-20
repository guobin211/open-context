mod app_commands;
pub mod app_config;
mod app_event_emitter;
mod app_events;
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
    get_favorited_notes,
    get_notes_by_type,
    // Repository commands
    get_all_repositories,
    // Workspace commands
    get_all_workspaces,
    get_file,
    get_note,
    get_repository,
    get_workspace,
    // System command
    ping,
    search_notes,
    set_note_favorite,
    toggle_note_favorite,
    update_file,
    update_note,
    update_repository,
    update_workspace,
    // Task commands
    cancel_task,
    cleanup_tasks,
    clone_repository_task,
    get_task,
    import_files_task,
    index_repository_task,
    list_tasks,
};

// ==================== Event Exports ====================

// ==================== State Management Exports ====================
use app_state::AppState;
use app_task::TaskManager;

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
            // System command
            ping,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
