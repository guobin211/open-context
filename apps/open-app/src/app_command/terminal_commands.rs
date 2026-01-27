//! 终端会话相关的 Tauri 命令

use crate::app_state::{AppState, Terminal};
use chrono::Utc;

use super::dto::{
    CreateTerminalDto, UpdateTerminalCwdDto, UpdateTerminalDto, UpdateTerminalHistoryDto,
};

#[tauri::command]
pub fn get_all_terminals(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Terminal>, String> {
    let db = state.db();
    match db.list_terminals_by_workspace(&workspace_id) {
        Ok(terminals) => Ok(terminals),
        Err(e) => Err(format!("Failed to fetch terminals: {}", e)),
    }
}

#[tauri::command]
pub fn get_terminal(id: String, state: tauri::State<AppState>) -> Result<Terminal, String> {
    let db = state.db();
    match db.get_terminal(&id) {
        Ok(Some(terminal)) => Ok(terminal),
        Ok(None) => Err(format!("Terminal not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch terminal: {}", e)),
    }
}

#[tauri::command]
pub fn create_terminal(
    dto: CreateTerminalDto,
    state: tauri::State<AppState>,
) -> Result<Terminal, String> {
    let db = state.db();
    let mut terminal = Terminal::new(dto.workspace_id, dto.name, dto.shell, dto.cwd);
    terminal.env = dto.env;

    match db.create_terminal(&terminal) {
        Ok(_) => {
            log::info!("Terminal created: {}", terminal.name);
            Ok(terminal)
        }
        Err(e) => Err(format!("Failed to create terminal: {}", e)),
    }
}

#[tauri::command]
pub fn update_terminal(
    id: String,
    dto: UpdateTerminalDto,
    state: tauri::State<AppState>,
) -> Result<Terminal, String> {
    let db = state.db();

    match db.get_terminal(&id) {
        Ok(Some(mut terminal)) => {
            if let Some(name) = dto.name {
                terminal.name = name;
            }
            if let Some(shell) = dto.shell {
                terminal.shell = shell;
            }
            if let Some(cwd) = dto.cwd {
                terminal.cwd = cwd;
            }
            if let Some(env) = dto.env {
                terminal.env = Some(env);
            }
            if let Some(is_active) = dto.is_active {
                terminal.is_active = is_active;
            }
            if let Some(is_archived) = dto.is_archived {
                terminal.is_archived = is_archived;
            }
            terminal.updated_at = Utc::now().timestamp_millis();

            match db.update_terminal(&terminal) {
                Ok(_) => Ok(terminal),
                Err(e) => Err(format!("Failed to update terminal: {}", e)),
            }
        }
        Ok(None) => Err(format!("Terminal not found: {}", id)),
        Err(e) => Err(format!("Failed to update terminal: {}", e)),
    }
}

#[tauri::command]
pub fn delete_terminal(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_terminal(&id) {
        Ok(_) => {
            log::info!("Terminal deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete terminal: {}", e)),
    }
}

#[tauri::command]
pub fn set_active_terminal(
    workspace_id: String,
    terminal_id: String,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.set_active_terminal(&workspace_id, &terminal_id) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to set active terminal: {}", e)),
    }
}

#[tauri::command]
pub fn update_terminal_cwd(
    id: String,
    dto: UpdateTerminalCwdDto,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.update_terminal_cwd(&id, &dto.cwd) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to update terminal cwd: {}", e)),
    }
}

#[tauri::command]
pub fn append_terminal_history(
    id: String,
    dto: UpdateTerminalHistoryDto,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.append_terminal_history(&id, &dto.history, dto.history_count) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to append terminal history: {}", e)),
    }
}
