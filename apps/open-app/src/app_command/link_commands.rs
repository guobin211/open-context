//! 网页链接相关的 Tauri 命令

use crate::app_state::{AppState, WebLink};
use chrono::Utc;

use super::dto::{CreateWebLinkDto, UpdateWebLinkDto};

#[tauri::command]
pub fn get_all_web_links(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<WebLink>, String> {
    let db = state.db();
    match db.list_web_links(&workspace_id) {
        Ok(links) => Ok(links),
        Err(e) => Err(format!("Failed to fetch web links: {}", e)),
    }
}

#[tauri::command]
pub fn get_web_link(id: String, state: tauri::State<AppState>) -> Result<WebLink, String> {
    let db = state.db();
    match db.get_web_link(&id) {
        Ok(Some(link)) => Ok(link),
        Ok(None) => Err(format!("Web link not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch web link: {}", e)),
    }
}

#[tauri::command]
pub fn create_web_link(
    dto: CreateWebLinkDto,
    state: tauri::State<AppState>,
) -> Result<WebLink, String> {
    let db = state.db();
    let mut link = WebLink::new(dto.workspace_id, dto.title, dto.url);
    link.description = dto.description;
    link.favicon_url = dto.favicon_url;
    link.tags = dto.tags.unwrap_or_default();

    match db.create_web_link(&link) {
        Ok(_) => {
            log::info!("Web link created: {}", link.title);
            Ok(link)
        }
        Err(e) => Err(format!("Failed to create web link: {}", e)),
    }
}

#[tauri::command]
pub fn update_web_link(
    id: String,
    dto: UpdateWebLinkDto,
    state: tauri::State<AppState>,
) -> Result<WebLink, String> {
    let db = state.db();

    match db.get_web_link(&id) {
        Ok(Some(mut link)) => {
            if let Some(title) = dto.title {
                link.title = title;
            }
            if let Some(url) = dto.url {
                link.url = url;
            }
            if let Some(description) = dto.description {
                link.description = Some(description);
            }
            if let Some(favicon_url) = dto.favicon_url {
                link.favicon_url = Some(favicon_url);
            }
            if let Some(thumbnail_url) = dto.thumbnail_url {
                link.thumbnail_url = Some(thumbnail_url);
            }
            if let Some(tags) = dto.tags {
                link.tags = tags;
            }
            if let Some(content) = dto.content {
                link.content = Some(content);
            }
            if let Some(is_favorited) = dto.is_favorited {
                link.is_favorited = is_favorited;
            }
            if let Some(is_archived) = dto.is_archived {
                link.is_archived = is_archived;
            }
            link.updated_at = Utc::now().timestamp_millis();

            match db.update_web_link(&link) {
                Ok(_) => Ok(link),
                Err(e) => Err(format!("Failed to update web link: {}", e)),
            }
        }
        Ok(None) => Err(format!("Web link not found: {}", id)),
        Err(e) => Err(format!("Failed to update web link: {}", e)),
    }
}

#[tauri::command]
pub fn delete_web_link(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_web_link(&id) {
        Ok(_) => {
            log::info!("Web link deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete web link: {}", e)),
    }
}

#[tauri::command]
pub fn search_web_links(
    workspace_id: String,
    query: String,
    state: tauri::State<AppState>,
) -> Result<Vec<WebLink>, String> {
    let db = state.db();
    match db.search_web_links(&workspace_id, &query) {
        Ok(links) => Ok(links),
        Err(e) => Err(format!("Failed to search web links: {}", e)),
    }
}

#[tauri::command]
pub fn increment_link_visit(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.increment_link_visit(&id) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to increment link visit: {}", e)),
    }
}

#[tauri::command]
pub fn toggle_link_favorite(
    id: String,
    favorited: bool,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.toggle_link_favorite(&id, favorited) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to toggle link favorite: {}", e)),
    }
}

#[tauri::command]
pub fn archive_link(
    id: String,
    archived: bool,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.archive_link(&id, archived) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to archive link: {}", e)),
    }
}

#[tauri::command]
pub fn get_favorite_links(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<WebLink>, String> {
    let db = state.db();
    match db.list_favorite_links(&workspace_id) {
        Ok(links) => Ok(links),
        Err(e) => Err(format!("Failed to fetch favorite links: {}", e)),
    }
}
