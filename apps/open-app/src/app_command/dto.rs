use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkspaceDto {
    pub name: String,
    pub description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkspaceDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_active: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateNoteDto {
    pub workspace_id: String,
    pub title: String,
    pub note_type: String,
    pub content: Option<String>,
    pub file_path: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateNoteDto {
    pub title: Option<String>,
    pub note_type: Option<String>,
    pub content: Option<String>,
    pub file_path: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateFileDto {
    pub workspace_id: String,
    pub name: String,
    pub original_path: String,
    pub stored_path: String,
    pub file_type: String,
    pub size_bytes: i64,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateFileDto {
    pub name: Option<String>,
    pub file_type: Option<String>,
    pub size_bytes: Option<i64>,
    pub mime_type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateRepositoryDto {
    pub workspace_id: String,
    pub name: String,
    pub url: String,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateRepositoryDto {
    pub name: Option<String>,
    pub url: Option<String>,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloneRepositoryTaskDto {
    pub workspace_id: String,
    pub url: String,
    pub branch: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IndexRepositoryTaskDto {
    pub repository_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportFilesTaskDto {
    pub workspace_id: String,
    pub paths: Vec<String>,
}

// Chat DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatDto {
    pub workspace_id: String,
    pub name: String,
    pub description: Option<String>,
    pub default_model: Option<String>,
    pub default_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatDto {
    pub name: Option<String>,
    pub description: Option<String>,
    pub default_model: Option<String>,
    pub default_prompt: Option<String>,
    pub is_active: Option<bool>,
    pub is_archived: Option<bool>,
}

// Conversation DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateConversationDto {
    pub workspace_id: String,
    pub title: String,
    pub chat_id: Option<String>,
    pub model: Option<String>,
    pub system_prompt: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConversationDto {
    pub title: Option<String>,
    pub chat_id: Option<String>,
    pub model: Option<String>,
    pub system_prompt: Option<String>,
    pub is_favorited: Option<bool>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateConversationMessagesDto {
    pub messages: String,
    pub message_count: i32,
    pub token_count: i32,
}

// Terminal DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateTerminalDto {
    pub workspace_id: String,
    pub name: String,
    pub shell: String,
    pub cwd: String,
    pub env: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTerminalDto {
    pub name: Option<String>,
    pub shell: Option<String>,
    pub cwd: Option<String>,
    pub env: Option<String>,
    pub is_active: Option<bool>,
    pub is_archived: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTerminalCwdDto {
    pub cwd: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateTerminalHistoryDto {
    pub history: String,
    pub history_count: i32,
}

// Webview DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWebviewDto {
    pub workspace_id: String,
    pub title: String,
    pub url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebviewDto {
    pub title: Option<String>,
    pub url: Option<String>,
    pub favicon_url: Option<String>,
    pub is_loading: Option<bool>,
    pub is_active: Option<bool>,
    pub is_archived: Option<bool>,
    pub zoom_level: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebviewUrlDto {
    pub url: String,
    pub title: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebviewScrollDto {
    pub scroll_x: i32,
    pub scroll_y: i32,
}

// WebLink DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWebLinkDto {
    pub workspace_id: String,
    pub title: String,
    pub url: String,
    pub description: Option<String>,
    pub favicon_url: Option<String>,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWebLinkDto {
    pub title: Option<String>,
    pub url: Option<String>,
    pub description: Option<String>,
    pub favicon_url: Option<String>,
    pub thumbnail_url: Option<String>,
    pub tags: Option<Vec<String>>,
    pub content: Option<String>,
    pub is_favorited: Option<bool>,
    pub is_archived: Option<bool>,
}

// Directory DTOs

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateDirectoryDto {
    pub workspace_id: String,
    pub name: String,
    pub original_path: String,
    pub stored_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateDirectoryDto {
    pub name: Option<String>,
    pub file_count: Option<i32>,
    pub total_size_bytes: Option<i64>,
}
