//! 网页视图相关的 Tauri 命令

use crate::app_state::{AppState, Webview};
use chrono::Utc;

use super::dto::{CreateWebviewDto, UpdateWebviewDto, UpdateWebviewScrollDto, UpdateWebviewUrlDto};

#[tauri::command]
pub fn get_all_webviews(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Webview>, String> {
    let db = state.db();
    match db.list_webviews_by_workspace(&workspace_id) {
        Ok(webviews) => Ok(webviews),
        Err(e) => Err(format!("Failed to fetch webviews: {}", e)),
    }
}

#[tauri::command]
pub fn get_webview(id: String, state: tauri::State<AppState>) -> Result<Webview, String> {
    let db = state.db();
    match db.get_webview(&id) {
        Ok(Some(webview)) => Ok(webview),
        Ok(None) => Err(format!("Webview not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch webview: {}", e)),
    }
}

#[tauri::command]
pub fn create_webview(
    dto: CreateWebviewDto,
    state: tauri::State<AppState>,
) -> Result<Webview, String> {
    let db = state.db();
    let webview = Webview::new(dto.workspace_id, dto.title, dto.url);

    match db.create_webview(&webview) {
        Ok(_) => {
            log::info!("Webview created: {}", webview.title);
            Ok(webview)
        }
        Err(e) => Err(format!("Failed to create webview: {}", e)),
    }
}

#[tauri::command]
pub fn update_webview(
    id: String,
    dto: UpdateWebviewDto,
    state: tauri::State<AppState>,
) -> Result<Webview, String> {
    let db = state.db();

    match db.get_webview(&id) {
        Ok(Some(mut webview)) => {
            if let Some(title) = dto.title {
                webview.title = title;
            }
            if let Some(url) = dto.url {
                webview.url = url;
            }
            if let Some(favicon_url) = dto.favicon_url {
                webview.favicon_url = Some(favicon_url);
            }
            if let Some(is_loading) = dto.is_loading {
                webview.is_loading = is_loading;
            }
            if let Some(is_active) = dto.is_active {
                webview.is_active = is_active;
            }
            if let Some(is_archived) = dto.is_archived {
                webview.is_archived = is_archived;
            }
            if let Some(zoom_level) = dto.zoom_level {
                webview.zoom_level = zoom_level;
            }
            webview.updated_at = Utc::now().timestamp_millis();

            match db.update_webview(&webview) {
                Ok(_) => Ok(webview),
                Err(e) => Err(format!("Failed to update webview: {}", e)),
            }
        }
        Ok(None) => Err(format!("Webview not found: {}", id)),
        Err(e) => Err(format!("Failed to update webview: {}", e)),
    }
}

#[tauri::command]
pub fn delete_webview(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_webview(&id) {
        Ok(_) => {
            log::info!("Webview deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete webview: {}", e)),
    }
}

#[tauri::command]
pub fn set_active_webview(
    workspace_id: String,
    webview_id: String,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.set_active_webview(&workspace_id, &webview_id) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to set active webview: {}", e)),
    }
}

#[tauri::command]
pub fn update_webview_url(
    id: String,
    dto: UpdateWebviewUrlDto,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.update_webview_url(&id, &dto.url, &dto.title) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to update webview url: {}", e)),
    }
}

#[tauri::command]
pub fn update_webview_scroll(
    id: String,
    dto: UpdateWebviewScrollDto,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.update_webview_scroll(&id, dto.scroll_x, dto.scroll_y) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to update webview scroll: {}", e)),
    }
}

#[tauri::command]
pub fn update_webview_zoom(
    id: String,
    zoom_level: f64,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.update_webview_zoom(&id, zoom_level) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to update webview zoom: {}", e)),
    }
}

#[tauri::command]
pub fn set_webview_loading(
    id: String,
    is_loading: bool,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.set_webview_loading(&id, is_loading) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to set webview loading: {}", e)),
    }
}
