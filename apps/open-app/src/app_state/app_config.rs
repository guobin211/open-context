use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
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

impl Default for SqliteConfig {
    fn default() -> Self {
        Self {
            app_db: "app.db".to_string(),
            symbol_db: "symbol.db".to_string(),
            edge_db: "edge.db".to_string(),
            reverse_edge_db: "reverse_edge.db".to_string(),
            wal_mode: true,
            busy_timeout: 5000,
        }
    }
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

impl Default for SurrealDbConfig {
    fn default() -> Self {
        Self {
            url: "http://localhost:8000".to_string(),
            namespace: "open_context".to_string(),
            database: "app_db".to_string(),
            username: "root".to_string(),
            password: "root".to_string(),
            embedded: false,
        }
    }
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

impl Default for QdrantConfig {
    fn default() -> Self {
        Self {
            url: "http://localhost:6333".to_string(),
            api_key: None,
            embedding_dim: 1536,
            collection_name: "open_context".to_string(),
            distance: "Cosine".to_string(),
            embedded: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeServerConfig {
    pub port: u16,
    pub host: String,
    pub auto_start: bool,
}

impl Default for NodeServerConfig {
    fn default() -> Self {
        Self {
            port: 3000,
            host: "0.0.0.0".to_string(),
            auto_start: true,
        }
    }
}
/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub log_level: String,
    pub app_data_dir: String,
    pub bin_dir: String,
    pub cache_dir: String,
    pub database_dir: String,
    pub notebook_dir: String,
    pub session_dir: String,
    pub workspace_dir: String,
    pub files_dir: String,
    pub logs_dir: String,
    pub plugins_dir: String,
    pub commands_dir: String,
    pub skills_dir: String,
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
            database_dir: format!("{}/database", app_data_dir),
            notebook_dir: format!("{}/notebook", app_data_dir),
            session_dir: format!("{}/session", app_data_dir),
            workspace_dir: format!("{}/workspace", app_data_dir),
            files_dir: format!("{}/files", app_data_dir),
            logs_dir: format!("{}/logs", app_data_dir),
            plugins_dir: format!("{}/plugins", app_data_dir),
            skills_dir: format!("{}/skills", app_data_dir),
            rules_dir: format!("{}/rules", app_data_dir),
            hooks_dir: format!("{}/hooks", app_data_dir),
            database: Some(DatabaseConfig::default()),
            node_server: Some(NodeServerConfig::default()),
        }
    }
}

impl AppConfig {
    /// Get base directory
    /// - 开发环境：workspace/.open-context 或 git-root/.open-context
    /// - 生产环境：~/.open-context
    /// - 自定义：OPEN_CONTEXT_HOME 环境变量
    fn base_dir() -> PathBuf {
        // 1. 环境变量优先级最高
        if let Ok(custom_home) = std::env::var("OPEN_CONTEXT_HOME") {
            return PathBuf::from(custom_home);
        }

        // 2. 检查是否为开发环境
        if cfg!(debug_assertions) {
            // 开发模式：查找 Cargo workspace 根目录或 Git 仓库根目录
            if let Some(workspace_root) = Self::find_workspace_root() {
                return workspace_root.join(".open-context");
            }
        }

        // 3. 生产环境：使用用户主目录
        dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join(".open-context")
    }

    /// 查找 Cargo workspace 根目录或 Git 仓库根目录
    fn find_workspace_root() -> Option<PathBuf> {
        let current_dir = std::env::current_dir().ok()?;

        // 向上查找包含 Cargo.toml 的目录
        let mut dir = current_dir.as_path();
        while let Some(parent) = dir.parent() {
            let cargo_toml = dir.join("Cargo.toml");
            if cargo_toml.exists() {
                // 检查是否为 workspace
                if let Ok(content) = fs::read_to_string(&cargo_toml)
                    && content.contains("[workspace]")
                {
                    return Some(dir.to_path_buf());
                }
            }

            // 检查是否为 Git 仓库根目录
            let git_dir = dir.join(".git");
            if git_dir.exists() {
                return Some(dir.to_path_buf());
            }

            dir = parent;
        }

        None
    }

    /// Get the configuration file path
    fn config_path() -> PathBuf {
        Self::base_dir().join("config.json")
    }

    fn database_dir() -> PathBuf {
        Self::base_dir().join("database")
    }

    pub fn sqlite_app_db_path() -> PathBuf {
        Self::database_dir().join("sqlite").join("app.db")
    }

    /// Load configuration from file
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let default_config = AppConfig::default();
        let config_path = Self::config_path();

        let config = if config_path.exists() {
            if let Ok(config_data) = fs::read_to_string(&config_path) {
                if let Ok(loaded_config) = serde_json::from_str::<AppConfig>(&config_data) {
                    // 合并加载的配置和默认配置
                    Self::merge_config(loaded_config, default_config)
                } else {
                    default_config
                }
            } else {
                default_config
            }
        } else {
            default_config
        };

        // 确保配置文件存在
        config.save()?;
        Ok(config)
    }

    /// 合并用户配置和默认配置
    fn merge_config(mut loaded: AppConfig, default: AppConfig) -> AppConfig {
        // 确保目录路径存在（使用默认值填充空路径）
        if loaded.app_data_dir.is_empty() {
            loaded.app_data_dir = default.app_data_dir;
        }
        if loaded.bin_dir.is_empty() {
            loaded.bin_dir = default.bin_dir;
        }
        if loaded.cache_dir.is_empty() {
            loaded.cache_dir = default.cache_dir;
        }
        if loaded.database_dir.is_empty() {
            loaded.database_dir = default.database_dir;
        }
        if loaded.notebook_dir.is_empty() {
            loaded.notebook_dir = default.notebook_dir;
        }
        if loaded.session_dir.is_empty() {
            loaded.session_dir = default.session_dir;
        }
        if loaded.workspace_dir.is_empty() {
            loaded.workspace_dir = default.workspace_dir;
        }
        if loaded.files_dir.is_empty() {
            loaded.files_dir = default.files_dir;
        }
        if loaded.logs_dir.is_empty() {
            loaded.logs_dir = default.logs_dir;
        }
        if loaded.plugins_dir.is_empty() {
            loaded.plugins_dir = default.plugins_dir;
        }
        if loaded.commands_dir.is_empty() {
            loaded.commands_dir = default.commands_dir;
        }
        if loaded.skills_dir.is_empty() {
            loaded.skills_dir = default.skills_dir;
        }
        if loaded.rules_dir.is_empty() {
            loaded.rules_dir = default.rules_dir;
        }
        if loaded.hooks_dir.is_empty() {
            loaded.hooks_dir = default.hooks_dir;
        }

        // 确保可选配置存在
        if loaded.database.is_none() {
            loaded.database = default.database;
        }
        if loaded.node_server.is_none() {
            loaded.node_server = default.node_server;
        }

        loaded
    }

    /// Save configuration to file
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_dir = Self::base_dir();
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
        fs::create_dir_all(AppConfig::base_dir())?;
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
        "database",
        "notebook",
        "session",
        "workspace",
        "files",
        "logs",
        "plugins",
        "commands",
        "skills",
        "rules",
        "hooks",
    ];

    for dir in dirs {
        fs::create_dir_all(base.join(dir))?;
    }

    Ok(())
}
