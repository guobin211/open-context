use std::sync::{Arc, Mutex};

use super::DatabaseManager;
use super::app_config::AppConfig;

#[derive(Clone)]
pub struct AppState {
    db: Arc<DatabaseManager>,
    config: Arc<Mutex<AppConfig>>,
}

impl AppState {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let config = AppConfig::load()?;
        let workspace_db_path = AppConfig::config_dir().join("app.db");
        let workspace_db = DatabaseManager::new(workspace_db_path)?;

        Ok(Self {
            db: Arc::new(workspace_db),
            config: Arc::new(Mutex::new(config)),
        })
    }

    pub fn db(&self) -> Arc<DatabaseManager> {
        Arc::clone(&self.db)
    }

    pub fn config(&self) -> AppConfig {
        self.config.lock().unwrap().clone()
    }

    pub fn update_config<F>(&self, f: F) -> Result<(), Box<dyn std::error::Error>>
    where
        F: FnOnce(&mut AppConfig) -> Result<(), Box<dyn std::error::Error>>,
    {
        if let Ok(mut config) = self.config.lock() {
            f(&mut config)?;
            config.save()?;
        } else {
            return Err("Failed to acquire config lock".into());
        }
        Ok(())
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new().expect("Failed to initialize AppState")
    }
}
