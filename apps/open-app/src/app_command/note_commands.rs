use crate::app_state::{AppState, Note, NoteType};
use chrono::Utc;
use std::path::PathBuf;

use super::dto::{CreateNoteDto, UpdateNoteDto};

#[tauri::command]
pub fn get_all_notes(
    workspace_id: Option<String>,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match workspace_id {
        Some(ws_id) => match db.list_notes(&ws_id) {
            Ok(notes) => Ok(notes),
            Err(e) => Err(format!("Failed to fetch notes: {}", e)),
        },
        None => Err("Getting notes from all workspaces not yet implemented".to_string()),
    }
}

#[tauri::command]
pub fn get_note(id: String, state: tauri::State<AppState>) -> Result<Note, String> {
    let db = state.db();

    match db.get_note(&id) {
        Ok(Some(note)) => Ok(note),
        Ok(None) => Err(format!("Note not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch note: {}", e)),
    }
}

#[tauri::command]
pub fn create_note(dto: CreateNoteDto, state: tauri::State<AppState>) -> Result<Note, String> {
    let db = state.db();

    let note_type = NoteType::parse(&dto.note_type).unwrap_or(NoteType::Markdown);
    let default_path = format!("/notes/{}.md", dto.title);
    let file_path = dto.file_path.unwrap_or(default_path).into();

    let note = Note::new(
        dto.workspace_id.clone(),
        dto.title,
        note_type,
        dto.content.unwrap_or_default(),
        file_path,
    );

    match db.create_note(&note) {
        Ok(_) => {
            if let Some(tags) = dto.tags {
                for tag in tags {
                    let _ = db.add_note_tag(&note.id, &tag);
                }
            }
            log::info!("Note created: {}", note.title);
            Ok(note)
        }
        Err(e) => Err(format!("Failed to create note: {}", e)),
    }
}

#[tauri::command]
pub fn update_note(
    id: String,
    dto: UpdateNoteDto,
    state: tauri::State<AppState>,
) -> Result<Note, String> {
    let db = state.db();

    match db.get_note(&id) {
        Ok(Some(mut note)) => {
            if let Some(title) = dto.title {
                note.title = title;
            }
            if let Some(note_type) = dto.note_type
                && let Some(nt) = NoteType::parse(&note_type)
            {
                note.note_type = nt;
            }
            if let Some(content) = dto.content {
                note.content = content;
            }
            if let Some(file_path) = dto.file_path {
                note.file_path = PathBuf::from(file_path);
            }
            if let Some(tags) = dto.tags {
                for existing_tag in &note.tags {
                    let _ = db.remove_note_tag(&note.id, existing_tag);
                }
                for tag in &tags {
                    let _ = db.add_note_tag(&note.id, tag);
                }
                note.tags = tags;
            }
            note.updated_at = Utc::now().timestamp_millis();

            match db.update_note(&note) {
                Ok(_) => Ok(note),
                Err(e) => Err(format!("Failed to update note: {}", e)),
            }
        }
        Ok(None) => Err(format!("Note not found: {}", id)),
        Err(e) => Err(format!("Failed to update note: {}", e)),
    }
}

#[tauri::command]
pub fn delete_note(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_note(&id) {
        Ok(_) => {
            log::info!("Note deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete note: {}", e)),
    }
}

#[tauri::command]
pub fn search_notes(
    workspace_id: String,
    query: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match db.search_notes(&workspace_id, &query) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to search notes: {}", e)),
    }
}

#[tauri::command]
pub fn get_notes_by_type(
    workspace_id: String,
    note_type: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    let nt =
        NoteType::parse(&note_type).ok_or_else(|| format!("Invalid note type: {}", note_type))?;

    match db.list_notes_by_type(&workspace_id, nt) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to fetch notes by type: {}", e)),
    }
}

#[tauri::command]
pub fn toggle_note_favorite(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.toggle_note_favorite(&id) {
        Ok(is_favorited) => {
            log::info!("Note {} favorite toggled to: {}", id, is_favorited);
            Ok(is_favorited)
        }
        Err(e) => Err(format!("Failed to toggle note favorite: {}", e)),
    }
}

#[tauri::command]
pub fn set_note_favorite(
    id: String,
    is_favorited: bool,
    state: tauri::State<AppState>,
) -> Result<(), String> {
    let db = state.db();

    match db.set_note_favorite(&id, is_favorited) {
        Ok(_) => {
            log::info!("Note {} favorite set to: {}", id, is_favorited);
            Ok(())
        }
        Err(e) => Err(format!("Failed to set note favorite: {}", e)),
    }
}

#[tauri::command]
pub fn get_favorited_notes(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Note>, String> {
    let db = state.db();

    match db.list_favorited_notes(&workspace_id) {
        Ok(notes) => Ok(notes),
        Err(e) => Err(format!("Failed to fetch favorited notes: {}", e)),
    }
}
