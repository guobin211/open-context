//! 聊天和会话相关的 Tauri 命令

use crate::app_state::{AppState, Chat, Conversation};
use chrono::Utc;

use super::dto::{
    CreateChatDto, CreateConversationDto, UpdateChatDto, UpdateConversationDto,
    UpdateConversationMessagesDto,
};

#[tauri::command]
pub fn get_all_chats(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Chat>, String> {
    let db = state.db();
    match db.list_chats_by_workspace(&workspace_id) {
        Ok(chats) => Ok(chats),
        Err(e) => Err(format!("Failed to fetch chats: {}", e)),
    }
}

#[tauri::command]
pub fn get_chat(id: String, state: tauri::State<AppState>) -> Result<Chat, String> {
    let db = state.db();
    match db.get_chat(&id) {
        Ok(Some(chat)) => Ok(chat),
        Ok(None) => Err(format!("Chat not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch chat: {}", e)),
    }
}

#[tauri::command]
pub fn create_chat(dto: CreateChatDto, state: tauri::State<AppState>) -> Result<Chat, String> {
    let db = state.db();
    let mut chat = Chat::new(dto.workspace_id, dto.name);
    chat.description = dto.description;
    chat.default_model = dto.default_model;
    chat.default_prompt = dto.default_prompt;

    match db.create_chat(&chat) {
        Ok(_) => {
            log::info!("Chat created: {}", chat.name);
            Ok(chat)
        }
        Err(e) => Err(format!("Failed to create chat: {}", e)),
    }
}

#[tauri::command]
pub fn update_chat(
    id: String,
    dto: UpdateChatDto,
    state: tauri::State<AppState>,
) -> Result<Chat, String> {
    let db = state.db();

    match db.get_chat(&id) {
        Ok(Some(mut chat)) => {
            if let Some(name) = dto.name {
                chat.name = name;
            }
            if let Some(description) = dto.description {
                chat.description = Some(description);
            }
            if let Some(default_model) = dto.default_model {
                chat.default_model = Some(default_model);
            }
            if let Some(default_prompt) = dto.default_prompt {
                chat.default_prompt = Some(default_prompt);
            }
            if let Some(is_active) = dto.is_active {
                chat.is_active = is_active;
            }
            if let Some(is_archived) = dto.is_archived {
                chat.is_archived = is_archived;
            }
            chat.updated_at = Utc::now().timestamp_millis();

            match db.update_chat(&chat) {
                Ok(_) => Ok(chat),
                Err(e) => Err(format!("Failed to update chat: {}", e)),
            }
        }
        Ok(None) => Err(format!("Chat not found: {}", id)),
        Err(e) => Err(format!("Failed to update chat: {}", e)),
    }
}

#[tauri::command]
pub fn delete_chat(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_chat(&id) {
        Ok(_) => {
            log::info!("Chat deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete chat: {}", e)),
    }
}

#[tauri::command]
pub fn get_all_conversations(
    workspace_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Conversation>, String> {
    let db = state.db();
    match db.list_conversations_by_workspace(&workspace_id) {
        Ok(conversations) => Ok(conversations),
        Err(e) => Err(format!("Failed to fetch conversations: {}", e)),
    }
}

#[tauri::command]
pub fn get_conversations_by_chat(
    chat_id: String,
    state: tauri::State<AppState>,
) -> Result<Vec<Conversation>, String> {
    let db = state.db();
    match db.list_conversations_by_chat(&chat_id) {
        Ok(conversations) => Ok(conversations),
        Err(e) => Err(format!("Failed to fetch conversations: {}", e)),
    }
}

#[tauri::command]
pub fn get_conversation(id: String, state: tauri::State<AppState>) -> Result<Conversation, String> {
    let db = state.db();
    match db.get_conversation(&id) {
        Ok(Some(conversation)) => Ok(conversation),
        Ok(None) => Err(format!("Conversation not found: {}", id)),
        Err(e) => Err(format!("Failed to fetch conversation: {}", e)),
    }
}

#[tauri::command]
pub fn create_conversation(
    dto: CreateConversationDto,
    state: tauri::State<AppState>,
) -> Result<Conversation, String> {
    let db = state.db();
    let mut conversation = Conversation::new(dto.workspace_id, dto.title);
    conversation.chat_id = dto.chat_id;
    conversation.model = dto.model;
    conversation.system_prompt = dto.system_prompt;

    match db.create_conversation(&conversation) {
        Ok(_) => {
            log::info!("Conversation created: {}", conversation.title);
            Ok(conversation)
        }
        Err(e) => Err(format!("Failed to create conversation: {}", e)),
    }
}

#[tauri::command]
pub fn update_conversation(
    id: String,
    dto: UpdateConversationDto,
    state: tauri::State<AppState>,
) -> Result<Conversation, String> {
    let db = state.db();

    match db.get_conversation(&id) {
        Ok(Some(mut conversation)) => {
            if let Some(title) = dto.title {
                conversation.title = title;
            }
            if let Some(chat_id) = dto.chat_id {
                conversation.chat_id = Some(chat_id);
            }
            if let Some(model) = dto.model {
                conversation.model = Some(model);
            }
            if let Some(system_prompt) = dto.system_prompt {
                conversation.system_prompt = Some(system_prompt);
            }
            if let Some(is_favorited) = dto.is_favorited {
                conversation.is_favorited = is_favorited;
            }
            if let Some(is_archived) = dto.is_archived {
                conversation.is_archived = is_archived;
            }
            conversation.updated_at = Utc::now().timestamp_millis();

            match db.update_conversation(&conversation) {
                Ok(_) => Ok(conversation),
                Err(e) => Err(format!("Failed to update conversation: {}", e)),
            }
        }
        Ok(None) => Err(format!("Conversation not found: {}", id)),
        Err(e) => Err(format!("Failed to update conversation: {}", e)),
    }
}

#[tauri::command]
pub fn update_conversation_messages(
    id: String,
    dto: UpdateConversationMessagesDto,
    state: tauri::State<AppState>,
) -> Result<bool, String> {
    let db = state.db();

    match db.update_conversation_messages(&id, &dto.messages, dto.message_count, dto.token_count) {
        Ok(_) => Ok(true),
        Err(e) => Err(format!("Failed to update conversation messages: {}", e)),
    }
}

#[tauri::command]
pub fn delete_conversation(id: String, state: tauri::State<AppState>) -> Result<bool, String> {
    let db = state.db();

    match db.delete_conversation(&id) {
        Ok(_) => {
            log::info!("Conversation deleted: {}", id);
            Ok(true)
        }
        Err(e) => Err(format!("Failed to delete conversation: {}", e)),
    }
}
