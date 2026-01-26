use chrono::Utc;
use rusqlite::{params, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum NoteType {
    RichText,
    Markdown,
    Code,
    Table,
    MindMap,
    Flowchart,
}

impl NoteType {
    pub fn as_str(&self) -> &str {
        match self {
            NoteType::RichText => "richtext",
            NoteType::Markdown => "markdown",
            NoteType::Code => "code",
            NoteType::Table => "table",
            NoteType::MindMap => "mindmap",
            NoteType::Flowchart => "flowchart",
        }
    }

    pub fn parse(s: &str) -> Option<Self> {
        match s {
            "richtext" => Some(NoteType::RichText),
            "markdown" => Some(NoteType::Markdown),
            "code" => Some(NoteType::Code),
            "table" => Some(NoteType::Table),
            "mindmap" => Some(NoteType::MindMap),
            "flowchart" => Some(NoteType::Flowchart),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Note {
    pub id: String,
    pub workspace_id: String,
    pub parent_id: Option<String>,
    pub title: String,
    pub note_type: NoteType,
    pub content: String,
    pub summary: Option<String>,
    pub file_path: PathBuf,
    pub tags: Vec<String>,
    pub word_count: i32,
    pub sort_order: i32,
    pub is_favorited: bool,
    pub is_pinned: bool,
    pub is_archived: bool,
    pub last_viewed_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Note {
    pub fn new(
        workspace_id: String,
        title: String,
        note_type: NoteType,
        content: String,
        file_path: PathBuf,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        let word_count = content.split_whitespace().count() as i32;
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            parent_id: None,
            title,
            note_type,
            content,
            summary: None,
            file_path,
            tags: Vec::new(),
            word_count,
            sort_order: 0,
            is_favorited: false,
            is_pinned: false,
            is_archived: false,
            last_viewed_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

/// Note management operations
impl DatabaseManager {
    /// Create a new note
    pub fn create_note(&self, note: &Note) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let tags_json = serde_json::to_string(&note.tags).unwrap();

        conn.execute(
            "INSERT INTO notes (id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                note.id,
                note.workspace_id,
                note.title,
                note.note_type.as_str(),
                note.content,
                note.file_path.to_str().unwrap(),
                tags_json,
                note.is_favorited as i32,
                note.created_at,
                note.updated_at,
            ],
        )?;
        Ok(())
    }

    /// Get note by ID
    pub fn get_note(&self, id: &str) -> SqliteResult<Option<Note>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at
             FROM notes WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            let note_type_str: String = row.get(3)?;
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let is_favorited: i32 = row.get(7)?;

            Ok(Some(Note {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                title: row.get(2)?,
                note_type: NoteType::parse(&note_type_str).unwrap_or(NoteType::RichText),
                content: row.get(4)?,
                summary: None,
                file_path: std::path::PathBuf::from(row.get::<_, String>(5)?),
                tags,
                word_count: 0,
                sort_order: 0,
                is_favorited: is_favorited != 0,
                is_pinned: false,
                is_archived: false,
                last_viewed_at: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            }))
        } else {
            Ok(None)
        }
    }

    /// List notes in a workspace
    pub fn list_notes(&self, workspace_id: &str) -> SqliteResult<Vec<Note>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at
             FROM notes WHERE workspace_id = ?1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let note_type_str: String = row.get(3)?;
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let is_favorited: i32 = row.get(7)?;

            Ok(Note {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                title: row.get(2)?,
                note_type: NoteType::parse(&note_type_str).unwrap_or(NoteType::RichText),
                content: row.get(4)?,
                summary: None,
                file_path: std::path::PathBuf::from(row.get::<_, String>(5)?),
                tags,
                word_count: 0,
                sort_order: 0,
                is_favorited: is_favorited != 0,
                is_pinned: false,
                is_archived: false,
                last_viewed_at: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut notes = Vec::new();
        for note in rows {
            notes.push(note?);
        }
        Ok(notes)
    }

    /// List notes by type
    pub fn list_notes_by_type(
        &self,
        workspace_id: &str,
        note_type: NoteType,
    ) -> SqliteResult<Vec<Note>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at
             FROM notes WHERE workspace_id = ?1 AND note_type = ?2 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id, note_type.as_str()], |row| {
            let note_type_str: String = row.get(3)?;
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let is_favorited: i32 = row.get(7)?;

            Ok(Note {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                title: row.get(2)?,
                note_type: NoteType::parse(&note_type_str).unwrap_or(NoteType::RichText),
                content: row.get(4)?,
                summary: None,
                file_path: std::path::PathBuf::from(row.get::<_, String>(5)?),
                tags,
                word_count: 0,
                sort_order: 0,
                is_favorited: is_favorited != 0,
                is_pinned: false,
                is_archived: false,
                last_viewed_at: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut notes = Vec::new();
        for note in rows {
            notes.push(note?);
        }
        Ok(notes)
    }

    /// Update note
    pub fn update_note(&self, note: &Note) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();
        let tags_json = serde_json::to_string(&note.tags).unwrap();

        conn.execute(
            "UPDATE notes
             SET title = ?1, note_type = ?2, content = ?3, file_path = ?4, tags = ?5, is_favorited = ?6, updated_at = ?7
             WHERE id = ?8",
            params![
                note.title,
                note.note_type.as_str(),
                note.content,
                note.file_path.to_str().unwrap(),
                tags_json,
                note.is_favorited as i32,
                updated_at,
                note.id,
            ],
        )?;
        Ok(())
    }

    /// Delete note
    pub fn delete_note(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM notes WHERE id = ?1", params![id])?;
        Ok(())
    }

    /// Search notes by title or content
    pub fn search_notes(&self, workspace_id: &str, query: &str) -> SqliteResult<Vec<Note>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let search_pattern = format!("%{}%", query);

        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at
             FROM notes
             WHERE workspace_id = ?1 AND (title LIKE ?2 OR content LIKE ?2)
             ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id, search_pattern], |row| {
            let note_type_str: String = row.get(3)?;
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let is_favorited: i32 = row.get(7)?;

            Ok(Note {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                title: row.get(2)?,
                note_type: NoteType::parse(&note_type_str).unwrap_or(NoteType::RichText),
                content: row.get(4)?,
                summary: None,
                file_path: std::path::PathBuf::from(row.get::<_, String>(5)?),
                tags,
                word_count: 0,
                sort_order: 0,
                is_favorited: is_favorited != 0,
                is_pinned: false,
                is_archived: false,
                last_viewed_at: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut notes = Vec::new();
        for note in rows {
            notes.push(note?);
        }
        Ok(notes)
    }

    /// Add tag to note
    pub fn add_note_tag(&self, note_id: &str, tag: &str) -> SqliteResult<()> {
        let mut note = self
            .get_note(note_id)?
            .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

        if !note.tags.contains(&tag.to_string()) {
            note.tags.push(tag.to_string());
            self.update_note(&note)?;
        }

        Ok(())
    }

    /// Remove tag from note
    pub fn remove_note_tag(&self, note_id: &str, tag: &str) -> SqliteResult<()> {
        let mut note = self
            .get_note(note_id)?
            .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

        note.tags.retain(|t| t != tag);
        self.update_note(&note)?;

        Ok(())
    }

    /// Toggle note favorite status
    pub fn toggle_note_favorite(&self, note_id: &str) -> SqliteResult<bool> {
        let mut note = self
            .get_note(note_id)?
            .ok_or_else(|| rusqlite::Error::QueryReturnedNoRows)?;

        note.is_favorited = !note.is_favorited;
        self.update_note(&note)?;

        Ok(note.is_favorited)
    }

    /// Set note favorite status
    pub fn set_note_favorite(&self, note_id: &str, is_favorited: bool) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE notes SET is_favorited = ?1, updated_at = ?2 WHERE id = ?3",
            params![is_favorited as i32, updated_at, note_id],
        )?;
        Ok(())
    }

    /// List favorited notes in a workspace
    pub fn list_favorited_notes(&self, workspace_id: &str) -> SqliteResult<Vec<Note>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, title, note_type, content, file_path, tags, is_favorited, created_at, updated_at
             FROM notes WHERE workspace_id = ?1 AND is_favorited = 1 ORDER BY updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            let note_type_str: String = row.get(3)?;
            let tags_json: String = row.get(6)?;
            let tags: Vec<String> = serde_json::from_str(&tags_json).unwrap_or_default();
            let is_favorited: i32 = row.get(7)?;

            Ok(Note {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                parent_id: None,
                title: row.get(2)?,
                note_type: NoteType::parse(&note_type_str).unwrap_or(NoteType::RichText),
                content: row.get(4)?,
                summary: None,
                file_path: std::path::PathBuf::from(row.get::<_, String>(5)?),
                tags,
                word_count: 0,
                sort_order: 0,
                is_favorited: is_favorited != 0,
                is_pinned: false,
                is_archived: false,
                last_viewed_at: None,
                created_at: row.get(8)?,
                updated_at: row.get(9)?,
            })
        })?;

        let mut notes = Vec::new();
        for note in rows {
            notes.push(note?);
        }
        Ok(notes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::app_state::Workspace;
    use std::env;

    fn setup_test_db() -> (DatabaseManager, Workspace) {
        let test_db_path = env::temp_dir().join(format!("test_notes_{}.db", uuid::Uuid::new_v4()));
        let db = DatabaseManager::new(test_db_path).unwrap();

        let workspace = Workspace::new("Test Workspace".to_string(), None);
        db.create_workspace(&workspace).unwrap();

        (db, workspace)
    }

    #[test]
    fn test_create_and_get_note() {
        let (db, workspace) = setup_test_db();
        let note = Note::new(
            workspace.id.clone(),
            "Test Note".to_string(),
            NoteType::Markdown,
            "# Test Content".to_string(),
            std::path::PathBuf::from("/tmp/test.md"),
        );

        db.create_note(&note).unwrap();
        let retrieved = db.get_note(&note.id).unwrap();

        assert!(retrieved.is_some());
        let retrieved = retrieved.unwrap();
        assert_eq!(retrieved.id, note.id);
        assert_eq!(retrieved.title, note.title);
        assert_eq!(retrieved.note_type, NoteType::Markdown);
    }

    #[test]
    fn test_list_notes() {
        let (db, workspace) = setup_test_db();

        let note1 = Note::new(
            workspace.id.clone(),
            "Note 1".to_string(),
            NoteType::RichText,
            "Content 1".to_string(),
            std::path::PathBuf::from("/tmp/note1.txt"),
        );
        let note2 = Note::new(
            workspace.id.clone(),
            "Note 2".to_string(),
            NoteType::Code,
            "Content 2".to_string(),
            std::path::PathBuf::from("/tmp/note2.txt"),
        );

        db.create_note(&note1).unwrap();
        db.create_note(&note2).unwrap();

        let notes = db.list_notes(&workspace.id).unwrap();
        assert_eq!(notes.len(), 2);
    }

    #[test]
    fn test_update_note() {
        let (db, workspace) = setup_test_db();
        let mut note = Note::new(
            workspace.id.clone(),
            "Original Title".to_string(),
            NoteType::Markdown,
            "Original content".to_string(),
            std::path::PathBuf::from("/tmp/note.md"),
        );

        db.create_note(&note).unwrap();

        note.title = "Updated Title".to_string();
        note.content = "Updated content".to_string();
        db.update_note(&note).unwrap();

        let updated = db.get_note(&note.id).unwrap().unwrap();
        assert_eq!(updated.title, "Updated Title");
        assert_eq!(updated.content, "Updated content");
    }

    #[test]
    fn test_note_tags() {
        let (db, workspace) = setup_test_db();
        let note = Note::new(
            workspace.id.clone(),
            "Tagged Note".to_string(),
            NoteType::Markdown,
            "Content".to_string(),
            std::path::PathBuf::from("/tmp/note.md"),
        );

        db.create_note(&note).unwrap();
        db.add_note_tag(&note.id, "important").unwrap();
        db.add_note_tag(&note.id, "work").unwrap();

        let retrieved = db.get_note(&note.id).unwrap().unwrap();
        assert_eq!(retrieved.tags.len(), 2);
        assert!(retrieved.tags.contains(&"important".to_string()));

        db.remove_note_tag(&note.id, "work").unwrap();
        let retrieved = db.get_note(&note.id).unwrap().unwrap();
        assert_eq!(retrieved.tags.len(), 1);
    }
}
