mod dto;
mod file_commands;
mod file_tree_commands;
mod note_commands;
mod repository_commands;
mod system_commands;
mod task_commands;
mod workspace_commands;

use crate::TauriBuilder;

/// 配置调用处理程序
pub fn setup_invoke_handler(builder: TauriBuilder) -> TauriBuilder {
    builder.invoke_handler(tauri::generate_handler![
        // system
        system_commands::ping,
        // workspace
        workspace_commands::get_all_workspaces,
        workspace_commands::get_workspace,
        workspace_commands::create_workspace,
        workspace_commands::update_workspace,
        workspace_commands::delete_workspace,
        // file
        file_commands::get_all_files,
        file_commands::get_file,
        file_commands::create_file,
        file_commands::update_file,
        file_commands::delete_file,
        // file tree
        file_tree_commands::read_dir,
        file_tree_commands::clear_cache,
        file_tree_commands::watch_dir,
        file_tree_commands::stop_watch_dir,
        file_tree_commands::create_file_or_dir,
        file_tree_commands::rename_file_or_dir,
        file_tree_commands::delete_file_or_dir,
        file_tree_commands::search_workspace_files,
        // note
        note_commands::get_all_notes,
        note_commands::get_note,
        note_commands::create_note,
        note_commands::update_note,
        note_commands::delete_note,
        note_commands::search_notes,
        note_commands::get_notes_by_type,
        note_commands::toggle_note_favorite,
        note_commands::set_note_favorite,
        note_commands::get_favorited_notes,
        // repository
        repository_commands::get_all_repositories,
        repository_commands::get_repository,
        repository_commands::create_repository,
        repository_commands::update_repository,
        repository_commands::delete_repository,
        // task
        task_commands::get_task,
        task_commands::list_tasks,
        task_commands::cancel_task,
        task_commands::cleanup_tasks,
        task_commands::clone_repository_task,
        task_commands::index_repository_task,
        task_commands::import_files_task,
    ])
}
