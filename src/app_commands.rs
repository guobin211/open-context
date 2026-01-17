#[tauri::command]
pub fn ping(timestamp: &str) -> String {
    log::info!("web::ping: {}", timestamp);
    let now = chrono::Utc::now().timestamp_nanos_opt().unwrap();
    format!("rust::pong: {}", now)
}
