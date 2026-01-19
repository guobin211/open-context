use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::RwLock;

/// Node.js server configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeServerConfig {
    pub port: u16,
    pub auto_start: bool,
}

impl Default for NodeServerConfig {
    fn default() -> Self {
        Self {
            port: 4500,
            auto_start: true,
        }
    }
}

/// Qdrant vector database configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QdrantConfig {
    pub url: String,
    pub embedding_dim: usize,
}

impl Default for QdrantConfig {
    fn default() -> Self {
        Self {
            url: "http://localhost:6333".to_string(),
            embedding_dim: 1024,
        }
    }
}

/// Application configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub version: String,
    pub node_server: NodeServerConfig,
    pub qdrant: QdrantConfig,
    pub log_level: String,
    pub workspaces_dir: PathBuf,
}

impl Default for AppConfig {
    fn default() -> Self {
        let config_dir = Self::default_config_dir();
        Self {
            version: env!("CARGO_PKG_VERSION").to_string(),
            node_server: NodeServerConfig::default(),
            qdrant: QdrantConfig::default(),
            log_level: "info".to_string(),
            workspaces_dir: config_dir.join("workspaces"),
        }
    }
}

impl AppConfig {
    /// Get the default configuration directory
    /// Returns ~/.config/open-context on all platforms
    pub fn default_config_dir() -> PathBuf {
        dirs::home_dir()
            .expect("Failed to get home directory")
            .join(".config")
            .join("open-context")
    }

    /// Get the current configuration directory (from environment variable or default)
    pub fn config_dir() -> PathBuf {
        std::env::var("OPEN_CONTEXT_CONFIG_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| Self::default_config_dir())
    }

    /// Get the path to the configuration file
    pub fn config_file_path() -> PathBuf {
        Self::config_dir().join("config.json")
    }

    /// Load configuration from file
    /// If the file doesn't exist, create it with default values
    pub fn load() -> Result<Self, Box<dyn std::error::Error>> {
        let config_path = Self::config_file_path();

        if !config_path.exists() {
            // Create default configuration
            let default_config = Self::default();
            default_config.save()?;
            return Ok(default_config);
        }

        let content = fs::read_to_string(&config_path)?;
        let config: AppConfig = serde_json::from_str(&content)?;
        Ok(config)
    }

    /// Save configuration to file
    pub fn save(&self) -> Result<(), Box<dyn std::error::Error>> {
        let config_path = Self::config_file_path();

        // Ensure the parent directory exists
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent)?;
        }

        let json = serde_json::to_string_pretty(self)?;
        fs::write(config_path, json)?;
        Ok(())
    }

    /// Update node server port
    pub fn set_node_server_port(&mut self, port: u16) -> Result<(), Box<dyn std::error::Error>> {
        self.node_server.port = port;
        self.save()
    }

    /// Update node server auto start setting
    pub fn set_node_server_auto_start(
        &mut self,
        auto_start: bool,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.node_server.auto_start = auto_start;
        self.save()
    }

    /// Update Qdrant URL
    pub fn set_qdrant_url(&mut self, url: String) -> Result<(), Box<dyn std::error::Error>> {
        self.qdrant.url = url;
        self.save()
    }

    /// Update Qdrant embedding dimension
    pub fn set_qdrant_embedding_dim(
        &mut self,
        dim: usize,
    ) -> Result<(), Box<dyn std::error::Error>> {
        self.qdrant.embedding_dim = dim;
        self.save()
    }

    /// Update log level
    pub fn set_log_level(&mut self, level: String) -> Result<(), Box<dyn std::error::Error>> {
        self.log_level = level;
        self.save()
    }

    /// Update workspaces directory
    pub fn set_workspaces_dir(&mut self, dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        self.workspaces_dir = dir;
        self.save()
    }

    /// Change the configuration directory and reload configuration
    /// This also updates the OPEN_CONTEXT_CONFIG_DIR environment variable
    pub fn change_config_dir(new_dir: PathBuf) -> Result<Self, Box<dyn std::error::Error>> {
        // Validate the new directory
        if !new_dir.exists() {
            fs::create_dir_all(&new_dir)?;
        }

        // Set the environment variable
        // SAFETY: This is safe because we're setting a configuration path that won't affect
        // other threads' file operations. The path is validated before setting.
        unsafe {
            std::env::set_var(
                "OPEN_CONTEXT_CONFIG_DIR",
                new_dir.to_str().ok_or("Invalid path")?,
            );
        }

        // Load or create configuration in the new directory
        Self::load()
    }
}

/// Global configuration manager with thread-safe access
pub struct ConfigManager {
    config: RwLock<AppConfig>,
}

impl ConfigManager {
    /// Create a new configuration manager
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = AppConfig::load()?;
        Ok(Self {
            config: RwLock::new(config),
        })
    }

    /// Get a read-only copy of the configuration
    pub fn get(&self) -> AppConfig {
        self.config.read().unwrap().clone()
    }

    /// Update the configuration
    pub fn update<F>(&self, f: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: FnOnce(&mut AppConfig) -> Result<(), Box<dyn std::error::Error>>,
    {
        let mut config = self.config.write().unwrap();
        f(&mut config)?;
        config.save()?;
        Ok(())
    }

    /// Reload configuration from file
    pub fn reload(&self) -> Result<(), Box<dyn std::error::Error>> {
        let new_config = AppConfig::load()?;
        let mut config = self.config.write().unwrap();
        *config = new_config;
        Ok(())
    }

    /// Change the configuration directory
    pub fn change_config_dir(&self, new_dir: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        let new_config = AppConfig::change_config_dir(new_dir)?;
        let mut config = self.config.write().unwrap();
        *config = new_config;
        Ok(())
    }
}

impl Default for ConfigManager {
    fn default() -> Self {
        Self::new().expect("Failed to initialize ConfigManager")
    }
}

/// Initialize application directories
/// Creates the configuration directory structure if it doesn't exist
pub fn init_app_dirs() -> Result<(), Box<dyn std::error::Error>> {
    let config_dir = AppConfig::config_dir();

    // Create main configuration directory
    fs::create_dir_all(&config_dir)?;

    // Create subdirectories
    fs::create_dir_all(config_dir.join("leveldb/main"))?;
    fs::create_dir_all(config_dir.join("leveldb/edges"))?;
    fs::create_dir_all(config_dir.join("leveldb/reverse-edges"))?;
    fs::create_dir_all(config_dir.join("logs"))?;

    // Create workspaces directory (from config or default)
    let config = AppConfig::load()?;
    fs::create_dir_all(&config.workspaces_dir)?;

    // Create default configuration file if it doesn't exist
    let config_file = config_dir.join("config.json");
    if !config_file.exists() {
        let default_config = AppConfig::default();
        default_config.save()?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn test_default_config() {
        let config = AppConfig::default();
        assert_eq!(config.node_server.port, 4500);
        assert!(config.node_server.auto_start);
        assert_eq!(config.qdrant.url, "http://localhost:6333");
        assert_eq!(config.qdrant.embedding_dim, 1024);
        assert_eq!(config.log_level, "info");
    }

    #[test]
    fn test_config_serialization() {
        let config = AppConfig::default();
        let json = serde_json::to_string(&config).unwrap();
        let deserialized: AppConfig = serde_json::from_str(&json).unwrap();
        assert_eq!(config.node_server.port, deserialized.node_server.port);
        assert_eq!(config.log_level, deserialized.log_level);
    }

    #[test]
    fn test_config_manager() {
        let manager = ConfigManager::default();
        let config = manager.get();
        assert_eq!(config.node_server.port, 4500);

        // Update configuration
        manager
            .update(|cfg| {
                cfg.node_server.port = 5000;
                Ok(())
            })
            .unwrap();

        let updated_config = manager.get();
        assert_eq!(updated_config.node_server.port, 5000);
    }

    #[test]
    fn test_custom_config_dir() {
        let temp_dir = env::temp_dir().join("open-context-test");
        // SAFETY: Setting environment variable in test is safe as tests are isolated
        unsafe {
            env::set_var("OPEN_CONTEXT_CONFIG_DIR", &temp_dir);
        }

        let config_dir = AppConfig::config_dir();
        assert_eq!(config_dir, temp_dir);

        // SAFETY: Removing environment variable in test cleanup
        unsafe {
            env::remove_var("OPEN_CONTEXT_CONFIG_DIR");
        }
    }
}
