use chrono::Utc;
use ignore::WalkBuilder;
use lazy_static::lazy_static;
use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use std::time::{Duration, SystemTime};
use tauri::{AppHandle, Emitter};
use tokio::fs;

const CACHE_DURATION_SECS: u64 = 300;
const DEBOUNCE_MILLIS: u64 = 50;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FileTreeNode {
    pub path: String,
    pub name: String,
    pub is_directory: bool,
    pub is_hidden: bool,
    pub size: Option<u64>,
    pub modified: Option<i64>,
    pub children: Option<Vec<FileTreeNode>>,
}

#[derive(Debug, Clone)]
struct CacheEntry {
    nodes: Vec<FileTreeNode>,
    timestamp: SystemTime,
}

impl CacheEntry {
    fn is_expired(&self) -> bool {
        self.timestamp.elapsed().unwrap_or(Duration::MAX) > Duration::from_secs(CACHE_DURATION_SECS)
    }
}

lazy_static! {
    static ref DIR_CACHE: Arc<Mutex<HashMap<String, CacheEntry>>> =
        Arc::new(Mutex::new(HashMap::new()));
    static ref WATCHERS: Arc<Mutex<HashMap<String, RecommendedWatcher>>> =
        Arc::new(Mutex::new(HashMap::new()));
}

fn is_hidden_file(path: &Path) -> bool {
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::fs::MetadataExt;
        if let Ok(metadata) = path.metadata() {
            const FILE_ATTRIBUTE_HIDDEN: u32 = 0x2;
            return (metadata.file_attributes() & FILE_ATTRIBUTE_HIDDEN) != 0;
        }
        false
    }

    #[cfg(not(target_os = "windows"))]
    {
        path.file_name()
            .and_then(|n| n.to_str())
            .map(|n| n.starts_with('.'))
            .unwrap_or(false)
    }
}

pub async fn read_dir_on_demand(dir_path: String) -> Result<Vec<FileTreeNode>, String> {
    let path = PathBuf::from(&dir_path);

    if !path.exists() {
        return Err(format!("目录不存在: {}", dir_path));
    }

    if !path.is_dir() {
        return Err(format!("路径不是目录: {}", dir_path));
    }

    {
        let cache = DIR_CACHE.lock().unwrap();
        if let Some(entry) = cache.get(&dir_path)
            && !entry.is_expired()
        {
            return Ok(entry.nodes.clone());
        }
    }

    let mut nodes = Vec::new();
    let mut entries = fs::read_dir(&path)
        .await
        .map_err(|e| format!("无法读取目录 {}: {}", dir_path, e))?;

    while let Some(entry) = entries
        .next_entry()
        .await
        .map_err(|e| format!("读取目录项失败: {}", e))?
    {
        let entry_path = entry.path();
        let metadata = match entry.metadata().await {
            Ok(m) => m,
            Err(_) => continue,
        };

        let name = entry.file_name().to_string_lossy().to_string();
        let is_directory = metadata.is_dir();
        let is_hidden = is_hidden_file(&entry_path);
        let size = if is_directory {
            None
        } else {
            Some(metadata.len())
        };
        let modified = metadata.modified().ok().and_then(|t| {
            t.duration_since(SystemTime::UNIX_EPOCH)
                .ok()
                .map(|d| d.as_millis() as i64)
        });

        nodes.push(FileTreeNode {
            path: entry_path.to_string_lossy().to_string(),
            name,
            is_directory,
            is_hidden,
            size,
            modified,
            children: None,
        });
    }

    nodes.sort_by(|a, b| match (a.is_directory, b.is_directory) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });

    {
        let mut cache = DIR_CACHE.lock().unwrap();
        cache.insert(
            dir_path.clone(),
            CacheEntry {
                nodes: nodes.clone(),
                timestamp: SystemTime::now(),
            },
        );
    }

    Ok(nodes)
}

pub fn clear_dir_cache(dir_path: Option<String>) {
    let mut cache = DIR_CACHE.lock().unwrap();
    if let Some(path) = dir_path {
        cache.remove(&path);
    } else {
        cache.clear();
    }
}

pub fn watch_directory(app_handle: AppHandle, dir_path: String) -> Result<(), String> {
    let path = PathBuf::from(&dir_path);

    if !path.exists() || !path.is_dir() {
        return Err(format!("无效的目录路径: {}", dir_path));
    }

    let dir_path_clone = dir_path.clone();
    let app_handle_clone = app_handle.clone();

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            if let Ok(_event) = res {
                let path = dir_path_clone.clone();
                clear_dir_cache(Some(path.clone()));

                let _ = app_handle_clone.emit(
                    "file-tree-state-change",
                    serde_json::json!({
                        "type": "file_changed",
                        "path": path,
                        "timestamp": Utc::now().timestamp_millis(),
                    }),
                );
            }
        },
        Config::default().with_poll_interval(Duration::from_millis(DEBOUNCE_MILLIS)),
    )
    .map_err(|e| format!("创建文件监听器失败: {}", e))?;

    watcher
        .watch(&path, RecursiveMode::NonRecursive)
        .map_err(|e| format!("监听目录失败: {}", e))?;

    let mut watchers = WATCHERS.lock().unwrap();
    watchers.insert(dir_path, watcher);

    Ok(())
}

pub fn stop_watching(dir_path: &str) {
    let mut watchers = WATCHERS.lock().unwrap();
    watchers.remove(dir_path);
}

pub async fn create_file(path: String, is_directory: bool) -> Result<(), String> {
    let file_path = PathBuf::from(&path);

    if file_path.exists() {
        return Err(format!("路径已存在: {}", path));
    }

    if is_directory {
        fs::create_dir_all(&file_path).await
    } else {
        if let Some(parent) = file_path.parent() {
            fs::create_dir_all(parent).await.ok();
        }
        fs::File::create(&file_path).await.map(|_| ())
    }
    .map_err(|e| format!("创建失败: {}", e))?;

    if let Some(parent) = file_path.parent() {
        clear_dir_cache(Some(parent.to_string_lossy().to_string()));
    }

    Ok(())
}

pub async fn rename_path(old_path: String, new_path: String) -> Result<(), String> {
    let old = PathBuf::from(&old_path);
    let new = PathBuf::from(&new_path);

    if !old.exists() {
        return Err(format!("源路径不存在: {}", old_path));
    }

    if new.exists() {
        return Err(format!("目标路径已存在: {}", new_path));
    }

    fs::rename(&old, &new)
        .await
        .map_err(|e| format!("重命名失败: {}", e))?;

    if let Some(parent) = old.parent() {
        clear_dir_cache(Some(parent.to_string_lossy().to_string()));
    }

    Ok(())
}

pub async fn delete_path(path: String) -> Result<(), String> {
    let file_path = PathBuf::from(&path);

    if !file_path.exists() {
        return Err(format!("路径不存在: {}", path));
    }

    if file_path.is_dir() {
        fs::remove_dir_all(&file_path).await
    } else {
        fs::remove_file(&file_path).await
    }
    .map_err(|e| format!("删除失败: {}", e))?;

    if let Some(parent) = file_path.parent() {
        clear_dir_cache(Some(parent.to_string_lossy().to_string()));
    }

    Ok(())
}

pub async fn search_files(
    root_path: String,
    pattern: String,
    case_sensitive: bool,
) -> Result<Vec<String>, String> {
    let root = PathBuf::from(&root_path);

    if !root.exists() || !root.is_dir() {
        return Err(format!("无效的根目录: {}", root_path));
    }

    let pattern_lower = pattern.to_lowercase();
    let mut results = Vec::new();

    let walker = WalkBuilder::new(&root)
        .hidden(false)
        .git_ignore(true)
        .build();

    for entry in walker.filter_map(|e| e.ok()) {
        if let Some(file_name) = entry.file_name().to_str() {
            let matches = if case_sensitive {
                file_name.contains(&pattern)
            } else {
                file_name.to_lowercase().contains(&pattern_lower)
            };

            if matches {
                results.push(entry.path().to_string_lossy().to_string());
            }
        }
    }

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_cache_expiration() {
        clear_dir_cache(None);

        let test_dir = std::env::temp_dir().join("test_cache");
        std::fs::create_dir_all(&test_dir).unwrap();

        let path_str = test_dir.to_string_lossy().to_string();
        let _ = read_dir_on_demand(path_str.clone()).await;

        {
            let cache = DIR_CACHE.lock().unwrap();
            assert!(cache.contains_key(&path_str));
        }

        clear_dir_cache(Some(path_str.clone()));

        {
            let cache = DIR_CACHE.lock().unwrap();
            assert!(!cache.contains_key(&path_str));
        }

        std::fs::remove_dir_all(test_dir).ok();
    }
}
