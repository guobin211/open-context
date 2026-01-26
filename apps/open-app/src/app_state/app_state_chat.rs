//! 聊天状态管理模块
//!
//! 提供聊天和会话的 CRUD 操作。

use chrono::Utc;
use rusqlite::{params, Result as SqliteResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::app_state::DatabaseManager;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Chat {
    pub id: String,
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
    pub default_model: Option<String>,
    pub default_prompt: Option<String>,
    pub conversation_count: i32,
    pub is_active: bool,
    pub is_archived: bool,
    pub last_active_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Chat {
    pub fn new(workspace_id: String, name: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            name,
            description: None,
            default_model: None,
            default_prompt: None,
            conversation_count: 0,
            is_active: false,
            is_archived: false,
            last_active_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Conversation {
    pub id: String,
    pub workspace_id: String,
    pub chat_id: Option<String>,
    pub title: String,
    pub model: Option<String>,
    pub system_prompt: Option<String>,
    pub messages: String,
    pub message_count: i32,
    pub token_count: i32,
    pub is_favorited: bool,
    pub is_archived: bool,
    pub last_active_at: Option<i64>,
    pub created_at: i64,
    pub updated_at: i64,
}

impl Conversation {
    pub fn new(workspace_id: String, title: String) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            chat_id: None,
            title,
            model: None,
            system_prompt: None,
            messages: "[]".to_string(),
            message_count: 0,
            token_count: 0,
            is_favorited: false,
            is_archived: false,
            last_active_at: None,
            created_at: now,
            updated_at: now,
        }
    }
}

impl DatabaseManager {
    // Chat CRUD

    pub fn create_chat(&self, chat: &Chat) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO chats (id, workspace_id, name, description, default_model, default_prompt, conversation_count, is_active, is_archived, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)",
            params![
                chat.id,
                chat.workspace_id,
                chat.name,
                chat.description,
                chat.default_model,
                chat.default_prompt,
                chat.conversation_count,
                chat.is_active as i32,
                chat.is_archived as i32,
                chat.last_active_at,
                chat.created_at,
                chat.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_chat(&self, id: &str) -> SqliteResult<Option<Chat>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, description, default_model, default_prompt, conversation_count, is_active, is_archived, last_active_at, created_at, updated_at
             FROM chats WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Chat {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                default_model: row.get(4)?,
                default_prompt: row.get(5)?,
                conversation_count: row.get(6)?,
                is_active: row.get::<_, i32>(7)? != 0,
                is_archived: row.get::<_, i32>(8)? != 0,
                last_active_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_chats_by_workspace(&self, workspace_id: &str) -> SqliteResult<Vec<Chat>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, name, description, default_model, default_prompt, conversation_count, is_active, is_archived, last_active_at, created_at, updated_at
             FROM chats WHERE workspace_id = ?1 AND is_archived = 0 ORDER BY last_active_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(Chat {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                name: row.get(2)?,
                description: row.get(3)?,
                default_model: row.get(4)?,
                default_prompt: row.get(5)?,
                conversation_count: row.get(6)?,
                is_active: row.get::<_, i32>(7)? != 0,
                is_archived: row.get::<_, i32>(8)? != 0,
                last_active_at: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;

        rows.collect()
    }

    pub fn update_chat(&self, chat: &Chat) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE chats SET name = ?1, description = ?2, default_model = ?3, default_prompt = ?4, conversation_count = ?5, is_active = ?6, is_archived = ?7, last_active_at = ?8, updated_at = ?9 WHERE id = ?10",
            params![
                chat.name,
                chat.description,
                chat.default_model,
                chat.default_prompt,
                chat.conversation_count,
                chat.is_active as i32,
                chat.is_archived as i32,
                chat.last_active_at,
                updated_at,
                chat.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_chat(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM chats WHERE id = ?1", params![id])?;
        Ok(())
    }

    // Conversation CRUD

    pub fn create_conversation(&self, conversation: &Conversation) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute(
            "INSERT INTO conversations (id, workspace_id, chat_id, title, model, system_prompt, messages, message_count, token_count, is_favorited, is_archived, last_active_at, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)",
            params![
                conversation.id,
                conversation.workspace_id,
                conversation.chat_id,
                conversation.title,
                conversation.model,
                conversation.system_prompt,
                conversation.messages,
                conversation.message_count,
                conversation.token_count,
                conversation.is_favorited as i32,
                conversation.is_archived as i32,
                conversation.last_active_at,
                conversation.created_at,
                conversation.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn get_conversation(&self, id: &str) -> SqliteResult<Option<Conversation>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, chat_id, title, model, system_prompt, messages, message_count, token_count, is_favorited, is_archived, last_active_at, created_at, updated_at
             FROM conversations WHERE id = ?1",
        )?;

        let mut rows = stmt.query(params![id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(Conversation {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                chat_id: row.get(2)?,
                title: row.get(3)?,
                model: row.get(4)?,
                system_prompt: row.get(5)?,
                messages: row.get(6)?,
                message_count: row.get(7)?,
                token_count: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                last_active_at: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            }))
        } else {
            Ok(None)
        }
    }

    pub fn list_conversations_by_workspace(
        &self,
        workspace_id: &str,
    ) -> SqliteResult<Vec<Conversation>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, chat_id, title, model, system_prompt, messages, message_count, token_count, is_favorited, is_archived, last_active_at, created_at, updated_at
             FROM conversations WHERE workspace_id = ?1 AND is_archived = 0 ORDER BY last_active_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![workspace_id], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                chat_id: row.get(2)?,
                title: row.get(3)?,
                model: row.get(4)?,
                system_prompt: row.get(5)?,
                messages: row.get(6)?,
                message_count: row.get(7)?,
                token_count: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                last_active_at: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        rows.collect()
    }

    pub fn list_conversations_by_chat(&self, chat_id: &str) -> SqliteResult<Vec<Conversation>> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, workspace_id, chat_id, title, model, system_prompt, messages, message_count, token_count, is_favorited, is_archived, last_active_at, created_at, updated_at
             FROM conversations WHERE chat_id = ?1 AND is_archived = 0 ORDER BY last_active_at DESC NULLS LAST, updated_at DESC",
        )?;

        let rows = stmt.query_map(params![chat_id], |row| {
            Ok(Conversation {
                id: row.get(0)?,
                workspace_id: row.get(1)?,
                chat_id: row.get(2)?,
                title: row.get(3)?,
                model: row.get(4)?,
                system_prompt: row.get(5)?,
                messages: row.get(6)?,
                message_count: row.get(7)?,
                token_count: row.get(8)?,
                is_favorited: row.get::<_, i32>(9)? != 0,
                is_archived: row.get::<_, i32>(10)? != 0,
                last_active_at: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;

        rows.collect()
    }

    pub fn update_conversation(&self, conversation: &Conversation) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let updated_at = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE conversations SET chat_id = ?1, title = ?2, model = ?3, system_prompt = ?4, messages = ?5, message_count = ?6, token_count = ?7, is_favorited = ?8, is_archived = ?9, last_active_at = ?10, updated_at = ?11 WHERE id = ?12",
            params![
                conversation.chat_id,
                conversation.title,
                conversation.model,
                conversation.system_prompt,
                conversation.messages,
                conversation.message_count,
                conversation.token_count,
                conversation.is_favorited as i32,
                conversation.is_archived as i32,
                conversation.last_active_at,
                updated_at,
                conversation.id,
            ],
        )?;
        Ok(())
    }

    pub fn delete_conversation(&self, id: &str) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        conn.execute("DELETE FROM conversations WHERE id = ?1", params![id])?;
        Ok(())
    }

    pub fn update_conversation_messages(
        &self,
        id: &str,
        messages: &str,
        message_count: i32,
        token_count: i32,
    ) -> SqliteResult<()> {
        let conn_arc = self.conn();
        let conn = conn_arc.lock().unwrap();
        let now = Utc::now().timestamp_millis();

        conn.execute(
            "UPDATE conversations SET messages = ?1, message_count = ?2, token_count = ?3, last_active_at = ?4, updated_at = ?4 WHERE id = ?5",
            params![messages, message_count, token_count, now, id],
        )?;
        Ok(())
    }
}
