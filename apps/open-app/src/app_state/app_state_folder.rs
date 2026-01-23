use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ImportedDirectory {
    pub id: String,
    pub workspace_id: String,
    pub parent_id: Option<String>,
    pub name: String,
    pub original_path: PathBuf,
    pub stored_path: PathBuf,
    pub file_count: i32,
    pub total_size_bytes: i64,
    pub is_archived: bool,
    pub created_at: i64,
    pub updated_at: i64,
}

impl ImportedDirectory {
    pub fn new(
        workspace_id: String,
        name: String,
        original_path: PathBuf,
        stored_path: PathBuf,
    ) -> Self {
        let now = Utc::now().timestamp_millis();
        Self {
            id: Uuid::new_v4().to_string(),
            workspace_id,
            parent_id: None,
            name,
            original_path,
            stored_path,
            file_count: 0,
            total_size_bytes: 0,
            is_archived: false,
            created_at: now,
            updated_at: now,
        }
    }
}
