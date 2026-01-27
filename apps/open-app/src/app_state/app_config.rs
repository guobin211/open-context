use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub sqlite: SqliteConfig,
    pub surrealdb: SurrealDbConfig,
    pub qdrant: QdrantConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SqliteConfig {
    pub app_db: String,
    pub symbol_db: String,
    pub edge_db: String,
    pub reverse_edge_db: String,
    pub wal_mode: bool,
    pub busy_timeout: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SurrealDbConfig {
    pub url: String,
    pub namespace: String,
    pub database: String,
    pub username: String,
    pub password: String,
    pub embedded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QdrantConfig {
    pub url: String,
    pub api_key: Option<String>,
    pub embedding_dim: u32,
    pub collection_name: String,
    pub distance: String,
    pub embedded: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeServerConfig {
    pub port: u16,
    pub host: String,
    pub auto_start: bool,
}

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub log_level: String,
    pub app_data_dir: String,
    pub bin_dir: String,
    pub cache_dir: String,
    pub config_dir: String,
    pub database_dir: String,
    pub notebook_dir: String,
    pub session_dir: String,
    pub workspace_dir: String,
    pub files_dir: String,
    pub logs_dir: String,
    pub plugins_dir: String,
    pub commands_dir: String,
    pub skills_dir: String,
    pub todos_dir: String,
    pub projects_dir: String,
    pub rules_dir: String,
    pub hooks_dir: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub database: Option<DatabaseConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub node_server: Option<NodeServerConfig>,
}

impl Default for AppConfig {
    fn default() -> Self {
        let app_data_dir = AppConfig::base_dir().to_string_lossy().to_string();
        Self {
            version: env!("CARGO_PKG_VERSION").to_string(),
            log_level: "info".to_string(),
            app_data_dir: app_data_dir.clone(),
            bin_dir: format!("{}/bin", app_data_dir),
            commands_dir: format!("{}/commands", app_data_dir),
            cache_dir: format!("{}/cache", app_data_dir),
            config_dir: format!("{}/config", app_data_dir),
            database_dir: format!("{}/database", app_data_dir),
            notebook_dir: format!("{}/notebook", app_data_dir),
            session_dir: format!("{}/session", app_data_dir),
            workspace_dir: format!("{}/workspace", app_data_dir),
            files_dir: format!("{}/files", app_data_dir),
            logs_dir: format!("{}/logs", app_data_dir),
            plugins_dir: format!("{}/plugins", app_data_dir),
            skills_dir: format!("{}/skills", app_data_dir),
            todos_dir: format!("{}/todos", app_data_dir),
            projects_dir: format!("{}/projects", app_data_dir),
            rules_dir: format!("{}/rules", app_data_dir),
            hooks_dir: format!("{}/hooks", app_data_dir),
            database: None,
            node_server: None,
        }
    }
}

impl AppConfig {
    /// Get base directory (~/.open-context)
    fn base_dir() -> PathBuf {
        if let Ok(custom_home) = std::env::var("OPEN_CONTEXT_HOME") {
            return PathBuf::from(custom_home);
        }
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".open-context")
    }

    /// Get the configuration directory (~/.open-context/config)
    pub fn config_dir() -> PathBuf {
        Self::base_dir().join("config")
    }

    /// Get the configuration file path
    fn config_path() -> PathBuf {
        Self::config_dir().join("config.json")
    }

    /// Load configuration from file
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = Self::config_path();
        if config_path.exists() {
            let config_data = fs::read_to_string(&config_path)?;
            let config: AppConfig = serde_json::from_str(&config_data)?;
            Ok(config)
        } else {
            let config = AppConfig::default();
            config.save()?;
            Ok(config)
        }
    }

    /// Save configuration to file
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = Self::config_dir();
        fs::create_dir_all(&config_dir)?;
        let config_path = Self::config_path();
        let config_data = serde_json::to_string_pretty(self)?;
        fs::write(config_path, config_data)?;
        Ok(())
    }
}

/// Thread-safe configuration manager
pub struct ConfigManager {
    config: RwLock<AppConfig>,
}

impl ConfigManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        // 确保配置目录存在
        fs::create_dir_all(AppConfig::config_dir())?;
        let config = AppConfig::load()?;
        Ok(Self {
            config: RwLock::new(config),
        })
    }

    pub fn get(&self) -> AppConfig {
        self.config.read().unwrap().clone()
    }

    pub fn update<F>(&self, f: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: FnOnce(&mut AppConfig) -> Result<(), Box<dyn std::error::Error>>,
    {
        if let Ok(mut config) = self.config.write() {
            f(&mut config)?;
            config.save()
        } else {
            Ok(())
        }
    }

    pub fn reload(&self) -> Result<(), Box<dyn std::error::Error>> {
        let new_config = AppConfig::load()?;
        if let Ok(mut config) = self.config.write() {
            *config = new_config;
        }
        Ok(())
    }
}

/// Initialize application directories
pub fn init_app_dirs() -> Result<(), Box<dyn std::error::Error>> {
    let base = AppConfig::base_dir();
    let dirs = [
        "bin",
        "cache",
        "config",
        "database",
        "notebook",
        "session",
        "workspace",
        "files",
        "logs",
        "plugins",
        "commands",
        "skills",
        "todos",
        "projects",
        "rules",
        "hooks",
    ];

    for dir in dirs {
        fs::create_dir_all(base.join(dir))?;
    }

    Ok(())
}
