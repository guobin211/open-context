#[tauri::command]
pub fn ping(timestamp: String) -> String {
    format!("pong: {}", timestamp)
}
